import { User, Certificate, InsertUser, Comment, Like } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTokens(userId: number, tokens: number): Promise<User>;
  getTopUsers(limit: number): Promise<User[]>;

  getCertificates(userId?: number): Promise<Certificate[]>;
  createCertificate(certificate: Omit<Certificate, "id" | "createdAt">): Promise<Certificate>;
  verifyCertificate(id: number): Promise<Certificate>;

  likeCertificate(userId: number, certificateId: number): Promise<void>;
  unlikeCertificate(userId: number, certificateId: number): Promise<void>;
  getLikes(certificateId: number): Promise<Like[]>;
  hasLiked(userId: number, certificateId: number): Promise<boolean>;

  addComment(userId: number, certificateId: number, content: string): Promise<Comment>;
  getComments(certificateId: number): Promise<Comment[]>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private certificates: Map<number, Certificate>;
  private likes: Map<number, Like>;
  private comments: Map<number, Comment>;
  private currentUserId: number;
  private currentCertificateId: number;
  private currentLikeId: number;
  private currentCommentId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.certificates = new Map();
    this.likes = new Map();
    this.comments = new Map();
    this.currentUserId = 1;
    this.currentCertificateId = 1;
    this.currentLikeId = 1;
    this.currentCommentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      totalTokens: 0,
      isAdmin: false 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserTokens(userId: number, tokens: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = {
      ...user,
      totalTokens: user.totalTokens + tokens,
    };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getTopUsers(limit: number): Promise<User[]> {
    return Array.from(this.users.values())
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, limit);
  }

  async getCertificates(userId?: number): Promise<Certificate[]> {
    const certs = Array.from(this.certificates.values());
    return userId ? certs.filter(cert => cert.userId === userId) : certs;
  }

  async createCertificate(certificate: Omit<Certificate, "id" | "createdAt">): Promise<Certificate> {
    const id = this.currentCertificateId++;
    const newCert: Certificate = {
      ...certificate,
      id,
      createdAt: new Date(),
      likesCount: 0,
      commentsCount: 0,
    };
    this.certificates.set(id, newCert);
    return newCert;
  }

  async verifyCertificate(id: number): Promise<Certificate> {
    const cert = this.certificates.get(id);
    if (!cert) throw new Error("Certificate not found");

    const updatedCert = {
      ...cert,
      isVerified: true,
    };
    this.certificates.set(id, updatedCert);
    return updatedCert;
  }

  async likeCertificate(userId: number, certificateId: number): Promise<void> {
    const cert = this.certificates.get(certificateId);
    if (!cert) throw new Error("Certificate not found");

    const existingLike = Array.from(this.likes.values()).find(
      like => like.userId === userId && like.certificateId === certificateId
    );

    if (!existingLike) {
      const id = this.currentLikeId++;
      this.likes.set(id, {
        id,
        userId,
        certificateId,
        createdAt: new Date(),
      });

      this.certificates.set(certificateId, {
        ...cert,
        likesCount: cert.likesCount + 1,
      });
    }
  }

  async unlikeCertificate(userId: number, certificateId: number): Promise<void> {
    const cert = this.certificates.get(certificateId);
    if (!cert) throw new Error("Certificate not found");

    const existingLike = Array.from(this.likes.values()).find(
      like => like.userId === userId && like.certificateId === certificateId
    );

    if (existingLike) {
      this.likes.delete(existingLike.id);

      this.certificates.set(certificateId, {
        ...cert,
        likesCount: cert.likesCount - 1,
      });
    }
  }

  async getLikes(certificateId: number): Promise<Like[]> {
    return Array.from(this.likes.values()).filter(
      like => like.certificateId === certificateId
    );
  }

  async hasLiked(userId: number, certificateId: number): Promise<boolean> {
    return Array.from(this.likes.values()).some(
      like => like.userId === userId && like.certificateId === certificateId
    );
  }

  async addComment(userId: number, certificateId: number, content: string): Promise<Comment> {
    const cert = this.certificates.get(certificateId);
    if (!cert) throw new Error("Certificate not found");

    const id = this.currentCommentId++;
    const comment: Comment = {
      id,
      userId,
      certificateId,
      content,
      createdAt: new Date(),
    };

    this.comments.set(id, comment);

    this.certificates.set(certificateId, {
      ...cert,
      commentsCount: cert.commentsCount + 1,
    });

    return comment;
  }

  async getComments(certificateId: number): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.certificateId === certificateId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();