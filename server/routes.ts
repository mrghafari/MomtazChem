import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { insertLeadSchema, insertLeadActivitySchema } from "@shared/schema";
import { insertContactSchema, insertShowcaseProductSchema } from "@shared/showcase-schema";
import { customerStorage } from "./customer-storage";
import { shopStorage } from "./shop-storage";
import { insertCustomerInquirySchema } from "@shared/customer-schema";
import { insertShopProductSchema, insertShopCategorySchema } from "@shared/shop-schema";
import { sendContactEmail } from "./email";
import { z } from "zod";

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
        error: error.message 
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

  // Product inquiry routes
  app.post("/api/inquiries", async (req, res) => {
    try {
      const inquiryData = insertCustomerInquirySchema.parse(req.body);
      const inquiry = await customerStorage.createInquiry(inquiryData);
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

  app.get("/api/inquiries", requireAuth, async (req, res) => {
    try {
      const inquiries = await customerStorage.getAllInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  app.get("/api/inquiries/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid inquiry ID" 
        });
      }

      const inquiry = await customerStorage.getInquiryById(id);
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
        message: "Internal server error" 
      });
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
      const inquiry = await customerStorage.updateInquiry(id, updates);
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

  const httpServer = createServer(app);
  return httpServer;
}
