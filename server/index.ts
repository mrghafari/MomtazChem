import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import MemoryStore from "memorystore";
import path from "path";
import { registerRoutes } from "./routes";
import backupRoutes from "./backup-routes";
import otpRoutes from "./otp-routes";
import s3ManagementRoutes from "./s3-management-routes";
import { createVendorRouter } from "./vendor-routes";
import { createAdminVendorRouter } from "./admin-vendor-routes";
import InventoryAlertService from "./inventory-alerts";
import { expiredOrdersCleanup } from "./expired-orders-cleanup";
import { abandonedCartCleanup } from "./abandoned-cart-cleanup";
import { bankReceiptReminderService } from "./bank-receipt-reminder";
import { incompletePaymentCleaner } from "./incomplete-payment-cleaner";
import { setupVite, serveStatic, log } from "./vite";
import passport from "./passport-config";

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



// Create separate memory stores for different session types
const MemoryStoreSession = MemoryStore(session);

// Admin Session Store
const adminSessionStore = new MemoryStoreSession({
  checkPeriod: 86400000 // prune expired entries every 24h
});

// Customer Session Store
const customerSessionStore = new MemoryStoreSession({
  checkPeriod: 86400000 // prune expired entries every 24h
});

// Vendor Session Store
const vendorSessionStore = new MemoryStoreSession({
  checkPeriod: 86400000 // prune expired entries every 24h
});

// Session middleware for admin routes
const adminSessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "momtazchem-admin-secret-key",
  store: adminSessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: false,
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/',
    domain: undefined
  },
  name: 'momtazchem.admin.sid'
});

// Session middleware for customer routes
const customerSessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "momtazchem-customer-secret-key",
  store: customerSessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: false,
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/api/customers',
    domain: undefined
  },
  name: 'momtazchem.customer.sid'
});

// Session middleware for management/CRM routes
const managementSessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "momtazchem-management-secret-key",
  store: adminSessionStore, // Use same store as admin but different session name
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: false,
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/',
    domain: undefined
  },
  name: 'momtazchem.mgmt.sid'
});

// General session middleware for other routes
const generalSessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "momtazchem-general-secret-key",
  store: new MemoryStoreSession({
    checkPeriod: 86400000
  }),
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: false,
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/',
    domain: undefined
  },
  name: 'momtazchem.general.sid'
});

// Session middleware for vendor routes
const vendorSessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "momtazchem-vendor-secret-key",
  store: vendorSessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    secure: false,
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/api/vendor',
    domain: undefined
  },
  name: 'momtazchem.vendor.sid'
});

// Use single unified session middleware for all routes
const unifiedSessionMiddleware = session({
  secret: process.env.SESSION_SECRET || "momtazchem-unified-secret-key",
  store: adminSessionStore, // Use admin store for all sessions
  resave: true, // Force save sessions to prevent loss
  saveUninitialized: true, // Save new sessions to ensure they persist
  rolling: true,
  cookie: {
    secure: false,
    httpOnly: false,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax',
    path: '/',
    domain: undefined
  },
  name: 'momtazchem.unified.sid'
});

app.use(unifiedSessionMiddleware);

