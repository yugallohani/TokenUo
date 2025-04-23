import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const CERTIFICATE_TYPES = {
  NPTEL: { value: 2, label: "NPTEL Course" },
  STATE_COMPETITION: { value: 3, label: "State Level Competition" },
  NATIONAL_COMPETITION: { value: 4, label: "National Level Competition" },
  INTERNATIONAL_COMPETITION: { value: 5, label: "International Competition" },
  COURSERA: { value: 2, label: "Coursera Course" },
  UDEMY: { value: 1, label: "Udemy Course" },
  INTERNSHIP: { value: 3, label: "Internship Completion" },
  WORKSHOP: { value: 1, label: "Workshop Participation" },
  HACKATHON: { value: 2, label: "Hackathon Achievement" },
  RESEARCH_PAPER: { value: 4, label: "Research Paper Publication" },
} as const;

export const certificateTypeSchema = z.enum([
  "NPTEL",
  "STATE_COMPETITION",
  "NATIONAL_COMPETITION",
  "INTERNATIONAL_COMPETITION",
  "COURSERA",
  "UDEMY",
  "INTERNSHIP",
  "WORKSHOP",
  "HACKATHON",
  "RESEARCH_PAPER"
]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  totalTokens: integer("total_tokens").default(0).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  issuer: text("issuer").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description"),
  certificateType: text("certificate_type").notNull(),
  tokenValue: integer("token_value").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  fileType: text("file_type").default("image/jpeg"),
  isPdf: boolean("is_pdf").default(false),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  certificateId: integer("certificate_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  certificateId: integer("certificate_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  avatar: true,
  bio: true,
});

export const insertCertificateSchema = createInsertSchema(certificates)
  .pick({
    title: true,
    issuer: true,
    imageUrl: true,
    description: true,
    fileType: true,
    isPdf: true,
  })
  .extend({
    certificateType: certificateTypeSchema,
  });

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Like = typeof likes.$inferSelect;