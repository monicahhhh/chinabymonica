import { int, mysqlEnum, mysqlTable, text, mediumtext, timestamp, varchar, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  /** Login identifier (admin uses email as openId; must fit full email length). */
  openId: varchar("openId", { length: 320 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Articles table for the CMS.
 * Stores bilingual content (Chinese + English) for the Insights page.
 */
export const articles = mysqlTable("articles", {
  id: int("id").autoincrement().primaryKey(),
  /** URL-friendly slug, e.g. "will-wang-tianfan-solo-companies" */
  slug: varchar("slug", { length: 256 }).notNull().unique(),
  /** Category: one of the three pillars */
  category: mysqlEnum("category", ["global-growth", "geopolitical-trends", "unicorn-analysis"]).notNull(),
  /** Chinese title */
  titleZH: text("titleZH").notNull(),
  /** English title */
  titleEN: text("titleEN").notNull(),
  /** Chinese subtitle / excerpt */
  subtitleZH: text("subtitleZH"),
  /** English subtitle / excerpt */
  subtitleEN: text("subtitleEN"),
  /** Chinese full article content (HTML) — MEDIUMTEXT supports up to 16MB */
  contentZH: mediumtext("contentZH").notNull(),
  /** English full article content (HTML) — MEDIUMTEXT supports up to 16MB */
  contentEN: mediumtext("contentEN").notNull(),
  /** Cover image URL */
  coverImage: text("coverImage"),
  /** Author name */
  author: varchar("author", { length: 128 }).default("Monica Wang").notNull(),
  /** Whether the article is published */
  published: boolean("published").default(false).notNull(),
  /** Whether this is a featured article */
  featured: boolean("featured").default(false).notNull(),
  /** Display order (lower = first) */
  sortOrder: int("sortOrder").default(0).notNull(),
  /** Publication date */
  publishedAt: timestamp("publishedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;
