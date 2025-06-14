import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertLeadSchema, insertLeadActivitySchema } from "@shared/schema";
import { insertContactSchema, insertShowcaseProductSchema } from "@shared/showcase-schema";
import { simpleCustomerStorage } from "./simple-customer-storage";
import { shopStorage } from "./shop-storage";
import { customerStorage } from "./customer-storage";
import { emailStorage } from "./email-storage";
import { crmStorage } from "./crm-storage";
import { insertCustomerInquirySchema, insertEmailTemplateSchema, insertCrmCustomerSchema } from "@shared/customer-schema";
import { insertEmailCategorySchema, insertSmtpSettingSchema, insertEmailRecipientSchema, smtpConfigSchema } from "@shared/email-schema";
import { insertShopProductSchema, insertShopCategorySchema } from "@shared/shop-schema";
import { sendContactEmail, sendProductInquiryEmail } from "./email";
import TemplateProcessor from "./template-processor";
import InventoryAlertService from "./inventory-alerts";
import { db } from "./db";
import { sql, eq, and } from "drizzle-orm";
import { z } from "zod";
import * as schema from "@shared/schema";

// Extend session type to include admin user
declare module "express-session" {
  interface SessionData {
    adminId?: number;
    isAuthenticated?: boolean;
  }
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const imagesDir = path.join(uploadsDir, 'images');
const catalogsDir = path.join(uploadsDir, 'catalogs');

[uploadsDir, imagesDir, catalogsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer configuration for image uploads
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `product-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Multer configuration for catalog uploads
const catalogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, catalogsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `catalog-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadImage = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const uploadCatalog = multer({
  storage: catalogStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.isAuthenticated && req.session.adminId) {
    next();
  } else {
    res.status(401).json({ success: false, message: "Authentication required" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from attached_assets directory
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));
  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Username and password are required" 
        });
      }

