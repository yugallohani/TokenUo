import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCertificateSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/certificates", async (req, res) => {
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const certificates = await storage.getCertificates(userId);
    res.json(certificates);
  });

  app.post("/api/certificates", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const data = insertCertificateSchema.parse(req.body);
    const cert = await storage.createCertificate({
      ...data,
      userId: req.user.id,
      isVerified: false,
      tokenValue: 2, // Default token value
    });
    res.status(201).json(cert);
  });

  app.post("/api/certificates/:id/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const cert = await storage.verifyCertificate(Number(req.params.id));
    await storage.updateUserTokens(cert.userId, cert.tokenValue);
    res.json(cert);
  });

  app.get("/api/leaderboard", async (_req, res) => {
    const users = await storage.getTopUsers(10);
    res.json(users);
  });

  const httpServer = createServer(app);
  return httpServer;
}
