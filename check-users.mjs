import { drizzle } from 'drizzle-orm/mysql2';
import { mysqlTable, int, varchar, text, mysqlEnum, timestamp } from 'drizzle-orm/mysql-core';
import 'dotenv/config';

const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
});

const db = drizzle(process.env.DATABASE_URL);
const all = await db.select().from(users);
console.log(JSON.stringify(all, null, 2));
process.exit(0);
