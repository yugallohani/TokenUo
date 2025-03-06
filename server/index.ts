import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    log("Starting server initialization...");
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      log(`Error: ${err.message}`, "error");
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Temporarily bypass Vite integration to serve static files for faster startup
    log("Setting up static file serving...");
    serveStatic(app);

    // Server configuration
    const port = 5000;
    log(`Attempting to start server on port ${port}...`);

    const startupTimeout = setTimeout(() => {
      log("Server startup timeout exceeded", "error");
      process.exit(1);
    }, 10000); // 10 second timeout

    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      clearTimeout(startupTimeout);
      log(`Server successfully started and listening on port ${port}`);
    });

    // Handle server errors
    server.on("error", (error: any) => {
      clearTimeout(startupTimeout);
      if (error.code === "EADDRINUSE") {
        log(`Port ${port} is already in use`, "error");
      } else {
        log(`Server error: ${error.message}`, "error");
      }
      process.exit(1);
    });

  } catch (error) {
    log(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`, "error");
    process.exit(1);
  }
})();