import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCertificateSchema, insertCommentSchema, CERTIFICATE_TYPES } from "@shared/schema";

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
    const certificateType = data.certificateType as keyof typeof CERTIFICATE_TYPES;
    const tokenValue = CERTIFICATE_TYPES[certificateType].value;

    const cert = await storage.createCertificate({
      ...data,
      userId: req.user.id,
      isVerified: false,
      tokenValue,
    });
    res.status(201).json(cert);
  });

  app.post("/api/certificates/:id/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const cert = await storage.verifyCertificate(Number(req.params.id));
    const updatedUser = await storage.updateUserTokens(cert.userId, cert.tokenValue);

    // Update the user session with new token count
    if (req.user.id === updatedUser.id) {
      req.user.totalTokens = updatedUser.totalTokens;
    }

    res.json({
      certificate: cert,
      user: updatedUser
    });
  });

  app.post("/api/certificates/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    await storage.likeCertificate(req.user.id, Number(req.params.id));
    res.sendStatus(200);
  });

  app.delete("/api/certificates/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    await storage.unlikeCertificate(req.user.id, Number(req.params.id));
    res.sendStatus(200);
  });

  app.get("/api/certificates/:id/likes", async (req, res) => {
    const likes = await storage.getLikes(Number(req.params.id));
    res.json(likes);
  });

  app.get("/api/certificates/:id/hasLiked", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const hasLiked = await storage.hasLiked(req.user.id, Number(req.params.id));
    res.json({ hasLiked });
  });

  app.get("/api/certificates/:id/comments", async (req, res) => {
    const comments = await storage.getComments(Number(req.params.id));
    const users = await Promise.all(
      comments.map(comment => storage.getUser(comment.userId))
    );

    res.json(comments.map((comment, i) => ({
      ...comment,
      user: users[i],
    })));
  });

  app.post("/api/certificates/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const data = insertCommentSchema.parse(req.body);
    const comment = await storage.addComment(
      req.user.id,
      Number(req.params.id),
      data.content
    );

    const user = await storage.getUser(comment.userId);
    res.status(201).json({ ...comment, user });
  });

  app.get("/api/leaderboard", async (_req, res) => {
    const users = await storage.getTopUsers(10);
    res.json(users);
  });

  const httpServer = createServer(app);
  return httpServer;
}