// Initialize Passport for OAuth authentication
app.use(passport.initialize());
app.use(passport.session());

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
    // Import and register payment routes
    const { paymentRoutes } = await import('./payment-routes');
    app.use('/api', paymentRoutes);
    
    // Import and register FIB settings routes
    const fibSettingsRoutes = (await import('./fib-settings-routes')).default;
    app.use('/api/admin/fib', fibSettingsRoutes);
    
    // Start auto-approval service
    try {
      const { autoApprovalService } = await import('./auto-approval-service');
      autoApprovalService.start();
    } catch (error: any) {
      console.error('⚠️ [AUTO APPROVAL] Service failed to start:', error.message);
    }
    
    // 🔥 INSTALL REALTIME DATABASE TRIGGERS - ZERO TOLERANCE FOR INCONSISTENCY
    try {
      const { RealtimeSyncTriggers } = await import('./realtime-sync-triggers');
      await RealtimeSyncTriggers.installTriggers();
    } catch (error: any) {
      console.error('⚠️ [REALTIME SYNC] Failed to install triggers (database may be unavailable):', error.message);
      console.log('⚠️ [REALTIME SYNC] Server will continue running without realtime triggers');
    }
    
    // Start backup sync service as secondary safety net
    try {
      const { SyncService } = await import('./sync-service');
      const syncService = new SyncService();
      syncService.startAutoSync(5); // هر 5 دقیقه به عنوان backup چک
      console.log('🔄 [SYSTEM] Backup sync service started - orders will be checked every 5 minutes as secondary safety');
    } catch (error: any) {
      console.error('⚠️ [SYNC SERVICE] Failed to start:', error.message);
    }
    
    // Add WebRTC routes directly before registering other routes
    const { webrtcRooms, roomParticipants, chatMessages } = await import("@shared/webrtc-schema");
    const { db } = await import("./db");
    const { eq, and, isNull, desc } = await import("drizzle-orm");

    app.get("/api/webrtc/rooms", async (req: Request, res: Response) => {
      try {
        console.log("📋 [WebRTC] Getting rooms list");
        const roomsResult = await db.select().from(webrtcRooms)
          .where(eq(webrtcRooms.isActive, true))
          .orderBy(desc(webrtcRooms.createdAt));

        const roomsWithCounts = await Promise.all(
          roomsResult.map(async (room) => {
            const participantsResult = await db.select().from(roomParticipants)
              .where(and(
                eq(roomParticipants.roomId, room.id),
                isNull(roomParticipants.leftAt)
              ));
            
            return {
              ...room,
              participantCount: participantsResult.length
            };
          })
        );

        console.log(`📋 [WebRTC] Found ${roomsWithCounts.length} active rooms`);
        res.json({
          success: true,
          data: roomsWithCounts
        });
      } catch (error) {
        console.error("❌ [WebRTC] Get rooms error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to get rooms"
        });
      }
    });

    app.post("/api/webrtc/rooms", async (req: Request, res: Response) => {
      try {
        console.log("🏗️ [WebRTC] Creating new room:", req.body);
        const { name, description, maxParticipants, createdBy } = req.body;
        
        const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const room = {
          id: roomId,
          name,
          description: description || "",
          createdBy,
          maxParticipants: maxParticipants || 10,
          isActive: true,
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await db.insert(webrtcRooms).values(room);
        
        console.log("✅ [WebRTC] Room created:", roomId);
        res.json({
          success: true,
          data: room
        });
      } catch (error) {
        console.error("❌ [WebRTC] Create room error:", error);
        res.status(500).json({
          success: false,
          message: "Failed to create room"
        });
      }
    });

    console.log("🔌 [WebRTC] Routes registered in index.ts");

    // Initialize AWS S3 service from database settings
    try {
      const { initializeAwsS3FromDb } = await import('./aws-s3-service');
      await initializeAwsS3FromDb(db);
    } catch (error: any) {
      console.error('⚠️ [AWS S3] Failed to initialize:', error.message);
    }

    // Register S3 image serving routes BEFORE main routes
    try {
      const { registerS3ImageRoutes } = await import('./s3-image-routes');
      registerS3ImageRoutes(app);
    } catch (error: any) {
      console.error('⚠️ [S3 ROUTES] Failed to register S3 image routes:', error.message);
    }

    // Register backup routes
    app.use(adminSessionMiddleware);
    app.use(backupRoutes);
    log('💾 [BACKUP] Backup routes registered');

    // Register OTP routes (no auth required - public registration)
    app.use(otpRoutes);
    log('🔐 [OTP] OTP verification routes registered');

    // Register S3 management routes (admin only)
    app.use(s3ManagementRoutes);
    log('📦 [S3 MGMT] S3 management routes registered');

    // Register vendor routes with dedicated session middleware
    const vendorRouter = createVendorRouter();
    app.use('/api/vendor', vendorSessionMiddleware, vendorRouter);
    log('🏪 [VENDOR] Vendor marketplace routes registered');

    // Register admin vendor management routes (uses unified session middleware)
    const adminVendorRouter = createAdminVendorRouter();
    app.use('/api/admin/vendors', adminVendorRouter);
    log('👨‍💼 [ADMIN-VENDOR] Admin vendor management routes registered');

    // Register routes BEFORE Vite middleware to ensure API routes take precedence
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

    // Add JSON headers for all API routes to ensure proper response type
    app.use('/api/*', (req, res, next) => {
      res.header('Content-Type', 'application/json');
      next();
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
      
      // Start services with delayed initialization
      setTimeout(() => {
        try {
          // Start expired orders cleanup service
          expiredOrdersCleanup.start();
          log('🧹 Expired orders cleanup service started');
          
          // Start abandoned cart cleanup service
          abandonedCartCleanup.start();
          log('🛒 Abandoned cart cleanup service started');
          
          // Start bank receipt reminder service
          bankReceiptReminderService.start();
          log('🔔 Bank receipt reminder service started');
          
          // Start incomplete payment cleaner service
          incompletePaymentCleaner.startService();
          log('🚮 Incomplete payment cleaner service started');
          
          // Start proforma reminder service
          import('./proforma-reminder-service').then(({ proformaReminderService }) => {
            proformaReminderService.initializeLogTable();
            // Process reminders every hour
            setInterval(() => {
              proformaReminderService.processReminders();
            }, 60 * 60 * 1000);
            log('📅 Proforma reminder service started');
          });

          // Start auto-invoice conversion service
          import('./auto-invoice-converter').then(({ AutoInvoiceConverter }) => {
            AutoInvoiceConverter.startPeriodicCheck();
            log('🧾 Auto-invoice conversion service started');
          });

          // Start database backup scheduler
          // NOTE: Temporarily disabled - backup_schedules table requires manual creation
          /*
          import('./backup-scheduler').then(({ getBackupScheduler }) => {
            const scheduler = getBackupScheduler();
            scheduler.initialize().then(() => {
              log('💾 Database backup scheduler started');
            }).catch((err) => {
              console.error('❌ Failed to start backup scheduler:', err);
            });
          });
          */
          log('ℹ️  Database backup scheduler temporarily disabled');
          
          // NOTE: AWS credentials migration is DISABLED
          // Credentials are now managed through the admin panel at /admin/aws-s3-settings
          // To manually migrate, run: npx tsx server/migrate-aws-credentials.ts
          
          // Start inventory monitoring service
          InventoryAlertService.startInventoryMonitoring();
        } catch (servicesError) {
          console.error("Error starting services:", servicesError);
        }
      }, 5000); // Delay 5 seconds to ensure database connections are stable
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
})();
