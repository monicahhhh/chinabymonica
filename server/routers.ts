import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, adminProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  listArticles,
  getArticleBySlug,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  upsertUser,
  upsertEmailLead,
  getDb,
} from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { normalizeArticleHtml } from "./lib/normalizeArticleHtml";
import { invokeLLM } from "./_core/llm";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

const articleInput = z.object({
  slug: z.string().min(1).max(256),
  category: z.enum(["global-growth", "geopolitical-trends", "unicorn-analysis"]),
  titleZH: z.string().min(1),
  titleEN: z.string().min(1),
  subtitleZH: z.string().nullable().optional(),
  subtitleEN: z.string().nullable().optional(),
  contentZH: z.string().min(1),
  contentEN: z.string().min(1),
  coverImage: z.string().nullable().optional(),
  author: z.string().optional(),
  published: z.boolean().optional(),
  featured: z.boolean().optional(),
  sortOrder: z.number().optional(),
  publishedAt: z.date().nullable().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    login: publicProcedure
      .input(z.object({ email: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        if (!ENV.cookieSecret) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Server misconfiguration: set JWT_SECRET in .env (see .env.example)",
          });
        }
        if (!ENV.adminEmail || !ENV.adminPassword) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Admin credentials not configured: set ADMIN_EMAIL and ADMIN_PASSWORD in .env",
          });
        }
        if (input.email !== ENV.adminEmail || input.password !== ENV.adminPassword) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Database not available: set DATABASE_URL in .env, start MySQL, and run pnpm db:migrate",
          });
        }

        try {
          await upsertUser({
            openId: ENV.adminEmail,
            name: "Monica Wang",
            email: ENV.adminEmail,
            loginMethod: "password",
            lastSignedIn: new Date(),
            role: "admin",
          });
        } catch (err) {
          console.error("[auth.login] upsertUser failed:", err);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Could not save admin user to the database. Check DATABASE_URL and migrations.",
          });
        }

        let sessionToken: string;
        try {
          sessionToken = await sdk.createSessionToken(ENV.adminEmail, {
            name: "Monica Wang",
            expiresInMs: ONE_YEAR_MS,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Session creation failed";
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
        }

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        return { success: true } as const;
      }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    captureEmail: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          subscribeNewsletter: z.boolean().default(false),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        if (!ENV.cookieSecret) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Server misconfiguration: set JWT_SECRET in .env (see .env.example)",
          });
        }

        const normalizedEmail = input.email.trim().toLowerCase();
        const userName = normalizedEmail.split("@")[0];

        const database = await getDb();
        if (!database) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message:
              "Database not available: set DATABASE_URL in .env, start MySQL, and run pnpm db:migrate",
          });
        }

        try {
          await upsertUser({
            openId: normalizedEmail,
            email: normalizedEmail,
            name: userName,
            loginMethod: "email-capture",
            lastSignedIn: new Date(),
            role: "user",
          });

          await upsertEmailLead({
            email: normalizedEmail,
            subscribeNewsletter: input.subscribeNewsletter,
          });
        } catch (err) {
          console.error("[auth.captureEmail] persist failed:", err);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not save email information",
          });
        }

        let sessionToken: string;
        try {
          sessionToken = await sdk.createSessionToken(normalizedEmail, {
            name: userName,
            expiresInMs: ONE_YEAR_MS,
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Session creation failed";
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: msg });
        }

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true } as const;
      }),
  }),

  /** Admin: upload image to S3 */
  upload: router({
    image: adminProcedure
      .input(z.object({
        base64: z.string(),
        mimeType: z.string(),
        fileName: z.string(),
      }))
      .mutation(async ({ input }) => {
        const ext = input.fileName.split(".").pop() || "png";
        const key = `articles/images/${nanoid(12)}.${ext}`;
        const buffer = Buffer.from(input.base64, "base64");
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  /** Admin: translate article content between Chinese and English */
  translate: router({
    article: adminProcedure
      .input(z.object({
        content: z.string().min(1),
        direction: z.enum(["zh-to-en", "en-to-zh"]),
      }))
      .mutation(async ({ input }) => {
        const { content, direction } = input;

        const systemPrompt = direction === "zh-to-en"
          ? `You are a professional translator specializing in technology, business, and entrepreneurship content. Translate the following Chinese HTML article content into fluent, natural English. 

IMPORTANT RULES:
- Preserve ALL HTML tags and structure exactly (headings, paragraphs, lists, blockquotes, links, images, etc.)
- Do NOT translate HTML attributes (href, src, alt, etc.) unless the alt text is Chinese
- Maintain the professional, editorial tone suitable for a business/tech publication
- Keep proper nouns, brand names, and technical terms in their commonly used English forms
- Do NOT add any explanation or commentary — output ONLY the translated HTML`
          : `You are a professional translator specializing in technology, business, and entrepreneurship content. Translate the following English HTML article content into fluent, natural Chinese (Simplified). 

IMPORTANT RULES:
- Preserve ALL HTML tags and structure exactly (headings, paragraphs, lists, blockquotes, links, images, etc.)
- Do NOT translate HTML attributes (href, src, alt, etc.) unless the alt text is English
- Maintain a professional, editorial tone suitable for a Chinese business/tech publication
- Keep proper nouns and brand names in their original form or use commonly accepted Chinese translations
- Do NOT add any explanation or commentary — output ONLY the translated HTML`;

        const result = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content },
          ],
          maxTokens: 16384,
        });

        const translated = typeof result.choices[0]?.message?.content === "string"
          ? result.choices[0].message.content
          : "";

        // Clean up: remove markdown code fences if LLM wrapped the output
        const cleaned = translated
          .replace(/^```html\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "")
          .trim();

        return { translated: cleaned };
      }),
  }),

  /** Admin: generate cover image via AI and upload to S3 */
  generateImage: router({
    cover: adminProcedure
      .input(z.object({
        titleZH: z.string(),
        titleEN: z.string(),
      }))
      .mutation(async ({ input }) => {
        const title = input.titleEN || input.titleZH;
        const prompt = `A modern, professional editorial cover image for an article titled "${title}". Clean minimalist design, bold typography feel, suitable for a business and technology publication focused on China and global markets. High quality, 16:9 aspect ratio, no text overlays.`;

        const response = await fetch("https://ai-gateway.happycapy.ai/api/v1/images/generations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${ENV.aiGatewayApiKey}`,
          },
          body: JSON.stringify({
            model: "black-forest-labs/flux-1.1-pro",
            prompt,
            n: 1,
            width: 1792,
            height: 1024,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Image generation failed: ${response.status} – ${errText}`);
        }

        const result = await response.json() as { data?: Array<{ url?: string }> };
        const imageUrl = result.data?.[0]?.url;
        if (!imageUrl) throw new Error("No image URL returned from generation API");

        // Download and re-host to S3
        const imgRes = await fetch(imageUrl);
        if (!imgRes.ok) throw new Error(`Failed to download generated image: ${imgRes.status}`);
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const key = `articles/covers/${nanoid(12)}.jpg`;
        const { url } = await storagePut(key, buffer, "image/jpeg");
        return { url };
      }),
  }),

  /** Admin: re-host external image to S3 */
  rehostImage: router({
    fromUrl: adminProcedure
      .input(z.object({
        imageUrl: z.string().url(),
      }))
      .mutation(async ({ input }) => {
        const response = await fetch(input.imageUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; ChinabyMonica/1.0)",
            "Referer": "https://mp.weixin.qq.com/",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get("content-type") || "image/jpeg";
        const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
        const key = `articles/images/${nanoid(12)}.${ext}`;
        const { url } = await storagePut(key, buffer, contentType);
        return { url };
      }),
  }),

  article: router({
    /** Public: list published articles */
    list: publicProcedure.query(async () => {
      return listArticles(true);
    }),

    /** Public: get single article by slug */
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        return getArticleBySlug(input.slug);
      }),

    /** Admin: list all articles (including unpublished) */
    listAll: adminProcedure.query(async () => {
      return listArticles(false);
    }),

    /** Admin: get article by id */
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getArticleById(input.id);
      }),

    /** Admin: create article */
    create: adminProcedure
      .input(articleInput)
      .mutation(async ({ input }) => {
        const id = await createArticle({
          ...input,
          contentZH: normalizeArticleHtml(input.contentZH),
          contentEN: normalizeArticleHtml(input.contentEN),
          subtitleZH: input.subtitleZH ?? null,
          subtitleEN: input.subtitleEN ?? null,
          coverImage: input.coverImage ?? null,
          author: input.author ?? "Monica Wang",
          published: input.published ?? false,
          featured: input.featured ?? false,
          sortOrder: input.sortOrder ?? 0,
          publishedAt: input.publishedAt ?? null,
        });
        return { id };
      }),

    /** Admin: update article */
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        data: articleInput.partial(),
      }))
      .mutation(async ({ input }) => {
        const data = { ...input.data };
        if (data.contentZH) data.contentZH = normalizeArticleHtml(data.contentZH);
        if (data.contentEN) data.contentEN = normalizeArticleHtml(data.contentEN);
        await updateArticle(input.id, data);
        return { success: true };
      }),

    /** Admin: delete article */
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteArticle(input.id);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
