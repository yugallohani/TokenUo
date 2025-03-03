import { User, Certificate, InsertUser } from "@shared/schema";
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
  
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private certificates: Map<number, Certificate>;
  private currentUserId: number;
  private currentCertificateId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.certificates = new Map();
    this.currentUserId = 1;
    this.currentCertificateId = 1;
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
    const user: User = { ...insertUser, id, totalTokens: 0 };
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
}

export const storage = new MemStorage();
