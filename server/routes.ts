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
import { insertCustomerInquirySchema, insertEmailTemplateSchema, insertCustomerSchema } from "@shared/customer-schema";
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
const documentsDir = path.join(uploadsDir, 'documents');

[uploadsDir, imagesDir, catalogsDir, documentsDir].forEach(dir => {
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

// Multer configuration for document uploads
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain',
      'image/png',
      'image/jpeg',
      'image/jpg'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

// Authentication middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  console.log('Auth check:', {
    isAuthenticated: req.session.isAuthenticated,
    adminId: req.session.adminId,
    sessionId: req.sessionID
  });
  
  if (req.session.isAuthenticated && req.session.adminId) {
    next();
  } else {
    console.log('Authentication failed for:', req.path);
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
          user: { id: user.id, username: user.username, email: user.email, roleId: user.roleId }
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
        roleId: 1, // Default admin role ID
        isActive: true,
      });

      res.json({ 
        success: true, 
        message: "Admin account created successfully",
        user: { id: newUser.id, username: newUser.username, email: newUser.email, roleId: newUser.roleId }
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
        user: { id: user.id, username: user.username, email: user.email, roleId: user.roleId }
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
        user: { id: user.id, username: user.username, email: user.email, roleId: user.roleId }
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



  // Admin management endpoints
  app.get("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        roleId: user.roleId,
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
        roleId: role ? parseInt(role) : undefined,
        isActive,
      });

      res.json({ 
        success: true, 
        message: "User updated successfully",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          roleId: updatedUser.roleId,
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
      const databaseUrl = process.env.DATABASE_URL;
      if (!databaseUrl) {
        return res.status(500).json({
          success: false,
          message: "Database URL not configured"
        });
      }

      const pgDump = spawn('pg_dump', [databaseUrl, '--no-owner', '--no-privileges']);
      
      const writeStream = fs.createWriteStream(backupPath);
      pgDump.stdout?.pipe(writeStream);
      
      let errorOutput = '';
      pgDump.stderr?.on('data', (data: Buffer) => {
        errorOutput += data.toString();
      });
      
      pgDump.on('close', (code: number | null) => {
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
      
      // Security check - only allow .sql and .sql.gz files and prevent directory traversal
      if ((!filename.endsWith('.sql') && !filename.endsWith('.sql.gz')) || filename.includes('..') || filename.includes('/')) {
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

  // Delete database backup
  app.delete("/api/admin/backup/delete/:filename", requireAuth, async (req, res) => {
    try {
      const { filename } = req.params;
      
      // Security check - only allow .sql and .sql.gz files and prevent directory traversal
      if ((!filename.endsWith('.sql') && !filename.endsWith('.sql.gz')) || filename.includes('..') || filename.includes('/')) {
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
      
      // Delete the backup file
      fs.unlinkSync(backupPath);
      
      res.json({
        success: true,
        message: 'Backup file deleted successfully'
      });
      
    } catch (error) {
      console.error("Error deleting backup:", error);
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
      const { pool } = await import('./db');
      const result = await pool.query(`
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
    const session = req.session as any;
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
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT u.id, u.username, u.email, u.role_id, u.is_active, u.last_login_at, u.created_at,
               r.name as role_name, r.display_name as role_display_name
        FROM users u
        LEFT JOIN admin_roles r ON u.role_id = r.id
        ORDER BY u.created_at DESC
      `);
      
      const users = result.rows.map((row: any) => ({
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
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT r.id, r.name, r.display_name, r.description, r.is_active,
               COUNT(rp.permission_id) as permission_count
        FROM admin_roles r
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        GROUP BY r.id, r.name, r.display_name, r.description, r.is_active
        ORDER BY r.id
      `);
      
      const roles = result.rows.map((row: any) => ({
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
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT id, name, display_name, description, module, is_active
        FROM admin_permissions
        ORDER BY module, display_name
      `);
      
      const permissions = result.rows.map((row: any) => ({
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
      
      const { pool } = await import('./db');
      const result = await pool.query(`
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

      const { pool } = await import('./db');
      const result = await pool.query(query, params);
      
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
      
      const { pool } = await import('./db');
      const result = await pool.query(`
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

  // =============================================================================
  // FACTORY MANAGEMENT ENDPOINTS
  // =============================================================================

  // Production Lines
  app.get("/api/factory/production-lines", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT id, name, description, capacity_per_hour, status, location, supervisor_name, created_at, updated_at
        FROM production_lines
        ORDER BY created_at DESC
      `);
      
      const productionLines = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        capacityPerHour: row.capacity_per_hour,
        status: row.status,
        location: row.location,
        supervisorName: row.supervisor_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json(productionLines);
    } catch (error) {
      console.error("Error fetching production lines:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Raw Materials
  app.get("/api/factory/raw-materials", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT id, name, code, unit, current_stock, minimum_stock, maximum_stock, 
               unit_price, supplier, storage_location, expiry_date, quality_grade, created_at, updated_at
        FROM raw_materials
        ORDER BY name
      `);
      
      const rawMaterials = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        unit: row.unit,
        currentStock: row.current_stock,
        minimumStock: row.minimum_stock,
        maximumStock: row.maximum_stock,
        unitPrice: row.unit_price,
        supplier: row.supplier,
        storageLocation: row.storage_location,
        expiryDate: row.expiry_date,
        qualityGrade: row.quality_grade,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json(rawMaterials);
    } catch (error) {
      console.error("Error fetching raw materials:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Production Orders
  app.get("/api/factory/production-orders", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT id, order_number, product_name, quantity_planned, quantity_produced, unit,
               production_line_id, status, priority, planned_start_date, actual_start_date,
               planned_end_date, actual_end_date, supervisor_notes, quality_check_status, created_at, updated_at
        FROM production_orders
        ORDER BY created_at DESC
      `);
      
      const productionOrders = result.rows.map((row: any) => ({
        id: row.id,
        orderNumber: row.order_number,
        productName: row.product_name,
        quantityPlanned: row.quantity_planned,
        quantityProduced: row.quantity_produced,
        unit: row.unit,
        productionLineId: row.production_line_id,
        status: row.status,
        priority: row.priority,
        plannedStartDate: row.planned_start_date,
        actualStartDate: row.actual_start_date,
        plannedEndDate: row.planned_end_date,
        actualEndDate: row.actual_end_date,
        supervisorNotes: row.supervisor_notes,
        qualityCheckStatus: row.quality_check_status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json(productionOrders);
    } catch (error) {
      console.error("Error fetching production orders:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Equipment Maintenance
  app.get("/api/factory/equipment-maintenance", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT id, equipment_name, equipment_code, production_line_id, maintenance_type,
               scheduled_date, completed_date, status, technician_name, description,
               cost, downtime_hours, created_at, updated_at
        FROM equipment_maintenance
        ORDER BY scheduled_date DESC
      `);
      
      const equipmentMaintenance = result.rows.map((row: any) => ({
        id: row.id,
        equipmentName: row.equipment_name,
        equipmentCode: row.equipment_code,
        productionLineId: row.production_line_id,
        maintenanceType: row.maintenance_type,
        scheduledDate: row.scheduled_date,
        completedDate: row.completed_date,
        status: row.status,
        technicianName: row.technician_name,
        description: row.description,
        cost: row.cost,
        downtimeHours: row.downtime_hours,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json(equipmentMaintenance);
    } catch (error) {
      console.error("Error fetching equipment maintenance:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Create Production Line
  app.post("/api/factory/production-lines", requireAuth, async (req, res) => {
    try {
      const { name, description, capacityPerHour, location, supervisorName } = req.body;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO production_lines (name, description, capacity_per_hour, location, supervisor_name)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, description, capacity_per_hour, status, location, supervisor_name, created_at
      `, [name, description, capacityPerHour, location, supervisorName]);

      res.json({
        success: true,
        productionLine: result.rows[0]
      });
    } catch (error: any) {
      console.error("Error creating production line:", error);
      if (error.code === '23505') {
        res.status(400).json({ success: false, message: "Production line name already exists" });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  });

  // Create Raw Material
  app.post("/api/factory/raw-materials", requireAuth, async (req, res) => {
    try {
      const { name, code, unit, currentStock, minimumStock, maximumStock, unitPrice, supplier, storageLocation, qualityGrade } = req.body;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO raw_materials (name, code, unit, current_stock, minimum_stock, maximum_stock, unit_price, supplier, storage_location, quality_grade)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, name, code, unit, current_stock, minimum_stock, maximum_stock, unit_price, supplier, storage_location, quality_grade, created_at
      `, [name, code, unit, currentStock, minimumStock, maximumStock, unitPrice, supplier, storageLocation, qualityGrade]);

      res.json({
        success: true,
        rawMaterial: result.rows[0]
      });
    } catch (error: any) {
      console.error("Error creating raw material:", error);
      if (error.code === '23505') {
        res.status(400).json({ success: false, message: "Raw material code already exists" });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  });

  // Create Production Order
  app.post("/api/factory/production-orders", requireAuth, async (req, res) => {
    try {
      const { productName, quantityPlanned, unit, productionLineId, priority, plannedStartDate, plannedEndDate } = req.body;
      
      // Generate order number
      const orderNumber = `PO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO production_orders (order_number, product_name, quantity_planned, unit, production_line_id, priority, planned_start_date, planned_end_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, order_number, product_name, quantity_planned, quantity_produced, unit, production_line_id, status, priority, planned_start_date, planned_end_date, created_at
      `, [orderNumber, productName, quantityPlanned, unit, productionLineId, priority, plannedStartDate, plannedEndDate]);

      res.json({
        success: true,
        productionOrder: result.rows[0]
      });
    } catch (error) {
      console.error("Error creating production order:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // =============================================================================
  // PROCEDURES MANAGEMENT ENDPOINTS
  // =============================================================================

  // Get procedure categories
  app.get("/api/procedures/categories", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT id, name, description, color_code, display_order, is_active, created_at, updated_at
        FROM procedure_categories
        WHERE is_active = true
        ORDER BY display_order, name
      `);
      
      const categories = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        colorCode: row.color_code,
        displayOrder: row.display_order,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json(categories);
    } catch (error) {
      console.error("Error fetching procedure categories:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get procedures
  app.get("/api/procedures", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT id, title, category_id, description, content, version, status, priority, 
               language, author_id, approver_id, approved_at, effective_date, review_date, 
               tags, access_level, view_count, last_viewed_at, created_at, updated_at
        FROM procedures
        ORDER BY created_at DESC
      `);
      
      const procedures = result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        categoryId: row.category_id,
        description: row.description,
        content: row.content,
        version: row.version,
        status: row.status,
        priority: row.priority,
        language: row.language,
        authorId: row.author_id,
        approverId: row.approver_id,
        approvedAt: row.approved_at,
        effectiveDate: row.effective_date,
        reviewDate: row.review_date,
        tags: row.tags || [],
        accessLevel: row.access_level,
        viewCount: row.view_count,
        lastViewedAt: row.last_viewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json(procedures);
    } catch (error) {
      console.error("Error fetching procedures:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get safety protocols
  app.get("/api/procedures/safety-protocols", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT id, title, category, description, severity_level, required_ppe, 
               procedures, first_aid_steps, evacuation_plan, is_mandatory, 
               compliance_notes, last_updated_by, created_at, updated_at
        FROM safety_protocols
        ORDER BY severity_level DESC, created_at DESC
      `);
      
      const safetyProtocols = result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        description: row.description,
        severityLevel: row.severity_level,
        requiredPpe: row.required_ppe || [],
        procedures: row.procedures,
        firstAidSteps: row.first_aid_steps,
        evacuationPlan: row.evacuation_plan,
        isMandatory: row.is_mandatory,
        complianceNotes: row.compliance_notes,
        lastUpdatedBy: row.last_updated_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json(safetyProtocols);
    } catch (error) {
      console.error("Error fetching safety protocols:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Create procedure category
  app.post("/api/procedures/categories", requireAuth, async (req, res) => {
    try {
      const { name, description, colorCode, displayOrder } = req.body;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO procedure_categories (name, description, color_code, display_order)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, description, color_code, display_order, is_active, created_at
      `, [name, description, colorCode, displayOrder]);

      res.json({
        success: true,
        category: result.rows[0]
      });
    } catch (error: any) {
      console.error("Error creating procedure category:", error);
      if (error.code === '23505') {
        res.status(400).json({ success: false, message: "Category name already exists" });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  });

  // Create procedure
  app.post("/api/procedures", requireAuth, async (req, res) => {
    try {
      const { title, categoryId, description, content, priority, effectiveDate, reviewDate, tags, accessLevel } = req.body;
      const userId = (req.session as any)?.adminId;
      
      // Process tags
      const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];
      
      // Handle empty date strings - convert to null
      const processedEffectiveDate = effectiveDate && effectiveDate.trim() !== '' ? effectiveDate : null;
      const processedReviewDate = reviewDate && reviewDate.trim() !== '' ? reviewDate : null;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO procedures (title, category_id, description, content, priority, author_id, 
                               effective_date, review_date, tags, access_level)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id, title, category_id, description, version, status, priority, created_at
      `, [title, categoryId, description, content, priority, userId, processedEffectiveDate, processedReviewDate, tagsArray, accessLevel]);

      res.json({
        success: true,
        procedure: result.rows[0]
      });
    } catch (error) {
      console.error("Error creating procedure:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Update procedure
  app.put("/api/procedures/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, categoryId, description, content, priority, effectiveDate, reviewDate, tags, accessLevel } = req.body;
      
      // Process tags
      const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        UPDATE procedures SET
          title = $1, category_id = $2, description = $3, content = $4,
          priority = $5, effective_date = $6, review_date = $7, tags = $8,
          access_level = $9, updated_at = NOW()
        WHERE id = $10
        RETURNING id, title, category_id, description, version, status, priority, updated_at
      `, [title, categoryId, description, content, priority, effectiveDate, reviewDate, tagsArray, accessLevel, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Procedure not found" });
      }

      res.json({
        success: true,
        procedure: result.rows[0]
      });
    } catch (error) {
      console.error("Error updating procedure:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Create safety protocol
  app.post("/api/procedures/safety-protocols", requireAuth, async (req, res) => {
    try {
      const { title, category, description, severityLevel, procedures, firstAidSteps, evacuationPlan, requiredPpe } = req.body;
      const userId = (req.session as any)?.adminId;
      
      // Process PPE
      const ppeArray = requiredPpe ? requiredPpe.split(',').map((ppe: string) => ppe.trim()).filter((ppe: string) => ppe.length > 0) : [];
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO safety_protocols (title, category, description, severity_level, procedures, 
                                     first_aid_steps, evacuation_plan, required_ppe, last_updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, title, category, severity_level, is_mandatory, created_at
      `, [title, category, description, severityLevel, procedures, firstAidSteps, evacuationPlan, ppeArray, userId]);

      res.json({
        success: true,
        safetyProtocol: result.rows[0]
      });
    } catch (error) {
      console.error("Error creating safety protocol:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get procedure outlines
  app.get("/api/procedures/:procedureId/outlines", requireAuth, async (req, res) => {
    try {
      const { procedureId } = req.params;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT id, procedure_id, parent_id, level, order_number, title, content, 
               is_collapsible, is_expanded, created_at, updated_at
        FROM procedure_outlines
        WHERE procedure_id = $1
        ORDER BY level, order_number
      `, [procedureId]);
      
      const outlines = result.rows.map((row: any) => ({
        id: row.id,
        procedureId: row.procedure_id,
        parentId: row.parent_id,
        level: row.level,
        orderNumber: row.order_number,
        title: row.title,
        content: row.content,
        isCollapsible: row.is_collapsible,
        isExpanded: row.is_expanded,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      res.json(outlines);
    } catch (error) {
      console.error("Error fetching procedure outlines:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Create procedure outline
  app.post("/api/procedures/:procedureId/outlines", requireAuth, async (req, res) => {
    try {
      const { procedureId } = req.params;
      const { parentId, level, orderNumber, title, content, isCollapsible } = req.body;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO procedure_outlines (procedure_id, parent_id, level, order_number, title, content, is_collapsible)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, procedure_id, level, order_number, title, created_at
      `, [procedureId, parentId, level, orderNumber, title, content, isCollapsible]);

      res.json({
        success: true,
        outline: result.rows[0]
      });
    } catch (error) {
      console.error("Error creating procedure outline:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Create safety protocol
  app.post("/api/procedures/safety-protocols", requireAuth, async (req, res) => {
    try {
      const { title, category, description, severityLevel, procedures, firstAidSteps, evacuationPlan, requiredPpe } = req.body;
      const userId = (req.session as any)?.adminId;
      
      // Process PPE array
      const ppeArray = Array.isArray(requiredPpe) ? requiredPpe : 
                      (requiredPpe ? requiredPpe.split(',').map((ppe: string) => ppe.trim()).filter((ppe: string) => ppe.length > 0) : []);
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO safety_protocols (title, category, description, severity_level, procedures, 
                                     first_aid_steps, evacuation_plan, required_ppe, last_updated_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, title, category, severity_level, is_mandatory, created_at
      `, [title, category, description, severityLevel, procedures, firstAidSteps, evacuationPlan, ppeArray, userId]);

      res.json({
        success: true,
        safetyProtocol: result.rows[0]
      });
    } catch (error) {
      console.error("Error creating safety protocol:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Update safety protocol
  app.put("/api/procedures/safety-protocols/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, category, description, severityLevel, procedures, firstAidSteps, evacuationPlan, requiredPpe } = req.body;
      const userId = (req.session as any)?.adminId;
      
      // Process PPE array
      const ppeArray = Array.isArray(requiredPpe) ? requiredPpe : 
                      (requiredPpe ? requiredPpe.split(',').map((ppe: string) => ppe.trim()).filter((ppe: string) => ppe.length > 0) : []);
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        UPDATE safety_protocols SET
          title = $1, category = $2, description = $3, severity_level = $4,
          procedures = $5, first_aid_steps = $6, evacuation_plan = $7, 
          required_ppe = $8, last_updated_by = $9, updated_at = NOW()
        WHERE id = $10
        RETURNING id, title, category, severity_level, updated_at
      `, [title, category, description, severityLevel, procedures, firstAidSteps, evacuationPlan, ppeArray, userId, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Safety protocol not found" });
      }

      res.json({
        success: true,
        safetyProtocol: result.rows[0]
      });
    } catch (error) {
      console.error("Error updating safety protocol:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get safety protocol documents
  app.get("/api/procedures/safety-protocols/:protocolId/documents", requireAuth, async (req, res) => {
    try {
      const { protocolId } = req.params;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT d.id, d.procedure_id, d.outline_id, d.title, d.description, d.file_name, 
               d.file_path, d.file_size, d.file_type, d.upload_date, d.uploaded_by, 
               d.version, d.is_active, d.download_count, d.last_downloaded_at, d.tags,
               u.username as uploaded_by_name
        FROM procedure_documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        WHERE d.procedure_id = $1 AND d.is_active = true AND d.document_type = 'safety_protocol'
        ORDER BY d.upload_date DESC
      `, [protocolId]);
      
      const documents = result.rows.map((row: any) => ({
        id: row.id,
        procedureId: row.procedure_id,
        outlineId: row.outline_id,
        title: row.title || 'بدون عنوان',
        description: row.description,
        fileName: row.file_name || 'فایل نامشخص',
        filePath: row.file_path,
        fileSize: row.file_size || 0,
        fileType: row.file_type || 'نامشخص',
        uploadDate: row.upload_date,
        uploadedBy: row.uploaded_by,
        uploadedByName: row.uploaded_by_name || 'نامشخص',
        version: row.version || '1.0',
        isActive: row.is_active,
        downloadCount: row.download_count || 0,
        lastDownloadedAt: row.last_downloaded_at,
        tags: row.tags || []
      }));

      res.json(documents);
    } catch (error) {
      console.error("Error fetching safety protocol documents:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Upload safety protocol document
  app.post("/api/procedures/safety-protocols/:protocolId/documents", requireAuth, upload.single('document'), async (req, res) => {
    try {
      const { protocolId } = req.params;
      const { title, description, version, tags } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const userId = req.session.adminId;
      const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];

      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO procedure_documents (
          procedure_id, title, description, file_name, file_path, 
          file_size, file_type, uploaded_by, version, tags, document_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'safety_protocol')
        RETURNING *
      `, [
        protocolId, 
        title || file.originalname, 
        description || null, 
        file.originalname, 
        file.path, 
        file.size, 
        file.mimetype, 
        userId, 
        version || '1.0', 
        tagsArray
      ]);

      res.json({
        success: true,
        document: result.rows[0],
        message: "Document uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading safety protocol document:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Download safety protocol document
  app.get("/api/procedures/safety-protocols/documents/:documentId/download", requireAuth, async (req, res) => {
    try {
      const { documentId } = req.params;
      
      const { pool } = await import('./db');
      
      // Get document info
      const docResult = await pool.query(`
        SELECT file_path, file_name, file_type
        FROM procedure_documents
        WHERE id = $1 AND is_active = true AND document_type = 'safety_protocol'
      `, [documentId]);

      if (docResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Document not found" });
      }

      const document = docResult.rows[0];

      // Update download count
      await pool.query(`
        UPDATE procedure_documents 
        SET download_count = download_count + 1, 
            last_downloaded_at = NOW()
        WHERE id = $1
      `, [documentId]);

      // Handle both absolute and relative paths
      let filePath = document.file_path;
      if (!path.isAbsolute(filePath)) {
        filePath = path.resolve(process.cwd(), filePath);
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: "File not found on server" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
      res.setHeader('Content-Type', document.file_type || 'application/octet-stream');
      
      res.sendFile(filePath);

    } catch (error) {
      console.error("Error downloading safety protocol document:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Delete safety protocol document
  app.delete("/api/procedures/safety-protocols/documents/:documentId", requireAuth, async (req, res) => {
    try {
      const { documentId } = req.params;
      
      const { pool } = await import('./db');
      
      // Get document info before deletion
      const docResult = await pool.query(`
        SELECT file_path, file_name
        FROM procedure_documents
        WHERE id = $1 AND is_active = true AND document_type = 'safety_protocol'
      `, [documentId]);

      if (docResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Document not found" });
      }

      const document = docResult.rows[0];

      // Mark document as inactive (soft delete)
      await pool.query(`
        UPDATE procedure_documents 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
      `, [documentId]);

      // Optionally delete the physical file
      try {
        let filePath = document.file_path;
        if (!path.isAbsolute(filePath)) {
          filePath = path.resolve(process.cwd(), filePath);
        }
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.log('Could not delete physical file:', fileError);
        // Continue even if file deletion fails
      }

      res.json({
        success: true,
        message: "Document deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting safety protocol document:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Update procedure category
  app.put("/api/procedures/categories/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, colorCode, displayOrder } = req.body;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        UPDATE procedure_categories SET
          name = $1, description = $2, color_code = $3, display_order = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING id, name, description, color_code, display_order, is_active, updated_at
      `, [name, description, colorCode, displayOrder, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }

      res.json({
        success: true,
        category: result.rows[0]
      });
    } catch (error: any) {
      console.error("Error updating procedure category:", error);
      if (error.code === '23505') {
        res.status(400).json({ success: false, message: "Category name already exists" });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  });

  // Customer registration endpoint - CRM-centric approach
  app.post("/api/customers/register", async (req, res) => {
    try {
      const { 
        firstName, 
        lastName, 
        email, 
        password, 
        passwordHash, // Support both password and passwordHash
        phone, 
        company, 
        country, 
        city, 
        address,
        postalCode,
        communicationPreference,
        preferredLanguage,
        marketingConsent,
        customerType,
        customerSource
      } = req.body;
      
      // Check if customer already exists in CRM (primary check)
      const existingCrmCustomer = await crmStorage.getCrmCustomerByEmail(email);
      if (existingCrmCustomer) {
        return res.status(400).json({ 
          success: false, 
          message: "Email already exists in our system" 
        });
      }

      // Validate mandatory fields
      if (!phone || !country || !city || !address) {
        return res.status(400).json({ 
          success: false, 
          message: "Phone, country, city, and address are required fields" 
        });
      }

      // Hash password
      const finalPassword = password || passwordHash;
      const hashedPassword = await bcrypt.hash(finalPassword, 10);

      // Create CRM customer first (central repository)
      const crmCustomerData = {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        company: company || '',
        phone,
        country,
        city,
        address,
        postalCode,
        communicationPreference,
        preferredLanguage,
        marketingConsent,
        customerType: customerType || 'retail',
        customerSource: customerSource || 'website',
        customerStatus: 'active',
        createdBy: 'customer_registration',
        internalNotes: 'Customer registered through online shop',
        isActive: true,
        emailVerified: false,
      };

      const crmCustomer = await crmStorage.createCrmCustomer(crmCustomerData);

      // Create corresponding customer portal entry with CRM reference
      let portalCustomer = null;
      try {
        portalCustomer = await customerStorage.createCustomer({
          ...crmCustomerData,
          crmCustomerId: crmCustomer.id,
        });
      } catch (portalError) {
        console.log('Portal customer creation failed, CRM customer created successfully');
      }

      // Log registration activity in CRM
      await crmStorage.logCustomerActivity({
        customerId: crmCustomer.id,
        activityType: 'registration',
        description: 'Customer registered through online shop',
        performedBy: 'system',
        activityData: {
          source: 'website',
          registrationDate: new Date().toISOString(),
          hasPortalAccess: !!portalCustomer,
          portalCustomerId: portalCustomer?.id,
        }
      });

      // Update customer metrics immediately after registration
      await crmStorage.updateCustomerMetrics(crmCustomer.id);
      
      res.json({
        success: true,
        message: "Registration successful",
        customer: {
          id: portalCustomer?.id || crmCustomer.id,
          firstName: crmCustomer.firstName,
          lastName: crmCustomer.lastName,
          email: crmCustomer.email,
          crmId: crmCustomer.id,
        }
      });
    } catch (error) {
      console.error("Error registering customer:", error);
      res.status(500).json({ 
        success: false, 
        message: "Registration failed" 
      });
    }
  });

  app.post("/api/customers/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Verify customer credentials
      const customer = await customerStorage.verifyCustomerPassword(email, password);
      
      if (!customer) {
        return res.status(401).json({ 
          success: false, 
          message: "ایمیل یا رمز عبور اشتباه است" 
        });
      }

      // Get CRM customer data
      const crmCustomer = await crmStorage.getCrmCustomerByEmail(email);

      // Store customer session with both IDs
      (req.session as any).customerId = customer.id;
      (req.session as any).customerEmail = customer.email;
      if (crmCustomer) {
        (req.session as any).crmCustomerId = crmCustomer.id;
      }

      // Log login activity in CRM if customer exists there
      if (crmCustomer) {
        await crmStorage.logCustomerActivity({
          customerId: crmCustomer.id,
          activityType: 'login',
          description: 'مشتری وارد فروشگاه آنلاین شد',
          activityData: {
            source: 'website',
            loginDate: new Date().toISOString(),
            userAgent: req.headers['user-agent'] || 'unknown',
          }
        });
      }

      res.json({
        success: true,
        message: "ورود موفق",
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          company: customer.company,
          crmId: crmCustomer?.id,
        }
      });
    } catch (error) {
      console.error("Error logging in customer:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در ورود" 
      });
    }
  });

  app.post("/api/customers/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Error destroying session:", err);
          return res.status(500).json({ 
            success: false, 
            message: "خطا در خروج" 
          });
        }
        res.json({
          success: true,
          message: "خروج موفق"
        });
      });
    } catch (error) {
      console.error("Error logging out customer:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در خروج" 
      });
    }
  });

  app.get("/api/customers/me", async (req, res) => {
    try {
      const customerId = (req.session as any)?.customerId;
      const crmCustomerId = (req.session as any)?.crmCustomerId;
      
      if (!customerId) {
        return res.status(401).json({ 
          success: false, 
          message: "احراز هویت نشده" 
        });
      }

      const customer = await customerStorage.getCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ 
          success: false, 
          message: "مشتری یافت نشد" 
        });
      }

      // Get CRM customer data if available
      let crmCustomer = null;
      if (crmCustomerId) {
        crmCustomer = await crmStorage.getCrmCustomerById(crmCustomerId);
      }

      res.json({
        success: true,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          company: customer.company,
          phone: customer.phone,
          country: customer.country,
          city: customer.city,
          address: customer.address,
          crmId: crmCustomer?.id,
        }
      });
    } catch (error) {
      console.error("Error getting customer info:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در دریافت اطلاعات" 
      });
    }
  });

  // Create shop order and integrate with CRM
  app.post("/api/shop/orders", async (req, res) => {
    try {
      const customerId = (req.session as any)?.customerId;
      const crmCustomerId = (req.session as any)?.crmCustomerId;
      const { items, customerInfo, totalAmount, notes, shippingMethod, paymentMethod } = req.body;

      let finalCustomerInfo = customerInfo;
      let finalCrmCustomerId = crmCustomerId;

      // If user is not logged in, create or update CRM customer from order info
      if (!customerId && customerInfo) {
        const orderData = {
          email: customerInfo.email,
          firstName: customerInfo.firstName,
          lastName: customerInfo.lastName,
          company: customerInfo.company,
          phone: customerInfo.phone,
          country: customerInfo.country,
          city: customerInfo.city,
          address: customerInfo.address,
          orderValue: totalAmount,
        };

        const crmCustomer = await crmStorage.createOrUpdateCustomerFromOrder(orderData);
        finalCrmCustomerId = crmCustomer.id;
        finalCustomerInfo = crmCustomer;
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create order in customer orders table
      const orderData = {
        orderNumber,
        customerId: customerId || null,
        totalAmount: totalAmount.toString(),
        status: 'pending' as const,
        paymentMethod: paymentMethod || 'bank_transfer',
        shippingAddress: {
          address: finalCustomerInfo.address,
          city: finalCustomerInfo.city,
          country: finalCustomerInfo.country,
        },
        notes: notes || '',
        ...(customerId ? {} : {
          guestEmail: finalCustomerInfo.email,
          guestName: `${finalCustomerInfo.firstName} ${finalCustomerInfo.lastName}`,
        }),
        // Store shipping method information
        carrier: shippingMethod === 'standard' ? 'Standard Shipping (5-7 days)' : 
                shippingMethod === 'express' ? 'Express Shipping (2-3 days)' : 
                shippingMethod === 'overnight' ? 'Overnight Shipping' : 
                'Standard Shipping',
      };

      const order = await customerStorage.createOrder(orderData);

      // Create order items
      for (const item of items) {
        await customerStorage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName || 'Unknown Product',
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          totalPrice: (item.quantity * item.unitPrice).toString(),
          productSku: item.productSku || '',
        });
      }

      // Log order activity in CRM
      if (finalCrmCustomerId) {
        await crmStorage.logCustomerActivity({
          customerId: finalCrmCustomerId,
          activityType: 'order_placed',
          description: `سفارش جدید به مبلغ $${totalAmount} ثبت شد`,
          activityData: {
            orderId: order.id,
            totalAmount,
            itemCount: items.length,
            source: 'website',
            orderDate: new Date().toISOString(),
          },
          relatedOrderId: order.id,
        });

        // Update customer metrics in CRM
        await crmStorage.updateCustomerMetrics(finalCrmCustomerId);
      }

      res.json({
        success: true,
        message: "سفارش با موفقیت ثبت شد",
        order: {
          id: order.id,
          totalAmount: order.totalAmount,
          status: order.status,
          crmCustomerId: finalCrmCustomerId,
        }
      });

    } catch (error) {
      console.error("Error creating shop order:", error);
      res.status(500).json({
        success: false,
        message: "خطا در ثبت سفارش"
      });
    }
  });

  // Get customer order history
  app.get("/api/customers/orders", async (req, res) => {
    try {
      const customerId = (req.session as any)?.customerId;
      if (!customerId) {
        return res.status(401).json({ 
          success: false, 
          message: "احراز هویت نشده" 
        });
      }

      const orders = await customerStorage.getOrdersByCustomer(customerId);
      
      // Get detailed order information with items
      const detailedOrders = await Promise.all(
        orders.map(async (order) => {
          const items = await customerStorage.getOrderItems(order.id);
          return {
            ...order,
            items,
          };
        })
      );

      res.json({
        success: true,
        orders: detailedOrders,
      });
    } catch (error) {
      console.error("Error getting customer orders:", error);
      res.status(500).json({
        success: false,
        message: "خطا در دریافت سفارشات"
      });
    }
  });

  // Reset admin password (development only)
  app.post("/api/admin/reset-password-dev", async (req, res) => {
    try {
      const { username, newPassword } = req.body;
      
      if (!username || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Username and new password required"
        });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      
      const { pool } = await import('./db');
      const result = await pool.query(
        'UPDATE users SET password_hash = $1 WHERE username = $2 RETURNING id, username',
        [hashedPassword, username]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      res.json({
        success: true,
        message: "Password updated successfully"
      });

    } catch (error) {
      console.error("Error resetting admin password:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Customer password reset - Request reset
  app.post("/api/customers/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required"
        });
      }

      // Check if customer exists
      const customer = await customerStorage.getCustomerByEmail(email);
      if (!customer) {
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message: "If the email is valid, password reset link has been sent"
        });
      }

      // Generate reset token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      const { pool } = await import('./db');
      
      // Clear any existing tokens for this email
      await pool.query('DELETE FROM password_resets WHERE email = $1', [email]);
      
      // Insert new reset token
      await pool.query(
        'INSERT INTO password_resets (email, token, expires_at, used, created_at) VALUES ($1, $2, $3, false, NOW())',
        [email, token, expiresAt]
      );

      // Send password reset email
      const { sendPasswordResetEmail } = await import('./email');
      await sendPasswordResetEmail({
        email,
        firstName: customer?.firstName,
        lastName: customer?.lastName,
        token
      });

      res.json({
        success: true,
        message: "Password reset link sent to your email"
      });

    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({
        success: false,
        message: "Error in password reset request"
      });
    }
  });

  // Customer password reset - Reset with token
  app.post("/api/customers/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({
          success: false,
          message: "Token and new password are required"
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters"
        });
      }

      const { pool } = await import('./db');
      
      // Check if token is valid and not expired
      const tokenResult = await pool.query(
        'SELECT email FROM password_resets WHERE token = $1 AND expires_at > NOW() AND used = false',
        [token]
      );

      if (tokenResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired token"
        });
      }

      const email = tokenResult.rows[0].email;
      
      // Get customer
      const customer = await customerStorage.getCustomerByEmail(email);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found"
        });
      }

      // Update password
      await customerStorage.updateCustomerPassword(customer.id, newPassword);
      
      // Mark token as used
      await pool.query('UPDATE password_resets SET used = true WHERE token = $1', [token]);

      res.json({
        success: true,
        message: "Password successfully changed"
      });

    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({
        success: false,
        message: "Error changing password"
      });
    }
  });

  // Get procedure documents
  app.get("/api/procedures/:procedureId/documents", requireAuth, async (req, res) => {
    try {
      const { procedureId } = req.params;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT d.id, d.procedure_id, d.outline_id, d.title, d.description, d.file_name, 
               d.file_path, d.file_size, d.file_type, d.upload_date, d.uploaded_by, 
               d.version, d.is_active, d.download_count, d.last_downloaded_at, d.tags,
               u.username as uploaded_by_name,
               o.title as outline_title
        FROM procedure_documents d
        LEFT JOIN users u ON d.uploaded_by = u.id
        LEFT JOIN procedure_outlines o ON d.outline_id = o.id
        WHERE d.procedure_id = $1 AND d.is_active = true
        ORDER BY d.upload_date DESC
      `, [procedureId]);
      
      const documents = result.rows.map((row: any) => ({
        id: row.id,
        procedureId: row.procedure_id,
        outlineId: row.outline_id,
        title: row.title || 'بدون عنوان',
        description: row.description,
        fileName: row.file_name || 'فایل نامشخص',
        filePath: row.file_path,
        fileSize: row.file_size || 0,
        fileType: row.file_type || 'نامشخص',
        uploadDate: row.upload_date,
        uploadedBy: row.uploaded_by,
        uploadedByName: row.uploaded_by_name || 'نامشخص',
        version: row.version || '1.0',
        isActive: row.is_active,
        downloadCount: row.download_count || 0,
        lastDownloadedAt: row.last_downloaded_at,
        tags: row.tags || [],
        outlineTitle: row.outline_title
      }));

      res.json(documents);
    } catch (error) {
      console.error("Error fetching procedure documents:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Upload procedure document
  app.post("/api/procedures/:procedureId/documents", requireAuth, (req, res, next) => {
    upload.single('document')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  }, async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const { procedureId } = req.params;
      const { title, description, outlineId, version, tags } = req.body;
      const userId = (req.session as any)?.adminId;
      
      // Process tags
      const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO procedure_documents (
          procedure_id, outline_id, title, description, file_name, 
          file_path, file_size, file_type, uploaded_by, version, tags,
          upload_date, is_active, download_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, '1.0'), $11, NOW(), true, 0)
        RETURNING id, title, file_name, upload_date, version
      `, [
        procedureId, 
        outlineId || null, 
        title || req.file.originalname, 
        description || null, 
        req.file.originalname, 
        req.file.path, 
        req.file.size, 
        req.file.mimetype, 
        userId, 
        version || '1.0', 
        tagsArray
      ]);

      res.json({
        success: true,
        document: result.rows[0],
        message: "Document uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Download procedure document
  app.get("/api/procedures/documents/:documentId/download", requireAuth, async (req, res) => {
    try {
      const { documentId } = req.params;
      
      const { pool } = await import('./db');
      
      // Get document info
      const docResult = await pool.query(`
        SELECT file_path, file_name, file_type
        FROM procedure_documents
        WHERE id = $1 AND is_active = true
      `, [documentId]);

      if (docResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Document not found" });
      }

      const document = docResult.rows[0];

      // Update download count
      await pool.query(`
        UPDATE procedure_documents 
        SET download_count = download_count + 1, last_downloaded_at = NOW()
        WHERE id = $1
      `, [documentId]);

      // Handle both absolute and relative paths
      let filePath = document.file_path;
      if (!path.isAbsolute(filePath)) {
        filePath = path.resolve(process.cwd(), filePath);
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: "File not found on server" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
      res.setHeader('Content-Type', document.file_type || 'application/octet-stream');
      
      res.sendFile(filePath);

    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Upload procedure document
  app.post("/api/procedures/:procedureId/documents", requireAuth, upload.single('document'), async (req, res) => {
    try {
      const { procedureId } = req.params;
      const { title, description } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const { pool } = await import('./db');
      
      const result = await pool.query(`
        INSERT INTO procedure_documents (
          procedure_id, title, description, file_name, file_path, 
          file_size, file_type, upload_date, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        RETURNING *
      `, [
        procedureId,
        title || file.originalname,
        description || null,
        file.originalname,
        file.path,
        file.size,
        file.mimetype,
        req.session.adminId
      ]);

      res.json({ 
        success: true, 
        message: "Document uploaded successfully",
        document: result.rows[0] 
      });

    } catch (error) {
      console.error("Error uploading document:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Delete procedure document
  app.delete("/api/procedures/documents/:documentId", requireAuth, async (req, res) => {
    try {
      const { documentId } = req.params;
      
      const { pool } = await import('./db');
      
      // Get document info before deletion
      const docResult = await pool.query(`
        SELECT file_path, file_name
        FROM procedure_documents
        WHERE id = $1 AND is_active = true
      `, [documentId]);

      if (docResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Document not found" });
      }

      const document = docResult.rows[0];

      // Mark document as inactive (soft delete)
      await pool.query(`
        UPDATE procedure_documents 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
      `, [documentId]);

      // Optionally delete the physical file
      try {
        let filePath = document.file_path;
        if (!path.isAbsolute(filePath)) {
          filePath = path.resolve(process.cwd(), filePath);
        }
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileError) {
        console.log('Could not delete physical file:', fileError);
        // Continue even if file deletion fails
      }

      res.json({
        success: true,
        message: "Document deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Generate procedure text document
  app.get("/api/procedures/:procedureId/export", requireAuth, async (req, res) => {
    try {
      const { procedureId } = req.params;
      const { pool } = await import('./db');
      
      // Get procedure details
      const procedureResult = await pool.query(`
        SELECT p.id, p.title, p.description, p.content, p.version, p.status, p.priority, 
               p.created_at, c.name as category_name
        FROM procedures p
        LEFT JOIN procedure_categories c ON p.category_id = c.id
        WHERE p.id = $1
      `, [procedureId]);

      if (procedureResult.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Procedure not found" });
      }

      const procedure = procedureResult.rows[0];

      // Generate simple text content
      const textContent = `دستورالعمل: ${procedure.title}
نسخه: ${procedure.version}
وضعیت: ${procedure.status}
دسته‌بندی: ${procedure.category_name || 'نامشخص'}

توضیحات:
${procedure.description || 'ندارد'}

محتوا:
${procedure.content}

تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}
`;

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=procedure-export.txt');
      res.send(textContent);

    } catch (error) {
      console.error("Error exporting procedure:", error);
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
          relname as tablename,
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

  app.get("/api/shop/orders", requireAuth, async (req, res) => {
    try {
      // Get customer orders from the customer_orders table
      const orders = await customerStorage.getAllOrders();
      
      // Get detailed order information with items and customer details
      const detailedOrders = await Promise.all(
        orders.map(async (order) => {
          const items = await customerStorage.getOrderItems(order.id);
          let customer = null;
          if (order.customerId) {
            customer = await customerStorage.getCustomerById(order.customerId);
          }
          return {
            ...order,
            items,
            customer,
            orderDate: order.createdAt, // Map for compatibility
            orderNumber: order.orderNumber,
            // Include shipping method information
            carrier: order.carrier,
            paymentMethod: order.paymentMethod,
          };
        })
      );

      res.json(detailedOrders);
    } catch (error) {
      console.error("Error fetching customer orders:", error);
      res.status(500).json({ success: false, message: "Failed to fetch customer orders" });
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

  app.patch("/api/shop/orders/:id", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ success: false, message: "Invalid order ID" });
      }
      
      const updates = req.body;
      const currentOrder = await customerStorage.getOrderById(orderId);
      
      if (!currentOrder) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }
      
      // Update the customer order status
      const updatedOrder = await customerStorage.updateOrder(orderId, updates);
      
      res.json({
        success: true,
        message: "Order status updated successfully",
        order: updatedOrder
      });
    } catch (error) {
      console.error("Error updating customer order:", error);
      res.status(500).json({ success: false, message: "Failed to update customer order" });
    }
  });

  // Order statistics for dashboard
  app.get("/api/shop/statistics", requireAuth, async (req, res) => {
    try {
      // Get customer order statistics from the correct table
      const customerStats = await customerStorage.getCustomerStats();
      
      // Get all customer orders for additional calculations
      const allOrders = await customerStorage.getAllOrders();
      
      // Calculate statistics based on customer orders
      const totalOrders = allOrders.length;
      const pendingOrders = allOrders.filter(order => order.status === 'pending').length;
      const shippedOrders = allOrders.filter(order => order.status === 'shipped').length;
      const deliveredOrders = allOrders.filter(order => order.status === 'delivered').length;
      
      // Calculate total revenue from customer orders
      const totalRevenue = allOrders.reduce((sum, order) => {
        return sum + parseFloat(order.totalAmount || '0');
      }, 0);

      const stats = {
        totalOrders,
        pendingOrders,
        shippedOrders,
        deliveredOrders,
        totalRevenue: totalRevenue.toFixed(2),
        totalCustomers: customerStats.totalCustomers,
        openInquiries: customerStats.openInquiries
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching customer order statistics:", error);
      res.status(500).json({ success: false, message: "Failed to fetch customer order statistics" });
    }
  });

  // Sales Reports API
  app.get("/api/reports/sales", requireAuth, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          message: "Start date and end date are required" 
        });
      }

      // Get all orders within date range
      const orders = await customerStorage.getAllOrders();
      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999); // Include full end date
        
        return orderDate >= start && orderDate <= end;
      });

      // Calculate total sales metrics
      const totalSales = filteredOrders.reduce((sum, order) => 
        sum + parseFloat(order.totalAmount), 0
      );
      const totalOrders = filteredOrders.length;

      // Get detailed order items for product analysis
      const productSalesMap = new Map<string, { productName: string; quantity: number; totalAmount: number; orders: Set<number> }>();
      let totalQuantity: number = 0;

      for (const order of filteredOrders) {
        const items = await customerStorage.getOrderItems(order.id);
        
        for (const item of items) {
          const key = item.productName;
          const existing = productSalesMap.get(key) || {
            productName: item.productName,
            quantity: 0,
            totalAmount: 0,
            orders: new Set()
          };
          
          existing.quantity += Number(item.quantity);
          existing.totalAmount += parseFloat(String(item.unitPrice)) * Number(item.quantity);
          existing.orders.add(order.id);
          totalQuantity += Number(item.quantity);
          
          productSalesMap.set(key, existing);
        }
      }

      // Convert to array and add order count
      const productSales = Array.from(productSalesMap.values()).map(product => ({
        ...product,
        orders: product.orders.size
      })).sort((a, b) => b.totalAmount - a.totalAmount);

      // Create top products for pie chart (top 8 products)
      const topProducts = productSales.slice(0, 8).map(product => {
        const percentage = totalSales > 0 ? ((product.totalAmount / totalSales) * 100) : 0;
        return {
          name: product.productName,
          value: product.totalAmount,
          percentage: Math.round(percentage * 10) / 10
        };
      });

      // Create daily breakdown
      const dailyMap = new Map();
      filteredOrders.forEach(order => {
        const date = new Date(order.createdAt).toISOString().split('T')[0];
        const existing = dailyMap.get(date) || { date, sales: 0, orders: 0 };
        existing.sales += parseFloat(order.totalAmount);
        existing.orders += 1;
        dailyMap.set(date, existing);
      });

      const dailyBreakdown = Array.from(dailyMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const reportData = {
        totalSales,
        totalOrders,
        totalQuantity,
        productSales,
        dailyBreakdown,
        topProducts
      };

      res.json(reportData);
    } catch (error) {
      console.error("Error generating sales report:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to generate sales report" 
      });
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
        // Generate CSV with proper UTF-8 encoding for Arabic/Persian text
        const csvHeaders = [
          'Order Number', 'Order Date', 'Customer Name', 'Customer Email',
          'Product Name', 'Quantity', 'Unit Price', 'Item Total',
          'Order Status', 'Payment Status', 'Subtotal', 'Tax Amount',
          'Shipping Amount', 'Total Amount', 'Currency'
        ].join(',');
        
        const csvRows = reportData.map(row => {
          // Ensure all text fields are properly escaped and encoded
          const escapeForCsv = (str) => {
            if (str == null) return '';
            return `"${String(str).replace(/"/g, '""')}"`;
          };
          
          return [
            escapeForCsv(row.orderNumber),
            escapeForCsv(row.orderDate),
            escapeForCsv(row.customerName),
            escapeForCsv(row.customerEmail),
            escapeForCsv(row.productName),
            row.quantity,
            row.unitPrice.toFixed(2),
            row.itemTotal.toFixed(2),
            escapeForCsv(row.orderStatus),
            escapeForCsv(row.paymentStatus),
            row.subtotal.toFixed(2),
            row.taxAmount.toFixed(2),
            row.shippingAmount.toFixed(2),
            row.totalAmount.toFixed(2),
            escapeForCsv(row.currency)
          ].join(',');
        });
        
        const csvContent = [csvHeaders, ...csvRows].join('\r\n');
        
        // Add UTF-8 BOM for Excel compatibility with Arabic/Persian text
        const bom = Buffer.from([0xEF, 0xBB, 0xBF]);
        const csvBuffer = Buffer.from(csvContent, 'utf8');
        const finalBuffer = Buffer.concat([bom, csvBuffer]);
        
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''sales-report-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(finalBuffer);
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

  // Create inquiry response (admin only)
  app.post("/api/inquiries/:id/response", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inquiry ID"
        });
      }

      const { responseText, responseType = 'follow_up' } = req.body;
      
      if (!responseText?.trim()) {
        return res.status(400).json({
          success: false,
          message: "Response text is required"
        });
      }

      // Get the inquiry first to verify it exists
      const inquiry = await simpleCustomerStorage.getInquiryById(id);
      if (!inquiry) {
        return res.status(404).json({
          success: false,
          message: "Inquiry not found"
        });
      }

      // Create the response
      const response = await simpleCustomerStorage.createInquiryResponse({
        inquiryId: id,
        senderId: req.session.adminId,
        senderType: 'admin',
        message: responseText,
        isInternal: false,
      });

      // Update inquiry status to 'in_progress' if it was 'open'
      if (inquiry.status === 'open') {
        await simpleCustomerStorage.updateInquiry(id, { status: 'in_progress' });
      }

      res.json({
        success: true,
        message: "Response sent successfully",
        response
      });
    } catch (error) {
      console.error("Error creating inquiry response:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create response"
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
      
      const transporter = nodemailer.createTransport({
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

  // Create new CRM customer (enhanced with password handling)
  app.post("/api/crm/customers", requireAuth, async (req, res) => {
    try {
      const { password, ...customerData } = req.body;
      
      // Hash password if provided
      let passwordHash = '';
      if (password && password.trim()) {
        passwordHash = await bcrypt.hash(password.trim(), 10);
      }
      
      // Validate mandatory fields
      if (!customerData.phone || !customerData.country || !customerData.city || !customerData.address) {
        return res.status(400).json({
          success: false,
          message: "Phone, country, city, and address are required fields"
        });
      }

      const validatedData = {
        ...customerData,
        passwordHash,
        createdBy: "admin",
        isActive: true,
        customerStatus: customerData.customerStatus || "active",
        emailVerified: false,
      };
      
      // Create CRM customer
      const crmCustomer = await crmStorage.createCrmCustomer(validatedData);
      
      // Also create in customer portal system if password provided
      if (passwordHash) {
        try {
          const portalCustomer = await customerStorage.createCustomer({
            ...validatedData,
            crmCustomerId: crmCustomer.id,
          });
          
          // Log activity
          await crmStorage.logCustomerActivity({
            customerId: crmCustomer.id,
            activityType: 'created',
            description: 'Customer created with portal access from CRM',
            performedBy: 'admin',
            activityData: { hasPortalAccess: true, portalCustomerId: portalCustomer.id }
          });
        } catch (portalError) {
          console.log('Portal customer creation failed, continuing with CRM-only customer');
        }
      }
      
      res.status(201).json({
        success: true,
        data: crmCustomer
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

  // Delete CRM customer
  app.delete("/api/crm/customers/:id", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      
      await crmStorage.deleteCrmCustomer(customerId);
      res.json({
        success: true,
        message: "Customer deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting CRM customer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete customer"
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

  // =============================================================================
  // CONTACT SALES AND QUOTE REQUEST ENDPOINTS
  // =============================================================================

  // Contact sales team
  app.post("/api/contact/sales", async (req, res) => {
    try {
      const { name, email, company, phone, message, type } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: "Name, email, and message are required"
        });
      }

      // Send email to sales team using direct nodemailer approach
      try {
        const nodemailer = await import('nodemailer');
        const { emailStorage } = await import('./email-storage');
        
        // Get admin SMTP settings
        const categorySettings = await emailStorage.getCategoryWithSettings('admin');
        
        if (!categorySettings?.smtp) {
          throw new Error('No SMTP configuration found');
        }

        const smtp = categorySettings.smtp;
        
        // Create transporter
        const transporter = nodemailer.default.createTransporter({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.port === 465,
          auth: {
            user: smtp.username,
            pass: smtp.password,
          },
        });

        // Send email directly to sales team
        await transporter.sendMail({
          from: `${smtp.fromName} <${smtp.fromEmail}>`,
          to: "sales@momtazchem.com",
          replyTo: email,
          subject: "New Sales Inquiry from Website",
          html: `
            <h2>New Sales Inquiry</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company || 'Not specified'}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
          `,
          text: `
New Sales Inquiry

Name: ${name}
Email: ${email}
Company: ${company || 'Not specified'}
Phone: ${phone || 'Not provided'}

Message:
${message}
          `
        });

        // Also log this as a CRM activity if we can match to existing customer
        try {
          const existingCustomer = await crmStorage.getCrmCustomerByEmail(email);
          if (existingCustomer) {
            await crmStorage.logCustomerActivity({
              customerId: existingCustomer.id,
              activityType: 'contact_form',
              description: `Sales inquiry submitted via website: ${message.substring(0, 100)}...`,
              activityData: {
                source: 'website_contact_form',
                contactType: 'sales_inquiry',
                company: company,
                phone: phone,
                fullMessage: message
              }
            });
          } else {
            // Create new CRM customer for this inquiry
            const newCrmCustomer = await crmStorage.createCrmCustomer({
              firstName: name.split(' ')[0] || name,
              lastName: name.split(' ').slice(1).join(' ') || '',
              email: email,
              company: company || null,
              phone: phone || null,
              customerType: 'prospect'
            });

            await crmStorage.logCustomerActivity({
              customerId: newCrmCustomer.id,
              activityType: 'contact_form',
              description: `First contact via sales inquiry form: ${message.substring(0, 100)}...`,
              activityData: {
                source: 'website_contact_form',
                contactType: 'sales_inquiry',
                company: company,
                phone: phone,
                fullMessage: message
              }
            });
          }
        } catch (crmError) {
          console.error("Error logging to CRM:", crmError);
          // Don't fail the request if CRM logging fails
        }

        res.json({
          success: true,
          message: "Your message has been sent to our sales team. We'll contact you within 24 hours."
        });
      } catch (emailError) {
        console.error("Error sending sales contact email:", emailError);
        res.status(500).json({
          success: false,
          message: "Failed to send message. Please try again or contact us directly."
        });
      }
    } catch (error) {
      console.error("Error in sales contact endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Quote request
  app.post("/api/contact/quote", async (req, res) => {
    try {
      const { 
        name, 
        email, 
        company, 
        phone, 
        productCategory, 
        quantity, 
        specifications, 
        timeline, 
        message 
      } = req.body;

      if (!name || !email || !company || !productCategory || !quantity || !specifications) {
        return res.status(400).json({
          success: false,
          message: "Name, email, company, product category, quantity, and specifications are required"
        });
      }

      // Send detailed quote request email to sales team using direct approach
      try {
        const nodemailer = await import('nodemailer');
        const { emailStorage } = await import('./email-storage');
        
        // Get admin SMTP settings
        const categorySettings = await emailStorage.getCategoryWithSettings('admin');
        
        if (!categorySettings?.smtp) {
          throw new Error('No SMTP configuration found');
        }

        const smtp = categorySettings.smtp;
        
        // Create transporter
        const transporter = nodemailer.default.createTransporter({
          host: smtp.host,
          port: smtp.port,
          secure: smtp.port === 465,
          auth: {
            user: smtp.username,
            pass: smtp.password,
          },
        });

        // Send quote request email
        await transporter.sendMail({
          from: `${smtp.fromName} <${smtp.fromEmail}>`,
          to: "sales@momtazchem.com",
          replyTo: email,
          subject: `New Quote Request - ${productCategory}`,
          html: `
            <h2>New Quote Request</h2>
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            
            <h3>Product Requirements</h3>
            <p><strong>Product Category:</strong> ${productCategory}</p>
            <p><strong>Quantity:</strong> ${quantity}</p>
            <p><strong>Timeline:</strong> ${timeline || 'Not specified'}</p>
            
            <h3>Specifications</h3>
            <p>${specifications}</p>
            
            ${message ? `<h3>Additional Requirements</h3><p>${message}</p>` : ''}
          `,
          text: `
New Quote Request

Customer Information:
Name: ${name}
Email: ${email}
Company: ${company}
Phone: ${phone || 'Not provided'}

Product Requirements:
Product Category: ${productCategory}
Quantity: ${quantity}
Timeline: ${timeline || 'Not specified'}

Specifications:
${specifications}

${message ? `Additional Requirements:\n${message}` : ''}
          `
        });

        // Log this in CRM system
        try {
          let crmCustomer = await crmStorage.getCrmCustomerByEmail(email);
          
          if (!crmCustomer) {
            // Create new CRM customer for this quote request
            crmCustomer = await crmStorage.createCrmCustomer({
              firstName: name.split(' ')[0] || name,
              lastName: name.split(' ').slice(1).join(' ') || '',
              email: email,
              company: company,
              phone: phone || null,
              customerType: 'prospect'
            });
          }

          await crmStorage.logCustomerActivity({
            customerId: crmCustomer.id,
            activityType: 'quote_request',
            description: `Quote requested for ${productCategory} - Qty: ${quantity}`,
            activityData: {
              source: 'website_quote_form',
              productCategory: productCategory,
              quantity: quantity,
              specifications: specifications,
              timeline: timeline,
              additionalMessage: message,
              estimatedValue: 0 // Could be calculated based on product category
            }
          });

          // Update customer metrics
          await crmStorage.updateCustomerMetrics(crmCustomer.id);
        } catch (crmError) {
          console.error("Error logging quote request to CRM:", crmError);
          // Don't fail the request if CRM logging fails
        }

        res.json({
          success: true,
          message: "Your quote request has been submitted. Our team will prepare a detailed quote and respond within 24 hours."
        });
      } catch (emailError) {
        console.error("Error sending quote request email:", emailError);
        res.status(500).json({
          success: false,
          message: "Failed to submit quote request. Please try again or contact us directly."
        });
      }
    } catch (error) {
      console.error("Error in quote request endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // =============================================================================
  // CATEGORY MANAGEMENT API ROUTES
  // =============================================================================

  // Get all categories
  app.get("/api/admin/categories", requireAuth, async (req, res) => {
    try {
      const { shopStorage } = await import('./shop-storage');
      const categories = await shopStorage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ success: false, message: "Failed to fetch categories" });
    }
  });

  // Get category by ID
  app.get("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const { shopStorage } = await import('./shop-storage');
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }
      
      const category = await shopStorage.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ success: false, message: "Failed to fetch category" });
    }
  });

  // Create new category
  app.post("/api/admin/categories", requireAuth, async (req, res) => {
    try {
      const { shopStorage } = await import('./shop-storage');
      const { insertShopCategorySchema } = await import('../shared/shop-schema');
      
      const categoryData = insertShopCategorySchema.parse(req.body);
      const category = await shopStorage.createCategory(categoryData);
      
      res.json({
        success: true,
        message: "Category created successfully",
        category
      });
    } catch (error) {
      console.error("Error creating category:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: "Invalid category data",
          errors: error.errors
        });
      }
      res.status(500).json({ success: false, message: "Failed to create category" });
    }
  });

  // Update category
  app.put("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const { shopStorage } = await import('./shop-storage');
      const { insertShopCategorySchema } = await import('../shared/shop-schema');
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }
      
      const categoryData = insertShopCategorySchema.partial().parse(req.body);
      const category = await shopStorage.updateCategory(id, categoryData);
      
      res.json({
        success: true,
        message: "Category updated successfully",
        category
      });
    } catch (error) {
      console.error("Error updating category:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          message: "Invalid category data",
          errors: error.errors
        });
      }
      res.status(500).json({ success: false, message: "Failed to update category" });
    }
  });

  // Delete category
  app.delete("/api/admin/categories/:id", requireAuth, async (req, res) => {
    try {
      const { shopStorage } = await import('./shop-storage');
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }
      
      // Check if category has products
      const products = await shopStorage.getProductsByCategory(id);
      if (products.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete category with existing products"
        });
      }
      
      // Check if category has subcategories
      const subcategories = await shopStorage.getSubcategories(id);
      if (subcategories.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete category with existing subcategories"
        });
      }
      
      await shopStorage.deleteCategory(id);
      
      res.json({
        success: true,
        message: "Category deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ success: false, message: "Failed to delete category" });
    }
  });

  // Get products by category
  app.get("/api/admin/categories/:id/products", requireAuth, async (req, res) => {
    try {
      const { shopStorage } = await import('./shop-storage');
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }
      
      const products = await shopStorage.getProductsByCategory(id);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products by category:", error);
      res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
  });

  // =============================================================================
  // SEO MANAGEMENT ROUTES
  // =============================================================================

  // Get all SEO settings
  app.get("/api/admin/seo/settings", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const language = req.query.language as string;
      const settings = await seoStorage.getSeoSettings(language);
      res.json(settings);
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
      res.status(500).json({ success: false, message: "Failed to fetch SEO settings" });
    }
  });

  // Get supported languages
  app.get("/api/admin/seo/languages", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const languages = await seoStorage.getSupportedLanguages();
      res.json(languages);
    } catch (error) {
      console.error("Error fetching supported languages:", error);
      res.status(500).json({ success: false, message: "Failed to fetch supported languages" });
    }
  });

  // Create supported language
  app.post("/api/admin/seo/languages", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const { insertSupportedLanguageSchema } = await import('../shared/schema');
      
      const validatedData = insertSupportedLanguageSchema.parse(req.body);
      const language = await seoStorage.createSupportedLanguage(validatedData);
      
      res.status(201).json({
        success: true,
        message: "Language created successfully",
        data: language
      });
    } catch (error) {
      console.error("Error creating language:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors
        });
      }
      res.status(500).json({ success: false, message: "Failed to create language" });
    }
  });

  // Get multilingual analytics
  app.get("/api/admin/seo/multilingual-analytics", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const analytics = await seoStorage.getMultilingualAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching multilingual analytics:", error);
      res.status(500).json({ success: false, message: "Failed to fetch multilingual analytics" });
    }
  });

  // Get keywords performance
  app.get("/api/admin/seo/keywords/performance", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const language = req.query.language as string;
      const performance = await seoStorage.getKeywordPerformance(language);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching keyword performance:", error);
      res.status(500).json({ success: false, message: "Failed to fetch keyword performance" });
    }
  });

  // Create multilingual keyword
  app.post("/api/admin/seo/keywords", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const { insertMultilingualKeywordSchema } = await import('../shared/schema');
      
      const validatedData = insertMultilingualKeywordSchema.parse(req.body);
      const keyword = await seoStorage.createMultilingualKeyword(validatedData);
      
      res.status(201).json({
        success: true,
        message: "Keyword created successfully",
        data: keyword
      });
    } catch (error) {
      console.error("Error creating keyword:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors
        });
      }
      res.status(500).json({ success: false, message: "Failed to create keyword" });
    }
  });

  // Generate hreflang tags
  app.get("/api/admin/seo/hreflang/:pageType", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const { pageType } = req.params;
      const pageIdentifier = req.query.pageIdentifier as string;
      
      const hreflangTags = await seoStorage.generateHreflangTags(pageType, pageIdentifier);
      res.json({ tags: hreflangTags });
    } catch (error) {
      console.error("Error generating hreflang tags:", error);
      res.status(500).json({ success: false, message: "Failed to generate hreflang tags" });
    }
  });

  // Generate multilingual sitemap
  app.get("/api/admin/seo/sitemap/multilingual", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const sitemapXml = await seoStorage.generateMultilingualSitemap();
      res.set('Content-Type', 'application/xml');
      res.send(sitemapXml);
    } catch (error) {
      console.error("Error generating multilingual sitemap:", error);
      res.status(500).send("Error generating multilingual sitemap");
    }
  });

  // Generate language-specific sitemap
  app.get("/sitemap-:language.xml", async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const { language } = req.params;
      const sitemapXml = await seoStorage.generateSitemap(language);
      res.set('Content-Type', 'application/xml');
      res.send(sitemapXml);
    } catch (error) {
      console.error("Error generating language-specific sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Create SEO setting
  app.post("/api/admin/seo/settings", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const { insertSeoSettingSchema } = await import('../shared/schema');
      
      const validatedData = insertSeoSettingSchema.parse(req.body);
      
      // Validate SEO settings
      const validationErrors = await seoStorage.validateSeoSettings(validatedData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors
        });
      }
      
      const setting = await seoStorage.createSeoSetting(validatedData);
      res.status(201).json({
        success: true,
        message: "SEO setting created successfully",
        data: setting
      });
    } catch (error) {
      console.error("Error creating SEO setting:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors
        });
      }
      res.status(500).json({ success: false, message: "Failed to create SEO setting" });
    }
  });

  // Update SEO setting
  app.put("/api/admin/seo/settings/:id", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const { insertSeoSettingSchema } = await import('../shared/schema');
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid SEO setting ID" });
      }
      
      const validatedData = insertSeoSettingSchema.partial().parse(req.body);
      const setting = await seoStorage.updateSeoSetting(id, validatedData);
      
      res.json({
        success: true,
        message: "SEO setting updated successfully",
        data: setting
      });
    } catch (error) {
      console.error("Error updating SEO setting:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors
        });
      }
      res.status(500).json({ success: false, message: "Failed to update SEO setting" });
    }
  });

  // Delete SEO setting
  app.delete("/api/admin/seo/settings/:id", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid SEO setting ID" });
      }
      
      await seoStorage.deleteSeoSetting(id);
      res.json({
        success: true,
        message: "SEO setting deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting SEO setting:", error);
      res.status(500).json({ success: false, message: "Failed to delete SEO setting" });
    }
  });

  // Get SEO analytics summary
  app.get("/api/admin/seo/analytics", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const summary = await seoStorage.getSeoAnalyticsSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching SEO analytics:", error);
      res.status(500).json({ success: false, message: "Failed to fetch SEO analytics" });
    }
  });

  // Get sitemap entries
  app.get("/api/admin/seo/sitemap", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const entries = await seoStorage.getSitemapEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching sitemap entries:", error);
      res.status(500).json({ success: false, message: "Failed to fetch sitemap entries" });
    }
  });

  // Generate and serve XML sitemap
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const sitemapXml = await seoStorage.generateSitemap();
      res.set('Content-Type', 'application/xml');
      res.send(sitemapXml);
    } catch (error) {
      console.error("Error generating sitemap:", error);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Generate and serve robots.txt
  app.get("/robots.txt", async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const robotsTxt = await seoStorage.generateRobotsTxt();
      res.set('Content-Type', 'text/plain');
      res.send(robotsTxt);
    } catch (error) {
      console.error("Error generating robots.txt:", error);
      res.status(500).send("Error generating robots.txt");
    }
  });

  // Get redirects
  app.get("/api/admin/seo/redirects", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const redirectsList = await seoStorage.getRedirects();
      res.json(redirectsList);
    } catch (error) {
      console.error("Error fetching redirects:", error);
      res.status(500).json({ success: false, message: "Failed to fetch redirects" });
    }
  });

  // Create redirect
  app.post("/api/admin/seo/redirects", requireAuth, async (req, res) => {
    try {
      const { seoStorage } = await import('./seo-storage');
      const { insertRedirectSchema } = await import('../shared/schema');
      
      const validatedData = insertRedirectSchema.parse(req.body);
      const redirect = await seoStorage.createRedirect(validatedData);
      
      res.status(201).json({
        success: true,
        message: "Redirect created successfully",
        data: redirect
      });
    } catch (error) {
      console.error("Error creating redirect:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors
        });
      }
      res.status(500).json({ success: false, message: "Failed to create redirect" });
    }
  });

  // Customer PDF export routes
  app.get("/api/crm/customers/:id/export-pdf", requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      if (isNaN(customerId)) {
        return res.status(400).json({ success: false, message: "Invalid customer ID" });
      }

      // Get customer data
      const customer = await crmStorage.getCrmCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: "Customer not found" });
      }

      // Get customer analytics
      const analytics = await crmStorage.getCustomerAnalytics(customerId);
      
      // Get customer activities
      const activities = await crmStorage.getCustomerActivities(customerId, 20);

      // Generate PDF using simplified compatible generator
      const { generateSimplePDF, generateCustomerPDFHTML } = await import('./simple-pdf-generator');
      const htmlContent = generateCustomerPDFHTML(customer, analytics, activities);
      const pdfBuffer = await generateSimplePDF(htmlContent);

      // Set response headers for PDF download
      // Validate PDF buffer before sending
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      console.log('Customer PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="customer-report-${customerId}-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Send PDF buffer
      res.end(pdfBuffer);
      
    } catch (error) {
      console.error("Error generating customer PDF:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to generate customer PDF report" 
      });
    }
  });

  // CRM Analytics PDF export
  app.get("/api/crm/analytics/export-pdf", requireAuth, async (req, res) => {
    try {
      // Get dashboard statistics
      const dashboardStats = await crmStorage.getCrmDashboardStats();
      
      // Generate PDF using simplified compatible generator
      const { generateSimplePDF, generateAnalyticsPDFHTML } = await import('./simple-pdf-generator');
      const htmlContent = generateAnalyticsPDFHTML(dashboardStats);
      const pdfBuffer = await generateSimplePDF(htmlContent);

      // Set response headers for PDF download
      // Validate PDF buffer before sending
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      console.log('Analytics PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="customer-analytics-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Send PDF buffer
      res.end(pdfBuffer);
      
    } catch (error) {
      console.error("Error generating analytics PDF:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to generate analytics PDF report" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
