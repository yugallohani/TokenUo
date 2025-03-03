import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  totalTokens: integer("total_tokens").default(0).notNull(),
});

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  issuer: text("issuer").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  tokenValue: integer("token_value").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  avatar: true,
  bio: true,
});

export const insertCertificateSchema = createInsertSchema(certificates).pick({
  title: true,
  issuer: true,
  imageUrl: true,
  description: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
