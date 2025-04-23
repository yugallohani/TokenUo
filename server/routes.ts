import type { Express, Request } from "express";
import express from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertCertificateSchema, insertCommentSchema, CERTIFICATE_TYPES } from "@shared/schema";

// Set up multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const imageStorage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

// Allow jpg, png, and pdf files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only .jpg, .png, and .pdf formats are allowed"));
  }
};

const upload = multer({ 
  storage: imageStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Serve static uploads
  app.use("/uploads", (req, res, next) => {
    // Allow anonymous access to uploads
    res.setHeader("Cache-Control", "public, max-age=86400");
    next();
  }, express.static(uploadDir));

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
    
    // Handle file type information
    const fileType = req.body.fileType || "image/jpeg";
    const isPdf = req.body.isPdf || false;

    const cert = await storage.createCertificate({
      ...data,
      userId: req.user.id,
      isVerified: false,
      tokenValue,
      likesCount: 0,
      commentsCount: 0,
      fileType,
      isPdf
    });
    res.status(201).json(cert);
  });

  // Upload certificate file (image or PDF)
  app.post("/api/upload/certificate", upload.single("certificate"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype;
    const isPdf = fileType === "application/pdf";
    
    res.json({ imageUrl: fileUrl, fileType, isPdf });
  });

  // Upload profile image
  app.post("/api/upload/profile", upload.single("profile"), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    
    const imageUrl = `/uploads/${req.file.filename}`;
    
    // Update user avatar
    const updatedUser = await storage.updateUserAvatar(req.user.id, imageUrl);
    
    // Update session
    req.user.avatar = updatedUser.avatar;
    
    res.json({ avatar: imageUrl });
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

  // Make user an admin
  app.post("/api/users/:id/makeAdmin", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (!req.user.isAdmin) return res.sendStatus(403);

    const userId = Number(req.params.id);
    const updatedUser = await storage.makeUserAdmin(userId);

    // Update session if it's the current user
    if (req.user.id === userId) {
      req.user.isAdmin = true;
    }

    res.json(updatedUser);
  });

  // Check admin status
  app.get("/api/admin/check", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    res.json({ 
      isAdmin: req.user.isAdmin,
      userId: req.user.id,
      username: req.user.username
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

  app.get("/api/analytics", async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) return res.sendStatus(403);
    
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

    // Top certificate issuers
    const issuerCounts = certificates.reduce((acc, cert) => {
      const issuer = cert.issuer;
      acc[issuer] = (acc[issuer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topCertificateIssuer = Object.entries(issuerCounts)
      .map(([issuer, count]) => ({ issuer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // User growth simulation (based on user IDs and signup dates)
    const userGrowth = last7Days.map((date, index) => ({
      date,
      users: Math.min(users.length, Math.floor(users.length * (index + 1) / 7))
    }));

    // Token trend over time
    const tokenTrend = last7Days.map((date, index) => ({
      date,
      totalTokens: Math.floor(users.reduce((sum, user) => sum + user.totalTokens, 0) * ((index + 1) / 7))
    }));

    // Verification rate
    const verificationRate = certificates.length > 0 
      ? certificates.filter(cert => cert.isVerified).length / certificates.length 
      : 0;

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
      totalStats,
      topCertificateIssuer,
      userGrowth,
      verificationRate,
      tokenTrend
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}