import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { users, certificates, likes, comments } from "@shared/schema";
import type { User, Certificate, Like, InsertUser, Comment } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class PostgresStorage {
  sessionStore: session.Store;
  constructor() {
    this.sessionStore = new MemoryStore({ checkPeriod: 86400000 });
  }

  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserTokens(userId: number, tokens: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ totalTokens: tokens })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  async getTopUsers(limit: number): Promise<User[]> {
    return await db.select().from(users).orderBy(users.totalTokens).limit(limit);
  }

  async makeUserAdmin(userId: number): Promise<User> {
    const [user] = await db.update(users)
      .set({ isAdmin: true })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  // --- CERTIFICATES ---
  async getCertificates(userId?: number) {
    if (userId) {
      return await db.select().from(certificates).where(eq(certificates.userId, userId));
    } else {
      return await db.select().from(certificates);
    }
  }

  async createCertificate(certificate: Omit<Certificate, "id" | "createdAt">) {
    const [cert] = await db.insert(certificates)
      .values(certificate)
      .returning();
    return cert;
  }

  async verifyCertificate(id: number) {
    const [cert] = await db.update(certificates)
      .set({ isVerified: true })
      .where(eq(certificates.id, id))
      .returning();
    if (!cert) throw new Error("Certificate not found");
    return cert;
  }

  // --- LIKES ---
  async likeCertificate(userId: number, certificateId: number) {
    // Prevent duplicate likes
    const existing = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.certificateId, certificateId)));
    if (existing.length === 0) {
      await db.insert(likes).values({ userId, certificateId });
      // Increment likesCount on certificate
      const [cert] = await db.select().from(certificates).where(eq(certificates.id, certificateId));
      if (cert) {
        await db.update(certificates)
          .set({ likesCount: (cert.likesCount || 0) + 1 })
          .where(eq(certificates.id, certificateId));
      }
    }
  }

  async unlikeCertificate(userId: number, certificateId: number) {
    // Remove like if exists
    const likeRows = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.certificateId, certificateId)));
    if (likeRows.length > 0) {
      const likeId = likeRows[0].id;
      await db.delete(likes).where(eq(likes.id, likeId));
      // Decrement likesCount on certificate
      const [cert] = await db.select().from(certificates).where(eq(certificates.id, certificateId));
      if (cert) {
        await db.update(certificates)
          .set({ likesCount: Math.max(0, (cert.likesCount || 0) - 1) })
          .where(eq(certificates.id, certificateId));
      }
    }
  }

  async getLikes(certificateId: number) {
    return await db.select().from(likes).where(eq(likes.certificateId, certificateId));
  }

  async hasLiked(userId: number, certificateId: number) {
    const result = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.certificateId, certificateId)));
    return result.length > 0;
  }

  // --- COMMENTS ---
  async addComment(userId: number, certificateId: number, content: string) {
    // Insert comment
    const [comment] = await db.insert(comments)
      .values({ userId, certificateId, content })
      .returning();
    // Increment commentsCount on certificate
    const [cert] = await db.select().from(certificates).where(eq(certificates.id, certificateId));
    if (cert) {
      await db.update(certificates)
        .set({ commentsCount: (cert.commentsCount || 0) + 1 })
        .where(eq(certificates.id, certificateId));
    }
    return comment;
  }

  async getComments(certificateId: number) {
    return await db.select().from(comments).where(eq(comments.certificateId, certificateId));
  }

  // --- USER AVATAR ---
  async updateUserAvatar(userId: number, avatar: string) {
    const [user] = await db.update(users)
      .set({ avatar })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  // --- STUBS FOR UNIMPLEMENTED METHODS TO PREVENT CRASHES ---

  // --- END STUBS ---
}

export const storage = new PostgresStorage();
