import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import path from "path";
import { registerRoutes } from "./routes";
import InventoryAlertService from "./inventory-alerts";
import { setupVite, serveStatic, log } from "./vite";

// Environment validation
function validateEnvironment() {
  const requiredVars = ['DATABASE_URL'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    console.error('Please set these environment variables before starting the server.');
    process.exit(1);
  }
  
  console.log('Environment validation passed');
}

// Global error handlers to prevent server crashes
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Health check endpoint for deployment validation
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    const { pool } = await import('./db');
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'Chemical Solutions Platform',
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      service: 'Chemical Solutions Platform',
      version: process.env.npm_package_version || '1.0.0',
      database: 'disconnected',
      environment: process.env.NODE_ENV || 'development',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});



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
    secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
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
    // Validate environment before starting
    validateEnvironment();
    
    // Test database connection early
    try {
      const { pool } = await import('./db');
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('Database connection verified');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      console.error('Please check your DATABASE_URL environment variable');
      process.exit(1);
    }
    
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

    // Use environment port or default to 5000
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    
    // Add graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT received, shutting down gracefully');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
    
    server.listen(port, "0.0.0.0", () => {
      log(`Chemical Solutions Platform serving on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`Health check available at: http://localhost:${port}/health`);
      
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
