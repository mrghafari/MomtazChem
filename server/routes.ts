import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertLeadSchema, insertLeadActivitySchema } from "@shared/schema";
import { insertContactSchema, insertShowcaseProductSchema, showcaseProducts } from "@shared/showcase-schema";
import { simpleCustomerStorage } from "./simple-customer-storage";
import { shopStorage } from "./shop-storage";
import { customerStorage } from "./customer-storage";
import { customerAddressStorage } from "./customer-address-storage";
import { emailStorage } from "./email-storage";
import { crmStorage } from "./crm-storage";
import { crmDb } from "./crm-db";
import { smsStorage } from "./sms-storage";
import { widgetRecommendationStorage } from "./widget-recommendation-storage";
import { orderManagementStorage } from "./order-management-storage";
import { walletStorage } from "./wallet-storage";
import { insertCustomerInquirySchema, insertEmailTemplateSchema, insertCustomerSchema, insertCustomerAddressSchema, walletRechargeRequests } from "@shared/customer-schema";
import { customerDb } from "./customer-db";
import { insertEmailCategorySchema, insertSmtpSettingSchema, insertEmailRecipientSchema, smtpConfigSchema, emailLogs, emailCategories, smtpSettings, emailRecipients } from "@shared/email-schema";
import { insertShopProductSchema, insertShopCategorySchema, paymentGateways, orders, shopProducts } from "@shared/shop-schema";
import { sendContactEmail, sendProductInquiryEmail } from "./email";
import TemplateProcessor from "./template-processor";
import InventoryAlertService from "./inventory-alerts";
import { db } from "./db";
import { sql, eq, and, or, isNull, isNotNull, desc } from "drizzle-orm";
import puppeteer from "puppeteer";
import { z } from "zod";
import * as schema from "@shared/schema";
const { crmCustomers } = schema;
import { orderManagement } from "@shared/order-management-schema";
import nodemailer from "nodemailer";
import { generateEAN13Barcode, validateEAN13, parseEAN13Barcode, isMomtazchemBarcode } from "@shared/barcode-utils";
import { generateSmartSKU, validateSKUUniqueness } from "./ai-sku-generator";

// Extend session type to include admin user and customer user
declare module "express-session" {
  interface SessionData {
    adminId?: number;
    customerId?: number;
    isAuthenticated?: boolean;
    departmentUser?: {
      id: number;
      username: string;
      department: string;
    };
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

// Admin authentication middleware
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
    res.status(401).json({ success: false, message: "احراز هویت مورد نیاز است" });
  }
};

