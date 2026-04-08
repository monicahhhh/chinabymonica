import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock storagePut for upload tests
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/articles/images/test123.png", key: "articles/images/test123.png" }),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("article router", () => {
  describe("public procedures", () => {
    it("article.list is accessible without auth", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Should not throw - public procedure
      const result = await caller.article.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("article.getBySlug is accessible without auth", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Should not throw even if article doesn't exist
      const result = await caller.article.getBySlug({ slug: "non-existent-slug" });
      expect(result).toBeUndefined();
    });
  });

  describe("admin procedures - access control", () => {
    it("article.listAll rejects non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.article.listAll()).rejects.toThrow();
    });

    it("article.create rejects non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.article.create({
          slug: "test-article",
          category: "global-growth",
          titleZH: "测试文章",
          titleEN: "Test Article",
          contentZH: "测试内容",
          contentEN: "Test content",
        })
      ).rejects.toThrow();
    });

    it("article.delete rejects non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.article.delete({ id: 999 })).rejects.toThrow();
    });

    it("article.update rejects non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.article.update({ id: 999, data: { titleZH: "新标题" } })
      ).rejects.toThrow();
    });

    it("article.listAll rejects unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.article.listAll()).rejects.toThrow();
    });
  });

  describe("admin procedures - CRUD operations", () => {
    it("admin can create and retrieve an article", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.article.create({
        slug: "test-crud-article-" + Date.now(),
        category: "unicorn-analysis",
        titleZH: "测试CRUD文章",
        titleEN: "Test CRUD Article",
        contentZH: "<p>测试内容</p>",
        contentEN: "<p>Test content</p>",
        published: true,
        featured: false,
        author: "Test Author",
      });

      expect(createResult).toHaveProperty("id");
      expect(typeof createResult.id).toBe("number");

      // Retrieve by id
      const article = await caller.article.getById({ id: createResult.id });
      expect(article).toBeDefined();
      expect(article!.titleZH).toBe("测试CRUD文章");
      expect(article!.titleEN).toBe("Test CRUD Article");
      expect(article!.category).toBe("unicorn-analysis");
      expect(article!.author).toBe("Test Author");

      // Clean up
      await caller.article.delete({ id: createResult.id });
    });

    it("admin can update an article", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.article.create({
        slug: "test-update-article-" + Date.now(),
        category: "global-growth",
        titleZH: "原始标题",
        titleEN: "Original Title",
        contentZH: "<p>原始内容</p>",
        contentEN: "<p>Original content</p>",
      });

      const updateResult = await caller.article.update({
        id: createResult.id,
        data: {
          titleZH: "更新后的标题",
          titleEN: "Updated Title",
          category: "geopolitical-trends",
        },
      });

      expect(updateResult).toEqual({ success: true });

      const updated = await caller.article.getById({ id: createResult.id });
      expect(updated!.titleZH).toBe("更新后的标题");
      expect(updated!.titleEN).toBe("Updated Title");
      expect(updated!.category).toBe("geopolitical-trends");

      // Clean up
      await caller.article.delete({ id: createResult.id });
    });

    it("admin can delete an article", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const createResult = await caller.article.create({
        slug: "test-delete-article-" + Date.now(),
        category: "global-growth",
        titleZH: "待删除文章",
        titleEN: "Article to Delete",
        contentZH: "<p>内容</p>",
        contentEN: "<p>Content</p>",
      });

      const deleteResult = await caller.article.delete({ id: createResult.id });
      expect(deleteResult).toEqual({ success: true });

      const deleted = await caller.article.getById({ id: createResult.id });
      expect(deleted).toBeUndefined();
    });

    it("admin can list all articles including unpublished", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const allArticles = await caller.article.listAll();
      expect(Array.isArray(allArticles)).toBe(true);
    });
  });

  describe("upload procedures - access control", () => {
    it("upload.image rejects non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.upload.image({
          base64: "aGVsbG8=",
          mimeType: "image/png",
          fileName: "test.png",
        })
      ).rejects.toThrow();
    });

    it("upload.image rejects unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.upload.image({
          base64: "aGVsbG8=",
          mimeType: "image/png",
          fileName: "test.png",
        })
      ).rejects.toThrow();
    });

    it("upload.image succeeds for admin and returns URL", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.upload.image({
        base64: "aGVsbG8=",
        mimeType: "image/png",
        fileName: "test-cover.png",
      });

      expect(result).toHaveProperty("url");
      expect(typeof result.url).toBe("string");
      expect(result.url).toContain("https://");
    });
  });

  describe("input validation", () => {
    it("rejects empty slug", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.article.create({
          slug: "",
          category: "global-growth",
          titleZH: "测试",
          titleEN: "Test",
          contentZH: "内容",
          contentEN: "Content",
        })
      ).rejects.toThrow();
    });

    it("rejects invalid category", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.article.create({
          slug: "test-slug",
          category: "invalid-category" as any,
          titleZH: "测试",
          titleEN: "Test",
          contentZH: "内容",
          contentEN: "Content",
        })
      ).rejects.toThrow();
    });
  });
});