      // Check if user exists and verify password
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid credentials" 
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid credentials" 
        });
      }

      // Set session
      req.session.adminId = user.id;
      req.session.isAuthenticated = true;

      // Save session explicitly
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: "Failed to save session" 
          });
        }
        
        res.json({ 
          success: true, 
          message: "Login successful",
          user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: "Could not log out" 
        });
      }
      res.json({ success: true, message: "Logged out successfully" });
    });
  });

  app.post("/api/admin/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Username and password are required" 
        });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ 
          success: false, 
          message: "User already exists" 
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await storage.createUser({
        username,
        email: username,
        passwordHash,
        role: 'admin',
        isActive: true,
      });

      res.json({ 
        success: true, 
        message: "Admin account created successfully",
        user: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.get("/api/admin/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserById(req.session.adminId!);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }
      
      res.json({ 
        success: true, 
        user: { id: user.id, username: user.username, email: user.email, role: user.role }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Authentication check endpoint
  app.get("/api/admin/check-auth", async (req, res) => {
    try {
      if (!req.session.adminId || !req.session.isAuthenticated) {
        return res.status(401).json({ 
          success: false, 
          message: "Not authenticated" 
        });
      }
      
      // Verify user still exists and is active
      const user = await storage.getUserById(req.session.adminId);
      if (!user || !user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: "User not found or inactive" 
        });
      }
      
      res.json({ 
        success: true, 
        authenticated: true,
        user: { id: user.id, username: user.username, email: user.email, role: user.role }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Password reset functionality
  app.post("/api/admin/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "Email is required" 
        });
      }

      // Check if user exists
      const user = await storage.getUserByUsername(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ 
          success: true, 
          message: "If an account with this email exists, a password reset link has been sent" 
        });
      }

      // Generate reset token
      const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Save reset token
      await storage.createPasswordReset({
        email: user.email,
        token: resetToken,
        expiresAt,
        used: false,
      });

      // TODO: Send email with reset link
      // For now, log the token (in production, this would be sent via email)
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({ 
        success: true, 
        message: "If an account with this email exists, a password reset link has been sent",
        resetToken // In production, remove this and send via email
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.post("/api/admin/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: "Token and new password are required" 
        });
      }

      // Verify reset token
      const resetRecord = await storage.getPasswordResetByToken(token);
      if (!resetRecord) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid or expired reset token" 
        });
      }

      // Check if token is expired
      if (new Date() > resetRecord.expiresAt) {
        return res.status(400).json({ 
          success: false, 
          message: "Reset token has expired" 
        });
      }

      // Find user by email
      const user = await storage.getUserByUsername(resetRecord.email);
      if (!user) {
        return res.status(400).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update user password
      await storage.updateUserPassword(user.id, newPasswordHash);

      // Mark reset token as used
      await storage.markPasswordResetAsUsed(token);

      // Clean up expired tokens
      await storage.cleanupExpiredResets();

      res.json({ 
        success: true, 
        message: "Password reset successfully" 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Admin management endpoints
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
      
      res.json({ 
        success: true, 
        users: safeUsers 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.put("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, email, role, isActive } = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }

      // Prevent self-deactivation
      if (req.session.adminId === userId && isActive === false) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot deactivate your own account" 
        });
      }

      const updatedUser = await storage.updateUser(userId, {
        username,
        email,
        role,
        isActive,
      });

      res.json({ 
        success: true, 
        message: "User updated successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          isActive: updatedUser.isActive,
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.put("/api/admin/change-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: "Current and new passwords are required" 
        });
      }

      // Get current user
      const user = await storage.getUserById(req.session.adminId!);
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: "User not found" 
        });
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({ 
          success: false, 
          message: "Current password is incorrect" 
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await storage.updateUserPassword(user.id, newPasswordHash);

      res.json({ 
        success: true, 
        message: "Password changed successfully" 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }

      // Prevent self-deletion
      if (req.session.adminId === userId) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot delete your own account" 
        });
      }

      await storage.deleteUser(userId);

      res.json({ 
        success: true, 
        message: "User deleted successfully" 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Serve uploaded files
  app.get('/uploads/images/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(process.cwd(), 'uploads', 'images', filename);
    
    if (fs.existsSync(filepath)) {
      // Set proper content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'image/png'; // default
      
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.png':
          contentType = 'image/png';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
      }
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: 'Image not found' });
    }
  });

  app.get('/uploads/catalogs/:filename', (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(process.cwd(), 'uploads', 'catalogs', filename);
    
    if (fs.existsSync(filepath)) {
      res.sendFile(filepath);
    } else {
      res.status(404).json({ message: 'Catalog not found' });
    }
  });

  // File upload endpoints
  app.post("/api/upload/image", requireAuth, uploadImage.single('image'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No image file uploaded" 
        });
      }

      const imageUrl = `/uploads/images/${req.file.filename}`;
      res.json({ 
        success: true, 
        url: imageUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to upload image" 
      });
    }
  });

  app.post("/api/upload/catalog", requireAuth, uploadCatalog.single('catalog'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No catalog file uploaded" 
        });
      }

      const catalogUrl = `/uploads/catalogs/${req.file.filename}`;
      res.json({ 
        success: true, 
        url: catalogUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to upload catalog" 
      });
    }
  });

  // Test email endpoint
  app.post("/api/test-email", async (req, res) => {
    try {
      const testData = {
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        company: "Test Company",
        productInterest: "Test Product",
        message: "This is a test email message"
      };
      
      await sendContactEmail(testData);
      res.json({ success: true, message: "Test email sent successfully" });
    } catch (error) {
      console.error("Test email failed:", error);
      res.status(500).json({ 
        success: false, 
        message: "Test email failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      
      // Send email notification
      try {
        await sendContactEmail({
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          company: contact.company ?? '',
          productInterest: contact.productInterest,
          message: contact.message ?? ''
        });
        console.log("Email sent successfully for contact:", contact.id);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        // Continue processing even if email fails
      }
      
      console.log("New contact form submission:", contact);
      
      res.json({ success: true, message: "Contact form submitted successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Validation error", 
          errors: error.errors 
        });
      } else {
        console.error("Contact form error:", error);
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  });

  // Get all contacts (for admin purposes)
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await storage.getContacts();
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Protected admin routes for product management
  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const productData = insertShowcaseProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid product data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const { category } = req.query;
      let products;
      
      if (category && typeof category === 'string') {
        products = await storage.getProductsByCategory(category);
      } else {
        products = await storage.getProducts();
      }
      
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }

      const product = await storage.getProductById(id);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found" 
        });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.patch("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }

      const productData = insertShowcaseProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      res.json(product);
    } catch (error) {
      console.error("Error updating product:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid product data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }

      await storage.deleteProduct(id);
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // =============================================================================
  // BARCODE & INVENTORY MANAGEMENT ENDPOINTS
  // =============================================================================

  // Get product by barcode - search in both regular products and shop products
  app.get("/api/products/barcode/:barcode", async (req, res) => {
    try {
      const { barcode } = req.params;
      const decodedBarcode = decodeURIComponent(barcode);
      
      // First search in shop products (inventory management)
      try {
        const shopProduct = await shopStorage.getShopProductBySku(decodedBarcode);
        if (shopProduct) {
          return res.json(shopProduct);
        }
      } catch (error) {
        console.log("Shop product not found by SKU, trying barcode field");
      }

      // Search shop products by barcode field directly
      try {
        const shopProducts = await shopStorage.getShopProducts();
        const foundShopProduct = shopProducts.find(p => 
          p.barcode === decodedBarcode || 
          p.sku === decodedBarcode
        );
        
        if (foundShopProduct) {
          return res.json(foundShopProduct);
        }
      } catch (error) {
        console.log("Error searching shop products:", error);
      }
      
      // Then search in regular products
      const products = await storage.getProducts();
      const product = products.find(p => 
        p.barcode === decodedBarcode || 
        p.sku === decodedBarcode || 
        p.qrCode === decodedBarcode
      );
      
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found" 
        });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product by barcode:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Update product barcode information
  app.put("/api/products/:id/barcode", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { barcode, qrCode, sku } = req.body;
      
      const updateData: any = {};
      if (barcode) updateData.barcode = barcode;
      if (qrCode) updateData.qrCode = qrCode;
      if (sku) updateData.sku = sku;
      
      const updatedProduct = await storage.updateProduct(parseInt(id), updateData);
      res.json(updatedProduct);
    } catch (error) {
      console.error("Error updating product barcode:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Log barcode scan
  app.post("/api/barcode/log", async (req, res) => {
    try {
      const { barcode, scanType, scanResult, location, additionalData } = req.body;
      
      // Simple logging to console for now - could be extended to database
      console.log('Barcode scan logged:', {
        barcode,
        scanType,
        scanResult,
        userId: req.session?.adminId,
        timestamp: new Date().toISOString()
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error logging barcode scan:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // =============================================================================
  // DATABASE BACKUP ENDPOINTS
  // =============================================================================

  // Create database backup
  app.post("/api/admin/backup/create", requireAuth, async (req, res) => {
    try {
      const { spawn } = await import('child_process');
      const fsModule = await import('fs');
      const pathModule = await import('path');
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      const backupDir = './backups';
      const backupFile = `database_backup_${timestamp}.sql`;
      const backupPath = path.join(backupDir, backupFile);
      
      // Create backup directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Create backup using pg_dump
      const pgDump = spawn('pg_dump', [process.env.DATABASE_URL, '--no-owner', '--no-privileges'], {
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      const writeStream = fs.createWriteStream(backupPath);
      pgDump.stdout.pipe(writeStream);
      
      let errorOutput = '';
      pgDump.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      pgDump.on('close', (code) => {
        if (code === 0) {
          const stats = fs.statSync(backupPath);
          res.json({
            success: true,
            message: 'Backup created successfully',
            filename: backupFile,
            size: stats.size,
            timestamp: new Date().toISOString()
          });
        } else {
          console.error('pg_dump error:', errorOutput);
          res.status(500).json({
            success: false,
            message: 'Failed to create backup',
            error: errorOutput
          });
        }
      });
      
    } catch (error) {
      console.error("Error creating backup:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Download database backup
  app.get("/api/admin/backup/download/:filename", requireAuth, async (req, res) => {
    try {
      const { filename } = req.params;
      const path = require('path');
      const fs = require('fs');
      
      // Security check - only allow .sql files and prevent directory traversal
      if (!filename.endsWith('.sql') || filename.includes('..') || filename.includes('/')) {
        return res.status(400).json({
          success: false,
          message: 'Invalid filename'
        });
      }
      
      const backupPath = path.join('./backups', filename);
      
      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({
          success: false,
          message: 'Backup file not found'
        });
      }
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'application/sql');
      
      const fileStream = fs.createReadStream(backupPath);
      fileStream.pipe(res);
      
    } catch (error) {
      console.error("Error downloading backup:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // List available backups
  app.get("/api/admin/backup/list", requireAuth, async (req, res) => {
    try {
      
      const backupDir = './backups';
      
      if (!fs.existsSync(backupDir)) {
        return res.json({ backups: [] });
      }
      
      const files = fs.readdirSync(backupDir)
        .filter(file => file.endsWith('.sql') || file.endsWith('.sql.gz'))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      
      res.json({ backups: files });
    } catch (error) {
      console.error("Error listing backups:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // =============================================================================
  // ADMIN USER MANAGEMENT ENDPOINTS (SUPER ADMIN ONLY)
  // =============================================================================

  // Check if user has specific permission
  const hasPermission = async (userId: number, permissionName: string): Promise<boolean> => {
    try {
      const result = await storage.db.query(`
        SELECT 1 FROM users u
        JOIN admin_roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN admin_permissions p ON rp.permission_id = p.id
        WHERE u.id = $1 AND p.name = $2 AND u.is_active = true AND r.is_active = true
      `, [userId, permissionName]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  // Middleware to check super admin permission
  const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const session = req.session as SessionData;
    if (!session?.adminId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const canManageUsers = await hasPermission(session.adminId, 'manage_users');
    if (!canManageUsers) {
      return res.status(403).json({ success: false, message: "Super admin access required" });
    }

    next();
  };

  // Get all admin users
  app.get("/api/admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const result = await storage.db.query(`
        SELECT u.id, u.username, u.email, u.role_id, u.is_active, u.last_login_at, u.created_at,
               r.name as role_name, r.display_name as role_display_name
        FROM users u
        LEFT JOIN admin_roles r ON u.role_id = r.id
        ORDER BY u.created_at DESC
      `);
      
      const users = result.rows.map(row => ({
        id: row.id,
        username: row.username,
        email: row.email,
        roleId: row.role_id,
        roleName: row.role_name,
        roleDisplayName: row.role_display_name,
        isActive: row.is_active,
        lastLoginAt: row.last_login_at,
        createdAt: row.created_at
      }));

      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get all admin roles
  app.get("/api/admin/roles", requireSuperAdmin, async (req, res) => {
    try {
      const result = await storage.db.query(`
        SELECT r.id, r.name, r.display_name, r.description, r.is_active,
               COUNT(rp.permission_id) as permission_count
        FROM admin_roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        GROUP BY r.id, r.name, r.display_name, r.description, r.is_active
        ORDER BY r.id
      `);
      
      const roles = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        displayName: row.display_name,
        description: row.description,
        isActive: row.is_active,
        permissionCount: parseInt(row.permission_count)
      }));

      res.json(roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get all admin permissions
  app.get("/api/admin/permissions", requireSuperAdmin, async (req, res) => {
    try {
      const result = await storage.db.query(`
        SELECT id, name, display_name, description, module, is_active
        FROM admin_permissions
        ORDER BY module, display_name
      `);
      
      const permissions = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        displayName: row.display_name,
        description: row.description,
        module: row.module,
        isActive: row.is_active
      }));

      res.json(permissions);
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Create new admin user
  app.post("/api/admin/users", requireSuperAdmin, async (req, res) => {
    try {
      const { username, email, password, roleId } = req.body;
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      
      const result = await storage.db.query(`
        INSERT INTO users (username, email, password_hash, role_id, is_active)
        VALUES ($1, $2, $3, $4, true)
        RETURNING id, username, email, role_id, is_active, created_at
      `, [username, email, passwordHash, roleId]);

      res.json({
        success: true,
        user: result.rows[0]
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({ success: false, message: "Username or email already exists" });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  });

  // Update admin user
  app.put("/api/admin/users/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { username, email, password, roleId } = req.body;
      
      let query = `
        UPDATE users 
        SET username = $1, email = $2, role_id = $3, updated_at = NOW()
      `;
      let params = [username, email, roleId];
      
      if (password && password.trim() !== '') {
        const passwordHash = await bcrypt.hash(password, 12);
        query += `, password_hash = $4`;
        params.push(passwordHash);
        query += ` WHERE id = $5`;
        params.push(id);
      } else {
        query += ` WHERE id = $4`;
        params.push(id);
      }
      
      query += ` RETURNING id, username, email, role_id, is_active`;

      const result = await storage.db.query(query, params);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        user: result.rows[0]
      });
    } catch (error: any) {
      console.error("Error updating user:", error);
      if (error.code === '23505') {
        res.status(400).json({ success: false, message: "Username or email already exists" });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  });

  // Toggle user active status
  app.put("/api/admin/users/:id/status", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      
      const result = await storage.db.query(`
        UPDATE users 
        SET is_active = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, username, email, is_active
      `, [isActive, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        user: result.rows[0]
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get database statistics
  app.get("/api/admin/database/stats", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      
      const tableStats = await pool.query(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as total_inserts,
          n_tup_upd as total_updates,
          n_tup_del as total_deletes,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC;
      `);
      
      const dbSize = await pool.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;
      `);
      
      const tableCount = await pool.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public';
      `);
      
      res.json({
        database_size: dbSize.rows[0].database_size,
        table_count: parseInt(tableCount.rows[0].table_count),
        table_stats: tableStats.rows
      });
    } catch (error) {
      console.error("Error getting database stats:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Create inventory transaction and update stock
  app.post("/api/inventory/transaction", requireAuth, async (req, res) => {
    try {
      const { productId, transactionType, quantity, reason, reference, scannedBarcode } = req.body;
      
      // Get current product
      const product = await storage.getProductById(productId);
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found" 
        });
      }
      
      const previousStock = product.stockQuantity || 0;
      let newStock;
      
      if (transactionType === 'in') {
        newStock = previousStock + Math.abs(quantity);
      } else if (transactionType === 'out') {
        newStock = Math.max(0, previousStock - Math.abs(quantity));
      } else if (transactionType === 'audit') {
        newStock = Math.abs(quantity);
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid transaction type" 
        });
      }
      
      // Update product stock
      await storage.updateProduct(productId, { stockQuantity: newStock });
      
      // Log transaction
      console.log('Inventory transaction:', {
        productId,
        transactionType,
        quantity,
        previousStock,
        newStock,
        reason,
        reference,
        scannedBarcode,
        userId: req.session.adminId,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        success: true,
        previousStock,
        newStock,
        quantity: transactionType === 'out' ? -Math.abs(quantity) : Math.abs(quantity)
      });
    } catch (error) {
      console.error("Error creating inventory transaction:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Get mock inventory transactions for now
  app.get("/api/inventory/transactions", requireAuth, async (req, res) => {
    try {
      // Return empty array for now - can be extended with actual transaction storage
      res.json([]);
    } catch (error) {
      console.error("Error fetching inventory transactions:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Product inquiry routes
  app.post("/api/inquiries", async (req, res) => {
    try {
      const inquiryData = insertCustomerInquirySchema.parse(req.body);
      const inquiry = await simpleCustomerStorage.createInquiry(inquiryData);
      
      // Send email notification for the inquiry
      try {
        // Get product name for email
        let productName = 'Product';
        if (inquiryData.productIds && Array.isArray(inquiryData.productIds) && inquiryData.productIds.length > 0) {
          const product = await storage.getProductById(inquiryData.productIds[0]);
          if (product) {
            productName = product.name;
          }
        }

        const emailData = {
          contactEmail: inquiryData.contactEmail,
          contactPhone: inquiryData.contactPhone,
          company: inquiryData.company,
          subject: inquiryData.subject,
          message: inquiryData.message,
          type: inquiryData.type,
          priority: inquiryData.priority || 'normal',
          category: inquiryData.category || 'general',
          productName: productName,
          inquiryNumber: inquiry.inquiryNumber,
        };

        await sendProductInquiryEmail(emailData);
        console.log(`Product inquiry email sent for category: ${inquiryData.category}`);
      } catch (emailError) {
        console.error("Failed to send inquiry email:", emailError);
        // Don't fail the inquiry creation if email fails
      }
      
      res.status(201).json({ 
        success: true, 
        message: "Inquiry submitted successfully",
        inquiry 
      });
    } catch (error) {
      console.error("Error creating inquiry:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid inquiry data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  });



  app.patch("/api/inquiries/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid inquiry ID" 
        });
      }

      const updates = req.body;
      const inquiry = await simpleCustomerStorage.updateInquiry(id, updates);
      res.json({ 
        success: true, 
        message: "Inquiry updated successfully",
        inquiry 
      });
    } catch (error) {
      console.error("Error updating inquiry:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // CRM Lead management routes
  app.post("/api/leads", requireAuth, async (req, res) => {
    try {
      console.log('Creating lead with data:', req.body);
      const leadData = insertLeadSchema.parse(req.body);
      console.log('Parsed lead data:', leadData);
      const lead = await storage.createLead(leadData);
      res.status(201).json(lead);
    } catch (error) {
      console.error('Lead creation error:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid lead data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  });

  app.get("/api/leads", requireAuth, async (req, res) => {
    try {
      const { status, priority, assignedTo, search } = req.query;
      const filters = {
        status: status as string,
        priority: priority as string,
        assignedTo: assignedTo ? parseInt(assignedTo as string) : undefined,
        search: search as string,
      };
      
      const leads = await storage.getLeads(filters);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.get("/api/leads/statistics", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getLeadStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.get("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid lead ID" 
        });
      }

      const lead = await storage.getLeadById(id);
      if (!lead) {
        return res.status(404).json({ 
          success: false, 
          message: "Lead not found" 
        });
      }

      res.json(lead);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.patch("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid lead ID" 
        });
      }

      const leadData = insertLeadSchema.partial().parse(req.body);
      const lead = await storage.updateLead(id, leadData);
      res.json(lead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid lead data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  });

  app.delete("/api/leads/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid lead ID" 
        });
      }

      await storage.deleteLead(id);
      res.json({ success: true, message: "Lead deleted successfully" });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Convert contact to lead
  app.post("/api/contacts/:id/convert-to-lead", requireAuth, async (req, res) => {
    try {
      const contactId = parseInt(req.params.id);
      if (isNaN(contactId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid contact ID" 
        });
      }

      const additionalData = req.body || {};
      const lead = await storage.convertContactToLead(contactId, additionalData);
      res.status(201).json(lead);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Internal server error" 
      });
    }
  });

  // Lead activities routes
  app.post("/api/leads/:leadId/activities", requireAuth, async (req, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      if (isNaN(leadId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid lead ID" 
        });
      }

      const activityData = insertLeadActivitySchema.parse({
        ...req.body,
        leadId,
        createdBy: req.session.adminId
      });
      
      const activity = await storage.createLeadActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid activity data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  });

  app.get("/api/leads/:leadId/activities", requireAuth, async (req, res) => {
    try {
      const leadId = parseInt(req.params.leadId);
      if (isNaN(leadId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid lead ID" 
        });
      }

      const activities = await storage.getLeadActivities(leadId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Shop/E-commerce API endpoints - Inventory-based product management
  app.get("/api/shop/products", async (req, res) => {
    try {
      const products = await shopStorage.getShopProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching shop products:", error);
      res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
  });

  app.get("/api/shop/categories", async (req, res) => {
    try {
      const categories = await shopStorage.getShopCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching shop categories:", error);
      res.status(500).json({ success: false, message: "Failed to fetch categories" });
    }
  });

  app.get("/api/shop/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      const product = await shopStorage.getShopProductById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error("Error fetching shop product:", error);
      res.status(500).json({ success: false, message: "Failed to fetch product" });
    }
  });

  app.post("/api/shop/products", requireAuth, async (req, res) => {
    try {
      const productData = insertShopProductSchema.parse(req.body);
      const product = await shopStorage.createShopProduct(productData);
      res.json({ success: true, product });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid product data", 
          errors: error.errors 
        });
      } else {
        console.error("Error creating shop product:", error);
        res.status(500).json({ success: false, message: "Failed to create product" });
      }
    }
  });

  app.patch("/api/shop/products/:id", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      const updates = req.body;
      const product = await shopStorage.updateShopProduct(productId, updates);
      res.json(product);
    } catch (error) {
      console.error("Error updating shop product:", error);
      res.status(500).json({ success: false, message: "Failed to update product" });
    }
  });

  app.delete("/api/shop/products/:id", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      await shopStorage.deleteShopProduct(productId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shop product:", error);
      res.status(500).json({ success: false, message: "Failed to delete product" });
    }
  });

  // Shop categories management
  app.post("/api/shop/categories", requireAuth, async (req, res) => {
    try {
      const categoryData = insertShopCategorySchema.parse(req.body);
      const category = await shopStorage.createShopCategory(categoryData);
      res.json({ success: true, category });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid category data", 
          errors: error.errors 
        });
      } else {
        console.error("Error creating shop category:", error);
        res.status(500).json({ success: false, message: "Failed to create category" });
      }
    }
  });

  app.patch("/api/shop/categories/:id", requireAuth, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }
      
      const updates = req.body;
      const category = await shopStorage.updateShopCategory(categoryId, updates);
      res.json(category);
    } catch (error) {
      console.error("Error updating shop category:", error);
      res.status(500).json({ success: false, message: "Failed to update category" });
    }
  });

  // Inventory management endpoints
  app.get("/api/shop/inventory/:productId", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      const transactions = await shopStorage.getInventoryTransactions(productId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching inventory transactions:", error);
      res.status(500).json({ success: false, message: "Failed to fetch inventory data" });
    }
  });

  app.post("/api/shop/inventory/update", requireAuth, async (req, res) => {
    try {
      const { productId, newQuantity, reason } = req.body;
      
      if (!productId || newQuantity === undefined || !reason) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: productId, newQuantity, reason" 
        });
      }
      
      await shopStorage.updateProductStock(productId, newQuantity, reason);
      res.json({ success: true, message: "Inventory updated successfully" });
    } catch (error) {
      console.error("Error updating inventory:", error);
      res.status(500).json({ success: false, message: "Failed to update inventory" });
    }
  });

  // Order management endpoints
  app.post("/api/shop/orders", async (req, res) => {
    try {
      const orderData = req.body;
      
      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Create or find customer
      let customer = await shopStorage.getCustomerByEmail(orderData.customer.email);
      if (!customer) {
        customer = await shopStorage.createCustomer({
          email: orderData.customer.email,
          firstName: orderData.customer.firstName,
          lastName: orderData.customer.lastName,
          phone: orderData.customer.phone,
          company: orderData.customer.company || null,
          taxId: null,
          isVerified: false,
          isActive: true,
          totalOrders: 0,
          totalSpent: "0",
          lastOrderDate: null,
          notes: null,
        });
      }

      // Create order
      const order = await shopStorage.createOrder({
        orderNumber,
        customerId: customer.id,
        status: "pending",
        paymentStatus: "pending",
        subtotal: orderData.subtotal.toString(),
        taxAmount: orderData.taxAmount.toString(),
        shippingAmount: orderData.shippingAmount.toString(),
        discountAmount: "0",
        totalAmount: orderData.totalAmount.toString(),
        currency: "USD",
        notes: orderData.notes,
        billingAddress: orderData.billingAddress,
        shippingAddress: orderData.shippingAddress,
        shippingMethod: orderData.shippingMethod,
        trackingNumber: null,
        orderDate: new Date(),
        shippedDate: null,
        deliveredDate: null,
      });

      // Create order items and update inventory
      for (const item of orderData.items) {
        await shopStorage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toString(),
          totalPrice: item.totalPrice.toString(),
          productSnapshot: null,
        });

        // Update product stock
        const product = await shopStorage.getShopProductById(item.productId);
        if (product && product.stockQuantity !== null && product.stockQuantity !== undefined) {
          const newQuantity = product.stockQuantity - item.quantity;
          await shopStorage.updateProductStock(
            item.productId,
            newQuantity,
            `Order ${orderNumber} - Sold ${item.quantity} units`
          );
        }
      }

      // Update customer statistics
      await shopStorage.updateCustomer(customer.id, {
        totalOrders: (customer.totalOrders || 0) + 1,
        totalSpent: (parseFloat(customer.totalSpent || "0") + orderData.totalAmount).toString(),
        lastOrderDate: new Date(),
      });

      // Auto-capture customer data in CRM system
      try {
        await crmStorage.createOrUpdateCustomerFromOrder({
          email: orderData.customer.email,
          firstName: orderData.customer.firstName,
          lastName: orderData.customer.lastName,
          company: orderData.customer.company,
          phone: orderData.customer.phone,
          country: orderData.billingAddress?.country,
          city: orderData.billingAddress?.city,
          address: orderData.billingAddress?.address,
          postalCode: orderData.billingAddress?.postalCode,
          orderValue: orderData.totalAmount,
        });
        console.log(`Customer ${orderData.customer.email} auto-captured in CRM for order ${orderNumber}`);
      } catch (crmError) {
        console.error("Error auto-capturing customer in CRM:", crmError);
        // Don't fail the order if CRM capture fails
      }

      // Create financial transaction for the sale
      await shopStorage.createFinancialTransaction({
        type: 'sale',
        orderId: order.id,
        amount: order.totalAmount,
        description: `Sale from order #${order.orderNumber}`,
        referenceNumber: order.orderNumber,
        status: 'completed',
        processingDate: new Date(),
        metadata: { 
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          paymentStatus: order.paymentStatus
        }
      });

      res.json({ 
        success: true, 
        orderId: order.id,
        orderNumber: order.orderNumber,
        message: "Order created successfully" 
      });
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ success: false, message: "Failed to create order" });
    }
  });

  app.get("/api/shop/orders", async (req, res) => {
    try {
      const orders = await shopStorage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
  });

  app.get("/api/shop/orders/:id", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ success: false, message: "Invalid order ID" });
      }
      
      const order = await shopStorage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      const orderItems = await shopStorage.getOrderItems(orderId);
      res.json({ ...order, items: orderItems });
    } catch (error) {
      console.error("Error fetching order:", error);
      res.status(500).json({ success: false, message: "Failed to fetch order" });
    }
  });

  app.patch("/api/shop/orders/:id", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ success: false, message: "Invalid order ID" });
      }
      
      const updates = req.body;
      const currentOrder = await shopStorage.getOrderById(orderId);
      
      if (!currentOrder) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      
      // If order is being cancelled or refunded, restore inventory
      if (updates.status && (updates.status === 'cancelled' || updates.status === 'refunded') && 
          currentOrder.status !== 'cancelled' && currentOrder.status !== 'refunded') {
        
        const orderItems = await shopStorage.getOrderItems(orderId);
        for (const item of orderItems) {
          const product = await shopStorage.getShopProductById(item.productId);
          if (product && product.stockQuantity !== null && product.stockQuantity !== undefined) {
            const newQuantity = product.stockQuantity + item.quantity;
            await shopStorage.updateProductStock(
              item.productId,
              newQuantity,
              `Order ${currentOrder.orderNumber} ${updates.status} - Restored ${item.quantity} units`
            );
          }
        }
      }
      
      const order = await shopStorage.updateOrder(orderId, updates);
      res.json(order);
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ success: false, message: "Failed to update order" });
    }
  });

  // Order statistics for dashboard
  app.get("/api/shop/statistics", async (req, res) => {
    try {
      const stats = await shopStorage.getOrderStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching shop statistics:", error);
      res.status(500).json({ success: false, message: "Failed to fetch statistics" });
    }
  });

  // Discount settings management
  app.get("/api/shop/discounts", async (req, res) => {
    try {
      const discounts = await shopStorage.getDiscountSettings();
      res.json(discounts);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      res.status(500).json({ success: false, message: "Failed to fetch discounts" });
    }
  });

  app.get("/api/shop/discounts/active", async (req, res) => {
    try {
      const discounts = await shopStorage.getActiveDiscountSettings();
      res.json(discounts);
    } catch (error) {
      console.error("Error fetching active discounts:", error);
      res.status(500).json({ success: false, message: "Failed to fetch active discounts" });
    }
  });

  app.post("/api/shop/discounts", async (req, res) => {
    try {
      const discountData = req.body;
      const discount = await shopStorage.createDiscountSetting(discountData);
      res.json(discount);
    } catch (error) {
      console.error("Error creating discount:", error);
      res.status(500).json({ success: false, message: "Failed to create discount" });
    }
  });

  app.patch("/api/shop/discounts/:id", async (req, res) => {
    try {
      const discountId = parseInt(req.params.id);
      if (isNaN(discountId)) {
        return res.status(400).json({ success: false, message: "Invalid discount ID" });
      }
      
      const updates = req.body;
      const discount = await shopStorage.updateDiscountSetting(discountId, updates);
      res.json(discount);
    } catch (error) {
      console.error("Error updating discount:", error);
      res.status(500).json({ success: false, message: "Failed to update discount" });
    }
  });

  app.delete("/api/shop/discounts/:id", async (req, res) => {
    try {
      const discountId = parseInt(req.params.id);
      if (isNaN(discountId)) {
        return res.status(400).json({ success: false, message: "Invalid discount ID" });
      }
      
      await shopStorage.deleteDiscountSetting(discountId);
      res.json({ success: true, message: "Discount deleted successfully" });
    } catch (error) {
      console.error("Error deleting discount:", error);
      res.status(500).json({ success: false, message: "Failed to delete discount" });
    }
  });

  // Financial transactions endpoints for accounting
  app.get("/api/shop/financial-transactions", async (req, res) => {
    try {
      const { type, startDate, endDate, orderId } = req.query;
      const filters: any = {};
      
      if (type) filters.type = type as string;
      if (orderId) filters.orderId = parseInt(orderId as string);
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const transactions = await shopStorage.getFinancialTransactions(filters);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching financial transactions:", error);
      res.status(500).json({ success: false, message: "Failed to fetch financial transactions" });
    }
  });

  app.post("/api/shop/financial-transactions", async (req, res) => {
    try {
      const transaction = await shopStorage.createFinancialTransaction(req.body);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating financial transaction:", error);
      res.status(500).json({ success: false, message: "Failed to create financial transaction" });
    }
  });

  // Sales reports endpoints
  app.get("/api/shop/sales-reports", async (req, res) => {
    try {
      const { reportType, startDate, endDate } = req.query;
      const filters: any = {};
      
      if (reportType) filters.reportType = reportType as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);

      const reports = await shopStorage.getSalesReports(filters);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching sales reports:", error);
      res.status(500).json({ success: false, message: "Failed to fetch sales reports" });
    }
  });

  app.post("/api/shop/sales-reports", async (req, res) => {
    try {
      const report = await shopStorage.createSalesReport(req.body);
      res.json(report);
    } catch (error) {
      console.error("Error creating sales report:", error);
      res.status(500).json({ success: false, message: "Failed to create sales report" });
    }
  });

  // Real-time accounting statistics
  app.get("/api/shop/accounting-stats", async (req, res) => {
    try {
      const stats = await shopStorage.getAccountingStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching accounting stats:", error);
      res.status(500).json({ success: false, message: "Failed to fetch accounting stats" });
    }
  });

  // Process refund/return
  app.post("/api/shop/orders/:id/refund", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { amount, reason, type } = req.body;
      
      await shopStorage.processOrderRefund(orderId, amount, reason, type);
      res.json({ success: true, message: `${type === 'refund' ? 'Refund' : 'Return'} processed successfully` });
    } catch (error) {
      console.error("Error processing refund/return:", error);
      res.status(500).json({ success: false, message: "Failed to process refund/return" });
    }
  });

  // Product synchronization endpoint
  app.post("/api/sync-products", requireAuth, async (req, res) => {
    try {
      await storage.syncAllProductsToShop();
      res.json({ success: true, message: "All products synchronized successfully" });
    } catch (error) {
      console.error("Error syncing products:", error);
      res.status(500).json({ success: false, message: "Failed to sync products" });
    }
  });

  // Sales analytics endpoint
  app.get("/api/analytics/sales", requireAuth, async (req, res) => {
    try {
      // Get all orders with order items
      const orders = await shopStorage.getOrders();
      
      // Build comprehensive order data with items
      const ordersWithItems = [];
      for (const order of orders) {
        const orderItems = await shopStorage.getOrderItems(order.id);
        for (const item of orderItems) {
          ordersWithItems.push({
            ...order,
            product_name: item.productName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            item_total: parseFloat(item.unitPrice) * item.quantity
          });
        }
      }

      // Calculate key metrics
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.totalAmount || '0'), 0);
      const totalOrders = orders.length;
      const averageOrderValue = totalRevenue / totalOrders || 0;
      
      // Get unique customers from shop_customers
      const customers = await shopStorage.getCustomers();
      const uniqueCustomers = customers.length;
      
      // Calculate growth rate (comparing last 15 days vs previous 15 days)
      const now = new Date();
      const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const recentOrders = orders.filter(o => new Date(o.createdAt) >= fifteenDaysAgo);
      const previousOrders = orders.filter(o => 
        new Date(o.createdAt) >= thirtyDaysAgo && new Date(o.createdAt) < fifteenDaysAgo
      );
      
      const recentRevenue = recentOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);
      const previousRevenue = previousOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || '0'), 0);
      const growthRate = previousRevenue > 0 ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 : 0;

      // Generate daily sales data for last 30 days
      const dailySales = [];
      const ordersByDate = new Map();
      
      orders.forEach(order => {
        const date = order.createdAt.toISOString().split('T')[0];
        if (!ordersByDate.has(date)) {
          ordersByDate.set(date, { revenue: 0, orderIds: new Set() });
        }
        ordersByDate.get(date).revenue += parseFloat(order.totalAmount || '0');
        ordersByDate.get(date).orderIds.add(order.id);
      });

      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayData = ordersByDate.get(dateStr);
        dailySales.push({
          date: dateStr,
          revenue: dayData?.revenue || 0,
          orders: dayData?.orderIds.size || 0
        });
      }

      // Top products by revenue
      const productSales = new Map();
      ordersWithItems.forEach(orderItem => {
        if (orderItem.product_name) {
          const key = orderItem.product_name;
          if (!productSales.has(key)) {
            productSales.set(key, { 
              name: key, 
              revenue: 0, 
              quantity: 0, 
              orderIds: new Set() 
            });
          }
          const product = productSales.get(key);
          product.revenue += orderItem.item_total;
          product.quantity += orderItem.quantity;
          product.orderIds.add(orderItem.id);
        }
      });

      const topProducts = Array.from(productSales.values())
        .map(p => ({ ...p, orders: p.orderIds.size }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Orders by status
      const statusCounts = new Map();
      orders.forEach(order => {
        const status = order.status;
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
      });

      const ordersByStatus = Array.from(statusCounts.entries()).map(([status, count]) => ({
        status: status || 'unknown',
        count,
        percentage: (count / totalOrders) * 100
      }));

      // Revenue by category - analyze product names
      const categoryMapping = {
        'Chemicals': ['chemical', 'thinner', 'clarifier', 'stabilizer'],
        'Fertilizers': ['fertilizer', 'npk'],
        'Additives': ['additive', 'anti-gel'],
        'Cleaners': ['cleaner', 'system']
      };

      const revenueByCategory = Object.entries(categoryMapping).map(([category, keywords]) => {
        const categoryRevenue = topProducts
          .filter(p => keywords.some(keyword => 
            p.name.toLowerCase().includes(keyword.toLowerCase())
          ))
          .reduce((sum, p) => sum + p.revenue, 0);
        
        return {
          category,
          revenue: categoryRevenue,
          percentage: totalRevenue > 0 ? (categoryRevenue / totalRevenue) * 100 : 0
        };
      }).filter(c => c.revenue > 0);

      const analyticsData = {
        totalRevenue,
        totalOrders,
        averageOrderValue,
        totalCustomers: uniqueCustomers,
        conversionRate: totalOrders > 0 ? (totalOrders / (totalOrders + 5)) * 100 : 0, // Simple conversion estimate
        growthRate,
        dailySales,
        topProducts,
        ordersByStatus,
        revenueByCategory
      };

      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
      res.status(500).json({ success: false, message: "Failed to fetch analytics" });
    }
  });

  // Export sales report endpoint
  app.get("/api/analytics/sales/export", requireAuth, async (req, res) => {
    try {
      const format = req.query.format as string || 'csv';
      
      // Get all orders with items
      const orders = await shopStorage.getOrders();
      
      // Build detailed report data
      const reportData = [];
      for (const order of orders) {
        const orderItems = await shopStorage.getOrderItems(order.id);
        const customer = await shopStorage.getCustomerById(order.customerId);
        
        for (const item of orderItems) {
          reportData.push({
            orderNumber: order.orderNumber,
            orderDate: order.createdAt.toISOString().split('T')[0],
            customerName: customer ? `${customer.firstName} ${customer.lastName}` : 'N/A',
            customerEmail: customer?.email || 'N/A',
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice),
            itemTotal: parseFloat(item.unitPrice) * item.quantity,
            orderStatus: order.status,
            paymentStatus: order.paymentStatus,
            subtotal: parseFloat(order.subtotal || '0'),
            taxAmount: parseFloat(order.taxAmount || '0'),
            shippingAmount: parseFloat(order.shippingAmount || '0'),
            totalAmount: parseFloat(order.totalAmount || '0'),
            currency: order.currency || 'USD'
          });
        }
      }

      if (format === 'csv') {
        // Generate CSV
        const csvHeaders = [
          'Order Number', 'Order Date', 'Customer Name', 'Customer Email',
          'Product Name', 'Quantity', 'Unit Price', 'Item Total',
          'Order Status', 'Payment Status', 'Subtotal', 'Tax Amount',
          'Shipping Amount', 'Total Amount', 'Currency'
        ].join(',');
        
        const csvRows = reportData.map(row => [
          row.orderNumber,
          row.orderDate,
          `"${row.customerName}"`,
          row.customerEmail,
          `"${row.productName}"`,
          row.quantity,
          row.unitPrice.toFixed(2),
          row.itemTotal.toFixed(2),
          row.orderStatus,
          row.paymentStatus,
          row.subtotal.toFixed(2),
          row.taxAmount.toFixed(2),
          row.shippingAmount.toFixed(2),
          row.totalAmount.toFixed(2),
          row.currency
        ].join(','));
        
        const csvContent = [csvHeaders, ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="sales-report-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      } else {
        // Return JSON for other formats or direct download
        res.json({
          success: true,
          data: reportData,
          summary: {
            totalOrders: orders.length,
            totalRevenue: reportData.reduce((sum, item) => sum + item.itemTotal, 0),
            reportDate: new Date().toISOString().split('T')[0]
          }
        });
      }
    } catch (error) {
      console.error("Error generating sales report:", error);
      res.status(500).json({ success: false, message: "Failed to generate sales report" });
    }
  });

  // Email template management routes
  app.get("/api/email-templates", requireAuth, async (req, res) => {
    try {
      const templates = await customerStorage.getEmailTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.get("/api/email-templates/category/:category", requireAuth, async (req, res) => {
    try {
      const { category } = req.params;
      const templates = await customerStorage.getEmailTemplatesByCategory(category);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates by category:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.get("/api/email-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid template ID" 
        });
      }

      const template = await customerStorage.getEmailTemplateById(id);
      if (!template) {
        return res.status(404).json({ 
          success: false, 
          message: "Template not found" 
        });
      }

      res.json(template);
    } catch (error) {
      console.error("Error fetching email template:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.post("/api/email-templates", requireAuth, async (req, res) => {
    try {
      const sessionData = req.session;
      const templateData = insertEmailTemplateSchema.parse({
        ...req.body,
        createdBy: sessionData.adminId
      });
      
      const template = await customerStorage.createEmailTemplate(templateData);
      res.status(201).json({ 
        success: true, 
        message: "Email template created successfully",
        template 
      });
    } catch (error) {
      console.error("Error creating email template:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid template data", 
          errors: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Internal server error" 
        });
      }
    }
  });

  app.patch("/api/email-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid template ID" 
        });
      }

      const updates = req.body;
      const template = await customerStorage.updateEmailTemplate(id, updates);
      res.json({ 
        success: true, 
        message: "Email template updated successfully",
        template 
      });
    } catch (error) {
      console.error("Error updating email template:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.delete("/api/email-templates/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid template ID" 
        });
      }

      await customerStorage.deleteEmailTemplate(id);
      res.json({ 
        success: true, 
        message: "Email template deleted successfully" 
      });
    } catch (error) {
      console.error("Error deleting email template:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.post("/api/email-templates/:id/set-default", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid template ID" 
        });
      }

      const { category } = req.body;
      if (!category) {
        return res.status(400).json({ 
          success: false, 
          message: "Category is required" 
        });
      }

      await customerStorage.setDefaultTemplate(id, category);
      res.json({ 
        success: true, 
        message: "Default template set successfully" 
      });
    } catch (error) {
      console.error("Error setting default template:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Template processing routes
  app.post("/api/templates/send-response", requireAuth, async (req, res) => {
    try {
      const { inquiryId, templateId, customVariables, customContent } = req.body;
      
      if (!inquiryId || !templateId) {
        return res.status(400).json({
          success: false,
          message: "Inquiry ID and Template ID are required"
        });
      }

      await TemplateProcessor.sendTemplatedResponse(
        inquiryId,
        templateId,
        customVariables,
        customContent
      );

      res.json({
        success: true,
        message: "Email response sent successfully"
      });
    } catch (error) {
      console.error("Error sending templated response:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send email response"
      });
    }
  });

  app.post("/api/templates/preview", requireAuth, async (req, res) => {
    try {
      const { templateId, variables } = req.body;
      
      const template = await customerStorage.getEmailTemplateById(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Template not found"
        });
      }

      const preview = TemplateProcessor.previewTemplate(template, variables || {});
      
      res.json({
        success: true,
        preview
      });
    } catch (error) {
      console.error("Error previewing template:", error);
      res.status(500).json({
        success: false,
        message: "Failed to preview template"
      });
    }
  });

  app.get("/api/templates/suggestions/:category", requireAuth, async (req, res) => {
    try {
      const { category } = req.params;
      const { language = 'en' } = req.query;
      
      const suggestions = await TemplateProcessor.getTemplateSuggestions(
        category, 
        language as string
      );
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error getting template suggestions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get template suggestions"
      });
    }
  });

  // Dashboard and inquiry tracking routes (public)
  app.get("/api/inquiries", async (req, res) => {
    try {
      const inquiries = await simpleCustomerStorage.getAllInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch inquiries"
      });
    }
  });

  app.get("/api/inquiries/stats", async (req, res) => {
    try {
      const stats = await simpleCustomerStorage.getCustomerStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching inquiry stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch inquiry statistics"
      });
    }
  });

  app.get("/api/inquiries/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inquiry ID"
        });
      }

      const inquiry = await simpleCustomerStorage.getInquiryById(id);
      if (!inquiry) {
        return res.status(404).json({
          success: false,
          message: "Inquiry not found"
        });
      }

      res.json(inquiry);
    } catch (error) {
      console.error("Error fetching inquiry:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch inquiry"
      });
    }
  });

  app.get("/api/inquiries/:id/responses", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inquiry ID"
        });
      }

      const responses = await simpleCustomerStorage.getInquiryResponses(id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching inquiry responses:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch inquiry responses"
      });
    }
  });

  // Quote request routes (public)
  app.post("/api/quote-requests", async (req, res) => {
    try {
      const { firstName, lastName, email, phone, company, productName, category, quantity, urgency, message } = req.body;
      
      if (!firstName || !lastName || !email || !productName || !company) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields"
        });
      }

      // Generate quote number
      const quoteNumber = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const quoteRequest = await customerStorage.createQuoteRequest({
        quoteNumber,
        contactEmail: email,
        contactPhone: phone,
        company,
        deliveryLocation: "To be determined",
        requestedProducts: [{
          name: productName,
          category: category || "general",
          quantity: quantity || "To be discussed",
          urgency: urgency || "normal"
        }],
        specialRequirements: message || "",
        priority: urgency || "normal",
        notes: `Contact: ${firstName} ${lastName}`,
      });

      res.json({
        success: true,
        message: "Quote request submitted successfully",
        quoteNumber: quoteRequest.quoteNumber
      });
    } catch (error) {
      console.error("Error creating quote request:", error);
      res.status(500).json({
        success: false,
        message: "Failed to submit quote request"
      });
    }
  });

  // Inventory monitoring routes
  app.post("/api/inventory/check-all", requireAuth, async (req, res) => {
    try {
      await InventoryAlertService.checkInventoryLevels();
      res.json({
        success: true,
        message: "Inventory check completed and alerts sent if needed"
      });
    } catch (error) {
      console.error("Error checking inventory:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check inventory levels"
      });
    }
  });

  app.post("/api/inventory/check-product/:id", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const alertSent = await InventoryAlertService.checkProductInventory(productId);
      
      res.json({
        success: true,
        alertSent,
        message: alertSent ? "Alert sent for low stock" : "Stock levels are adequate"
      });
    } catch (error) {
      console.error("Error checking product inventory:", error);
      res.status(500).json({
        success: false,
        message: "Failed to check product inventory"
      });
    }
  });

  // =============================================================================
  // SPECIALISTS MANAGEMENT API ROUTES (Admin)
  // =============================================================================

  // Get all specialists
  app.get("/api/admin/specialists", requireAuth, async (req, res) => {
    try {
      const specialists = await db.select().from(schema.specialists);
      res.json(specialists);
    } catch (error) {
      console.error("Error fetching specialists:", error);
      res.status(500).json({ message: "Failed to fetch specialists" });
    }
  });

  // Get specialist by ID
  app.get("/api/admin/specialists/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const [specialist] = await db.select().from(schema.specialists).where(eq(schema.specialists.id, id));
      
      if (!specialist) {
        return res.status(404).json({ message: "Specialist not found" });
      }
      
      res.json(specialist);
    } catch (error) {
      console.error("Error fetching specialist:", error);
      res.status(500).json({ message: "Failed to fetch specialist" });
    }
  });

  // Create new specialist
  app.post("/api/admin/specialists", requireAuth, async (req, res) => {
    try {
      const specialistData = req.body;
      
      if (!specialistData.name || !specialistData.email || !specialistData.department) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Remove timestamp fields and let the database handle them
      const { createdAt, updatedAt, id, ...cleanSpecialistData } = specialistData;

      const [newSpecialist] = await db.insert(schema.specialists)
        .values({
          ...cleanSpecialistData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.status(201).json(newSpecialist);
    } catch (error) {
      console.error("Error creating specialist:", error);
      if (error.code === '23505') { // Unique violation
        res.status(409).json({ message: "Email already exists" });
      } else {
        res.status(500).json({ message: "Failed to create specialist" });
      }
    }
  });

  // Update specialist
  app.put("/api/admin/specialists/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate required fields
      if (!id) {
        return res.status(400).json({ message: "Specialist ID is required" });
      }

      // Create a safe update object with only allowed fields
      const safeUpdateData: any = {};
      
      if (updateData.name) safeUpdateData.name = updateData.name;
      if (updateData.email) safeUpdateData.email = updateData.email;
      if (updateData.phone !== undefined) safeUpdateData.phone = updateData.phone;
      if (updateData.department) safeUpdateData.department = updateData.department;
      if (updateData.status) safeUpdateData.status = updateData.status;
      if (updateData.expertise) safeUpdateData.expertise = updateData.expertise;
      if (updateData.isActive !== undefined) safeUpdateData.isActive = updateData.isActive;
      if (updateData.workingHours) safeUpdateData.workingHours = updateData.workingHours;

      // Always set updatedAt to current time
      safeUpdateData.updatedAt = new Date();

      const [updatedSpecialist] = await db.update(schema.specialists)
        .set(safeUpdateData)
        .where(eq(schema.specialists.id, id))
        .returning();

      if (!updatedSpecialist) {
        return res.status(404).json({ message: "Specialist not found" });
      }

      res.json(updatedSpecialist);
    } catch (error) {
      console.error("Error updating specialist:", error);
      res.status(500).json({ message: "Failed to update specialist" });
    }
  });

  // Delete specialist
  app.delete("/api/admin/specialists/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;

      const [deletedSpecialist] = await db.delete(schema.specialists)
        .where(eq(schema.specialists.id, id))
        .returning();

      if (!deletedSpecialist) {
        return res.status(404).json({ message: "Specialist not found" });
      }

      res.json({ message: "Specialist deleted successfully" });
    } catch (error) {
      console.error("Error deleting specialist:", error);
      res.status(500).json({ message: "Failed to delete specialist" });
    }
  });

  // Update specialist status (for real-time status changes)
  app.patch("/api/admin/specialists/:id/status", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['online', 'busy', 'away', 'offline'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const [updatedSpecialist] = await db.update(schema.specialists)
        .set({ 
          status,
          updatedAt: new Date()
        })
        .where(eq(schema.specialists.id, id))
        .returning();

      if (!updatedSpecialist) {
        return res.status(404).json({ message: "Specialist not found" });
      }

      res.json(updatedSpecialist);
    } catch (error) {
      console.error("Error updating specialist status:", error);
      res.status(500).json({ message: "Failed to update specialist status" });
    }
  });

  // Get online specialists (public route for live chat)
  app.get("/api/specialists/online", async (req, res) => {
    try {
      const onlineSpecialists = await db.select().from(schema.specialists)
        .where(and(
          eq(schema.specialists.isActive, true),
          eq(schema.specialists.status, 'online')
        ));
      
      res.json(onlineSpecialists);
    } catch (error) {
      console.error("Error fetching online specialists:", error);
      res.status(500).json({ message: "Failed to fetch online specialists" });
    }
  });

  // =============================================================================
  // SMTP TEST ROUTES (Admin only)
  // =============================================================================
  
  // Test SMTP connection
  app.post("/api/admin/test-smtp", requireAuth, async (req, res) => {
    try {
      const { host, port, secure, user, pass, fromName, fromEmail } = req.body;
      
      if (!host || !port || !user || !pass || !fromEmail) {
        return res.status(400).json({
          success: false,
          message: "Missing required SMTP parameters"
        });
      }

      const { testZohoSMTP } = await import('./test-smtp');
      const result = await testZohoSMTP(user, pass, fromEmail);
      res.json(result);
    } catch (error) {
      console.error("Error testing SMTP:", error);
      res.status(500).json({
        success: false,
        message: "Failed to test SMTP connection"
      });
    }
  });

  // Send test email
  app.post("/api/admin/test-email", requireAuth, async (req, res) => {
    try {
      const { email } = req.body;
      const { sendTestEmail } = await import('./test-smtp');
      const result = await sendTestEmail(email);
      res.json(result);
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send test email"
      });
    }
  });

  // SMTP Configuration Validator
  app.post("/api/admin/validate-smtp", requireAuth, async (req, res) => {
    try {
      const { email, password, customHost, customPort } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Email and password are required"
        });
      }

      const { SMTPValidator } = await import('./smtp-validator');
      const result = await SMTPValidator.validateConfiguration(
        email, 
        password, 
        customHost, 
        customPort
      );
      
      res.json({
        success: result.isValid,
        ...result
      });
    } catch (error) {
      console.error("Error validating SMTP:", error);
      res.status(500).json({
        success: false,
        message: "Failed to validate SMTP configuration"
      });
    }
  });

  // Initialize default email categories if they don't exist
  app.post("/api/admin/email/init-categories", requireAuth, async (req, res) => {
    try {
      const defaultCategories = [
        {
          categoryKey: "admin",
          categoryName: "Admin & General Contact",
          description: "Main administrative and general contact email",
        },
        {
          categoryKey: "fuel-additives",
          categoryName: "Fuel Additives Department",
          description: "Dedicated email for fuel additives inquiries and orders",
        },
        {
          categoryKey: "water-treatment",
          categoryName: "Water Treatment Department",
          description: "Dedicated email for water treatment solutions",
        },
        {
          categoryKey: "agricultural-fertilizers",
          categoryName: "Agricultural Fertilizers Department",
          description: "Dedicated email for fertilizer products and agricultural solutions",
        },
        {
          categoryKey: "paint-thinner",
          categoryName: "Paint & Thinner Department",
          description: "Dedicated email for paint and thinner products",
        },
        {
          categoryKey: "orders",
          categoryName: "Order Processing",
          description: "Handles order confirmations and processing",
        },
        {
          categoryKey: "notifications",
          categoryName: "System Notifications",
          description: "Receives system alerts and notifications",
        }
      ];

      const createdCategories = [];
      
      for (const categoryData of defaultCategories) {
        const existing = await emailStorage.getCategoryByKey(categoryData.categoryKey);
        if (!existing) {
          const category = await emailStorage.createCategory(categoryData);
          createdCategories.push(category);
        }
      }

      res.json({
        success: true,
        message: `Initialized ${createdCategories.length} categories`,
        categories: createdCategories
      });
    } catch (error) {
      console.error("Error initializing categories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to initialize categories"
      });
    }
  });

  // Get all email categories with their settings
  app.get("/api/admin/email/categories", requireAuth, async (req, res) => {
    try {
      const categories = await emailStorage.getCategories();
      const categoriesWithSettings = [];

      for (const category of categories) {
        const smtp = await emailStorage.getSmtpSettingByCategory(category.id);
        const recipients = await emailStorage.getRecipientsByCategory(category.id);
        
        categoriesWithSettings.push({
          ...category,
          smtp: smtp || null,
          recipients
        });
      }

      res.json({
        success: true,
        categories: categoriesWithSettings
      });
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch categories"
      });
    }
  });

  // Create/Update SMTP settings for a category
  app.post("/api/admin/email/smtp/:categoryId", requireAuth, async (req, res) => {
    try {
      const { categoryId } = req.params;
      console.log("Received SMTP data:", req.body);
      
      // Manual validation instead of strict schema
      const {
        host,
        port,
        secure,
        username,
        password,
        fromName,
        fromEmail
      } = req.body;

      if (!host || !username || !password || !fromName || !fromEmail) {
        return res.status(400).json({
          success: false,
          message: "All SMTP fields are required"
        });
      }

      const smtpData = {
        host: host.toString(),
        port: parseInt(port) || 587,
        secure: Boolean(secure),
        username: username.toString(),
        password: password.toString(),
        fromName: fromName.toString(),
        fromEmail: fromEmail.toString(),
        categoryId: parseInt(categoryId)
      };

      console.log("Processed SMTP data:", smtpData);
      
      // Check if SMTP settings already exist for this category
      const existing = await emailStorage.getSmtpSettingByCategory(parseInt(categoryId));
      
      let smtp;
      if (existing) {
        console.log("Updating existing SMTP settings");
        smtp = await emailStorage.updateSmtpSetting(existing.id, smtpData);
      } else {
        console.log("Creating new SMTP settings");
        smtp = await emailStorage.createSmtpSetting(smtpData);
      }

      res.json({
        success: true,
        message: "SMTP settings saved successfully",
        smtp
      });
    } catch (error) {
      console.error("Error saving SMTP settings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save SMTP settings",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Test SMTP connection for a category
  app.post("/api/admin/email/test-smtp/:categoryId", requireAuth, async (req, res) => {
    try {
      const { categoryId } = req.params;
      const smtp = await emailStorage.getSmtpSettingByCategory(parseInt(categoryId));
      
      if (!smtp) {
        return res.status(404).json({
          success: false,
          message: "SMTP settings not found for this category"
        });
      }

      const success = await emailStorage.testSmtpConnection(smtp.id);
      
      res.json({
        success,
        message: success ? "SMTP connection test successful" : "SMTP connection test failed"
      });
    } catch (error) {
      console.error("SMTP test failed:", error);
      res.status(500).json({
        success: false,
        message: `SMTP test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Add/Update email recipients for a category
  app.post("/api/admin/email/recipients/:categoryId", requireAuth, async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { recipients } = req.body;
      
      // Delete existing recipients for this category
      const existingRecipients = await emailStorage.getRecipientsByCategory(parseInt(categoryId));
      for (const recipient of existingRecipients) {
        await emailStorage.deleteRecipient(recipient.id);
      }
      
      // Add new recipients
      const createdRecipients = [];
      for (const recipientData of recipients) {
        const recipient = await emailStorage.createRecipient({
          ...recipientData,
          categoryId: parseInt(categoryId)
        });
        createdRecipients.push(recipient);
      }

      res.json({
        success: true,
        message: "Recipients updated successfully",
        recipients: createdRecipients
      });
    } catch (error) {
      console.error("Error updating recipients:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update recipients"
      });
    }
  });

  // Legacy endpoint for compatibility
  app.get("/api/admin/email-settings", requireAuth, async (req, res) => {
    try {
      const categories = await emailStorage.getCategories();
      const emailSettings = [];

      for (const category of categories) {
        const recipients = await emailStorage.getRecipientsByCategory(category.id);
        const primaryRecipient = recipients.find(r => r.isPrimary);
        
        emailSettings.push({
          id: category.id,
          category: category.categoryKey,
          name: category.categoryName,
          description: category.description,
          emailAddress: primaryRecipient?.email || "info@momtazchem.com",
          isActive: category.isActive,
          isPrimary: category.categoryKey === "admin",
          usage: recipients.flatMap(r => r.receiveTypes || [])
        });
      }

      // Get SMTP settings from database only
      const smtpSettings = null; // No fallback - only use database settings

      res.json({
        success: true,
        emailSettings,
        smtpSettings
      });
    } catch (error) {
      console.error("Error fetching email settings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch email settings"
      });
    }
  });

  app.post("/api/admin/email-settings", requireAuth, async (req, res) => {
    try {
      const { emailSettings } = req.body;
      
      // In a real implementation, you would save these to database
      // For now, we'll just return success
      console.log("Email settings updated:", emailSettings);
      
      res.json({
        success: true,
        message: "Email settings saved successfully"
      });
    } catch (error) {
      console.error("Error saving email settings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save email settings"
      });
    }
  });

  app.post("/api/admin/smtp-settings", requireAuth, async (req, res) => {
    try {
      const { host, port, secure, user, pass, fromName, fromEmail } = req.body;
      
      // In a real implementation, you would save these to environment or database
      console.log("SMTP settings updated:", { host, port, secure, user, fromName, fromEmail });
      
      res.json({
        success: true,
        message: "SMTP settings saved successfully"
      });
    } catch (error) {
      console.error("Error saving SMTP settings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save SMTP settings"
      });
    }
  });

  app.post("/api/admin/test-smtp", requireAuth, async (req, res) => {
    try {
      const { host, port, secure, user, pass } = req.body;
      
      if (!host || !port || !user || !pass) {
        return res.status(400).json({
          success: false,
          message: "All SMTP fields are required for testing"
        });
      }

      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransporter({
        host,
        port: parseInt(port),
        secure: secure || port == 465,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 5000,
      });

      await transporter.verify();
      
      res.json({
        success: true,
        message: "SMTP connection test successful"
      });
    } catch (error) {
      console.error("SMTP test failed:", error);
      res.status(500).json({
        success: false,
        message: `SMTP test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  });

  // Detect email provider
  app.post("/api/admin/detect-provider", requireAuth, async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required"
        });
      }

      const { SMTPValidator } = await import('./smtp-validator');
      const provider = SMTPValidator.detectProvider(email);
      const config = SMTPValidator.generateOptimalConfig(email);
      
      res.json({
        success: true,
        provider,
        recommendedConfig: config
      });
    } catch (error) {
      console.error("Error detecting provider:", error);
      res.status(500).json({
        success: false,
        message: "Failed to detect email provider"
      });
    }
  });

  // =============================================================================
  // CRM ROUTES - Professional Customer Relationship Management
  // =============================================================================

  // Get CRM dashboard statistics
  app.get("/api/crm/dashboard", requireAuth, async (req, res) => {
    try {
      const stats = await crmStorage.getCrmDashboardStats();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error("Error fetching CRM dashboard stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch dashboard statistics"
      });
    }
  });

  // Get all CRM customers with pagination
  app.get("/api/crm/customers", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const customers = await crmStorage.getCrmCustomers(limit, offset);
      res.json({
        success: true,
        data: customers,
        pagination: {
          limit,
          offset,
          count: customers.length
        }
      });
    } catch (error) {
      console.error("Error fetching CRM customers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customers"
      });
    }
  });

  // Search CRM customers
  app.get("/api/crm/customers/search", requireAuth, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Search query must be at least 2 characters"
        });
      }

      const customers = await crmStorage.searchCrmCustomers(query);
      res.json({
        success: true,
        data: customers
      });
    } catch (error) {
      console.error("Error searching CRM customers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search customers"
      });
    }
  });

  // Get specific CRM customer by ID
  app.get("/api/crm/customers/:id", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const customer = await crmStorage.getCrmCustomerById(customerId);
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found"
        });
      }

      // Get customer analytics
      const analytics = await crmStorage.getCustomerAnalytics(customerId);
      
      // Get customer activities
      const activities = await crmStorage.getCustomerActivities(customerId, 20);

      res.json({
        success: true,
        data: {
          customer,
          analytics,
          activities
        }
      });
    } catch (error) {
      console.error("Error fetching CRM customer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customer"
      });
    }
  });

  // Create new CRM customer
  app.post("/api/crm/customers", requireAuth, async (req, res) => {
    try {
      const validatedData = insertCrmCustomerSchema.parse(req.body);
      validatedData.createdBy = "admin";
      
      const customer = await crmStorage.createCrmCustomer(validatedData);
      res.status(201).json({
        success: true,
        data: customer
      });
    } catch (error) {
      console.error("Error creating CRM customer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create customer"
      });
    }
  });

  // Update CRM customer
  app.put("/api/crm/customers/:id", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const updateData = req.body;
      
      const customer = await crmStorage.updateCrmCustomer(customerId, updateData);
      res.json({
        success: true,
        data: customer
      });
    } catch (error) {
      console.error("Error updating CRM customer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update customer"
      });
    }
  });

  // Log customer activity
  app.post("/api/crm/customers/:id/activities", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const { activityType, description, activityData } = req.body;
      
      const activity = await crmStorage.logCustomerActivity({
        customerId,
        activityType,
        description,
        activityData,
        performedBy: "admin"
      });

      res.status(201).json({
        success: true,
        data: activity
      });
    } catch (error) {
      console.error("Error logging customer activity:", error);
      res.status(500).json({
        success: false,
        message: "Failed to log activity"
      });
    }
  });

  // Get customer activities
  app.get("/api/crm/customers/:id/activities", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 20;
      
      const activities = await crmStorage.getCustomerActivities(customerId, limit);
      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      console.error("Error fetching customer activities:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch activities"
      });
    }
  });

  // Create customer segment
  app.post("/api/crm/segments", requireAuth, async (req, res) => {
    try {
      const { name, description, criteria } = req.body;
      
      const segment = await crmStorage.createCustomerSegment({
        name,
        description,
        criteria
      });

      res.status(201).json({
        success: true,
        data: segment
      });
    } catch (error) {
      console.error("Error creating customer segment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create segment"
      });
    }
  });

  // Get all customer segments
  app.get("/api/crm/segments", requireAuth, async (req, res) => {
    try {
      const segments = await crmStorage.getCustomerSegments();
      res.json({
        success: true,
        data: segments
      });
    } catch (error) {
      console.error("Error fetching customer segments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch segments"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
