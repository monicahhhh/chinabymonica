import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { createPool, type PoolOptions } from "mysql2/promise";
import { InsertUser, users, articles, InsertArticle, Article } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

function createDrizzleFromEnv(): ReturnType<typeof drizzle> | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  const opts: PoolOptions = { uri: url };
  if (process.env.DATABASE_SSL === "true") {
    opts.ssl = {
      rejectUnauthorized:
        process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
    };
  }
  // mysql2/promise Pool vs callback pool: types differ; Drizzle accepts both at runtime.
  return drizzle(createPool(opts)) as unknown as ReturnType<typeof drizzle>;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = createDrizzleFromEnv();
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    throw new Error(
      "Database not available: set DATABASE_URL and ensure MySQL is reachable"
    );
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function upsertEmailLead(input: {
  email: string;
  subscribeNewsletter: boolean;
}): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error(
      "Database not available: set DATABASE_URL and ensure MySQL is reachable"
    );
  }

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS email_leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(320) NOT NULL UNIQUE,
      subscribeNewsletter BOOLEAN NOT NULL DEFAULT FALSE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  await db.execute(sql`
    INSERT INTO email_leads (email, subscribeNewsletter)
    VALUES (${input.email}, ${input.subscribeNewsletter})
    ON DUPLICATE KEY UPDATE
      subscribeNewsletter = VALUES(subscribeNewsletter),
      updatedAt = CURRENT_TIMESTAMP
  `);
}

export async function hasEmailLead(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS email_leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(320) NOT NULL UNIQUE,
      subscribeNewsletter BOOLEAN NOT NULL DEFAULT FALSE,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const rows = await db.execute(sql`
    SELECT id FROM email_leads WHERE email = ${email} LIMIT 1
  `);
  return Array.isArray(rows) && rows.length > 0;
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/* ===== Article Queries ===== */

export async function listArticles(publishedOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions = publishedOnly ? eq(articles.published, true) : undefined;
  return db.select().from(articles).where(conditions).orderBy(desc(articles.featured), desc(articles.publishedAt), desc(articles.createdAt));
}

export async function getArticleBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.slug, slug)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getArticleById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(articles).where(eq(articles.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createArticle(data: InsertArticle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(articles).values(data);
  return result[0].insertId;
}

export async function updateArticle(id: number, data: Partial<InsertArticle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(articles).set(data).where(eq(articles.id, id));
}

export async function deleteArticle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(articles).where(eq(articles.id, id));
}