// Customer authentication middleware  
const requireCustomerAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.customerId) {
    next();
  } else {
    res.status(401).json({ success: false, message: "احراز هویت مشتری مورد نیاز است" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from attached_assets directory
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));

  // =============================================================================
  // AI PRODUCT RECOMMENDATIONS API
  // =============================================================================
  
  // Generate AI-powered product recommendations
  app.post('/api/recommendations/analyze', async (req, res) => {
    try {
      const { getAIProductRecommendations } = await import('./ai-recommendations.ts');
      
      const recommendationRequest = req.body;
      
      // Validate required fields
      if (!recommendationRequest.industry || !recommendationRequest.application || !recommendationRequest.requirements) {
        return res.status(400).json({
          success: false,
          message: 'Industry, application, and requirements are required fields'
        });
      }

      const recommendations = await getAIProductRecommendations(recommendationRequest);
      
      res.json({
        success: true,
        data: recommendations
      });
    } catch (error) {
      console.error('Recommendation API Error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate recommendations'
      });
    }
  });

  // Generate follow-up recommendations based on additional information
  app.post('/api/recommendations/follow-up', async (req, res) => {
    try {
      const { generateFollowUpRecommendations } = await import('./ai-recommendations.ts');
      
      const { originalRequest, previousRecommendations, newInformation } = req.body;
      
      if (!originalRequest || !previousRecommendations || !newInformation) {
        return res.status(400).json({
          success: false,
          message: 'Original request, previous recommendations, and new information are required'
        });
      }

      const updatedRecommendations = await generateFollowUpRecommendations(
        originalRequest,
        previousRecommendations,
        newInformation
      );
      
      res.json({
        success: true,
        data: updatedRecommendations
      });
    } catch (error) {
      console.error('Follow-up Recommendation API Error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to generate follow-up recommendations'
      });
    }
  });
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
      console.error("Admin login error:", error);
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

  // Update product (PATCH method)
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

  // Update product (PUT method - for compatibility)
  app.put("/api/products/:id", requireAuth, async (req, res) => {
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
  // EAN-13 BARCODE MANAGEMENT API (GS1 Standard)
  // =============================================================================
  
  // Get EAN-13 records
  app.get("/api/ean13/records", requireAuth, async (req, res) => {
    try {
      // For now, return empty array - will be implemented when database schema is created
      res.json([]);
    } catch (error) {
      console.error("Error fetching EAN-13 records:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Bulk generate EAN-13 barcodes
  app.post("/api/ean13/bulk-generate", requireAuth, async (req, res) => {
    try {
      const { productIds } = req.body;
      
      if (!productIds || !Array.isArray(productIds)) {
        return res.status(400).json({
          success: false,
          message: "Product IDs array is required"
        });
      }

      let generated = 0;
      const companyPrefix = "12345"; // Should be obtained from GS1
      const countryCode = "864"; // Iraq
      
      for (const productId of productIds) {
        try {
          const products = await storage.getProducts();
          const product = products.find(p => p.id === productId);
          if (!product || (product.barcode && product.barcode.length === 13)) {
            continue; // Skip if product not found or already has EAN-13
          }

          // Generate EAN-13 barcode
          const productCode = String(productId).padStart(3, '0');
          const barcode12 = countryCode + companyPrefix + productCode;
          
          // Calculate check digit
          let sum = 0;
          for (let i = 0; i < 12; i++) {
            const digit = parseInt(barcode12[i]);
            sum += i % 2 === 0 ? digit : digit * 3;
          }
          const checkDigit = (10 - (sum % 10)) % 10;
          const ean13 = barcode12 + checkDigit.toString();

          // Update product with EAN-13
          await storage.updateProduct(productId, { barcode: ean13 });
          generated++;
        } catch (error) {
          console.error(`Error generating EAN-13 for product ${productId}:`, error);
        }
      }

      res.json({
        success: true,
        generated,
        message: `Generated ${generated} EAN-13 barcodes`
      });
    } catch (error) {
      console.error("Error in bulk EAN-13 generation:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Export EAN-13 data as CSV
  app.get("/api/ean13/export", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      const ean13Products = products.filter(p => p.barcode && p.barcode.length === 13);
      
      // Generate CSV content
      const csvHeader = "Product Name,SKU,EAN-13,Country Code,Company Prefix,Product Code,Check Digit,Category,Price\n";
      const csvRows = ean13Products.map(product => {
        const barcode = product.barcode!;
        const countryCode = barcode.substring(0, 3);
        const companyPrefix = barcode.substring(3, 8);
        const productCode = barcode.substring(8, 12);
        const checkDigit = barcode.substring(12, 13);
        
        return `"${product.name}","${product.sku}","${barcode}","${countryCode}","${companyPrefix}","${productCode}","${checkDigit}","${product.category}","${product.priceRange || 'N/A'}"`;
      }).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="EAN13_Export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting EAN-13 data:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Validate EAN-13 barcode
  app.post("/api/ean13/validate", requireAuth, async (req, res) => {
    try {
      const { barcode } = req.body;
      
      if (!barcode || typeof barcode !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Barcode is required"
        });
      }

      // Validate EAN-13 format
      if (barcode.length !== 13 || !/^\d+$/.test(barcode)) {
        return res.json({
          success: true,
          valid: false,
          message: "Invalid EAN-13 format"
        });
      }

      // Validate check digit
      let sum = 0;
      for (let i = 0; i < 12; i++) {
        const digit = parseInt(barcode[i]);
        sum += i % 2 === 0 ? digit : digit * 3;
      }
      const calculatedCheckDigit = (10 - (sum % 10)) % 10;
      const providedCheckDigit = parseInt(barcode[12]);
      
      const isValid = calculatedCheckDigit === providedCheckDigit;
      
      res.json({
        success: true,
        valid: isValid,
        checkDigit: calculatedCheckDigit,
        message: isValid ? "Valid EAN-13 barcode" : "Invalid check digit"
      });
    } catch (error) {
      console.error("Error validating EAN-13:", error);
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
        alternatePhone,
        state,
        industry,
        businessType,
        companySize,
        communicationPreference,
        preferredLanguage,
        marketingConsent,
        customerType,
        customerSource,
        productInterests,
        creditLimit,
        paymentTerms,
        preferredPaymentMethod,
        assignedSalesRep,
        tags,
        publicNotes
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

      // Create CRM customer first (central repository) with password for unified auth
      const crmCustomerData = {
        email,
        passwordHash: hashedPassword,
        firstName,
        lastName,
        company: company || null,
        phone,
        alternatePhone: alternatePhone || null,
        country,
        state: state || null,
        city,
        address,
        postalCode: postalCode || null,
        industry: industry || null,
        businessType: businessType || null,
        companySize: companySize || null,
        communicationPreference: communicationPreference || 'email',
        preferredLanguage: preferredLanguage || 'en',
        marketingConsent: marketingConsent || false,
        productInterests: productInterests || null,
        creditLimit: creditLimit || null,
        paymentTerms: paymentTerms || 'immediate',
        preferredPaymentMethod: preferredPaymentMethod || null,
        assignedSalesRep: assignedSalesRep || null,
        tags: tags || null,
        publicNotes: publicNotes || null,
        customerType: customerType || 'retail',
        customerSource: customerSource || 'website',
        customerStatus: 'active',
        createdBy: 'customer_registration',
        internalNotes: 'Customer registered through online shop',
        isActive: true,
      };

      const crmCustomer = await crmStorage.createCrmCustomer(crmCustomerData);

      // Create corresponding customer portal entry with password (for authentication)
      let portalCustomer = null;
      try {
        const portalData = {
          email: crmCustomerData.email,
          passwordHash: hashedPassword, // Password stored only in portal for authentication
          firstName: crmCustomerData.firstName,
          lastName: crmCustomerData.lastName,
          company: crmCustomerData.company,
          phone: crmCustomerData.phone,
          country: crmCustomerData.country,
          city: crmCustomerData.city,
          address: crmCustomerData.address,
          postalCode: crmCustomerData.postalCode,
          isActive: true,
        };
        portalCustomer = await customerStorage.createCustomer(portalData);
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
      
      // First, try to authenticate via CRM (primary source)
      const crmCustomer = await crmStorage.getCrmCustomerByEmail(email);
      let authenticatedCustomer = null;
      
      // Check CRM customer authentication first
      if (crmCustomer && crmCustomer.passwordHash) {
        const isValidPassword = await bcrypt.compare(password, crmCustomer.passwordHash);
        if (isValidPassword) {
          authenticatedCustomer = crmCustomer;
        }
      }
      
      // Fallback: Check customer portal for legacy accounts
      if (!authenticatedCustomer) {
        const portalCustomer = await customerStorage.verifyCustomerPassword(email, password);
        if (portalCustomer) {
          authenticatedCustomer = portalCustomer;
          // If portal customer exists but no CRM customer, migrate to CRM
          if (!crmCustomer) {
            try {
              const migratedCrmCustomer = await crmStorage.createCrmCustomer({
                email: portalCustomer.email,
                firstName: portalCustomer.firstName,
                lastName: portalCustomer.lastName,
                company: portalCustomer.company || '',
                phone: portalCustomer.phone || '',
                country: portalCustomer.country || '',
                city: portalCustomer.city || '',
                address: portalCustomer.address || '',
                postalCode: portalCustomer.postalCode,
                customerSource: 'legacy_migration',
                customerType: 'retail',
                customerStatus: 'active',
                isActive: true,
                internalNotes: 'Migrated from legacy customer portal',
              });
              (authenticatedCustomer as any).migratedCrmId = migratedCrmCustomer.id;
            } catch (migrationError) {
              console.log('CRM migration failed for legacy customer');
            }
          }
        }
      }

      if (!authenticatedCustomer) {
        return res.status(401).json({ 
          success: false, 
          message: "ایمیل یا رمز عبور اشتباه است" 
        });
      }

      // Store customer session - use CRM ID as primary
      const finalCrmCustomer = crmCustomer || (authenticatedCustomer as any).migratedCrmId ? 
        await crmStorage.getCrmCustomerById((authenticatedCustomer as any).migratedCrmId) : null;
        
      (req.session as any).customerId = authenticatedCustomer.id;
      (req.session as any).customerEmail = authenticatedCustomer.email;
      (req.session as any).crmCustomerId = finalCrmCustomer?.id || crmCustomer?.id;
      (req.session as any).isAuthenticated = true;

      // Log login activity in CRM
      if (finalCrmCustomer || crmCustomer) {
        const crmId = finalCrmCustomer?.id || crmCustomer?.id;
        if (crmId) {
          await crmStorage.logCustomerActivity({
            customerId: crmId,
          activityType: 'login',
          description: 'مشتری وارد فروشگاه آنلاین شد',
          performedBy: 'customer',
          activityData: {
            source: 'website',
            loginDate: new Date().toISOString(),
            userAgent: req.headers['user-agent'] || 'unknown',
            loginMethod: crmCustomer ? 'crm_direct' : 'portal_fallback'
          }
          });
        }
      }

      res.json({
        success: true,
        message: "ورود موفق",
        customer: {
          id: authenticatedCustomer.id,
          firstName: authenticatedCustomer.firstName,
          lastName: authenticatedCustomer.lastName,
          email: authenticatedCustomer.email,
          company: authenticatedCustomer.company,
          phone: authenticatedCustomer.phone,
          country: authenticatedCustomer.country,
          city: authenticatedCustomer.city,
          address: authenticatedCustomer.address,
          crmId: finalCrmCustomer?.id || crmCustomer?.id,
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

  // Update customer profile
  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const customerId = parseInt(req.params.id);
      const updateData = req.body;
      
      // Get session customer ID
      const sessionCustomerId = (req.session as any)?.customerId;
      const sessionCrmId = (req.session as any)?.crmCustomerId;
      
      // Ensure customer can only update their own profile
      if (customerId !== sessionCustomerId && customerId !== sessionCrmId) {
        return res.status(403).json({ 
          success: false, 
          message: "دسترسی مجاز نیست" 
        });
      }

      // Update customer in CRM (primary source)
      if (sessionCrmId) {
        const updatedCustomer = await crmStorage.updateCrmCustomer(sessionCrmId, updateData);
        res.json({
          success: true,
          message: "پروفایل با موفقیت بروزرسانی شد",
          customer: updatedCustomer
        });
      } else {
        // Fallback to portal customer update
        const updatedCustomer = await customerStorage.updateCustomer(customerId, updateData);
        res.json({
          success: true,
          message: "پروفایل با موفقیت بروزرسانی شد",
          customer: updatedCustomer
        });
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در بروزرسانی پروفایل" 
      });
    }
  });

  app.get("/api/customers/me", async (req, res) => {
    try {
      const customerId = (req.session as any)?.customerId;
      const crmCustomerId = (req.session as any)?.crmCustomerId;
      
      if (!customerId && !crmCustomerId) {
        return res.status(401).json({ 
          success: false, 
          message: "احراز هویت نشده" 
        });
      }

      // Prioritize CRM customer data
      let customer = null;
      let crmCustomer = null;

      if (crmCustomerId) {
        crmCustomer = await crmStorage.getCrmCustomerById(crmCustomerId);
        if (crmCustomer) {
          customer = crmCustomer; // Use CRM as primary source
        }
      }

      // Fallback to portal customer if CRM not available
      if (!customer && customerId) {
        const portalCustomer = await customerStorage.getCustomerById(customerId);
        if (portalCustomer) {
          customer = portalCustomer;
        }
      }

      if (!customer) {
        return res.status(404).json({ 
          success: false, 
          message: "مشتری یافت نشد" 
        });
      }

      res.json({
        success: true,
        customer: {
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          company: customer.company || '',
          phone: customer.phone || '',
          country: customer.country || '',
          city: customer.city || '',
          address: customer.address || '',
          postalCode: customer.postalCode,
          crmId: crmCustomer?.id || customer.id,
          totalOrders: crmCustomer?.totalOrdersCount || 0,
          totalOrderValue: crmCustomer?.totalSpent || "0",
          averageOrderValue: crmCustomer?.averageOrderValue || "0",
          lastOrderDate: crmCustomer?.lastOrderDate,
          customerStatus: crmCustomer?.customerStatus || 'active',
          customerType: crmCustomer?.customerType || 'retail',
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

  // Create customer order (from BilingualPurchaseForm)
  app.post("/api/customers/orders", async (req, res) => {
    try {
      const customerId = (req.session as any)?.customerId;
      const crmCustomerId = (req.session as any)?.crmCustomerId;
      const orderData = req.body;

      // Extract customer information from form data
      const customerInfo = {
        name: orderData.customerName,
        phone: orderData.phone,
        address: orderData.address,
        city: orderData.city,
        postalCode: orderData.postalCode || '',
      };

      // Generate unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      // Calculate order totals
      const subtotal = orderData.totalAmount || 0;
      const taxAmount = subtotal * 0.1; // 10% tax
      const shippingAmount = 50; // Fixed shipping amount
      const totalAmount = subtotal + taxAmount + shippingAmount;

      // Create order with proper customer linking
      let finalCustomerId = customerId;
      if (!customerId && crmCustomerId) {
        // Link to CRM customer if available
        finalCustomerId = crmCustomerId;
      }

      if (!finalCustomerId) {
        return res.status(401).json({
          success: false,
          message: "User must be logged in to place order"
        });
      }

      const order = await customerStorage.createOrder({
        customerId: finalCustomerId,
        orderNumber,
        status: "pending",
        paymentStatus: "pending",
        totalAmount: totalAmount.toString(),
        currency: orderData.currency || "IQD",
        notes: orderData.notes || "",
        billingAddress: JSON.stringify({
          name: customerInfo.name,
          phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
          postalCode: customerInfo.postalCode,
        }),
        shippingAddress: JSON.stringify({
          name: customerInfo.name,
          phone: customerInfo.phone,
          address: customerInfo.address,
          city: customerInfo.city,
          postalCode: customerInfo.postalCode,
          gpsLatitude: orderData.gpsLatitude,
          gpsLongitude: orderData.gpsLongitude,
        }),
        trackingNumber: null,
        carrier: null,
        paymentMethod: "cash_on_delivery",
      });

      // Create order items from cart
      if (orderData.cart) {
        for (const [productId, quantity] of Object.entries(orderData.cart)) {
          try {
            const product = await shopStorage.getShopProductById(parseInt(productId as string));
            if (product) {
              await customerStorage.createOrderItem({
                orderId: order.id,
                productId: parseInt(productId as string),
                productName: product.name,
                productSku: product.sku || `SKU-${productId}`,
                quantity: (quantity as number).toString(),
                unitPrice: product.price || "0",
                totalPrice: (parseFloat(product.price || "0") * (quantity as number)).toString(),
              });

              // Update product stock
              if (product.stockQuantity !== null && product.stockQuantity !== undefined) {
                const newQuantity = Math.max(0, product.stockQuantity - (quantity as number));
                await shopStorage.updateProductStock(
                  parseInt(productId as string),
                  newQuantity,
                  `Order ${orderNumber} - Sold ${quantity} units`
                );
              }
            }
          } catch (productError) {
            console.error(`Error processing product ${productId}:`, productError);
            // Continue with other products even if one fails
          }
        }
      }

      res.json({
        success: true,
        message: "Order created successfully",
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    } catch (error) {
      console.error("Error creating customer order:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create order"
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
      
      // Get actual row counts for major tables
      const getTableCount = async (tableName: string) => {
        try {
          const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
          return parseInt(result.rows[0].count);
        } catch {
          return 0;
        }
      };

      // Get table sizes and statistics
      const tableStats = await pool.query(`
        SELECT 
          t.table_name as tablename,
          COALESCE(s.n_tup_ins, 0) as total_inserts,
          COALESCE(s.n_tup_upd, 0) as total_updates,
          COALESCE(s.n_tup_del, 0) as total_deletes,
          COALESCE(s.n_live_tup, 0) as live_rows,
          pg_size_pretty(pg_total_relation_size(c.oid)) as table_size,
          pg_total_relation_size(c.oid) as size_bytes
        FROM information_schema.tables t
        LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
        LEFT JOIN pg_class c ON c.relname = t.table_name
        WHERE t.table_schema = 'public' 
          AND t.table_type = 'BASE TABLE'
        ORDER BY pg_total_relation_size(c.oid) DESC
        LIMIT 20;
      `);

      // Get actual counts for important tables
      const importantTables = ['users', 'products', 'showcase_products', 'shop_products', 'orders', 'crm_customers', 'customer_orders'];
      const tableStatsWithCounts = await Promise.all(
        tableStats.rows.map(async (table) => {
          let actualCount = table.live_rows;
          if (importantTables.includes(table.tablename)) {
            actualCount = await getTableCount(table.tablename);
          }
          return {
            ...table,
            live_rows: actualCount,
            actual_count: actualCount
          };
        })
      );
      
      const dbSize = await pool.query(`
        SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;
      `);
      
      const tableCount = await pool.query(`
        SELECT COUNT(*) as table_count 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
      `);

      // Get total records across all main tables
      const totalRecords = await Promise.all([
        getTableCount('users'),
        getTableCount('products'),
        getTableCount('showcase_products'),
        getTableCount('shop_products'),
        getTableCount('orders'),
        getTableCount('customer_orders'),
        getTableCount('crm_customers'),
        getTableCount('leads'),
        getTableCount('customer_inquiries')
      ]);

      const sumRecords = totalRecords.reduce((sum, count) => sum + count, 0);
      
      res.json({
        database_size: dbSize.rows[0].database_size,
        table_count: parseInt(tableCount.rows[0].table_count),
        total_records: sumRecords,
        table_stats: tableStatsWithCounts.sort((a, b) => b.actual_count - a.actual_count)
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

  // Advanced shop product search
  app.get("/api/shop/search", async (req, res) => {
    try {
      const {
        q: query = '',
        category,
        priceMin,
        priceMax,
        inStock,
        tags,
        sortBy = 'relevance',
        sortOrder = 'desc',
        limit = 20,
        offset = 0
      } = req.query;

      const filters = {
        category: category as string,
        priceMin: priceMin ? parseFloat(priceMin as string) : undefined,
        priceMax: priceMax ? parseFloat(priceMax as string) : undefined,
        inStock: inStock ? inStock === 'true' : undefined,
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        sortBy: sortBy as 'name' | 'price' | 'created' | 'relevance',
        sortOrder: sortOrder as 'asc' | 'desc',
        limit: parseInt(limit as string) || 20,
        offset: parseInt(offset as string) || 0
      };

      const searchResults = await shopStorage.searchShopProducts(query as string, filters);
      
      res.json({
        success: true,
        data: searchResults,
        query: {
          searchTerm: query,
          filters: filters,
          pagination: {
            limit: filters.limit,
            offset: filters.offset,
            total: searchResults.total,
            pages: Math.ceil(searchResults.total / filters.limit)
          }
        }
      });
    } catch (error) {
      console.error("Error searching shop products:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to search products",
        error: error.message 
      });
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

  // Payment processing endpoints
  app.post("/api/shop/orders/:id/payment", async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      if (isNaN(orderId)) {
        return res.status(400).json({ success: false, message: "Invalid order ID" });
      }

      const { paymentStatus, paymentMethod, transactionId, paymentData } = req.body;
      
      // Get the order from customer_orders table
      const order = await customerStorage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "Order not found" });
      }

      // Update order with payment information
      const updatedOrder = await customerStorage.updateOrder(orderId, {
        status: paymentStatus === 'paid' ? 'payment_confirmed' : order.status,
        notes: order.notes ? `${order.notes}\n\nPayment processed: ${paymentMethod}${transactionId ? ` (ID: ${transactionId})` : ''}` 
               : `Payment processed: ${paymentMethod}${transactionId ? ` (ID: ${transactionId})` : ''}`
      });

      // Log the payment activity in CRM if customer exists
      if (order.customerId) {
        try {
          await crmStorage.logCustomerActivity({
            customerId: order.customerId,
            activityType: 'payment_processed',
            description: `Payment of ${order.totalAmount} processed via ${paymentMethod}${transactionId ? ` (Transaction: ${transactionId})` : ''}`,
            performedBy: 'System',
            relatedOrderId: orderId
          });
        } catch (crmError) {
          console.warn("Failed to log payment activity to CRM:", crmError);
        }
      }

      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error("Error updating payment status:", error);
      res.status(500).json({ success: false, message: "Failed to update payment status" });
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
      console.log("Updating discount", discountId, "with updates:", updates);
      
      const discount = await shopStorage.updateDiscountSetting(discountId, updates);
      console.log("Discount updated successfully:", discount);
      
      res.json(discount);
    } catch (error) {
      console.error("Error updating discount:", error);
      console.error("Error details:", error instanceof Error ? error.message : error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update discount",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
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

  // Sync centralized discount settings to all products
  app.post("/api/shop/discounts/sync-to-products", requireAuth, async (req, res) => {
    try {
      // Get active discount settings
      const activeDiscounts = await shopStorage.getActiveDiscountSettings();
      
      // Convert to product quantityDiscounts format
      const quantityDiscounts = activeDiscounts.map((discount: any) => ({
        minQty: discount.minQuantity,
        discount: parseFloat(discount.discountPercentage) / 100
      })).sort((a: any, b: any) => a.minQty - b.minQty);

      // Get all products without quantity discounts
      const products = await shopStorage.getShopProducts();
      const productsToUpdate = products.filter((product: any) => 
        !product.quantityDiscounts || product.quantityDiscounts === null
      );

      // Update each product with the centralized discounts
      let updatedCount = 0;
      for (const product of productsToUpdate) {
        await shopStorage.updateShopProduct(product.id, {
          quantityDiscounts: JSON.stringify(quantityDiscounts)
        });
        updatedCount++;
      }

      res.json({
        success: true,
        message: `Applied centralized discounts to ${updatedCount} products`,
        discountsApplied: quantityDiscounts,
        productsUpdated: updatedCount,
        totalProducts: products.length
      });
    } catch (error) {
      console.error("Error syncing discounts to products:", error);
      res.status(500).json({ success: false, message: "Failed to sync discounts to products" });
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
      
      // Validate categoryId
      const categoryIdNum = parseInt(categoryId);
      if (isNaN(categoryIdNum)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category ID"
        });
      }
      
      // Delete existing recipients for this category
      const existingRecipients = await emailStorage.getRecipientsByCategory(categoryIdNum);
      for (const recipient of existingRecipients) {
        await emailStorage.deleteRecipient(recipient.id);
      }
      
      // Add new recipients
      const createdRecipients = [];
      for (const recipientData of recipients) {
        // Clean the recipient data to remove any invalid fields
        const cleanedData = {
          email: recipientData.email,
          name: recipientData.name || null,
          isPrimary: Boolean(recipientData.isPrimary),
          isActive: Boolean(recipientData.isActive !== false), // default to true
          receiveTypes: Array.isArray(recipientData.receiveTypes) ? recipientData.receiveTypes : [],
          recipientType: recipientData.recipientType || 'to', // 'to', 'cc', 'bcc'
          categoryId: categoryIdNum
        };
        
        const recipient = await emailStorage.createRecipient(cleanedData);
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
        message: "Failed to update recipients",
        error: error instanceof Error ? error.message : 'Unknown error'
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

  // Get current customer profile
  app.get("/api/customers/me", async (req: Request, res: Response) => {
    try {
      const customerId = (req.session as any)?.customerId;
      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: "احراز هویت نشده"
        });
      }

      const customer = await crmStorage.getCrmCustomerById(customerId);
      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "مشتری یافت نشد"
        });
      }

      res.json({
        success: true,
        data: customer
      });

    } catch (error) {
      console.error("Error fetching customer profile:", error);
      res.status(500).json({
        success: false,
        message: "خطا در دریافت اطلاعات پروفایل"
      });
    }
  });

  // Customer profile update endpoint
  app.put("/api/customers/profile", async (req: Request, res: Response) => {
    try {
      const customerId = (req.session as any)?.customerId;
      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: "احراز هویت نشده"
        });
      }

      const {
        firstName,
        lastName,
        phone,
        company,
        country,
        city,
        address,
        postalCode,
        businessType,
        notes
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !phone || !country || !city || !address) {
        return res.status(400).json({
          success: false,
          message: "فیلدهای اجباری را تکمیل کنید"
        });
      }

      // Update customer profile in CRM
      const updatedCustomer = await crmStorage.updateCrmCustomer(customerId, {
        firstName,
        lastName,
        phone,
        company: company || null,
        country,
        city,
        address,
        postalCode: postalCode || null,
        businessType: businessType || null
      });

      // Log activity
      await crmStorage.logCustomerActivity({
        customerId,
        activityType: 'profile_updated',
        description: `Customer updated their profile information`,
        performedBy: 'Customer'
      });

      res.json({
        success: true,
        message: "پروفایل با موفقیت بروزرسانی شد",
        customer: updatedCustomer
      });

    } catch (error) {
      console.error("Error updating customer profile:", error);
      res.status(500).json({
        success: false,
        message: "خطا در بروزرسانی پروفایل"
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
        const transporter = nodemailer.createTransport({
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
        const transporter = nodemailer.createTransport({
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

  // =============================================================================
  // SMS AUTHENTICATION MANAGEMENT ROUTES
  // =============================================================================

  // Get SMS settings (admin only)
  app.get("/api/admin/sms/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const settings = await smsStorage.getSmsSettings();
      res.json({ 
        success: true, 
        data: settings || {
          isEnabled: false,
          provider: 'kavenegar',
          codeLength: 6,
          codeExpiry: 300,
          maxAttempts: 3,
          rateLimitMinutes: 60
        }
      });
    } catch (error) {
      console.error("Error fetching SMS settings:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت تنظیمات SMS" });
    }
  });

  // Update SMS settings (admin only)
  app.put("/api/admin/sms/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const { isEnabled, provider, apiKey, apiSecret, senderNumber, codeLength, codeExpiry, maxAttempts, rateLimitMinutes } = req.body;
      
      const settings = await smsStorage.updateSmsSettings({
        isEnabled,
        provider,
        apiKey,
        apiSecret,
        senderNumber,
        codeLength,
        codeExpiry,
        maxAttempts,
        rateLimitMinutes
      });

      res.json({ success: true, data: settings, message: "تنظیمات SMS با موفقیت به‌روزرسانی شد" });
    } catch (error) {
      console.error("Error updating SMS settings:", error);
      res.status(500).json({ success: false, message: "خطا در به‌روزرسانی تنظیمات SMS" });
    }
  });

  // Toggle SMS system (admin only)
  app.post("/api/admin/sms/toggle", requireAuth, async (req: Request, res: Response) => {
    try {
      const { enabled } = req.body;
      const adminId = req.session.adminId;
      const adminUsername = 'Admin';
      
      const settings = await smsStorage.toggleSmsSystem(enabled, adminUsername);
      
      res.json({ 
        success: true, 
        data: settings, 
        message: enabled ? "سیستم SMS فعال شد" : "سیستم SMS غیرفعال شد"
      });
    } catch (error) {
      console.error("Error toggling SMS system:", error);
      res.status(500).json({ success: false, message: "خطا در تغییر وضعیت سیستم SMS" });
    }
  });

  // Get customer SMS settings (admin only)
  app.get("/api/admin/customers/:customerId/sms", requireAuth, async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const settings = await smsStorage.getCustomerSmsSettings(parseInt(customerId));
      
      res.json({ 
        success: true, 
        data: settings || { 
          customerId: parseInt(customerId),
          smsAuthEnabled: false
        }
      });
    } catch (error) {
      console.error("Error fetching customer SMS settings:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت تنظیمات SMS مشتری" });
    }
  });

  // Enable SMS for customer (admin only)
  app.post("/api/admin/customers/:customerId/sms/enable", requireAuth, async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const adminId = req.session.adminId;
      
      // Get admin username for logging
      const adminUsername = 'Admin';
      
      const settings = await smsStorage.enableCustomerSms(parseInt(customerId), adminUsername);
      
      // Log activity in CRM
      await crmStorage.logCustomerActivity({
        customerId: parseInt(customerId),
        activityType: 'sms_enabled',
        description: `SMS authentication enabled by admin: ${adminUsername}`,
        performedBy: adminUsername
      });
      
      res.json({ 
        success: true, 
        data: settings, 
        message: "احراز هویت SMS برای مشتری فعال شد"
      });
    } catch (error) {
      console.error("Error enabling customer SMS:", error);
      res.status(500).json({ success: false, message: "خطا در فعال‌سازی SMS مشتری" });
    }
  });

  // Disable SMS for customer (admin only)
  app.post("/api/admin/customers/:customerId/sms/disable", requireAuth, async (req: Request, res: Response) => {
    try {
      const { customerId } = req.params;
      const adminId = req.session.adminId;
      
      // Get admin username for logging
      const adminUsername = 'Admin';
      
      const settings = await smsStorage.disableCustomerSms(parseInt(customerId), adminUsername);
      
      // Log activity in CRM
      await crmStorage.logCustomerActivity({
        customerId: parseInt(customerId),
        activityType: 'sms_disabled',
        description: `SMS authentication disabled by admin: ${adminUsername}`,
        performedBy: adminUsername
      });
      
      res.json({ 
        success: true, 
        data: settings, 
        message: "احراز هویت SMS برای مشتری غیرفعال شد"
      });
    } catch (error) {
      console.error("Error disabling customer SMS:", error);
      res.status(500).json({ success: false, message: "خطا در غیرفعال‌سازی SMS مشتری" });
    }
  });

  // Get all customers with SMS settings (admin only)
  app.get("/api/admin/sms/customers", requireAuth, async (req: Request, res: Response) => {
    try {
      const customers = await crmStorage.getCrmCustomers(100, 0);
      
      const customerSmsData = customers.map(customer => ({
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone || '',
        company: customer.company,
        smsEnabled: customer.smsEnabled === true, // Explicit boolean check
        customerStatus: customer.customerStatus,
        totalOrders: customer.totalOrdersCount || 0,
        lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('fa-IR') : null
      }));
      
      res.json({ success: true, data: customerSmsData });
    } catch (error) {
      console.error("Error fetching customer SMS settings:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت تنظیمات SMS مشتریان" });
    }
  });

  // Update individual customer SMS setting (admin only)
  app.put("/api/admin/sms/customers/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const customerId = parseInt(req.params.id);
      const { smsEnabled } = req.body;
      
      if (typeof smsEnabled !== 'boolean') {
        return res.status(400).json({ success: false, message: "مقدار SMS نامعتبر است" });
      }
      
      // First check if customer exists
      const existingCustomer = await crmStorage.getCrmCustomerById(customerId);
      if (!existingCustomer) {
        return res.status(404).json({ 
          success: false, 
          message: "مشتری یافت نشد" 
        });
      }
      
      // Update customer SMS setting
      await crmStorage.updateCrmCustomer(customerId, { smsEnabled });
      
      // Log activity
      await crmStorage.logCustomerActivity({
        customerId,
        activityType: "sms_setting_changed",
        description: `SMS ${smsEnabled ? 'فعال' : 'غیرفعال'} شد توسط ادمین`,
        performedBy: req.session?.adminId?.toString() || 'admin',
        activityData: { smsEnabled, changedBy: 'admin' }
      });
      
      res.json({ 
        success: true, 
        message: `SMS برای مشتری ${smsEnabled ? 'فعال' : 'غیرفعال'} شد`
      });
    } catch (error) {
      console.error("Error updating customer SMS setting:", error);
      res.status(500).json({ success: false, message: "خطا در بروزرسانی تنظیمات SMS" });
    }
  });

  // Bulk enable/disable SMS for all customers (admin only)
  app.post("/api/admin/sms/customers/bulk", requireAuth, async (req: Request, res: Response) => {
    try {
      const { action } = req.body; // 'enable' or 'disable'
      
      if (!['enable', 'disable'].includes(action)) {
        return res.status(400).json({ success: false, message: "عملیات نامعتبر است" });
      }
      
      const smsEnabled = action === 'enable';
      
      // Get all customers
      const customers = await crmStorage.getCrmCustomers(1000, 0);
      
      // Update all customers
      for (const customer of customers) {
        await crmStorage.updateCrmCustomer(customer.id, { smsEnabled });
        
        // Log activity for each customer
        await crmStorage.logCustomerActivity({
          customerId: customer.id,
          activityType: "sms_bulk_setting_changed",
          description: `SMS ${smsEnabled ? 'فعال' : 'غیرفعال'} شد برای همه مشتریان توسط ادمین`,
          performedBy: req.session?.adminId?.toString() || 'admin',
          activityData: { smsEnabled, action: 'bulk', changedBy: 'admin' }
        });
      }
      
      res.json({ 
        success: true, 
        message: `SMS برای ${customers.length} مشتری ${smsEnabled ? 'فعال' : 'غیرفعال'} شد`
      });
    } catch (error) {
      console.error("Error bulk updating customer SMS settings:", error);
      res.status(500).json({ success: false, message: "خطا در بروزرسانی انبوه تنظیمات SMS" });
    }
  });

  // Get SMS statistics (admin only)
  app.get("/api/admin/sms/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const stats = await smsStorage.getSmsStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error("Error fetching SMS stats:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت آمار SMS" });
    }
  });

  // Send SMS verification code (public endpoint for customer login)
  app.post("/api/sms/send-verification", async (req: Request, res: Response) => {
    try {
      const { phone, purpose } = req.body;
      
      if (!phone || !purpose) {
        return res.status(400).json({ success: false, message: "شماره تلفن و هدف الزامی است" });
      }
      
      // Check if SMS system is enabled
      const settings = await smsStorage.getSmsSettings();
      if (!settings?.isEnabled) {
        return res.status(503).json({ success: false, message: "سیستم احراز هویت SMS غیرفعال است" });
      }
      
      // Generate verification code
      const code = Math.random().toString().slice(2, 2 + (settings.codeLength || 6));
      const expiresAt = new Date(Date.now() + (settings.codeExpiry || 300) * 1000);
      
      // Save verification code
      await smsStorage.createVerification({
        phone,
        code,
        purpose,
        expiresAt
      });
      
      // Here you would integrate with SMS provider (Kavenegar, etc.)
      // For now, we'll just log the code for development
      console.log(`SMS Verification Code for ${phone}: ${code}`);
      
      res.json({ 
        success: true, 
        message: "کد تأیید ارسال شد",
        // In production, don't send the code in response
        ...(process.env.NODE_ENV === 'development' && { code })
      });
    } catch (error) {
      console.error("Error sending SMS verification:", error);
      res.status(500).json({ success: false, message: "خطا در ارسال کد تأیید" });
    }
  });

  // Verify SMS code (public endpoint for customer login)
  app.post("/api/sms/verify-code", async (req: Request, res: Response) => {
    try {
      const { phone, code, purpose } = req.body;
      
      if (!phone || !code || !purpose) {
        return res.status(400).json({ success: false, message: "شماره تلفن، کد تأیید و هدف الزامی است" });
      }
      
      // Find verification
      const verification = await smsStorage.getVerification(phone, code, purpose);
      
      if (!verification) {
        return res.status(400).json({ success: false, message: "کد تأیید نامعتبر یا منقضی شده است" });
      }
      
      // Mark as used
      await smsStorage.markVerificationUsed(verification.id);
      
      res.json({ 
        success: true, 
        message: "کد تأیید با موفقیت تأیید شد"
      });
    } catch (error) {
      console.error("Error verifying SMS code:", error);
      res.status(500).json({ success: false, message: "خطا در تأیید کد" });
    }
  });

  // ============================================================================
  // CUSTOMER ADDRESS MANAGEMENT ROUTES
  // ============================================================================

  // Get customer addresses
  app.get("/api/customers/addresses", async (req: Request, res: Response) => {
    try {
      if (!req.session?.customerId) {
        return res.status(401).json({ success: false, message: "احراز هویت نشده" });
      }

      const addresses = await customerAddressStorage.getCustomerAddresses(req.session.customerId);
      res.json({ success: true, addresses });
    } catch (error) {
      console.error("Error fetching customer addresses:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت آدرس‌ها" });
    }
  });

  // Create new address
  app.post("/api/customers/addresses", async (req: Request, res: Response) => {
    try {
      if (!req.session?.customerId) {
        return res.status(401).json({ success: false, message: "احراز هویت نشده" });
      }

      // Get customer info to auto-fill firstName and lastName
      const customer = await crmStorage.getCrmCustomerById(req.session.customerId);
      if (!customer) {
        return res.status(404).json({ success: false, message: "مشتری یافت نشد" });
      }

      const addressData = insertCustomerAddressSchema.parse({
        ...req.body,
        customerId: req.session.customerId,
        firstName: customer.firstName,
        lastName: customer.lastName
      });

      const newAddress = await customerAddressStorage.createAddress(addressData);
      res.json({ success: true, address: newAddress, message: "آدرس جدید با موفقیت ایجاد شد" });
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ success: false, message: "خطا در ایجاد آدرس جدید" });
    }
  });

  // Update address
  app.put("/api/customers/addresses/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session?.customerId) {
        return res.status(401).json({ success: false, message: "احراز هویت نشده" });
      }

      const addressId = parseInt(req.params.id);
      const existingAddress = await customerAddressStorage.getAddressById(addressId);
      
      if (!existingAddress || existingAddress.customerId !== req.session.customerId) {
        return res.status(404).json({ success: false, message: "آدرس یافت نشد" });
      }

      const updatedAddress = await customerAddressStorage.updateAddress(addressId, req.body);
      res.json({ success: true, address: updatedAddress, message: "آدرس با موفقیت بروزرسانی شد" });
    } catch (error) {
      console.error("Error updating address:", error);
      res.status(500).json({ success: false, message: "خطا در بروزرسانی آدرس" });
    }
  });

  // Delete address
  app.delete("/api/customers/addresses/:id", async (req: Request, res: Response) => {
    try {
      if (!req.session?.customerId) {
        return res.status(401).json({ success: false, message: "احراز هویت نشده" });
      }

      const addressId = parseInt(req.params.id);
      const existingAddress = await customerAddressStorage.getAddressById(addressId);
      
      if (!existingAddress || existingAddress.customerId !== req.session.customerId) {
        return res.status(404).json({ success: false, message: "آدرس یافت نشد" });
      }

      await customerAddressStorage.deleteAddress(addressId);
      res.json({ success: true, message: "آدرس با موفقیت حذف شد" });
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ success: false, message: "خطا در حذف آدرس" });
    }
  });

  // Set default address
  app.post("/api/customers/addresses/:id/set-default", async (req: Request, res: Response) => {
    try {
      if (!req.session?.customerId) {
        return res.status(401).json({ success: false, message: "احراز هویت نشده" });
      }

      const addressId = parseInt(req.params.id);
      const existingAddress = await customerAddressStorage.getAddressById(addressId);
      
      if (!existingAddress || existingAddress.customerId !== req.session.customerId) {
        return res.status(404).json({ success: false, message: "آدرس یافت نشد" });
      }

      await customerAddressStorage.setDefaultAddress(req.session.customerId, addressId);
      res.json({ success: true, message: "آدرس پیش‌فرض تنظیم شد" });
    } catch (error) {
      console.error("Error setting default address:", error);
      res.status(500).json({ success: false, message: "خطا در تنظیم آدرس پیش‌فرض" });
    }
  });

  // =============================================================================
  // WIDGET RECOMMENDATION API ROUTES
  // =============================================================================

  // Get available dashboard widgets
  app.get("/api/admin/widgets", requireAuth, async (req: Request, res: Response) => {
    try {
      const { category, userLevel } = req.query;
      const widgets = await widgetRecommendationStorage.getWidgets(
        category as string, 
        userLevel as string || 'admin'
      );
      res.json({ success: true, data: widgets });
    } catch (error) {
      console.error("Error fetching widgets:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت ویجت‌ها" });
    }
  });

  // Get user's widget preferences
  app.get("/api/admin/widgets/preferences", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.adminId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "احراز هویت مورد نیاز است" });
      }

      const preferences = await widgetRecommendationStorage.getUserPreferences(userId);
      res.json({ success: true, data: preferences });
    } catch (error) {
      console.error("Error fetching widget preferences:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت تنظیمات ویجت‌ها" });
    }
  });

  // Toggle widget visibility
  app.post("/api/admin/widgets/:widgetId/toggle", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.adminId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "احراز هویت مورد نیاز است" });
      }

      const widgetId = parseInt(req.params.widgetId);
      const preference = await widgetRecommendationStorage.toggleWidgetVisibility(userId, widgetId);
      
      res.json({ 
        success: true, 
        data: preference,
        message: `ویجت ${preference.isVisible ? 'نمایش داده می‌شود' : 'مخفی شد'}` 
      });
    } catch (error) {
      console.error("Error toggling widget visibility:", error);
      res.status(500).json({ success: false, message: "خطا در تغییر نمایش ویجت" });
    }
  });

  // Track widget usage
  app.post("/api/admin/widgets/:widgetId/track", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.adminId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "احراز هویت مورد نیاز است" });
      }

      const widgetId = parseInt(req.params.widgetId);
      const { action, duration, sessionId } = req.body;

      await widgetRecommendationStorage.trackWidgetUsage({
        userId,
        widgetId,
        action,
        duration,
        sessionId,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });

      res.json({ success: true, message: "استفاده از ویجت ثبت شد" });
    } catch (error) {
      console.error("Error tracking widget usage:", error);
      res.status(500).json({ success: false, message: "خطا در ثبت استفاده از ویجت" });
    }
  });

  // Get widget recommendations for user
  app.get("/api/admin/widgets/recommendations", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.adminId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "احراز هویت مورد نیاز است" });
      }

      const recommendations = await widgetRecommendationStorage.getRecommendationsForUser(userId);
      res.json({ success: true, data: recommendations });
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت پیشنهادات" });
    }
  });

  // Generate new recommendations
  app.post("/api/admin/widgets/recommendations/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.adminId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "احراز هویت مورد نیاز است" });
      }

      const recommendations = await widgetRecommendationStorage.generateRecommendations(userId);
      res.json({ 
        success: true, 
        data: recommendations,
        message: `${recommendations.length} پیشنهاد جدید تولید شد` 
      });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ success: false, message: "خطا در تولید پیشنهادات" });
    }
  });

  // Accept recommendation
  app.post("/api/admin/widgets/recommendations/:recommendationId/accept", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.adminId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "احراز هویت مورد نیاز است" });
      }

      const recommendationId = parseInt(req.params.recommendationId);
      await widgetRecommendationStorage.acceptRecommendation(userId, recommendationId);
      
      res.json({ success: true, message: "پیشنهاد پذیرفته شد و ویجت اضافه شد" });
    } catch (error) {
      console.error("Error accepting recommendation:", error);
      res.status(500).json({ success: false, message: "خطا در پذیرش پیشنهاد" });
    }
  });

  // Dismiss recommendation
  app.post("/api/admin/widgets/recommendations/:recommendationId/dismiss", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.adminId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "احراز هویت مورد نیاز است" });
      }

      const recommendationId = parseInt(req.params.recommendationId);
      await widgetRecommendationStorage.dismissRecommendation(userId, recommendationId);
      
      res.json({ success: true, message: "پیشنهاد رد شد" });
    } catch (error) {
      console.error("Error dismissing recommendation:", error);
      res.status(500).json({ success: false, message: "خطا در رد پیشنهاد" });
    }
  });

  // Get popular widgets
  app.get("/api/admin/widgets/popular", requireAuth, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const popularWidgets = await widgetRecommendationStorage.getPopularWidgets(limit);
      res.json({ success: true, data: popularWidgets });
    } catch (error) {
      console.error("Error fetching popular widgets:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت ویجت‌های محبوب" });
    }
  });

  // Get user activity summary
  app.get("/api/admin/widgets/activity", requireAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.session?.adminId;
      if (!userId) {
        return res.status(401).json({ success: false, message: "احراز هویت مورد نیاز است" });
      }

      const days = parseInt(req.query.days as string) || 30;
      const activity = await widgetRecommendationStorage.getUserActivitySummary(userId, days);
      res.json({ success: true, data: activity });
    } catch (error) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت فعالیت کاربر" });
    }
  });

  // =============================================================================
  // ORDER MANAGEMENT API ROUTES (3-Department System)
  // =============================================================================

  // Get orders for specific department (respects workflow sequence)
  app.get('/api/order-management/:department', requireAuth, async (req, res) => {
    try {
      const department = req.params.department as 'financial' | 'warehouse' | 'logistics';
      
      if (!['financial', 'warehouse', 'logistics'].includes(department)) {
        return res.status(400).json({ success: false, message: 'بخش نامعتبر است' });
      }

      const orders = await orderManagementStorage.getOrdersByDepartment(department);
      res.json({ success: true, orders });
    } catch (error) {
      console.error(`Error fetching ${req.params.department} orders:`, error);
      res.status(500).json({ success: false, message: 'خطا در دریافت سفارشات' });
    }
  });

  // Update order status (department-specific)
  app.put('/api/order-management/:id/status', requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { newStatus, department, notes } = req.body;
      const adminId = req.session.adminId!;

      // Validate that admin can perform this action
      const canView = await orderManagementStorage.canDepartmentViewOrder(orderId, department);
      if (!canView) {
        return res.status(403).json({ success: false, message: 'دسترسی به این سفارش مجاز نیست' });
      }

      const updatedOrder = await orderManagementStorage.updateOrderStatus(
        orderId, 
        newStatus, 
        adminId, 
        department, 
        notes
      );

      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ success: false, message: 'خطا در بروزرسانی وضعیت سفارش' });
    }
  });

  // Get order status history
  app.get('/api/order-management/:id/history', requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const history = await orderManagementStorage.getOrderStatusHistory(orderId);
      res.json({ success: true, history });
    } catch (error) {
      console.error('Error fetching order history:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت تاریخچه سفارش' });
    }
  });

  // Upload payment receipt (customer action)
  app.post('/api/order-management/:customerOrderId/payment-receipt', upload.single('receipt'), async (req, res) => {
    try {
      const customerOrderId = parseInt(req.params.customerOrderId);
      const customerId = req.session.customerId;

      if (!customerId) {
        return res.status(401).json({ success: false, message: 'احراز هویت نشده' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'فایل رسید الزامی است' });
      }

      // Save payment receipt
      const receipt = await orderManagementStorage.uploadPaymentReceipt({
        customerOrderId,
        customerId,
        receiptUrl: `/uploads/documents/${req.file.filename}`,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        notes: req.body.notes || ''
      });

      // Update order status to PAYMENT_UPLOADED
      const orderMgmt = await orderManagementStorage.getOrderManagementByCustomerOrderId(customerOrderId);
      if (orderMgmt) {
        await orderManagementStorage.updateOrderStatus(
          orderMgmt.id,
          'payment_uploaded' as any,
          customerId,
          'financial' as any,
          'رسید پرداخت توسط مشتری آپلود شد'
        );
      }

      res.json({ success: true, receipt });
    } catch (error) {
      console.error('Error uploading payment receipt:', error);
      res.status(500).json({ success: false, message: 'خطا در آپلود رسید پرداخت' });
    }
  });

  // Verify delivery code (logistics department)
  app.post('/api/order-management/verify-delivery', requireAuth, async (req, res) => {
    try {
      const { code, verifiedBy } = req.body;
      const verified = await orderManagementStorage.verifyDeliveryCode(code, verifiedBy);
      
      if (verified) {
        res.json({ success: true, message: 'کد تحویل با موفقیت تایید شد' });
      } else {
        res.status(400).json({ success: false, message: 'کد تحویل نامعتبر یا منقضی شده' });
      }
    } catch (error) {
      console.error('Error verifying delivery code:', error);
      res.status(500).json({ success: false, message: 'خطا در تایید کد تحویل' });
    }
  });

  // Assign user to department
  app.post('/api/order-management/assign-department', requireAuth, async (req, res) => {
    try {
      const { adminUserId, department } = req.body;
      const assignedBy = req.session.adminId!;

      const assignment = await orderManagementStorage.assignUserToDepartment({
        adminUserId,
        department,
        assignedBy
      });

      res.json({ success: true, assignment });
    } catch (error) {
      console.error('Error assigning user to department:', error);
      res.status(500).json({ success: false, message: 'خطا در تخصیص کاربر به بخش' });
    }
  });

  // Get department stats
  app.get('/api/order-management/stats/:department', requireAuth, async (req, res) => {
    try {
      const department = req.params.department as 'financial' | 'warehouse' | 'logistics';
      const stats = await orderManagementStorage.getDepartmentStats(department);
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching department stats:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت آمار بخش' });
    }
  });

  // Get orders overview (admin dashboard)
  app.get('/api/order-management/overview', requireAuth, async (req, res) => {
    try {
      const overview = await orderManagementStorage.getOrdersOverview();
      res.json({ success: true, overview });
    } catch (error) {
      console.error('Error fetching orders overview:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت نمای کلی سفارشات' });
    }
  });

  // ============================================================================
  // DEPARTMENT-SPECIFIC AUTHENTICATION & ROUTES
  // ============================================================================

  // Department authentication middleware
  function requireDepartmentAuth(department: string) {
    return (req: any, res: any, next: any) => {
      if (!req.session?.departmentUser || req.session.departmentUser.department !== department) {
        return res.status(401).json({ success: false, message: "احراز هویت نشده" });
      }
      next();
    };
  }

  // ============================================================================
  // FINANCIAL DEPARTMENT ROUTES
  // ============================================================================

  // Financial login
  app.post('/api/financial/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Check if user exists and has financial department access
      const [user] = await db
        .select()
        .from(schema.users)
        .where(and(
          eq(schema.users.username, username),
          eq(schema.users.department, 'financial'),
          eq(schema.users.isActive, true)
        ));

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "نام کاربری یا رمز عبور اشتباه است" 
        });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          message: "نام کاربری یا رمز عبور اشتباه است" 
        });
      }

      // Update last login
      await db
        .update(schema.users)
        .set({ lastLoginAt: new Date() })
        .where(eq(schema.users.id, user.id));

      // Set session
      req.session.departmentUser = {
        id: user.id,
        username: user.username,
        department: user.department || 'financial'
      };

      res.json({ 
        success: true, 
        message: "ورود موفق", 
        user: { 
          id: user.id, 
          username: user.username, 
          department: user.department 
        } 
      });
    } catch (error) {
      console.error('Financial login error:', error);
      res.status(500).json({ success: false, message: "خطا در ورود" });
    }
  });

  // Financial logout
  app.post('/api/financial/logout', (req, res) => {
    req.session.departmentUser = undefined;
    res.json({ success: true, message: "خروج موفق" });
  });

  // Financial auth check
  app.get('/api/financial/auth/me', requireDepartmentAuth('financial'), (req: any, res) => {
    res.json({ 
      success: true, 
      user: req.session.departmentUser 
    });
  });

  // Get financial pending orders
  app.get('/api/financial/orders', requireDepartmentAuth('financial'), async (req, res) => {
    try {
      const orders = await orderManagementStorage.getFinancialPendingOrders();
      res.json({ success: true, orders });
    } catch (error) {
      console.error('Error fetching financial orders:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت سفارشات" });
    }
  });

  // Process financial order
  app.post('/api/financial/orders/:id/process', requireDepartmentAuth('financial'), async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { action, notes, reviewerId } = req.body;
      
      if (action === 'approve') {
        await orderManagementStorage.updateOrderStatus(
          orderId,
          'financial_approved',
          reviewerId,
          'financial',
          notes || 'تایید شده توسط بخش مالی'
        );
      } else {
        await orderManagementStorage.updateOrderStatus(
          orderId,
          'financial_rejected',
          reviewerId,
          'financial',
          notes || 'رد شده توسط بخش مالی'
        );
      }

      res.json({ success: true, message: "سفارش با موفقیت پردازش شد" });
    } catch (error) {
      console.error('Error processing financial order:', error);
      res.status(500).json({ success: false, message: "خطا در پردازش سفارش" });
    }
  });

  // ============================================================================
  // WAREHOUSE DEPARTMENT ROUTES
  // ============================================================================

  // Warehouse login
  app.post('/api/warehouse/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const [user] = await db
        .select()
        .from(schema.users)
        .where(and(
          eq(schema.users.username, username),
          eq(schema.users.department, 'warehouse'),
          eq(schema.users.isActive, true)
        ));

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "نام کاربری یا رمز عبور اشتباه است" 
        });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          message: "نام کاربری یا رمز عبور اشتباه است" 
        });
      }

      await db
        .update(schema.users)
        .set({ lastLoginAt: new Date() })
        .where(eq(schema.users.id, user.id));

      req.session.departmentUser = {
        id: user.id,
        username: user.username,
        department: user.department || 'warehouse'
      };

      res.json({ 
        success: true, 
        message: "ورود موفق", 
        user: { 
          id: user.id, 
          username: user.username, 
          department: user.department 
        } 
      });
    } catch (error) {
      console.error('Warehouse login error:', error);
      res.status(500).json({ success: false, message: "خطا در ورود" });
    }
  });

  // Warehouse logout
  app.post('/api/warehouse/logout', (req, res) => {
    req.session.departmentUser = undefined;
    res.json({ success: true, message: "خروج موفق" });
  });

  // Warehouse auth check
  app.get('/api/warehouse/auth/me', requireDepartmentAuth('warehouse'), (req: any, res) => {
    res.json({ 
      success: true, 
      user: req.session.departmentUser 
    });
  });

  // Get warehouse pending orders
  app.get('/api/warehouse/orders', requireDepartmentAuth('warehouse'), async (req, res) => {
    try {
      const orders = await orderManagementStorage.getWarehousePendingOrders();
      res.json({ success: true, orders });
    } catch (error) {
      console.error('Error fetching warehouse orders:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت سفارشات" });
    }
  });

  // Process warehouse order
  app.post('/api/warehouse/orders/:id/process', requireDepartmentAuth('warehouse'), async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { action, notes, assigneeId } = req.body;
      
      if (action === 'approve') {
        await orderManagementStorage.updateOrderStatus(
          orderId,
          'warehouse_approved',
          assigneeId,
          'warehouse',
          notes || 'آماده شده از انبار'
        );
      } else {
        await orderManagementStorage.updateOrderStatus(
          orderId,
          'warehouse_rejected',
          assigneeId,
          'warehouse',
          notes || 'عدم موجودی در انبار'
        );
      }

      res.json({ success: true, message: "سفارش با موفقیت پردازش شد" });
    } catch (error) {
      console.error('Error processing warehouse order:', error);
      res.status(500).json({ success: false, message: "خطا در پردازش سفارش" });
    }
  });

  // ============================================================================
  // LOGISTICS DEPARTMENT ROUTES
  // ============================================================================

  // Logistics login
  app.post('/api/logistics/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const [user] = await db
        .select()
        .from(schema.users)
        .where(and(
          eq(schema.users.username, username),
          eq(schema.users.department, 'logistics'),
          eq(schema.users.isActive, true)
        ));

      if (!user) {
        return res.status(401).json({ 
          success: false, 
          message: "نام کاربری یا رمز عبور اشتباه است" 
        });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          message: "نام کاربری یا رمز عبور اشتباه است" 
        });
      }

      await db
        .update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      req.session.departmentUser = {
        id: user.id,
        username: user.username,
        department: user.department
      };

      res.json({ 
        success: true, 
        message: "ورود موفق", 
        user: { 
          id: user.id, 
          username: user.username, 
          department: user.department 
        } 
      });
    } catch (error) {
      console.error('Logistics login error:', error);
      res.status(500).json({ success: false, message: "خطا در ورود" });
    }
  });

  // Logistics logout
  app.post('/api/logistics/logout', (req, res) => {
    req.session.departmentUser = undefined;
    res.json({ success: true, message: "خروج موفق" });
  });

  // Logistics auth check
  app.get('/api/logistics/auth/me', requireDepartmentAuth('logistics'), (req: any, res) => {
    res.json({ 
      success: true, 
      user: req.session.departmentUser 
    });
  });

  // Get logistics pending orders
  app.get('/api/logistics/orders', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const orders = await orderManagementStorage.getLogisticsPendingOrders();
      res.json({ success: true, orders });
    } catch (error) {
      console.error('Error fetching logistics orders:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت سفارشات" });
    }
  });

  // Process logistics order
  app.post('/api/logistics/orders/:id/process', requireDepartmentAuth('logistics'), async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { action, trackingNumber, estimatedDeliveryDate, deliveryPersonName, deliveryPersonPhone, notes, assigneeId } = req.body;
      
      let status = '';
      let message = '';
      
      if (action === 'assign') {
        status = 'logistics_assigned';
        message = 'پیک تخصیص داده شد';
      } else if (action === 'dispatch') {
        status = 'logistics_dispatched';
        message = 'کالا ارسال شد';
      } else if (action === 'deliver') {
        status = 'delivered';
        message = 'تحویل نهایی انجام شد';
        
        // Generate delivery code for final delivery
        const deliveryCode = Math.random().toString().substr(2, 6);
        await orderManagementStorage.generateDeliveryCode(orderId);
      }
      
      // Update order with logistics info
      await db
        .update(orderManagement)
        .set({
          logisticsAssigneeId: assigneeId,
          logisticsProcessedAt: new Date(),
          logisticsNotes: notes,
          trackingNumber,
          estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
          deliveryPersonName,
          deliveryPersonPhone,
          currentStatus: status
        })
        .where(eq(orderManagement.id, orderId));

      // Log status change
      await orderManagementStorage.updateOrderStatus(
        orderId,
        status as any,
        assigneeId,
        'logistics',
        notes || message
      );

      res.json({ success: true, message: "سفارش با موفقیت پردازش شد" });
    } catch (error) {
      console.error('Error processing logistics order:', error);
      res.status(500).json({ success: false, message: "خطا در پردازش سفارش" });
    }
  });

  // ============================================================================
  // SUPER ADMIN VERIFICATION SYSTEM
  // ============================================================================

  // Get all super admins
  app.get('/api/super-admin/admins', requireAuth, async (req, res) => {
    try {
      const admins = await db
        .select({
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          phone: schema.users.phone,
          isActive: schema.users.isActive,
          emailVerified: schema.users.emailVerified,
          phoneVerified: schema.users.phoneVerified,
          lastLoginAt: schema.users.lastLoginAt,
          createdAt: schema.users.createdAt
        })
        .from(schema.users)
        .where(or(
          eq(schema.users.department, 'super_admin'),
          isNull(schema.users.department)
        ));

      res.json(admins);
    } catch (error) {
      console.error('Error fetching super admins:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت سوپر ادمین‌ها" });
    }
  });

  // Create new super admin
  app.post('/api/super-admin/create', requireAuth, async (req, res) => {
    try {
      const { username, email, phone, password } = req.body;
      
      if (!username || !email || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "نام کاربری، ایمیل و رمز عبور الزامی است" 
        });
      }

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(schema.users)
        .where(or(
          eq(schema.users.username, username),
          eq(schema.users.email, email)
        ));

      if (existingUser.length > 0) {
        return res.status(409).json({ 
          success: false, 
          message: "نام کاربری یا ایمیل قبلاً استفاده شده است" 
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Create super admin
      const [newAdmin] = await db
        .insert(schema.users)
        .values({
          username,
          email,
          phone: phone || null,
          passwordHash,
          department: 'super_admin',
          isActive: true,
          emailVerified: false,
          phoneVerified: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Generate email verification code
      const emailCode = Math.random().toString().substr(2, 6);
      const emailExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      await db
        .insert(schema.superAdminVerifications)
        .values({
          userId: newAdmin.id,
          email: newAdmin.email,
          phone: newAdmin.phone,
          verificationCode: emailCode,
          type: 'email',
          isUsed: false,
          expiresAt: emailExpiry,
          createdAt: new Date()
        });

      // Send verification email (mock for now)
      console.log(`Email verification code for ${email}: ${emailCode}`);

      res.json({ 
        success: true, 
        message: "سوپر ادمین ایجاد شد. کد تایید ایمیل ارسال شد.",
        user: {
          id: newAdmin.id,
          username: newAdmin.username,
          email: newAdmin.email,
          phone: newAdmin.phone
        }
      });
    } catch (error) {
      console.error('Error creating super admin:', error);
      res.status(500).json({ success: false, message: "خطا در ایجاد سوپر ادمین" });
    }
  });

  // Email routing statistics API
  app.get('/api/admin/email/routing-stats', requireAuth, async (req, res) => {
    try {
      // Get all categories with their stats
      const categories = await emailStorage.getCategories();
      
      const stats = await Promise.all(categories.map(async (category) => {
        // Get email logs for this category
        const logs = await db
          .select()
          .from(emailLogs)
          .where(eq(emailLogs.categoryId, category.id))
          .orderBy(desc(emailLogs.sentAt))
          .limit(50);
          
        const totalEmails = logs.length;
        const successfulEmails = logs.filter(log => log.status === 'sent').length;
        const failedEmails = logs.filter(log => log.status === 'failed').length;
        const lastEmailSent = logs.length > 0 ? logs[0].sentAt : null;
        
        // Check if category has SMTP config and recipients
        const smtpConfig = await db
          .select()
          .from(smtpSettings)
          .where(eq(smtpSettings.categoryId, category.id))
          .limit(1);
          
        const recipients = await db
          .select()
          .from(emailRecipients)
          .where(eq(emailRecipients.categoryId, category.id))
          .where(eq(emailRecipients.isActive, true));
        
        return {
          categoryKey: category.categoryKey,
          categoryName: category.categoryName,
          totalEmails,
          successfulEmails,
          failedEmails,
          lastEmailSent,
          hasSmtpConfig: smtpConfig.length > 0,
          hasRecipients: recipients.length > 0,
          recentEmails: logs.slice(0, 10).map(log => ({
            id: log.id,
            toEmail: log.toEmail,
            subject: log.subject,
            status: log.status,
            sentAt: log.sentAt,
            errorMessage: log.errorMessage
          }))
        };
      }));
      
      // Get recent emails across all categories  
      const recentEmails = await db
        .select({
          id: emailLogs.id,
          toEmail: emailLogs.toEmail,
          subject: emailLogs.subject,
          status: emailLogs.status,
          sentAt: emailLogs.sentAt,
          errorMessage: emailLogs.errorMessage,
          categoryName: emailCategories.categoryName
        })
        .from(emailLogs)
        .leftJoin(emailCategories, eq(emailLogs.categoryId, emailCategories.id))
        .orderBy(desc(emailLogs.sentAt))
        .limit(20);
      
      res.json({
        success: true,
        stats,
        recentEmails
      });
    } catch (error) {
      console.error('Error fetching email routing stats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching email routing statistics' 
      });
    }
  });

  // Send verification code
  app.post('/api/super-admin/send-verification', requireAuth, async (req, res) => {
    try {
      const { adminId, type } = req.body;

      if (!adminId || !type || !['email', 'sms'].includes(type)) {
        return res.status(400).json({ 
          success: false, 
          message: "شناسه ادمین و نوع تایید الزامی است" 
        });
      }

      const [admin] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, adminId));

      if (!admin) {
        return res.status(404).json({ 
          success: false, 
          message: "سوپر ادمین یافت نشد" 
        });
      }

      if (type === 'sms' && !admin.phone) {
        return res.status(400).json({ 
          success: false, 
          message: "شماره تلفن برای این ادمین ثبت نشده است" 
        });
      }

      // Generate verification code
      const verificationCode = Math.random().toString().substr(2, 6);
      const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Delete old verification codes for this user and type
      await db
        .delete(schema.superAdminVerifications)
        .where(and(
          eq(schema.superAdminVerifications.userId, adminId),
          eq(schema.superAdminVerifications.type, type),
          eq(schema.superAdminVerifications.isUsed, false)
        ));

      // Insert new verification code
      await db
        .insert(schema.superAdminVerifications)
        .values({
          userId: adminId,
          email: admin.email,
          phone: admin.phone,
          verificationCode,
          type,
          isUsed: false,
          expiresAt: expiryTime,
          createdAt: new Date()
        });

      // Mock sending verification (replace with actual email/SMS service)
      if (type === 'email') {
        console.log(`Email verification code for ${admin.email}: ${verificationCode}`);
      } else {
        console.log(`SMS verification code for ${admin.phone}: ${verificationCode}`);
      }

      res.json({ 
        success: true, 
        message: type === 'email' ? "کد تایید به ایمیل ارسال شد" : "کد تایید به شماره تلفن ارسال شد"
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      res.status(500).json({ success: false, message: "خطا در ارسال کد تایید" });
    }
  });

  // Verify code
  app.post('/api/super-admin/verify', requireAuth, async (req, res) => {
    try {
      const { adminId, type, code } = req.body;

      if (!adminId || !type || !code) {
        return res.status(400).json({ 
          success: false, 
          message: "تمام فیلدها الزامی است" 
        });
      }

      const [verification] = await db
        .select()
        .from(schema.superAdminVerifications)
        .where(and(
          eq(schema.superAdminVerifications.userId, adminId),
          eq(schema.superAdminVerifications.type, type),
          eq(schema.superAdminVerifications.verificationCode, code),
          eq(schema.superAdminVerifications.isUsed, false)
        ));

      if (!verification) {
        return res.status(400).json({ 
          success: false, 
          message: "کد تایید نامعتبر است" 
        });
      }

      if (new Date() > verification.expiresAt) {
        return res.status(400).json({ 
          success: false, 
          message: "کد تایید منقضی شده است" 
        });
      }

      // Mark verification as used
      await db
        .update(schema.superAdminVerifications)
        .set({ isUsed: true })
        .where(eq(schema.superAdminVerifications.id, verification.id));

      // Update user verification status
      const updateData: any = {};
      if (type === 'email') {
        updateData.emailVerified = true;
      } else if (type === 'sms') {
        updateData.phoneVerified = true;
      }

      await db
        .update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, adminId));

      res.json({ 
        success: true, 
        message: type === 'email' ? "ایمیل با موفقیت تایید شد" : "شماره تلفن با موفقیت تایید شد"
      });
    } catch (error) {
      console.error('Error verifying code:', error);
      res.status(500).json({ success: false, message: "خطا در تایید کد" });
    }
  });

  // Forgot password
  app.post('/api/super-admin/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: "ایمیل الزامی است" 
        });
      }

      const [admin] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (!admin) {
        return res.status(404).json({ 
          success: false, 
          message: "ایمیل یافت نشد" 
        });
      }

      // Generate reset code
      const resetCode = Math.random().toString().substr(2, 6);
      const expiryTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

      // Delete old reset codes
      await db
        .delete(schema.superAdminVerifications)
        .where(and(
          eq(schema.superAdminVerifications.userId, admin.id),
          eq(schema.superAdminVerifications.type, 'password_reset'),
          eq(schema.superAdminVerifications.isUsed, false)
        ));

      // Insert new reset code
      await db
        .insert(schema.superAdminVerifications)
        .values({
          userId: admin.id,
          email: admin.email,
          phone: admin.phone,
          verificationCode: resetCode,
          type: 'password_reset',
          isUsed: false,
          expiresAt: expiryTime,
          createdAt: new Date()
        });

      // Send actual reset email
      try {
        const categorySettings = await emailStorage.getCategoryWithSettings('admin');
        
        if (categorySettings?.smtp) {
          const smtp = categorySettings.smtp;
          
          // Create transporter
          const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.port === 465,
            auth: {
              user: smtp.username,
              pass: smtp.password,
            },
          });

          // Send password reset email using super admin's email
          await transporter.sendMail({
            from: `${smtp.fromName} <${smtp.fromEmail}>`,
            to: email,
            replyTo: smtp.fromEmail,
            subject: "کد بازیابی رمز عبور - مومتاز کمیکال",
            html: `
              <div style="direction: rtl; text-align: right; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">بازیابی رمز عبور</h2>
                <p>سلام ${admin.username}،</p>
                
                <p>درخواست بازیابی رمز عبور برای حساب کاربری شما دریافت شد.</p>
                
                <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0;"><strong>کد بازیابی شما:</strong></p>
                  <div style="font-size: 24px; font-weight: bold; color: #2563eb; 
                              padding: 15px; background: white; border-radius: 6px; 
                              margin: 10px 0; letter-spacing: 3px;">
                    ${resetCode}
                  </div>
                  <p style="margin: 10px 0 0 0; font-size: 14px; color: #666;">
                    این کد تا 30 دقیقه معتبر است.
                  </p>
                </div>
                
                <p style="color: #666; font-size: 14px;">
                  اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.
                </p>
                
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
                <p style="font-size: 12px; color: #999;">
                  با تشکر،<br>
                  تیم فنی مومتاز کمیکال<br>
                  momtazchem.com
                </p>
              </div>
            `,
            text: `
سلام ${admin.username},

درخواست بازیابی رمز عبور برای حساب کاربری شما دریافت شد.

کد بازیابی شما: ${resetCode}

این کد تا 30 دقیقه معتبر است.

اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.

با تشکر،
تیم فنی مومتاز کمیکال
momtazchem.com
            `
          });

          console.log(`Password reset email sent to: ${email}`);

          // Log the email
          await emailStorage.logEmail({
            categoryId: categorySettings.category.id,
            toEmail: email,
            fromEmail: smtp.fromEmail,
            subject: "کد بازیابی رمز عبور - مومتاز کمیکال",
            status: 'sent',
            sentAt: new Date(),
          });

        } else {
          // Fallback to console if no SMTP configured
          console.log(`Password reset code for ${email}: ${resetCode}`);
        }
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError);
        // Still log the code to console as fallback
        console.log(`Password reset code for ${email}: ${resetCode}`);
      }

      res.json({ 
        success: true, 
        message: "کد بازیابی رمز عبور به ایمیل شما ارسال شد"
      });
    } catch (error) {
      console.error('Error sending password reset:', error);
      res.status(500).json({ success: false, message: "خطا در ارسال کد بازیابی" });
    }
  });

  // Reset password with code
  app.post('/api/super-admin/reset-password', async (req, res) => {
    try {
      const { email, verificationCode, newPassword } = req.body;

      if (!email || !verificationCode || !newPassword) {
        return res.status(400).json({ 
          success: false, 
          message: "تمام فیلدها الزامی است" 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false, 
          message: "رمز عبور باید حداقل 6 کاراکتر باشد" 
        });
      }

      const [admin] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email));

      if (!admin) {
        return res.status(404).json({ 
          success: false, 
          message: "ایمیل یافت نشد" 
        });
      }

      const [verification] = await db
        .select()
        .from(schema.superAdminVerifications)
        .where(and(
          eq(schema.superAdminVerifications.userId, admin.id),
          eq(schema.superAdminVerifications.type, 'password_reset'),
          eq(schema.superAdminVerifications.verificationCode, verificationCode),
          eq(schema.superAdminVerifications.isUsed, false)
        ));

      if (!verification) {
        return res.status(400).json({ 
          success: false, 
          message: "کد بازیابی نامعتبر است" 
        });
      }

      if (new Date() > verification.expiresAt) {
        return res.status(400).json({ 
          success: false, 
          message: "کد بازیابی منقضی شده است" 
        });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await db
        .update(schema.users)
        .set({ 
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, admin.id));

      // Mark verification as used
      await db
        .update(schema.superAdminVerifications)
        .set({ isUsed: true })
        .where(eq(schema.superAdminVerifications.id, verification.id));

      res.json({ 
        success: true, 
        message: "رمز عبور با موفقیت تغییر کرد"
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ success: false, message: "خطا در تغییر رمز عبور" });
    }
  });

  // Get pending verifications
  app.get('/api/super-admin/pending-verifications', requireAuth, async (req, res) => {
    try {
      const verifications = await db
        .select()
        .from(schema.superAdminVerifications)
        .where(eq(schema.superAdminVerifications.isUsed, false))
        .orderBy(desc(schema.superAdminVerifications.createdAt));

      res.json(verifications);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت تاییدات در انتظار" });
    }
  });

  // Delete super admin
  app.delete('/api/super-admin/admins/:id', requireAuth, async (req, res) => {
    try {
      const adminId = parseInt(req.params.id);

      // Prevent self-deletion
      if (req.session.adminId === adminId) {
        return res.status(400).json({ 
          success: false, 
          message: "نمی‌توانید حساب خودتان را حذف کنید" 
        });
      }

      // Delete related verifications first
      await db
        .delete(schema.superAdminVerifications)
        .where(eq(schema.superAdminVerifications.userId, adminId));

      // Delete admin
      await db
        .delete(schema.users)
        .where(eq(schema.users.id, adminId));

      res.json({ 
        success: true, 
        message: "سوپر ادمین حذف شد"
      });
    } catch (error) {
      console.error('Error deleting super admin:', error);
      res.status(500).json({ success: false, message: "خطا در حذف سوپر ادمین" });
    }
  });

  // ============================================================================
  // SUPER ADMIN ENDPOINTS FOR DEPARTMENT MANAGEMENT
  // ============================================================================

  // Get all department users
  app.get('/api/super-admin/department-users', requireAuth, async (req, res) => {
    try {
      const users = await db
        .select({
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          department: schema.users.department,
          isActive: schema.users.isActive,
          lastLoginAt: schema.users.lastLoginAt,
          createdAt: schema.users.createdAt
        })
        .from(schema.users)
        .where(sql`${schema.users.department} IN ('financial', 'warehouse', 'logistics')`);

      res.json({ success: true, users });
    } catch (error) {
      console.error('Error fetching department users:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت کاربران" });
    }
  });

  // Create new department user
  app.post('/api/super-admin/department-users', requireAuth, async (req, res) => {
    try {
      const { username, email, password, department } = req.body;
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      const [newUser] = await db
        .insert(schema.users)
        .values({
          username,
          email,
          passwordHash,
          department,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning({
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          department: schema.users.department,
          isActive: schema.users.isActive,
          createdAt: schema.users.createdAt
        });

      res.json({ success: true, user: newUser, message: "کاربر جدید ایجاد شد" });
    } catch (error) {
      console.error('Error creating department user:', error);
      res.status(500).json({ success: false, message: "خطا در ایجاد کاربر" });
    }
  });

  // Update department user
  app.put('/api/super-admin/department-users/:id', requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, email, password, department } = req.body;
      
      const updateData: any = {
        username,
        email,
        department,
        updatedAt: new Date()
      };
      
      if (password) {
        updateData.passwordHash = await bcrypt.hash(password, 10);
      }
      
      const [updatedUser] = await db
        .update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, userId))
        .returning({
          id: schema.users.id,
          username: schema.users.username,
          email: schema.users.email,
          department: schema.users.department,
          isActive: schema.users.isActive,
          updatedAt: schema.users.updatedAt
        });

      res.json({ success: true, user: updatedUser, message: "کاربر بروزرسانی شد" });
    } catch (error) {
      console.error('Error updating department user:', error);
      res.status(500).json({ success: false, message: "خطا در بروزرسانی کاربر" });
    }
  });

  // Delete department user
  app.delete('/api/super-admin/department-users/:id', requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      await db
        .delete(schema.users)
        .where(eq(schema.users.id, userId));

      res.json({ success: true, message: "کاربر حذف شد" });
    } catch (error) {
      console.error('Error deleting department user:', error);
      res.status(500).json({ success: false, message: "خطا در حذف کاربر" });
    }
  });

  // Toggle user status
  app.post('/api/super-admin/department-users/:id/toggle-status', requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const [updatedUser] = await db
        .update(schema.users)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(schema.users.id, userId))
        .returning({
          id: schema.users.id,
          username: schema.users.username,
          isActive: schema.users.isActive
        });

      res.json({ 
        success: true, 
        user: updatedUser, 
        message: isActive ? "کاربر فعال شد" : "کاربر غیرفعال شد" 
      });
    } catch (error) {
      console.error('Error toggling user status:', error);
      res.status(500).json({ success: false, message: "خطا در تغییر وضعیت کاربر" });
    }
  });

  // Import Other Products to Shop Database
  app.post('/api/shop/import-other-products', requireAuth, async (req, res) => {
    try {
      const otherProducts = [
        {
          name: "Industrial Degreasers",
          category: "other",
          description: "High-performance industrial degreasers for heavy-duty cleaning applications in manufacturing environments.",
          shortDescription: "Professional grade degreasers for industrial cleaning",
          price: "35.00",
          priceUnit: "per liter",
          inStock: true,
          stockQuantity: 150,
          lowStockThreshold: 20,
          sku: "IND-DEG-001",
          barcode: "8901234567890",
          weight: "1.0",
          weightUnit: "kg",
          specifications: {
            "pH Level": "8.5 - 9.2",
            "Density": "0.95 g/ml", 
            "Flash Point": ">100°C",
            "Biodegradability": "98% in 28 days"
          },
          features: ["Biodegradable formula", "Non-toxic", "Fast-acting", "Multi-surface compatible"],
          applications: ["Metal fabrication", "Automotive industry", "Heavy machinery maintenance", "Industrial equipment cleaning"],
          tags: ["degreaser", "industrial", "cleaning", "biodegradable"],
          minimumOrderQuantity: 1,
          maximumOrderQuantity: 500,
          leadTime: "2-3 business days",
          shippingClass: "standard",
          isActive: true,
          isFeatured: false,
          metaTitle: "Industrial Degreasers - Professional Cleaning Solutions",
          metaDescription: "High-performance industrial degreasers for heavy-duty cleaning applications"
        },
        {
          name: "Corrosion Inhibitors", 
          category: "other",
          description: "Advanced corrosion inhibitors designed to protect metal surfaces from oxidation and environmental damage.",
          shortDescription: "Protective coatings for metal surfaces",
          price: "45.00",
          priceUnit: "per liter",
          inStock: true,
          stockQuantity: 85,
          lowStockThreshold: 15,
          sku: "COR-INH-002",
          barcode: "8901234567891",
          weight: "1.2",
          weightUnit: "kg",
          specifications: {
            "Active Content": "25-30%",
            "Operating Temperature": "-20°C to +80°C",
            "Coverage": "8-12 m²/L",
            "Drying Time": "2-4 hours"
          },
          features: ["Long-lasting protection", "Temperature resistant", "Water-based formula", "Easy application"],
          applications: ["Pipeline protection", "Marine equipment", "Storage tanks", "Infrastructure maintenance"],
          tags: ["corrosion", "protection", "coating", "metal"],
          minimumOrderQuantity: 1,
          maximumOrderQuantity: 200,
          leadTime: "3-5 business days",
          shippingClass: "standard",
          isActive: true,
          isFeatured: true,
          metaTitle: "Corrosion Inhibitors - Metal Protection Solutions",
          metaDescription: "Advanced corrosion inhibitors for metal surface protection"
        },
        {
          name: "Laboratory Reagents",
          category: "other", 
          description: "High-purity laboratory reagents for analytical testing, research, and quality control applications.",
          shortDescription: "Analytical grade reagents for laboratory use",
          price: "75.00",
          priceUnit: "per kg",
          inStock: true,
          stockQuantity: 45,
          lowStockThreshold: 10,
          sku: "LAB-REA-003",
          barcode: "8901234567892",
          weight: "0.5",
          weightUnit: "kg",
          specifications: {
            "Purity": "≥99.5%",
            "Water Content": "<0.1%",
            "Heavy Metals": "<10 ppm",
            "Shelf Life": "2-3 years"
          },
          features: ["Analytical grade purity", "Certified quality", "Consistent results", "Long shelf life"],
          applications: ["Chemical analysis", "Research laboratories", "Quality control testing", "Educational institutions"],
          tags: ["reagent", "laboratory", "analytical", "research"],
          minimumOrderQuantity: 1,
          maximumOrderQuantity: 50,
          leadTime: "1-2 business days",
          shippingClass: "hazardous",
          isActive: true,
          isFeatured: false,
          metaTitle: "Laboratory Reagents - Analytical Grade Chemicals",
          metaDescription: "High-purity laboratory reagents for analytical testing and research"
        },
        {
          name: "Specialty Solvents",
          category: "other",
          description: "Premium specialty solvents for specific industrial applications requiring high performance and purity.",
          shortDescription: "Ultra-pure solvents for precision applications", 
          price: "120.00",
          priceUnit: "per liter",
          inStock: true,
          stockQuantity: 65,
          lowStockThreshold: 12,
          sku: "SOL-SPE-004",
          barcode: "8901234567893",
          weight: "0.8",
          weightUnit: "kg",
          specifications: {
            "Purity": "≥99.8%",
            "Boiling Point": "78-82°C",
            "Vapor Pressure": "5.95 kPa at 20°C",
            "Resistivity": ">18 MΩ·cm"
          },
          features: ["Ultra-high purity", "Low residue", "Fast evaporation", "Non-conductive"],
          applications: ["Electronics manufacturing", "Pharmaceutical production", "Precision cleaning", "Chemical synthesis"],
          tags: ["solvent", "specialty", "electronics", "pharmaceutical"],
          minimumOrderQuantity: 1,
          maximumOrderQuantity: 100,
          leadTime: "5-7 business days",
          shippingClass: "hazardous",
          isActive: true,
          isFeatured: true,
          metaTitle: "Specialty Solvents - High Purity Industrial Solvents",
          metaDescription: "Premium specialty solvents for precision industrial applications"
        },
        {
          name: "Concrete Additives",
          category: "other",
          description: "Specialized concrete additives to enhance performance, durability, and workability of concrete mixtures.",
          shortDescription: "Performance enhancers for concrete applications",
          price: "18.00",
          priceUnit: "per liter",
          inStock: true,
          stockQuantity: 200,
          lowStockThreshold: 30,
          sku: "CON-ADD-005",
          barcode: "8901234567894",
          weight: "1.1",
          weightUnit: "kg",
          specifications: {
            "Solid Content": "40-45%",
            "Chloride Content": "<0.1%",
            "Setting Time": "Adjustable 30min-6hrs",
            "Compressive Strength": "+15-25%"
          },
          features: ["Improved workability", "Enhanced strength", "Reduced water content", "Accelerated curing"],
          applications: ["Commercial construction", "Infrastructure projects", "Precast concrete", "Ready-mix concrete"],
          tags: ["concrete", "additive", "construction", "building"],
          minimumOrderQuantity: 5,
          maximumOrderQuantity: 1000,
          leadTime: "1-3 business days",
          shippingClass: "standard",
          isActive: true,
          isFeatured: false,
          metaTitle: "Concrete Additives - Construction Chemical Solutions",
          metaDescription: "Specialized concrete additives for enhanced performance and durability"
        },
        {
          name: "Textile Processing Chemicals",
          category: "other",
          description: "Comprehensive range of chemicals for textile processing, dyeing, and finishing operations.",
          shortDescription: "Complete chemical solutions for textile industry",
          price: "28.00",
          priceUnit: "per liter",
          inStock: true,
          stockQuantity: 120,
          lowStockThreshold: 25,
          sku: "TEX-PRO-006",
          barcode: "8901234567895",
          weight: "1.0",
          weightUnit: "kg",
          specifications: {
            "pH Range": "6.0-8.0",
            "Concentration": "10-50%",
            "Temperature Stability": "Up to 120°C",
            "Biodegradability": "Readily biodegradable"
          },
          features: ["Color fastness", "Eco-friendly options", "Process efficiency", "Quality enhancement"],
          applications: ["Fabric dyeing", "Textile finishing", "Fiber treatment", "Garment processing"],
          tags: ["textile", "dyeing", "finishing", "fabric"],
          minimumOrderQuantity: 2,
          maximumOrderQuantity: 500,
          leadTime: "2-4 business days",
          shippingClass: "standard",
          isActive: true,
          isFeatured: false,
          metaTitle: "Textile Processing Chemicals - Dyeing & Finishing Solutions",
          metaDescription: "Comprehensive chemicals for textile processing and finishing operations"
        }
      ];

      const createdProducts = [];
      
      for (const productData of otherProducts) {
        try {
          const product = await shopStorage.createShopProduct(productData);
          createdProducts.push(product);
        } catch (error) {
          console.error(`Error creating product ${productData.name}:`, error);
          // Continue with other products if one fails
        }
      }

      res.json({
        success: true,
        message: `Successfully imported ${createdProducts.length} products to shop`,
        products: createdProducts
      });

    } catch (error) {
      console.error('Error importing other products:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to import products to shop database' 
      });
    }
  });

  // =============================================================================
  // INVOICE ROUTES
  // =============================================================================

  // Import invoice storage
  const { invoiceStorage } = await import('./invoice-storage.js');

  // Get all invoices (admin only)
  app.get('/api/invoices', requireAuth, async (req, res) => {
    try {
      const invoices = await invoiceStorage.getAllInvoices();
      res.json({ success: true, data: invoices });
    } catch (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
    }
  });

  // Get customer invoices
  app.get('/api/invoices/customer/:customerId', async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const invoices = await invoiceStorage.getInvoicesByCustomer(customerId);
      res.json({ success: true, data: invoices });
    } catch (error) {
      console.error('Error fetching customer invoices:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch customer invoices' });
    }
  });

  // Get invoice by ID
  app.get('/api/invoices/:id', async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await invoiceStorage.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      const items = await invoiceStorage.getInvoiceItems(invoiceId);
      res.json({ success: true, data: { ...invoice, items } });
    } catch (error) {
      console.error('Error fetching invoice:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch invoice' });
    }
  });

  // Generate invoice from order
  app.post('/api/invoices/generate/:orderId', requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      // Check if invoice already exists for this order
      const existingInvoices = await invoiceStorage.getInvoicesByOrder(orderId);
      if (existingInvoices.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invoice already exists for this order',
          data: existingInvoices[0]
        });
      }

      const invoice = await invoiceStorage.generateInvoiceFromOrder(orderId);
      res.json({ success: true, data: invoice });
    } catch (error) {
      console.error('Error generating invoice:', error);
      res.status(500).json({ success: false, message: 'Failed to generate invoice' });
    }
  });

  // Request official invoice
  app.post('/api/invoices/:id/request-official', async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { language = 'ar' } = req.body; // Default to Arabic if not specified
      
      const invoice = await invoiceStorage.requestOfficialInvoice(invoiceId, language);
      
      // Send notification to admin about official invoice request
      // This can be implemented with the email system
      
      res.json({ 
        success: true, 
        message: 'Official invoice request submitted',
        data: invoice 
      });
    } catch (error) {
      console.error('Error requesting official invoice:', error);
      res.status(500).json({ success: false, message: 'Failed to request official invoice' });
    }
  });

  // Process official invoice (admin only)
  app.post('/api/invoices/:id/process-official', requireAuth, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { companyInfo, taxInfo } = req.body;
      
      const invoice = await invoiceStorage.processOfficialInvoice(invoiceId, companyInfo, taxInfo);
      res.json({ success: true, data: invoice });
    } catch (error) {
      console.error('Error processing official invoice:', error);
      res.status(500).json({ success: false, message: 'Failed to process official invoice' });
    }
  });

  // Download invoice PDF
  app.get('/api/invoices/:id/download', async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await invoiceStorage.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      // Get invoice items
      const items = await invoiceStorage.getInvoiceItems(invoiceId);
      
      // Get customer and order information
      const order = await shopStorage.getOrderById(invoice.orderId);
      const customer = await crmStorage.getCrmCustomerById(invoice.customerId);
      
      if (!order || !customer) {
        return res.status(404).json({ success: false, message: 'Order or customer not found' });
      }

      // Generate PDF content based on language
      const isArabic = invoice.language === 'ar';
      const direction = isArabic ? 'rtl' : 'ltr';
      const font = isArabic ? 'Arial' : 'Arial';
      
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="${direction}" lang="${invoice.language}">
        <head>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: ${font}, sans-serif; 
                    line-height: 1.6; 
                    margin: 0; 
                    padding: 20px;
                    direction: ${direction};
                }
                .header { 
                    text-align: center; 
                    border-bottom: 2px solid #333; 
                    padding-bottom: 20px; 
                    margin-bottom: 30px; 
                }
                .company-info { 
                    text-align: center; 
                    margin-bottom: 20px; 
                }
                .invoice-details { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 30px; 
                }
                .invoice-info, .customer-info { 
                    width: 48%; 
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 20px; 
                }
                th, td { 
                    border: 1px solid #ddd; 
                    padding: 12px; 
                    text-align: ${isArabic ? 'right' : 'left'}; 
                }
                th { 
                    background-color: #f5f5f5; 
                    font-weight: bold; 
                }
                .total-section { 
                    text-align: ${isArabic ? 'right' : 'left'}; 
                    margin-top: 20px; 
                }
                .total-row { 
                    font-size: 18px; 
                    font-weight: bold; 
                    background-color: #f0f0f0; 
                }
                .footer { 
                    margin-top: 40px; 
                    text-align: center; 
                    font-size: 12px; 
                    color: #666; 
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-info">
                    <h1>${isArabic ? 'شركة مُمتاز للمواد الكيميائية' : 'Momtaz Chemical Solutions'}</h1>
                    <p>${isArabic ? 'العراق - بغداد' : 'Iraq - Baghdad'}</p>
                    <p>${isArabic ? 'الهاتف' : 'Phone'}: +964 XXX XXX XXXX</p>
                    <p>${isArabic ? 'البريد الإلكتروني' : 'Email'}: info@momtazchem.com</p>
                </div>
                <h2>${isArabic ? 'فاتورة' : 'INVOICE'} ${invoice.isOfficial ? (isArabic ? '(رسمية)' : '(Official)') : ''}</h2>
            </div>

            <div class="invoice-details">
                <div class="invoice-info">
                    <h3>${isArabic ? 'معلومات الفاتورة' : 'Invoice Information'}</h3>
                    <p><strong>${isArabic ? 'رقم الفاتورة' : 'Invoice Number'}:</strong> ${invoice.invoiceNumber}</p>
                    <p><strong>${isArabic ? 'تاريخ الإصدار' : 'Issue Date'}:</strong> ${new Date(invoice.createdAt).toLocaleDateString(isArabic ? 'ar-IQ' : 'en-US')}</p>
                    <p><strong>${isArabic ? 'حالة الدفع' : 'Payment Status'}:</strong> ${invoice.status === 'paid' ? (isArabic ? 'مدفوعة' : 'Paid') : (isArabic ? 'مستحقة' : 'Due')}</p>
                    <p><strong>${isArabic ? 'رقم الطلب' : 'Order Number'}:</strong> ${order.orderNumber}</p>
                </div>
                <div class="customer-info">
                    <h3>${isArabic ? 'معلومات العميل' : 'Customer Information'}</h3>
                    <p><strong>${isArabic ? 'الاسم' : 'Name'}:</strong> ${customer.firstName} ${customer.lastName}</p>
                    <p><strong>${isArabic ? 'البريد الإلكتروني' : 'Email'}:</strong> ${customer.email}</p>
                    <p><strong>${isArabic ? 'الهاتف' : 'Phone'}:</strong> ${customer.phone}</p>
                    <p><strong>${isArabic ? 'العنوان' : 'Address'}:</strong> ${customer.address}, ${customer.city}, ${customer.country}</p>
                    ${customer.company ? `<p><strong>${isArabic ? 'الشركة' : 'Company'}:</strong> ${customer.company}</p>` : ''}
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>${isArabic ? 'المنتج' : 'Product'}</th>
                        <th>${isArabic ? 'الكمية' : 'Quantity'}</th>
                        <th>${isArabic ? 'السعر' : 'Unit Price'}</th>
                        <th>${isArabic ? 'الإجمالي' : 'Total'}</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(item => `
                        <tr>
                            <td>${item.productName}</td>
                            <td>${item.quantity}</td>
                            <td>${item.unitPrice} ${invoice.currency}</td>
                            <td>${item.totalPrice} ${invoice.currency}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>

            <div class="total-section">
                <table style="width: 300px; margin-left: auto;">
                    <tr>
                        <td><strong>${isArabic ? 'المجموع الفرعي' : 'Subtotal'}:</strong></td>
                        <td><strong>${invoice.subtotal} ${invoice.currency}</strong></td>
                    </tr>
                    ${invoice.discountAmount && parseFloat(invoice.discountAmount) > 0 ? `
                    <tr>
                        <td><strong>${isArabic ? 'الخصم' : 'Discount'}:</strong></td>
                        <td><strong>-${invoice.discountAmount} ${invoice.currency}</strong></td>
                    </tr>
                    ` : ''}
                    ${invoice.taxAmount && parseFloat(invoice.taxAmount) > 0 ? `
                    <tr>
                        <td><strong>${isArabic ? 'الضريبة' : 'Tax'}:</strong></td>
                        <td><strong>${invoice.taxAmount} ${invoice.currency}</strong></td>
                    </tr>
                    ` : ''}
                    <tr class="total-row">
                        <td><strong>${isArabic ? 'الإجمالي النهائي' : 'Total Amount'}:</strong></td>
                        <td><strong>${invoice.totalAmount} ${invoice.currency}</strong></td>
                    </tr>
                </table>
            </div>

            ${invoice.notes ? `
            <div style="margin-top: 30px;">
                <h3>${isArabic ? 'ملاحظات' : 'Notes'}</h3>
                <p>${invoice.notes}</p>
            </div>
            ` : ''}

            <div class="footer">
                <p>${isArabic ? 'شكراً لاختيارك شركة مُمتاز للمواد الكيميائية' : 'Thank you for choosing Momtaz Chemical Solutions'}</p>
                <p>${isArabic ? 'موقعنا الإلكتروني' : 'Website'}: momtazchem.com</p>
            </div>
        </body>
        </html>
      `;

      // Use the simple PDF generator
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });
      
      await browser.close();

      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
      
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      res.status(500).json({ success: false, message: 'Failed to generate invoice PDF' });
    }
  });

  // Mark invoice as paid
  app.post('/api/invoices/:id/mark-paid', requireAuth, async (req, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { paymentDate } = req.body;
      
      const invoice = await invoiceStorage.markInvoiceAsPaid(
        invoiceId, 
        paymentDate ? new Date(paymentDate) : undefined
      );
      res.json({ success: true, data: invoice });
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      res.status(500).json({ success: false, message: 'Failed to mark invoice as paid' });
    }
  });

  // Get invoice statistics
  app.get('/api/invoices/stats', requireAuth, async (req, res) => {
    try {
      const stats = await invoiceStorage.getInvoiceStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching invoice stats:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch invoice stats' });
    }
  });

  // Auto-generate invoice when order payment is completed
  app.post('/api/orders/:id/complete-payment', requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      
      // Update order payment status
      const order = await shopStorage.updateOrder(orderId, {
        paymentStatus: 'paid'
      });

      // Generate invoice automatically
      const invoice = await invoiceStorage.generateInvoiceFromOrder(orderId);
      
      // Send invoice email to customer
      await invoiceStorage.sendInvoiceEmail(invoice.id);

      res.json({ 
        success: true, 
        message: 'Payment completed and invoice generated',
        data: { order, invoice }
      });
    } catch (error) {
      console.error('Error completing payment:', error);
      res.status(500).json({ success: false, message: 'Failed to complete payment' });
    }
  });

  // ============================================================================
  // PAYMENT GATEWAY MANAGEMENT API
  // ============================================================================

  // Get all payment gateways
  app.get('/api/payment/gateways', requireAuth, async (req, res) => {
    try {
      const gateways = await db.select().from(paymentGateways).orderBy(desc(paymentGateways.createdAt));
      res.json(gateways);
    } catch (error) {
      console.error('Error fetching payment gateways:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payment gateways' });
    }
  });

  // Get payment gateway by ID
  app.get('/api/payment/gateways/:id', requireAuth, async (req, res) => {
    try {
      const gatewayId = parseInt(req.params.id);
      const [gateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.id, gatewayId));
      
      if (!gateway) {
        return res.status(404).json({ success: false, message: 'Payment gateway not found' });
      }
      
      res.json(gateway);
    } catch (error) {
      console.error('Error fetching payment gateway:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payment gateway' });
    }
  });

  // Create new payment gateway
  app.post('/api/payment/gateways', requireAuth, async (req, res) => {
    try {
      const { name, type, enabled, config, testMode } = req.body;
      
      // Validate required fields
      if (!name || !type || !config) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
      }

      const [gateway] = await db.insert(paymentGateways).values({
        name,
        type,
        enabled: enabled ?? true,
        config,
        testMode: testMode ?? false,
      }).returning();
      
      res.json({ success: true, data: gateway });
    } catch (error) {
      console.error('Error creating payment gateway:', error);
      res.status(500).json({ success: false, message: 'Failed to create payment gateway' });
    }
  });

  // Update payment gateway
  app.patch('/api/payment/gateways/:id', requireAuth, async (req, res) => {
    try {
      const gatewayId = parseInt(req.params.id);
      const { name, type, enabled, config, testMode } = req.body;
      
      const [gateway] = await db.update(paymentGateways)
        .set({
          name,
          type,
          enabled,
          config,
          testMode,
          updatedAt: new Date(),
        })
        .where(eq(paymentGateways.id, gatewayId))
        .returning();
      
      if (!gateway) {
        return res.status(404).json({ success: false, message: 'Payment gateway not found' });
      }
      
      res.json({ success: true, data: gateway });
    } catch (error) {
      console.error('Error updating payment gateway:', error);
      res.status(500).json({ success: false, message: 'Failed to update payment gateway' });
    }
  });

  // Delete payment gateway
  app.delete('/api/payment/gateways/:id', requireAuth, async (req, res) => {
    try {
      const gatewayId = parseInt(req.params.id);
      
      const result = await db.delete(paymentGateways)
        .where(eq(paymentGateways.id, gatewayId))
        .returning();
      
      if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'Payment gateway not found' });
      }
      
      res.json({ success: true, message: 'Payment gateway deleted successfully' });
    } catch (error) {
      console.error('Error deleting payment gateway:', error);
      res.status(500).json({ success: false, message: 'Failed to delete payment gateway' });
    }
  });

  // Toggle payment gateway status
  app.post('/api/payment/gateways/:id/toggle', requireAuth, async (req, res) => {
    try {
      const gatewayId = parseInt(req.params.id);
      
      const [currentGateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.id, gatewayId));
      
      if (!currentGateway) {
        return res.status(404).json({ success: false, message: 'Payment gateway not found' });
      }
      
      const [gateway] = await db.update(paymentGateways)
        .set({
          enabled: !currentGateway.enabled,
          updatedAt: new Date(),
        })
        .where(eq(paymentGateways.id, gatewayId))
        .returning();
      
      res.json({ success: true, data: gateway });
    } catch (error) {
      console.error('Error toggling payment gateway:', error);
      res.status(500).json({ success: false, message: 'Failed to toggle payment gateway' });
    }
  });

  // ============================================================================
  // IRAQI BANKING PAYMENT API
  // ============================================================================

  // Get enabled payment gateways for customer use
  app.get('/api/payment/available-gateways', async (req, res) => {
    try {
      const gateways = await db.select().from(paymentGateways).where(eq(paymentGateways.enabled, true));
      res.json({ success: true, data: gateways });
    } catch (error) {
      console.error('Error fetching available payment gateways:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch available payment gateways' });
    }
  });

  // Process Iraqi bank transfer payment
  app.post('/api/payment/iraqi-bank-transfer', async (req, res) => {
    try {
      const { orderId, gatewayId, bankTransferDetails } = req.body;
      
      if (!orderId || !gatewayId || !bankTransferDetails) {
        return res.status(400).json({ success: false, message: 'Missing required payment details' });
      }

      // Get payment gateway configuration
      const [gateway] = await db.select().from(paymentGateways).where(eq(paymentGateways.id, gatewayId));
      
      if (!gateway || !gateway.enabled) {
        return res.status(400).json({ success: false, message: 'Invalid or disabled payment gateway' });
      }

      // Verify order exists
      const order = await shopStorage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // For Iraqi bank transfers, we'll mark as pending and require manual verification
      const updatedOrder = await shopStorage.updateOrder(orderId, {
        paymentStatus: 'pending',
        paymentMethod: `Bank Transfer - ${gateway.name}`,
        paymentGatewayId: gatewayId
      });

      // Log the payment attempt
      console.log(`Iraqi bank transfer initiated for order ${orderId}:`, {
        gateway: gateway.name,
        bankDetails: bankTransferDetails,
        amount: order.totalAmount
      });

      // Create financial transaction record
      await shopStorage.createFinancialTransaction({
        type: 'payment_pending',
        orderId: order.id,
        amount: order.totalAmount,
        description: `Iraqi bank transfer pending verification - ${gateway.name}`,
        referenceNumber: bankTransferDetails.referenceNumber || order.orderNumber,
        status: 'pending',
        processingDate: new Date(),
        metadata: { 
          gatewayId,
          gatewayName: gateway.name,
          bankTransferDetails,
          paymentMethod: 'iraqi_bank_transfer'
        }
      });

      res.json({ 
        success: true, 
        message: 'Bank transfer payment initiated. Awaiting verification.',
        data: { 
          order: updatedOrder,
          paymentStatus: 'pending',
          verificationRequired: true,
          bankInfo: gateway.config
        }
      });
    } catch (error) {
      console.error('Error processing Iraqi bank transfer:', error);
      res.status(500).json({ success: false, message: 'Failed to process bank transfer payment' });
    }
  });

  // Verify Iraqi bank transfer payment (admin only)
  app.post('/api/payment/verify-bank-transfer/:orderId', requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { verified, notes } = req.body;
      
      if (isNaN(orderId)) {
        return res.status(400).json({ success: false, message: 'Invalid order ID' });
      }

      const order = await shopStorage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      if (verified) {
        // Mark order as paid
        const updatedOrder = await shopStorage.updateOrder(orderId, {
          paymentStatus: 'paid'
        });

        // Generate invoice automatically
        const invoice = await invoiceStorage.generateInvoiceFromOrder(orderId);
        
        // Send invoice email to customer
        await invoiceStorage.sendInvoiceEmail(invoice.id);

        // Update financial transaction
        await shopStorage.createFinancialTransaction({
          type: 'sale',
          orderId: order.id,
          amount: order.totalAmount,
          description: `Bank transfer verified and completed - ${order.paymentMethod}`,
          referenceNumber: order.orderNumber,
          status: 'completed',
          processingDate: new Date(),
          metadata: { 
            verifiedBy: req.session?.adminId,
            verificationNotes: notes,
            originalPaymentMethod: 'iraqi_bank_transfer'
          }
        });

        res.json({ 
          success: true, 
          message: 'Bank transfer verified and order completed',
          data: { order: updatedOrder, invoice }
        });
      } else {
        // Mark payment as failed
        const updatedOrder = await shopStorage.updateOrder(orderId, {
          paymentStatus: 'failed'
        });

        res.json({ 
          success: true, 
          message: 'Bank transfer verification failed',
          data: { order: updatedOrder }
        });
      }
    } catch (error) {
      console.error('Error verifying bank transfer:', error);
      res.status(500).json({ success: false, message: 'Failed to verify bank transfer' });
    }
  });

  // Get payment methods configuration for checkout
  app.get('/api/payment/methods', async (req, res) => {
    try {
      const gateways = await db.select().from(paymentGateways).where(eq(paymentGateways.enabled, true));
      
      const paymentMethods = gateways.map(gateway => ({
        id: gateway.id,
        name: gateway.name,
        type: gateway.type,
        config: {
          // Only return safe config data (not secrets)
          bankName: gateway.config?.bankName,
          accountNumber: gateway.config?.accountNumber,
          swiftCode: gateway.config?.swiftCode,
          instructions: gateway.config?.instructions
        },
        testMode: gateway.testMode
      }));

      res.json({ success: true, data: paymentMethods });
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch payment methods' });
    }
  });

  // Get pending payments for admin review
  app.get('/api/admin/pending-payments', requireAuth, async (req, res) => {
    try {
      // Get orders with pending payment status
      const pendingOrders = await db.select({
        orderId: orders.id,
        orderNumber: orders.orderNumber,
        customerId: orders.customerId,
        totalAmount: orders.totalAmount,
        paymentMethod: orders.paymentMethod,
        paymentGatewayId: orders.paymentGatewayId,
        createdAt: orders.createdAt
      })
      .from(orders)
      .where(eq(orders.paymentStatus, 'pending'))
      .orderBy(desc(orders.createdAt));

      // Get customer details for each order
      const ordersWithCustomers = await Promise.all(
        pendingOrders.map(async (order) => {
          let customer = null;
          if (order.customerId) {
            customer = await crmStorage.getCrmCustomerById(order.customerId);
          }
          return { ...order, customer };
        })
      );

      res.json({ success: true, data: ordersWithCustomers });
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch pending payments' });
    }
  });

  // =============================================================================
  // CUSTOMER WALLET SYSTEM ENDPOINTS
  // =============================================================================

  // Customer wallet endpoints
  app.get('/api/customer/wallet', async (req, res) => {
    try {
      if (!req.session.customerId) {
        return res.status(401).json({ success: false, message: "Customer authentication required" });
      }

      const summary = await walletStorage.getCustomerWalletSummary(req.session.customerId);
      res.json({ success: true, data: summary });
    } catch (error) {
      console.error('Error fetching wallet summary:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch wallet information' });
    }
  });

  // Create wallet recharge request
  app.post('/api/customer/wallet/recharge', async (req, res) => {
    try {
      if (!req.session.customerId) {
        return res.status(401).json({ success: false, message: "Customer authentication required" });
      }

      const { amount, currency, paymentMethod, paymentReference, customerNotes } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, message: "Valid amount is required" });
      }

      // Get or create wallet
      let wallet = await walletStorage.getWalletByCustomerId(req.session.customerId);
      if (!wallet) {
        wallet = await walletStorage.createWallet({
          customerId: req.session.customerId,
          balance: "0",
          currency: currency || "IQD",
          status: "active"
        });
      }

      const rechargeRequest = await walletStorage.createRechargeRequest({
        customerId: req.session.customerId,
        walletId: wallet.id,
        amount: amount.toString(),
        currency: currency || "IQD",
        paymentMethod,
        paymentReference,
        customerNotes
      });

      res.json({ success: true, data: rechargeRequest });
    } catch (error) {
      console.error('Error creating recharge request:', error);
      res.status(500).json({ success: false, message: 'Failed to create recharge request' });
    }
  });

  // Get customer's recharge requests
  app.get('/api/customer/wallet/recharge-requests', async (req, res) => {
    try {
      if (!req.session.customerId) {
        return res.status(401).json({ success: false, message: "Customer authentication required" });
      }

      const requests = await walletStorage.getRechargeRequestsByCustomer(req.session.customerId);
      res.json({ success: true, data: requests });
    } catch (error) {
      console.error('Error fetching recharge requests:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch recharge requests' });
    }
  });

  // Get customer wallet transactions
  app.get('/api/customer/wallet/transactions', async (req, res) => {
    try {
      if (!req.session.customerId) {
        return res.status(401).json({ success: false, message: "Customer authentication required" });
      }

      const limit = parseInt(req.query.limit as string) || 50;
      const transactions = await walletStorage.getTransactionsByCustomer(req.session.customerId, limit);
      res.json({ success: true, data: transactions });
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch wallet transactions' });
    }
  });

  // Admin wallet endpoints
  app.get('/api/admin/wallet/stats', requireAuth, async (req, res) => {
    try {
      const statistics = await walletStorage.getWalletStatistics();
      res.json({ success: true, data: statistics });
    } catch (error) {
      console.error('Error fetching wallet statistics:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch wallet statistics' });
    }
  });

  // Get pending recharge requests (admin)
  app.get('/api/admin/wallet/recharge-requests/pending', requireAuth, async (req, res) => {
    try {
      const requests = await walletStorage.getAllPendingRechargeRequests();
      
      // Get customer details for each request
      const requestsWithCustomers = await Promise.all(
        requests.map(async (request) => {
          const customer = await crmStorage.getCrmCustomerById(request.customerId);
          return { ...request, customer };
        })
      );

      res.json({ success: true, data: requestsWithCustomers });
    } catch (error) {
      console.error('Error fetching pending recharge requests:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch pending recharge requests' });
    }
  });

  // Get all recharge requests (admin)
  app.get('/api/admin/wallet/recharge-requests', requireAuth, async (req, res) => {
    try {
      const requests = await walletStorage.getAllRechargeRequests();
      
      // Get customer details for each request
      const requestsWithCustomers = await Promise.all(
        requests.map(async (request) => {
          const customer = await crmStorage.getCrmCustomerById(request.customerId);
          return { ...request, customer };
        })
      );

      res.json({ success: true, data: requestsWithCustomers });
    } catch (error) {
      console.error('Error fetching all recharge requests:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch all recharge requests' });
    }
  });

  // Process recharge request (approve/reject)
  app.post('/api/admin/wallet/recharge-requests/:id/process', requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { action, adminNotes } = req.body; // action: 'approve' or 'reject'
      const adminId = req.session.adminId;

      if (!adminId) {
        return res.status(401).json({ success: false, message: "Admin authentication required" });
      }

      if (action === 'approve') {
        const result = await walletStorage.processRechargeRequest(requestId, adminId);
        res.json({ 
          success: true, 
          message: "Recharge request approved and processed successfully",
          data: result 
        });
      } else if (action === 'reject') {
        const updatedRequest = await walletStorage.updateRechargeRequestStatus(
          requestId, 
          'rejected', 
          adminNotes, 
          adminId
        );
        res.json({ 
          success: true, 
          message: "Recharge request rejected",
          data: updatedRequest 
        });
      } else {
        res.status(400).json({ success: false, message: "Invalid action. Use 'approve' or 'reject'" });
      }
    } catch (error) {
      console.error('Error processing recharge request:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to process recharge request' 
      });
    }
  });

  // Approve recharge request (admin)
  app.post('/api/admin/wallet/recharge-requests/:id/approve', requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { adminNotes } = req.body;
      const adminId = req.session.adminId;

      if (!adminId) {
        return res.status(401).json({ success: false, message: "Admin authentication required" });
      }

      const result = await walletStorage.processRechargeRequest(requestId, adminId);
      
      // Update with admin notes if provided
      if (adminNotes) {
        await walletStorage.updateRechargeRequestStatus(requestId, 'approved', adminNotes, adminId);
      }

      res.json({ 
        success: true, 
        message: "Recharge request approved and processed successfully",
        data: result 
      });
    } catch (error) {
      console.error('Error approving recharge request:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to approve recharge request' 
      });
    }
  });

  // Reject recharge request (admin)
  app.post('/api/admin/wallet/recharge-requests/:id/reject', requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const { rejectionReason, adminNotes } = req.body;
      const adminId = req.session.adminId;

      if (!adminId) {
        return res.status(401).json({ success: false, message: "Admin authentication required" });
      }

      if (!rejectionReason) {
        return res.status(400).json({ success: false, message: "Rejection reason is required" });
      }

      // Update request status with rejection reason
      const updatedRequest = await walletStorage.updateRechargeRequestStatus(
        requestId, 
        'rejected', 
        adminNotes, 
        adminId
      );

      // Add rejection reason
      await customerDb
        .update(walletRechargeRequests)
        .set({ rejectionReason })
        .where(eq(walletRechargeRequests.id, requestId));

      res.json({ 
        success: true, 
        message: "Recharge request rejected",
        data: updatedRequest 
      });
    } catch (error) {
      console.error('Error rejecting recharge request:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to reject recharge request' 
      });
    }
  });

  // Manual wallet adjustment (admin only)
  app.post('/api/admin/wallet/adjust', requireAuth, async (req, res) => {
    try {
      const { customerId, amount, description, type } = req.body; // type: 'credit' or 'debit'
      const adminId = req.session.adminId;

      if (!adminId) {
        return res.status(401).json({ success: false, message: "Admin authentication required" });
      }

      if (!customerId || !amount || !description || !type) {
        return res.status(400).json({ success: false, message: "All fields are required" });
      }

      let transaction;
      if (type === 'credit') {
        transaction = await walletStorage.creditWallet(
          customerId,
          parseFloat(amount),
          description,
          'manual_adjustment',
          undefined,
          adminId
        );
      } else if (type === 'debit') {
        transaction = await walletStorage.debitWallet(
          customerId,
          parseFloat(amount),
          description,
          'manual_adjustment',
          undefined,
          adminId
        );
      } else {
        return res.status(400).json({ success: false, message: "Invalid type. Use 'credit' or 'debit'" });
      }

      res.json({ 
        success: true, 
        message: `Wallet ${type} adjustment completed successfully`,
        data: transaction 
      });
    } catch (error) {
      console.error('Error adjusting wallet:', error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to adjust wallet' 
      });
    }
  });

  // Get customer wallet details (admin)
  app.get('/api/admin/wallet/customer/:customerId', requireAuth, async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      const summary = await walletStorage.getCustomerWalletSummary(customerId);
      
      // Get customer details
      const customer = await crmStorage.getCrmCustomerById(customerId);
      
      res.json({ 
        success: true, 
        data: { 
          ...summary, 
          customer 
        } 
      });
    } catch (error) {
      console.error('Error fetching customer wallet details:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch customer wallet details' });
    }
  });

  // =============================================================================
  // GEOGRAPHIC DISTRIBUTION REPORTS API
  // =============================================================================

  // Geographic Distribution Reports API
  app.get('/api/reports/geographic-distribution', async (req, res) => {
    try {
      // Get customer geographic distribution data
      const countries = await crmDb.select({
        country: crmCustomers.country,
        count: sql`count(*)::int`.as('count'),
        totalRevenue: sql`coalesce(sum(${crmCustomers.totalSpent}), 0)::numeric`.as('totalRevenue')
      })
      .from(crmCustomers)
      .where(isNotNull(crmCustomers.country))
      .groupBy(crmCustomers.country)
      .orderBy(sql`count(*) desc`);

      const totalCustomers = await crmDb.select({ count: sql`count(*)::int`.as('count') })
        .from(crmCustomers)
        .then(result => result[0]?.count || 0);

      // Calculate percentages for countries
      const countriesWithPercentage = countries.map(country => ({
        ...country,
        percentage: totalCustomers > 0 ? (country.count / totalCustomers) * 100 : 0,
        totalRevenue: Number(country.totalRevenue)
      }));

      // Get cities distribution
      const cities = await crmDb.select({
        city: crmCustomers.city,
        country: crmCustomers.country,
        count: sql`count(*)::int`.as('count'),
        totalRevenue: sql`coalesce(sum(${crmCustomers.totalSpent}), 0)::numeric`.as('totalRevenue')
      })
      .from(crmCustomers)
      .where(and(isNotNull(crmCustomers.city), isNotNull(crmCustomers.country)))
      .groupBy(crmCustomers.city, crmCustomers.country)
      .orderBy(sql`count(*) desc`)
      .limit(50);

      const citiesWithPercentage = cities.map(city => ({
        ...city,
        percentage: totalCustomers > 0 ? (city.count / totalCustomers) * 100 : 0,
        totalRevenue: Number(city.totalRevenue)
      }));

      // Get top regions summary
      const topRegions = countriesWithPercentage.slice(0, 10).map(country => ({
        region: country.country,
        customers: country.count,
        revenue: country.totalRevenue,
        averageOrderValue: country.count > 0 ? country.totalRevenue / country.count : 0
      }));

      const geoStats = {
        totalCustomers,
        countries: countriesWithPercentage,
        cities: citiesWithPercentage,
        topRegions
      };

      res.json(geoStats);
    } catch (error) {
      console.error('Geographic distribution API error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch geographic distribution data' });
    }
  });

  // Customer locations API
  app.get('/api/reports/customer-locations', async (req, res) => {
    try {
      const { country } = req.query;
      
      let query = crmDb.select({
        id: crmCustomers.id,
        name: sql`concat(${crmCustomers.firstName}, ' ', ${crmCustomers.lastName})`.as('name'),
        email: crmCustomers.email,
        country: crmCustomers.country,
        city: crmCustomers.city,
        address: crmCustomers.address,
        totalOrders: crmCustomers.totalOrders,
        totalSpent: crmCustomers.totalSpent
      })
      .from(crmCustomers)
      .where(and(
        isNotNull(crmCustomers.address),
        isNotNull(crmCustomers.city),
        isNotNull(crmCustomers.country)
      ));

      if (country && country !== 'all') {
        query = query.where(eq(crmCustomers.country, country as string));
      }

      const customerLocations = await query
        .orderBy(desc(crmCustomers.totalSpent))
        .limit(100);

      res.json(customerLocations);
    } catch (error) {
      console.error('Customer locations API error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch customer locations' });
    }
  });

  // Geographic distribution PDF export
  app.post('/api/reports/geographic-distribution/export', async (req, res) => {
    try {
      const { country, metric } = req.body;
      
      // Get the geographic distribution data directly
      const countries = await crmDb.select({
        country: crmCustomers.country,
        count: sql`count(*)::int`.as('count'),
        totalRevenue: sql`coalesce(sum(${crmCustomers.totalSpent}), 0)::numeric`.as('totalRevenue')
      })
      .from(crmCustomers)
      .where(isNotNull(crmCustomers.country))
      .groupBy(crmCustomers.country)
      .orderBy(sql`count(*) desc`);

      const totalCustomers = await crmDb.select({ count: sql`count(*)::int`.as('count') })
        .from(crmCustomers)
        .then(result => result[0]?.count || 0);

      const countriesWithPercentage = countries.map(country => ({
        ...country,
        percentage: totalCustomers > 0 ? (country.count / totalCustomers) * 100 : 0,
        totalRevenue: Number(country.totalRevenue)
      }));

      const cities = await crmDb.select({
        city: crmCustomers.city,
        country: crmCustomers.country,
        count: sql`count(*)::int`.as('count'),
        totalRevenue: sql`coalesce(sum(${crmCustomers.totalSpent}), 0)::numeric`.as('totalRevenue')
      })
      .from(crmCustomers)
      .where(and(isNotNull(crmCustomers.city), isNotNull(crmCustomers.country)))
      .groupBy(crmCustomers.city, crmCustomers.country)
      .orderBy(sql`count(*) desc`)
      .limit(50);

      const citiesWithPercentage = cities.map(city => ({
        ...city,
        percentage: totalCustomers > 0 ? (city.count / totalCustomers) * 100 : 0,
        totalRevenue: Number(city.totalRevenue)
      }));

      const geoData = {
        totalCustomers,
        countries: countriesWithPercentage,
        cities: citiesWithPercentage
      };
      
      // Generate PDF report
      const html = `
        <!DOCTYPE html>
        <html dir="rtl">
        <head>
          <meta charset="UTF-8">
          <title>گزارش توزیع جغرافیایی مشتریان</title>
          <style>
            body { font-family: 'Tahoma', Arial, sans-serif; margin: 20px; direction: rtl; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .stats { display: flex; justify-content: space-around; margin: 20px 0; }
            .stat-card { text-align: center; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: right; }
            .table th { background-color: #f5f5f5; font-weight: bold; }
            .section { margin: 30px 0; }
            .section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>گزارش توزیع جغرافیایی مشتریان</h1>
            <p>تاریخ تولید گزارش: ${new Date().toLocaleDateString('fa-IR')}</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <h3>کل مشتریان</h3>
              <p style="font-size: 24px; font-weight: bold;">${geoData.totalCustomers.toLocaleString()}</p>
            </div>
            <div class="stat-card">
              <h3>تعداد کشورها</h3>
              <p style="font-size: 24px; font-weight: bold;">${geoData.countries.length}</p>
            </div>
            <div class="stat-card">
              <h3>تعداد شهرها</h3>
              <p style="font-size: 24px; font-weight: bold;">${geoData.cities.length}</p>
            </div>
          </div>

          <div class="section">
            <h2>توزیع مشتریان بر اساس کشور</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>رتبه</th>
                  <th>کشور</th>
                  <th>تعداد مشتری</th>
                  <th>درصد</th>
                  <th>کل فروش</th>
                </tr>
              </thead>
              <tbody>
                ${geoData.countries.map((country: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${country.country}</td>
                    <td>${country.count.toLocaleString()}</td>
                    <td>${country.percentage.toFixed(1)}%</td>
                    <td>$${country.totalRevenue.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section">
            <h2>توزیع مشتریان بر اساس شهر (۲۰ شهر برتر)</h2>
            <table class="table">
              <thead>
                <tr>
                  <th>رتبه</th>
                  <th>شهر</th>
                  <th>کشور</th>
                  <th>تعداد مشتری</th>
                  <th>کل فروش</th>
                </tr>
              </thead>
              <tbody>
                ${geoData.cities.slice(0, 20).map((city: any, index: number) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${city.city}</td>
                    <td>${city.country}</td>
                    <td>${city.count.toLocaleString()}</td>
                    <td>$${city.totalRevenue.toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </body>
        </html>
      `;

      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' }
      });
      
      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=geographic-distribution-${new Date().toISOString().split('T')[0]}.pdf`);
      res.send(pdf);
      
    } catch (error) {
      console.error('PDF export error:', error);
      res.status(500).json({ success: false, message: 'Failed to generate PDF report' });
    }
  });

  // Geographic Analytics Endpoints
  app.get("/api/analytics/geographic", requireAuth, async (req: Request, res: Response) => {
    try {
      const { period = '30d', region = 'all' } = req.query;
      
      // Calculate date range
      const daysMap: { [key: string]: number } = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const days = daysMap[period as string] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Query orders with customer location data using raw SQL
      const query = sql`
        SELECT 
          COALESCE(c.country, 'Unknown') as country,
          COALESCE(c.city, 'Unknown') as city,
          COUNT(DISTINCT o.id) as total_orders,
          COUNT(DISTINCT o.customer_id) as customer_count,
          SUM(CAST(o.total_amount AS DECIMAL)) as total_revenue,
          AVG(CAST(o.total_amount AS DECIMAL)) as avg_order_value
        FROM orders o
        LEFT JOIN crm_customers c ON o.customer_id = c.id
        WHERE o.created_at >= ${startDate}
        ${region !== 'all' ? sql` AND c.country = ${region}` : sql``}
        GROUP BY c.country, c.city
        ORDER BY total_revenue DESC
      `;

      const result = await db.execute(query);

      // Get top products for each region
      const geoData = await Promise.all(result.rows.map(async (row: any) => {
        const topProductsQuery = sql`
          SELECT 
            p.name,
            SUM(oi.quantity) as quantity,
            SUM(CAST(oi.total_price AS DECIMAL)) as revenue
          FROM orders o
          LEFT JOIN crm_customers c ON o.customer_id = c.id
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE o.created_at >= ${startDate}
            AND c.country = ${row.country}
            AND c.city = ${row.city}
          GROUP BY p.id, p.name
          ORDER BY revenue DESC
          LIMIT 5
        `;

        const topProducts = await db.execute(topProductsQuery);

        return {
          region: `${row.city}, ${row.country}`,
          country: row.country,
          city: row.city,
          totalOrders: Number(row.total_orders),
          totalRevenue: Number(row.total_revenue) || 0,
          customerCount: Number(row.customer_count),
          avgOrderValue: Number(row.avg_order_value) || 0,
          topProducts: topProducts.rows.map((p: any) => ({
            name: p.name,
            quantity: Number(p.quantity),
            revenue: Number(p.revenue) || 0
          }))
        };
      }));

      res.json({
        success: true,
        data: geoData
      });

    } catch (error) {
      console.error("Error fetching geographic analytics:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching geographic analytics"
      });
    }
  });

  app.get("/api/analytics/products", requireAuth, async (req: Request, res: Response) => {
    try {
      const { period = '30d', product = 'all' } = req.query;
      
      const daysMap: { [key: string]: number } = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const days = daysMap[period as string] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const query = sql`
        SELECT 
          p.name,
          p.category,
          SUM(oi.quantity) as total_sales,
          SUM(CAST(oi.total_price AS DECIMAL)) as revenue
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.created_at >= ${startDate}
        ${product !== 'all' ? sql` AND p.id = ${product}` : sql``}
        GROUP BY p.id, p.name, p.category
        ORDER BY revenue DESC
      `;

      const result = await db.execute(query);

      // Get regional breakdown for each product
      const productData = await Promise.all(result.rows.map(async (row: any) => {
        const regionsQuery = sql`
          SELECT 
            COALESCE(c.country, 'Unknown') as region,
            COALESCE(c.city, 'Unknown') as city,
            SUM(oi.quantity) as quantity,
            SUM(CAST(oi.total_price AS DECIMAL)) as revenue
          FROM orders o
          LEFT JOIN crm_customers c ON o.customer_id = c.id
          LEFT JOIN order_items oi ON o.id = oi.order_id
          LEFT JOIN products p ON oi.product_id = p.id
          WHERE o.created_at >= ${startDate} AND p.name = ${row.name}
          GROUP BY c.country, c.city
          ORDER BY revenue DESC
        `;

        const regions = await db.execute(regionsQuery);

        return {
          name: row.name,
          category: row.category,
          totalSales: Number(row.total_sales),
          revenue: Number(row.revenue) || 0,
          regions: regions.rows.map((r: any) => ({
            region: r.region,
            city: r.city,
            quantity: Number(r.quantity),
            revenue: Number(r.revenue) || 0
          }))
        };
      }));

      res.json({
        success: true,
        data: productData
      });

    } catch (error) {
      console.error("Error fetching product analytics:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching product analytics"
      });
    }
  });

  app.get("/api/analytics/timeseries", requireAuth, async (req: Request, res: Response) => {
    try {
      const { period = '30d' } = req.query;
      
      const daysMap: { [key: string]: number } = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
      const days = daysMap[period as string] || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const query = sql`
        SELECT 
          DATE(o.created_at) as date,
          COUNT(DISTINCT o.id) as orders,
          SUM(CAST(o.total_amount AS DECIMAL)) as revenue
        FROM orders o
        WHERE o.created_at >= ${startDate}
        GROUP BY DATE(o.created_at)
        ORDER BY date ASC
      `;

      const result = await db.execute(query);

      const timeData = result.rows.map((row: any) => ({
        date: row.date,
        orders: Number(row.orders),
        revenue: Number(row.revenue) || 0,
        regions: {} // Can be expanded to include regional breakdown per day
      }));

      res.json({
        success: true,
        data: timeData
      });

    } catch (error) {
      console.error("Error fetching time series analytics:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching time series analytics"
      });
    }
  });

  // Product Sales Trends Over Time API
  app.get("/api/analytics/product-trends", requireAuth, async (req: Request, res: Response) => {
    try {
      const { period = '30d', product = 'all' } = req.query;
      
      let dateCondition = '';
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '3m':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const query = sql`
        SELECT 
          p.name as product_name,
          p.category,
          DATE(o.created_at) as date,
          SUM(oi.quantity) as daily_sales,
          SUM(CAST(oi.total_price AS DECIMAL)) as daily_revenue,
          COUNT(DISTINCT o.id) as daily_orders
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.created_at >= ${startDate}
        ${product !== 'all' ? sql`AND p.name = ${product}` : sql``}
        GROUP BY p.name, p.category, DATE(o.created_at)
        ORDER BY date ASC, daily_sales DESC
      `;

      const result = await db.execute(query);
      
      // Group data by product
      const productTrends: { [key: string]: any } = {};
      
      result.rows.forEach((row: any) => {
        const productName = row.product_name;
        if (!productTrends[productName]) {
          productTrends[productName] = {
            name: productName,
            category: row.category,
            dailyData: [],
            totalSales: 0,
            totalRevenue: 0,
            totalOrders: 0
          };
        }
        
        const dailyData = {
          date: row.date,
          sales: Number(row.daily_sales),
          revenue: Number(row.daily_revenue) || 0,
          orders: Number(row.daily_orders)
        };
        
        productTrends[productName].dailyData.push(dailyData);
        productTrends[productName].totalSales += dailyData.sales;
        productTrends[productName].totalRevenue += dailyData.revenue;
        productTrends[productName].totalOrders += dailyData.orders;
      });

      const responseData = Object.values(productTrends);

      res.json({
        success: true,
        data: responseData
      });

    } catch (error) {
      console.error("Error fetching product trends:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching product trends"
      });
    }
  });

  // =============================================================================
  // CENTRALIZED BARCODE MANAGEMENT API ENDPOINTS
  // =============================================================================
  
  // Generate EAN-13 barcode for product
  app.post("/api/barcode/generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const { productName, category } = req.body;
      
      if (!productName || !category) {
        return res.status(400).json({
          success: false,
          message: "Product name and category are required"
        });
      }
      
      const barcode = generateEAN13Barcode(productName, category);
      const parsed = parseEAN13Barcode(barcode);
      
      res.json({
        success: true,
        data: {
          barcode,
          details: parsed,
          productName,
          category
        }
      });
    } catch (error) {
      console.error("Error generating barcode:", error);
      res.status(500).json({
        success: false,
        message: "Error generating barcode"
      });
    }
  });
  
  // Validate EAN-13 barcode
  app.post("/api/barcode/validate", requireAuth, async (req: Request, res: Response) => {
    try {
      const { barcode } = req.body;
      
      if (!barcode) {
        return res.status(400).json({
          success: false,
          message: "Barcode is required"
        });
      }
      
      const isValid = validateEAN13(barcode);
      const parsed = parseEAN13Barcode(barcode);
      const isMomtazchemProduct = isMomtazchemBarcode(barcode);
      
      res.json({
        success: true,
        data: {
          barcode,
          isValid,
          isMomtazchemProduct,
          details: parsed
        }
      });
    } catch (error) {
      console.error("Error validating barcode:", error);
      res.status(500).json({
        success: false,
        message: "Error validating barcode"
      });
    }
  });
  
  // Get product barcode (check if product already has barcode, if not generate one)
  app.get("/api/barcode/product/:productId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      
      // Try to get from showcase_products first
      const showcaseProduct = await storage.getShowcaseProductById(parseInt(productId));
      if (showcaseProduct) {
        let barcode = showcaseProduct.barcode;
        
        // If no barcode exists, generate one
        if (!barcode) {
          barcode = generateEAN13Barcode(showcaseProduct.name, showcaseProduct.category);
          
          // Update product with generated barcode
          await storage.updateShowcaseProduct(showcaseProduct.id, { barcode });
        }
        
        const parsed = parseEAN13Barcode(barcode);
        
        return res.json({
          success: true,
          data: {
            productId: showcaseProduct.id,
            productName: showcaseProduct.name,
            category: showcaseProduct.category,
            barcode,
            details: parsed,
            source: 'showcase'
          }
        });
      }
      
      // Try to get from shop_products if not found in showcase
      try {
        const shopProduct = await shopStorage.getShopProductById(parseInt(productId));
        if (shopProduct) {
          let barcode = shopProduct.barcode;
          
          // If no barcode exists, generate one
          if (!barcode) {
            barcode = generateEAN13Barcode(shopProduct.name, shopProduct.category);
            
            // Update product with generated barcode
            await shopStorage.updateShopProduct(shopProduct.id, { barcode });
          }
          
          const parsed = parseEAN13Barcode(barcode);
          
          return res.json({
            success: true,
            data: {
              productId: shopProduct.id,
              productName: shopProduct.name,
              category: shopProduct.category,
              barcode,
              details: parsed,
              source: 'shop'
            }
          });
        }
      } catch (error) {
        // Shop product not found, continue
      }
      
      res.status(404).json({
        success: false,
        message: "Product not found"
      });
      
    } catch (error) {
      console.error("Error getting product barcode:", error);
      res.status(500).json({
        success: false,
        message: "Error getting product barcode"
      });
    }
  });
  
  // Search products by barcode
  app.get("/api/barcode/search/:barcode", requireAuth, async (req: Request, res: Response) => {
    try {
      const { barcode } = req.params;
      
      if (!validateEAN13(barcode)) {
        return res.status(400).json({
          success: false,
          message: "Invalid EAN-13 barcode format"
        });
      }
      
      const results = [];
      
      // Search in showcase_products
      try {
        const showcaseProducts = await storage.getShowcaseProducts();
        const showcaseMatch = showcaseProducts.find((p: any) => p.barcode === barcode);
        if (showcaseMatch) {
          results.push({
            ...showcaseMatch,
            source: 'showcase'
          });
        }
      } catch (error) {
        console.error("Error searching showcase products:", error);
      }
      
      // Search in shop_products
      try {
        const shopProducts = await shopStorage.getShopProducts();
        const shopMatch = shopProducts.find((p: any) => p.barcode === barcode);
        if (shopMatch) {
          results.push({
            ...shopMatch,
            source: 'shop'
          });
        }
      } catch (error) {
        console.error("Error searching shop products:", error);
      }
      
      const parsed = parseEAN13Barcode(barcode);
      const isMomtazchemProduct = isMomtazchemBarcode(barcode);
      
      res.json({
        success: true,
        data: {
          barcode,
          details: parsed,
          isMomtazchemProduct,
          products: results
        }
      });
      
    } catch (error) {
      console.error("Error searching by barcode:", error);
      res.status(500).json({
        success: false,
        message: "Error searching by barcode"
      });
    }
  });

  // Check if barcode is unique/duplicate
  app.get("/api/barcode/check-duplicate/:barcode", requireAuth, async (req: Request, res: Response) => {
    try {
      const { barcode } = req.params;
      const { excludeProductId } = req.query;
      
      // Search in showcase_products
      const showcaseProducts = await storage.getShowcaseProducts();
      const showcaseMatch = showcaseProducts.find((p: any) => 
        p.barcode === barcode && 
        (excludeProductId ? p.id !== parseInt(excludeProductId as string) : true)
      );
      
      // Search in shop_products (if exists)
      let shopMatch = null;
      try {
        const shopProducts = await shopStorage.getShopProducts();
        shopMatch = shopProducts.find((p: any) => 
          p.barcode === barcode && 
          (excludeProductId ? p.id !== parseInt(excludeProductId as string) : true)
        );
      } catch (error) {
        // Shop products table might not exist, ignore error
      }
      
      const isDuplicate = !!(showcaseMatch || shopMatch);
      const duplicateProduct = showcaseMatch || shopMatch;
      
      res.json({
        success: true,
        data: {
          barcode,
          isDuplicate,
          isUnique: !isDuplicate,
          duplicateProduct: duplicateProduct ? {
            id: duplicateProduct.id,
            name: duplicateProduct.name,
            source: showcaseMatch ? 'showcase' : 'shop'
          } : null
        }
      });
    } catch (error) {
      console.error("Error checking barcode duplicate:", error);
      res.status(500).json({
        success: false,
        message: "Error checking barcode uniqueness"
      });
    }
  });

  // Check if 5-digit product code is unique
  app.get("/api/barcode/check-product-code/:productCode", requireAuth, async (req: Request, res: Response) => {
    try {
      const { productCode } = req.params;
      
      // Search in showcase_products for product codes within barcodes
      const showcaseProducts = await storage.getShowcaseProducts();
      const showcaseMatch = showcaseProducts.find((p: any) => {
        if (!p.barcode || p.barcode.length !== 13) return false;
        // Extract 5-digit product code from position 8-12 in EAN-13: 846-96771-XXXXX-C
        const extractedCode = p.barcode.substring(8, 13);
        return extractedCode === productCode;
      });
      
      // Search in shop_products (if exists)
      let shopMatch = null;
      try {
        const shopProducts = await shopStorage.getShopProducts();
        shopMatch = shopProducts.find((p: any) => {
          if (!p.barcode || p.barcode.length !== 13) return false;
          const extractedCode = p.barcode.substring(8, 13);
          return extractedCode === productCode;
        });
      } catch (error) {
        // Shop products table might not exist, ignore error
      }
      
      const isDuplicate = !!(showcaseMatch || shopMatch);
      
      res.json({
        success: true,
        data: {
          productCode,
          isDuplicate,
          isUnique: !isDuplicate
        }
      });
    } catch (error) {
      console.error("Error checking product code uniqueness:", error);
      res.status(500).json({
        success: false,
        message: "Error checking product code uniqueness"
      });
    }
  });

  // Batch generate barcodes for existing products
  app.post("/api/barcode/batch-generate", requireAuth, async (req: Request, res: Response) => {
    try {
      const { generateBarcodesForExistingProducts } = await import('./barcode-batch-generator');
      const results = await generateBarcodesForExistingProducts();
      
      res.json({ 
        success: true, 
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      });
    } catch (error) {
      console.error('Batch barcode generation error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to generate barcodes',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Regenerate all barcodes (admin only)
  app.post("/api/barcode/regenerate-all", requireAuth, async (req: Request, res: Response) => {
    try {
      const { regenerateAllBarcodes } = await import('./barcode-batch-generator');
      const results = await regenerateAllBarcodes();
      
      res.json({ 
        success: true, 
        results,
        summary: {
          total: results.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length
        }
      });
    } catch (error) {
      console.error('Barcode regeneration error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to regenerate barcodes',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate barcodes with new Iraq format for all products
  app.post("/api/barcode/generate-iraq-format", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("Starting Iraq format barcode generation...");
      
      // Get all showcase products
      const showcaseProductsData = await db.select().from(showcaseProducts);
      console.log(`Found ${showcaseProductsData.length} showcase products`);
      
      // Get all shop products  
      const shopProductsData = await db.select().from(shopProducts);
      console.log(`Found ${shopProductsData.length} shop products`);
      
      const results = [];
      
      // Process showcase products
      for (const product of showcaseProductsData) {
        try {
          // Generate new barcode with Iraq format: 864-96771-XXXXX-C
          const countryCode = '864'; // Iraq
          const companyCode = '96771'; // Momtazchem
          const productCode = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit random
          const barcode12 = countryCode + companyCode + productCode;
          
          // Calculate check digit
          let oddSum = 0;
          let evenSum = 0;
          for (let i = 0; i < 12; i++) {
            const digit = parseInt(barcode12[i]);
            if (i % 2 === 0) {
              oddSum += digit;
            } else {
              evenSum += digit;
            }
          }
          const total = oddSum + (evenSum * 3);
          const checkDigit = (10 - (total % 10)) % 10;
          const fullBarcode = barcode12 + checkDigit.toString();
          
          // Update product with new barcode
          await db.update(showcaseProducts)
            .set({ barcode: fullBarcode })
            .where(eq(showcaseProducts.id, product.id));
          
          results.push({
            id: product.id,
            name: product.name,
            type: 'showcase',
            oldBarcode: product.barcode,
            newBarcode: fullBarcode,
            formatted: `${countryCode}-${companyCode}-${productCode}-${checkDigit}`,
            success: true
          });
          
          console.log(`✓ Generated Iraq barcode for showcase product ${product.name}: ${fullBarcode}`);
        } catch (error) {
          console.error(`✗ Failed to generate barcode for showcase product ${product.name}:`, error);
          results.push({
            id: product.id,
            name: product.name,
            type: 'showcase',
            oldBarcode: product.barcode,
            error: error.message,
            success: false
          });
        }
      }
      
      // Process shop products
      for (const product of shopProductsData) {
        try {
          // Generate new barcode with Iraq format: 864-96771-XXXXX-C
          const countryCode = '864'; // Iraq
          const companyCode = '96771'; // Momtazchem
          const productCode = Math.floor(10000 + Math.random() * 90000).toString(); // 5-digit random
          const barcode12 = countryCode + companyCode + productCode;
          
          // Calculate check digit
          let oddSum = 0;
          let evenSum = 0;
          for (let i = 0; i < 12; i++) {
            const digit = parseInt(barcode12[i]);
            if (i % 2 === 0) {
              oddSum += digit;
            } else {
              evenSum += digit;
            }
          }
          const total = oddSum + (evenSum * 3);
          const checkDigit = (10 - (total % 10)) % 10;
          const fullBarcode = barcode12 + checkDigit.toString();
          
          // Update product with new barcode
          await db.update(shopProducts)
            .set({ barcode: fullBarcode })
            .where(eq(shopProducts.id, product.id));
          
          results.push({
            id: product.id,
            name: product.name,
            type: 'shop',
            oldBarcode: product.barcode,
            newBarcode: fullBarcode,
            formatted: `${countryCode}-${companyCode}-${productCode}-${checkDigit}`,
            success: true
          });
          
          console.log(`✓ Generated Iraq barcode for shop product ${product.name}: ${fullBarcode}`);
        } catch (error) {
          console.error(`✗ Failed to generate barcode for shop product ${product.name}:`, error);
          results.push({
            id: product.id,
            name: product.name,
            type: 'shop',
            oldBarcode: product.barcode,
            error: error.message,
            success: false
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const totalCount = results.length;
      
      console.log(`Iraq format barcode generation complete: ${successCount}/${totalCount} successful`);
      
      res.json({
        success: true,
        results,
        summary: `Generated Iraq format barcodes: ${successCount}/${totalCount} successful`,
        format: "864-96771-XXXXX-C (Iraq country code + Momtazchem company code + product code + check digit)"
      });
    } catch (error) {
      console.error("Error in Iraq format barcode generation:", error);
      res.status(500).json({
        success: false,
        message: "Error generating Iraq format barcodes",
        error: error.message
      });
    }
  });

  // Bulk barcode download endpoint
  app.get("/api/barcode/download-all", requireAuth, async (req: Request, res: Response) => {
    try {
      const { format = 'zip' } = req.query;
      
      // Get all products with barcodes from both tables
      const showcaseProductsWithBarcodes = await db
        .select({
          id: showcaseProducts.id,
          name: showcaseProducts.name,
          sku: showcaseProducts.sku,
          barcode: showcaseProducts.barcode,
          category: showcaseProducts.category,
          type: sql<string>`'showcase'`
        })
        .from(showcaseProducts)
        .where(and(
          isNotNull(showcaseProducts.barcode),
          sql`LENGTH(${showcaseProducts.barcode}) = 13`
        ));

      const shopProductsWithBarcodes = await db
        .select({
          id: shopProducts.id,
          name: shopProducts.name,
          sku: shopProducts.sku,
          barcode: shopProducts.barcode,
          category: shopProducts.category,
          type: sql<string>`'shop'`
        })
        .from(shopProducts)
        .where(and(
          isNotNull(shopProducts.barcode),
          sql`LENGTH(${shopProducts.barcode}) = 13`
        ));

      const allProducts = [...showcaseProductsWithBarcodes, ...shopProductsWithBarcodes];
      
      if (allProducts.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No products with valid EAN-13 barcodes found"
        });
      }

      if (format === 'csv') {
        // CSV format for bulk import into label printers
        const csvData = [
          'Name,SKU,Barcode,Category,Type',
          ...allProducts.map(p => 
            `"${p.name}","${p.sku || ''}","${p.barcode}","${p.category}","${p.type}"`
          )
        ].join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="all-barcodes.csv"');
        res.send(csvData);
      } else {
        // JSON format
        res.json({
          success: true,
          data: {
            totalProducts: allProducts.length,
            showcaseCount: showcaseProductsWithBarcodes.length,
            shopCount: shopProductsWithBarcodes.length,
            products: allProducts
          },
          exportedAt: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error("Error downloading all barcodes:", error);
      res.status(500).json({
        success: false,
        message: "Failed to download barcodes",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // AI-powered SKU generation endpoint
  app.post("/api/products/generate-sku", requireAuth, async (req: Request, res: Response) => {
    try {
      const productData = req.body;
      
      if (!productData.name || !productData.category) {
        return res.status(400).json({
          success: false,
          message: "Product name and category are required"
        });
      }

      console.log("Generating smart SKU for product:", productData.name);
      
      const skuResult = await generateSmartSKU(productData);
      
      // Check if SKU is unique in both showcase and shop products
      const existingShowcase = await db.select().from(showcaseProducts).where(eq(showcaseProducts.sku, skuResult.sku));
      const existingShop = await db.select().from(shopProducts).where(eq(shopProducts.sku, skuResult.sku));
      
      if (existingShowcase.length > 0 || existingShop.length > 0) {
        // If SKU exists, append a unique suffix
        const timestamp = Date.now().toString().slice(-4);
        skuResult.sku = `${skuResult.sku}-${timestamp}`;
        skuResult.reasoning += ` (Added unique suffix ${timestamp} to ensure uniqueness)`;
      }

      console.log("Generated SKU:", skuResult.sku);
      
      res.json({
        success: true,
        data: skuResult
      });
      
    } catch (error) {
      console.error("Error generating SKU:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate SKU",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // AI Test Connection endpoint
  app.post("/api/ai/test-connection", requireAuth, async (req: Request, res: Response) => {
    try {
      console.log("Testing OpenAI API connection...");
      
      // Simple test request to OpenAI
      const testResult = await generateSmartSKU({
        name: "Test Product",
        category: "commercial",
        description: "This is a test product for API validation"
      });

      console.log("OpenAI API test successful");
      
      res.json({
        success: true,
        model: "gpt-4o",
        status: "connected",
        testResult: testResult.sku
      });
      
    } catch (error) {
      console.error("OpenAI API test failed:", error);
      res.status(500).json({
        success: false,
        message: "Failed to connect to OpenAI API",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // =============================================================================
  // DEPARTMENT ORDER MANAGEMENT ENDPOINTS
  // =============================================================================

  // Finance Department - Get orders pending financial review
  app.get("/api/finance/orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement, customerOrders, orderItems, crmCustomers } = await import("../shared/order-management-schema");
      const { eq, inArray } = await import("drizzle-orm");

      // Get orders that need financial review (payment uploaded)
      const orders = await db
        .select({
          id: orderManagement.id,
          customerOrderId: orderManagement.customerOrderId,
          currentStatus: orderManagement.currentStatus,
          paymentReceiptUrl: orderManagement.paymentReceiptUrl,
          financialNotes: orderManagement.financialNotes,
          financialReviewedAt: orderManagement.financialReviewedAt,
          createdAt: orderManagement.createdAt,
          orderTotal: customerOrders.total,
          paymentMethod: customerOrders.paymentMethod,
          paymentGatewayId: customerOrders.paymentGatewayId,
          orderDate: customerOrders.createdAt,
          customerName: crmCustomers.firstName,
          customerLastName: crmCustomers.lastName,
          customerEmail: crmCustomers.email,
          customerPhone: crmCustomers.phone,
        })
        .from(orderManagement)
        .innerJoin(customerOrders, eq(orderManagement.customerOrderId, customerOrders.id))
        .innerJoin(crmCustomers, eq(customerOrders.customerId, crmCustomers.id))
        .where(inArray(orderManagement.currentStatus, ['payment_uploaded', 'financial_reviewing']))
        .orderBy(orderManagement.createdAt); // Oldest first

      // Get order items for each order
      const ordersWithItems = await Promise.all(orders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.customerOrderId));

        return {
          ...order,
          customerName: `${order.customerName} ${order.customerLastName}`,
          orderItems: items
        };
      }));

      res.json({ success: true, orders: ordersWithItems });
    } catch (error) {
      console.error("Error fetching finance orders:", error);
      res.status(500).json({
        success: false,
        message: "خطا در دریافت سفارشات مالی",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Finance Department - Approve payment
  app.post("/api/finance/orders/:orderId/approve", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement, orderStatusHistory } = await import("../shared/order-management-schema");
      const { eq } = await import("drizzle-orm");
      
      const orderId = parseInt(req.params.orderId);
      const { notes } = req.body;
      const adminId = req.session.adminId;

      // Update order status to financial_approved
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'financial_approved',
          financialReviewerId: adminId,
          financialReviewedAt: new Date(),
          financialNotes: notes
        })
        .where(eq(orderManagement.customerOrderId, orderId));

      // Add status history
      await db.insert(orderStatusHistory).values({
        orderManagementId: orderId,
        fromStatus: 'payment_uploaded',
        toStatus: 'financial_approved',
        changedBy: adminId,
        changedByDepartment: 'financial',
        notes: notes
      });

      res.json({ success: true, message: "پرداخت تایید شد" });
    } catch (error) {
      console.error("Error approving finance order:", error);
      res.status(500).json({
        success: false,
        message: "خطا در تایید پرداخت",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Finance Department - Reject payment
  app.post("/api/finance/orders/:orderId/reject", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement, orderStatusHistory } = await import("../shared/order-management-schema");
      const { eq } = await import("drizzle-orm");
      
      const orderId = parseInt(req.params.orderId);
      const { notes } = req.body;
      const adminId = req.session.adminId;

      // Update order status to financial_rejected
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'financial_rejected',
          financialReviewerId: adminId,
          financialReviewedAt: new Date(),
          financialNotes: notes
        })
        .where(eq(orderManagement.customerOrderId, orderId));

      // Add status history
      await db.insert(orderStatusHistory).values({
        orderManagementId: orderId,
        fromStatus: 'payment_uploaded',
        toStatus: 'financial_rejected',
        changedBy: adminId,
        changedByDepartment: 'financial',
        notes: notes
      });

      res.json({ success: true, message: "پرداخت رد شد" });
    } catch (error) {
      console.error("Error rejecting finance order:", error);
      res.status(500).json({
        success: false,
        message: "خطا در رد پرداخت",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Warehouse Department - Get orders approved by finance
  app.get("/api/warehouse/orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement, customerOrders, orderItems, crmCustomers } = await import("../shared/order-management-schema");
      const { eq, inArray } = await import("drizzle-orm");

      // Get orders approved by finance, pending warehouse processing
      const orders = await db
        .select({
          id: orderManagement.id,
          customerOrderId: orderManagement.customerOrderId,
          currentStatus: orderManagement.currentStatus,
          financialNotes: orderManagement.financialNotes,
          financialReviewedAt: orderManagement.financialReviewedAt,
          warehouseNotes: orderManagement.warehouseNotes,
          warehouseProcessedAt: orderManagement.warehouseProcessedAt,
          createdAt: orderManagement.createdAt,
          orderTotal: customerOrders.total,
          orderDate: customerOrders.createdAt,
          customerName: crmCustomers.firstName,
          customerLastName: crmCustomers.lastName,
          customerEmail: crmCustomers.email,
          customerPhone: crmCustomers.phone,
          customerAddress: crmCustomers.address,
        })
        .from(orderManagement)
        .innerJoin(customerOrders, eq(orderManagement.customerOrderId, customerOrders.id))
        .innerJoin(crmCustomers, eq(customerOrders.customerId, crmCustomers.id))
        .where(inArray(orderManagement.currentStatus, ['financial_approved', 'warehouse_processing']))
        .orderBy(orderManagement.financialReviewedAt); // Oldest approved first

      // Get order items for each order
      const ordersWithItems = await Promise.all(orders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.customerOrderId));

        return {
          ...order,
          customerName: `${order.customerName} ${order.customerLastName}`,
          orderItems: items
        };
      }));

      res.json({ success: true, orders: ordersWithItems });
    } catch (error) {
      console.error("Error fetching warehouse orders:", error);
      res.status(500).json({
        success: false,
        message: "خطا در دریافت سفارشات انبار",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Warehouse Department - Approve order (items ready)
  app.post("/api/warehouse/orders/:orderId/approve", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement, orderStatusHistory } = await import("../shared/order-management-schema");
      const { eq } = await import("drizzle-orm");
      
      const orderId = parseInt(req.params.orderId);
      const { notes } = req.body;
      const adminId = req.session.adminId;

      // Update order status to warehouse_approved
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'warehouse_approved',
          warehouseAssigneeId: adminId,
          warehouseProcessedAt: new Date(),
          warehouseNotes: notes
        })
        .where(eq(orderManagement.customerOrderId, orderId));

      // Add status history
      await db.insert(orderStatusHistory).values({
        orderManagementId: orderId,
        fromStatus: 'financial_approved',
        toStatus: 'warehouse_approved',
        changedBy: adminId,
        changedByDepartment: 'warehouse',
        notes: notes
      });

      res.json({ success: true, message: "کالا آماده شد" });
    } catch (error) {
      console.error("Error approving warehouse order:", error);
      res.status(500).json({
        success: false,
        message: "خطا در تایید انبار",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Warehouse Department - Reject order (out of stock)
  app.post("/api/warehouse/orders/:orderId/reject", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement, orderStatusHistory } = await import("../shared/order-management-schema");
      const { eq } = await import("drizzle-orm");
      
      const orderId = parseInt(req.params.orderId);
      const { notes } = req.body;
      const adminId = req.session.adminId;

      // Update order status to warehouse_rejected
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'warehouse_rejected',
          warehouseAssigneeId: adminId,
          warehouseProcessedAt: new Date(),
          warehouseNotes: notes
        })
        .where(eq(orderManagement.customerOrderId, orderId));

      // Add status history
      await db.insert(orderStatusHistory).values({
        orderManagementId: orderId,
        fromStatus: 'financial_approved',
        toStatus: 'warehouse_rejected',
        changedBy: adminId,
        changedByDepartment: 'warehouse',
        notes: notes
      });

      res.json({ success: true, message: "کالا موجود نیست" });
    } catch (error) {
      console.error("Error rejecting warehouse order:", error);
      res.status(500).json({
        success: false,
        message: "خطا در رد سفارش انبار",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Logistics Department - Get orders approved by warehouse
  app.get("/api/logistics/orders", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement, customerOrders, orderItems, crmCustomers } = await import("../shared/order-management-schema");
      const { eq, inArray } = await import("drizzle-orm");

      // Get orders approved by warehouse, pending logistics processing
      const orders = await db
        .select({
          id: orderManagement.id,
          customerOrderId: orderManagement.customerOrderId,
          currentStatus: orderManagement.currentStatus,
          warehouseNotes: orderManagement.warehouseNotes,
          warehouseProcessedAt: orderManagement.warehouseProcessedAt,
          logisticsNotes: orderManagement.logisticsNotes,
          logisticsProcessedAt: orderManagement.logisticsProcessedAt,
          deliveryCode: orderManagement.deliveryCode,
          trackingNumber: orderManagement.trackingNumber,
          deliveryPersonName: orderManagement.deliveryPersonName,
          deliveryPersonPhone: orderManagement.deliveryPersonPhone,
          estimatedDeliveryDate: orderManagement.estimatedDeliveryDate,
          createdAt: orderManagement.createdAt,
          orderTotal: customerOrders.total,
          orderDate: customerOrders.createdAt,
          customerName: crmCustomers.firstName,
          customerLastName: crmCustomers.lastName,
          customerEmail: crmCustomers.email,
          customerPhone: crmCustomers.phone,
          customerAddress: crmCustomers.address,
        })
        .from(orderManagement)
        .innerJoin(customerOrders, eq(orderManagement.customerOrderId, customerOrders.id))
        .innerJoin(crmCustomers, eq(customerOrders.customerId, crmCustomers.id))
        .where(inArray(orderManagement.currentStatus, ['warehouse_approved', 'logistics_processing', 'logistics_dispatched']))
        .orderBy(orderManagement.warehouseProcessedAt); // Oldest warehouse-approved first

      // Get order items for each order
      const ordersWithItems = await Promise.all(orders.map(async (order) => {
        const items = await db
          .select()
          .from(orderItems)
          .where(eq(orderItems.orderId, order.customerOrderId));

        return {
          ...order,
          customerName: `${order.customerName} ${order.customerLastName}`,
          orderItems: items
        };
      }));

      res.json({ success: true, orders: ordersWithItems });
    } catch (error) {
      console.error("Error fetching logistics orders:", error);
      res.status(500).json({
        success: false,
        message: "خطا در دریافت سفارشات لجستیک",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Logistics Department - Dispatch order (generate delivery code and send SMS)
  app.post("/api/logistics/orders/:orderId/dispatch", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement, orderStatusHistory } = await import("../shared/order-management-schema");
      const { eq } = await import("drizzle-orm");
      
      const orderId = parseInt(req.params.orderId);
      const { notes, trackingNumber, deliveryPersonName, deliveryPersonPhone, estimatedDeliveryDate } = req.body;
      const adminId = req.session.adminId;

      // Generate unique delivery code
      const deliveryCode = Math.random().toString(36).substr(2, 8).toUpperCase();

      // Update order status to logistics_dispatched
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'logistics_dispatched',
          logisticsAssigneeId: adminId,
          logisticsProcessedAt: new Date(),
          logisticsNotes: notes,
          deliveryCode: deliveryCode,
          trackingNumber: trackingNumber,
          deliveryPersonName: deliveryPersonName,
          deliveryPersonPhone: deliveryPersonPhone,
          estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null,
        })
        .where(eq(orderManagement.customerOrderId, orderId));

      // Add status history
      await db.insert(orderStatusHistory).values({
        orderManagementId: orderId,
        fromStatus: 'warehouse_approved',
        toStatus: 'logistics_dispatched',
        changedBy: adminId,
        changedByDepartment: 'logistics',
        notes: `${notes} | کد تحویل: ${deliveryCode} | تحویل‌دهنده: ${deliveryPersonName}`
      });

      // TODO: Send SMS to customer with delivery code
      console.log(`SMS should be sent to customer with delivery code: ${deliveryCode}`);

      res.json({ 
        success: true, 
        message: "سفارش ارسال شد",
        deliveryCode: deliveryCode
      });
    } catch (error) {
      console.error("Error dispatching logistics order:", error);
      res.status(500).json({
        success: false,
        message: "خطا در ارسال سفارش",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // =============================================================================
  // INTERNAL TRACKING SYSTEM ENDPOINTS
  // =============================================================================

  // Get tracking codes for a specific order
  app.get("/api/tracking/order/:orderId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { internalTrackingCodes } = await import("../shared/internal-tracking-schema");
      const { eq } = await import("drizzle-orm");

      const orderId = parseInt(req.params.orderId);

      const trackingCodes = await db
        .select()
        .from(internalTrackingCodes)
        .where(eq(internalTrackingCodes.orderId, orderId))
        .orderBy(internalTrackingCodes.createdAt);

      res.json({ success: true, trackingCodes });
    } catch (error) {
      console.error("Error fetching tracking codes:", error);
      res.status(500).json({
        success: false,
        message: "خطا در دریافت کدهای ردیابی",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate internal tracking codes for order items
  app.post("/api/tracking/generate/:orderId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { internalTrackingCodes } = await import("../shared/internal-tracking-schema");
      const { generateInternalBarcode } = await import("../shared/internal-tracking-schema");
      const { shopProducts, orderItems } = await import("../shared/shop-schema");
      const { eq } = await import("drizzle-orm");

      const orderId = parseInt(req.params.orderId);
      const adminId = req.session.adminId;

      // Get order items
      const items = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          productName: orderItems.productName,
          productSku: orderItems.productSku,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      if (items.length === 0) {
        return res.status(404).json({
          success: false,
          message: "آیتم‌های سفارش یافت نشد"
        });
      }

      // Generate tracking codes for each item
      const generatedCodes = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const internalBarcode = generateInternalBarcode(orderId, i + 1);

        const trackingCode = await db
          .insert(internalTrackingCodes)
          .values({
            orderId: orderId,
            orderItemId: item.id,
            internalBarcode: internalBarcode,
            productName: item.productName,
            productSku: item.productSku || undefined,
            quantity: item.quantity,
            currentLocation: 'warehouse_pending',
            currentDepartment: 'finance',
            assignedToFinance: adminId,
          })
          .returning();

        generatedCodes.push(trackingCode[0]);
      }

      res.json({ 
        success: true, 
        message: `${generatedCodes.length} کد ردیابی ایجاد شد`,
        trackingCodes: generatedCodes
      });
    } catch (error) {
      console.error("Error generating tracking codes:", error);
      res.status(500).json({
        success: false,
        message: "خطا در ایجاد کدهای ردیابی",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update tracking code status
  app.post("/api/tracking/:barcode/update", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { internalTrackingCodes, trackingHistory } = await import("../shared/internal-tracking-schema");
      const { eq } = await import("drizzle-orm");

      const barcode = req.params.barcode;
      const { location, department, notes, warehouseLocation } = req.body;
      const adminId = req.session.adminId;

      // Get current tracking code
      const currentCode = await db
        .select()
        .from(internalTrackingCodes)
        .where(eq(internalTrackingCodes.internalBarcode, barcode))
        .limit(1);

      if (currentCode.length === 0) {
        return res.status(404).json({
          success: false,
          message: "کد ردیابی یافت نشد"
        });
      }

      const current = currentCode[0];

      // Prepare update data
      const updateData: any = {
        currentLocation: location,
        currentDepartment: department,
      };

      // Add warehouse location if provided
      if (warehouseLocation) {
        updateData.warehouseLocation = warehouseLocation;
      }

      // Set timestamps based on department
      const now = new Date();
      if (department === 'finance') {
        updateData.financeProcessedAt = now;
        updateData.assignedToFinance = adminId;
      } else if (department === 'warehouse') {
        updateData.warehouseProcessedAt = now;
        updateData.assignedToWarehouse = adminId;
      } else if (department === 'logistics') {
        updateData.logisticsProcessedAt = now;
        updateData.assignedToLogistics = adminId;
      }

      // Update tracking code
      await db
        .update(internalTrackingCodes)
        .set(updateData)
        .where(eq(internalTrackingCodes.internalBarcode, barcode));

      // Add to tracking history
      await db.insert(trackingHistory).values({
        trackingCodeId: current.id,
        internalBarcode: barcode,
        fromLocation: current.currentLocation,
        toLocation: location,
        fromDepartment: current.currentDepartment,
        toDepartment: department,
        changedBy: adminId,
        changedByName: "Admin User", // TODO: Get actual admin name
        department: department,
        notes: notes,
      });

      res.json({ 
        success: true, 
        message: "وضعیت ردیابی به‌روزرسانی شد"
      });
    } catch (error) {
      console.error("Error updating tracking code:", error);
      res.status(500).json({
        success: false,
        message: "خطا در به‌روزرسانی وضعیت ردیابی",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Scan barcode
  app.post("/api/tracking/:barcode/scan", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { internalTrackingCodes, barcodeScanLogs } = await import("../shared/internal-tracking-schema");
      const { eq } = await import("drizzle-orm");

      const barcode = req.params.barcode;
      const { scanType, scanLocation, notes } = req.body;
      const adminId = req.session.adminId;

      // Check if barcode exists
      const trackingCode = await db
        .select()
        .from(internalTrackingCodes)
        .where(eq(internalTrackingCodes.internalBarcode, barcode))
        .limit(1);

      const scanResult = trackingCode.length > 0 ? 'success' : 'not_found';

      // Log scan
      await db.insert(barcodeScanLogs).values({
        internalBarcode: barcode,
        scannedBy: adminId,
        scannedByName: "Admin User", // TODO: Get actual admin name
        department: scanType.includes('warehouse') ? 'warehouse' : 
                   scanType.includes('logistics') ? 'logistics' : 'finance',
        scanType: scanType,
        scanLocation: scanLocation,
        scanResult: scanResult,
        notes: notes,
      });

      if (scanResult === 'not_found') {
        return res.status(404).json({
          success: false,
          message: "بارکد یافت نشد",
          scanResult: scanResult
        });
      }

      res.json({ 
        success: true, 
        message: "بارکد با موفقیت اسکن شد",
        trackingCode: trackingCode[0],
        scanResult: scanResult
      });
    } catch (error) {
      console.error("Error scanning barcode:", error);
      res.status(500).json({
        success: false,
        message: "خطا در اسکن بارکد",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get tracking history for a barcode
  app.get("/api/tracking/:barcode/history", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { trackingHistory, internalTrackingCodes } = await import("../shared/internal-tracking-schema");
      const { eq } = await import("drizzle-orm");

      const barcode = req.params.barcode;

      // Get tracking code details
      const trackingCode = await db
        .select()
        .from(internalTrackingCodes)
        .where(eq(internalTrackingCodes.internalBarcode, barcode))
        .limit(1);

      if (trackingCode.length === 0) {
        return res.status(404).json({
          success: false,
          message: "کد ردیابی یافت نشد"
        });
      }

      // Get history
      const history = await db
        .select()
        .from(trackingHistory)
        .where(eq(trackingHistory.internalBarcode, barcode))
        .orderBy(trackingHistory.createdAt);

      res.json({ 
        success: true, 
        trackingCode: trackingCode[0],
        history: history
      });
    } catch (error) {
      console.error("Error fetching tracking history:", error);
      res.status(500).json({
        success: false,
        message: "خطا در دریافت تاریخچه ردیابی",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
