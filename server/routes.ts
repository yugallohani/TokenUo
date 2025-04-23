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
      likesCount: 0,
      commentsCount: 0,
      description: data.description || null, // Ensure description is never undefined
    });
    res.status(201).json(cert);
  });

  app.post("/api/certificates/:id/verify", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.isAdmin) return res.sendStatus(403);

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

  // Add a route to make a user an admin (for testing purposes only)
  app.post("/api/makeAdmin", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const updatedUser = await storage.makeUserAdmin(req.user.id);
      
      // Update session with admin status
      req.user.isAdmin = true;
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Failed to set admin status" });
    }
  });

  app.get("/api/analytics", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const certificates = await storage.getCertificates();
    const users = await storage.getTopUsers(1000); // Get all users for analytics

    // Certificate type distribution
    const certificateTypeDistribution = Object.entries(CERTIFICATE_TYPES).map(([type]) => ({
      type,
      count: certificates.filter(cert => cert.certificateType === type).length
    })).filter(item => item.count > 0);

    // Token distribution ranges
    const tokenRanges = [
      { min: 0, max: 10, label: "0-10" },
      { min: 11, max: 20, label: "11-20" },
      { min: 21, max: 30, label: "21-30" },
      { min: 31, max: 50, label: "31-50" },
      { min: 51, max: Infinity, label: "50+" }
    ];

    const tokenDistribution = tokenRanges.map(range => ({
      range: range.label,
      count: users.filter(user =>
        user.totalTokens >= range.min && user.totalTokens <= range.max
      ).length
    }));

    // Daily activity for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const dailyActivity = last7Days.map(date => {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setDate(dayEnd.getDate() + 1);

      return {
        date,
        certificates: certificates.filter(cert =>
          new Date(cert.createdAt) >= dayStart && new Date(cert.createdAt) < dayEnd
        ).length,
        verifications: certificates.filter(cert =>
          cert.isVerified && new Date(cert.createdAt) >= dayStart && new Date(cert.createdAt) < dayEnd
        ).length
      };
    });

    // Total statistics
    const totalStats = {
      totalCertificates: certificates.length,
      verifiedCertificates: certificates.filter(cert => cert.isVerified).length,
      totalTokensAwarded: users.reduce((sum, user) => sum + user.totalTokens, 0),
      activeUsers: users.filter(user => user.totalTokens > 0).length
    };

    res.json({
      certificateTypeDistribution,
      tokenDistribution,
      dailyActivity,
      totalStats
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}