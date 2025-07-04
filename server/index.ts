import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import path from "path";
import { registerRoutes } from "./routes";
import InventoryAlertService from "./inventory-alerts";
import { setupVite, serveStatic, log } from "./vite";

// Global error handlers to prevent server crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();

// Basic security headers - minimal for development
app.use((req, res, next) => {
  // Hide server information only
  res.removeHeader('X-Powered-By');
  next();
});

// Rate limiting middleware for API endpoints
const rateLimit = new Map();
app.use('/api/', (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100; // Max requests per window
  
  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
  } else {
    const rateLimitInfo = rateLimit.get(ip);
    if (now > rateLimitInfo.resetTime) {
      rateLimitInfo.count = 1;
      rateLimitInfo.resetTime = now + windowMs;
    } else {
      rateLimitInfo.count++;
      if (rateLimitInfo.count > maxRequests) {
        return res.status(429).json({
          success: false,
          message: 'تعداد درخواست‌های شما از حد مجاز تجاوز کرده است. لطفاً چند دقیقه صبر کنید.',
          retryAfter: Math.ceil((rateLimitInfo.resetTime - now) / 1000)
        });
      }
    }
  }
  
  next();
});

app.use(express.json({ limit: '10mb' })); // Limit JSON payload size
app.use(express.urlencoded({ extended: false, limit: '10mb' }));



// Create memory store for session persistence
const MemoryStoreSession = MemoryStore(session);

// Session configuration with proper store
app.use(session({
  secret: process.env.SESSION_SECRET || "momtazchem-admin-secret-key",
  store: new MemoryStoreSession({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  resave: false,
  saveUninitialized: false,
  rolling: true, // Reset maxAge on each request
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: false, // Allow frontend access for debugging
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax'
  },
  name: 'momtazchem.sid'
}));

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
    const server = await registerRoutes(app);

    // Multer error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      if (err instanceof Error && err.message.includes('Only')) {
        return res.status(400).json({ 
          success: false, 
          message: err.message 
        });
      }
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ 
          success: false, 
          message: 'File too large' 
        });
      }

      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
      
      // Start inventory monitoring service with delayed initialization
      setTimeout(() => {
        try {
          InventoryAlertService.startInventoryMonitoring();
        } catch (monitoringError) {
          console.error("Error starting inventory monitoring:", monitoringError);
        }
      }, 5000); // Delay 5 seconds to ensure database connections are stable
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
