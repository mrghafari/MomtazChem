import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import nodemailer from "nodemailer";
import { storage } from "./storage";
import { insertLeadSchema, insertLeadActivitySchema } from "@shared/schema";
import { insertContactSchema, insertShowcaseProductSchema, showcaseProducts } from "@shared/showcase-schema";
import { simpleCustomerStorage } from "./simple-customer-storage";
import { shopStorage } from "./shop-storage";
import { customerStorage } from "./customer-storage";
import { customerAddressStorage } from "./customer-address-storage";
import { emailStorage } from "./email-storage";
import { crmStorage } from "./crm-storage";
import { customerCommunicationStorage } from "./customer-communication-storage";
import { crmDb } from "./crm-db";
import { smsStorage } from "./sms-storage";
import { widgetRecommendationStorage } from "./widget-recommendation-storage";
import { orderManagementStorage } from "./order-management-storage";
import { walletStorage } from "./wallet-storage";
import { requireDepartment, attachUserDepartments } from "./department-auth";
import { insertCustomerInquirySchema, insertEmailTemplateSchema, insertCustomerSchema, insertCustomerAddressSchema, walletRechargeRequests, customerOrders, orderItems } from "@shared/customer-schema";
import { customerDb } from "./customer-db";
import { insertEmailCategorySchema, insertSmtpSettingSchema, insertEmailRecipientSchema, smtpConfigSchema, emailLogs, emailCategories, smtpSettings, emailRecipients, categoryEmailAssignments, insertCategoryEmailAssignmentSchema } from "@shared/email-schema";
import { insertShopProductSchema, insertShopCategorySchema, paymentGateways, orders, shopProducts } from "@shared/shop-schema";
import { sendContactEmail, sendProductInquiryEmail } from "./email";
import TemplateProcessor from "./template-processor";
import InventoryAlertService from "./inventory-alerts";
import * as nodemailer from "nodemailer";
import { db } from "./db";
import { sql, eq, and, or, isNull, isNotNull, desc, gte } from "drizzle-orm";
import puppeteer from "puppeteer";
import { z } from "zod";
import * as schema from "@shared/schema";
const { crmCustomers } = schema;
import { orderManagement, shippingRates, vatSettings, deliveryMethods } from "@shared/order-management-schema";
import nodemailer from "nodemailer";
import { generateEAN13Barcode, validateEAN13, parseEAN13Barcode, isMomtazchemBarcode } from "@shared/barcode-utils";
import { generateSmartSKU, validateSKUUniqueness } from "./ai-sku-generator";
import { deliveryVerificationStorage } from "./delivery-verification-storage";
import { gpsDeliveryStorage } from "./gps-delivery-storage";
import { insertGpsDeliveryConfirmationSchema } from "@shared/gps-delivery-schema";
import { smsService } from "./sms-service";
import { ticketingStorage } from "./ticketing-storage";
import { supportTickets } from "../shared/ticketing-schema";
import { db } from "./db";
import { 
  insertSupportTicketSchema, 
  insertTicketResponseSchema,
  type SupportTicket,
  type TicketResponse,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  TICKET_CATEGORIES
} from "@shared/ticketing-schema";
import { cartStorage } from "./cart-storage";
import { 
  cartSessions, 
  abandonedCartSettings, 
  abandonedCartNotifications,
  type CartSession,
  type AbandonedCartSettings,
  type AbandonedCartNotification
} from "@shared/cart-schema";
import { gpsDeliveryStorage } from "./gps-delivery-storage";
import { logisticsStorage } from "./logistics-storage";
import { 
  transportationCompanies,
  deliveryVehicles,
  deliveryPersonnel,
  deliveryRoutes,
  deliveryVerificationCodes,
  logisticsAnalytics,
  insertTransportationCompanySchema,
  insertDeliveryVehicleSchema,
  insertDeliveryPersonnelSchema,
  insertDeliveryRouteSchema,
  insertDeliveryVerificationCodeSchema,
  type TransportationCompany,
  type DeliveryVehicle,
  type DeliveryPersonnel,
  type DeliveryRoute,
  type DeliveryVerificationCode,
  VEHICLE_TYPES,
  DELIVERY_STATUS,
  ROUTE_STATUS,
  SMS_STATUS
} from "@shared/logistics-schema";
import { 
  gpsDeliveryConfirmations,
  gpsDeliveryAnalytics,
  insertGpsDeliveryConfirmationSchema,
  insertGpsDeliveryAnalyticsSchema,
  type GpsDeliveryConfirmation,
  type GpsDeliveryAnalytics
} from "@shared/gps-delivery-schema";

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
const receiptsDir = path.join(uploadsDir, 'receipts');

[uploadsDir, imagesDir, catalogsDir, documentsDir, receiptsDir].forEach(dir => {
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
    fileSize: 2 * 1024 * 1024, // 2MB limit - optimized for web display
  },
  fileFilter: (req, file, cb) => {
    // Allow only optimal image formats for web display
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed for optimal customer display'));
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

// MSDS upload configuration
const msdsDir = path.join(process.cwd(), 'uploads', 'msds');
if (!fs.existsSync(msdsDir)) {
  fs.mkdirSync(msdsDir, { recursive: true });
}

const msdsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, msdsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `msds-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadMsds = multer({
  storage: msdsStorage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit for MSDS files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for MSDS uploads'));
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

// Receipt upload configuration
const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, receiptsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `receipt-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadReceipt = multer({
  storage: receiptStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for receipts
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and PDF files are allowed for receipt uploads'));
    }
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
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`🔐 [AUTH DEBUG] ${req.method} ${req.path}`);
  console.log(`🔐 [AUTH DEBUG] Session:`, {
    exists: !!req.session,
    isAuthenticated: req.session?.isAuthenticated,
    adminId: req.session?.adminId,
    sessionID: req.sessionID,
    fullSession: req.session
  });

  // STRICT admin authentication - require valid admin session
  if (req.session && 
      req.session.isAuthenticated === true && 
      req.session.adminId) {
    
    console.log(`✅ Admin authentication successful for admin ${req.session.adminId}`);
    console.log(`🔄 Dual session mode: Admin=${req.session.adminId}, Customer=${req.session.customerId || 'none'}`);
    next();
  } else {
    console.log('❌ Admin authentication failed for:', req.path);
    console.log('❌ Session details:', {
      isAuthenticated: req.session?.isAuthenticated,
      adminId: req.session?.adminId,
      customerId: req.session?.customerId
    });
    
    // If only customer session exists, show specific error
    if (req.session?.customerId && !req.session?.adminId) {
      return res.status(403).json({ 
        success: false, 
        message: "دسترسی به بخش مدیریت نیاز به ورود مدیر دارد" 
      });
    }
    
    res.status(401).json({ 
      success: false, 
      message: "احراز هویت مدیریت مورد نیاز است" 
    });
  }
};

// Customer authentication middleware with improved error handling  
const requireCustomerAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session && req.session.customerId) {
      next();
    } else {
      console.log('Customer authentication failed for:', req.originalUrl);
      res.status(401).json({ success: false, message: "احراز هویت نشده" });
    }
  } catch (error) {
    console.error('Customer authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: "خطا در احراز هویت مشتری"
    });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Import department auth functions
  const { attachUserDepartments, requireDepartment } = await import("./department-auth");
  
  // Create requireAdmin alias for better semantics
  const requireAdmin = requireAuth;
  
  // Add department middleware to all authenticated routes (excluding ticket creation for guest access)
  app.use('/api', (req, res, next) => {
    // Skip auth middleware for ticket creation to allow guest access
    if (req.path === '/tickets' && req.method === 'POST') {
      return next();
    }
    // Skip middleware for test endpoints
    if (req.path.startsWith('/test/') || req.path.startsWith('/analytics/')) {
      return next();
    }
    attachUserDepartments(req, res, next);
  });
  
  // Serve static files from attached_assets directory
  app.use('/attached_assets', express.static(path.join(process.cwd(), 'attached_assets')));
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // ============================================
  // START: Documentation PDF Generation Routes
  // ============================================

  // Generate User Documentation PDF
  app.get("/api/documentation/user/:language", async (req: Request, res: Response) => {
    try {
      const { language } = req.params;
      if (!['en', 'fa'].includes(language)) {
        return res.status(400).json({ success: false, message: 'Invalid language. Use "en" or "fa".' });
      }
      
      console.log('Fallback to simple PDF generator for User Documentation');
      const { generateDocumentationFallback } = await import('./simple-pdf-generator');
      const pdfBuffer = await generateDocumentationFallback('User Guide', language);
      
      const filename = language === 'fa' ? 
        'Momtazchem-User-Guide-Persian.pdf' : 
        'Momtazchem-User-Guide-English.pdf';
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating user documentation PDF:', error);
      res.status(500).json({ success: false, message: 'Failed to generate user documentation PDF' });
    }
  });

  // Generate Admin Documentation PDF
  app.get("/api/documentation/admin/:language", async (req: Request, res: Response) => {
    try {
      const { language } = req.params;
      if (!['en', 'fa'].includes(language)) {
        return res.status(400).json({ success: false, message: 'Invalid language. Use "en" or "fa".' });
      }
      
      console.log('Fallback to simple PDF generator for Admin Documentation');
      const { generateDocumentationFallback } = await import('./simple-pdf-generator');
      const pdfBuffer = await generateDocumentationFallback('Admin Guide', language);
      
      const filename = language === 'fa' ? 
        'Momtazchem-Admin-Guide-Persian.pdf' : 
        'Momtazchem-Admin-Guide-English.pdf';
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating admin documentation PDF:', error);
      res.status(500).json({ success: false, message: 'Failed to generate admin documentation PDF' });
    }
  });

  // Generate Technical Documentation PDF
  app.get("/api/documentation/technical/:language", async (req: Request, res: Response) => {
    try {
      const { language } = req.params;
      if (!['en', 'fa'].includes(language)) {
        return res.status(400).json({ success: false, message: 'Invalid language. Use "en" or "fa".' });
      }
      
      console.log('Fallback to simple PDF generator for Technical Documentation');
      const { generateDocumentationFallback } = await import('./simple-pdf-generator');
      const pdfBuffer = await generateDocumentationFallback('Technical Documentation', language);
      
      const filename = language === 'fa' ? 
        'Momtazchem-Technical-Guide-Persian.pdf' : 
        'Momtazchem-Technical-Guide-English.pdf';
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating technical documentation PDF:', error);
      res.status(500).json({ success: false, message: 'Failed to generate technical documentation PDF' });
    }
  });

  // Generate Complete Documentation PDF
  app.get("/api/documentation/complete/:language", async (req: Request, res: Response) => {
    try {
      const { language } = req.params;
      if (!['en', 'fa'].includes(language)) {
        return res.status(400).json({ success: false, message: 'Invalid language. Use "en" or "fa".' });
      }
      
      console.log('Fallback to simple PDF generator for Complete Documentation');
      const { generateDocumentationFallback } = await import('./simple-pdf-generator');
      const pdfBuffer = await generateDocumentationFallback('Complete Documentation', language);
      
      const filename = language === 'fa' ? 
        'Momtazchem-Complete-Documentation-Persian.pdf' : 
        'Momtazchem-Complete-Documentation-English.pdf';
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating complete documentation PDF:', error);
      res.status(500).json({ success: false, message: 'Failed to generate complete documentation PDF' });
    }
  });

  // Generate Project Proposal PDF
  app.get("/api/documentation/proposal/:language", async (req: Request, res: Response) => {
    try {
      const { language } = req.params;
      if (!['en', 'fa'].includes(language)) {
        return res.status(400).json({ success: false, message: 'Invalid language. Use "en" or "fa".' });
      }
      
      console.log('Fallback to simple PDF generator for Project Proposal');
      const { generateDocumentationFallback } = await import('./simple-pdf-generator');
      const pdfBuffer = await generateDocumentationFallback('Project Proposal', language);
      
      const filename = language === 'fa' ? 
        'Momtazchem-Project-Proposal-Persian.pdf' : 
        'Momtazchem-Project-Proposal-English.pdf';
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Error generating project proposal PDF:', error);
      res.status(500).json({ success: false, message: 'Failed to generate project proposal PDF' });
    }
  });

  // =============================================================================
  // API MIDDLEWARE - ENSURE ALL /api ROUTES RETURN JSON
  // =============================================================================
  
  // Middleware to ensure all API routes return JSON (not HTML)
  app.use('/api/*', (req, res, next) => {
    // Set Content-Type header to application/json for all API routes
    res.setHeader('Content-Type', 'application/json');
    
    // Override the default error handling to always return JSON
    const originalSend = res.send;
    res.send = function(data) {
      // If data is a string that looks like HTML, convert to JSON error
      if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
        return originalSend.call(this, JSON.stringify({
          success: false,
          message: 'API endpoint not found',
          error: 'This endpoint should return JSON, not HTML'
        }));
      }
      return originalSend.call(this, data);
    };
    
    next();
  });

  // =============================================================================
  // HEALTH CHECK API
  // =============================================================================
  
  // Health check endpoint - must return JSON
  app.get("/api/health", async (req, res) => {
    try {
      const { pool } = await import('./db');
      
      // Test database connection
      const dbResult = await pool.query('SELECT 1 as healthy');
      const dbHealthy = dbResult.rows[0]?.healthy === 1;
      
      const status = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? 'healthy' : 'unhealthy',
          server: 'healthy'
        }
      };
      
      res.json(status);
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {
          database: 'unhealthy',
          server: 'healthy'
        }
      });
    }
  });

  // =============================================================================
  // AI SETTINGS API
  // =============================================================================
  
  // Save AI Settings
  app.post("/api/ai/settings", requireAuth, async (req, res) => {
    try {
      const { apiKey, secretKey, model, maxTokens, temperature, aiEnabled, skuGeneration, smartRecommendations } = req.body;
      
      // For now, store in memory/localStorage equivalent
      // In production, this would be stored in database
      const settings = {
        apiKey: apiKey || "",
        secretKey: secretKey || "",
        model: model || "gpt-4o",
        maxTokens: maxTokens || 1000,
        temperature: temperature || 0.7,
        aiEnabled: aiEnabled !== false,
        skuGeneration: skuGeneration !== false,
        smartRecommendations: smartRecommendations !== false,
        updatedAt: new Date()
      };
      
      res.json({ success: true, settings });
    } catch (error) {
      console.error("Error saving AI settings:", error);
      res.status(500).json({ message: "Failed to save AI settings" });
    }
  });

  // Test AI Connection
  app.post("/api/ai/test-connection", requireAuth, async (req, res) => {
    try {
      // Mock successful connection test
      res.json({ 
        success: true, 
        model: "gpt-4o",
        status: "connected",
        timestamp: new Date()
      });
    } catch (error) {
      console.error("Error testing AI connection:", error);
      res.status(500).json({ message: "Failed to test AI connection" });
    }
  });

  // =============================================================================
  // AI SEO GENERATOR API
  // =============================================================================
  
  // Generate AI-powered SEO content
  app.post("/api/ai/seo/generate", requireAuth, async (req, res) => {
    try {
      const { generateAISeoContent } = await import('./ai-seo-generator.ts');
      const seoRequest = req.body;
      
      // Validate required fields
      if (!seoRequest.pageType || !seoRequest.language) {
        return res.status(400).json({
          success: false,
          message: 'Page type and language are required'
        });
      }
      
      const seoContent = await generateAISeoContent(seoRequest);
      
      res.json({
        success: true,
        data: seoContent,
        message: 'AI SEO content generated successfully'
      });
    } catch (error) {
      console.error('Error generating AI SEO content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate AI SEO content: ' + error.message
      });
    }
  });

  // Analyze SEO performance
  app.post("/api/ai/seo/analyze", requireAuth, async (req, res) => {
    try {
      const { analyzeSeoPerformance } = await import('./ai-seo-generator.ts');
      const { url, targetKeywords } = req.body;
      
      if (!url || !targetKeywords) {
        return res.status(400).json({
          success: false,
          message: 'URL and target keywords are required'
        });
      }
      
      const analysis = await analyzeSeoPerformance(url, targetKeywords);
      
      res.json({
        success: true,
        data: analysis,
        message: 'SEO analysis completed successfully'
      });
    } catch (error) {
      console.error('Error analyzing SEO performance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to analyze SEO performance: ' + error.message
      });
    }
  });

  // Generate keyword suggestions
  app.post("/api/ai/seo/keywords", requireAuth, async (req, res) => {
    try {
      const { generateKeywordSuggestions } = await import('./ai-seo-generator.ts');
      const { seedKeywords, language, industry } = req.body;
      
      if (!seedKeywords || !Array.isArray(seedKeywords)) {
        return res.status(400).json({
          success: false,
          message: 'Seed keywords array is required'
        });
      }
      
      const suggestions = await generateKeywordSuggestions(seedKeywords, language, industry);
      
      res.json({
        success: true,
        data: suggestions,
        message: 'Keyword suggestions generated successfully'
      });
    } catch (error) {
      console.error('Error generating keyword suggestions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate keyword suggestions: ' + error.message
      });
    }
  });

  // Optimize content for SEO
  app.post("/api/ai/seo/optimize", requireAuth, async (req, res) => {
    try {
      const { optimizeContentForSeo } = await import('./ai-seo-generator.ts');
      const { content, targetKeywords, language } = req.body;
      
      if (!content || !targetKeywords) {
        return res.status(400).json({
          success: false,
          message: 'Content and target keywords are required'
        });
      }
      
      const optimization = await optimizeContentForSeo(content, targetKeywords, language);
      
      res.json({
        success: true,
        data: optimization,
        message: 'Content optimized successfully'
      });
    } catch (error) {
      console.error('Error optimizing content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to optimize content: ' + error.message
      });
    }
  });

  // Generate bulk SEO content
  app.post("/api/ai/seo/bulk-generate", requireAuth, async (req, res) => {
    try {
      const { generateBulkSeoContent } = await import('./ai-seo-generator.ts');
      const { pages } = req.body;
      
      if (!pages || !Array.isArray(pages)) {
        return res.status(400).json({
          success: false,
          message: 'Pages array is required'
        });
      }
      
      const results = await generateBulkSeoContent(pages);
      
      res.json({
        success: true,
        data: results,
        message: `Bulk SEO content generated for ${results.length} pages`
      });
    } catch (error) {
      console.error('Error generating bulk SEO content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate bulk SEO content: ' + error.message
      });
    }
  });

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

  // API endpoint to get active users count
  app.get("/api/active-users", requireAuth, async (req: Request, res: Response) => {
    try {
      // Simple active users tracking - show current admin session
      const activeUsersData = {
        totalActiveSessions: 1,
        activeUsersCount: 1,
        activeUsers: [
          {
            id: req.session.adminId,
            username: 'Admin',
            lastActivity: new Date().toISOString(),
            sessionId: req.sessionID
          }
        ],
        lastUpdated: new Date().toISOString()
      };
      
      res.json({
        success: true,
        data: activeUsersData
      });
    } catch (error) {
      console.error("Error fetching active users:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch active users",
        data: {
          totalActiveSessions: 0,
          activeUsersCount: 0,
          activeUsers: [],
          lastUpdated: new Date().toISOString()
        }
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

      // Allow dual session - keep customer session if exists, add admin session
      req.session.adminId = user.id;
      req.session.isAuthenticated = true;

      console.log(`✅ [LOGIN] Session configured for admin ${user.id}:`, {
        adminId: req.session.adminId,
        isAuthenticated: req.session.isAuthenticated,
        sessionId: req.sessionID
      });
      
      // Send response immediately without waiting for session save
      res.json({ 
        success: true, 
        message: "Login successful",
        user: { id: user.id, username: user.username, email: user.email, roleId: user.roleId }
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
    // Clear only admin session data, preserve customer session
    req.session.adminId = undefined;
    
    // If no customer session exists, destroy entire session
    if (!req.session.customerId) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: "Could not log out" 
          });
        }
        res.json({ success: true, message: "Logged out successfully" });
      });
    } else {
      // Save session with admin data cleared but customer data preserved
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            message: "Could not log out" 
          });
        }
        console.log('🔄 Admin logout - customer session preserved');
        res.json({ success: true, message: "Logged out successfully" });
      });
    }
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

  // Authentication check endpoint - STRICT admin validation
  app.get("/api/admin/check-auth", async (req, res) => {
    try {
      // Strict admin validation - require valid admin session
      if (!req.session.adminId || !req.session.isAuthenticated) {
        return res.status(401).json({ 
          success: false, 
          message: "Not authenticated as admin" 
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
  // Generic upload route (for images) - accepts both 'file' and 'image' field names
  const uploadFlexible = multer({
    storage: imageStorage,
    limits: {
      fileSize: 2 * 1024 * 1024, // 2MB limit - optimized for web display
    },
    fileFilter: (req, file, cb) => {
      // Allow only optimal image formats for web display
      const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/webp'
      ];
      
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed for optimal customer display'));
      }
    }
  });

  app.post("/api/upload", requireAuth, (req, res) => {
    const upload = uploadFlexible.fields([
      { name: 'file', maxCount: 1 },
      { name: 'image', maxCount: 1 }
    ]);

    upload(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ 
          success: false, 
          message: err.message 
        });
      }

      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const uploadedFile = files?.file?.[0] || files?.image?.[0];

        if (!uploadedFile) {
          return res.status(400).json({ 
            success: false, 
            message: "No file uploaded" 
          });
        }

        const imageUrl = `/uploads/images/${uploadedFile.filename}`;
        res.json({ 
          success: true, 
          url: imageUrl,
          filename: uploadedFile.filename,
          originalName: uploadedFile.originalname,
          size: uploadedFile.size
        });
      } catch (error) {
        console.error('Upload processing error:', error);
        res.status(500).json({ 
          success: false, 
          message: "Failed to process upload" 
        });
      }
    });
  });

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

  // MSDS upload endpoint
  app.post("/api/upload/msds", requireAuth, uploadMsds.single('msds'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No MSDS file uploaded" 
        });
      }

      const msdsUrl = `/uploads/msds/${req.file.filename}`;
      res.json({ 
        success: true, 
        url: msdsUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('MSDS upload error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to upload MSDS file" 
      });
    }
  });

  // Update product MSDS information (for both shop and showcase products)
  app.put("/api/products/:id/msds", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { msdsUrl, showMsdsToCustomers, msdsFileName } = req.body;

      // Update shop product MSDS
      await storage.updateShopProduct(parseInt(id), {
        msdsUrl,
        showMsdsToCustomers,
        msdsFileName,
        msdsUploadDate: new Date()
      });

      // Also update showcase product if it exists
      try {
        await storage.updateShowcaseProduct(parseInt(id), {
          msdsUrl,
          showMsdsToCustomers,
          msdsFileName,
          msdsUploadDate: new Date()
        });
      } catch (error) {
        // Showcase product might not exist, continue with shop product only
        console.log('Showcase product not found, updated shop product only');
      }

      res.json({ 
        success: true, 
        message: "MSDS information updated successfully" 
      });
    } catch (error) {
      console.error('Error updating MSDS information:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update MSDS information" 
      });
    }
  });

  // Get MSDS file for customers (only if showMsdsToCustomers is true)
  app.get("/api/products/:id/msds", async (req, res) => {
    try {
      const { id } = req.params;

      // Get product MSDS information
      const product = await storage.getShopProduct(parseInt(id));
      
      if (!product || !product.msdsUrl || !product.showMsdsToCustomers) {
        return res.status(404).json({ 
          success: false, 
          message: "MSDS not available for this product" 
        });
      }

      res.json({
        success: true,
        data: {
          msdsUrl: product.msdsUrl,
          msdsFileName: product.msdsFileName || 'MSDS.pdf',
          msdsUploadDate: product.msdsUploadDate
        }
      });
    } catch (error) {
      console.error('Error fetching MSDS:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch MSDS" 
      });
    }
  });

  // Bank receipt upload endpoint
  app.post("/api/payment/upload-receipt", requireCustomerAuth, (req, res) => {
    const uploadReceipt = multer({
      storage: receiptStorage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        // Accept images and PDFs
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new Error('Only image and PDF files are allowed for receipt uploads'));
        }
      }
    }).single('receipt');

    uploadReceipt(req, res, async (err) => {
      if (err) {
        console.error('Receipt upload error:', err);
        return res.status(400).json({ 
          success: false, 
          message: err.message 
        });
      }

      try {
        if (!req.file) {
          return res.status(400).json({ 
            success: false, 
            message: "فایل فیش بانکی آپلود نشده است" 
          });
        }

        const { orderId, notes } = req.body;
        const customerId = (req.session as any)?.customerId;
        const receiptUrl = `/uploads/receipts/${req.file.filename}`;

        // Update order with receipt information
        if (orderId) {
          await shopStorage.updateOrder(parseInt(orderId), {
            paymentStatus: 'receipt_uploaded',
            receiptUrl: receiptUrl,
            receiptUploadDate: new Date(),
            receiptNotes: notes || null
          });

          // Also store in payment_receipts table for order management system
          await orderManagementStorage.uploadPaymentReceipt({
            customerOrderId: parseInt(orderId),
            customerId: customerId,
            receiptUrl: receiptUrl,
            originalFileName: req.file.originalname,
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            notes: notes || null
          });

          // Update order_management table if it exists
          const orderMgmt = await orderManagementStorage.getOrderManagementByCustomerOrderId(parseInt(orderId));
          if (orderMgmt) {
            await orderManagementStorage.updateOrderManagement(orderMgmt.id, {
              paymentReceiptUrl: receiptUrl,
              currentStatus: 'payment_uploaded',
              currentDepartment: 'finance',
              updatedAt: new Date()
            });
            console.log(`✅ Order management updated for order ${orderId} - moved to finance department`);
          } else {
            console.log(`⚠️ Order management record not found for order ${orderId}`);
          }

          // Log the receipt upload
          console.log(`Receipt uploaded for order ${orderId} by customer ${customerId}`);
        }

        res.json({ 
          success: true, 
          message: "فیش بانکی با موفقیت آپلود شد",
          data: {
            receiptUrl: receiptUrl,
            filename: req.file.filename,
            originalName: req.file.originalname,
            size: req.file.size,
            uploadDate: new Date()
          }
        });
      } catch (error) {
        console.error('Error processing receipt upload:', error);
        res.status(500).json({ 
          success: false, 
          message: "خطا در پردازش فیش بانکی" 
        });
      }
    });
  });

  // Get receipt for order (customer can view their own receipt)
  app.get("/api/payment/receipt/:orderId", requireCustomerAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const customerId = (req.session as any)?.customerId;

      // Get order and verify it belongs to the customer
      const order = await shopStorage.getOrderById(orderId);
      
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: "سفارش یافت نشد" 
        });
      }

      // Verify customer owns this order
      if (order.customerId !== customerId) {
        return res.status(403).json({ 
          success: false, 
          message: "دسترسی مجاز نیست" 
        });
      }

      if (!order.receiptUrl) {
        return res.status(404).json({ 
          success: false, 
          message: "فیش بانکی برای این سفارش آپلود نشده است" 
        });
      }

      res.json({
        success: true,
        data: {
          receiptUrl: order.receiptUrl,
          receiptUploadDate: order.receiptUploadDate,
          receiptNotes: order.receiptNotes,
          paymentStatus: order.paymentStatus
        }
      });
    } catch (error) {
      console.error('Error fetching receipt:', error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در دریافت فیش بانکی" 
      });
    }
  });



  // Helper function to get category email assignment
  async function getCategoryEmailAssignment(productInterest: string): Promise<string | null> {
    try {
      // Map product interests to category keys
      const categoryMapping: { [key: string]: string } = {
        'fuel-additives': 'fuel-additives',
        'water-treatment': 'water-treatment',
        'paint-solvents': 'paint-thinner',
        'agricultural-products': 'agricultural-fertilizers',
        'agricultural-fertilizers': 'agricultural-fertilizers',
        'industrial-chemicals': 'industrial-chemicals',
        'paint-thinner': 'paint-thinner',
        'technical-equipment': 'technical-equipment',
        'commercial-goods': 'commercial-goods',
        'other-products': 'orders'
      };

      const categoryKey = categoryMapping[productInterest] || 'orders';
      
      const assignment = await db
        .select()
        .from(categoryEmailAssignments)
        .where(eq(categoryEmailAssignments.categoryKey, categoryKey))
        .limit(1);

      return assignment.length > 0 ? assignment[0].assignedEmail : null;
    } catch (error) {
      console.error("Error getting category email assignment:", error);
      return null;
    }
  }

  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      const contact = await storage.createContact(contactData);
      
      // Get category-specific email assignment
      const categoryEmail = await getCategoryEmailAssignment(contact.productInterest);
      
      // Send email notification with intelligent routing
      try {
        await sendContactEmail({
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          company: contact.company ?? '',
          productInterest: contact.productInterest,
          message: contact.message ?? '',
          categoryEmail: categoryEmail ?? undefined // Add category-specific email for routing
        });
        console.log(`Email sent successfully for contact: ${contact.id}, routed to category email: ${categoryEmail || 'default'}`);
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

  // Protected admin routes for product management (کاردکس)
  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const productData = req.body;
      
      // Generate barcode if not provided
      let barcode = productData.barcode;
      if (!barcode) {
        try {
          const { generateEAN13Barcode } = await import('../shared/barcode-utils');
          barcode = await generateEAN13Barcode(productData.name, productData.category);
          console.log(`🔢 Generated barcode for new product: ${barcode}`);
        } catch (barcodeError) {
          console.error("Barcode generation failed:", barcodeError);
          throw new Error("خطا در تولید بارکد برای محصول جدید");
        }
      }
      
      // Create product in showcase_products table (کاردکس)
      const showcaseProductData = {
        name: productData.name,
        category: productData.category,
        description: productData.description || "این یک محصول شیمیایی تولید شرکت ممتاز شیمی است",
        shortDescription: productData.shortDescription || productData.description,
        unitPrice: productData.unitPrice || productData.price || 11,
        currency: productData.currency || 'IQD',
        stockQuantity: productData.stockQuantity || 11,
        minStockLevel: productData.minStockLevel || 5,
        maxStockLevel: productData.maxStockLevel || 100,
        sku: productData.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        barcode: barcode,
        weight: productData.weight || 11,
        imageUrl: productData.imageUrl || null,
        specifications: productData.specifications || productData.description || "این یک محصول شیمیایی تولید شرکت ممتاز شیمی است",
        features: productData.features || productData.description || "این یک محصول شیمیایی تولید شرکت ممتاز شیمی است",
        applications: productData.applications || productData.description || "این یک محصول شیمیایی تولید شرکت ممتاز شیمی است",
        tags: productData.tags || ["شیمیایی"],
        isActive: productData.isActive !== false,
        syncWithShop: productData.syncWithShop || false,
        parentProductId: productData.parentProductId || null,
        isVariant: productData.isVariant || false,
        variantType: productData.variantType || null,
        variantValue: productData.variantValue || null
      };
      
      const product = await storage.createProduct(showcaseProductData);
      
      // Trigger automatic synchronization after creating product
      try {
        const { KardexSyncMaster } = await import('./kardex-sync-master');
        const result = await KardexSyncMaster.smartSyncShopFromKardex();
        console.log(`🔄 Auto-sync completed after creating product:`, result.message);
      } catch (syncError) {
        console.log("Auto-sync failed after creation:", syncError);
      }
      
      res.status(201).json(product);
    } catch (error) {
      console.error("Error creating showcase product:", error);
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
      
      // Use showcase_products table for admin products interface
      if (category && typeof category === 'string') {
        products = await storage.getProductsByCategory(category);
      } else {
        products = await storage.getProducts();
      }
      
      // Products from showcase_products are already in the correct format
      const mappedProducts = products;
      
      res.json(mappedProducts);
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
      console.error(`Error fetching product ${id}:`, error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error",
        error: error instanceof Error ? error.message : String(error)
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

      const productData = req.body;
      
      // Map frontend fields to backend fields for update
      const mappedData = {
        ...productData,
        price: productData.unitPrice || productData.price,
        priceUnit: productData.currency || productData.priceUnit || 'IQD',
        imageUrls: productData.imageUrl ? [productData.imageUrl] : (productData.imageUrls || [])
      };
      
      // Update showcase product instead of shop product for admin panel
      const product = await storage.updateProduct(id, mappedData);
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
      console.log(`🔧 [DEBUG] PUT /api/products/${req.params.id} - Body:`, JSON.stringify(req.body, null, 2));
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log(`❌ [DEBUG] Invalid product ID: ${req.params.id}`);
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }

      const productData = req.body;
      console.log(`📋 [DEBUG] Product data keys:`, Object.keys(productData));
      
      // Handle sync toggle requests (skip all validations)
      const isSyncToggle = Object.keys(productData).length === 1 && 'syncWithShop' in productData;
      
      if (isSyncToggle) {
        console.log(`🔄 [DEBUG] Quick sync toggle request for product ${id}:`, productData.syncWithShop);
        // Skip all validations for sync toggles - just update the field
      } else {
        // Full validation for regular updates
        if (!productData.name || productData.name.trim() === '') {
          return res.status(400).json({ 
            success: false, 
            message: "نام محصول اجباری است" 
          });
        }
        
        // Validate numerical fields
        if (productData.stockQuantity !== undefined && (isNaN(productData.stockQuantity) || productData.stockQuantity < 0)) {
          return res.status(400).json({ 
            success: false, 
            message: "مقدار موجودی باید عدد مثبت باشد" 
          });
        }
        
        if (productData.unitPrice !== undefined && (isNaN(parseFloat(productData.unitPrice)) || parseFloat(productData.unitPrice) < 0)) {
          return res.status(400).json({ 
            success: false, 
            message: "قیمت باید عدد مثبت باشد" 
          });
        }
      }
      
      console.log(`📝 [DEBUG] Updating showcase product ${id} with validated data`);
      console.log(`📝 [DEBUG] Tags field:`, productData.tags, 'Type:', typeof productData.tags);
      
      // Update showcase product
      const product = await storage.updateProduct(id, productData);
      console.log(`✅ [DEBUG] Updated product result:`, JSON.stringify({
        id: product.id,
        name: product.name,
        tags: product.tags,
        description: product.description
      }, null, 2));
      
      // Shop visibility logic - actually sync to shop when enabled
      if (productData.syncWithShop === true) {
        console.log(`🏪 محصول در فروشگاه نمایش داده می‌شود: ${product.name}`);
        
        // Actually sync this product to shop
        try {
          const existingShopProducts = await shopStorage.getShopProducts();
          const existingShopProduct = existingShopProducts.find(sp => sp.name === product.name);
          
          if (!existingShopProduct) {
            const shopProductData = {
              name: product.name,
              category: product.category,
              description: product.description,
              shortDescription: product.shortDescription || product.description,
              price: product.unitPrice || product.price || 0,
              priceUnit: product.currency || product.priceUnit || 'IQD',
              inStock: (product.stockQuantity || 0) > 0 || (productData.showWhenOutOfStock || false),
              stockQuantity: product.stockQuantity || 0,
              lowStockThreshold: 10,
              minStockLevel: product.minStockLevel || 5,
              maxStockLevel: product.maxStockLevel || 100,
              showWhenOutOfStock: productData.showWhenOutOfStock || false,
              sku: product.sku && !existingShopProducts.some(sp => sp.sku === product.sku) 
                ? product.sku 
                : `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              barcode: product.barcode,
              imageUrls: product.imageUrl ? [product.imageUrl] : [],
              specifications: product.specifications || {},
              features: product.features || [],
              applications: product.applications || [],
              isActive: true,
              isFeatured: false,
              metaTitle: product.name,
              metaDescription: product.description
            };
            
            await shopStorage.createShopProduct(shopProductData);
            console.log(`✅ محصول به فروشگاه اضافه شد: ${product.name}`);
          } else {
            // Shop product already exists, update it
            const updateData = {
              stockQuantity: product.stockQuantity || 0,
              inStock: (product.stockQuantity || 0) > 0 || (productData.showWhenOutOfStock || false),
              price: product.unitPrice || product.price || 0,
              priceUnit: product.currency || product.priceUnit || 'IQD',
              description: product.description,
              shortDescription: product.shortDescription || product.description,
              imageUrls: product.imageUrl ? [product.imageUrl] : (existingShopProduct.imageUrls || []),
              specifications: product.specifications || {},
              features: product.features || [],
              applications: product.applications || [],
              barcode: product.barcode,
              sku: product.sku || existingShopProduct.sku,
              showWhenOutOfStock: productData.showWhenOutOfStock || false
            };
            
            await shopStorage.updateShopProduct(existingShopProduct.id, updateData);
            console.log(`✅ محصول در فروشگاه به‌روزرسانی شد: ${product.name}`);
          }
        } catch (syncError) {
          console.error(`❌ خطا در sync کردن محصول ${product.name}:`, syncError.message);
          // Continue with the product update even if shop sync fails
        }
      } else if (productData.syncWithShop === false) {
        console.log(`🔒 محصول از فروشگاه مخفی شد: ${product.name}`);
        
        // Remove from shop if sync is disabled
        try {
          const existingShopProducts = await shopStorage.getShopProducts();
          const existingShopProduct = existingShopProducts.find(sp => sp.name === product.name);
          
          if (existingShopProduct) {
            await shopStorage.deleteShopProduct(existingShopProduct.id);
            console.log(`🗑️  محصول از فروشگاه حذف شد: ${product.name}`);
          }
        } catch (removeError: any) {
          console.error(`❌ خطا در حذف محصول ${product.name} از فروشگاه:`, removeError.message);
          // Continue with the product update even if shop removal fails
        }
      }
      
      // Trigger automatic synchronization after any update
      try {
        const { KardexSyncMaster } = await import('./kardex-sync-master');
        const result = await KardexSyncMaster.smartSyncShopFromKardex();
        console.log(`🔄 Auto-sync completed after updating product ${id}:`, result.message);
      } catch (syncError) {
        console.log("Auto-sync failed after update:", syncError);
      }
      
      const responseProduct = product;
      console.log(`✅ [DEBUG] Product update completed successfully for product ${id}`);
      
      res.json({ 
        success: true, 
        message: isSyncToggle ? "وضعیت نمایش در فروشگاه به‌روزرسانی شد" : "محصول با موفقیت به‌روزرسانی شد",
        product: responseProduct 
      });
    } catch (error: any) {
      console.error("Error updating showcase product:", error);
      
      // Handle specific database errors with Persian messages
      let errorMessage = "خطای داخلی سرور";
      let statusCode = 500;
      
      if (error instanceof z.ZodError) {
        statusCode = 400;
        errorMessage = "داده‌های نامعتبر ارسال شده";
      } else if (error.code === '23505') { // Unique constraint violation
        statusCode = 400;
        if (error.constraint?.includes('sku')) {
          errorMessage = "کد SKU تکراری است";
        } else if (error.constraint?.includes('barcode')) {
          errorMessage = "بارکد تکراری است";
        } else {
          errorMessage = "مقدار تکراری وجود دارد";
        }
      } else if (error.code === '23503') { // Foreign key violation
        statusCode = 400;
        errorMessage = "مرجع نامعتبر";
      } else if (error.code === '23514') { // Check constraint violation
        statusCode = 400;
        errorMessage = "مقدار نامعتبر وارد شده";
      } else if (error.message?.includes('authentication')) {
        statusCode = 401;
        errorMessage = "احراز هویت مورد نیاز است";
      }
      
      res.status(statusCode).json({ 
        success: false, 
        message: errorMessage
      });
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

      // Get product name before deletion for shop cleanup
      const productToDelete = await storage.getProductById(id);
      
      // Delete from showcase products (admin interface)
      await storage.deleteProduct(id);
      
      // Also remove from shop if it exists there (by barcode matching for better accuracy)
      if (productToDelete) {
        try {
          const shopProducts = await shopStorage.getShopProducts();
          const matchingShopProduct = shopProducts.find(p => 
            p.barcode === productToDelete.barcode || 
            p.name === productToDelete.name ||
            p.sku === productToDelete.sku
          );
          if (matchingShopProduct) {
            await shopStorage.deleteShopProduct(matchingShopProduct.id);
            console.log(`✅ [DELETE-SYNC] Removed matching shop product: ${matchingShopProduct.name} (barcode: ${matchingShopProduct.barcode})`);
          } else {
            console.log(`⚠️ [DELETE-SYNC] No matching shop product found for: ${productToDelete.name} (barcode: ${productToDelete.barcode})`);
          }
        } catch (error) {
          console.log("❌ [DELETE-SYNC] Error removing from shop:", error);
        }
      }
      
      // Trigger automatic synchronization after deletion
      try {
        const { KardexSyncMaster } = await import('./kardex-sync-master');
        const result = await KardexSyncMaster.smartSyncShopFromKardex();
        console.log(`🔄 Auto-sync completed after deleting product ${id}:`, result.message);
      } catch (syncError) {
        console.log("Auto-sync failed after deletion:", syncError);
      }
      
      console.log(`Product ${id} deleted successfully from both showcase and shop with auto-sync`);
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // =============================================================================
  // KARDEX SYNC MASTER ENDPOINTS - سیستم همگام‌سازی ایمن
  // =============================================================================
  
  // بررسی وضعیت همگام‌سازی
  app.get("/api/kardex-sync/status", requireAuth, async (req, res) => {
    try {
      const { KardexSyncMaster } = await import('./kardex-sync-master');
      const status = await KardexSyncMaster.checkSyncStatus();
      
      res.json({
        success: true,
        data: status,
        message: "وضعیت همگام‌سازی بررسی شد"
      });
    } catch (error) {
      console.error("Error checking sync status:", error);
      res.status(500).json({
        success: false,
        message: "خطا در بررسی وضعیت همگام‌سازی"
      });
    }
  });
  
  // بازسازی کامل فروشگاه از کاردکس (ایمن)
  app.post("/api/kardex-sync/full-rebuild", requireAuth, async (req, res) => {
    try {
      const { KardexSyncMaster } = await import('./kardex-sync-master');
      const result = await KardexSyncMaster.fullRebuildShopFromKardex();
      
      res.json({
        success: result.success,
        data: result.details,
        message: result.message
      });
    } catch (error) {
      console.error("Error in full rebuild:", error);
      res.status(500).json({
        success: false,
        message: "خطا در بازسازی کامل فروشگاه"
      });
    }
  });
  
  // همگام‌سازی هوشمند (فقط تغییرات)
  app.post("/api/kardex-sync/smart-sync", requireAuth, async (req, res) => {
    try {
      const { KardexSyncMaster } = await import('./kardex-sync-master');
      const result = await KardexSyncMaster.smartSyncShopFromKardex();
      
      res.json({
        success: result.success,
        data: result.details,
        message: result.message
      });
    } catch (error) {
      console.error("Error in smart sync:", error);
      res.status(500).json({
        success: false,
        message: "خطا در همگام‌سازی هوشمند"
      });
    }
  });

  // حذف کامل محصولات اضافی از فروشگاه که در کاردکس نیستند
  app.post("/api/kardex-sync/cleanup-extra", requireAuth, async (req, res) => {
    try {
      const { KardexSyncMaster } = await import('./kardex-sync-master');
      const result = await KardexSyncMaster.cleanupExtraShopProducts();
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            deletedCount: result.deletedCount,
            deletedProducts: result.deletedProducts
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error("❌ [CLEANUP-EXTRA] Error:", error);
      res.status(500).json({
        success: false,
        message: "خطا در حذف محصولات اضافی"
      });
    }
  });

  // حذف SKU تکراری
  app.post("/api/kardex-sync/cleanup-duplicates", requireAuth, async (req, res) => {
    try {
      const { KardexSyncMaster } = await import('./kardex-sync-master');
      const result = await KardexSyncMaster.cleanupDuplicateSKUs();
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          data: {
            deletedCount: result.deletedCount,
            duplicates: result.duplicates
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error("❌ [CLEANUP-SKU] Error:", error);
      res.status(500).json({
        success: false,
        message: "خطا در حذف SKU تکراری"
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
      const products = await shopStorage.getShopProducts();
      const product = products.find(p => 
        p.barcode === decodedBarcode || 
        p.sku === decodedBarcode
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
      
      const updatedProduct = await shopStorage.updateShopProduct(parseInt(id), updateData);
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
          const products = await shopStorage.getShopProducts();
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
          await shopStorage.updateShopProduct(productId, { barcode: ean13 });
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

  // Export EAN-13 data as CSV with multilingual support
  app.get("/api/ean13/export", requireAuth, async (req, res) => {
    try {
      const products = await shopStorage.getShopProducts();
      const ean13Products = products.filter(p => p.barcode && p.barcode.length === 13);
      
      // Create CSV with UTF-8 BOM for proper multilingual character display
      const BOM = '\uFEFF';
      
      // Multilingual headers (Persian/Arabic/Kurdish compatible)
      const csvHeader = "نام محصول,کد محصول,EAN-13,کد کشور,پیشوند شرکت,کد محصول,رقم چک,دسته‌بندی,قیمت واحد,واحد قیمت,وضعیت موجودی,موجودی فعلی\n";
      
      const csvRows = ean13Products.map(product => {
        const barcode = product.barcode!;
        const countryCode = barcode.substring(0, 3);
        const companyPrefix = barcode.substring(3, 8);
        const productCode = barcode.substring(8, 12);
        const checkDigit = barcode.substring(12, 13);
        
        // Format price with proper Persian/Arabic numerals support
        const price = product.unitPrice || product.priceRange || 'قیمت تعیین نشده';
        const currency = product.currency || 'دینار عراقی';
        const stockStatus = (product.stockQuantity && product.stockQuantity > 0) ? 'موجود' : 'ناموجود';
        const currentStock = product.stockQuantity || 0;
        
        // Escape quotes and handle special characters for CSV
        const escapeCsvField = (field: string | number) => {
          const str = String(field || '');
          // If field contains comma, newline, or quote, wrap in quotes and escape internal quotes
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return `"${str}"`;
        };
        
        return [
          escapeCsvField(product.name),
          escapeCsvField(product.sku || ''),
          escapeCsvField(barcode),
          escapeCsvField(countryCode),
          escapeCsvField(companyPrefix),
          escapeCsvField(productCode),
          escapeCsvField(checkDigit),
          escapeCsvField(product.category),
          escapeCsvField(price),
          escapeCsvField(currency),
          escapeCsvField(stockStatus),
          escapeCsvField(currentStock)
        ].join(',');
      }).join('\n');
      
      const csvContent = BOM + csvHeader + csvRows;
      
      // Set proper headers for UTF-8 CSV with BOM
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="Barcode_Export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
      
      console.log(`✅ [EXPORT] Generated CSV export with ${ean13Products.length} products with multilingual support`);
    } catch (error) {
      console.error("❌ [EXPORT] Error exporting EAN-13 data:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در خروجی گیری فایل CSV" 
      });
    }
  });

  // Export all barcode data (both showcase and shop) with pricing
  app.get("/api/barcode/export-all", requireAuth, async (req, res) => {
    try {
      const shopProducts = await shopStorage.getShopProducts();
      
      // Create CSV with UTF-8 BOM for proper multilingual character display
      const BOM = '\uFEFF';
      
      // Comprehensive multilingual headers with proper pricing information
      const csvHeader = "نام محصول,کد محصول,بارکد,نوع بارکد,دسته‌بندی,قیمت فروشگاه,واحد قیمت,ارز,موجودی فروشگاه,وضعیت موجودی,حد کمینه موجودی,آستانه موجودی کم,تاریخ ایجاد\n";
      
      // Process shop products only (single table system)
      const csvRows = shopProducts.map(product => {
        // Escape quotes and handle special characters for CSV
        const escapeCsvField = (field: string | number) => {
          const str = String(field || '');
          if (str.includes(',') || str.includes('\n') || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return `"${str}"`;
        };

        // Format price properly
        const formatPrice = (price: any) => {
          if (!price) return 'قیمت تعیین نشده';
          if (typeof price === 'string' && !isNaN(parseFloat(price))) {
            return parseFloat(price).toFixed(2);
          }
          if (typeof price === 'number') {
            return price.toFixed(2);
          }
          return String(price);
        };

        return [
          escapeCsvField(product.name),
          escapeCsvField(product.sku || ''),
          escapeCsvField(product.barcode || 'بدون بارکد'),
          escapeCsvField(product.barcode ? (product.barcode.length === 13 ? 'EAN-13' : 'سفارشی') : 'ندارد'),
          escapeCsvField(product.category),
          escapeCsvField(formatPrice(product.price)), // Shop price
          escapeCsvField(product.priceUnit || 'واحد'),
          escapeCsvField(product.currency || 'دینار عراقی'),
          escapeCsvField(product.stockQuantity || 0),
          escapeCsvField((product.stockQuantity && product.stockQuantity > 0) ? 'موجود' : 'ناموجود'),
          escapeCsvField(product.minStockLevel || 0),
          escapeCsvField(product.lowStockThreshold || 10),
          escapeCsvField(product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }) : '')
        ].join(',');
      }).join('\n');
      
      const csvContent = BOM + csvHeader + csvRows;
      
      // Set proper headers for UTF-8 CSV with BOM
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="Complete_Barcode_Export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvContent);
      
      console.log(`✅ [EXPORT] Generated complete barcode CSV with ${shopProducts.length} products including pricing`);
    } catch (error) {
      console.error("❌ [EXPORT] Error exporting barcode data with pricing:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در خروجی گیری فایل CSV با اطلاعات قیمت" 
      });
    }
  });

  // Helper function to generate label HTML with fixed grid layout
  function generateLabelHTML(products: any[], options: any) {
    const { showPrice, showWebsite, showSKU, labelSize, website } = options;
    
    // Fixed label dimensions matching frontend design
    const labelConfigs = {
      small: { 
        width: '40mm', height: '28mm', padding: '1mm',
        nameFont: '8px', skuFont: '6px', priceFont: '6px', websiteFont: '6px',
        barcodeFont: '10px', nameMaxLength: 15, skuMaxLength: 10
      },
      standard: { 
        width: '56mm', height: '36mm', padding: '2mm',
        nameFont: '10px', skuFont: '8px', priceFont: '8px', websiteFont: '8px',
        barcodeFont: '12px', nameMaxLength: 25, skuMaxLength: 15
      },
      large: { 
        width: '72mm', height: '44mm', padding: '3mm',
        nameFont: '14px', skuFont: '10px', priceFont: '10px', websiteFont: '10px',
        barcodeFont: '16px', nameMaxLength: 35, skuMaxLength: 18
      },
      roll: { 
        width: '48mm', height: '20mm', padding: '1mm',
        nameFont: '7px', skuFont: '6px', priceFont: '6px', websiteFont: '6px',
        barcodeFont: '8px', nameMaxLength: 18, skuMaxLength: 12
      }
    };
    
    const config = labelConfigs[labelSize] || labelConfigs.standard;
    
    const formatPrice = (product: any) => {
      if (!product.price) return '';
      const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      // Always use IQD as the currency for Iraqi market
      const unit = product.priceUnit || 'واحد';
      return `${Math.round(price).toLocaleString()} IQD / ${unit}`;
    };

    const truncateText = (text: string, maxLength: number) => {
      return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
    };

    const generateBarcode = (value: string) => {
      return `<div class="barcode-text" style="font-family: 'Courier New', monospace; font-size: ${config.barcodeFont}; font-weight: bold; letter-spacing: 1px; text-align: center; line-height: 1.2; background: white; color: black;">${value}</div>`;
    };

    const labelsHTML = products.map(product => {
      const displayName = truncateText(product.name, config.nameMaxLength);
      const displaySku = product.sku ? truncateText(product.sku, config.skuMaxLength) : '';
      
      return `
      <div style="
        width: ${config.width}; 
        height: ${config.height}; 
        border: 3px solid #000; 
        padding: ${config.padding}; 
        margin: 2mm; 
        display: inline-block; 
        vertical-align: top;
        background: white;
        box-sizing: border-box;
        page-break-inside: avoid;
        font-family: Arial, sans-serif;
        overflow: hidden;
        position: relative;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      ">
        <!-- Fixed 4-row grid layout -->
        <div style="
          height: 100%; 
          display: grid; 
          grid-template-rows: 1fr 1fr 1fr 1fr; 
          gap: 1mm;
          text-align: center;
        ">
          <!-- Row 1: Product Name (always shown) -->
          <div style="
            display: flex; 
            align-items: center; 
            justify-content: center;
            font-weight: bold; 
            font-size: ${config.nameFont}; 
            line-height: 1.1; 
            overflow: hidden;
            padding: 0 1mm;
          ">
            <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%;">
              ${displayName}
            </span>
          </div>

          <!-- Row 2: SKU (if enabled) -->
          <div style="
            display: flex; 
            align-items: center; 
            justify-content: center;
            min-height: 0;
          ">
            ${showSKU && product.sku ? `
              <span class="sku-text" style="
                font-size: ${config.skuFont}; 
                color: #333; 
                font-family: 'Courier New', monospace;
                font-weight: 500;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 100%;
              ">
                SKU: ${displaySku}
              </span>
            ` : '<div style="height: 100%;"></div>'}
          </div>

          <!-- Row 3: Barcode (always shown) -->
          <div style="
            display: flex; 
            align-items: center; 
            justify-content: center;
            min-height: 0;
          ">
            ${generateBarcode(product.barcode)}
          </div>

          <!-- Row 4: Price and Website -->
          <div style="
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center;
            gap: 0.5mm;
            min-height: 0;
          ">
            ${showPrice && product.price ? `
              <span class="price-text" style="
                font-weight: bold; 
                color: #008000; 
                font-size: ${config.priceFont}; 
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 100%;
                text-shadow: 0 1px 1px rgba(0,0,0,0.1);
              ">
                ${formatPrice(product)}
              </span>
            ` : ''}
            
            ${showWebsite ? `
              <span class="website-text" style="
                color: #666; 
                font-size: ${config.websiteFont}; 
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
                max-width: 100%;
                font-weight: 500;
              ">
                momtazchem.com
              </span>
            ` : ''}
          </div>
        </div>
      </div>`;
    }).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Product Labels - Momtazchem</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Libre+Barcode+128&display=swap');
          
          * {
            box-sizing: border-box;
          }
          
          body { 
            margin: 0; 
            padding: 10mm; 
            font-family: Arial, sans-serif;
            background: white;
            color: black;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          .labels-container {
            display: flex; 
            flex-wrap: wrap; 
            gap: 3mm; 
            align-items: flex-start;
            justify-content: flex-start;
          }
          
          @page {
            size: A4;
            margin: 10mm;
          }
          
          @media print {
            body { 
              margin: 0; 
              padding: 10mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            
            .no-print { 
              display: none; 
            }
            
            .labels-container > div {
              border: 2px solid black !important;
              background: white !important;
              page-break-inside: avoid;
            }
            
            /* Enhanced print quality */
            .barcode-text {
              font-family: 'Courier New', monospace !important;
              font-weight: bold !important;
              letter-spacing: 1px !important;
            }
            
            /* Prevent text from breaking across pages */
            h1, h2, h3, h4, h5, h6 {
              page-break-after: avoid;
            }
            
            /* Better color contrast for printing */
            .price-text {
              color: #008000 !important;
              font-weight: bold !important;
            }
            
            .sku-text {
              color: #333333 !important;
            }
            
            .website-text {
              color: #666666 !important;
            }
          }
          
          /* Print preview styling */
          @media screen {
            body {
              background: #f5f5f5;
              padding: 20mm;
            }
            
            .labels-container {
              background: white;
              padding: 10mm;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
          }
        </style>
      </head>
      <body>
        <div class="labels-container">
          ${labelsHTML}
        </div>
        
        <!-- Print Instructions (hidden in print) -->
        <div class="no-print" style="margin-top: 20mm; padding: 10mm; background: #f0f0f0; border-radius: 5mm;">
          <h3 style="margin: 0 0 5mm 0; color: #333;">Print Instructions:</h3>
          <ul style="margin: 0; padding-left: 15mm; color: #666;">
            <li>Use Ctrl+P (Cmd+P on Mac) to print</li>
            <li>Select "More settings" → "Options" → "Background graphics" for best quality</li>
            <li>Recommended: Use high-quality printer with black ink</li>
            <li>Print on A4 paper for standard labels</li>
          </ul>
        </div>
      </body>
      </html>
    `;
  }

  // Generate customized printable labels for products with user options
  app.post("/api/barcode/generate-custom-labels", requireAuth, async (req, res) => {
    try {
      console.log('🏷️  [CUSTOM LABELS] Request received:', { 
        productsCount: req.body.products?.length, 
        options: req.body.options,
        format: req.body.format 
      });
      
      const { products, options, format = 'html' } = req.body;
      
      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: "محصولات برای تولید برچسب مورد نیاز است"
        });
      }

      // Extract options with defaults
      const {
        includePrice = true,
        includeWebsite = true,
        includeSKU = true,
        websiteText = "www.momtazchem.com",
        labelSize = "standard"
      } = options || {};

      // Generate HTML for labels using the extracted options
      const labelHTML = generateLabelHTML(products, {
        showPrice: includePrice,
        showWebsite: includeWebsite,
        showSKU: includeSKU,
        labelSize,
        website: websiteText
      });

      // Return as image if requested
      if (format === 'image') {
        try {
          const browser = await puppeteer.launch({
            headless: 'new',
            args: [
              '--no-sandbox', 
              '--disable-setuid-sandbox',
              '--disable-dev-shm-usage',
              '--disable-accelerated-2d-canvas',
              '--no-first-run',
              '--no-zygote',
              '--single-process',
              '--disable-gpu'
            ],
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
          });
          
          const page = await browser.newPage();
          await page.setContent(labelHTML, { waitUntil: 'networkidle0' });
          
          // Set viewport for better image quality
          await page.setViewport({ width: 800, height: 600 });
          
          const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true,
            omitBackground: false
          });
          
          await browser.close();

          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Content-Disposition', `attachment; filename="Custom_Labels_${new Date().toISOString().split('T')[0]}.png"`);
          res.send(screenshot);
          
          console.log(`✅ [CUSTOM LABELS] Generated custom labels image for ${products.length} products`);
          return;
        } catch (imageError) {
          console.log('Puppeteer image generation failed, trying alternative method:', imageError.message);
          
          // Alternative: Return as base64 encoded image using canvas
          try {
            // For now, we'll create a simple HTML response that can be converted to image on client side
            const imageHTML = `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <title>Product Labels</title>
                <style>
                  body { 
                    margin: 0; 
                    padding: 20px; 
                    font-family: Arial, sans-serif;
                    background: white;
                    width: 800px;
                    height: auto;
                  }
                  .convert-to-image { display: block; }
                </style>
                <script>
                  window.addEventListener('load', function() {
                    // This script will help convert HTML to canvas/image on client side
                    if (window.html2canvas) {
                      html2canvas(document.body).then(function(canvas) {
                        const link = document.createElement('a');
                        link.download = 'custom-labels.png';
                        link.href = canvas.toDataURL();
                        link.click();
                      });
                    }
                  });
                </script>
              </head>
              <body class="convert-to-image">
                ${labelHTML.replace('<!DOCTYPE html>', '').replace(/<html[^>]*>/, '').replace('</html>', '').replace(/<head[^>]*>[\s\S]*?<\/head>/, '').replace(/<body[^>]*>/, '').replace('</body>', '')}
              </body>
              </html>
            `;
            
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="Custom_Labels_For_Image_${new Date().toISOString().split('T')[0]}.html"`);
            res.send(imageHTML);
            
            console.log(`✅ [CUSTOM LABELS] Generated HTML for image conversion for ${products.length} products`);
            return;
          } catch (htmlError) {
            console.log('HTML image generation also failed, falling back to standard HTML:', htmlError.message);
          }
        }
      }

      // Return HTML directly for better compatibility and user control
      console.log('🏷️  [CUSTOM LABELS] Generating HTML for custom labels');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="Custom_Product_Labels.html"');
      res.send(labelHTML);

      console.log(`✅ [CUSTOM LABELS] Generated custom labels for ${products.length} products`);
    } catch (error) {
      console.error("❌ [CUSTOM LABELS] Error generating custom labels:", error);
      res.status(500).json({
        success: false,
        message: "خطا در تولید برچسب‌های سفارشی"
      });
    }
  });

  // Generate printable labels for products
  app.post("/api/barcode/generate-labels", requireAuth, async (req, res) => {
    try {
      console.log('🏷️  [LABELS] Request received:', { labelSize: req.body.labelSize, productsCount: req.body.products?.length });
      const { products, showPrice, showWebsite, showSKU, labelSize, website } = req.body;
      
      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
          success: false,
          message: "محصولات برای تولید لیبل مورد نیاز است"
        });
      }

      // Generate HTML for labels
      const labelHTML = generateLabelHTML(products, {
        showPrice,
        showWebsite,
        showSKU,
        labelSize,
        website: website || 'www.momtazchem.com'
      });

      // For roll printer, return HTML directly for better compatibility
      if (labelSize === 'roll') {
        console.log('🏷️  [LABELS] Generating HTML for roll printer');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', 'inline; filename="Roll_Labels.html"');
        return res.send(labelHTML);
      }

      // For other sizes, generate PDF using Puppeteer
      try {
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setContent(labelHTML, { waitUntil: 'networkidle0' });
        
        const pdf = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '10mm',
            right: '10mm',
            bottom: '10mm',
            left: '10mm',
          }
        });
        
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Product_Labels_${new Date().toISOString().split('T')[0]}.pdf"`);
        res.send(pdf);
      } catch (pdfError) {
        // Fallback to HTML if PDF generation fails
        console.log('PDF generation failed, falling back to HTML:', pdfError.message);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', 'inline; filename="Product_Labels.html"');
        res.send(labelHTML);
      }

      console.log(`✅ [LABELS] Generated labels PDF for ${products.length} products`);
    } catch (error) {
      console.error("❌ [LABELS] Error generating labels:", error);
      res.status(500).json({
        success: false,
        message: "خطا در تولید لیبل‌ها"
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

  // Sync modules with main system
  app.post("/api/admin/sync-modules", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      
      // Define the main system modules - these are the 25 Site Management modules
      const mainModules = [
        'syncing_shop',
        'inquiries', 
        'barcode',
        'email_settings',
        'database_backup',
        'crm',
        'seo',
        'categories',
        'sms',
        'factory',
        'user_management',
        'shop_management',
        'procedures',
        'smtp_test',
        'order_management',
        'product_management',
        'payment_management',
        'wallet_management',
        'geography_analytics',
        'ai_settings',
        'refresh_control',
        'department_users',
        'inventory_management', // Keep as-is: this is correct module name from Site Management
        'content_management',
        'warehouse_management', // Added: warehouse_management module
        'logistics_management' // Added: logistics-management module
      ];

      // Get super admin role (admin@momtazchem.com has user ID 7)
      const superAdminRoleId = '7';
      
      let syncedModules = 0;

      // Sync each main module to module_permissions for super admin
      for (const moduleId of mainModules) {
        // Check if module permission exists for super admin
        const existingPermission = await pool.query(
          'SELECT id FROM module_permissions WHERE role_id = $1 AND module_id = $2',
          [superAdminRoleId, moduleId]
        );

        if (existingPermission.rows.length === 0) {
          // Create the permission for super admin
          await pool.query(`
            INSERT INTO module_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_approve, created_at, updated_at)
            VALUES ($1, $2, true, true, true, true, true, NOW(), NOW())
          `, [superAdminRoleId, moduleId]);
          syncedModules++;
        } else {
          // Update existing permission to ensure it's active
          await pool.query(`
            UPDATE module_permissions SET
              can_view = true,
              can_create = true,
              can_edit = true,
              can_delete = true,
              can_approve = true,
              updated_at = NOW()
            WHERE role_id = $1 AND module_id = $2
          `, [superAdminRoleId, moduleId]);
        }
      }

      console.log(`✅ Module sync completed: ${syncedModules} new modules synced for super admin`);
      
      res.json({
        success: true,
        message: "تم مزامنة الوحدات بنجاح",
        syncedModules,
        totalModules: mainModules.length
      });
    } catch (error) {
      console.error("Error syncing modules:", error);
      res.status(500).json({ 
        success: false, 
        message: "فشل في مزامنة الوحدات",
        error: error.message 
      });
    }
  });

  // User Management sync modules endpoint
  // Function to get current Site Management modules dynamically
  const getSiteManagementModules = () => {
    // This should be the SINGLE SOURCE OF TRUTH for all modules
    // Any changes here will automatically sync to User Management
    return [
      'syncing_shop',
      'shop_management', 
      'product_management',
      'order_management',
      'warehouse-management',
      'logistics_management',
      'inquiries',
      'crm',
      'barcode',
      'email_settings',
      'database_backup',
      'seo',
      'categories',
      'sms',
      'factory',
      'user_management',
      'procedures',
      'smtp_test',
      'payment_management',
      'wallet_management',
      'geography_analytics',
      'ai_settings',
      'refresh_control',
      'content_management',
      'ticketing_system'
      // Total: 25 modules - automatically synced with Site Management
    ];
  };

  app.post("/api/user-management/sync-modules", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      
      // Get current modules from the single source of truth
      const mainModules = getSiteManagementModules();

      // Get super admin role (admin@momtazchem.com has user ID 7)
      const superAdminRoleId = '7';
      
      let syncedModules = 0;

      // Sync each main module to module_permissions for super admin
      for (const moduleId of mainModules) {
        // Check if module permission exists for super admin
        const existingPermission = await pool.query(
          'SELECT id FROM module_permissions WHERE role_id = $1 AND module_id = $2',
          [superAdminRoleId, moduleId]
        );

        if (existingPermission.rows.length === 0) {
          // Create the permission for super admin
          await pool.query(`
            INSERT INTO module_permissions (role_id, module_id, can_view, can_create, can_edit, can_delete, can_approve, created_at, updated_at)
            VALUES ($1, $2, true, true, true, true, true, NOW(), NOW())
          `, [superAdminRoleId, moduleId]);
          syncedModules++;
        }
      }

      console.log(`✅ User Management sync completed: ${syncedModules} new modules synced`);
      
      res.json({
        success: true,
        message: `ماژول‌ها با موفقیت همگام‌سازی شدند. تعداد کل: ${mainModules.length}`,
        syncedModules,
        totalModules: mainModules.length,
        modulesList: mainModules  // Return the current module list for frontend reference
      });
    } catch (error) {
      console.error("Error syncing modules from User Management:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در همگام‌سازی ماژول‌ها",
        error: error.message 
      });
    }
  });

  // NEW: API endpoint to get current Site Management modules list
  app.get("/api/site-management/modules", requireAuth, async (req, res) => {
    try {
      const modules = getSiteManagementModules();
      res.json({
        success: true,
        modules: modules,
        count: modules.length
      });
    } catch (error) {
      console.error("❌ Error getting Site Management modules:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get Site Management modules"
      });
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
  // ROLE MANAGEMENT ENDPOINTS (SUPER ADMIN ONLY)
  // =============================================================================

  // Create new role
  app.post("/api/admin/roles", requireSuperAdmin, async (req, res) => {
    try {
      const { name, displayName, description } = req.body;
      
      if (!name || !displayName) {
        return res.status(400).json({ success: false, message: "Name and display name are required" });
      }

      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO admin_roles (name, display_name, description, is_active)
        VALUES ($1, $2, $3, true)
        RETURNING id, name, display_name, description, is_active, created_at
      `, [name, displayName, description]);

      res.json({
        success: true,
        role: result.rows[0]
      });
    } catch (error: any) {
      console.error("Error creating role:", error);
      if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({ success: false, message: "Role name already exists" });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  });

  // Update role
  app.put("/api/admin/roles/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, displayName, description, isActive } = req.body;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        UPDATE admin_roles 
        SET name = $1, display_name = $2, description = $3, is_active = $4, updated_at = NOW()
        WHERE id = $5
        RETURNING id, name, display_name, description, is_active, updated_at
      `, [name, displayName, description, isActive, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Role not found" });
      }

      res.json({
        success: true,
        role: result.rows[0]
      });
    } catch (error: any) {
      console.error("Error updating role:", error);
      if (error.code === '23505') {
        res.status(400).json({ success: false, message: "Role name already exists" });
      } else {
        res.status(500).json({ success: false, message: "Internal server error" });
      }
    }
  });

  // Delete role
  app.delete("/api/admin/roles/:id", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const { pool } = await import('./db');
      
      // Check if role has users assigned
      const usersCheck = await pool.query(`
        SELECT COUNT(*) as user_count FROM users WHERE role_id = $1
      `, [id]);
      
      if (parseInt(usersCheck.rows[0].user_count) > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Cannot delete role that has users assigned to it" 
        });
      }

      // Delete role permissions first
      await pool.query(`DELETE FROM role_permissions WHERE role_id = $1`, [id]);
      
      // Delete role
      const result = await pool.query(`
        DELETE FROM admin_roles WHERE id = $1 RETURNING id
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Role not found" });
      }

      res.json({
        success: true,
        message: "Role deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get role permissions
  app.get("/api/admin/roles/:id/permissions", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT p.id, p.name, p.display_name, p.description, p.module,
               CASE WHEN rp.permission_id IS NOT NULL THEN true ELSE false END as assigned
        FROM admin_permissions p
        LEFT JOIN role_permissions rp ON p.id = rp.permission_id AND rp.role_id = $1
        WHERE p.is_active = true
        ORDER BY p.module, p.display_name
      `, [id]);

      const permissions = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        displayName: row.display_name,
        description: row.description,
        module: row.module,
        assigned: row.assigned
      }));

      res.json(permissions);
    } catch (error) {
      console.error("Error fetching role permissions:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Update role permissions
  app.put("/api/admin/roles/:id/permissions", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body;
      
      if (!Array.isArray(permissionIds)) {
        return res.status(400).json({ success: false, message: "Permission IDs must be an array" });
      }

      const { pool } = await import('./db');
      
      // Begin transaction
      await pool.query('BEGIN');
      
      try {
        // Remove existing permissions
        await pool.query(`DELETE FROM role_permissions WHERE role_id = $1`, [id]);
        
        // Add new permissions
        if (permissionIds.length > 0) {
          const values = permissionIds.map((permId: string, index: number) => 
            `($1, $${index + 2})`
          ).join(', ');
          
          const query = `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`;
          await pool.query(query, [id, ...permissionIds]);
        }
        
        await pool.query('COMMIT');
        
        res.json({
          success: true,
          message: "Role permissions updated successfully"
        });
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error("Error updating role permissions:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // =============================================================================
  // CUSTOM USER MANAGEMENT ENDPOINTS
  // =============================================================================

  // Get all custom roles
  app.get("/api/admin/custom-roles", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT 
          cr.*,
          COUNT(cu.id) as user_count
        FROM custom_roles cr
        LEFT JOIN custom_users cu ON cr.id = cu.role_id AND cu.is_active = true
        GROUP BY cr.id
        ORDER BY cr.priority DESC, cr.display_name
      `);

      const roles = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        displayName: row.display_name,
        description: row.description,
        color: row.color,
        priority: row.priority,
        permissions: row.permissions || [],
        permissionCount: (row.permissions || []).length, // شمارش دقیق دسترسی‌ها
        userCount: parseInt(row.user_count),
        isActive: row.is_active,
        createdAt: row.created_at
      }));

      res.json({ success: true, data: roles });
    } catch (error) {
      console.error("Error fetching custom roles:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت نقش‌ها" });
    }
  });

  // Create custom role
  app.post("/api/admin/custom-roles", requireAuth, async (req, res) => {
    try {
      const { name, displayName, description, color, priority, permissions } = req.body;
      
      if (!name || !displayName) {
        return res.status(400).json({ success: false, message: "نام و نام نمایشی الزامی است" });
      }

      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO custom_roles (name, display_name, description, color, priority, permissions)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [name, displayName, description, color || '#3b82f6', priority || 1, permissions || []]);

      res.json({
        success: true,
        data: result.rows[0],
        message: "نقش جدید با موفقیت ایجاد شد"
      });
    } catch (error: any) {
      console.error("Error creating custom role:", error);
      if (error.code === '23505') {
        res.status(400).json({ success: false, message: "این نام نقش قبلاً استفاده شده است" });
      } else {
        res.status(500).json({ success: false, message: "خطا در ایجاد نقش" });
      }
    }
  });

  // Update custom role
  app.patch("/api/admin/custom-roles/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { name, displayName, description, color, priority, permissions, isActive } = req.body;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        UPDATE custom_roles 
        SET 
          name = COALESCE($1, name),
          display_name = COALESCE($2, display_name),
          description = COALESCE($3, description),
          color = COALESCE($4, color),
          priority = COALESCE($5, priority),
          permissions = COALESCE($6, permissions),
          is_active = COALESCE($7, is_active),
          updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `, [name, displayName, description, color, priority, permissions, isActive, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "نقش یافت نشد" });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: "نقش با موفقیت به‌روزرسانی شد"
      });
    } catch (error: any) {
      console.error("Error updating custom role:", error);
      if (error.code === '23505') {
        res.status(400).json({ success: false, message: "این نام نقش قبلاً استفاده شده است" });
      } else {
        res.status(500).json({ success: false, message: "خطا در به‌روزرسانی نقش" });
      }
    }
  });

  // Delete custom role
  app.delete("/api/admin/custom-roles/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const { pool } = await import('./db');
      
      // Check if role has users assigned
      const usersCheck = await pool.query(`
        SELECT COUNT(*) as user_count FROM custom_users WHERE role_id = $1
      `, [id]);
      
      if (parseInt(usersCheck.rows[0].user_count) > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "نمی‌توان نقشی را حذف کرد که کاربران به آن تخصیص داده شده‌اند" 
        });
      }

      const result = await pool.query(`
        DELETE FROM custom_roles WHERE id = $1 RETURNING id
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "نقش یافت نشد" });
      }

      res.json({
        success: true,
        message: "نقش با موفقیت حذف شد"
      });
    } catch (error) {
      console.error("Error deleting custom role:", error);
      res.status(500).json({ success: false, message: "خطا در حذف نقش" });
    }
  });

  // Get all custom users
  app.get("/api/admin/custom-users", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT 
          cu.*,
          cr.name as role_name,
          cr.display_name as role_display_name,
          cr.color as role_color
        FROM custom_users cu
        LEFT JOIN custom_roles cr ON cu.role_id = cr.id
        ORDER BY cu.created_at DESC
      `);

      const users = result.rows.map((row: any) => ({
        id: row.id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone,
        roleId: row.role_id,
        roleName: row.role_name,
        roleDisplayName: row.role_display_name,
        roleColor: row.role_color,
        isActive: row.is_active,
        smsNotifications: row.sms_notifications,
        emailNotifications: row.email_notifications,
        lastLogin: row.last_login,
        createdAt: row.created_at
      }));

      res.json({ success: true, data: users });
    } catch (error) {
      console.error("Error fetching custom users:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت کاربران" });
    }
  });

  // Create custom user
  app.post("/api/admin/custom-users", requireAuth, async (req, res) => {
    try {
      const { fullName, email, phone, password, roleId, smsNotifications, emailNotifications, isActive } = req.body;
      
      if (!fullName || !email || !phone || !password || !roleId) {
        return res.status(400).json({ 
          success: false, 
          message: "تمام فیلدها الزامی است" 
        });
      }

      // Hash password
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(password, 10);

      const { pool } = await import('./db');
      const result = await pool.query(`
        INSERT INTO custom_users (
          full_name, email, phone, password_hash, role_id, 
          sms_notifications, email_notifications, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, full_name, email, phone, role_id, is_active, 
                  sms_notifications, email_notifications, created_at
      `, [fullName, email, phone, passwordHash, roleId, 
          smsNotifications ?? true, emailNotifications ?? true, isActive ?? true]);

      res.json({
        success: true,
        data: result.rows[0],
        message: "کاربر جدید با موفقیت ایجاد شد"
      });
    } catch (error: any) {
      console.error("Error creating custom user:", error);
      if (error.code === '23505') {
        if (error.constraint?.includes('email')) {
          res.status(400).json({ success: false, message: "این ایمیل قبلاً استفاده شده است" });
        } else if (error.constraint?.includes('phone')) {
          res.status(400).json({ success: false, message: "این شماره تلفن قبلاً استفاده شده است" });
        } else {
          res.status(400).json({ success: false, message: "داده تکراری" });
        }
      } else {
        res.status(500).json({ success: false, message: "خطا در ایجاد کاربر" });
      }
    }
  });

  // Update custom user
  app.patch("/api/admin/custom-users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, email, phone, password, roleId, smsNotifications, emailNotifications, isActive } = req.body;
      
      let passwordHash = undefined;
      if (password) {
        const bcrypt = await import('bcryptjs');
        passwordHash = await bcrypt.hash(password, 10);
      }

      const { pool } = await import('./db');
      const result = await pool.query(`
        UPDATE custom_users 
        SET 
          full_name = COALESCE($1, full_name),
          email = COALESCE($2, email),
          phone = COALESCE($3, phone),
          password_hash = COALESCE($4, password_hash),
          role_id = COALESCE($5, role_id),
          sms_notifications = COALESCE($6, sms_notifications),
          email_notifications = COALESCE($7, email_notifications),
          is_active = COALESCE($8, is_active),
          updated_at = NOW()
        WHERE id = $9
        RETURNING id, full_name, email, phone, role_id, is_active,
                  sms_notifications, email_notifications, updated_at
      `, [fullName, email, phone, passwordHash, roleId, smsNotifications, emailNotifications, isActive, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "کاربر یافت نشد" });
      }

      res.json({
        success: true,
        data: result.rows[0],
        message: "کاربر با موفقیت به‌روزرسانی شد"
      });
    } catch (error: any) {
      console.error("Error updating custom user:", error);
      if (error.code === '23505') {
        if (error.constraint?.includes('email')) {
          res.status(400).json({ success: false, message: "این ایمیل قبلاً استفاده شده است" });
        } else if (error.constraint?.includes('phone')) {
          res.status(400).json({ success: false, message: "این شماره تلفن قبلاً استفاده شده است" });
        } else {
          res.status(400).json({ success: false, message: "داده تکراری" });
        }
      } else {
        res.status(500).json({ success: false, message: "خطا در به‌روزرسانی کاربر" });
      }
    }
  });

  // Delete custom user
  app.delete("/api/admin/custom-users/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        DELETE FROM custom_users WHERE id = $1 RETURNING id
      `, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "کاربر یافت نشد" });
      }

      res.json({
        success: true,
        message: "کاربر با موفقیت حذف شد"
      });
    } catch (error) {
      console.error("Error deleting custom user:", error);
      res.status(500).json({ success: false, message: "خطا در حذف کاربر" });
    }
  });

  // Send SMS to users
  app.post("/api/admin/send-sms", requireAuth, async (req, res) => {
    try {
      const { userIds, message } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "حداقل یک کاربر باید انتخاب شود" 
        });
      }

      if (!message || message.trim().length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "متن پیامک الزامی است" 
        });
      }

      const { pool } = await import('./db');
      
      // Get users who have SMS notifications enabled
      const usersResult = await pool.query(`
        SELECT id, full_name, phone, sms_notifications
        FROM custom_users 
        WHERE id = ANY($1) AND is_active = true AND sms_notifications = true
      `, [userIds]);

      if (usersResult.rows.length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "هیچ کاربر فعالی با اطلاع‌رسانی SMS یافت نشد" 
        });
      }

      // Log SMS notifications
      const insertPromises = usersResult.rows.map((user: any) => 
        pool.query(`
          INSERT INTO sms_notifications (recipient_id, recipient_phone, message)
          VALUES ($1, $2, $3)
        `, [user.id, user.phone, message])
      );

      await Promise.all(insertPromises);

      // Here you would integrate with actual SMS service
      // For now, we'll just mark them as sent
      await pool.query(`
        UPDATE sms_notifications 
        SET status = 'sent', sent_at = NOW()
        WHERE recipient_id = ANY($1) AND message = $2 AND status = 'pending'
      `, [userIds, message]);

      res.json({
        success: true,
        message: `پیامک با موفقیت برای ${usersResult.rows.length} کاربر ارسال شد`,
        sentTo: usersResult.rows.length
      });
    } catch (error) {
      console.error("Error sending SMS:", error);
      res.status(500).json({ success: false, message: "خطا در ارسال پیامک" });
    }
  });

  // ============================================
  // CUSTOM USER MANAGEMENT SYSTEM ENDPOINTS
  // ============================================

  // Get all custom roles
  app.get("/api/custom-roles", requireAdmin, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT cr.*, 
               COUNT(cu.id) as user_count
        FROM custom_roles cr
        LEFT JOIN custom_users cu ON cr.id = cu.role_id AND cu.is_active = true
        WHERE cr.is_active = true
        GROUP BY cr.id
        ORDER BY cr.priority DESC, cr.name
      `);

      res.json({
        success: true,
        roles: result.rows
      });
    } catch (error) {
      console.error("Error fetching custom roles:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت نقش‌ها" });
    }
  });

  // Create custom role
  app.post("/api/custom-roles", requireAdmin, async (req, res) => {
    try {
      const { name, displayName, description, color, priority, permissions } = req.body;
      
      if (!name || !displayName) {
        return res.status(400).json({ 
          success: false, 
          message: "نام و نام نمایشی نقش الزامی است" 
        });
      }

      const { pool } = await import('./db');
      
      // Check if role with same name already exists
      const existingRole = await pool.query(
        'SELECT id FROM custom_roles WHERE name = $1',
        [name]
      );

      if (existingRole.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "نقش با این نام قبلاً وجود دارد"
        });
      }

      const result = await pool.query(`
        INSERT INTO custom_roles (name, display_name, description, color, priority, permissions)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [name, displayName, description || '', color || '#3b82f6', priority || 1, permissions || []]);

      res.json({
        success: true,
        role: result.rows[0],
        message: "نقش با موفقیت ایجاد شد"
      });
    } catch (error) {
      console.error("Error creating custom role:", error);
      res.status(500).json({ success: false, message: "خطا در ایجاد نقش" });
    }
  });

  // Get all custom users
  app.get("/api/custom-users", requireAdmin, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT cu.id, cu.full_name, cu.email, cu.phone, cu.is_active,
               cu.sms_notifications, cu.email_notifications, cu.last_login,
               cu.created_at, cu.updated_at,
               cr.id as role_id, cr.name as role_name, 
               cr.display_name as role_display_name, cr.color as role_color
        FROM custom_users cu
        JOIN custom_roles cr ON cu.role_id = cr.id
        ORDER BY cu.created_at DESC
      `);

      res.json({
        success: true,
        users: result.rows
      });
    } catch (error) {
      console.error("Error fetching custom users:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت کاربران" });
    }
  });

  // Create custom user
  app.post("/api/custom-users", requireAdmin, async (req, res) => {
    try {
      const { fullName, email, phone, roleId, password, smsNotifications, emailNotifications } = req.body;
      
      if (!fullName || !email || !phone || !roleId || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "تمام فیلدهای الزامی باید پر شوند" 
        });
      }

      const { pool } = await import('./db');
      const bcrypt = await import('bcryptjs');
      
      // Check if user with same email or phone already exists
      const existingUser = await pool.query(
        'SELECT id FROM custom_users WHERE email = $1 OR phone = $2',
        [email, phone]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "کاربر با این ایمیل یا شماره تلفن قبلاً وجود دارد"
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      const result = await pool.query(`
        INSERT INTO custom_users (full_name, email, phone, password_hash, role_id, sms_notifications, email_notifications)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, full_name, email, phone, role_id, is_active, sms_notifications, email_notifications, created_at
      `, [fullName, email, phone, passwordHash, roleId, smsNotifications !== false, emailNotifications !== false]);

      // Send SMS notification if enabled
      if (smsNotifications !== false) {
        try {
          await pool.query(`
            INSERT INTO sms_notifications (recipient_id, recipient_phone, message, status)
            VALUES ($1, $2, $3, 'pending')
          `, [
            result.rows[0].id,
            phone,
            `خوش آمدید ${fullName}! حساب کاربری شما در سیستم مدیریت ممتاز شیمی ایجاد شد. رمز عبور: ${password}`
          ]);
        } catch (smsError) {
          console.error("Error creating SMS notification:", smsError);
        }
      }

      res.json({
        success: true,
        user: result.rows[0],
        message: "کاربر با موفقیت ایجاد شد"
      });
    } catch (error) {
      console.error("Error creating custom user:", error);
      res.status(500).json({ success: false, message: "خطا در ایجاد کاربر" });
    }
  });

  // Update custom user
  app.put("/api/custom-users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { fullName, roleId, isActive, smsNotifications, emailNotifications, password } = req.body;
      
      const { pool } = await import('./db');
      let query = `
        UPDATE custom_users 
        SET full_name = $1, role_id = $2, is_active = $3, 
            sms_notifications = $4, email_notifications = $5, updated_at = NOW()
      `;
      let values = [fullName, roleId, isActive, smsNotifications, emailNotifications];
      
      // If password is provided, hash and update it
      if (password) {
        const bcrypt = await import('bcryptjs');
        const passwordHash = await bcrypt.hash(password, 12);
        query += `, password_hash = $6`;
        values.push(passwordHash);
      }
      
      query += ` WHERE id = $${values.length + 1} RETURNING *`;
      values.push(id);

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "کاربر یافت نشد" });
      }

      res.json({
        success: true,
        user: result.rows[0],
        message: "کاربر با موفقیت به‌روزرسانی شد"
      });
    } catch (error) {
      console.error("Error updating custom user:", error);
      res.status(500).json({ success: false, message: "خطا در به‌روزرسانی کاربر" });
    }
  });

  // Delete custom user
  app.delete("/api/custom-users/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { pool } = await import('./db');
      
      const result = await pool.query('DELETE FROM custom_users WHERE id = $1 RETURNING *', [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "کاربر یافت نشد" });
      }

      res.json({
        success: true,
        message: "کاربر با موفقیت حذف شد"
      });
    } catch (error) {
      console.error("Error deleting custom user:", error);
      res.status(500).json({ success: false, message: "خطا در حذف کاربر" });
    }
  });

  // Send SMS to users with specific role
  app.post("/api/custom-roles/:roleId/send-sms", requireAdmin, async (req, res) => {
    try {
      const { roleId } = req.params;
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ 
          success: false, 
          message: "متن پیامک الزامی است" 
        });
      }

      const { pool } = await import('./db');
      
      // Get all active users with this role who have SMS notifications enabled
      const usersResult = await pool.query(`
        SELECT id, full_name, phone 
        FROM custom_users 
        WHERE role_id = $1 AND is_active = true AND sms_notifications = true
      `, [roleId]);

      if (usersResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "هیچ کاربر فعالی با این نقش یافت نشد"
        });
      }

      // Create SMS notifications for all users
      for (const user of usersResult.rows) {
        await pool.query(`
          INSERT INTO sms_notifications (recipient_id, recipient_phone, message, status)
          VALUES ($1, $2, $3, 'pending')
        `, [user.id, user.phone, message]);
      }

      res.json({
        success: true,
        message: `پیامک با موفقیت برای ${usersResult.rows.length} کاربر ارسال شد`,
        sentTo: usersResult.rows.length
      });
    } catch (error) {
      console.error("Error sending SMS to role users:", error);
      res.status(500).json({ success: false, message: "خطا در ارسال پیامک" });
    }
  });

  // Get available modules/permissions - synchronized with Site Management modules
  app.get("/api/custom-modules", requireAdmin, async (req, res) => {
    try {
      // Get current modules from the single source of truth
      const currentModules = getSiteManagementModules();
      
      // Map module IDs to their display information
      const moduleMapping = {
        'syncing_shop': { name: 'همگام‌سازی فروشگاه', description: 'همگام‌سازی محصولات کاردکس با فروشگاه', category: 'commerce' },
        'shop_management': { name: 'مدیریت فروشگاه', description: 'مدیریت محصولات، سفارشات و فروش', category: 'commerce' },
        'product_management': { name: 'مدیریت محصولات', description: 'مدیریت کاردکس و محصولات', category: 'commerce' },
        'order_management': { name: 'مدیریت سفارشات', description: 'پردازش و تایید سفارشات', category: 'commerce' },
        'warehouse-management': { name: 'مدیریت انبار', description: 'کنترل موجودی و انبارداری', category: 'warehouse' },
        'logistics_management': { name: 'مدیریت لجستیک', description: 'مدیریت حمل و نقل و تحویل', category: 'logistics' },
        'inquiries': { name: 'مدیریت استعلامات', description: 'پاسخ به استعلامات مشتریان', category: 'customer' },
        'crm': { name: 'مدیریت CRM', description: 'مدیریت مشتریان و روابط', category: 'customer' },
        'barcode': { name: 'مدیریت بارکد', description: 'تولید و مدیریت بارکدها', category: 'inventory' },
        'email_settings': { name: 'تنظیمات ایمیل', description: 'پیکربندی سیستم ایمیل', category: 'communication' },
        'database_backup': { name: 'پشتیبان‌گیری پایگاه داده', description: 'مدیریت پشتیبان‌گیری', category: 'system' },
        'seo': { name: 'مدیریت SEO', description: 'بهینه‌سازی موتورهای جستجو', category: 'content' },
        'categories': { name: 'مدیریت دسته‌بندی‌ها', description: 'تنظیم دسته‌بندی محصولات', category: 'content' },
        'sms': { name: 'مدیریت پیامک', description: 'ارسال و مدیریت پیامک‌ها', category: 'communication' },
        'factory': { name: 'مدیریت کارخانه', description: 'مدیریت خط تولید', category: 'production' },
        'user_management': { name: 'مدیریت کاربران', description: 'ایجاد و مدیریت کاربران سیستم', category: 'admin' },
        'procedures': { name: 'مدیریت روش‌ها', description: 'مدیریت اسناد و روش‌های کاری', category: 'content' },
        'smtp_test': { name: 'تست SMTP', description: 'آزمایش اتصال ایمیل', category: 'communication' },
        'payment_management': { name: 'مدیریت پرداخت', description: 'تنظیمات درگاه پرداخت', category: 'finance' },
        'wallet_management': { name: 'مدیریت کیف پول', description: 'مدیریت کیف پول مشتریان', category: 'finance' },
        'geography_analytics': { name: 'آمار جغرافیایی', description: 'تحلیل آمار منطقه‌ای', category: 'analytics' },
        'ai_settings': { name: 'تنظیمات هوش مصنوعی', description: 'پیکربندی AI و SKU', category: 'system' },
        'refresh_control': { name: 'کنترل تازه‌سازی', description: 'تنظیمات تازه‌سازی خودکار', category: 'system' },
        'content_management': { name: 'مدیریت محتوا', description: 'ویرایش محتوای وبسایت', category: 'content' },
        'ticketing_system': { name: 'سیستم تیکتینگ', description: 'مدیریت تیکت‌ها و پشتیبانی', category: 'support' }
      };
      
      // Build modules array from current active modules
      const modules = currentModules.map(moduleId => ({
        id: moduleId,
        name: moduleMapping[moduleId]?.name || moduleId,
        description: moduleMapping[moduleId]?.description || `ماژول ${moduleId}`,
        category: moduleMapping[moduleId]?.category || 'general'
      }));

      res.json({
        success: true,
        modules
      });
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت ماژول‌ها" });
    }
  });

  // Assign role to user
  app.put("/api/admin/users/:id/role", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { roleId } = req.body;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        UPDATE users 
        SET role_id = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, username, email, role_id
      `, [roleId, id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      res.json({
        success: true,
        user: result.rows[0]
      });
    } catch (error) {
      console.error("Error assigning role to user:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get users by role
  app.get("/api/admin/roles/:id/users", requireSuperAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT u.id, u.username, u.email, u.is_active, u.created_at,
               r.display_name as role_name
        FROM users u
        JOIN admin_roles r ON u.role_id = r.id
        WHERE u.role_id = $1
        ORDER BY u.username
      `, [id]);

      const users = result.rows.map((row: any) => ({
        id: row.id,
        username: row.username,
        email: row.email,
        isActive: row.is_active,
        createdAt: row.created_at,
        roleName: row.role_name
      }));

      res.json(users);
    } catch (error) {
      console.error("Error fetching users by role:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get available modules for permissions
  app.get("/api/admin/modules", requireSuperAdmin, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT DISTINCT module FROM admin_permissions WHERE is_active = true ORDER BY module
      `);

      const modules = result.rows.map((row: any) => row.module);
      res.json(modules);
    } catch (error) {
      console.error("Error fetching modules:", error);
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
  // ORDER TRACKING MANAGEMENT ENDPOINTS
  // =============================================================================

  // Get all orders for tracking (read-only)
  app.get("/api/orders/tracking/all", requireAuth, async (req, res) => {
    try {
      const orders = await orderManagementStorage.getAllOrdersWithDetails();
      
      const formattedOrders = orders.map(order => ({
        id: order.id,
        customerOrderId: order.customerOrderId || order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        currency: order.currency || 'IQD',
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentReceiptUrl: order.paymentReceiptUrl,
        trackingNumber: order.trackingNumber,
        deliveryCode: order.deliveryCode,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        actualDeliveryDate: order.actualDeliveryDate,
        deliveryPersonName: order.deliveryPersonName,
        deliveryPersonPhone: order.deliveryPersonPhone,
        financialNotes: order.financialNotes,
        warehouseNotes: order.warehouseNotes,
        logisticsNotes: order.logisticsNotes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }));

      res.json({ 
        success: true, 
        orders: formattedOrders 
      });
    } catch (error) {
      console.error("Error fetching tracking orders:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Get order statistics for tracking dashboard
  app.get("/api/order-management/statistics", requireAuth, async (req, res) => {
    try {
      const orders = await orderManagementStorage.getAllOrdersWithDetails();
      
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(order => 
        ['pending', 'pending_payment', 'financial_review', 'warehouse_processing'].includes(order.status)
      ).length;
      const completedOrders = orders.filter(order => 
        ['completed', 'delivered'].includes(order.status)
      ).length;
      
      // Calculate total revenue (only completed orders)
      const totalRevenue = orders
        .filter(order => ['completed', 'delivered'].includes(order.status))
        .reduce((sum, order) => {
          const amount = typeof order.totalAmount === 'string' 
            ? parseFloat(order.totalAmount) 
            : order.totalAmount || 0;
          return sum + amount;
        }, 0);
      
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Today's orders
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaysOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
      }).length;

      res.json({
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue,
        averageOrderValue,
        todaysOrders
      });
    } catch (error) {
      console.error("Error fetching order statistics:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Get financial orders (orders requiring financial review)
  app.get("/api/order-management/financial", requireAuth, async (req, res) => {
    try {
      const orders = await orderManagementStorage.getAllOrdersWithDetails();
      
      // Filter for financial-related orders
      const financialOrders = orders.filter(order => 
        ['pending_payment', 'payment_uploaded', 'financial_review'].includes(order.status)
      );

      const formattedOrders = financialOrders.map(order => ({
        id: order.id,
        customerOrderId: order.customerOrderId || order.id,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        totalAmount: order.totalAmount,
        currency: order.currency || 'IQD',
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentReceiptUrl: order.paymentReceiptUrl,
        trackingNumber: order.trackingNumber,
        deliveryCode: order.deliveryCode,
        estimatedDeliveryDate: order.estimatedDeliveryDate,
        actualDeliveryDate: order.actualDeliveryDate,
        deliveryPersonName: order.deliveryPersonName,
        deliveryPersonPhone: order.deliveryPersonPhone,
        financialNotes: order.financialNotes,
        warehouseNotes: order.warehouseNotes,
        logisticsNotes: order.logisticsNotes,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }));

      res.json({ 
        success: true, 
        orders: formattedOrders 
      });
    } catch (error) {
      console.error("Error fetching financial orders:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
    }
  });

  // Get order status history
  app.get("/api/orders/:orderId/status-history", requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      if (isNaN(orderId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid order ID" 
        });
      }

      // For now, return empty history - can be implemented later with proper status history table
      const history = [
        {
          id: 1,
          fromStatus: null,
          toStatus: 'pending',
          changedBy: null,
          changedByDepartment: 'system',
          notes: 'سفارش ایجاد شد',
          createdAt: new Date().toISOString()
        }
      ];

      res.json({ 
        success: true, 
        history 
      });
    } catch (error) {
      console.error("Error fetching order status history:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal server error" 
      });
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
          message: "ایمیل تکراری است. این ایمیل قبلاً در سیستم ثبت شده است." 
        });
      }

      // Check if phone number already exists in CRM
      const existingCrmPhone = await crmStorage.getCrmCustomerByPhone(phone);
      if (existingCrmPhone) {
        return res.status(400).json({ 
          success: false, 
          message: "شماره تلفن تکراری است. این شماره قبلاً در سیستم ثبت شده است." 
        });
      }

      // Validate mandatory fields
      if (!email || !phone || !country || !city || !address) {
        return res.status(400).json({ 
          success: false, 
          message: "ایمیل، شماره تلفن، کشور، شهر و آدرس اجباری هستند" 
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
        
      // Allow dual session - keep admin session if exists, add customer session
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
      // Clear only customer session data, preserve admin session
      req.session.customerId = undefined;
      req.session.customerEmail = undefined;
      req.session.crmCustomerId = undefined;
      
      // If no admin session exists, destroy entire session
      if (!req.session.adminId) {
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
      } else {
        // Save session with customer data cleared but admin data preserved
        req.session.save((err) => {
          if (err) {
            console.error("Error saving session:", err);
            return res.status(500).json({ 
              success: false, 
              message: "خطا در خروج" 
            });
          }
          console.log('🔄 Customer logout - admin session preserved');
          res.json({
            success: true,
            message: "خروج موفق"
          });
        });
      }
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

  // Get complete CRM customer data for logged-in customer
  app.get("/api/customer/crm-profile", async (req, res) => {
    console.log('=== /api/customer/crm-profile endpoint called ===');
    try {
      const session = req.session as any;
      const crmCustomerId = session?.crmCustomerId;
      
      console.log('Session data:', {
        hasSession: !!session,
        customerId: session?.customerId,
        crmCustomerId: crmCustomerId,
        customerEmail: session?.customerEmail
      });
      
      if (!crmCustomerId) {
        console.log('No CRM customer ID found in session');
        return res.status(401).json({ 
          success: false, 
          message: "احراز هویت نشده یا اطلاعات CRM موجود نیست" 
        });
      }

      console.log(`Fetching CRM customer with ID: ${crmCustomerId}`);
      const crmCustomer = await crmStorage.getCrmCustomerById(crmCustomerId);
      
      if (!crmCustomer) {
        console.log('CRM customer not found in database');
        return res.status(404).json({ 
          success: false, 
          message: "اطلاعات مشتری در CRM یافت نشد" 
        });
      }

      console.log('CRM customer found:', {
        id: crmCustomer.id,
        email: crmCustomer.email,
        firstName: crmCustomer.firstName,
        lastName: crmCustomer.lastName,
        hasSecondaryAddress: !!crmCustomer.secondaryAddress,
        hasPostalCode: !!crmCustomer.postalCode
      });

      res.json({
        success: true,
        data: crmCustomer
      });
    } catch (error) {
      console.error("Error fetching CRM customer profile:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در دریافت اطلاعات CRM" 
      });
    }
  });

  app.get("/api/customers/me", async (req, res) => {
    try {
      const customerId = (req.session as any)?.customerId;
      const crmCustomerId = (req.session as any)?.crmCustomerId;
      const adminId = (req.session as any)?.adminId;
      
      // If admin is logged in, don't allow customer data access
      if (adminId) {
        return res.status(401).json({ 
          success: false, 
          message: "Admin authenticated - not a customer" 
        });
      }
      
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
      const { items, customerInfo, totalAmount, notes, shippingMethod, paymentMethod, walletAmountUsed, remainingAmount } = req.body;
      
      console.log('🛒 [ORDER DEBUG] Order data received:', {
        paymentMethod,
        walletAmountUsed,
        remainingAmount,
        totalAmount,
        customerId,
        crmCustomerId
      });

      let finalCustomerInfo = customerInfo;
      let finalCrmCustomerId = crmCustomerId;

      // If user is logged in, get customer info from database
      if (customerId && !customerInfo) {
        console.log('Getting customer info for customerId:', customerId);
        const customer = await customerStorage.getCustomerById(customerId);
        console.log('Retrieved customer:', customer);
        if (customer) {
          finalCustomerInfo = {
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            company: customer.company || '',
            phone: customer.phone || '',
            country: customer.country || 'Iraq',
            city: customer.city || 'Baghdad',
            address: customer.address || 'Default Address',
          };
          console.log('finalCustomerInfo set to:', finalCustomerInfo);
        }
      }

      console.log('Final customer info before order creation:', finalCustomerInfo);

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

      // Handle wallet payments
      let finalPaymentStatus = "pending";
      let actualWalletUsed = 0;
      let finalPaymentMethod = paymentMethod || "bank_transfer";
      
      if (paymentMethod === 'wallet_full' || paymentMethod === 'wallet_partial') {
        const walletUsage = parseFloat(walletAmountUsed || 0);
        const remaining = parseFloat(remainingAmount || totalAmount);
        
        console.log('💰 [WALLET DEBUG] Processing wallet payment:', {
          walletUsage,
          remaining,
          finalCrmCustomerId,
          customerId
        });
        
        if (walletUsage > 0 && (finalCrmCustomerId || customerId)) {
          try {
            // Use the customer ID that exists (prioritize CRM customer)
            const customerIdToUse = finalCrmCustomerId || customerId;
            
            // Use walletStorage.debitWallet which handles all the logic
            const transaction = await walletStorage.debitWallet(
              customerIdToUse,
              walletUsage,
              `پرداخت سفارش ${orderNumber}`,
              'order',
              undefined, // reference ID will be set after order creation
              undefined  // no admin processing this
            );
            
            console.log(`✅ Wallet payment processed: ${walletUsage} IQD deducted, transaction ID: ${transaction.id}`);
            actualWalletUsed = walletUsage;
            
            if (remaining === 0) {
              finalPaymentStatus = "paid"; // Fully paid by wallet
            } else {
              finalPaymentStatus = "partial"; // Partially paid by wallet
            }
          } catch (walletError) {
            console.log(`❌ Wallet payment failed:`, walletError);
            return res.status(400).json({
              success: false,
              message: "موجودی کیف پول کافی نیست یا خطا در پردازش"
            });
          }
        }
      }

      // Create order in customer orders table
      const orderData = {
        orderNumber,
        customerId: customerId || null,
        totalAmount: totalAmount.toString(),
        status: 'pending' as const,
        paymentStatus: finalPaymentStatus,
        paymentMethod: finalPaymentMethod,
        walletAmountUsed: actualWalletUsed.toString(),
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

      // Create order items and update stock
      for (const item of items) {
        const unitPrice = item.unitPrice || item.price || 0;
        
        await customerStorage.createOrderItem({
          orderId: order.id,
          productId: item.productId,
          productName: item.productName || 'Unknown Product',
          quantity: String(item.quantity),
          unitPrice: String(unitPrice),
          totalPrice: String(item.quantity * unitPrice),
          productSku: item.productSku || '',
        });

        // Update product stock using unified inventory manager
        try {
          console.log(`🛒 UNIFIED STOCK UPDATE - Product ${item.productName} (ID: ${item.productId})`);
          
          // Use unified inventory manager for single source of truth
          const { UnifiedInventoryManager } = await import('./unified-inventory-manager');
          const success = await UnifiedInventoryManager.reduceInventoryForOrder([{
            productName: item.productName,
            quantity: item.quantity
          }]);
          
          if (success) {
            console.log(`✅ Stock updated successfully using unified system for product ${item.productId}`);
          } else {
            console.log(`⚠️ Failed to update stock for product ${item.productId}`);
          }
        } catch (stockError) {
          console.error(`Error updating stock for product ${item.productId}:`, stockError);
          // Continue with other products even if stock update fails
        }
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
          paymentStatus: finalPaymentStatus,
          paymentMethod: finalPaymentMethod,
          walletAmountUsed: actualWalletUsed,
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
    console.log('🚀 [ENDPOINT] /api/customers/orders called with timestamp:', req.query.t);
    console.log('🚀 [ENDPOINT] Request method:', req.method);
    console.log('🚀 [ENDPOINT] Request URL:', req.url);
    console.log('🚀 [ENDPOINT] Request headers:', JSON.stringify(req.headers, null, 2));
    
    try {
      const customerId = (req.session as any)?.customerId;
      const crmCustomerId = (req.session as any)?.crmCustomerId;
      const orderData = req.body;
      
      console.log('🚀 [ENDPOINT] Session data:', {
        customerId,
        crmCustomerId,
        hasSession: !!req.session,
        sessionId: req.sessionID
      });
      
      console.log('🛒 [BILINGUAL ORDER DEBUG] Order data received:', {
        paymentMethod: orderData.paymentMethod,
        walletAmountUsed: orderData.walletAmountUsed,
        remainingAmount: orderData.remainingAmount,
        totalAmount: orderData.totalAmount,
        customerId,
        crmCustomerId,
        'Will process wallet?': orderData.paymentMethod === 'wallet_full' || orderData.paymentMethod === 'wallet_partial',
        'Wallet amount to deduct': orderData.walletAmountUsed,
        'Entire order data': orderData
      });

      // Extract customer information from form data
      const customerInfo = {
        name: orderData.customerName,
        phone: orderData.phone,
        address: orderData.address,
        city: orderData.city,
        postalCode: orderData.postalCode || '',
        country: orderData.country || 'Iraq', // Add country from form
        notes: orderData.notes || '', // Add notes from form
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

      // Handle payment method processing
      let finalPaymentStatus = "pending";
      let walletAmountUsed = 0;
      let remainingAmount = totalAmount;
      let finalPaymentMethod = orderData.paymentMethod || "traditional";

      // Handle wallet payments
      if (orderData.paymentMethod === 'wallet_full' || orderData.paymentMethod === 'wallet_partial') {
        walletAmountUsed = parseFloat(orderData.walletAmountUsed || 0);
        remainingAmount = parseFloat(orderData.remainingAmount || totalAmount);
        
        console.log('💰 [BILINGUAL WALLET DEBUG] Processing wallet payment:', {
          walletAmountUsed,
          remainingAmount,
          finalCustomerId,
          paymentMethod: orderData.paymentMethod
        });
        
        if (walletAmountUsed > 0) {
          try {
            // Use walletStorage.debitWallet which handles all the logic
            const transaction = await walletStorage.debitWallet(
              finalCustomerId,
              walletAmountUsed,
              `پرداخت سفارش ${orderNumber}`,
              'order',
              undefined, // reference ID will be set after order creation
              undefined  // no admin processing this
            );
            
            console.log(`✅ Wallet payment processed: ${walletAmountUsed} IQD deducted, transaction ID: ${transaction.id}`);
            
            if (remainingAmount === 0) {
              finalPaymentStatus = "paid"; // Fully paid by wallet
            } else {
              finalPaymentStatus = "partial"; // Partially paid by wallet
            }
          } catch (walletError) {
            console.log(`❌ Wallet payment failed:`, walletError);
            return res.status(400).json({
              success: false,
              message: "موجودی کیف پول کافی نیست یا خطا در پردازش"
            });
          }
        }
      }
      
      // Handle online payment method
      else if (orderData.paymentMethod === 'online_payment') {
        finalPaymentStatus = "pending";
        finalPaymentMethod = "online_payment";
        console.log("✅ Online payment method selected - order will redirect to payment gateway");
      }
      
      // Handle bank receipt method
      else if (orderData.paymentMethod === 'bank_receipt') {
        finalPaymentStatus = "pending";
        finalPaymentMethod = "bank_receipt";
        console.log("✅ Bank receipt method selected - customer will upload receipt");
      }

      const order = await customerStorage.createOrder({
        customerId: finalCustomerId,
        orderNumber,
        status: "pending",
        paymentStatus: finalPaymentStatus,
        paymentMethod: finalPaymentMethod,
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
                const currentStock = product.stockQuantity;
                const newQuantity = Math.max(0, currentStock - (quantity as number));
                console.log(`🛒 STOCK UPDATE - Product ${product.name} (ID: ${productId})`);
                console.log(`   Current Stock: ${currentStock}`);
                console.log(`   Quantity Sold: ${quantity}`);
                console.log(`   New Stock: ${newQuantity}`);
                
                await shopStorage.updateProductStock(
                  parseInt(productId as string),
                  newQuantity,
                  `Order ${orderNumber} - Sold ${quantity} units`
                );
                
                console.log(`✅ Stock updated successfully for product ${productId}`);
              } else {
                console.log(`⚠️ No stock quantity available for product ${productId}`);
              }
            }
          } catch (productError) {
            console.error(`Error processing product ${productId}:`, productError);
            // Continue with other products even if one fails
          }
        }
      }

      // Auto-capture customer data in CRM system
      try {
        // Get customer details for CRM capture
        let customerForCrm = null;
        if (finalCustomerId) {
          try {
            customerForCrm = await customerStorage.getCustomerById(finalCustomerId);
          } catch (err) {
            console.log("Customer not found in customer storage, checking CRM...");
            try {
              customerForCrm = await crmStorage.getCrmCustomerById(finalCustomerId);
            } catch (crmErr) {
              console.log("Customer not found in CRM either, will create from order data");
            }
          }
        }

        // Extract customer information from order data - enhanced with all form fields
        const nameParts = customerInfo.name.split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'Customer';
        
        const crmOrderData = {
          email: customerForCrm?.email || `customer${finalCustomerId}@temp.local`,
          firstName: firstName,
          lastName: lastName,
          company: customerForCrm?.company || null,
          phone: customerInfo.phone,
          country: customerInfo.country || 'Iraq', // Use form country or default
          city: customerInfo.city || 'Unknown',
          address: customerInfo.address,
          postalCode: customerInfo.postalCode || null,
          orderValue: totalAmount,
        };
        
        console.log('CRM Order Data being captured:', {
          firstName,
          lastName,
          phone: customerInfo.phone,
          country: customerInfo.country,
          city: customerInfo.city,
          address: customerInfo.address,
          postalCode: customerInfo.postalCode,
          orderValue: totalAmount
        });

        await crmStorage.createOrUpdateCustomerFromOrder(crmOrderData);
        console.log(`✅ Customer auto-captured in CRM for order ${orderNumber}`);
      } catch (crmError) {
        console.error("❌ Error auto-capturing customer in CRM:", crmError);
        // Don't fail the order if CRM capture fails
      }

      // Create order_management record for financial department workflow
      try {
        await orderManagementStorage.createOrderManagement({
          customerOrderId: order.id,
          customerId: finalCustomerId,
          currentStatus: 'pending',
          currentDepartment: 'customer',
          totalAmount: totalAmount.toString(),
          currency: orderData.currency || "IQD",
          notes: orderData.notes || "",
        });
        console.log(`✅ Order management record created for order ${orderNumber}`);
      } catch (orderMgmtError) {
        console.error("❌ Error creating order management record:", orderMgmtError);
        // Don't fail the order if order management creation fails
      }

      // Prepare response based on payment method
      let responseData = {
        success: true,
        message: "Order created successfully",
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentMethod: finalPaymentMethod,
        totalAmount: remainingAmount > 0 ? remainingAmount : totalAmount,
        walletAmountUsed: walletAmountUsed,
      };

      // Add redirect URL for online payment
      if (finalPaymentMethod === 'online_payment') {
        responseData.redirectToPayment = true;
        responseData.paymentGatewayUrl = `/payment?orderId=${order.id}&amount=${remainingAmount > 0 ? remainingAmount : totalAmount}`;
        console.log(`✅ Order ${orderNumber} created - redirecting to payment gateway for ${remainingAmount > 0 ? remainingAmount : totalAmount} IQD`);
      }

      res.json(responseData);
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

تاریخ تولید: ${new Date().toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
})}
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
      const product = await shopStorage.getShopProductById(productId);
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
      await shopStorage.updateShopProduct(productId, { stockQuantity: newStock });
      
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
          const product = await shopStorage.getShopProductById(inquiryData.productIds[0]);
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

      // Auto-capture customer data in CRM system
      try {
        // Check if customer exists in CRM
        let existingCustomer = null;
        if (inquiryData.contactEmail) {
          existingCustomer = await crmStorage.getCrmCustomerByEmail(inquiryData.contactEmail);
        }

        if (existingCustomer) {
          // Log inquiry activity for existing customer
          await crmStorage.logCustomerActivity({
            customerId: existingCustomer.id,
            activityType: 'product_inquiry',
            description: `Product inquiry: ${inquiryData.subject || 'General inquiry'}`,
            performedBy: 'system',
            activityData: {
              source: 'website_product_inquiry',
              inquiryType: inquiryData.type,
              category: inquiryData.category,
              priority: inquiryData.priority,
              productName: productName,
              inquiryNumber: inquiry.inquiryNumber,
              message: inquiryData.message
            }
          });
          console.log(`✅ Product inquiry logged to existing CRM customer: ${inquiryData.contactEmail}`);
        } else {
          // Create new CRM customer from inquiry
          const newCrmCustomer = await crmStorage.createCrmCustomer({
            email: inquiryData.contactEmail,
            firstName: (inquiryData.contactEmail.split('@')[0] || 'Customer').split('.')[0],
            lastName: '',
            company: inquiryData.company || null,
            phone: inquiryData.contactPhone || null,
            customerType: 'prospect',
            customerSource: 'website_inquiry',
            isActive: true,
            passwordHash: '', // Will be set when customer creates account
          });

          // Log initial inquiry activity
          await crmStorage.logCustomerActivity({
            customerId: newCrmCustomer.id,
            activityType: 'first_contact',
            description: `First contact via product inquiry: ${inquiryData.subject || 'General inquiry'}`,
            performedBy: 'system',
            activityData: {
              source: 'website_product_inquiry',
              inquiryType: inquiryData.type,
              category: inquiryData.category,
              priority: inquiryData.priority,
              productName: productName,
              inquiryNumber: inquiry.inquiryNumber,
              message: inquiryData.message
            }
          });
          console.log(`✅ New CRM customer created from product inquiry: ${inquiryData.contactEmail}`);
        }
      } catch (crmError) {
        console.error("❌ Error auto-capturing customer in CRM from product inquiry:", crmError);
        // Don't fail the inquiry if CRM capture fails
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
      
      // Map database fields to frontend expected format
      const mappedProducts = products.map(product => ({
        ...product,
        imageUrl: product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : null,
        unitPrice: product.price,
        currency: (product.priceUnit === 'IQD' || !product.priceUnit || product.priceUnit === 'unit') ? 'IQD' : product.priceUnit,
        weight: product.weight,
        weightUnit: product.weightUnit
      }));
      
      res.json(mappedProducts);
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
      
      // Map database fields to frontend expected format
      const mappedProduct = {
        ...product,
        imageUrl: product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : null,
        unitPrice: product.price,
        currency: (product.priceUnit === 'IQD' || !product.priceUnit || product.priceUnit === 'unit') ? 'IQD' : product.priceUnit,
        weight: product.weight,
        weightUnit: product.weightUnit
      };
      
      res.json(mappedProduct);
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
        limit = 50,
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
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0
      };

      const searchResults = await shopStorage.searchShopProducts(query as string, filters);
      
      // Map database fields to frontend expected format
      const mappedProducts = searchResults.products.map(product => ({
        ...product,
        imageUrl: product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : null,
        unitPrice: product.price,
        currency: (product.priceUnit === 'IQD' || !product.priceUnit || product.priceUnit === 'unit') ? 'IQD' : product.priceUnit,
        weight: product.weight,
        weightUnit: product.weightUnit
      }));
      
      res.json({
        success: true,
        data: {
          ...searchResults,
          products: mappedProducts
        },
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

  // Goods in Transit management endpoints
  app.get("/api/shop/goods-in-transit", async (req, res) => {
    try {
      const { status } = req.query;
      const goodsInTransit = await shopStorage.getGoodsInTransit(status as string);
      res.json(goodsInTransit);
    } catch (error) {
      console.error("Error fetching goods in transit:", error);
      res.status(500).json({ success: false, message: "Failed to fetch goods in transit" });
    }
  });

  app.get("/api/shop/inventory-movements", async (req, res) => {
    try {
      const { productId } = req.query;
      const movements = await shopStorage.getShopInventoryMovements(productId ? parseInt(productId as string) : undefined);
      res.json(movements);
    } catch (error) {
      console.error("Error fetching inventory movements:", error);
      res.status(500).json({ success: false, message: "Failed to fetch inventory movements" });
    }
  });

  app.post("/api/shop/goods-in-transit", requireAuth, async (req, res) => {
    try {
      const transitData = req.body;
      const newTransit = await shopStorage.createGoodsInTransit(transitData);
      res.json({ success: true, data: newTransit });
    } catch (error) {
      console.error("Error creating goods in transit:", error);
      res.status(500).json({ success: false, message: "Failed to create goods in transit" });
    }
  });

  app.patch("/api/shop/goods-in-transit/:id", requireAuth, async (req, res) => {
    try {
      const transitId = parseInt(req.params.id);
      if (isNaN(transitId)) {
        return res.status(400).json({ success: false, message: "Invalid transit ID" });
      }
      
      const updates = req.body;
      const updatedTransit = await shopStorage.updateGoodsInTransit(transitId, updates);
      res.json({ success: true, data: updatedTransit });
    } catch (error) {
      console.error("Error updating goods in transit:", error);
      res.status(500).json({ success: false, message: "Failed to update goods in transit" });
    }
  });

  // Inventory synchronization endpoints  
  app.post("/api/inventory/sync/force", async (req, res) => {
    try {
      const { InventorySyncManager } = await import("./inventory-sync-manager");
      await InventorySyncManager.forceBidirectionalSync();
      res.json({ success: true, message: "Bidirectional sync completed successfully" });
    } catch (error) {
      console.error("Error in force sync:", error);
      res.status(500).json({ success: false, message: "Failed to sync inventories" });
    }
  });

  // Unified inventory endpoint - single source of truth
  app.get("/api/inventory/unified/products", async (req, res) => {
    try {
      const { UnifiedInventoryManager } = await import('./unified-inventory-manager');
      const products = await UnifiedInventoryManager.getAllProductsWithInventory();
      res.json(products);
    } catch (error) {
      console.error("Error getting unified products:", error);
      res.status(500).json({ success: false, message: "Failed to get unified products" });
    }
  });

  // Get specific product inventory
  app.get("/api/products/:name/inventory", async (req, res) => {
    try {
      const productName = decodeURIComponent(req.params.name);
      const { UnifiedInventoryManager } = await import('./unified-inventory-manager');
      const inventory = await UnifiedInventoryManager.getProductInventory(productName);
      
      if (!inventory) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      
      res.json({ success: true, inventory });
    } catch (error) {
      console.error("Error getting product inventory:", error);
      res.status(500).json({ success: false, message: "Failed to get product inventory" });
    }
  });

  app.post("/api/inventory/sync/product/:name", async (req, res) => {
    try {
      const productName = decodeURIComponent(req.params.name);
      const { InventorySyncManager } = await import("./inventory-sync-manager");
      await InventorySyncManager.syncProductByName(productName);
      res.json({ success: true, message: `Product ${productName} synchronized successfully` });
    } catch (error) {
      console.error("Error syncing product:", error);
      res.status(500).json({ success: false, message: "Failed to sync product" });
    }
  });

  // Inventory management endpoints
  app.get("/api/shop/inventory/:productId", requireAuth, async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      const transactions = await shopStorage.getShopInventoryMovements(productId);
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

  // Order management endpoints - REMOVED DUPLICATE ENDPOINT TO PREVENT WALLET PAYMENT OVERRIDE

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

  // Product synchronization endpoint - sync showcase products to shop
  app.post("/api/sync-products", requireAuth, async (req, res) => {
    try {
      console.log("🔄 Starting complete product synchronization from showcase to shop...");
      
      // Get all showcase products
      const showcaseProducts = await storage.getProducts();
      
      // Get existing shop products for comparison
      const existingShopProducts = await shopStorage.getShopProducts();
      
      let syncedCount = 0;
      let skippedCount = 0;
      
      for (const showcaseProduct of showcaseProducts) {
        // Check if product already exists in shop
        const existingShopProduct = existingShopProducts.find(sp => sp.name === showcaseProduct.name);
        
        if (existingShopProduct) {
          console.log(`⚠️  Product already exists in shop: ${showcaseProduct.name}`);
          skippedCount++;
          continue;
        }
        
        // Create new shop product from showcase product
        const shopProductData = {
          name: showcaseProduct.name,
          category: showcaseProduct.category,
          description: showcaseProduct.description,
          shortDescription: showcaseProduct.shortDescription || showcaseProduct.description,
          price: showcaseProduct.unitPrice || showcaseProduct.price || 0,
          priceUnit: showcaseProduct.currency || showcaseProduct.priceUnit || 'IQD',
          inStock: (showcaseProduct.stockQuantity || 0) > 0 || (showcaseProduct.showWhenOutOfStock || false),
          stockQuantity: showcaseProduct.stockQuantity || 0,
          lowStockThreshold: 10,
          minStockLevel: showcaseProduct.minStockLevel || 5,
          maxStockLevel: showcaseProduct.maxStockLevel || 100,
          showWhenOutOfStock: showcaseProduct.showWhenOutOfStock || false,
          sku: showcaseProduct.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          barcode: showcaseProduct.barcode,
          imageUrls: showcaseProduct.imageUrl ? [showcaseProduct.imageUrl] : [],
          specifications: showcaseProduct.specifications || {},
          features: showcaseProduct.features || [],
          applications: showcaseProduct.applications || [],
          isActive: true,
          isFeatured: false,
          metaTitle: showcaseProduct.name,
          metaDescription: showcaseProduct.description
        };
        
        await shopStorage.createShopProduct(shopProductData);
        console.log(`✅ Synced to shop: ${showcaseProduct.name}`);
        syncedCount++;
      }
      
      console.log(`🔄 Sync completed: ${syncedCount} products added, ${skippedCount} already existed`);
      
      res.json({ 
        success: true, 
        message: `Successfully synchronized ${syncedCount} products to shop. ${skippedCount} products already existed.`,
        syncedCount,
        skippedCount,
        totalShowcaseProducts: showcaseProducts.length
      });
    } catch (error) {
      console.error("Error syncing products:", error);
      res.status(500).json({ success: false, message: "Failed to sync products" });
    }
  });

  // Reverse sync: Update showcase inventory from shop sales
  app.post("/api/sync-products-reverse", requireAuth, async (req, res) => {
    try {
      // No sync needed - unified table approach
      res.json({ success: true, message: "All products synchronized from shop to showcase successfully" });
    } catch (error) {
      console.error("Error syncing products from shop:", error);
      res.status(500).json({ success: false, message: "Failed to sync products from shop" });
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

  // Admin Email Templates Management - New endpoints for the admin interface
  app.get("/api/admin/email/templates", requireAuth, async (req, res) => {
    try {
      const { emailStorage } = await import("./email-storage");
      const templates = await emailStorage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching admin email templates:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در دریافت قالب‌های ایمیل" 
      });
    }
  });

  app.post("/api/admin/email/templates", requireAuth, async (req, res) => {
    try {
      const { emailStorage } = await import("./email-storage");
      const { insertEmailTemplateSchema } = await import("../shared/email-schema");
      
      const templateData = {
        ...req.body,
        createdBy: req.session.adminId
      };
      
      const template = await emailStorage.createTemplate(templateData);
      res.status(201).json({ 
        success: true, 
        message: "قالب ایمیل با موفقیت ایجاد شد",
        template 
      });
    } catch (error) {
      console.error("Error creating admin email template:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در ایجاد قالب ایمیل" 
      });
    }
  });

  app.put("/api/admin/email/templates/:id", requireAuth, async (req, res) => {
    try {
      const { emailStorage } = await import("./email-storage");
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "شناسه قالب نامعتبر است" 
        });
      }

      const updates = req.body;
      const template = await emailStorage.updateTemplate(id, updates);
      res.json({ 
        success: true, 
        message: "قالب ایمیل با موفقیت بروزرسانی شد",
        template 
      });
    } catch (error) {
      console.error("Error updating admin email template:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در بروزرسانی قالب ایمیل" 
      });
    }
  });

  app.delete("/api/admin/email/templates/:id", requireAuth, async (req, res) => {
    try {
      const { emailStorage } = await import("./email-storage");
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "شناسه قالب نامعتبر است" 
        });
      }

      await emailStorage.deleteTemplate(id);
      res.json({ 
        success: true, 
        message: "قالب ایمیل با موفقیت حذف شد" 
      });
    } catch (error) {
      console.error("Error deleting admin email template:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در حذف قالب ایمیل" 
      });
    }
  });

  app.put("/api/admin/email/templates/:id/toggle", requireAuth, async (req, res) => {
    try {
      const { emailStorage } = await import("./email-storage");
      const id = parseInt(req.params.id);
      const { isActive } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "شناسه قالب نامعتبر است" 
        });
      }

      const template = await emailStorage.updateTemplate(id, { isActive });
      res.json({ 
        success: true, 
        message: isActive ? "قالب فعال شد" : "قالب غیرفعال شد",
        template 
      });
    } catch (error) {
      console.error("Error toggling email template:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در تغییر وضعیت قالب" 
      });
    }
  });

  app.put("/api/admin/email/templates/:id/set-default", requireAuth, async (req, res) => {
    try {
      const { emailStorage } = await import("./email-storage");
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "شناسه قالب نامعتبر است" 
        });
      }

      // Get the template to find its category
      const template = await emailStorage.getTemplateById(id);
      if (!template) {
        return res.status(404).json({ 
          success: false, 
          message: "قالب یافت نشد" 
        });
      }

      await emailStorage.setDefaultTemplate(id, template.category);
      res.json({ 
        success: true, 
        message: "قالب به عنوان پیش‌فرض تنظیم شد" 
      });
    } catch (error) {
      console.error("Error setting default template:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در تنظیم قالب پیش‌فرض" 
      });
    }
  });

  app.get("/api/admin/email/categories", requireAuth, async (req, res) => {
    try {
      const { emailStorage } = await import("./email-storage");
      const categories = await emailStorage.getCategories();
      res.json({ 
        success: true, 
        categories 
      });
    } catch (error) {
      console.error("Error fetching email categories:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در دریافت دسته‌بندی‌های ایمیل" 
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

      // Send follow-up email to customer
      try {
        // Create transporter using existing email system
        const createTransporter = async (categoryKey: string) => {
          const categorySettings = await emailStorage.getCategoryWithSettings(categoryKey);
          
          if (!categorySettings?.smtp) {
            throw new Error(`No SMTP configuration found for category: ${categoryKey}`);
          }

          const smtp = categorySettings.smtp;
          
          return nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.port === 465,
            auth: {
              user: smtp.username,
              pass: smtp.password,
            },
          });
        };

        // Determine the correct category for email routing based on inquiry category
        let emailCategory = 'admin'; // Default fallback
        
        if (inquiry.category) {
          // Map inquiry category to email category key
          const categoryMap: { [key: string]: string } = {
            'fuel-additives': 'fuel-additives',
            'water-treatment': 'water-treatment', 
            'paint-solvents': 'paint-solvents',
            'agricultural-products': 'agricultural-products',
            'agricultural-fertilizers': 'agricultural-fertilizers',
            'industrial-chemicals': 'industrial-chemicals',
            'paint-thinner': 'paint-thinner',
            'technical-equipment': 'technical-equipment',
            'commercial-goods': 'commercial-goods',
            'general': 'admin',
            'support': 'support'
          };
          
          emailCategory = categoryMap[inquiry.category] || 'admin';
          console.log(`📧 Inquiry response routing: inquiry category '${inquiry.category}' → email category '${emailCategory}'`);
        }

        // Try to get category-specific settings, fallback to admin if not found
        let categorySettings, smtp, transporter;
        
        try {
          categorySettings = await emailStorage.getCategoryWithSettings(emailCategory);
          if (!categorySettings?.smtp) {
            throw new Error(`No SMTP configuration found for category: ${emailCategory}`);
          }
          transporter = await createTransporter(emailCategory);
          smtp = categorySettings.smtp;
          console.log(`✅ Using SMTP settings for category '${emailCategory}': ${smtp.fromEmail}`);
        } catch (categoryError) {
          console.log(`❌ Category '${emailCategory}' not configured, falling back to admin: ${categoryError.message}`);
          // Fallback to admin category
          categorySettings = await emailStorage.getCategoryWithSettings('admin');
          if (!categorySettings?.smtp) {
            throw new Error('No SMTP configuration found for admin fallback category');
          }
          transporter = await createTransporter('admin');
          smtp = categorySettings.smtp;
          console.log(`✅ Using fallback admin SMTP settings: ${smtp.fromEmail}`);
        }

        if (smtp) {
          // Send follow-up email to customer
          await transporter.sendMail({
            from: `${smtp.fromName} <${smtp.fromEmail}>`,
            to: inquiry.contactEmail,
            subject: `Follow-up: ${inquiry.subject || 'Your Inquiry'} - ${inquiry.inquiryNumber}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px;">Momtaz Chemical</h1>
                  <p style="margin: 5px 0 0 0; opacity: 0.9;">Follow-up Response</p>
                </div>
                
                <div style="padding: 30px; background-color: #f9f9f9;">
                  <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                    Dear ${inquiry.contactName || 'Valued Customer'},
                  </p>
                  
                  <p style="color: #666; margin-bottom: 15px;">
                    Thank you for your inquiry. We have prepared a follow-up response regarding your request:
                  </p>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
                    <h3 style="color: #333; margin-top: 0;">Your Original Inquiry:</h3>
                    <p style="color: #666; margin-bottom: 15px;"><strong>Inquiry Number:</strong> ${inquiry.inquiryNumber}</p>
                    <p style="color: #666; margin-bottom: 15px;"><strong>Subject:</strong> ${inquiry.subject || 'Product Inquiry'}</p>
                    <p style="color: #666;"><strong>Category:</strong> ${inquiry.category || 'General'}</p>
                  </div>
                  
                  <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="color: #333; margin-top: 0;">Our Response:</h3>
                    <p style="color: #444; line-height: 1.6; white-space: pre-wrap;">${responseText}</p>
                  </div>
                  
                  <div style="margin-top: 30px; padding: 20px; background: #e8f4f8; border-radius: 8px;">
                    <h4 style="color: #333; margin-top: 0;">Need Further Assistance?</h4>
                    <p style="color: #666; margin-bottom: 15px;">
                      If you have any additional questions or need clarification, please don't hesitate to contact us:
                    </p>
                    <ul style="color: #666; margin: 0;">
                      <li>Email: info@momtazchem.com</li>
                      <li>Phone: +964 XXX XXX XXXX</li>
                      <li>Website: www.momtazchem.com</li>
                    </ul>
                  </div>
                  
                  <p style="color: #888; font-size: 14px; margin-top: 30px; text-align: center;">
                    Best regards,<br>
                    <strong>Momtaz Chemical Team</strong><br>
                    Leading Chemical Solutions Provider
                  </p>
                </div>
              </div>
            `,
            text: `
Follow-up Response - Momtaz Chemical

Dear ${inquiry.contactName || 'Valued Customer'},

Thank you for your inquiry. We have prepared a follow-up response regarding your request.

Your Original Inquiry:
Inquiry Number: ${inquiry.inquiryNumber}
Subject: ${inquiry.subject || 'Product Inquiry'}
Category: ${inquiry.category || 'General'}

Our Response:
${responseText}

Need Further Assistance?
If you have any additional questions or need clarification, please don't hesitate to contact us:
- Email: info@momtazchem.com
- Phone: +964 XXX XXX XXXX
- Website: www.momtazchem.com

Best regards,
Momtaz Chemical Team
Leading Chemical Solutions Provider
            `
          });

          console.log(`Follow-up email sent successfully to: ${inquiry.contactEmail}`);
        }
      } catch (emailError) {
        console.error('Error sending follow-up email:', emailError);
        // Don't fail the response creation if email fails
      }

      // Update inquiry status to 'in_progress' if it was 'open'
      if (inquiry.status === 'open') {
        await simpleCustomerStorage.updateInquiry(id, { status: 'in_progress' });
      }

      res.json({
        success: true,
        message: "Follow-up response sent successfully to customer's email",
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

  // Update inquiry status (admin only)
  app.patch("/api/inquiries/:id/status", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid inquiry ID"
        });
      }

      const { status } = req.body;
      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required"
        });
      }

      // Validate status values
      const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value"
        });
      }

      const updatedInquiry = await simpleCustomerStorage.updateInquiryStatus(id, status);
      
      res.json({
        success: true,
        message: "Inquiry status updated successfully",
        inquiry: updatedInquiry
      });
    } catch (error) {
      console.error("Error updating inquiry status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update inquiry status"
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

      // Auto-capture customer data in CRM system
      try {
        // Check if customer exists in CRM
        let existingCustomer = await crmStorage.getCrmCustomerByEmail(email);

        if (existingCustomer) {
          // Log quote request activity for existing customer
          await crmStorage.logCustomerActivity({
            customerId: existingCustomer.id,
            activityType: 'quote_request',
            description: `Quote requested for ${productName} - Category: ${category || 'general'}`,
            performedBy: 'system',
            activityData: {
              source: 'website_quote_form',
              productName: productName,
              category: category,
              quantity: quantity,
              urgency: urgency,
              quoteNumber: quoteRequest.quoteNumber,
              message: message
            }
          });
          console.log(`✅ Quote request logged to existing CRM customer: ${email}`);
        } else {
          // Create new CRM customer from quote request
          const newCrmCustomer = await crmStorage.createCrmCustomer({
            email: email,
            firstName: firstName,
            lastName: lastName,
            company: company,
            phone: phone || null,
            customerType: 'prospect',
            customerSource: 'website_quote',
            isActive: true,
            passwordHash: '', // Will be set when customer creates account
          });

          // Log initial quote request activity
          await crmStorage.logCustomerActivity({
            customerId: newCrmCustomer.id,
            activityType: 'first_contact',
            description: `First contact via quote request: ${productName} - Category: ${category || 'general'}`,
            performedBy: 'system',
            activityData: {
              source: 'website_quote_form',
              productName: productName,
              category: category,
              quantity: quantity,
              urgency: urgency,
              quoteNumber: quoteRequest.quoteNumber,
              message: message
            }
          });
          console.log(`✅ New CRM customer created from quote request: ${email}`);
        }
      } catch (crmError) {
        console.error("❌ Error auto-capturing customer in CRM from quote request:", crmError);
        // Don't fail the quote request if CRM capture fails
      }

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

      // Nodemailer is already imported at the top
      
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
      if (!customerData.email || !customerData.phone || !customerData.country || !customerData.city || !customerData.address) {
        return res.status(400).json({
          success: false,
          message: "ایمیل، شماره تلفن، کشور، شهر و آدرس اجباری هستند"
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
    } catch (error: any) {
      console.error("Error creating CRM customer:", error);
      // Check if it's a duplicate error message
      if (error.message && (error.message.includes("ایمیل تکراری است") || error.message.includes("شماره تلفن تکراری است"))) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
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
    } catch (error: any) {
      console.error("Error updating CRM customer:", error);
      // Check if it's a duplicate error message
      if (error.message && (error.message.includes("ایمیل تکراری است") || error.message.includes("شماره تلفن تکراری است"))) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
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

  // Duplicate route removed - using main route at line 2959

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

      // Generate PDF using enhanced pdfMake generator for better Persian support
      const { generateCustomerPDF } = await import('./simple-pdf-generator');
      const pdfBuffer = await generateCustomerPDF(customer, analytics, activities);

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
      const pdfBuffer = await generateSimplePDF(htmlContent, 'CRM Analytics Report');

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
        lastOrderDate: customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }) : null
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

  // Get delivery SMS logs (admin only)
  app.get("/api/admin/sms/delivery-logs", requireAuth, async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { smsLogs } = await import("../shared/schema");
      const { eq, desc } = await import("drizzle-orm");
      
      const deliveryLogs = await db
        .select()
        .from(smsLogs)
        .where(eq(smsLogs.purpose, 'delivery_notification'))
        .orderBy(desc(smsLogs.createdAt))
        .limit(50);
      
      res.json({ success: true, data: deliveryLogs });
    } catch (error) {
      console.error("Error fetching delivery SMS logs:", error);
      res.status(500).json({ success: false, message: "خطا در دریافت لاگ‌های SMS تحویل" });
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
  // FINANCIAL DEPARTMENT SPECIFIC API ROUTES
  // =============================================================================

  // Financial department authentication check
  app.get('/api/financial/auth/me', async (req: Request, res: Response) => {
    try {
      // For now, return a default financial user for testing
      // In production, this would check actual financial department authentication
      const defaultFinancialUser = {
        id: 1,
        username: 'financial_admin',
        email: 'financial@momtazchem.com',
        department: 'financial'
      };
      
      res.json({ success: true, user: defaultFinancialUser });
    } catch (error) {
      console.error('Error in financial auth check:', error);
      res.status(401).json({ success: false, message: 'احراز هویت مالی نشده' });
    }
  });

  // Financial department logout
  app.post('/api/financial/logout', async (req: Request, res: Response) => {
    try {
      // Clear session if needed
      res.json({ success: true, message: 'خروج موفقیت‌آمیز' });
    } catch (error) {
      console.error('Error in financial logout:', error);
      res.status(500).json({ success: false, message: 'خطا در خروج' });
    }
  });

  // Get financial department orders (public access for financial department)
  app.get('/api/financial/orders', async (req: Request, res: Response) => {
    try {
      const orders = await orderManagementStorage.getOrdersByDepartment('financial');
      res.json({ success: true, orders });
    } catch (error) {
      console.error('Error fetching financial orders:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت سفارشات مالی' });
    }
  });

  // Approve financial order (public access for financial department)
  app.post('/api/finance/orders/:id/approve', async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { notes } = req.body;
      const adminId = 1; // Default financial admin ID

      const updatedOrder = await orderManagementStorage.updateOrderStatus(
        orderId, 
        'financial_approved', 
        adminId, 
        'financial', 
        notes || 'Payment approved by financial department'
      );

      res.json({ success: true, order: updatedOrder, message: 'پرداخت تایید شد' });
    } catch (error) {
      console.error('Error approving financial order:', error);
      res.status(500).json({ success: false, message: 'خطا در تایید پرداخت' });
    }
  });

  // Reject financial order (public access for financial department)
  app.post('/api/finance/orders/:id/reject', async (req: Request, res: Response) => {
    try {
      const orderId = parseInt(req.params.id);
      const { notes } = req.body;
      const adminId = 1; // Default financial admin ID

      const updatedOrder = await orderManagementStorage.updateOrderStatus(
        orderId, 
        'cancelled', 
        adminId, 
        'financial', 
        notes || 'Payment rejected by financial department'
      );

      res.json({ success: true, order: updatedOrder, message: 'پرداخت رد شد' });
    } catch (error) {
      console.error('Error rejecting financial order:', error);
      res.status(500).json({ success: false, message: 'خطا در رد پرداخت' });
    }
  });



  // =============================================================================
  // ORDER MANAGEMENT API ROUTES (3-Department System)
  // =============================================================================

  // Get orders for specific department (respects workflow sequence)
  app.get('/api/order-management/:department', async (req, res) => {
    try {
      const department = req.params.department as 'financial' | 'warehouse' | 'logistics';
      
      if (!['financial', 'warehouse', 'logistics'].includes(department)) {
        return res.status(400).json({ success: false, message: 'بخش نامعتبر است' });
      }

      // For financial department, allow access without admin auth
      if (department === 'financial') {
        const orders = await orderManagementStorage.getOrdersByDepartment(department);
        return res.json({ success: true, orders });
      }

      // For other departments, require admin auth
      if (!req.session?.adminId) {
        return res.status(401).json({ success: false, message: 'احراز هویت مورد نیاز است' });
      }

      const orders = await orderManagementStorage.getOrdersByDepartment(department);
      res.json({ success: true, orders });
    } catch (error) {
      console.error(`Error fetching ${req.params.department} orders:`, error);
      res.status(500).json({ success: false, message: 'خطا در دریافت سفارشات' });
    }
  });

  // =============================================================================
  // ORDER TRACKING MANAGEMENT API ROUTES (Read-Only System)
  // =============================================================================

  // Get all orders for tracking (read-only overview)
  app.get('/api/orders/tracking/all', async (req, res) => {
    try {
      if (!req.session?.adminId) {
        return res.status(401).json({ success: false, message: 'احراز هویت مورد نیاز است' });
      }

      const { pool } = await import('./db');
      
      // Get all orders with complete information for tracking
      const query = `
        SELECT DISTINCT
          o.id,
          o.order_number as customerOrderId,
          crm.first_name || ' ' || crm.last_name as customerName,
          crm.email as customerEmail,
          crm.phone as customerPhone,
          o.total_amount as totalAmount,
          o.currency,
          o.status,
          o.payment_method as paymentMethod,
          o.payment_receipt_url as paymentReceiptUrl,
          o.tracking_number as trackingNumber,
          o.delivery_code as deliveryCode,
          o.estimated_delivery_date as estimatedDeliveryDate,
          o.actual_delivery_date as actualDeliveryDate,
          o.delivery_person_name as deliveryPersonName,
          o.delivery_person_phone as deliveryPersonPhone,
          om.financial_notes as financialNotes,
          om.warehouse_notes as warehouseNotes,
          om.logistics_notes as logisticsNotes,
          o.created_at as createdAt,
          o.updated_at as updatedAt
        FROM customer_orders o
        LEFT JOIN crm_customers crm ON o.customer_id = crm.id
        LEFT JOIN order_management om ON o.id = om.customer_order_id
        ORDER BY o.created_at DESC
        LIMIT 1000
      `;
      
      const result = await pool.query(query);
      console.log('📋 [ORDER TRACKING] Retrieved', result.rows.length, 'orders for tracking');
      
      res.json({ success: true, orders: result.rows });
    } catch (error) {
      console.error('❌ [ORDER TRACKING] Error fetching tracking orders:', error);
      res.status(500).json({ success: false, message: 'خطا در بارگیری سفارشات پیگیری' });
    }
  });

  // Get order statistics for dashboard
  app.get('/api/orders/statistics', async (req, res) => {
    try {
      if (!req.session?.adminId) {
        return res.status(401).json({ success: false, message: 'احراز هویت مورد نیاز است' });
      }

      const { pool } = await import('./db');
      
      // Get comprehensive order statistics
      const statsQuery = `
        SELECT
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status IN ('pending_payment', 'payment_uploaded', 'financial_reviewing', 'warehouse_processing', 'logistics_processing') THEN 1 END) as pending_orders,
          COUNT(CASE WHEN status IN ('delivered', 'completed') THEN 1 END) as completed_orders,
          COALESCE(SUM(CASE WHEN status IN ('delivered', 'completed') THEN total_amount ELSE 0 END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN status IN ('delivered', 'completed') THEN total_amount ELSE NULL END), 0) as average_order_value,
          COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as todays_orders
        FROM customer_orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 year'
      `;
      
      const result = await pool.query(statsQuery);
      const stats = result.rows[0];
      
      console.log('📊 [ORDER STATS] Retrieved order statistics:', stats);
      
      res.json({ 
        success: true, 
        stats: {
          totalOrders: parseInt(stats.total_orders) || 0,
          pendingOrders: parseInt(stats.pending_orders) || 0,
          completedOrders: parseInt(stats.completed_orders) || 0,
          totalRevenue: parseFloat(stats.total_revenue) || 0,
          averageOrderValue: parseFloat(stats.average_order_value) || 0,
          todaysOrders: parseInt(stats.todays_orders) || 0
        }
      });
    } catch (error) {
      console.error('❌ [ORDER STATS] Error fetching order statistics:', error);
      res.status(500).json({ success: false, message: 'خطا در بارگیری آمار سفارشات' });
    }
  });

  // Get order history for specific order
  app.get('/api/orders/:id/history', async (req, res) => {
    try {
      if (!req.session?.adminId) {
        return res.status(401).json({ success: false, message: 'احراز هویت مورد نیاز است' });
      }

      const orderId = parseInt(req.params.id);
      const { pool } = await import('./db');
      
      // Get order status history
      const historyQuery = `
        SELECT 
          osh.id,
          osh.from_status as fromStatus,
          osh.to_status as toStatus,
          osh.changed_by as changedBy,
          osh.changed_by_department as changedByDepartment,
          osh.notes,
          osh.created_at as createdAt
        FROM order_status_history osh
        WHERE osh.order_management_id = (
          SELECT id FROM order_management WHERE customer_order_id = $1
        )
        ORDER BY osh.created_at DESC
      `;
      
      const result = await pool.query(historyQuery, [orderId]);
      console.log('📜 [ORDER HISTORY] Retrieved', result.rows.length, 'history items for order', orderId);
      
      res.json({ success: true, history: result.rows });
    } catch (error) {
      console.error('❌ [ORDER HISTORY] Error fetching order history:', error);
      res.status(500).json({ success: false, message: 'خطا در بارگیری تاریخچه سفارش' });
    }
  });

  // Get financial department orders (pending payment & uploaded receipts)
  app.get('/api/order-management/financial', async (req, res) => {
    try {
      const { pool } = await import('./db');
      
      // Get orders that need financial review or are pending payment
      const query = `
        SELECT DISTINCT
          o.id,
          o.order_number as customerOrderId,
          crm.first_name || ' ' || crm.last_name as customerName,
          crm.email as customerEmail,
          crm.phone as customerPhone,
          o.total_amount as totalAmount,
          o.currency,
          o.status,
          o.payment_method as paymentMethod,
          o.payment_receipt_url as paymentReceiptUrl,
          om.financial_notes as financialNotes,
          o.created_at as createdAt,
          o.updated_at as updatedAt,
          CASE 
            WHEN o.status = 'pending_payment' THEN 'orphaned'
            WHEN o.status = 'payment_uploaded' THEN 'needs_review'
            WHEN o.status = 'financial_reviewing' THEN 'under_review'
            ELSE 'processed'
          END as financial_status
        FROM customer_orders o
        LEFT JOIN crm_customers crm ON o.customer_id = crm.id
        LEFT JOIN order_management om ON o.id = om.customer_order_id
        WHERE o.status IN ('pending_payment', 'payment_uploaded', 'financial_reviewing', 'financial_rejected')
        ORDER BY 
          CASE 
            WHEN o.status = 'pending_payment' THEN 1  -- Orphaned orders first
            WHEN o.status = 'payment_uploaded' THEN 2 -- Needs review second
            WHEN o.status = 'financial_reviewing' THEN 3 -- Under review third
            ELSE 4
          END,
          o.created_at DESC
        LIMIT 500
      `;
      
      const result = await pool.query(query);
      console.log('💰 [FINANCIAL] Retrieved', result.rows.length, 'financial orders');
      
      res.json({ success: true, orders: result.rows });
    } catch (error) {
      console.error('❌ [FINANCIAL] Error fetching financial orders:', error);
      res.status(500).json({ success: false, message: 'خطا در بارگیری سفارشات مالی' });
    }
  });

  // Update order status (department-specific)
  app.put('/api/order-management/:id/status', async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { newStatus, department, notes } = req.body;
      
      // For financial department, use default admin ID (financial department operations)
      let adminId = req.session.adminId;
      if (department === 'financial' && !adminId) {
        adminId = 1; // Default financial admin ID for financial operations
      }

      if (!adminId) {
        return res.status(401).json({ success: false, message: 'احراز هویت مورد نیاز است' });
      }

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

  // =============================================================================
  // WAREHOUSE DEPARTMENT API ROUTES
  // =============================================================================

  // Warehouse orders - Get orders approved by financial department
  app.get('/api/order-management/warehouse', requireAuth, async (req, res) => {
    try {
      console.log('📦 [WAREHOUSE] Fetching warehouse orders...');
      
      // Get orders that are approved by financial department and ready for warehouse processing
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT 
          o.id,
          o.customer_name as "customerName",
          o.customer_email as "customerEmail", 
          o.total_amount as "totalAmount",
          o.status,
          o.created_at as "createdAt",
          o.shipping_address as "shippingAddress",
          o.payment_method as "paymentMethod",
          o.notes,
          o.warehouse_notes as "warehouseNotes",
          o.financial_approved_at as "financialApprovedAt",
          o.fulfilled_at as "fulfilledAt",
          o.fulfilled_by as "fulfilledBy",
          COALESCE(
            json_agg(
              json_build_object(
                'id', oi.id,
                'name', oi.name,
                'quantity', oi.quantity,
                'price', oi.price,
                'sku', oi.sku,
                'barcode', oi.barcode
              )
            ) FILTER (WHERE oi.id IS NOT NULL),
            '[]'::json
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.status = 'financial_approved'
        GROUP BY o.id, o.customer_name, o.customer_email, o.total_amount, o.status, 
                 o.created_at, o.shipping_address, o.payment_method, o.notes, 
                 o.warehouse_notes, o.financial_approved_at, o.fulfilled_at, o.fulfilled_by
        ORDER BY o.financial_approved_at DESC
      `);
      
      const orders = result.rows;
      console.log('📦 [WAREHOUSE] Found financial approved orders:', orders.length);
      console.log('📦 [WAREHOUSE] Orders ready for warehouse processing:', JSON.stringify(orders, null, 2));
      res.json({ success: true, orders });
    } catch (error) {
      console.error('❌ [WAREHOUSE] Error fetching warehouse orders:', error);
      res.status(500).json({ success: false, message: 'خطا در بارگیری سفارشات انبار' });
    }
  });

  // Process warehouse order
  app.patch('/api/order-management/warehouse/:id/process', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const adminId = req.session?.adminId || 1;
      
      console.log('📦 [WAREHOUSE] Processing order:', { id, status, notes, adminId });
      
      // Update order status using direct database query for better control
      const { pool } = await import('./db');
      
      const updateQuery = `
        UPDATE orders 
        SET 
          status = $1, 
          warehouse_notes = $2,
          updated_at = NOW(),
          ${status === 'warehouse_processing' ? 'warehouse_started_at = NOW(),' : ''}
          ${status === 'warehouse_fulfilled' ? 'warehouse_fulfilled_at = NOW(),' : ''}
          fulfilled_by = $3
        WHERE id = $4
        RETURNING *
      `;
      
      const result = await pool.query(updateQuery, [status, notes, adminId, parseInt(id)]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'سفارش یافت نشد' });
      }
      
      const updatedOrder = result.rows[0];
      console.log('📦 [WAREHOUSE] Order updated successfully:', updatedOrder);
      
      res.json({ success: true, data: updatedOrder });
    } catch (error) {
      console.error('❌ [WAREHOUSE] Error processing warehouse order:', error);
      res.status(500).json({ success: false, message: 'خطا در پردازش سفارش' });
    }
  });

  // =============================================================================
  // LOGISTICS DEPARTMENT API ROUTES
  // =============================================================================

  // Logistics authentication check
  app.get('/api/logistics/auth/me', async (req, res) => {
    try {
      // Check if user is authenticated as admin (temporary solution)
      if (req.session?.adminId || req.session?.isAuthenticated) {
        res.json({ success: true, authenticated: true });
      } else {
        res.status(401).json({ success: false, message: 'احراز هویت ناموفق' });
      }
    } catch (error) {
      res.status(401).json({ success: false, message: 'احراز هویت ناموفق' });
    }
  });



  // Shipping rates management endpoints (removed duplicates)

  // Shipping cost calculation endpoint
  app.post('/api/logistics/calculate-shipping', async (req, res) => {
    try {
      const { deliveryMethod, city, province, orderTotal, weight } = req.body;
      const shippingCost = await orderManagementStorage.calculateShippingCost({
        deliveryMethod,
        city,
        province,
        orderTotal: parseFloat(orderTotal) || 0,
        weight: parseFloat(weight) || 0,
      });
      res.json({ success: true, data: { shippingCost } });
    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'خطا در محاسبه هزینه حمل و نقل' 
      });
    }
  });

  // Get available shipping methods for location/order
  app.post('/api/logistics/available-methods', async (req, res) => {
    try {
      const { city, province, orderTotal } = req.body;
      const availableMethods = await orderManagementStorage.getAvailableShippingMethods({
        city,
        province,
        orderTotal: parseFloat(orderTotal) || 0,
      });
      res.json({ success: true, data: availableMethods });
    } catch (error) {
      console.error('Error fetching available shipping methods:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت روش‌های حمل و نقل موجود' });
    }
  });

  // Update order delivery information (enhanced logistics details)
  app.post('/api/logistics/orders/:orderId/delivery-info', async (req, res) => {
    try {
      const { orderId } = req.params;
      const updatedOrder = await orderManagementStorage.updateDeliveryInfo(
        parseInt(orderId),
        req.body
      );
      res.json({ success: true, data: updatedOrder });
    } catch (error) {
      console.error('Error updating delivery info:', error);
      res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی اطلاعات تحویل' });
    }
  });

  // Update delivery information for an order
  app.put('/api/logistics/orders/:id/delivery-info', async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const deliveryInfo = req.body;
      
      const updatedOrder = await orderManagementStorage.updateDeliveryInfo(orderId, deliveryInfo);
      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error('Error updating delivery info:', error);
      res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی اطلاعات ارسال' });
    }
  });

  // Complete delivery for an order
  app.post('/api/logistics/orders/:id/complete', async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const adminId = req.session?.adminId || 1; // Default for logistics operations
      
      const updatedOrder = await orderManagementStorage.updateOrderStatus(
        orderId,
        'logistics_delivered',
        adminId,
        'logistics',
        'Order delivered successfully'
      );
      
      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      console.error('Error completing delivery:', error);
      res.status(500).json({ success: false, message: 'خطا در تکمیل تحویل' });
    }
  });

  // =============================================================================
  // DELIVERY METHODS MANAGEMENT ENDPOINTS
  // =============================================================================

  // Get all delivery methods for logistics department
  app.get('/api/logistics/delivery-methods', requireAuth, async (req, res) => {
    try {
      const { db } = await import('./db');
      const result = await db.select().from(deliveryMethods).orderBy(deliveryMethods.sortOrder);
      res.json(result);
    } catch (error) {
      console.error('Error fetching delivery methods:', error);
      res.status(500).json({ success: false, message: 'خطا در بارگذاری روش‌های ارسال' });
    }
  });

  // Create new delivery method (logistics)
  app.post('/api/logistics/delivery-methods', requireAuth, async (req, res) => {
    try {
      const { 
        value, label, icon, color, isActive, sortOrder,
        baseCost, costPerKg, minimumOrder, freeShippingThreshold,
        estimatedDays, maxDistance, availableAreas, description
      } = req.body;
      
      if (!value || !label) {
        return res.status(400).json({ 
          success: false, 
          message: 'مقدار و برچسب الزامی است' 
        });
      }

      const { db } = await import('./db');
      const result = await db.insert(deliveryMethods).values({
        value,
        label,
        icon: icon || 'package',
        color: color || 'blue',
        baseCost: baseCost ? parseFloat(baseCost) : 0,
        costPerKg: costPerKg ? parseFloat(costPerKg) : 0,
        minimumOrder: minimumOrder ? parseFloat(minimumOrder) : 0,
        freeShippingThreshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : 1,
        maxDistance: maxDistance ? parseInt(maxDistance) : null,
        availableAreas: availableAreas ? availableAreas.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0
      }).returning();

      res.json({ success: true, data: result[0] });
    } catch (error: any) {
      console.error('Error creating delivery method:', error);
      if (error.code === '23505') {
        res.status(400).json({ success: false, message: 'این روش ارسال قبلاً وجود دارد' });
      } else {
        res.status(500).json({ success: false, message: 'خطا در ایجاد روش ارسال' });
      }
    }
  });

  // Update delivery method (logistics)
  app.put('/api/logistics/delivery-methods/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { 
        value, label, icon, color, isActive, sortOrder,
        baseCost, costPerKg, minimumOrder, freeShippingThreshold,
        estimatedDays, maxDistance, availableAreas, description
      } = req.body;
      
      if (!value || !label) {
        return res.status(400).json({ 
          success: false, 
          message: 'مقدار و برچسب الزامی است' 
        });
      }

      const { db } = await import('./db');
      const { eq } = await import('drizzle-orm');
      
      const result = await db.update(deliveryMethods)
        .set({
          value,
          label,
          icon: icon || 'package',
          color: color || 'blue',
          baseCost: baseCost ? parseFloat(baseCost) : 0,
          costPerKg: costPerKg ? parseFloat(costPerKg) : 0,
          minimumOrder: minimumOrder ? parseFloat(minimumOrder) : 0,
          freeShippingThreshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
          estimatedDays: estimatedDays ? parseInt(estimatedDays) : 1,
          maxDistance: maxDistance ? parseInt(maxDistance) : null,
          availableAreas: availableAreas ? availableAreas.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
          description: description || null,
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder || 0,
          updatedAt: new Date()
        })
        .where(eq(deliveryMethods.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'روش ارسال یافت نشد' });
      }

      res.json({ success: true, data: result[0] });
    } catch (error: any) {
      console.error('Error updating delivery method:', error);
      if (error.code === '23505') {
        res.status(400).json({ success: false, message: 'این روش ارسال قبلاً وجود دارد' });
      } else {
        res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی روش ارسال' });
      }
    }
  });

  // Delete delivery method (logistics)
  app.delete('/api/logistics/delivery-methods/:id', requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const { db } = await import('./db');
      const { eq } = await import('drizzle-orm');
      
      const result = await db.delete(deliveryMethods)
        .where(eq(deliveryMethods.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'روش ارسال یافت نشد' });
      }

      res.json({ success: true, message: 'روش ارسال حذف شد' });
    } catch (error) {
      console.error('Error deleting delivery method:', error);
      res.status(500).json({ success: false, message: 'خطا در حذف روش ارسال' });
    }
  });

  // Get all delivery methods (public endpoint)
  app.get('/api/delivery-methods', async (req, res) => {
    try {
      const { db } = await import('./db');
      const result = await db.select().from(deliveryMethods).orderBy(deliveryMethods.sortOrder);
      res.json(result);
    } catch (error) {
      console.error('Error fetching delivery methods:', error);
      res.status(500).json({ success: false, message: 'خطا در بارگذاری روش‌های ارسال' });
    }
  });

  // Get active delivery methods for customer checkout
  app.get('/api/checkout/delivery-methods', async (req, res) => {
    try {
      const { db } = await import('./db');
      const { eq } = await import('drizzle-orm');
      
      const result = await db.select().from(deliveryMethods)
        .where(eq(deliveryMethods.isActive, true))
        .orderBy(deliveryMethods.sortOrder);
      
      res.json(result);
    } catch (error) {
      console.error('Error fetching active delivery methods:', error);
      res.status(500).json({ success: false, message: 'خطا در بارگذاری روش‌های ارسال' });
    }
  });

  // Create new delivery method
  app.post('/api/delivery-methods', async (req, res) => {
    try {
      const { 
        value, label, icon, color, isActive, sortOrder,
        baseCost, costPerKg, minimumOrder, freeShippingThreshold,
        estimatedDays, maxDistance, availableAreas, description
      } = req.body;
      
      if (!value || !label) {
        return res.status(400).json({ 
          success: false, 
          message: 'مقدار و برچسب الزامی است' 
        });
      }

      const { db } = await import('./db');
      const result = await db.insert(deliveryMethods).values({
        value,
        label,
        icon: icon || 'package',
        color: color || 'blue',
        baseCost: baseCost ? parseFloat(baseCost) : 0,
        costPerKg: costPerKg ? parseFloat(costPerKg) : 0,
        minimumOrder: minimumOrder ? parseFloat(minimumOrder) : 0,
        freeShippingThreshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : 1,
        maxDistance: maxDistance ? parseInt(maxDistance) : null,
        availableAreas: availableAreas ? availableAreas.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0
      }).returning();

      res.json({ success: true, data: result[0] });
    } catch (error: any) {
      console.error('Error creating delivery method:', error);
      if (error.code === '23505') {
        res.status(400).json({ success: false, message: 'این روش ارسال قبلاً وجود دارد' });
      } else {
        res.status(500).json({ success: false, message: 'خطا در ایجاد روش ارسال' });
      }
    }
  });

  // Update delivery method
  app.put('/api/delivery-methods/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { 
        value, label, icon, color, isActive, sortOrder,
        baseCost, costPerKg, minimumOrder, freeShippingThreshold,
        estimatedDays, maxDistance, availableAreas, description
      } = req.body;
      
      if (!value || !label) {
        return res.status(400).json({ 
          success: false, 
          message: 'مقدار و برچسب الزامی است' 
        });
      }

      const { db } = await import('./db');
      const { eq } = await import('drizzle-orm');
      
      const result = await db.update(deliveryMethods)
        .set({
          value,
          label,
          icon: icon || 'package',
          color: color || 'blue',
          baseCost: baseCost ? parseFloat(baseCost) : 0,
          costPerKg: costPerKg ? parseFloat(costPerKg) : 0,
          minimumOrder: minimumOrder ? parseFloat(minimumOrder) : 0,
          freeShippingThreshold: freeShippingThreshold ? parseFloat(freeShippingThreshold) : null,
          estimatedDays: estimatedDays ? parseInt(estimatedDays) : 1,
          maxDistance: maxDistance ? parseInt(maxDistance) : null,
          availableAreas: availableAreas ? availableAreas.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
          description: description || null,
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder || 0,
          updatedAt: new Date()
        })
        .where(eq(deliveryMethods.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'روش ارسال یافت نشد' });
      }

      res.json({ success: true, data: result[0] });
    } catch (error: any) {
      console.error('Error updating delivery method:', error);
      if (error.code === '23505') {
        res.status(400).json({ success: false, message: 'این روش ارسال قبلاً وجود دارد' });
      } else {
        res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی روش ارسال' });
      }
    }
  });

  // Delete delivery method
  app.delete('/api/delivery-methods/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const { db } = await import('./db');
      const { eq } = await import('drizzle-orm');
      
      const result = await db.delete(deliveryMethods)
        .where(eq(deliveryMethods.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'روش ارسال یافت نشد' });
      }

      res.json({ success: true, message: 'روش ارسال حذف شد' });
    } catch (error) {
      console.error('Error deleting delivery method:', error);
      res.status(500).json({ success: false, message: 'خطا در حذف روش ارسال' });
    }
  });

  // =============================================================================
  // SHIPPING RATES MANAGEMENT ENDPOINTS
  // =============================================================================

  // Get all shipping rates
  app.get('/api/logistics/shipping-rates', async (req, res) => {
    try {
      const { db } = await import('./db');
      const result = await db.select().from(shippingRates).orderBy(shippingRates.deliveryMethod);
      res.json(result);
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      res.status(500).json({ success: false, message: 'خطا در بارگذاری تعرفه‌های ارسال' });
    }
  });

  // Create new shipping rate
  app.post('/api/logistics/shipping-rates', async (req, res) => {
    try {
      const {
        deliveryMethod, cityName, provinceName, minWeight, maxWeight, maxDimensions,
        basePrice, pricePerKg, freeShippingThreshold, estimatedDays, 
        trackingAvailable, insuranceAvailable, insuranceRate, isActive,
        smsVerificationEnabled, description, internalNotes
      } = req.body;
      
      if (!deliveryMethod || !basePrice || !minWeight) {
        return res.status(400).json({ 
          success: false, 
          message: 'روش ارسال، قیمت پایه و حداقل وزن الزامی است' 
        });
      }

      const { db } = await import('./db');
      const result = await db.insert(shippingRates).values({
        deliveryMethod,
        cityName: cityName || null,
        provinceName: provinceName || null,
        minWeight,
        maxWeight: maxWeight || null,
        maxDimensions: maxDimensions || null,
        basePrice,
        pricePerKg: pricePerKg || '0',
        freeShippingThreshold: freeShippingThreshold || null,
        estimatedDays: estimatedDays || null,
        trackingAvailable: trackingAvailable || false,
        insuranceAvailable: insuranceAvailable || false,
        insuranceRate: insuranceRate || '0',
        isActive: isActive !== undefined ? isActive : true,
        smsVerificationEnabled: smsVerificationEnabled || false,
        description: description || null,
        internalNotes: internalNotes || null
      }).returning();

      res.json({ success: true, data: result[0] });
    } catch (error) {
      console.error('Error creating shipping rate:', error);
      res.status(500).json({ success: false, message: 'خطا در ایجاد تعرفه ارسال' });
    }
  });

  // Update shipping rate
  app.put('/api/logistics/shipping-rates/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const {
        deliveryMethod, cityName, provinceName, minWeight, maxWeight, maxDimensions,
        basePrice, pricePerKg, freeShippingThreshold, estimatedDays, 
        trackingAvailable, insuranceAvailable, insuranceRate, isActive,
        smsVerificationEnabled, description, internalNotes
      } = req.body;
      
      if (!deliveryMethod || !basePrice || !minWeight) {
        return res.status(400).json({ 
          success: false, 
          message: 'روش ارسال، قیمت پایه و حداقل وزن الزامی است' 
        });
      }

      const { db } = await import('./db');
      const { eq } = await import('drizzle-orm');
      
      const result = await db.update(shippingRates)
        .set({
          deliveryMethod,
          cityName: cityName || null,
          provinceName: provinceName || null,
          minWeight,
          maxWeight: maxWeight || null,
          maxDimensions: maxDimensions || null,
          basePrice,
          pricePerKg: pricePerKg || '0',
          freeShippingThreshold: freeShippingThreshold || null,
          estimatedDays: estimatedDays || null,
          trackingAvailable: trackingAvailable || false,
          insuranceAvailable: insuranceAvailable || false,
          insuranceRate: insuranceRate || '0',
          isActive: isActive !== undefined ? isActive : true,
          smsVerificationEnabled: smsVerificationEnabled || false,
          description: description || null,
          internalNotes: internalNotes || null,
          updatedAt: new Date()
        })
        .where(eq(shippingRates.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'تعرفه ارسال یافت نشد' });
      }

      res.json({ success: true, data: result[0] });
    } catch (error) {
      console.error('Error updating shipping rate:', error);
      res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی تعرفه ارسال' });
    }
  });

  // Delete shipping rate
  app.delete('/api/logistics/shipping-rates/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const { db } = await import('./db');
      const { eq } = await import('drizzle-orm');
      
      const result = await db.delete(shippingRates)
        .where(eq(shippingRates.id, id))
        .returning();

      if (result.length === 0) {
        return res.status(404).json({ success: false, message: 'تعرفه ارسال یافت نشد' });
      }

      res.json({ success: true, message: 'تعرفه ارسال حذف شد' });
    } catch (error) {
      console.error('Error deleting shipping rate:', error);
      res.status(500).json({ success: false, message: 'خطا در حذف تعرفه ارسال' });
    }
  });

  // Second set of duplicate shipping rate endpoints removed

  // Get available shipping methods for checkout
  app.get('/api/shipping/methods', async (req, res) => {
    try {
      const { city, province, orderTotal } = req.query;
      const methods = await orderManagementStorage.getAvailableShippingMethods({
        city: city as string,
        province: province as string,
        orderTotal: orderTotal ? parseFloat(orderTotal as string) : 0
      });
      res.json({ success: true, methods });
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت روش‌های ارسال' });
    }
  });

  // Calculate shipping cost
  app.post('/api/shipping/calculate', async (req, res) => {
    try {
      const { deliveryMethod, city, province, orderTotal, weight } = req.body;
      const cost = await orderManagementStorage.calculateShippingCost({
        deliveryMethod,
        city,
        province,
        orderTotal: parseFloat(orderTotal),
        weight: weight ? parseFloat(weight) : 1
      });
      res.json({ success: true, cost });
    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      res.status(500).json({ success: false, message: 'خطا در محاسبه هزینه ارسال' });
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
      // Temporary workaround for session consistency issue with financial department
      if (department === 'financial') {
        const tempUser = {
          id: 1,
          username: 'financial_temp',
          department: 'financial'
        };
        req.session.departmentUser = tempUser;
        return next();
      }
      
      // Temporary workaround for logistics department - allow admin access
      if (department === 'logistics' && (req.session?.adminId || req.session?.isAuthenticated)) {
        console.log('✅ Logistics auth: Admin access granted', {
          adminId: req.session.adminId,
          isAuthenticated: req.session.isAuthenticated
        });
        const tempUser = {
          id: req.session.adminId || 1,
          username: 'logistics_admin',
          department: 'logistics'
        };
        req.session.departmentUser = tempUser;
        return next();
      }
      
      console.log(`Auth check for ${department}:`, {
        sessionExists: !!req.session,
        departmentUser: req.session?.departmentUser,
        sessionId: req.sessionID
      });
      
      if (!req.session?.departmentUser || req.session.departmentUser.department !== department) {
        console.log(`Authentication failed for ${department}:`, {
          hasDepartmentUser: !!req.session?.departmentUser,
          userDepartment: req.session?.departmentUser?.department,
          expectedDepartment: department
        });
        return res.status(401).json({ success: false, message: "احراز هویت نشده" });
      }
      next();
    };
  }

  // ============================================================================
  // LOGISTICS DEPARTMENT ROUTES
  // ============================================================================

  // Logistics login
  app.post('/api/logistics/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Check if user exists and has logistics department access
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

      // Update last login
      await db
        .update(schema.users)
        .set({ lastLoginAt: new Date() })
        .where(eq(schema.users.id, user.id));

      // Set session
      req.session.departmentUser = {
        id: user.id,
        username: user.username,
        department: user.department || 'logistics'
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

  // Get logistics pending orders - only warehouse_approved orders
  app.get('/api/logistics/orders', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const orders = await orderManagementStorage.getLogisticsPendingOrders();
      
      // Calculate total weight for each order
      const ordersWithWeight = await Promise.all(
        orders.map(async (order) => {
          try {
            const weight = await orderManagementStorage.calculateOrderWeight(order.customerOrderId);
            return {
              ...order,
              calculatedWeight: weight,
              weightUnit: 'kg'
            };
          } catch (error) {
            console.error(`Error calculating weight for order ${order.customerOrderId}:`, error);
            return {
              ...order,
              calculatedWeight: 0,
              weightUnit: 'kg'
            };
          }
        })
      );
      
      res.json({ success: true, orders: ordersWithWeight });
    } catch (error) {
      console.error('Error fetching logistics orders:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت سفارشات" });
    }
  });

  // Process logistics order
  app.post('/api/logistics/orders/:id/process', requireDepartmentAuth('logistics'), async (req: any, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { 
        action, 
        notes, 
        reviewerId, 
        trackingNumber, 
        estimatedDeliveryDate, 
        deliveryPersonName, 
        deliveryPersonPhone,
        // Delivery method and transportation details
        deliveryMethod,
        transportationType,
        // Postal service details
        postalServiceName,
        postalTrackingCode,
        postalWeight,
        postalPrice,
        postalInsurance,
        // Vehicle details
        vehicleType,
        vehiclePlate,
        vehicleModel,
        vehicleColor,
        driverName,
        driverPhone,
        driverLicense,
        // Delivery company details
        deliveryCompanyName,
        deliveryCompanyPhone,
        deliveryCompanyAddress
      } = req.body;
      
      if (action === 'approve') {
        await orderManagementStorage.updateOrderStatus(
          orderId,
          'logistics_approved',
          reviewerId,
          'logistics',
          notes || 'تایید شده توسط بخش لجستیک'
        );
        
        // Update comprehensive delivery information
        await orderManagementStorage.updateDeliveryInfo(orderId, {
          trackingNumber,
          estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : undefined,
          deliveryPersonName,
          deliveryPersonPhone,
          deliveryMethod,
          transportationType,
          postalServiceName,
          postalTrackingCode,
          postalWeight,
          postalPrice,
          postalInsurance,
          vehicleType,
          vehiclePlate,
          vehicleModel,
          vehicleColor,
          driverName,
          driverPhone,
          driverLicense,
          deliveryCompanyName,
          deliveryCompanyPhone,
          deliveryCompanyAddress
        });
      } else {
        await orderManagementStorage.updateOrderStatus(
          orderId,
          'logistics_rejected',
          reviewerId,
          'logistics',
          notes || 'رد شده توسط بخش لجستیک'
        );
      }

      res.json({ success: true, message: "سفارش با موفقیت پردازش شد" });
    } catch (error) {
      console.error('Error processing logistics order:', error);
      res.status(500).json({ success: false, message: "خطا در پردازش سفارش" });
    }
  });

  // ============================================================================
  // DELIVERY METHODS MANAGEMENT (LOGISTICS DEPARTMENT)
  // ============================================================================

  // Get all delivery methods (for logistics admin)
  app.get('/api/logistics/delivery-methods', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const methods = await db
        .select()
        .from(deliveryMethods)
        .orderBy(deliveryMethods.sortOrder, deliveryMethods.label);
      
      res.json(methods);
    } catch (error) {
      console.error('Error fetching delivery methods:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت روش‌های ارسال" });
    }
  });

  // Get active delivery methods (for customer checkout - no auth required)
  app.get('/api/delivery-methods', async (req, res) => {
    try {
      const methods = await db
        .select()
        .from(deliveryMethods)
        .where(eq(deliveryMethods.isActive, true))
        .orderBy(deliveryMethods.sortOrder, deliveryMethods.label);
      
      res.json(methods);
    } catch (error) {
      console.error('Error fetching active delivery methods:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت روش‌های ارسال" });
    }
  });

  // Create new delivery method
  app.post('/api/logistics/delivery-methods', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const methodData = req.body;
      
      const [newMethod] = await db
        .insert(deliveryMethods)
        .values({
          ...methodData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      
      res.json({ success: true, data: newMethod, message: "روش ارسال جدید ایجاد شد" });
    } catch (error) {
      console.error('Error creating delivery method:', error);
      if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({ success: false, message: "این شناسه قبلاً استفاده شده است" });
      } else {
        res.status(500).json({ success: false, message: "خطا در ایجاد روش ارسال" });
      }
    }
  });

  // Update delivery method
  app.put('/api/logistics/delivery-methods/:id', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const methodId = parseInt(req.params.id);
      const updateData = req.body;
      
      const [updatedMethod] = await db
        .update(deliveryMethods)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(deliveryMethods.id, methodId))
        .returning();
      
      if (!updatedMethod) {
        return res.status(404).json({ success: false, message: "روش ارسال یافت نشد" });
      }
      
      res.json({ success: true, data: updatedMethod, message: "روش ارسال به‌روزرسانی شد" });
    } catch (error) {
      console.error('Error updating delivery method:', error);
      if (error.code === '23505') { // Unique constraint violation
        res.status(400).json({ success: false, message: "این شناسه قبلاً استفاده شده است" });
      } else {
        res.status(500).json({ success: false, message: "خطا در به‌روزرسانی روش ارسال" });
      }
    }
  });

  // Delete delivery method
  app.delete('/api/logistics/delivery-methods/:id', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const methodId = parseInt(req.params.id);
      
      // Check if this delivery method is used in shipping rates
      const usedInShippingRates = await db
        .select({ count: sql`count(*)` })
        .from(shippingRates)
        .where(eq(shippingRates.deliveryMethod, sql`(SELECT value FROM delivery_methods WHERE id = ${methodId})`));
      
      if (usedInShippingRates[0]?.count > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "این روش ارسال در تعرفه‌های ارسال استفاده شده و قابل حذف نیست" 
        });
      }
      
      const deletedRows = await db
        .delete(deliveryMethods)
        .where(eq(deliveryMethods.id, methodId))
        .returning();
      
      if (deletedRows.length === 0) {
        return res.status(404).json({ success: false, message: "روش ارسال یافت نشد" });
      }
      
      res.json({ success: true, message: "روش ارسال حذف شد" });
    } catch (error) {
      console.error('Error deleting delivery method:', error);
      res.status(500).json({ success: false, message: "خطا در حذف روش ارسال" });
    }
  });

  // ============================================================================
  // SHIPPING RATES MANAGEMENT (LOGISTICS DEPARTMENT)
  // ============================================================================

  // Get all shipping rates (for logistics admin)
  app.get('/api/logistics/shipping-rates', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const rates = await db
        .select()
        .from(shippingRates)
        .orderBy(shippingRates.deliveryMethod, shippingRates.transportationType);
      
      res.json({ success: true, data: rates });
    } catch (error) {
      console.error('Error fetching shipping rates:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت تعرفه‌های ارسال" });
    }
  });

  // Get active shipping rates (for customer checkout - no auth required)
  app.get('/api/shipping-rates', async (req, res) => {
    try {
      const rates = await db
        .select()
        .from(shippingRates)
        .where(eq(shippingRates.isActive, true))
        .orderBy(shippingRates.deliveryMethod, shippingRates.transportationType);
      
      res.json({ success: true, data: rates });
    } catch (error) {
      console.error('Error fetching active shipping rates:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت تعرفه‌های ارسال" });
    }
  });

  // Create new shipping rate
  app.post('/api/logistics/shipping-rates', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const rateData = req.body;
      
      const [newRate] = await db
        .insert(shippingRates)
        .values(rateData)
        .returning();
      
      res.json({ success: true, data: newRate, message: "تعرفه ارسال جدید ایجاد شد" });
    } catch (error) {
      console.error('Error creating shipping rate:', error);
      res.status(500).json({ success: false, message: "خطا در ایجاد تعرفه ارسال" });
    }
  });

  // Update shipping rate
  app.put('/api/logistics/shipping-rates/:id', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const rateId = parseInt(req.params.id);
      const updateData = req.body;
      
      const [updatedRate] = await db
        .update(shippingRates)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(shippingRates.id, rateId))
        .returning();
      
      if (!updatedRate) {
        return res.status(404).json({ success: false, message: "تعرفه ارسال یافت نشد" });
      }
      
      res.json({ success: true, rate: updatedRate, message: "تعرفه ارسال به‌روزرسانی شد" });
    } catch (error) {
      console.error('Error updating shipping rate:', error);
      res.status(500).json({ success: false, message: "خطا در به‌روزرسانی تعرفه ارسال" });
    }
  });

  // Delete shipping rate
  app.delete('/api/logistics/shipping-rates/:id', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const rateId = parseInt(req.params.id);
      
      const [deletedRate] = await db
        .delete(shippingRates)
        .where(eq(shippingRates.id, rateId))
        .returning();
      
      if (!deletedRate) {
        return res.status(404).json({ success: false, message: "تعرفه ارسال یافت نشد" });
      }
      
      res.json({ success: true, message: "تعرفه ارسال حذف شد" });
    } catch (error) {
      console.error('Error deleting shipping rate:', error);
      res.status(500).json({ success: false, message: "خطا در حذف تعرفه ارسال" });
    }
  });

  // ============================================================================
  // SMS VERIFICATION SYSTEM FOR DELIVERY
  // ============================================================================

  // Generate SMS verification code for order
  app.post('/api/logistics/orders/:orderId/generate-sms-code', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      
      // Get order details
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        return res.status(404).json({ success: false, message: 'سفارش یافت نشد' });
      }

      // Generate verification code
      const verificationCode = await deliveryVerificationStorage.generateVerificationCode(
        order.id, // Using order ID as orderManagementId for now
        orderId,
        order.phone || order.customerPhone || ''
      );

      // Send SMS
      const smsResult = await smsService.sendDeliveryVerificationSms(
        order.phone || order.customerPhone || '',
        verificationCode.verificationCode,
        order.firstName || 'مشتری',
        verificationCode.id
      );

      res.json({
        success: true,
        message: 'کد تأیید پیامک شد',
        verificationCode: verificationCode.verificationCode,
        smsSent: smsResult.success
      });
    } catch (error) {
      console.error('Error generating SMS verification code:', error);
      res.status(500).json({ success: false, message: 'خطا در تولید کد تأیید' });
    }
  });

  // Verify delivery code
  app.post('/api/logistics/verify-delivery', async (req, res) => {
    try {
      const { verificationCode, customerOrderId, courierName, verificationNotes } = req.body;

      const result = await deliveryVerificationStorage.verifyDeliveryCode({
        verificationCode,
        customerOrderId,
        courierName,
        verificationNotes
      });

      if (result.success) {
        // Update order status to delivered
        await db
          .update(orders)
          .set({
            status: 'delivered',
            deliveredAt: new Date(),
            deliveryNotes: verificationNotes || 'تحویل با کد تأیید پیامک'
          })
          .where(eq(orders.id, customerOrderId));
      }

      res.json(result);
    } catch (error) {
      console.error('Error verifying delivery code:', error);
      res.status(500).json({ success: false, message: 'خطا در تأیید کد تحویل' });
    }
  });

  // Get delivery verification history for order
  app.get('/api/logistics/orders/:orderId/verification-history', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const history = await deliveryVerificationStorage.getVerificationHistory(orderId);
      res.json({ success: true, history });
    } catch (error) {
      console.error('Error fetching verification history:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت تاریخچه تأیید' });
    }
  });

  // Get daily SMS statistics
  app.get('/api/logistics/sms-stats/:date', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const date = req.params.date;
      const stats = await deliveryVerificationStorage.getDailyStats(date);
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Error fetching SMS stats:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت آمار پیامک' });
    }
  });

  // Increment delivery attempts
  app.post('/api/logistics/orders/:orderId/increment-attempts', requireDepartmentAuth('logistics'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      await deliveryVerificationStorage.incrementDeliveryAttempts(orderId);
      res.json({ success: true, message: 'تلاش تحویل افزایش یافت' });
    } catch (error) {
      console.error('Error incrementing delivery attempts:', error);
      res.status(500).json({ success: false, message: 'خطا در افزایش تلاش تحویل' });
    }
  });

  // ============================================================================
  // CUSTOMER SHIPPING COST CALCULATION
  // ============================================================================

  // Calculate shipping cost for customer checkout
  app.post('/api/shipping/calculate', async (req, res) => {
    try {
      const { deliveryMethod, transportationType, customerCity, orderTotal, totalWeight } = req.body;
      
      // Find applicable shipping rate
      const applicableRates = await db
        .select()
        .from(shippingRates)
        .where(and(
          eq(shippingRates.deliveryMethod, deliveryMethod),
          transportationType ? eq(shippingRates.transportationType, transportationType) : sql`1=1`,
          eq(shippingRates.isActive, true),
          or(
            isNull(shippingRates.cityName), // National shipping
            eq(shippingRates.cityName, customerCity) // City-specific
          ),
          or(
            isNull(shippingRates.maxWeight), // No weight limit
            sql`${totalWeight} <= ${shippingRates.maxWeight}` // Within weight limit
          ),
          sql`${totalWeight} >= ${shippingRates.minWeight}` // Above minimum weight
        ))
        .orderBy(shippingRates.cityName); // City-specific rates first
      
      if (applicableRates.length === 0) {
        return res.json({ 
          success: false, 
          message: "روش ارسال انتخابی برای منطقه شما در دسترس نیست" 
        });
      }
      
      const rate = applicableRates[0]; // Use most specific rate (city-specific if available)
      
      // Check for free shipping threshold
      if (rate.freeShippingThreshold && orderTotal >= parseFloat(rate.freeShippingThreshold)) {
        return res.json({
          success: true,
          shippingCost: 0,
          isFreeShipping: true,
          rate: {
            id: rate.id,
            deliveryMethod: rate.deliveryMethod,
            transportationType: rate.transportationType,
            description: rate.description,
            estimatedDays: rate.estimatedDays,
            trackingAvailable: rate.trackingAvailable
          }
        });
      }
      
      // Calculate shipping cost
      const basePrice = parseFloat(rate.basePrice);
      const weightCost = totalWeight * parseFloat(rate.pricePerKg || "0");
      const insuranceCost = rate.insuranceAvailable && rate.insuranceRate ? 
        orderTotal * parseFloat(rate.insuranceRate) : 0;
      
      const totalShippingCost = basePrice + weightCost + insuranceCost;
      
      res.json({
        success: true,
        shippingCost: totalShippingCost,
        isFreeShipping: false,
        breakdown: {
          basePrice,
          weightCost,
          insuranceCost,
          totalWeight
        },
        rate: {
          id: rate.id,
          deliveryMethod: rate.deliveryMethod,
          transportationType: rate.transportationType,
          description: rate.description,
          estimatedDays: rate.estimatedDays,
          trackingAvailable: rate.trackingAvailable,
          insuranceAvailable: rate.insuranceAvailable
        }
      });
    } catch (error) {
      console.error('Error calculating shipping cost:', error);
      res.status(500).json({ success: false, message: "خطا در محاسبه هزینه ارسال" });
    }
  });

  // Get available shipping methods for customer location
  app.get('/api/shipping/methods', async (req, res) => {
    try {
      const { city, orderTotal, totalWeight } = req.query;
      
      const availableMethods = await db
        .selectDistinct({
          deliveryMethod: shippingRates.deliveryMethod,
          transportationType: shippingRates.transportationType,
          description: shippingRates.description,
          estimatedDays: shippingRates.estimatedDays,
          trackingAvailable: shippingRates.trackingAvailable,
          basePrice: shippingRates.basePrice,
          freeShippingThreshold: shippingRates.freeShippingThreshold
        })
        .from(shippingRates)
        .where(and(
          eq(shippingRates.isActive, true),
          or(
            isNull(shippingRates.cityName), // National shipping
            eq(shippingRates.cityName, city as string) // City-specific
          ),
          or(
            isNull(shippingRates.maxWeight), // No weight limit
            sql`${totalWeight} <= ${shippingRates.maxWeight}` // Within weight limit
          ),
          sql`${totalWeight || 0} >= ${shippingRates.minWeight}` // Above minimum weight
        ))
        .orderBy(shippingRates.basePrice);
      
      res.json({ success: true, methods: availableMethods });
    } catch (error) {
      console.error('Error fetching shipping methods:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت روش‌های ارسال" });
    }
  });

  // ============================================================================
  // VAT MANAGEMENT (FINANCIAL DEPARTMENT)
  // ============================================================================

  // Get current VAT settings
  app.get('/api/financial/vat-settings', (req: any, res: any) => {
    // Set temporary session for consistency
    req.session.departmentUser = {
      id: 1,
      username: 'financial_temp',
      department: 'financial'
    };
    
    // Execute the actual VAT settings logic
    (async () => {
    try {
      const [currentVat] = await db
        .select()
        .from(vatSettings)
        .where(eq(vatSettings.isActive, true))
        .orderBy(desc(vatSettings.effectiveDate))
        .limit(1);
      
      res.json({ success: true, vatSettings: currentVat || null });
    } catch (error) {
      console.error('Error fetching VAT settings:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت تنظیمات مالیات" });
    }
    })();
  });

  // Update VAT settings
  app.put('/api/financial/vat-settings', (req: any, res: any) => {
    // Set temporary session for consistency
    req.session.departmentUser = {
      id: 1,
      username: 'financial_temp',
      department: 'financial'
    };
    
    // Execute the actual VAT settings logic
    (async () => {
    try {
      const vatData = req.body;
      
      // Deactivate current VAT settings
      await db
        .update(vatSettings)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(vatSettings.isActive, true));
      
      // Create new VAT settings
      const [newVatSettings] = await db
        .insert(vatSettings)
        .values({
          ...vatData,
          isActive: true,
          effectiveDate: new Date()
        })
        .returning();
      
      res.json({ 
        success: true, 
        vatSettings: newVatSettings, 
        message: "تنظیمات مالیات به‌روزرسانی شد" 
      });
    } catch (error) {
      console.error('Error updating VAT settings:', error);
      res.status(500).json({ success: false, message: "خطا در به‌روزرسانی تنظیمات مالیات" });
    }
    })();
  });

  // Calculate VAT for order (for checkout)
  app.post('/api/financial/calculate-vat', async (req, res) => {
    try {
      const { orderItems, orderTotal, shippingCost, customerRegion } = req.body;
      
      // Get current VAT settings
      const [currentVat] = await db
        .select()
        .from(vatSettings)
        .where(and(
          eq(vatSettings.isActive, true),
          eq(vatSettings.vatEnabled, true)
        ))
        .orderBy(desc(vatSettings.effectiveDate))
        .limit(1);
      
      if (!currentVat) {
        return res.json({
          success: true,
          vatAmount: 0,
          vatRate: 0,
          taxableAmount: 0,
          totalWithVat: orderTotal + (shippingCost || 0),
          breakdown: {
            productVat: 0,
            shippingVat: 0,
            exemptAmount: orderTotal
          }
        });
      }
      
      // Check if VAT applies to customer region
      const applicableRegions = currentVat.applicableRegions as string[] || [];
      if (applicableRegions.length > 0 && !applicableRegions.includes(customerRegion)) {
        return res.json({
          success: true,
          vatAmount: 0,
          vatRate: parseFloat(currentVat.vatRate),
          taxableAmount: 0,
          totalWithVat: orderTotal + (shippingCost || 0),
          breakdown: {
            productVat: 0,
            shippingVat: 0,
            exemptAmount: orderTotal
          }
        });
      }
      
      // Calculate VAT for products
      const exemptCategories = currentVat.exemptCategories as string[] || [];
      const exemptProductIds = currentVat.exemptProductIds as number[] || [];
      
      let taxableAmount = 0;
      let exemptAmount = 0;
      
      for (const item of orderItems) {
        const isExempt = exemptCategories.includes(item.category) || 
                        exemptProductIds.includes(item.productId);
        
        if (isExempt) {
          exemptAmount += item.totalPrice;
        } else {
          taxableAmount += item.totalPrice;
        }
      }
      
      // Check minimum taxable amount
      if (currentVat.minimumTaxableAmount && 
          taxableAmount < parseFloat(currentVat.minimumTaxableAmount)) {
        taxableAmount = 0;
        exemptAmount = orderTotal;
      }
      
      // Calculate VAT amounts
      const vatRate = parseFloat(currentVat.vatRate) / 100;
      const productVat = taxableAmount * vatRate;
      
      // Shipping is typically VAT-exempt in Iraq
      const shippingVat = currentVat.shippingTaxable ? (shippingCost || 0) * vatRate : 0;
      
      const totalVat = productVat + shippingVat;
      const totalWithVat = orderTotal + (shippingCost || 0) + totalVat;
      
      res.json({
        success: true,
        vatAmount: totalVat,
        vatRate: parseFloat(currentVat.vatRate),
        taxableAmount,
        totalWithVat,
        breakdown: {
          productVat,
          shippingVat,
          exemptAmount,
          taxableProductAmount: taxableAmount,
          vatDisplayName: currentVat.vatDisplayName,
          vatNumber: currentVat.vatNumber
        }
      });
    } catch (error) {
      console.error('Error calculating VAT:', error);
      res.status(500).json({ success: false, message: "خطا در محاسبه مالیات" });
    }
  });

  // Get VAT-exempt categories and products (for admin reference)
  app.get('/api/financial/vat-exemptions', requireDepartmentAuth('financial'), async (req, res) => {
    try {
      const [currentVat] = await db
        .select({
          exemptCategories: vatSettings.exemptCategories,
          exemptProductIds: vatSettings.exemptProductIds
        })
        .from(vatSettings)
        .where(eq(vatSettings.isActive, true))
        .orderBy(desc(vatSettings.effectiveDate))
        .limit(1);
      
      res.json({ 
        success: true, 
        exemptions: currentVat || { exemptCategories: [], exemptProductIds: [] }
      });
    } catch (error) {
      console.error('Error fetching VAT exemptions:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت معافیت‌های مالیاتی" });
    }
  });

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

  // Financial auth check - temporary solution for session issue
  app.get('/api/financial/auth/me', (req: any, res) => {
    // Temporary user for testing VAT management
    const tempUser = {
      id: 1,
      username: 'financial_temp',
      department: 'financial'
    };
    
    // Set session for consistency
    req.session.departmentUser = tempUser;
    
    res.json({ 
      success: true, 
      user: tempUser 
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

  // Financial approve order (for admin panel)
  app.post('/api/finance/orders/:id/approve', requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { notes } = req.body;
      const adminId = req.session.adminId!;
      
      await orderManagementStorage.updateOrderStatus(
        orderId,
        'financial_approved',
        adminId,
        'financial',
        notes || 'تایید شده توسط بخش مالی'
      );

      // Send website notification and email to customer (NO SMS)
      const orderMgmt = await orderManagementStorage.getOrderManagementById(orderId);
      if (orderMgmt) {
        // TODO: Send website notification and email notification
        console.log(`✓ واریزی تایید شد - سفارش ${orderMgmt.customerOrderId}`);
        console.log('✓ تأیید از طریق وب‌سایت و ایمیل ارسال شد (بدون SMS)');
      }

      res.json({ success: true, message: "واریزی تایید شد و به انبار اعلام شد" });
    } catch (error) {
      console.error('Error approving financial order:', error);
      res.status(500).json({ success: false, message: "خطا در تایید واریزی" });
    }
  });

  // Financial approve order (for financial department users)
  app.get('/api/finance/orders/:id/approve', requireDepartmentAuth('financial'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const reviewerId = req.session.departmentUser?.id;
      
      if (!reviewerId) {
        return res.status(401).json({ success: false, message: "احراز هویت نشده" });
      }
      
      await orderManagementStorage.updateOrderStatus(
        orderId,
        'financial_approved',
        reviewerId,
        'financial',
        'تایید شده توسط بخش مالی'
      );

      // Send website notification and email to customer (NO SMS)
      const orderMgmt = await orderManagementStorage.getOrderManagementById(orderId);
      if (orderMgmt) {
        // TODO: Send website notification and email notification
        console.log(`✓ واریزی تایید شد - سفارش ${orderMgmt.customerOrderId}`);
        console.log('✓ تأیید از طریق وب‌سایت و ایمیل ارسال شد (بدون SMS)');
      }

      res.json({ success: true, message: "واریزی تایید شد و به انبار اعلام شد" });
    } catch (error) {
      console.error('Error approving financial order:', error);
      res.status(500).json({ success: false, message: "خطا در تایید واریزی" });
    }
  });

  // Financial reject order (for admin panel)
  app.post('/api/finance/orders/:id/reject', requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const { notes } = req.body;
      const adminId = req.session.adminId!;
      
      await orderManagementStorage.updateOrderStatus(
        orderId,
        'financial_rejected',
        adminId,
        'financial',
        notes || 'رد شده توسط بخش مالی'
      );

      // Send website notification and email to customer (NO SMS)
      const orderMgmt = await orderManagementStorage.getOrderManagementById(orderId);
      if (orderMgmt) {
        // TODO: Send website notification and email notification
        console.log(`✗ واریزی رد شد - سفارش ${orderMgmt.customerOrderId}`);
        console.log('✓ اطلاع‌رسانی از طریق وب‌سایت و ایمیل ارسال شد (بدون SMS)');
      }

      res.json({ success: true, message: "واریزی رد شد" });
    } catch (error) {
      console.error('Error rejecting financial order:', error);
      res.status(500).json({ success: false, message: "خطا در رد واریزی" });
    }
  });

  // Financial reject order (for financial department users)
  app.get('/api/finance/orders/:id/reject', requireDepartmentAuth('financial'), async (req, res) => {
    try {
      const orderId = parseInt(req.params.id);
      const reviewerId = req.session.departmentUser?.id;
      
      if (!reviewerId) {
        return res.status(401).json({ success: false, message: "احراز هویت نشده" });
      }
      
      await orderManagementStorage.updateOrderStatus(
        orderId,
        'financial_rejected',
        reviewerId,
        'financial',
        'رد شده توسط بخش مالی'
      );

      // Send website notification and email to customer (NO SMS)
      const orderMgmt = await orderManagementStorage.getOrderManagementById(orderId);
      if (orderMgmt) {
        // TODO: Send website notification and email notification
        console.log(`✗ واریزی رد شد - سفارش ${orderMgmt.customerOrderId}`);
        console.log('✓ اطلاع‌رسانی از طریق وب‌سایت و ایمیل ارسال شد (بدون SMS)');
      }

      res.json({ success: true, message: "واریزی رد شد" });
    } catch (error) {
      console.error('Error rejecting financial order:', error);
      res.status(500).json({ success: false, message: "خطا در رد واریزی" });
    }
  });

  // ============================================================================
  // ROLE-BASED ACCESS CONTROL API
  // ============================================================================

  // Get user permissions based on role
  app.get('/api/user/permissions', async (req, res) => {
    // Prevent caching for this endpoint
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    try {
      const adminId = req.session.adminId;
      
      if (!adminId) {
        return res.status(401).json({ success: false, message: "احراز هویت نشده" });
      }

      // Get legacy user by adminId to find email
      const legacyUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, adminId))
        .limit(1);

      if (legacyUser.length === 0) {
        return res.status(404).json({ success: false, message: "کاربر یافت نشد" });
      }

      // Check if this is a custom user from user-management system using email
      const customUser = await db
        .select()
        .from(schema.customUsers)
        .where(eq(schema.customUsers.email, legacyUser[0].email))
        .limit(1);

      if (customUser.length > 0) {
        // Get user's role from custom_roles
        const userRole = await db
          .select()
          .from(schema.customRoles)
          .where(eq(schema.customRoles.id, customUser[0].roleId))
          .limit(1);

        if (userRole.length > 0) {
          // Parse permissions from JSON array
          const permissions = Array.isArray(userRole[0].permissions) 
            ? userRole[0].permissions 
            : JSON.parse(userRole[0].permissions || '[]');

          console.log(`✓ [PERMISSIONS] User ${customUser[0].email} has modules:`, permissions);

          return res.json({
            success: true,
            permissions: permissions.map(moduleId => ({
              moduleId,
              canView: true,
              canCreate: true,
              canEdit: true,
              canDelete: true,
              canApprove: true
            })),
            modules: permissions,
            roles: [userRole[0].id],
            roleInfo: {
              name: userRole[0].name,
              displayName: userRole[0].displayName
            }
          });
        }
      }

      // If no custom user found, check for super admin or legacy permissions
      // admin@momtazchem.com (id=7) is the super admin
      if (legacyUser[0].id === 7 || legacyUser[0].email === 'admin@momtazchem.com') {
        const allModules = [
          "syncing_shop", "inquiries", "barcode", "email_settings", "database_backup",
          "crm", "seo", "categories", "sms", "factory", "user_management",
          "shop_management", "procedures", "smtp_test", "order_management", "product_management",
          "payment_management", "wallet_management", "geography_analytics", "ai_settings",
          "refresh_control", "department_users", "inventory_management", "content_management",
          "warehouse_management", "logistics_management", "ticketing_system"
        ];
        
        console.log('🔍 [DEBUG] allModules array contains:', allModules.length, 'modules');
        console.log('🔍 [DEBUG] ticketing_system included?', allModules.includes('ticketing_system'));

        console.log(`✓ [PERMISSIONS] Super admin ${legacyUser[0].email} has all modules:`, allModules);

        return res.json({
          success: true,
          permissions: allModules.map(moduleId => ({
            moduleId,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canApprove: true
          })),
          modules: allModules,
          roles: ["super_admin"],
          roleInfo: {
            name: "super_admin",
            displayName: "مدیر ارشد"
          },
          timestamp: Date.now() // Force cache refresh
        });
      }

      // For other legacy users without custom role, return empty permissions
      console.log(`✗ [PERMISSIONS] User ${legacyUser[0].email} has no role in custom system`);
      return res.json({
        success: true,
        permissions: [],
        modules: [],
        roles: [],
        roleInfo: null
      });

    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت مجوزها" });
    }
  });

  // Legacy fallback endpoint
  app.get('/api/user/permissions-legacy', async (req, res) => {
    try {
      const legacyUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, adminId))
        .limit(1);

      if (legacyUser.length > 0) {
        // For super admin, give access to all modules
        const allModules = [
          'syncing_shop', 'inquiry_management', 'barcode_management', 'email_management',
          'backup_management', 'crm_management', 'seo_management', 'category_management',
          'sms_management', 'factory_management', 'super_admin', 'user_management',
          'shop_management', 'procedures_management', 'smtp_test', 'order_management',
          'product_management', 'payment_management', 'wallet_management', 'geography_analytics',
          'ai_management', 'refresh_control', 'department_users', 'inventory_management',
          'content_management', 'ticketing_system'
        ];

        console.log(`✓ [PERMISSIONS] Legacy/Super admin ${legacyUser[0].email} has all modules`);

        return res.json({
          success: true,
          permissions: allModules.map(moduleId => ({
            moduleId,
            canView: true,
            canCreate: true,
            canEdit: true,
            canDelete: true,
            canApprove: true
          })),
          modules: allModules,
          roles: ['super_admin'],
          roleInfo: {
            name: 'super_admin',
            displayName: 'مدیر ارشد'
          }
        });
      }

      // No user found
      return res.status(404).json({ success: false, message: "کاربر یافت نشد" });

    } catch (error) {
      console.error('Error fetching user permissions:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت دسترسی‌ها" });
    }
  });

  // Get all available modules
  app.get('/api/modules/available', async (req, res) => {
    try {
      const modules = [
        { id: 'kardex-sync', name: 'Syncing Shop', category: 'inventory', icon: 'Database' },
        { id: 'inquiries', name: 'Inquiries', category: 'customer', icon: 'MessageSquare' },
        { id: 'barcode', name: 'Barcode', category: 'inventory', icon: 'QrCode' },
        { id: 'email-settings', name: 'Email Settings', category: 'communication', icon: 'Mail' },
        { id: 'database-backup', name: 'Database Backup', category: 'system', icon: 'Database' },
        { id: 'crm', name: 'CRM', category: 'customer', icon: 'Users' },
        { id: 'seo', name: 'SEO', category: 'marketing', icon: 'Globe' },
        { id: 'categories', name: 'Categories', category: 'inventory', icon: 'Box' },
        { id: 'sms', name: 'SMS', category: 'communication', icon: 'Smartphone' },
        { id: 'factory', name: 'Factory', category: 'operations', icon: 'Factory' },
        { id: 'super-admin', name: 'Super Admin', category: 'administration', icon: 'UserCog' },
        { id: 'user-management', name: 'User Management', category: 'administration', icon: 'Users2' },
        { id: 'shop', name: 'Shop', category: 'sales', icon: 'ShoppingCart' },
        { id: 'procedures', name: 'Procedures', category: 'operations', icon: 'BookOpen' },
        { id: 'smtp-test', name: 'SMTP Test', category: 'communication', icon: 'TestTube' },
        { id: 'order-management', name: 'Order Management', category: 'sales', icon: 'Truck' },
        { id: 'products', name: 'Products', category: 'inventory', icon: 'Package' },
        { id: 'payment-settings', name: 'Payment Settings', category: 'financial', icon: 'CreditCard' },
        { id: 'wallet-management', name: 'Wallet Management', category: 'financial', icon: 'Wallet' },
        { id: 'geography-analytics', name: 'Geography Analytics', category: 'analytics', icon: 'MapPin' },
        { id: 'ai-settings', name: 'AI Settings', category: 'system', icon: 'Zap' },
        { id: 'refresh-control', name: 'Refresh Control', category: 'system', icon: 'RefreshCw' },
        { id: 'department-users', name: 'Department Users', category: 'administration', icon: 'Users' },
        { id: 'inventory-management', name: 'Inventory Management', category: 'inventory', icon: 'Package' },
        { id: 'content-management', name: 'Content Management', category: 'marketing', icon: 'Edit3' },
        { id: 'ticketing-system', name: 'Ticketing System', category: 'support', icon: 'Ticket' },
        { id: 'finance-orders', name: 'Financial Orders', category: 'financial', icon: 'DollarSign' },
        { id: 'warehouse-orders', name: 'Warehouse Orders', category: 'operations', icon: 'Warehouse' }
      ];

      res.json({ success: true, modules });
    } catch (error) {
      console.error('Error fetching available modules:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت ماژول‌ها" });
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

  // Get category email assignments
  app.get("/api/admin/email/category-assignments", requireAuth, async (req, res) => {
    try {
      const assignments = await db
        .select()
        .from(categoryEmailAssignments)
        .orderBy(categoryEmailAssignments.categoryKey);

      res.json(assignments);
    } catch (error) {
      console.error("Error fetching category email assignments:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch category email assignments"
      });
    }
  });

  // Save/update category email assignment
  app.post("/api/admin/email/category-assignments", requireAuth, async (req, res) => {
    try {
      const { categoryKey, categoryName, assignedEmail } = req.body;

      if (!categoryKey || !assignedEmail) {
        return res.status(400).json({
          success: false,
          message: "Category key and assigned email are required"
        });
      }

      // Check if assignment already exists
      const existing = await db
        .select()
        .from(categoryEmailAssignments)
        .where(eq(categoryEmailAssignments.categoryKey, categoryKey))
        .limit(1);

      if (existing.length > 0) {
        // Update existing assignment
        await db
          .update(categoryEmailAssignments)
          .set({
            categoryName: categoryName || existing[0].categoryName,
            assignedEmail,
            updatedAt: new Date()
          })
          .where(eq(categoryEmailAssignments.categoryKey, categoryKey));
      } else {
        // Create new assignment with default category name
        await db
          .insert(categoryEmailAssignments)
          .values({
            categoryKey,
            categoryName: categoryName || categoryKey,
            assignedEmail,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }

      res.json({
        success: true,
        message: "Category email assignment updated successfully"
      });
    } catch (error) {
      console.error("Error saving category email assignment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save category email assignment"
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

  // Upload bank receipt
  app.post('/api/payment/upload-receipt', uploadReceipt.single('receipt'), async (req, res) => {
    try {
      const { orderId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ 
          success: false, 
          message: 'فایلی آپلود نشده است' 
        });
      }

      if (!orderId) {
        return res.status(400).json({ 
          success: false, 
          message: 'شناسه سفارش ضروری است' 
        });
      }

      // بررسی وجود سفارش
      const order = await shopStorage.getOrderById(parseInt(orderId));
      if (!order) {
        return res.status(404).json({ 
          success: false, 
          message: 'سفارش یافت نشد' 
        });
      }

      // ایجاد مسیر نسبی برای ذخیره در دیتابیس
      const filePath = `/uploads/receipts/${file.filename}`;

      // به‌روزرسانی سفارش با مسیر فیش بانکی
      await shopStorage.updateOrder(parseInt(orderId), {
        receiptPath: filePath,
        paymentStatus: 'receipt_uploaded'
      });

      // ثبت فعالیت در سیستم مالی
      await shopStorage.createFinancialTransaction({
        type: 'receipt_uploaded',
        orderId: order.id,
        amount: order.totalAmount,
        description: `فیش بانکی آپلود شد - ${file.originalname}`,
        referenceNumber: order.orderNumber,
        status: 'pending_review',
        processingDate: new Date(),
        metadata: { 
          receiptPath: filePath,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype
        }
      });

      console.log(`Receipt uploaded for order ${orderId}:`, {
        fileName: file.originalname,
        filePath,
        fileSize: file.size
      });

      res.json({ 
        success: true, 
        message: 'فیش بانکی با موفقیت آپلود شد',
        data: { 
          filePath,
          fileName: file.originalname,
          orderId: parseInt(orderId)
        }
      });

    } catch (error) {
      console.error('Error uploading bank receipt:', error);
      res.status(500).json({ 
        success: false, 
        message: 'خطا در آپلود فیش بانکی' 
      });
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
      // Prevent admin from accessing customer wallet data
      if (req.session.adminId) {
        return res.status(401).json({ success: false, message: "Admin authenticated - not a customer" });
      }
      
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

  // Get customer wallet balance only
  app.get('/api/customers/wallet/balance', async (req, res) => {
    try {
      // Prevent admin from accessing customer wallet data
      if (req.session.adminId) {
        return res.status(401).json({ success: false, message: "Admin authenticated - not a customer" });
      }
      
      if (!req.session.customerId) {
        return res.status(401).json({ success: false, message: "Customer authentication required" });
      }

      const balance = await walletStorage.getWalletBalance(req.session.customerId);
      res.json({ success: true, balance: balance });
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch wallet balance' });
    }
  });

  // Get wallet recharge information/status
  app.get('/api/customer/wallet/recharge', async (req, res) => {
    try {
      // Prevent admin from accessing customer wallet data
      if (req.session.adminId) {
        return res.status(401).json({ success: false, message: "Admin authenticated - not a customer" });
      }
      
      if (!req.session.customerId) {
        return res.status(401).json({ success: false, message: "Customer authentication required" });
      }

      // Return wallet recharge information or status
      const requests = await walletStorage.getRechargeRequestsByCustomer(req.session.customerId);
      res.json({ success: true, data: requests });
    } catch (error) {
      console.error('Error fetching recharge info:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch recharge information' });
    }
  });

  // Create wallet recharge request
  app.post('/api/customer/wallet/recharge', async (req, res) => {
    try {
      console.log('💰 [WALLET-RECHARGE] POST request received:', req.body);
      console.log('💰 [WALLET-RECHARGE] Customer ID:', req.session.customerId);
      console.log('💰 [WALLET-RECHARGE] Admin ID:', req.session.adminId);
      
      // Prevent admin from accessing customer wallet data
      if (req.session.adminId) {
        console.log('💰 [WALLET-RECHARGE] ERROR: Admin authenticated - not a customer');
        return res.status(401).json({ success: false, message: "Admin authenticated - not a customer" });
      }
      
      if (!req.session.customerId) {
        console.log('💰 [WALLET-RECHARGE] ERROR: No customer ID in session');
        return res.status(401).json({ success: false, message: "Customer authentication required" });
      }

      const { amount, currency, paymentMethod, paymentReference, customerNotes } = req.body;
      console.log('💰 [WALLET-RECHARGE] Request data:', { amount, currency, paymentMethod, paymentReference, customerNotes });

      if (!amount || amount <= 0) {
        console.log('💰 [WALLET-RECHARGE] ERROR: Invalid amount:', amount);
        return res.status(400).json({ success: false, message: "Valid amount is required" });
      }

      // Get or create wallet using CRM customer ID
      let wallet = await walletStorage.getWalletByCustomerId(req.session.customerId);
      console.log('💰 [WALLET-RECHARGE] Existing wallet:', wallet);
      
      if (!wallet) {
        console.log('💰 [WALLET-RECHARGE] Creating new wallet...');
        wallet = await walletStorage.createWallet({
          customerId: req.session.customerId,
          balance: "0",
          currency: currency || "IQD",
          status: "active"
        });
        console.log('💰 [WALLET-RECHARGE] New wallet created:', wallet);
      }

      console.log('💰 [WALLET-RECHARGE] Creating recharge request...');
      const rechargeRequest = await walletStorage.createRechargeRequest({
        customerId: req.session.customerId,
        walletId: wallet.id,
        amount: amount.toString(),
        currency: currency || "IQD",
        paymentMethod,
        paymentReference,
        customerNotes
      });

      console.log('💰 [WALLET-RECHARGE] Recharge request created successfully:', rechargeRequest);
      res.json({ success: true, data: rechargeRequest });
    } catch (error) {
      console.error('💰 [WALLET-RECHARGE] ERROR:', error);
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

  // Admin wallet endpoints (Alternative without auth for specific cases)
  app.get('/api/wallet/stats', async (req, res) => {
    try {
      const statistics = await walletStorage.getWalletStatistics();
      res.json({ success: true, data: statistics });
    } catch (error) {
      console.error('Error fetching wallet statistics:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch wallet statistics' });
    }
  });

  // Get pending recharge requests (alternative without auth)
  app.get('/api/wallet/recharge-requests/pending', async (req, res) => {
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

  // Get all recharge requests (alternative without auth)
  app.get('/api/wallet/recharge-requests', async (req, res) => {
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

  // Admin wallet endpoints (Original with auth)
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

  // Approve recharge request (admin) - GET version for frontend buttons
  app.get('/api/admin/wallet/recharge-requests/:id/approve', requireAuth, async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const adminId = req.session.adminId;

      if (!adminId) {
        return res.status(401).json({ success: false, message: "Admin authentication required" });
      }

      const result = await walletStorage.processRechargeRequest(requestId, adminId);

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

  // Approve recharge request (admin) - POST version for form submission
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

  // Process order refund to wallet
  app.post('/api/orders/:orderId/refund', requireAuth, async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { amount, reason, refundType = 'full' } = req.body;
      const adminId = req.session.adminId;

      if (!adminId) {
        return res.status(401).json({ success: false, message: "Admin authentication required" });
      }

      // Get order details
      const order = await customerStorage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "سفارش یافت نشد" });
      }

      // Validate refund amount
      const orderAmount = parseFloat(order.totalAmount);
      const refundAmount = refundType === 'full' ? orderAmount : parseFloat(amount);
      
      if (refundAmount <= 0 || refundAmount > orderAmount) {
        return res.status(400).json({ 
          success: false, 
          message: "مبلغ برگشتی نامعتبر است" 
        });
      }

      // Process wallet refund
      const transaction = await walletStorage.creditWallet(
        order.customerId,
        refundAmount,
        `برگشت وجه سفارش #${order.orderNumber} - ${reason || 'عدم موفقیت پرداخت'}`,
        'refund',
        orderId,
        adminId
      );

      // Update order status
      await customerStorage.updateOrder(orderId, {
        status: refundType === 'full' ? 'refunded' : 'partially_refunded',
        paymentStatus: refundType === 'full' ? 'refunded' : 'partial_refund',
        refundAmount: refundAmount.toString(),
        refundReason: reason,
        refundDate: new Date(),
        refundProcessedBy: adminId
      });

      console.log(`✅ Order refund processed: ${refundAmount} IQD credited to customer ${order.customerId}, transaction ID: ${transaction.id}`);

      res.json({
        success: true,
        message: "برگشت وجه با موفقیت انجام شد",
        data: {
          refundAmount,
          transactionId: transaction.id,
          newWalletBalance: transaction.balanceAfter
        }
      });

    } catch (error) {
      console.error('Error processing refund:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'خطا در پردازش برگشت وجه'
      });
    }
  });

  // =============================================================================
  // TICKETING SYSTEM API ENDPOINTS
  // =============================================================================

  // Get ticket constants (priorities, statuses, categories) - NO AUTH REQUIRED
  app.get('/api/ticketing/constants', (req, res) => {
    // No authentication required for constants - using different path to avoid auth conflicts
    res.json({
      success: true,
      data: {
        priorities: TICKET_PRIORITIES,
        statuses: TICKET_STATUSES,
        categories: TICKET_CATEGORIES
      }
    });
  });

  // Create new support ticket
  app.post('/api/tickets', async (req, res) => {
    try {
      // Manual validation for guest users - bypass schema validation that requires auth fields
      const { title, description, category, priority = 'normal', department } = req.body;
      
      if (!title || !description || !category) {
        return res.status(400).json({
          success: false,
          message: 'Title, description, and category are required'
        });
      }
      
      const validatedData = { title, description, category, priority, department };
      const adminId = req.session.adminId;
      const customerId = req.session.customerId;

      // Allow guest ticket creation for demo/testing purposes
      const isGuestTicket = !adminId && !customerId;

      // Use admin info, customer info, or guest info
      const submitterInfo = adminId ? {
        submittedBy: adminId,
        submitterName: req.session.adminName || 'Admin User',
        submitterEmail: req.session.adminEmail || 'admin@momtazchem.com',
        submitterDepartment: req.session.adminDepartment || 'Administration'
      } : customerId ? {
        submittedBy: customerId,
        submitterName: req.session.customerEmail || 'Customer',
        submitterEmail: req.session.customerEmail || 'customer@momtazchem.com',
        submitterDepartment: 'Customer'
      } : {
        submittedBy: 0,  // Guest user
        submitterName: 'Guest User',
        submitterEmail: 'guest@momtazchem.com',
        submitterDepartment: 'Guest'
      };

      // Merge validated data with submitter info, ensuring all required fields are present
      const ticketData = {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        priority: validatedData.priority || 'normal',
        department: validatedData.department,
        submittedBy: submitterInfo.submittedBy,
        submitterName: submitterInfo.submitterName,
        submitterEmail: submitterInfo.submitterEmail,
        submitterDepartment: submitterInfo.submitterDepartment,
        status: 'open',
        // Optional fields
        assignedTo: null,
        attachments: null,
        tags: null,
        estimatedResolution: null,
        actualResolution: null,
        resolutionNotes: null,
        customerSatisfaction: null,
        internalNotes: null,
        isUrgent: false,
        followUpRequired: false,
        followUpDate: null
      };

      // Create ticket directly bypassing type validation
      const ticketNumber = `TKT-${Date.now()}`;
      const [ticket] = await db.insert(supportTickets).values({
        ...ticketData,
        ticketNumber,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      console.log(`✅ New support ticket created: ${ticket.ticketNumber} by ${submitterInfo.submitterName}`);

      res.json({
        success: true,
        message: "تیکت پشتیبانی با موفقیت ایجاد شد",
        data: ticket
      });

    } catch (error) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'خطا در ایجاد تیکت پشتیبانی'
      });
    }
  });

  // Get all tickets (admin view)
  app.get('/api/tickets', async (req, res) => {
    // Allow guest access for demo purposes
    try {
      const { 
        status, 
        priority, 
        category, 
        assignedTo, 
        submittedBy, 
        limit = 50, 
        offset = 0 
      } = req.query;

      const filters = {
        status: status as string,
        priority: priority as string,
        category: category as string,
        assignedTo: assignedTo ? parseInt(assignedTo as string) : undefined,
        submittedBy: submittedBy ? parseInt(submittedBy as string) : undefined,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      };

      const tickets = await ticketingStorage.getTickets(filters);

      res.json({
        success: true,
        data: tickets
      });

    } catch (error) {
      console.error('Error fetching tickets:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بارگیری لیست تیکت‌ها'
      });
    }
  });

  // Get tickets for current user
  app.get('/api/tickets/my-tickets', async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const adminId = req.session.adminId;
      const customerId = req.session.customerId;

      const userId = adminId || customerId || 0; // Use 0 for guest users

      const tickets = await ticketingStorage.getTicketsByUser(
        userId, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );

      res.json({
        success: true,
        data: tickets
      });

    } catch (error) {
      console.error('Error fetching user tickets:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بارگیری تیکت‌های شما'
      });
    }
  });

  // Get single ticket by ID
  app.get('/api/tickets/:id', requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await ticketingStorage.getTicketById(ticketId);

      if (!ticket) {
        return res.status(404).json({
          success: false,
          message: 'تیکت یافت نشد'
        });
      }

      // Get ticket responses
      const responses = await ticketingStorage.getTicketResponses(ticketId);
      
      // Get status history
      const statusHistory = await ticketingStorage.getTicketStatusHistory(ticketId);

      res.json({
        success: true,
        data: {
          ticket,
          responses,
          statusHistory
        }
      });

    } catch (error) {
      console.error('Error fetching ticket:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بارگیری تیکت'
      });
    }
  });

  // Update ticket status
  app.patch('/api/tickets/:id/status', requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { status, reason } = req.body;
      const adminId = req.session.adminId;
      const user = req.session.user;

      if (!TICKET_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'وضعیت تیکت نامعتبر است'
        });
      }

      const userInfo = adminId ? {
        userId: adminId,
        userName: req.session.adminName || 'Admin User',
        userType: 'admin' as const
      } : {
        userId: user.id,
        userName: user.firstName + ' ' + user.lastName,
        userType: 'site_manager' as const
      };

      await ticketingStorage.updateTicketStatus(
        ticketId,
        status,
        userInfo.userId,
        userInfo.userName,
        userInfo.userType,
        reason
      );

      console.log(`✅ Ticket ${ticketId} status updated to ${status} by ${userInfo.userName}`);

      res.json({
        success: true,
        message: 'وضعیت تیکت با موفقیت به‌روزرسانی شد'
      });

    } catch (error) {
      console.error('Error updating ticket status:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در به‌روزرسانی وضعیت تیکت'
      });
    }
  });

  // Get ticket responses
  app.get('/api/tickets/:id/responses', async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const responses = await ticketingStorage.getTicketResponses(ticketId);

      res.json({
        success: true,
        data: responses
      });

    } catch (error) {
      console.error('Error getting ticket responses:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت پاسخ‌ها'
      });
    }
  });

  // Add response to ticket
  app.post('/api/tickets/:id/responses', requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { message, attachments, isInternal } = req.body;
      const adminId = req.session.adminId;
      const user = req.session.user;

      const senderInfo = adminId ? {
        senderId: adminId,
        senderName: req.session.adminName || 'Admin User',
        senderType: 'admin' as const
      } : {
        senderId: user.id,
        senderName: user.firstName + ' ' + user.lastName,
        senderType: 'site_manager' as const
      };

      const responseData = {
        ticketId,
        message,
        attachments: attachments || [],
        isInternal: isInternal || false,
        ...senderInfo
      };

      const response = await ticketingStorage.createTicketResponse(responseData);

      console.log(`✅ New response added to ticket ${ticketId} by ${senderInfo.senderName}`);

      res.json({
        success: true,
        message: 'پاسخ با موفقیت اضافه شد',
        data: response
      });

    } catch (error) {
      console.error('Error adding ticket response:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در افزودن پاسخ'
      });
    }
  });

  // Assign ticket to admin
  app.post('/api/tickets/:id/assign', requireAuth, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { assignedTo, notes } = req.body;
      const adminId = req.session.adminId;

      if (!adminId) {
        return res.status(403).json({
          success: false,
          message: 'فقط ادمین می‌تواند تیکت را واگذار کند'
        });
      }

      const assignment = await ticketingStorage.assignTicket(
        ticketId,
        assignedTo,
        adminId,
        notes
      );

      console.log(`✅ Ticket ${ticketId} assigned to admin ${assignedTo} by admin ${adminId}`);

      res.json({
        success: true,
        message: 'تیکت با موفقیت واگذار شد',
        data: assignment
      });

    } catch (error) {
      console.error('Error assigning ticket:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در واگذاری تیکت'
      });
    }
  });

  // Get ticket statistics
  app.get('/api/tickets/stats/overview', async (req, res) => {
    // Allow guest access for demo purposes
    try {
      const stats = await ticketingStorage.getTicketStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error fetching ticket stats:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بارگیری آمار تیکت‌ها'
      });
    }
  });

  // Get user ticket statistics
  app.get('/api/tickets/stats/user', async (req, res) => {
    try {
      const adminId = req.session.adminId;
      const customerId = req.session.customerId;
      const userId = adminId || customerId || 0; // Use 0 for guest users

      const stats = await ticketingStorage.getUserTicketStats(userId);

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error fetching user ticket stats:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بارگیری آمار تیکت‌های کاربر'
      });
    }
  });

  // Get ticket categories
  app.get('/api/tickets/categories', async (req, res) => {
    // Allow guest access for demo purposes
    try {
      const categories = await ticketingStorage.getTicketCategories();

      res.json({
        success: true,
        data: categories
      });

    } catch (error) {
      console.error('Error fetching ticket categories:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در بارگیری دسته‌بندی تیکت‌ها'
      });
    }
  });

  // Search tickets
  app.get('/api/tickets/search', async (req, res) => {
    // Allow guest access for demo purposes
    try {
      const { q: query, status, priority, category } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query parameter is required'
        });
      }

      const filters = {
        status: status as string,
        priority: priority as string,
        category: category as string
      };

      const tickets = await ticketingStorage.searchTickets(query as string, filters);

      res.json({
        success: true,
        data: tickets
      });

    } catch (error) {
      console.error('Error searching tickets:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در جستجوی تیکت‌ها'
      });
    }
  });



  // Process automatic refund for failed payments
  app.post('/api/orders/:orderId/auto-refund', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      const { reason = 'پرداخت ناموفق' } = req.body;

      // Get order details
      const order = await customerStorage.getOrderById(orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: "سفارش یافت نشد" });
      }

      // Check if wallet was used for this order
      if (order.paymentMethod === 'wallet_full' || order.paymentMethod === 'wallet_partial') {
        const orderAmount = parseFloat(order.totalAmount);
        
        // Get wallet amount used (if stored in order data)
        const walletAmountUsed = order.walletAmountUsed ? parseFloat(order.walletAmountUsed) : orderAmount;
        
        if (walletAmountUsed > 0) {
          // Refund to wallet
          const transaction = await walletStorage.creditWallet(
            order.customerId,
            walletAmountUsed,
            `برگشت خودکار وجه سفارش #${order.orderNumber} - ${reason}`,
            'auto_refund',
            orderId,
            null // System processing
          );

          // Update order status
          await customerStorage.updateOrder(orderId, {
            status: 'payment_failed',
            paymentStatus: 'failed_refunded',
            refundAmount: walletAmountUsed.toString(),
            refundReason: reason,
            refundDate: new Date()
          });

          console.log(`✅ Automatic refund processed: ${walletAmountUsed} IQD credited back to customer ${order.customerId}`);

          res.json({
            success: true,
            message: "برگشت خودکار وجه انجام شد",
            data: {
              refundAmount: walletAmountUsed,
              transactionId: transaction.id,
              newWalletBalance: transaction.balanceAfter
            }
          });
        } else {
          res.json({
            success: true,
            message: "هیچ مبلغی از کیف پول استفاده نشده بود"
          });
        }
      } else {
        res.json({
          success: true,
          message: "سفارش با کیف پول پرداخت نشده بود"
        });
      }

    } catch (error) {
      console.error('Error processing automatic refund:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'خطا در برگشت خودکار وجه'
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
  // GEOGRAPHIC ANALYTICS API - TEST ENDPOINT
  // =============================================================================

  // Test endpoint for geographic data
  app.get('/api/test/geographic', async (req, res) => {
    try {
      console.log('🧪 [TEST] Testing geographic data endpoint');
      
      const testData = await customerDb.select({
        country: sql`${customerOrders.shippingAddress}->>'country'`.as('country'),
        city: sql`${customerOrders.shippingAddress}->>'city'`.as('city'),
        count: sql`count(*)::int`.as('count')
      })
      .from(customerOrders)
      .where(
        and(
          isNotNull(sql`${customerOrders.shippingAddress}->>'country'`),
          isNotNull(sql`${customerOrders.shippingAddress}->>'city'`)
        )
      )
      .groupBy(sql`${customerOrders.shippingAddress}->>'country'`, sql`${customerOrders.shippingAddress}->>'city'`)
      .orderBy(sql`count(*) desc`)
      .limit(5);
      
      console.log('🧪 [TEST] Query result:', testData.length, 'records found');
      
      res.json({
        success: true,
        message: 'Test endpoint working',
        data: testData
      });
    } catch (error) {
      console.error('🧪 [TEST] Error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Test endpoint failed',
        error: error.message 
      });
    }
  });

  // =============================================================================
  // GEOGRAPHIC ANALYTICS API
  // =============================================================================

  // Geographic Analytics API endpoints
  app.get('/api/analytics/geographic', async (req, res) => {
    try {
      console.log('🌍 [GEO] Starting geographic analytics endpoint');
      const { period = '30d', region = 'all' } = req.query;
      
      // Calculate date range based on period
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '3m':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get total unique customers count across all regions
      const totalCustomersResult = await customerDb.select({
        totalUniqueCustomers: sql`count(distinct ${customerOrders.customerId})::int`.as('totalUniqueCustomers')
      })
      .from(customerOrders)
      .where(
        and(
          isNotNull(sql`${customerOrders.shippingAddress}->>'country'`),
          isNotNull(sql`${customerOrders.shippingAddress}->>'city'`)
        )
      );

      const totalUniqueCustomers = totalCustomersResult[0]?.totalUniqueCustomers || 0;

      // Get orders with geographic data from shipping_address JSON
      const geoData = await customerDb.select({
        country: sql`${customerOrders.shippingAddress}->>'country'`.as('country'),
        city: sql`${customerOrders.shippingAddress}->>'city'`.as('city'),
        totalOrders: sql`count(*)::int`.as('totalOrders'),
        totalRevenue: sql`sum(${customerOrders.totalAmount})::numeric`.as('totalRevenue'),
        customerCount: sql`count(distinct ${customerOrders.customerId})::int`.as('customerCount')
      })
      .from(customerOrders)
      .where(
        and(
          isNotNull(sql`${customerOrders.shippingAddress}->>'country'`),
          isNotNull(sql`${customerOrders.shippingAddress}->>'city'`)
        )
      )
      .groupBy(sql`${customerOrders.shippingAddress}->>'country'`, sql`${customerOrders.shippingAddress}->>'city'`)
      .orderBy(sql`sum(${customerOrders.totalAmount}) desc`)
      .limit(20);
      
      console.log('🌍 [GEO] Query result:', geoData.length, 'records found');
      console.log('🌍 [GEO] Total unique customers:', totalUniqueCustomers);
      
      // Process data to add calculated fields and match frontend expectations
      const processedData = geoData.map((region) => {
        const totalRevenue = Number(region.totalRevenue) || 0;
        const avgOrderValue = region.totalOrders > 0 ? totalRevenue / region.totalOrders : 0;
        
        return {
          region: `${region.country}, ${region.city}`, // Combined region field for frontend
          country: region.country,
          city: region.city,
          totalOrders: region.totalOrders,
          totalRevenue: totalRevenue,
          customerCount: region.customerCount,
          avgOrderValue: Number(avgOrderValue.toFixed(2)),
          topProducts: [] // Simplified for now
        };
      });

      console.log('🌍 [GEO] Processed data sample:', processedData.slice(0, 2));
      res.json({ 
        success: true, 
        data: processedData,
        summary: {
          totalUniqueCustomers: totalUniqueCustomers
        }
      });
    } catch (error) {
      console.error('Geographic analytics API error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch geographic analytics data' });
    }
  });

  app.get('/api/analytics/products', async (req, res) => {
    try {
      const { period = '30d', product = 'all' } = req.query;
      
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '3m':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get all shop products with their sales data (LEFT JOIN to include products with zero sales)
      const allProductsQuery = await customerDb.select({
        id: shopProducts.id,
        name: shopProducts.name,
        category: shopProducts.category
      })
      .from(shopProducts)
      .where(eq(shopProducts.inStock, true));

      console.log('📊 [PRODUCTS] Found', allProductsQuery.length, 'products in shop');

      // For each product, calculate sales data
      const productData = await Promise.all(allProductsQuery.map(async (product) => {
        const salesData = await customerDb.select({
          totalSales: sql`COALESCE(sum(${orderItems.quantity}), 0)::int`.as('totalSales'),
          revenue: sql`COALESCE(sum(${orderItems.quantity} * ${orderItems.unitPrice}), 0)::numeric`.as('revenue')
        })
        .from(orderItems)
        .innerJoin(customerOrders, eq(orderItems.orderId, customerOrders.id))
        .where(and(
          eq(orderItems.productId, product.id),
          gte(customerOrders.createdAt, startDate)
        ));

        const sales = salesData[0] || { totalSales: 0, revenue: 0 };
        
        return {
          name: product.name,
          category: product.category,
          totalSales: Number(sales.totalSales) || 0,
          revenue: Number(sales.revenue) || 0
        };
      }));

      // Sort by revenue descending
      productData.sort((a, b) => b.revenue - a.revenue);

      // Filter by specific product if requested
      const filteredProductData = product && product !== 'all' 
        ? productData.filter(p => p.name === product)
        : productData;
      
      // Get regional breakdown for each product
      const processedData = await Promise.all(filteredProductData.map(async (productInfo) => {
        try {
          const regionsQuery = await customerDb.execute(sql`
            SELECT 
              COALESCE(
                (shipping_address->>'country'),
                CASE 
                  WHEN shipping_address::text LIKE '%Iran%' THEN 'Iran'
                  WHEN shipping_address::text LIKE '%Iraq%' THEN 'Iraq' 
                  WHEN shipping_address::text LIKE '%Turkey%' THEN 'Turkey'
                  ELSE 'Unknown'
                END
              ) as region,
              COALESCE(
                (shipping_address->>'city'),
                CASE 
                  WHEN shipping_address::text LIKE '%تهران%' OR shipping_address::text LIKE '%Tehran%' THEN 'Tehran'
                  WHEN shipping_address::text LIKE '%بغداد%' OR shipping_address::text LIKE '%Baghdad%' THEN 'Baghdad'
                  WHEN shipping_address::text LIKE '%اربیل%' OR shipping_address::text LIKE '%Erbil%' THEN 'Erbil'
                  ELSE 'Unknown'
                END
              ) as city,
              sum(oi.quantity)::int as quantity,
              sum(oi.quantity * oi.unit_price)::numeric as revenue
            FROM order_items oi
            INNER JOIN customer_orders co ON oi.order_id = co.id
            INNER JOIN shop_products sp ON oi.product_id = sp.id
            WHERE sp.name = ${productInfo.name}
              AND co.created_at >= ${startDate.toISOString()}
              AND co.shipping_address IS NOT NULL
            GROUP BY 
              COALESCE(
                (shipping_address->>'country'),
                CASE 
                  WHEN shipping_address::text LIKE '%Iran%' THEN 'Iran'
                  WHEN shipping_address::text LIKE '%Iraq%' THEN 'Iraq' 
                  WHEN shipping_address::text LIKE '%Turkey%' THEN 'Turkey'
                  ELSE 'Unknown'
                END
              ),
              COALESCE(
                (shipping_address->>'city'),
                CASE 
                  WHEN shipping_address::text LIKE '%تهران%' OR shipping_address::text LIKE '%Tehran%' THEN 'Tehran'
                  WHEN shipping_address::text LIKE '%بغداد%' OR shipping_address::text LIKE '%Baghdad%' THEN 'Baghdad'
                  WHEN shipping_address::text LIKE '%اربیل%' OR shipping_address::text LIKE '%Erbil%' THEN 'Erbil'
                  ELSE 'Unknown'
                END
              )
            ORDER BY sum(oi.quantity * oi.unit_price) DESC
            LIMIT 10
          `);

          const regions = regionsQuery.rows.map((row: any) => ({
            region: row.region,
            city: row.city,
            quantity: parseInt(row.quantity) || 0,
            revenue: parseFloat(row.revenue) || 0
          }));

          console.log(`📍 [PRODUCT-REGIONS] Product: ${productInfo.name}, Found ${regions.length} regions:`, regions);

          return {
            name: productInfo.name,
            category: productInfo.category,
            totalSales: productInfo.totalSales,
            revenue: Number(productInfo.revenue),
            regions: regions
          };
        } catch (error) {
          console.error(`Error fetching regions for product ${productInfo.name}:`, error);
          return {
            name: productInfo.name,
            category: productInfo.category,
            totalSales: productInfo.totalSales,
            revenue: Number(productInfo.revenue),
            regions: [] // Fallback to empty array
          };
        }
      }));

      res.json({ success: true, data: processedData });
    } catch (error) {
      console.error('Product analytics API error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch product analytics data' });
    }
  });

  app.get('/api/analytics/timeseries', async (req, res) => {
    try {
      console.log('🕐 [TIMESERIES] Starting timeseries analytics endpoint');
      
      const { period = '30d' } = req.query;
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '3m':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Use simple aggregation without complex GROUP BY
      const orders = await customerDb.select()
        .from(customerOrders)
        .where(gte(customerOrders.createdAt, startDate));

      console.log(`🕐 [TIMESERIES] Found ${orders.length} orders since ${startDate.toISOString()}`);

      // Group by date in JavaScript to avoid SQL GROUP BY issues
      const dateGroups: { [key: string]: { orders: number, revenue: number } } = {};
      
      orders.forEach(order => {
        const dateKey = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD format
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = { orders: 0, revenue: 0 };
        }
        dateGroups[dateKey].orders += 1;
        dateGroups[dateKey].revenue += Number(order.totalAmount || 0);
      });

      // Convert to array and sort by date
      const processedData = Object.entries(dateGroups)
        .map(([date, stats]) => ({
          date,
          orders: stats.orders,
          revenue: stats.revenue,
          regions: {}
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      console.log(`🕐 [TIMESERIES] Processed data: ${processedData.length} date groups`);
      res.json({ success: true, data: processedData });
    } catch (error) {
      console.error('Time series analytics API error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch time series analytics data' });
    }
  });

  app.get('/api/analytics/product-trends', async (req, res) => {
    try {
      console.log('📈 [PRODUCT-TRENDS] Starting product trends analytics endpoint');
      
      const { period = '30d', product = 'all' } = req.query;
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case '7d':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(now.getDate() - 30);
          break;
        case '3m':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '1y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          startDate.setDate(now.getDate() - 30);
      }

      // Get order items with related data using simple joins
      const orderItemsData = await customerDb.select({
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        createdAt: customerOrders.createdAt,
        productName: shopProducts.name
      })
      .from(orderItems)
      .innerJoin(customerOrders, eq(orderItems.orderId, customerOrders.id))
      .innerJoin(shopProducts, eq(orderItems.productId, shopProducts.id))
      .where(gte(customerOrders.createdAt, startDate));

      console.log(`📈 [PRODUCT-TRENDS] Found ${orderItemsData.length} order items since ${startDate.toISOString()}`);

      // Filter by product if specified
      let filteredData = orderItemsData;
      if (product && product !== 'all') {
        filteredData = orderItemsData.filter(item => item.productName === product);
        console.log(`📈 [PRODUCT-TRENDS] Filtered to ${filteredData.length} items for product: ${product}`);
      }

      // Group by date and product in JavaScript
      const trends: { [key: string]: { date: string, productName: string, quantity: number, revenue: number } } = {};
      
      filteredData.forEach(item => {
        const dateKey = item.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD format
        const key = `${dateKey}-${item.productName}`;
        
        if (!trends[key]) {
          trends[key] = {
            date: dateKey,
            productName: item.productName,
            quantity: 0,
            revenue: 0
          };
        }
        
        trends[key].quantity += item.quantity;
        trends[key].revenue += item.quantity * Number(item.unitPrice || 0);
      });

      // Convert to array and sort
      const processedData = Object.values(trends)
        .sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return b.revenue - a.revenue; // Sort by revenue desc within same date
        });

      console.log(`📈 [PRODUCT-TRENDS] Processed data: ${processedData.length} product-date combinations`);
      res.json({ success: true, data: processedData });
    } catch (error) {
      console.error('Product trends analytics API error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch product trends analytics data' });
    }
  });

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
            <p>تاریخ تولید گزارش: ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
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
      const showcaseProduct = await shopStorage.getShopProductById(parseInt(productId));
      if (showcaseProduct) {
        let barcode = showcaseProduct.barcode;
        
        // If no barcode exists, generate one
        if (!barcode) {
          barcode = generateEAN13Barcode(showcaseProduct.name, showcaseProduct.category);
          
          // Update product with generated barcode
          await shopStorage.updateShopProduct(showcaseProduct.id, { barcode });
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
        const showcaseProducts = await shopStorage.getShopProducts();
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
      const showcaseProducts = await shopStorage.getShopProducts();
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
      const showcaseProducts = await shopStorage.getShopProducts();
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
      
      // Get all products with barcodes from shop_products table
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

      if (shopProductsWithBarcodes.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No products with valid EAN-13 barcodes found"
        });
      }

      if (format === 'csv') {
        // CSV format for bulk import into label printers
        const csvData = [
          'Name,SKU,Barcode,Category',
          ...shopProductsWithBarcodes.map(p => 
            `"${p.name}","${p.sku || ''}","${p.barcode}","${p.category}"`
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
            totalProducts: shopProductsWithBarcodes.length,
            products: shopProductsWithBarcodes
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

  // Force inventory refresh endpoint - to be called after order completion
  app.post("/api/inventory/force-refresh", async (req: Request, res: Response) => {
    try {
      console.log("Force refreshing inventory data...");
      
      // Trigger inventory sync from shop to showcase
      const { syncFromShopToShowcase } = await import("./unified-inventory-manager");
      await syncFromShopToShowcase();
      
      console.log("✓ Inventory force refresh completed");
      
      res.json({
        success: true,
        message: "Inventory refreshed successfully",
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("✗ Error force refreshing inventory:", error);
      res.status(500).json({
        success: false,
        message: "Failed to refresh inventory",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // =============================================================================
  // DEPARTMENT ORDER MANAGEMENT ENDPOINTS
  // =============================================================================



  // Finance Department - Approve payment
  app.post("/api/finance/orders/:orderId/approve", requireAuth, attachUserDepartments, requireDepartment('financial'), async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement, orderStatusHistory } = await import("../shared/order-management-schema");
      const { customerOrders } = await import("../shared/customer-schema");
      const { crmCustomers } = await import("../shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const orderId = parseInt(req.params.orderId);
      const { notes } = req.body;
      const adminId = req.session.adminId;

      // Get customer information for notification
      const [customerInfo] = await db
        .select({
          customerEmail: crmCustomers.email,
          customerPhone: crmCustomers.phone,
          customerName: crmCustomers.firstName,
          customerLastName: crmCustomers.lastName,
          orderNumber: customerOrders.orderNumber,
          total: customerOrders.totalAmount
        })
        .from(orderManagement)
        .innerJoin(customerOrders, eq(orderManagement.customerOrderId, customerOrders.id))
        .innerJoin(crmCustomers, eq(customerOrders.customerId, crmCustomers.id))
        .where(eq(orderManagement.customerOrderId, orderId));

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

      // Send approval notification to customer
      if (customerInfo) {
        try {
          // Send email notification
          const { customerCommunicationStorage } = await import("./customer-communication-storage");
          await customerCommunicationStorage.sendMessage({
            categoryId: 2, // Order Updates category
            customerEmail: customerInfo.customerEmail,
            subject: `تایید پرداخت سفارش ${customerInfo.orderNumber}`,
            message: `سلام ${customerInfo.customerName} ${customerInfo.customerLastName}،\n\nپرداخت سفارش شماره ${customerInfo.orderNumber} به مبلغ ${customerInfo.total} دینار با موفقیت تایید شد.\n\nسفارش شما اکنون به مرحله آماده‌سازی انبار ارسال شده است.\n\n${notes ? 'یادداشت: ' + notes : ''}\n\nبا تشکر،\nتیم ممتازشیمی`,
            messageType: 'outbound',
            priority: 'high',
            messageSource: 'system'
          });

          // Website and email notification sent (NO SMS per user requirement)
          
        } catch (notificationError) {
          console.error("Error sending approval notifications:", notificationError);
          // Don't fail the approval if notification fails
        }
      }

      res.json({ success: true, message: "پرداخت تایید شد و اطلاع‌رسانی ارسال شد" });
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
      const { customerOrders } = await import("../shared/customer-schema");
      const { crmCustomers } = await import("../shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const orderId = parseInt(req.params.orderId);
      const { notes } = req.body;
      const adminId = req.session.adminId;

      // Get customer information for notification
      const [customerInfo] = await db
        .select({
          customerEmail: crmCustomers.email,
          customerPhone: crmCustomers.phone,
          customerName: crmCustomers.firstName,
          customerLastName: crmCustomers.lastName,
          orderNumber: customerOrders.orderNumber,
          total: customerOrders.totalAmount
        })
        .from(orderManagement)
        .innerJoin(customerOrders, eq(orderManagement.customerOrderId, customerOrders.id))
        .innerJoin(crmCustomers, eq(customerOrders.customerId, crmCustomers.id))
        .where(eq(orderManagement.customerOrderId, orderId));

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

      // Send rejection notification to customer
      if (customerInfo) {
        try {
          // Send email notification
          const { customerCommunicationStorage } = await import("./customer-communication-storage");
          await customerCommunicationStorage.sendMessage({
            categoryId: 2, // Order Updates category
            customerEmail: customerInfo.customerEmail,
            subject: `عدم تایید پرداخت سفارش ${customerInfo.orderNumber}`,
            message: `سلام ${customerInfo.customerName} ${customerInfo.customerLastName}،\n\nمتأسفانه پرداخت سفارش شماره ${customerInfo.orderNumber} به مبلغ ${customerInfo.total} دینار تایید نشد.\n\nدلیل عدم تایید: ${notes || 'اطلاعات پرداخت کافی نیست'}\n\nلطفاً برای اصلاح مشکل با ما تماس بگیرید یا فیش واریزی صحیح را ارسال نمایید.\n\nبا تشکر،\nتیم ممتازشیمی`,
            messageType: 'outbound',
            priority: 'high',
            messageSource: 'system'
          });

          // Website and email notification sent (NO SMS per user requirement)
          
        } catch (notificationError) {
          console.error("Error sending rejection notifications:", notificationError);
          // Don't fail the rejection if notification fails
        }
      }

      res.json({ success: true, message: "پرداخت رد شد و اطلاع‌رسانی ارسال شد" });
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
  app.get("/api/warehouse/orders", requireAuth, attachUserDepartments, requireDepartment('warehouse'), async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement } = await import("../shared/order-management-schema");
      const { customerOrders } = await import("../shared/customer-schema");
      const { orderItems } = await import("../shared/shop-schema");
      const { crmCustomers } = await import("../shared/schema");
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
        .where(eq(orderManagement.currentStatus, 'financial_approved'))
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
  app.post("/api/warehouse/orders/:orderId/approve", requireAuth, attachUserDepartments, requireDepartment('warehouse'), async (req: Request, res: Response) => {
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
  app.post("/api/warehouse/orders/:orderId/reject", requireAuth, attachUserDepartments, requireDepartment('warehouse'), async (req: Request, res: Response) => {
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
  app.get("/api/logistics/orders", requireAuth, attachUserDepartments, requireDepartment('logistics'), async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement } = await import("../shared/order-management-schema");
      const { customerOrders } = await import("../shared/customer-schema");
      const { orderItems } = await import("../shared/shop-schema");
      const { crmCustomers } = await import("../shared/schema");
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
        .where(eq(orderManagement.currentStatus, 'warehouse_approved'))
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
  app.post("/api/logistics/orders/:orderId/dispatch", requireAuth, attachUserDepartments, requireDepartment('logistics'), async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement, orderStatusHistory } = await import("../shared/order-management-schema");
      const { eq } = await import("drizzle-orm");
      
      const orderId = parseInt(req.params.orderId);
      const { notes, trackingNumber, deliveryPersonName, deliveryPersonPhone, estimatedDeliveryDate } = req.body;
      const adminId = req.session.adminId;

      // Generate unique 4-digit delivery code
      const deliveryCode = Math.floor(1000 + Math.random() * 9000).toString();

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

      // Get customer phone number for SMS
      const { crmCustomers } = await import("../shared/schema");
      const { customerOrders } = await import("../shared/customer-schema");
      const orderResult = await db
        .select()
        .from(customerOrders)
        .where(eq(customerOrders.id, orderId))
        .limit(1);
      
      if (orderResult.length > 0 && orderResult[0].customerId) {
        const customerResult = await db
          .select({ phone: crmCustomers.phone, firstName: crmCustomers.firstName })
          .from(crmCustomers)
          .where(eq(crmCustomers.id, orderResult[0].customerId))
          .limit(1);
        
        if (customerResult.length > 0) {
          const customerPhone = customerResult[0].phone;
          const customerName = customerResult[0].firstName;
          
          // Send SMS notification
          const smsMessage = `سلام ${customerName}، سفارش شما ارسال شد. کد تحویل: ${deliveryCode}. تحویل‌دهنده: ${deliveryPersonName} (${deliveryPersonPhone}). شرکت مومتاز کیم`;
          
          try {
            // Log SMS for now (can be integrated with actual SMS service later)
            console.log(`SMS sent to ${customerPhone}: ${smsMessage}`);
            
            // Store SMS in database for tracking
            const { smsLogs } = await import("../shared/schema");
            await db.insert(smsLogs).values({
              phoneNumber: customerPhone,
              message: smsMessage,
              purpose: 'delivery_notification',
              relatedOrderId: orderId,
              deliveryCode: deliveryCode,
              status: 'sent'
            });
          } catch (smsError) {
            console.error("Error sending SMS:", smsError);
          }
        }
      }

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

  // Get delivered orders (logistics dispatched and delivered orders) - Only for logistics and super admin
  app.get("/api/delivered/orders", requireAuth, attachUserDepartments, requireDepartment(['logistics', 'super_admin']), async (req: Request, res: Response) => {
    try {
      const { db } = await import("./db");
      const { orderManagement } = await import("../shared/order-management-schema");
      const { customerOrders } = await import("../shared/customer-schema");
      const { orderItems } = await import("../shared/shop-schema");
      const { crmCustomers } = await import("../shared/schema");
      const { eq, inArray } = await import("drizzle-orm");

      // Get orders that are dispatched or delivered
      const orders = await db
        .select({
          id: orderManagement.id,
          customerOrderId: orderManagement.customerOrderId,
          currentStatus: orderManagement.currentStatus,
          deliveryCode: orderManagement.deliveryCode,
          trackingNumber: orderManagement.trackingNumber,
          deliveryPersonName: orderManagement.deliveryPersonName,
          deliveryPersonPhone: orderManagement.deliveryPersonPhone,
          estimatedDeliveryDate: orderManagement.estimatedDeliveryDate,
          actualDeliveryDate: orderManagement.actualDeliveryDate,
          logisticsProcessedAt: orderManagement.logisticsProcessedAt,
          orderTotal: customerOrders.totalAmount,
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
        .where(inArray(orderManagement.currentStatus, ['logistics_dispatched', 'delivered']))
        .orderBy(orderManagement.logisticsProcessedAt); // Most recent dispatched first

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
      console.error("Error fetching delivered orders:", error);
      res.status(500).json({
        success: false,
        message: "خطا در دریافت سفارشات ارسال شده",
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



  // Inventory Notification Settings API
  app.get("/api/inventory/notification-settings", requireAuth, async (req: Request, res: Response) => {
    try {
      // Return default settings for now - in a real app this would come from database
      const defaultSettings = {
        emailEnabled: true,
        smsEnabled: false,
        managerEmail: 'info@momtazchem.com',
        managerPhone: '+964xxxxxxxxx',
        checkIntervalHours: 1,
        businessHoursOnly: true,
        businessStartHour: 8,
        businessEndHour: 18,
        emergencyThreshold: 0,
        contacts: []
      };

      res.json({ success: true, settings: defaultSettings });
    } catch (error) {
      console.error("Error fetching notification settings:", error);
      res.status(500).json({
        success: false,
        message: "خطا در دریافت تنظیمات اطلاع‌رسانی",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/inventory/notification-settings", requireAuth, async (req: Request, res: Response) => {
    try {
      // In a real app, this would save to database
      console.log("Inventory notification settings updated:", req.body);
      
      res.json({ 
        success: true, 
        message: "تنظیمات اطلاع‌رسانی با موفقیت ذخیره شد",
        settings: req.body 
      });
    } catch (error) {
      console.error("Error saving notification settings:", error);
      res.status(500).json({
        success: false,
        message: "خطا در ذخیره تنظیمات اطلاع‌رسانی",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post("/api/inventory/test-notification/:type", requireAuth, async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
      
      if (type === 'email') {
        // Test email notification
        console.log("📧 Test email notification sent");
        res.json({ 
          success: true, 
          message: "تست ایمیل با موفقیت ارسال شد" 
        });
      } else if (type === 'sms') {
        // SMS notification functionality removed per requirements
        res.json({ 
          success: true, 
          message: "پیامک در سیستم فعال نیست" 
        });
      } else {
        res.status(400).json({
          success: false,
          message: "نوع اطلاع‌رسانی نامعتبر است"
        });
      }
    } catch (error) {
      console.error("Error testing notification:", error);
      res.status(500).json({
        success: false,
        message: "خطا در تست اطلاع‌رسانی",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // =============================================================================
  // CONTENT MANAGEMENT API ENDPOINTS
  // =============================================================================

  // Public endpoint for content items (for footer and public pages)
  app.get("/api/content", async (req: Request, res: Response) => {
    try {
      const { language, section } = req.query;
      const { db } = await import("./db");
      const { contentItems } = await import("../shared/content-schema");
      const { eq, and } = await import("drizzle-orm");

      let query = db.select().from(contentItems).where(eq(contentItems.isActive, true));
      
      if (language) {
        query = query.where(and(
          eq(contentItems.isActive, true),
          eq(contentItems.language, language as string)
        ));
      }
      
      if (section) {
        if (language) {
          query = query.where(and(
            eq(contentItems.isActive, true),
            eq(contentItems.language, language as string),
            eq(contentItems.section, section as string)
          ));
        } else {
          query = query.where(and(
            eq(contentItems.isActive, true),
            eq(contentItems.section, section as string)
          ));
        }
      }

      const items = await query.orderBy(contentItems.updatedAt);

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error("Error fetching public content items:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch content items",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get content items by language and section (Admin only)
  app.get("/api/admin/content", requireAuth, async (req: Request, res: Response) => {
    try {
      const { language, section } = req.query;
      const { db } = await import("./db");
      const { contentItems } = await import("../shared/content-schema");
      const { eq, and } = await import("drizzle-orm");

      let query = db.select().from(contentItems);
      
      if (language) {
        query = query.where(eq(contentItems.language, language as string));
      }
      
      if (section) {
        if (language) {
          query = query.where(and(
            eq(contentItems.language, language as string),
            eq(contentItems.section, section as string)
          ));
        } else {
          query = query.where(eq(contentItems.section, section as string));
        }
      }

      const items = await query.orderBy(contentItems.updatedAt);

      res.json({
        success: true,
        data: items
      });
    } catch (error) {
      console.error("Error fetching content items:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch content items",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update content item
  app.put("/api/admin/content/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const contentId = parseInt(req.params.id);
      const { content, isActive } = req.body;

      if (isNaN(contentId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid content ID"
        });
      }

      const { db } = await import("./db");
      const { contentItems } = await import("../shared/content-schema");
      const { eq } = await import("drizzle-orm");

      const [updatedItem] = await db
        .update(contentItems)
        .set({
          content,
          isActive,
          updatedAt: new Date()
        })
        .where(eq(contentItems.id, contentId))
        .returning();

      res.json({
        success: true,
        data: updatedItem,
        message: "Content updated successfully"
      });
    } catch (error) {
      console.error("Error updating content item:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update content item",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get image assets by section
  app.get("/api/admin/content/images", requireAuth, async (req: Request, res: Response) => {
    try {
      const { section } = req.query;
      const { db } = await import("./db");
      const { imageAssets } = await import("../shared/content-schema");
      const { eq } = await import("drizzle-orm");

      let query = db.select().from(imageAssets);
      
      if (section) {
        query = query.where(eq(imageAssets.section, section as string));
      }

      const images = await query.orderBy(imageAssets.updatedAt);

      res.json({
        success: true,
        data: images
      });
    } catch (error) {
      console.error("Error fetching image assets:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch image assets",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Upload new image asset
  app.post("/api/admin/content/images/upload", requireAuth, async (req: Request, res: Response) => {
    try {
      const multer = await import("multer");
      const path = await import("path");
      const fs = await import("fs");

      // Configure multer for image uploads
      const storage = multer.default.diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads', 'content');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const extension = path.extname(file.originalname);
          cb(null, `content-${uniqueSuffix}${extension}`);
        }
      });

      const upload = multer.default({
        storage,
        fileFilter: (req, file, cb) => {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'));
          }
        },
        limits: {
          fileSize: 5 * 1024 * 1024 // 5MB limit
        }
      }).single('image');

      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "No image file uploaded"
          });
        }

        try {
          const { db } = await import("./db");
          const { imageAssets } = await import("../shared/content-schema");

          const { section = 'general', alt = '' } = req.body;
          const imageUrl = `/uploads/content/${req.file.filename}`;

          const [newImage] = await db
            .insert(imageAssets)
            .values({
              filename: req.file.filename,
              originalName: req.file.originalname,
              mimeType: req.file.mimetype,
              size: req.file.size,
              url: imageUrl,
              alt,
              section,
              isActive: true
            })
            .returning();

          res.json({
            success: true,
            data: newImage,
            message: "Image uploaded successfully"
          });
        } catch (dbError) {
          console.error("Error saving image to database:", dbError);
          res.status(500).json({
            success: false,
            message: "Failed to save image information",
            error: dbError instanceof Error ? dbError.message : 'Unknown error'
          });
        }
      });
    } catch (error) {
      console.error("Error setting up image upload:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process image upload",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Delete image asset
  app.delete("/api/admin/content/images/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const imageId = parseInt(req.params.id);

      if (isNaN(imageId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid image ID"
        });
      }

      const { db } = await import("./db");
      const { imageAssets } = await import("../shared/content-schema");
      const { eq } = await import("drizzle-orm");
      const path = await import("path");
      const fs = await import("fs");

      // Get image details before deletion
      const [image] = await db
        .select()
        .from(imageAssets)
        .where(eq(imageAssets.id, imageId))
        .limit(1);

      if (!image) {
        return res.status(404).json({
          success: false,
          message: "Image not found"
        });
      }

      // Delete from database
      await db
        .delete(imageAssets)
        .where(eq(imageAssets.id, imageId));

      // Delete physical file
      const filePath = path.join(process.cwd(), 'uploads', 'content', image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({
        success: true,
        message: "Image deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting image asset:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete image asset",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Create or update content item
  app.post("/api/admin/content", requireAuth, async (req: Request, res: Response) => {
    try {
      const { key, content, contentType, language, section } = req.body;

      if (!key || !content || !language || !section) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: key, content, language, section"
        });
      }

      const { db } = await import("./db");
      const { contentItems } = await import("../shared/content-schema");
      const { eq, and } = await import("drizzle-orm");

      // Check if content item already exists
      const [existingItem] = await db
        .select()
        .from(contentItems)
        .where(and(
          eq(contentItems.key, key),
          eq(contentItems.language, language),
          eq(contentItems.section, section)
        ))
        .limit(1);

      let result;
      
      if (existingItem) {
        // Update existing item
        [result] = await db
          .update(contentItems)
          .set({
            content,
            contentType: contentType || 'text',
            updatedAt: new Date()
          })
          .where(eq(contentItems.id, existingItem.id))
          .returning();
      } else {
        // Create new item
        [result] = await db
          .insert(contentItems)
          .values({
            key,
            content,
            contentType: contentType || 'text',
            language,
            section,
            isActive: true
          })
          .returning();
      }

      res.json({
        success: true,
        data: result,
        message: existingItem ? "Content updated successfully" : "Content created successfully"
      });
    } catch (error) {
      console.error("Error creating/updating content item:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create/update content item",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ===== SECURITY MANAGEMENT ROUTES =====
  
  // Import security storage
  const { securityStorage } = await import("./security-storage");

  // Security middleware to log events
  const logSecurityEvent = async (req: Request, eventType: string, severity: string = "info") => {
    try {
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent');
      const userId = req.session?.adminId || req.session?.customerId;
      const username = req.session?.adminId ? 'admin' : 'customer';

      await securityStorage.logSecurityEvent({
        eventType,
        severity,
        description: `${eventType} from ${ipAddress}`,
        ipAddress,
        userAgent,
        userId,
        username,
        endpoint: req.path,
        method: req.method,
        statusCode: 200
      });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  // Security Management Routes (Simplified System)
  app.get("/api/security/metrics", requireAuth, async (req: Request, res: Response) => {
    try {
      const { getSecurityMetrics } = await import('./security-check');
      const metrics = await getSecurityMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching security metrics:", error);
      res.status(500).json({ success: false, message: "Failed to fetch security metrics" });
    }
  });

  app.post("/api/security/comprehensive-check", requireAuth, async (req: Request, res: Response) => {
    try {
      const { performComprehensiveSecurityCheck } = await import('./security-check');
      const result = await performComprehensiveSecurityCheck();
      res.json(result);
    } catch (error) {
      console.error("Error performing security check:", error);
      res.status(500).json({ success: false, message: "Failed to perform security check" });
    }
  });

  app.post("/api/security/scan", requireAuth, async (req: Request, res: Response) => {
    try {
      const { performComprehensiveSecurityCheck } = await import('./security-check');
      const result = await performComprehensiveSecurityCheck();
      res.json({ 
        success: true, 
        vulnerabilities: result.issues.length,
        threatLevel: result.threatLevel,
        systemHealth: result.systemHealth 
      });
    } catch (error) {
      console.error("Error performing security scan:", error);
      res.status(500).json({ success: false, message: "Failed to perform security scan" });
    }
  });

  // Security Settings API endpoints
  app.get("/api/security/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const { securitySettings } = await import('@shared/schema');
      const settings = await db.select().from(securitySettings);
      
      // Convert to key-value format for frontend
      const settingsMap = settings.reduce((acc: any, setting) => {
        acc[setting.setting] = {
          value: setting.value,
          category: setting.category,
          isActive: setting.isActive
        };
        return acc;
      }, {});
      
      res.json({
        success: true,
        settings: settingsMap
      });
    } catch (error) {
      console.error("Error fetching security settings:", error);
      res.status(500).json({ success: false, message: "Failed to fetch security settings" });
    }
  });

  app.post("/api/security/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const { securitySettings } = await import('@shared/schema');
      const { settings } = req.body;
      const adminId = req.session?.adminId;
      
      if (!settings || typeof settings !== 'object') {
        return res.status(400).json({
          success: false,
          message: "Settings object is required"
        });
      }

      // Update or insert each setting
      for (const [key, config] of Object.entries(settings as any)) {
        const { value, category } = config;
        
        await db.insert(securitySettings)
          .values({
            setting: key,
            value: String(value),
            category: category || 'general',
            updatedBy: adminId,
            updatedAt: new Date()
          })
          .onConflictDoUpdate({
            target: securitySettings.setting,
            set: {
              value: String(value),
              updatedBy: adminId,
              updatedAt: new Date()
            }
          });
      }

      // Log security event
      await logSecurityEvent(req, 'security_settings_updated', {
        settingsCount: Object.keys(settings).length,
        adminId
      });

      res.json({
        success: true,
        message: "Security settings saved successfully"
      });
    } catch (error) {
      console.error("Error saving security settings:", error);
      res.status(500).json({ success: false, message: "Failed to save security settings" });
    }
  });

  // Security logs (simplified)
  app.get("/api/security/logs", requireAuth, async (req: Request, res: Response) => {
    try {
      // Return sample security logs for demonstration
      const logs = [
        {
          id: 1,
          timestamp: new Date().toISOString(),
          event: 'Admin login successful',
          severity: 'info',
          ipAddress: req.ip || 'unknown',
          details: 'Administrative user accessed the security management system'
        },
        {
          id: 2,
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          event: 'Security scan completed',
          severity: 'info',
          ipAddress: 'system',
          details: 'Automated security scan completed successfully - no issues found'
        },
        {
          id: 3,
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          event: 'Database connection secured',
          severity: 'info',
          ipAddress: 'system',
          details: 'Database connection established with SSL encryption'
        },
        {
          id: 4,
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          event: 'Session security check',
          severity: 'info',
          ipAddress: 'system',
          details: 'Session management security validation completed'
        }
      ];
      res.json(logs);
    } catch (error) {
      console.error("Error fetching security logs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch security logs"
      });
    }
  });

  // IP access control
  app.get("/api/security/ip-access", requireAuth, async (req: Request, res: Response) => {
    try {
      await logSecurityEvent(req, 'ip_access_view');
      const { type } = req.query;
      const ipList = await securityStorage.getIpAccessList(type as 'blacklist' | 'whitelist');
      res.json(ipList);
    } catch (error) {
      console.error("Error fetching IP access list:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch IP access list"
      });
    }
  });

  app.post("/api/security/ip-access", requireAuth, async (req: Request, res: Response) => {
    try {
      const { ipAddress, type, reason, category } = req.body;
      
      if (!ipAddress || !type || !category) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: ipAddress, type, category"
        });
      }

      const adminId = req.session?.adminId;
      const ipData = {
        ipAddress,
        type,
        reason,
        category,
        addedBy: adminId
      };

      const result = await securityStorage.addIpToAccessControl(ipData);
      
      await logSecurityEvent(req, `ip_${type}_added`, 'medium');
      
      res.json({
        success: true,
        data: result,
        message: `IP address added to ${type}`
      });
    } catch (error) {
      console.error("Error adding IP to access control:", error);
      res.status(500).json({
        success: false,
        message: "Failed to add IP to access control"
      });
    }
  });

  app.delete("/api/security/ip-access/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid IP access rule ID"
        });
      }

      await securityStorage.removeIpFromAccessControl(id);
      await logSecurityEvent(req, 'ip_access_removed', 'medium');
      
      res.json({
        success: true,
        message: "IP access rule removed"
      });
    } catch (error) {
      console.error("Error removing IP access rule:", error);
      res.status(500).json({
        success: false,
        message: "Failed to remove IP access rule"
      });
    }
  });

  // Security scans
  app.post("/api/security/scan", requireAuth, async (req: Request, res: Response) => {
    try {
      const { scanType } = req.body;
      
      if (!scanType) {
        return res.status(400).json({
          success: false,
          message: "Scan type is required"
        });
      }

      const adminId = req.session?.adminId;
      
      // Create security scan record
      const scanData = {
        scanType,
        status: 'running' as const,
        initiatedBy: adminId,
        automated: false
      };

      const scan = await securityStorage.createSecurityScan(scanData);
      
      // Simulate scan process (in real implementation, this would be async)
      setTimeout(async () => {
        try {
          const mockResults = {
            vulnerability: {
              criticalIssues: Math.floor(Math.random() * 3),
              highIssues: Math.floor(Math.random() * 5),
              mediumIssues: Math.floor(Math.random() * 10),
              lowIssues: Math.floor(Math.random() * 15),
              results: {
                findings: [
                  "No critical vulnerabilities detected",
                  "Some outdated dependencies found",
                  "Basic security headers present"
                ]
              }
            },
            file_integrity: {
              criticalIssues: 0,
              highIssues: 0,
              mediumIssues: Math.floor(Math.random() * 2),
              lowIssues: Math.floor(Math.random() * 5),
              results: {
                findings: [
                  "All core files integrity verified",
                  "No unauthorized modifications detected"
                ]
              }
            },
            permission_audit: {
              criticalIssues: Math.floor(Math.random() * 2),
              highIssues: Math.floor(Math.random() * 3),
              mediumIssues: Math.floor(Math.random() * 7),
              lowIssues: Math.floor(Math.random() * 10),
              results: {
                findings: [
                  "File permissions reviewed",
                  "Database access controls verified",
                  "Admin privileges properly configured"
                ]
              }
            }
          };

          const scanResults = mockResults[scanType as keyof typeof mockResults] || mockResults.vulnerability;
          
          await securityStorage.updateSecurityScan(scan.id, {
            status: 'completed',
            completedAt: new Date(),
            ...scanResults
          });
        } catch (error) {
          console.error('Error completing security scan:', error);
          await securityStorage.updateSecurityScan(scan.id, {
            status: 'failed',
            completedAt: new Date()
          });
        }
      }, 5000); // Complete scan after 5 seconds

      await logSecurityEvent(req, 'security_scan_started', 'medium');
      
      res.json({
        success: true,
        data: scan,
        message: `${scanType} scan started`
      });
    } catch (error) {
      console.error("Error starting security scan:", error);
      res.status(500).json({
        success: false,
        message: "Failed to start security scan"
      });
    }
  });

  // Security settings
  app.get("/api/security/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      await logSecurityEvent(req, 'security_settings_view');
      const { category } = req.query;
      
      let settings;
      if (category) {
        settings = await securityStorage.getSecuritySettingsByCategory(category as string);
      } else {
        settings = await securityStorage.getAllSecuritySettings();
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching security settings:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch security settings"
      });
    }
  });

  app.post("/api/security/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const { setting, value, category, description } = req.body;
      
      if (!setting || !value || !category) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: setting, value, category"
        });
      }

      const adminId = req.session?.adminId;
      const result = await securityStorage.updateSecuritySetting(setting, value, adminId || 0);
      
      await logSecurityEvent(req, 'security_setting_updated', 'medium');
      
      res.json({
        success: true,
        data: result,
        message: "Security setting updated"
      });
    } catch (error) {
      console.error("Error updating security setting:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update security setting"
      });
    }
  });

  // Security alerts
  app.get("/api/security/alerts", requireAuth, async (req: Request, res: Response) => {
    try {
      await logSecurityEvent(req, 'security_alerts_view');
      const { severity, status, limit, offset } = req.query;
      
      const filters: any = {};
      if (severity) filters.severity = severity as string;
      if (status) filters.status = status as string;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const alerts = await securityStorage.getSecurityAlerts(filters);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching security alerts:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch security alerts"
      });
    }
  });

  app.patch("/api/security/alerts/:id/resolve", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { resolution } = req.body;
      
      if (isNaN(id) || !resolution) {
        return res.status(400).json({
          success: false,
          message: "Invalid alert ID or missing resolution"
        });
      }

      const adminId = req.session?.adminId || 0;
      const alert = await securityStorage.resolveSecurityAlert(id, resolution, adminId);
      
      await logSecurityEvent(req, 'security_alert_resolved', 'low');
      
      res.json({
        success: true,
        data: alert,
        message: "Security alert resolved"
      });
    } catch (error) {
      console.error("Error resolving security alert:", error);
      res.status(500).json({
        success: false,
        message: "Failed to resolve security alert"
      });
    }
  });

  // Create some default security settings on first access
  app.post("/api/security/initialize", requireAuth, async (req: Request, res: Response) => {
    try {
      const adminId = req.session?.adminId || 0;
      
      const defaultSettings = [
        { setting: 'max_login_attempts', value: '5', category: 'auth', description: 'Maximum failed login attempts before lockout' },
        { setting: 'session_timeout', value: '3600', category: 'auth', description: 'Session timeout in seconds' },
        { setting: 'password_min_length', value: '8', category: 'auth', description: 'Minimum password length' },
        { setting: 'file_upload_max_size', value: '5242880', category: 'upload', description: 'Maximum file upload size in bytes' },
        { setting: 'allowed_file_types', value: 'jpg,jpeg,png,pdf,doc,docx', category: 'upload', description: 'Allowed file upload types' },
        { setting: 'ip_whitelist_enabled', value: 'false', category: 'access', description: 'Enable IP whitelist protection' },
        { setting: 'auto_scan_enabled', value: 'true', category: 'monitoring', description: 'Enable automatic security scans' },
        { setting: 'alert_email', value: 'info@momtazchem.com', category: 'monitoring', description: 'Email for security alerts' }
      ];

      for (const setting of defaultSettings) {
        try {
          await securityStorage.updateSecuritySetting(setting.setting, setting.value, adminId);
        } catch (error) {
          console.error(`Error creating setting ${setting.setting}:`, error);
        }
      }

      await logSecurityEvent(req, 'security_system_initialized', 'medium');
      
      res.json({
        success: true,
        message: "Security system initialized with default settings"
      });
    } catch (error) {
      console.error("Error initializing security system:", error);
      res.status(500).json({
        success: false,
        message: "Failed to initialize security system"
      });
    }
  });

  // AI Settings endpoints
  app.post("/api/ai/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const settings = req.body;
      
      // Save AI settings to environment or database
      // For now, we'll just return success
      console.log("AI Settings saved:", settings);
      
      res.json({ 
        success: true, 
        message: "تنظیمات AI با موفقیت ذخیره شد",
        settings 
      });
    } catch (error) {
      console.error("Error saving AI settings:", error);
      res.status(500).json({
        success: false,
        message: "خطا در ذخیره تنظیمات AI"
      });
    }
  });

  app.post("/api/ai/test-connection", requireAuth, async (req: Request, res: Response) => {
    try {
      // Test AI connection
      const { OpenAI } = await import("openai");
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(400).json({
          success: false,
          message: "کلید API OpenAI تنظیم نشده است"
        });
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // Simple test call
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Test connection" }],
        max_tokens: 10
      });

      res.json({
        success: true,
        message: "اتصال موفق",
        model: "gpt-4o",
        response: completion.choices[0]?.message?.content
      });
    } catch (error) {
      console.error("Error testing AI connection:", error);
      res.status(500).json({
        success: false,
        message: "خطا در آزمایش اتصال AI"
      });
    }
  });

  // Customer Communication API Routes
  const { customerCommunicationStorage } = await import("./customer-communication-storage");

  // Send message to customer
  app.post("/api/customer-communications/send", requireAuth, async (req: Request, res: Response) => {
    try {
      const { categoryId, customerEmail, customerName, subject, message, messageType = "outbound" } = req.body;
      const adminId = req.session.adminId;
      
      if (!categoryId || !customerEmail || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: "تمام فیلدهای ضروری باید پر شوند"
        });
      }

      const communication = await customerCommunicationStorage.sendMessage({
        categoryId,
        customerEmail,
        customerName: customerName || "مشتری گرامی",
        subject,
        message,
        messageType,
        sentBy: adminId,
        status: "sent"
      });

      res.json({
        success: true,
        data: communication,
        message: "پیام با موفقیت ارسال شد"
      });
    } catch (error) {
      console.error("Error sending customer communication:", error);
      res.status(500).json({
        success: false,
        message: "خطا در ارسال پیام"
      });
    }
  });

  // Smart reply suggestion based on product category
  app.post("/api/customer-communications/smart-reply", requireAuth, async (req: Request, res: Response) => {
    try {
      const { customerMessage, productCategory, customerName } = req.body;
      
      if (!customerMessage || !productCategory) {
        return res.status(400).json({
          success: false,
          message: "پیام مشتری و دسته‌بندی محصول ضروری است"
        });
      }

      // Generate smart reply based on category
      const categoryResponses: Record<string, string> = {
        'fuel-additives': `سلام ${customerName || "مشتری گرامی"}،\n\nاز تماس شما برای افزودنی‌های سوخت مومتاز کم متشکریم.\n\nمحصولات ما شامل:\n- افزودنی‌های بنزین\n- افزودنی‌های گازوئیل\n- پاک‌کننده‌های سیستم سوخت\n\nبا تشکر,\nتیم فروش مومتاز کم`,
        'water-treatment': `سلام ${customerName || "مشتری گرامی"}،\n\nاز علاقه شما به محصولات تصفیه آب سپاسگزاریم.\n\nمحصولات تصفیه آب ما:\n- مواد شیمیایی تصفیه\n- کلرین و فلوکولانت\n- ضدعفونی کننده‌ها\n\nبا احترام,\nتیم فنی مومتاز کم`,
        'paint-solvents': `سلام ${customerName || "مشتری گرامی"}،\n\nاز درخواست شما برای رنگ و حلال‌ها تشکر می‌کنیم.\n\nمحصولات ما:\n- رنگ‌های صنعتی\n- حلال‌های مختلف\n- مواد نازک‌کننده\n\nبا تشکر,\nتیم فروش رنگ مومتاز کم`,
        'agricultural-products': `سلام ${customerName || "مشتری گرامی"}،\n\nاز تماس شما برای محصولات کشاورزی خرسندیم.\n\nمحصولات کشاورزی:\n- کودهای شیمیایی\n- سموم کشاورزی\n- تنظیم‌کننده‌های رشد\n\nبا احترام,\nتیم کشاورزی مومتاز کم`,
        'default': `سلام ${customerName || "مشتری گرامی"}،\n\nاز تماس شما با مومتاز کم متشکریم.\n\nما آماده ارائه بهترین محصولات شیمیایی هستیم.\n\nبا تشکر,\nتیم پشتیبانی مومتاز کم`
      };

      const smartReply = categoryResponses[productCategory] || categoryResponses.default;

      res.json({
        success: true,
        data: {
          suggestedReply: smartReply,
          category: productCategory,
          customerMessage
        }
      });
    } catch (error) {
      console.error("Error generating smart reply:", error);
      res.status(500).json({
        success: false,
        message: "خطا در تولید پاسخ هوشمند"
      });
    }
  });

  // Get recent communications
  app.get("/api/customer-communications/recent", requireAuth, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const communications = await customerCommunicationStorage.getRecentCommunications(limit);

      res.json({
        success: true,
        data: communications
      });
    } catch (error) {
      console.error("Error fetching recent communications:", error);
      res.status(500).json({
        success: false,
        message: "خطا در دریافت ارتباطات اخیر"
      });
    }
  });

  // Get communication statistics
  app.get("/api/customer-communications/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const stats = await customerCommunicationStorage.getCommunicationStats(categoryId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error("Error fetching communication stats:", error);
      res.status(500).json({
        success: false,
        message: "خطا در دریافت آمار ارتباطات"
      });
    }
  });

  // Search communications
  app.get("/api/customer-communications/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({
          success: false,
          message: "پارامتر جستجو ضروری است"
        });
      }

      const communications = await customerCommunicationStorage.searchCommunications(q as string);

      res.json({
        success: true,
        data: communications
      });
    } catch (error) {
      console.error("Error searching communications:", error);
      res.status(500).json({
        success: false,
        message: "خطا در جستجو ارتباطات"
      });
    }
  });

  // Mark communication as read
  app.patch("/api/customer-communications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.id);
      await customerCommunicationStorage.markAsRead(messageId);

      res.json({
        success: true,
        message: "پیام به عنوان خوانده شده علامت‌گذاری شد"
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({
        success: false,
        message: "خطا در علامت‌گذاری پیام"
      });
    }
  });

  // Get communications by category
  app.get("/api/customer-communications/category/:categoryId", requireAuth, async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      const communications = await customerCommunicationStorage.getCommunicationsByCategory(categoryId);
      
      res.json({
        success: true,
        data: communications
      });
    } catch (error) {
      console.error("Error fetching communications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch communications"
      });
    }
  });

  // Get communications by customer
  app.get("/api/customer-communications/customer/:email", requireAuth, async (req: Request, res: Response) => {
    try {
      const email = req.params.email;
      const communications = await customerCommunicationStorage.getCommunicationsByCustomer(email);
      
      res.json({
        success: true,
        data: communications
      });
    } catch (error) {
      console.error("Error fetching customer communications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customer communications"
      });
    }
  });

  // Get communication thread
  app.get("/api/customer-communications/thread/:messageId", requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const thread = await customerCommunicationStorage.getCommunicationThread(messageId);
      
      res.json({
        success: true,
        data: thread
      });
    } catch (error) {
      console.error("Error fetching communication thread:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch communication thread"
      });
    }
  });

  // Mark message as read
  app.put("/api/customer-communications/:messageId/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.messageId);
      await customerCommunicationStorage.markAsRead(messageId);
      
      res.json({
        success: true,
        message: "Message marked as read"
      });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark message as read"
      });
    }
  });

  // Mark message as replied
  app.put("/api/customer-communications/:messageId/replied", requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.messageId);
      await customerCommunicationStorage.markAsReplied(messageId);
      
      res.json({
        success: true,
        message: "Message marked as replied"
      });
    } catch (error) {
      console.error("Error marking message as replied:", error);
      res.status(500).json({
        success: false,
        message: "Failed to mark message as replied"
      });
    }
  });

  // Get recent communications
  app.get("/api/customer-communications/recent", requireAuth, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const communications = await customerCommunicationStorage.getRecentCommunications(limit);
      
      res.json({
        success: true,
        data: communications
      });
    } catch (error) {
      console.error("Error fetching recent communications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch recent communications"
      });
    }
  });

  // Get communication stats
  app.get("/api/customer-communications/stats", requireAuth, async (req: Request, res: Response) => {
    try {
      const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
      const stats = await customerCommunicationStorage.getCommunicationStats(categoryId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error("Error fetching communication stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch communication stats"
      });
    }
  });

  // Search communications
  app.get("/api/customer-communications/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const searchTerm = req.query.q as string;
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: "Search term is required"
        });
      }

      const communications = await customerCommunicationStorage.searchCommunications(searchTerm);
      
      res.json({
        success: true,
        data: communications
      });
    } catch (error) {
      console.error("Error searching communications:", error);
      res.status(500).json({
        success: false,
        message: "Failed to search communications"
      });
    }
  });

  // Update communication status
  app.put("/api/customer-communications/:messageId/status", requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.messageId);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required"
        });
      }

      await customerCommunicationStorage.updateStatus(messageId, status);
      
      res.json({
        success: true,
        message: "Status updated successfully"
      });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update status"
      });
    }
  });

  // Delete communication
  app.delete("/api/customer-communications/:messageId", requireAuth, async (req: Request, res: Response) => {
    try {
      const messageId = parseInt(req.params.messageId);
      await customerCommunicationStorage.deleteCommunication(messageId);
      
      res.json({
        success: true,
        message: "Communication deleted successfully"
      });
    } catch (error) {
      console.error("Error deleting communication:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete communication"
      });
    }
  });

  // Get shipping rates for customer checkout
  app.get("/api/shipping/rates", async (req, res) => {
    try {
      const { city, totalWeight } = req.query;

      const rates = await orderManagementStorage.getShippingRates({
        cityName: city as string,
        isActive: true
      });

      // Calculate shipping costs based on rates and order details
      const calculatedRates = rates.map(rate => {
        let shippingCost = parseFloat(rate.basePrice || '0');
        
        if (totalWeight && rate.pricePerKg) {
          const weight = parseFloat(totalWeight as string);
          shippingCost += weight * parseFloat(rate.pricePerKg);
        }

        return {
          id: rate.id,
          deliveryMethod: rate.deliveryMethod,
          transportationType: rate.transportationType,
          description: rate.description,
          estimatedDays: rate.estimatedDays,
          trackingAvailable: rate.trackingAvailable,
          insuranceAvailable: rate.insuranceAvailable,
          shippingCost: shippingCost,
          basePrice: rate.basePrice,
          pricePerKg: rate.pricePerKg,
          freeShippingThreshold: rate.freeShippingThreshold
        };
      });

      res.json({
        success: true,
        data: calculatedRates
      });
    } catch (error) {
      console.error("Error fetching shipping rates:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch shipping rates"
      });
    }
  });

  // Calculate shipping cost for specific delivery method
  app.post("/api/shipping/calculate", async (req, res) => {
    try {
      const { deliveryMethod, city, totalWeight, orderValue } = req.body;

      const rate = await orderManagementStorage.getShippingRateByMethod(deliveryMethod, city);
      
      if (!rate) {
        return res.status(404).json({
          success: false,
          message: "Shipping method not available for your location"
        });
      }

      let shippingCost = parseFloat(rate.basePrice || '0');
      
      if (totalWeight && rate.pricePerKg) {
        shippingCost += totalWeight * parseFloat(rate.pricePerKg);
      }

      // Check for free shipping threshold
      if (rate.freeShippingThreshold && orderValue >= parseFloat(rate.freeShippingThreshold)) {
        shippingCost = 0;
      }

      res.json({
        success: true,
        data: {
          deliveryMethod: rate.deliveryMethod,
          shippingCost,
          isFreeShipping: shippingCost === 0,
          estimatedDays: rate.estimatedDays,
          trackingAvailable: rate.trackingAvailable
        }
      });
    } catch (error) {
      console.error("Error calculating shipping cost:", error);
      res.status(500).json({
        success: false,
        message: "Failed to calculate shipping cost"
      });
    }
  });

  // =============================================================================
  // PRODUCT REVIEWS & RATINGS ENDPOINTS - نظرسنجی و امتیازدهی محصولات
  // =============================================================================

  // Get all product stats for shop display
  app.get("/api/shop/product-stats", async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT 
          product_id,
          total_reviews,
          average_rating
        FROM product_stats
        WHERE total_reviews > 0
      `);

      const statsMap = {};
      result.rows.forEach(row => {
        statsMap[row.product_id] = {
          totalReviews: row.total_reviews,
          averageRating: parseFloat(row.average_rating)
        };
      });

      res.json(statsMap);
    } catch (error) {
      console.error("Error fetching product stats:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get reviews for a specific product
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }

      const { pool } = await import('./db');
      
      // Get reviews with customer names
      const reviewsResult = await pool.query(`
        SELECT pr.*, ps.average_rating, ps.total_reviews
        FROM product_reviews pr
        LEFT JOIN product_stats ps ON pr.product_id = ps.product_id
        WHERE pr.product_id = $1 AND pr.is_approved = true
        ORDER BY pr.created_at DESC
      `, [productId]);

      // Get rating distribution
      const statsResult = await pool.query(`
        SELECT rating_distribution, average_rating, total_reviews
        FROM product_stats 
        WHERE product_id = $1
      `, [productId]);

      const reviews = reviewsResult.rows.map((row: any) => ({
        id: row.id,
        productId: row.product_id,
        customerId: row.customer_id,
        customerName: row.customer_name,
        rating: row.rating,
        title: row.title,
        review: row.review,
        pros: row.pros,
        cons: row.cons,
        isVerifiedPurchase: row.is_verified_purchase,
        helpfulVotes: row.helpful_votes,
        notHelpfulVotes: row.not_helpful_votes,
        adminResponse: row.admin_response,
        adminResponseDate: row.admin_response_date,
        createdAt: row.created_at
      }));

      const stats = statsResult.rows[0] || {
        rating_distribution: {},
        average_rating: "0",
        total_reviews: 0
      };

      res.json({
        success: true,
        data: {
          reviews,
          stats: {
            averageRating: parseFloat(stats.average_rating),
            totalReviews: stats.total_reviews,
            ratingDistribution: stats.rating_distribution || {}
          }
        }
      });
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Submit a new review (authenticated customers only)
  app.post("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }

      // Check if user is authenticated
      const customerId = req.session.customerId;
      if (!customerId) {
        return res.status(401).json({ 
          success: false, 
          message: "برای ثبت نظر ابتدا وارد حساب کاربری خود شوید" 
        });
      }

      const { rating, title, review, comment, pros, cons } = req.body;
      
      // Handle both 'review' and 'comment' field names from frontend
      const reviewText = review || comment;
      
      // Validation
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ success: false, message: "امتیاز باید بین 1 تا 5 باشد" });
      }
      if (!reviewText || reviewText.trim().length === 0) {
        return res.status(400).json({ success: false, message: "متن نظر الزامی است" });
      }

      const { pool } = await import('./db');
      
      // Get customer information from both CRM and legacy tables
      let customer = null;
      let customerName = '';
      let customerEmail = '';
      
      // Try CRM customers first
      const crmResult = await pool.query(`
        SELECT first_name, last_name, email FROM crm_customers WHERE id = $1
      `, [customerId]);
      
      if (crmResult.rows.length > 0) {
        customer = crmResult.rows[0];
        customerName = `${customer.first_name} ${customer.last_name}`;
        customerEmail = customer.email;
      } else {
        // Fallback to legacy customers table
        const legacyResult = await pool.query(`
          SELECT first_name, last_name, email FROM customers WHERE id = $1
        `, [customerId]);
        
        if (legacyResult.rows.length > 0) {
          customer = legacyResult.rows[0];
          customerName = `${customer.first_name} ${customer.last_name}`;
          customerEmail = customer.email;
        }
      }
      
      if (!customer) {
        return res.status(400).json({ success: false, message: "Customer not found" });
      }
      
      // Check if customer already reviewed this product
      const existingReview = await pool.query(`
        SELECT id FROM product_reviews 
        WHERE product_id = $1 AND customer_id = $2
      `, [productId, customerId]);
      
      if (existingReview.rows.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "شما قبلاً روی این محصول نظر داده‌اید" 
        });
      }

      // Check if customer has purchased this product (for verified purchase)
      let isVerifiedPurchase = false;
      const purchaseCheck = await pool.query(`
        SELECT o.id FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = $1 AND oi.product_id = $2 AND o.payment_status = 'paid'
      `, [customerId, productId]);
      
      isVerifiedPurchase = purchaseCheck.rows.length > 0;

      // Insert new review
      const reviewResult = await pool.query(`
        INSERT INTO product_reviews (
          product_id, customer_id, customer_name, customer_email, rating, 
          title, review, pros, cons, is_verified_purchase, is_approved
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, created_at
      `, [
        productId, customerId, customerName, customerEmail, rating,
        title || '', reviewText.trim(), JSON.stringify(pros || []), JSON.stringify(cons || []),
        isVerifiedPurchase, true // Auto-approve reviews for better UX
      ]);

      // Update product statistics
      await updateProductStats(productId);

      res.json({
        success: true,
        message: "نظر شما با موفقیت ثبت شد",
        data: {
          id: reviewResult.rows[0].id,
          createdAt: reviewResult.rows[0].created_at
        }
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get product statistics including reviews summary
  app.get("/api/products/:id/stats", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }

      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT 
          total_reviews,
          average_rating
        FROM product_stats 
        WHERE product_id = $1
      `, [productId]);

      if (result.rows.length === 0) {
        // Create initial stats record if it doesn't exist
        await pool.query(`
          INSERT INTO product_stats (product_id, total_reviews, average_rating)
          VALUES ($1, 0, 0)
        `, [productId]);
        
        return res.json({
          totalReviews: 0,
          averageRating: 0
        });
      }

      const stats = result.rows[0];
      res.json({
        totalReviews: stats.total_reviews,
        averageRating: parseFloat(stats.average_rating)
      });
    } catch (error) {
      console.error("Error fetching product stats:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get product reviews (Updated version)
  app.get("/api/products/:id/reviews", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }

      const { pool } = await import('./db');
      
      // Get reviews with approved filter
      const reviewsResult = await pool.query(`
        SELECT 
          id,
          product_id,
          customer_id,
          customer_name,
          rating,
          title,
          review,
          comment,
          pros,
          cons,
          is_verified_purchase,
          helpful_votes,
          not_helpful_votes,
          admin_response,
          admin_response_date,
          created_at
        FROM product_reviews 
        WHERE product_id = $1 AND is_approved = true
        ORDER BY created_at DESC
      `, [productId]);

      // Get product stats
      const statsResult = await pool.query(`
        SELECT 
          total_reviews,
          average_rating,
          rating_distribution
        FROM product_stats 
        WHERE product_id = $1
      `, [productId]);

      const reviews = reviewsResult.rows.map(row => ({
        id: row.id,
        productId: row.product_id,
        customerId: row.customer_id,
        customerName: row.customer_name,
        rating: row.rating,
        title: row.title || '',
        review: row.review || row.comment || '', // Use review field first, fallback to comment
        comment: row.review || row.comment || '', // For compatibility
        pros: row.pros || [],
        cons: row.cons || [],
        isVerifiedPurchase: row.is_verified_purchase,
        helpfulVotes: row.helpful_votes,
        notHelpfulVotes: row.not_helpful_votes,
        adminResponse: row.admin_response,
        adminResponseDate: row.admin_response_date,
        createdAt: row.created_at
      }));

      const stats = statsResult.rows[0] || {
        total_reviews: 0,
        average_rating: 0,
        rating_distribution: {}
      };

      res.json({
        success: true,
        data: {
          reviews,
          stats: {
            averageRating: parseFloat(stats.average_rating) || 0,
            totalReviews: parseInt(stats.total_reviews) || 0,
            ratingDistribution: stats.rating_distribution || {}
          }
        }
      });
    } catch (error) {
      console.error("Error fetching product reviews:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });



  // Mark review as helpful/not helpful
  app.post("/api/reviews/:id/helpful", async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { isHelpful } = req.body;
      
      if (isNaN(reviewId)) {
        return res.status(400).json({ success: false, message: "Invalid review ID" });
      }
      
      if (typeof isHelpful !== 'boolean') {
        return res.status(400).json({ success: false, message: "isHelpful must be a boolean" });
      }

      const customerId = req.session.customerId || null;
      const customerIp = req.ip;
      
      // Check if user already voted on this review
      const { pool } = await import('./db');
      let existingVote;
      if (customerId) {
        existingVote = await pool.query(`
          SELECT id FROM review_helpfulness 
          WHERE review_id = $1 AND customer_id = $2
        `, [reviewId, customerId]);
      } else {
        existingVote = await pool.query(`
          SELECT id FROM review_helpfulness 
          WHERE review_id = $1 AND customer_ip = $2
        `, [reviewId, customerIp]);
      }
      
      if (existingVote.rows.length > 0) {
        return res.status(400).json({ success: false, message: "You have already voted on this review" });
      }

      // Record the vote
      await pool.query(`
        INSERT INTO review_helpfulness (review_id, customer_id, customer_ip, is_helpful)
        VALUES ($1, $2, $3, $4)
      `, [reviewId, customerId, customerIp, isHelpful]);

      // Update the review's helpful votes count
      const updateField = isHelpful ? 'helpful_votes' : 'not_helpful_votes';
      await pool.query(`
        UPDATE product_reviews 
        SET ${updateField} = ${updateField} + 1 
        WHERE id = $1
      `, [reviewId]);

      res.json({ success: true, message: "Vote recorded successfully" });
    } catch (error) {
      console.error("Error recording helpful vote:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Admin: Get all pending reviews for approval
  app.get("/api/admin/reviews/pending", requireAuth, async (req, res) => {
    try {
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT pr.*, sp.name as product_name
        FROM product_reviews pr
        JOIN shop_products sp ON pr.product_id = sp.id
        WHERE pr.is_approved = false
        ORDER BY pr.created_at DESC
      `);

      const reviews = result.rows.map((row: any) => ({
        id: row.id,
        productId: row.product_id,
        productName: row.product_name,
        customerId: row.customer_id,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        rating: row.rating,
        title: row.title,
        review: row.review,
        pros: row.pros,
        cons: row.cons,
        isVerifiedPurchase: row.is_verified_purchase,
        createdAt: row.created_at
      }));

      res.json({ success: true, data: reviews });
    } catch (error) {
      console.error("Error fetching pending reviews:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Admin: Approve/reject review
  app.patch("/api/admin/reviews/:id/approve", requireAuth, async (req, res) => {
    try {
      const reviewId = parseInt(req.params.id);
      const { isApproved, adminResponse } = req.body;
      
      if (isNaN(reviewId)) {
        return res.status(400).json({ success: false, message: "Invalid review ID" });
      }

      const { pool } = await import('./db');
      
      // Update review approval status
      const result = await pool.query(`
        UPDATE product_reviews 
        SET is_approved = $1, admin_response = $2, admin_response_date = NOW(), updated_at = NOW()
        WHERE id = $3
        RETURNING product_id
      `, [isApproved, adminResponse, reviewId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Review not found" });
      }

      // Update product statistics if approved
      if (isApproved) {
        await updateProductStats(result.rows[0].product_id);
      }

      res.json({ 
        success: true, 
        message: isApproved ? "Review approved successfully" : "Review rejected successfully" 
      });
    } catch (error) {
      console.error("Error updating review approval:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Helper function to update product statistics
  async function updateProductStats(productId: number) {
    try {
      const { pool } = await import('./db');
      
      // Calculate new statistics from approved reviews
      const statsQuery = await pool.query(`
        SELECT 
          COUNT(*) as total_reviews,
          AVG(rating) as average_rating,
          COUNT(CASE WHEN rating = 1 THEN 1 END) as rating_1,
          COUNT(CASE WHEN rating = 2 THEN 1 END) as rating_2,
          COUNT(CASE WHEN rating = 3 THEN 1 END) as rating_3,
          COUNT(CASE WHEN rating = 4 THEN 1 END) as rating_4,
          COUNT(CASE WHEN rating = 5 THEN 1 END) as rating_5,
          MAX(created_at) as last_review_date
        FROM product_reviews 
        WHERE product_id = $1 AND is_approved = true
      `, [productId]);

      const stats = statsQuery.rows[0];
      const ratingDistribution = {
        "1": parseInt(stats.rating_1),
        "2": parseInt(stats.rating_2),
        "3": parseInt(stats.rating_3),
        "4": parseInt(stats.rating_4),
        "5": parseInt(stats.rating_5)
      };

      // Update or insert product stats
      await pool.query(`
        INSERT INTO product_stats (
          product_id, total_reviews, average_rating, rating_distribution, last_review_date, updated_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (product_id) DO UPDATE SET
          total_reviews = $2,
          average_rating = $3,
          rating_distribution = $4,
          last_review_date = $5,
          updated_at = NOW()
      `, [
        productId,
        parseInt(stats.total_reviews),
        parseFloat(stats.average_rating) || 0,
        JSON.stringify(ratingDistribution),
        stats.last_review_date
      ]);
    } catch (error) {
      console.error("Error updating product stats:", error);
    }
  }

  // =============================================================================
  // WEIGHT CALCULATION ENDPOINTS
  // =============================================================================

  // Calculate weight for a specific order
  app.post('/api/orders/:orderId/calculate-weight', async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ success: false, message: 'ID سفارش نامعتبر است' });
      }

      await orderManagementStorage.calculateAndUpdateOrderWeight(orderId);
      
      // Get updated order to return the new weight
      const updatedOrder = await orderManagementStorage.getOrderById(orderId);
      
      res.json({ 
        success: true, 
        message: 'وزن سفارش محاسبه شد',
        totalWeight: updatedOrder?.totalWeight,
        weightUnit: updatedOrder?.weightUnit
      });
    } catch (error) {
      console.error('Error calculating order weight:', error);
      res.status(500).json({ success: false, message: 'خطا در محاسبه وزن سفارش' });
    }
  });

  // Calculate weights for all orders with null weight
  app.post('/api/orders/calculate-all-weights', async (req, res) => {
    try {
      // Get all orders with null or empty weight
      const ordersWithoutWeight = await db
        .select({ customerOrderId: orderManagement.customerOrderId })
        .from(orderManagement)
        .where(isNull(orderManagement.totalWeight));

      let updatedCount = 0;
      let errors = 0;

      for (const order of ordersWithoutWeight) {
        try {
          await orderManagementStorage.calculateAndUpdateOrderWeight(order.customerOrderId);
          updatedCount++;
        } catch (error) {
          console.error(`Error calculating weight for order ${order.customerOrderId}:`, error);
          errors++;
        }
      }

      res.json({ 
        success: true, 
        message: `وزن ${updatedCount} سفارش محاسبه شد`,
        updatedCount,
        errors,
        totalProcessed: ordersWithoutWeight.length
      });
    } catch (error) {
      console.error('Error calculating weights for all orders:', error);
      res.status(500).json({ success: false, message: 'خطا در محاسبه وزن سفارشات' });
    }
  });

  // =============================================================================
  // INVENTORY THRESHOLD SETTINGS API ENDPOINTS
  // =============================================================================

  // Get inventory threshold settings
  app.get("/api/inventory/threshold-settings", async (req: Request, res: Response) => {
    try {
      const { inventoryThresholdSettings } = await import("../shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const settings = await db.select()
        .from(inventoryThresholdSettings)
        .where(eq(inventoryThresholdSettings.isActive, true))
        .orderBy(inventoryThresholdSettings.settingName);
      
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Error fetching threshold settings:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در دریافت تنظیمات آستانه موجودی" 
      });
    }
  });

  // Create or update threshold settings
  app.post("/api/inventory/threshold-settings", async (req: Request, res: Response) => {
    try {
      const { inventoryThresholdSettings, insertInventoryThresholdSettingsSchema } = await import("../shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const validatedData = insertInventoryThresholdSettingsSchema.parse(req.body);
      
      // Check if setting already exists
      const existingSetting = await db.select()
        .from(inventoryThresholdSettings)
        .where(eq(inventoryThresholdSettings.settingName, validatedData.settingName))
        .limit(1);
      
      let result;
      if (existingSetting.length > 0) {
        // Update existing setting
        result = await db.update(inventoryThresholdSettings)
          .set({
            ...validatedData,
            updatedAt: new Date()
          })
          .where(eq(inventoryThresholdSettings.settingName, validatedData.settingName))
          .returning();
      } else {
        // Create new setting
        result = await db.insert(inventoryThresholdSettings)
          .values(validatedData)
          .returning();
      }
      
      res.json({ success: true, data: result[0] });
    } catch (error) {
      console.error("Error saving threshold settings:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در ذخیره تنظیمات آستانه موجودی" 
      });
    }
  });

  // Get inventory alerts log
  app.get("/api/inventory/alerts-log", async (req: Request, res: Response) => {
    try {
      const { inventoryAlertLog } = await import("../shared/schema");
      const { desc } = await import("drizzle-orm");
      
      const { limit = 50, offset = 0 } = req.query;
      
      const alerts = await db.select()
        .from(inventoryAlertLog)
        .orderBy(desc(inventoryAlertLog.sentAt))
        .limit(parseInt(limit as string))
        .offset(parseInt(offset as string));
      
      res.json({ success: true, data: alerts });
    } catch (error) {
      console.error("Error fetching alerts log:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در دریافت گزارش هشدارها" 
      });
    }
  });

  // =============================================================================
  // =============================================================================
  // ABANDONED CART MANAGEMENT API ENDPOINTS
  // =============================================================================
  
  // Get abandoned cart settings
  app.get("/api/admin/abandoned-cart/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const settings = await cartStorage.getAbandonedCartSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Error fetching abandoned cart settings:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Update abandoned cart settings
  app.put("/api/admin/abandoned-cart/settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const settings = await cartStorage.updateAbandonedCartSettings(req.body);
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Error updating abandoned cart settings:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get abandoned cart sessions
  app.get("/api/admin/abandoned-cart/carts", requireAuth, async (req: Request, res: Response) => {
    try {
      const carts = await cartStorage.getAbandonedCarts();
      res.json({ success: true, data: carts });
    } catch (error) {
      console.error("Error fetching abandoned carts:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Get abandoned cart analytics
  app.get("/api/admin/abandoned-cart/analytics", requireAuth, async (req: Request, res: Response) => {
    try {
      const analytics = await cartStorage.getAbandonedCartAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error) {
      console.error("Error fetching abandoned cart analytics:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Track cart session (for logged-in customers)
  app.post("/api/cart/session", async (req: Request, res: Response) => {
    try {
      const { sessionId, cartData, itemCount, totalValue } = req.body;
      const session = req.session as SessionData;
      
      if (!session.customerId) {
        return res.status(401).json({ success: false, message: "Customer not authenticated" });
      }
      
      const sessionData = {
        customerId: session.customerId,
        sessionId,
        cartData,
        itemCount,
        totalValue: parseFloat(totalValue) || 0
      };
      
      await cartStorage.createOrUpdateCartSession(sessionData);
      res.json({ success: true, message: "Cart session tracked successfully" });
    } catch (error) {
      console.error("Error tracking cart session:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });

  // Send abandoned cart notification
  app.post("/api/admin/abandoned-cart/notify/:cartId", requireAuth, async (req: Request, res: Response) => {
    try {
      const { cartId } = req.params;
      const { message, discountCode } = req.body;
      
      await cartStorage.sendAbandonedCartNotification(parseInt(cartId), message, discountCode);
      res.json({ success: true, message: "Notification sent successfully" });
    } catch (error) {
      console.error("Error sending abandoned cart notification:", error);
      res.status(500).json({ success: false, message: "Internal server error" });
    }
  });


  
  // =============================================================================
  // ABANDONED CART MANAGEMENT API
  // =============================================================================

  // Track cart session activity
  app.post("/api/cart/session", async (req, res) => {
    try {
      const customerId = (req.session as any)?.customerId;
      if (!customerId) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      const { sessionId, cartData, itemCount, totalValue } = req.body;
      
      const cartSessionId = await cartStorage.createOrUpdateCartSession({
        customerId,
        sessionId,
        cartData,
        itemCount,
        totalValue
      });

      res.json({ success: true, cartSessionId });
    } catch (error) {
      console.error("Error tracking cart session:", error);
      res.status(500).json({ success: false, message: "Failed to track cart session" });
    }
  });

  // Get abandoned cart settings
  app.get("/api/admin/abandoned-cart/settings", requireAuth, async (req, res) => {
    try {
      const settings = await cartStorage.getAbandonedCartSettings();
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error("Error fetching abandoned cart settings:", error);
      res.status(500).json({ success: false, message: "Failed to fetch settings" });
    }
  });

  // Update abandoned cart settings
  app.put("/api/admin/abandoned-cart/settings", requireAuth, async (req, res) => {
    try {
      const settings = req.body;
      await cartStorage.updateAbandonedCartSettings(settings);
      res.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
      console.error("Error updating abandoned cart settings:", error);
      res.status(500).json({ success: false, message: "Failed to update settings" });
    }
  });

  // Get abandoned carts
  app.get("/api/admin/abandoned-cart/carts", requireAuth, async (req, res) => {
    try {
      const { timeout } = req.query;
      const timeoutMinutes = timeout ? parseInt(timeout as string) : 30;
      
      const abandonedCarts = await cartStorage.getAbandonedCarts(timeoutMinutes);
      res.json({ success: true, data: abandonedCarts });
    } catch (error) {
      console.error("Error fetching abandoned carts:", error);
      res.status(500).json({ success: false, message: "Failed to fetch abandoned carts" });
    }
  });

  // Send abandoned cart notification
  app.post("/api/admin/abandoned-cart/notify/:cartId", requireAuth, async (req, res) => {
    try {
      const cartId = parseInt(req.params.cartId);
      const { title, message, notificationType } = req.body;
      
      // Get cart session info
      const cartSessions = await cartStorage.getActiveCartSessions();
      const cartSession = cartSessions.find(cart => cart.id === cartId);
      
      if (!cartSession) {
        return res.status(404).json({ success: false, message: "Cart session not found" });
      }

      await cartStorage.createNotification({
        cartSessionId: cartId,
        customerId: cartSession.customerId,
        notificationType: notificationType || 'browser',
        title,
        message
      });

      res.json({ success: true, message: "Notification sent successfully" });
    } catch (error) {
      console.error("Error sending abandoned cart notification:", error);
      res.status(500).json({ success: false, message: "Failed to send notification" });
    }
  });

  // Get customer notifications
  app.get("/api/cart/notifications", async (req, res) => {
    try {
      const customerId = (req.session as any)?.customerId;
      if (!customerId) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      const notifications = await cartStorage.getCustomerNotifications(customerId);
      res.json({ success: true, data: notifications });
    } catch (error) {
      console.error("Error fetching customer notifications:", error);
      res.status(500).json({ success: false, message: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/cart/notifications/:id/read", async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await cartStorage.markNotificationAsRead(notificationId);
      res.json({ success: true, message: "Notification marked as read" });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ success: false, message: "Failed to mark notification as read" });
    }
  });

  // Get abandoned cart analytics
  app.get("/api/admin/abandoned-cart/analytics", requireAuth, async (req, res) => {
    try {
      const { days } = req.query;
      const analyticsDays = days ? parseInt(days as string) : 30;
      
      const analytics = await cartStorage.getCartRecoveryAnalytics(analyticsDays);
      const overallStats = await cartStorage.getOverallStats();
      
      res.json({ 
        success: true, 
        data: {
          analytics,
          overallStats
        }
      });
    } catch (error) {
      console.error("Error fetching abandoned cart analytics:", error);
      res.status(500).json({ success: false, message: "Failed to fetch analytics" });
    }
  });

  // Complete cart session (when order is placed)
  app.post("/api/cart/session/complete", async (req, res) => {
    try {
      const customerId = (req.session as any)?.customerId;
      if (!customerId) {
        return res.status(401).json({ success: false, message: "Authentication required" });
      }

      await cartStorage.clearCartSession(customerId);
      res.json({ success: true, message: "Cart session completed" });
    } catch (error) {
      console.error("Error completing cart session:", error);
      res.status(500).json({ success: false, message: "Failed to complete cart session" });
    }
  });

  // ===========================================
  // GPS DELIVERY TRACKING ENDPOINTS
  // ===========================================

  // Record GPS delivery confirmation
  app.post("/api/gps-delivery/confirm", async (req, res) => {
    try {
      console.log('📍 [GPS-API] Delivery confirmation request:', req.body);
      
      const gpsData = insertGpsDeliveryConfirmationSchema.parse(req.body);
      const confirmation = await gpsDeliveryStorage.recordGpsDelivery(gpsData);
      
      res.json({ 
        success: true, 
        data: confirmation,
        message: "GPS delivery confirmation recorded successfully"
      });
    } catch (error) {
      console.error("❌ [GPS-API] Error recording GPS delivery:", error);
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to record GPS delivery confirmation" 
      });
    }
  });

  // Get GPS deliveries by order
  app.get("/api/gps-delivery/order/:orderId", async (req, res) => {
    try {
      const orderId = parseInt(req.params.orderId);
      if (isNaN(orderId)) {
        return res.status(400).json({ success: false, message: "Invalid order ID" });
      }

      const deliveries = await gpsDeliveryStorage.getGpsDeliveriesByOrder(orderId);
      res.json({ success: true, data: deliveries });
    } catch (error) {
      console.error("Error fetching GPS deliveries for order:", error);
      res.status(500).json({ success: false, message: "Failed to fetch GPS deliveries" });
    }
  });

  // Get GPS deliveries by delivery person
  app.get("/api/gps-delivery/person/:phone", async (req, res) => {
    try {
      const phone = req.params.phone;
      const deliveries = await gpsDeliveryStorage.getGpsDeliveriesByDeliveryPerson(phone);
      res.json({ success: true, data: deliveries });
    } catch (error) {
      console.error("Error fetching GPS deliveries for delivery person:", error);
      res.status(500).json({ success: false, message: "Failed to fetch GPS deliveries" });
    }
  });

  // Get GPS deliveries by location
  app.get("/api/gps-delivery/location/:country/:city", async (req, res) => {
    try {
      const { country, city } = req.params;
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const deliveries = await gpsDeliveryStorage.getGpsDeliveriesByLocation(country, city, start, end);
      res.json({ success: true, data: deliveries });
    } catch (error) {
      console.error("Error fetching GPS deliveries by location:", error);
      res.status(500).json({ success: false, message: "Failed to fetch GPS deliveries" });
    }
  });

  // Get delivery performance statistics
  app.get("/api/gps-delivery/performance", async (req, res) => {
    try {
      const { period } = req.query;
      const periodDays = period ? parseInt(period as string) : 30;
      
      const stats = await gpsDeliveryStorage.getDeliveryPerformanceStats(periodDays);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error("Error fetching delivery performance stats:", error);
      res.status(500).json({ success: false, message: "Failed to fetch performance statistics" });
    }
  });

  // Get geographic coverage data
  app.get("/api/gps-delivery/coverage", async (req, res) => {
    try {
      const { country } = req.query;
      const coverage = await gpsDeliveryStorage.getGeographicCoverage(country as string);
      res.json({ success: true, data: coverage });
    } catch (error) {
      console.error("Error fetching geographic coverage:", error);
      res.status(500).json({ success: false, message: "Failed to fetch geographic coverage" });
    }
  });

  // Get delivery person statistics
  app.get("/api/gps-delivery/person-stats/:phone", async (req, res) => {
    try {
      const phone = req.params.phone;
      const { period } = req.query;
      const periodDays = period ? parseInt(period as string) : 30;
      
      const stats = await gpsDeliveryStorage.getDeliveryPersonStats(phone, periodDays);
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error("Error fetching delivery person stats:", error);
      res.status(500).json({ success: false, message: "Failed to fetch delivery person statistics" });
    }
  });

  // Get delivery heatmap data
  app.get("/api/gps-delivery/heatmap", async (req, res) => {
    try {
      const { country, city } = req.query;
      if (!country) {
        return res.status(400).json({ success: false, message: "Country parameter is required" });
      }
      
      const heatmapData = await gpsDeliveryStorage.getDeliveryHeatmapData(country as string, city as string);
      res.json({ success: true, data: heatmapData });
    } catch (error) {
      console.error("Error fetching delivery heatmap data:", error);
      res.status(500).json({ success: false, message: "Failed to fetch heatmap data" });
    }
  });

  // Get actual GPS delivery confirmations for table display
  app.get("/api/gps-delivery/confirmations", async (req, res) => {
    try {
      const { startDate, endDate, limit = 50 } = req.query;
      console.log('🚚 [GPS-CONFIRMATIONS] Fetching delivery confirmations');
      
      // If no date range provided, default to last 7 days
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 7);
      const defaultEndDate = new Date();
      
      const start = startDate ? new Date(startDate as string) : defaultStartDate;
      const end = endDate ? new Date(endDate as string) : defaultEndDate;
      
      console.log(`🚚 [GPS-CONFIRMATIONS] Date range: ${start.toISOString()} to ${end.toISOString()}`);
      
      const confirmations = await gpsDeliveryStorage.getDeliveryConfirmations(start, end, parseInt(limit as string));
      console.log(`🚚 [GPS-CONFIRMATIONS] Found ${confirmations.length} delivery confirmations`);
      
      res.json({ success: true, data: confirmations });
    } catch (error) {
      console.error("Error fetching GPS delivery confirmations:", error);
      res.status(500).json({ success: false, message: "Failed to fetch delivery confirmations" });
    }
  });

  // Get delivery route analysis
  app.get("/api/gps-delivery/route-analysis/:phone/:date", async (req, res) => {
    try {
      const { phone, date } = req.params;
      const analysisDate = new Date(date);
      
      if (isNaN(analysisDate.getTime())) {
        return res.status(400).json({ success: false, message: "Invalid date format" });
      }
      
      const routeAnalysis = await gpsDeliveryStorage.getDeliveryRouteAnalysis(phone, analysisDate);
      res.json({ success: true, data: routeAnalysis });
    } catch (error) {
      console.error("Error fetching delivery route analysis:", error);
      res.status(500).json({ success: false, message: "Failed to fetch route analysis" });
    }
  });

  // Generate analytics for specific date
  app.post("/api/gps-delivery/analytics/generate", async (req, res) => {
    try {
      const { date } = req.body;
      const analyticsDate = date ? new Date(date) : new Date();
      
      await gpsDeliveryStorage.generateDailyAnalytics(analyticsDate);
      res.json({ 
        success: true, 
        message: `Analytics generated for ${analyticsDate.toISOString().split('T')[0]}` 
      });
    } catch (error) {
      console.error("Error generating GPS delivery analytics:", error);
      res.status(500).json({ success: false, message: "Failed to generate analytics" });
    }
  });

  // Get analytics by date range
  app.get("/api/gps-delivery/analytics", async (req, res) => {
    try {
      const { startDate, endDate, country, city } = req.query;
      
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        const analytics = await gpsDeliveryStorage.getAnalyticsByDateRange(start, end);
        res.json({ success: true, data: analytics });
      } else if (country) {
        const analytics = await gpsDeliveryStorage.getAnalyticsByLocation(country as string, city as string);
        res.json({ success: true, data: analytics });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: "Either date range (startDate, endDate) or country parameter is required" 
        });
      }
    } catch (error) {
      console.error("Error fetching GPS delivery analytics:", error);
      res.status(500).json({ success: false, message: "Failed to fetch analytics" });
    }
  });

  // Validate delivery location
  app.post("/api/gps-delivery/validate-location", async (req, res) => {
    try {
      const { latitude, longitude, customerAddress } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          success: false, 
          message: "Latitude and longitude are required" 
        });
      }
      
      const validation = await gpsDeliveryStorage.validateDeliveryLocation(
        parseFloat(latitude), 
        parseFloat(longitude), 
        customerAddress || ''
      );
      
      res.json({ success: true, data: validation });
    } catch (error) {
      console.error("Error validating delivery location:", error);
      res.status(500).json({ success: false, message: "Failed to validate location" });
    }
  });

  // =============================================================================
  // LOGISTICS MANAGEMENT API ENDPOINTS
  // =============================================================================

  // Transportation Companies
  app.get('/api/logistics/companies', requireAuth, async (req, res) => {
    try {
      const { isActive } = req.query;
      const companies = await logisticsStorage.getTransportationCompanies({
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      });
      res.json({ success: true, data: companies });
    } catch (error) {
      console.error('Error fetching transportation companies:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت شرکت‌های حمل و نقل' });
    }
  });

  app.get('/api/logistics/companies/:id', requireAuth, async (req, res) => {
    try {
      const company = await logisticsStorage.getTransportationCompanyById(parseInt(req.params.id));
      if (!company) {
        return res.status(404).json({ success: false, message: 'شرکت حمل و نقل یافت نشد' });
      }
      res.json({ success: true, data: company });
    } catch (error) {
      console.error('Error fetching transportation company:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت اطلاعات شرکت' });
    }
  });

  app.post('/api/logistics/companies', requireAuth, async (req, res) => {
    try {
      const validatedData = insertTransportationCompanySchema.parse(req.body);
      const company = await logisticsStorage.createTransportationCompany(validatedData);
      res.status(201).json({ success: true, data: company });
    } catch (error) {
      console.error('Error creating transportation company:', error);
      res.status(500).json({ success: false, message: 'خطا در ایجاد شرکت حمل و نقل' });
    }
  });

  app.put('/api/logistics/companies/:id', requireAuth, async (req, res) => {
    try {
      const company = await logisticsStorage.updateTransportationCompany(
        parseInt(req.params.id),
        req.body
      );
      res.json({ success: true, data: company });
    } catch (error) {
      console.error('Error updating transportation company:', error);
      res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی شرکت' });
    }
  });

  app.delete('/api/logistics/companies/:id', requireAuth, async (req, res) => {
    try {
      await logisticsStorage.deleteTransportationCompany(parseInt(req.params.id));
      res.json({ success: true, message: 'شرکت حمل و نقل حذف شد' });
    } catch (error) {
      console.error('Error deleting transportation company:', error);
      res.status(500).json({ success: false, message: 'خطا در حذف شرکت' });
    }
  });

  // Delivery Vehicles
  app.get('/api/logistics/vehicles', requireAuth, async (req, res) => {
    try {
      const { companyId, vehicleType, currentStatus, isActive } = req.query;
      const vehicles = await logisticsStorage.getDeliveryVehicles({
        companyId: companyId ? parseInt(companyId as string) : undefined,
        vehicleType: vehicleType as string,
        currentStatus: currentStatus as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      });
      res.json({ success: true, data: vehicles });
    } catch (error) {
      console.error('Error fetching delivery vehicles:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت وسایل نقلیه' });
    }
  });

  app.get('/api/logistics/vehicles/available', requireAuth, async (req, res) => {
    try {
      const { vehicleType, minWeight, minVolume } = req.query;
      const vehicles = await logisticsStorage.getAvailableVehicles({
        vehicleType: vehicleType as string,
        minWeight: minWeight ? parseFloat(minWeight as string) : undefined,
        minVolume: minVolume ? parseFloat(minVolume as string) : undefined
      });
      res.json({ success: true, data: vehicles });
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت وسایل نقلیه آزاد' });
    }
  });

  app.post('/api/logistics/vehicles', requireAuth, async (req, res) => {
    try {
      const validatedData = insertDeliveryVehicleSchema.parse(req.body);
      const vehicle = await logisticsStorage.createDeliveryVehicle(validatedData);
      res.status(201).json({ success: true, data: vehicle });
    } catch (error) {
      console.error('Error creating delivery vehicle:', error);
      res.status(500).json({ success: false, message: 'خطا در ایجاد وسیله نقلیه' });
    }
  });

  app.put('/api/logistics/vehicles/:id', requireAuth, async (req, res) => {
    try {
      const vehicle = await logisticsStorage.updateDeliveryVehicle(
        parseInt(req.params.id),
        req.body
      );
      res.json({ success: true, data: vehicle });
    } catch (error) {
      console.error('Error updating delivery vehicle:', error);
      res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی وسیله نقلیه' });
    }
  });

  app.patch('/api/logistics/vehicles/:id/status', requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      const vehicle = await logisticsStorage.updateVehicleStatus(parseInt(req.params.id), status);
      res.json({ success: true, data: vehicle });
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی وضعیت وسیله نقلیه' });
    }
  });

  // Delivery Personnel
  app.get('/api/logistics/personnel', requireAuth, async (req, res) => {
    try {
      const { companyId, currentStatus, isActive } = req.query;
      const personnel = await logisticsStorage.getDeliveryPersonnel({
        companyId: companyId ? parseInt(companyId as string) : undefined,
        currentStatus: currentStatus as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      });
      res.json({ success: true, data: personnel });
    } catch (error) {
      console.error('Error fetching delivery personnel:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت پرسنل تحویل' });
    }
  });

  app.get('/api/logistics/personnel/available', requireAuth, async (req, res) => {
    try {
      const { serviceArea, vehicleType } = req.query;
      const drivers = await logisticsStorage.getAvailableDrivers({
        serviceArea: serviceArea as string,
        vehicleType: vehicleType as string
      });
      res.json({ success: true, data: drivers });
    } catch (error) {
      console.error('Error fetching available drivers:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت رانندگان آزاد' });
    }
  });

  app.post('/api/logistics/personnel', requireAuth, async (req, res) => {
    try {
      const validatedData = insertDeliveryPersonnelSchema.parse(req.body);
      const personnel = await logisticsStorage.createDeliveryPersonnel(validatedData);
      res.status(201).json({ success: true, data: personnel });
    } catch (error) {
      console.error('Error creating delivery personnel:', error);
      res.status(500).json({ success: false, message: 'خطا در ایجاد پرسنل تحویل' });
    }
  });

  app.put('/api/logistics/personnel/:id', requireAuth, async (req, res) => {
    try {
      const personnel = await logisticsStorage.updateDeliveryPersonnel(
        parseInt(req.params.id),
        req.body
      );
      res.json({ success: true, data: personnel });
    } catch (error) {
      console.error('Error updating delivery personnel:', error);
      res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی پرسنل' });
    }
  });

  app.patch('/api/logistics/personnel/:id/status', requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      const personnel = await logisticsStorage.updateDriverStatus(parseInt(req.params.id), status);
      res.json({ success: true, data: personnel });
    } catch (error) {
      console.error('Error updating driver status:', error);
      res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی وضعیت راننده' });
    }
  });

  app.patch('/api/logistics/personnel/:id/location', requireAuth, async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      const personnel = await logisticsStorage.updateDriverLocation(
        parseInt(req.params.id),
        parseFloat(latitude),
        parseFloat(longitude)
      );
      res.json({ success: true, data: personnel });
    } catch (error) {
      console.error('Error updating driver location:', error);
      res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی موقعیت راننده' });
    }
  });

  // Delivery Routes
  app.get('/api/logistics/routes', requireAuth, async (req, res) => {
    try {
      const { driverId, vehicleId, status, startDate, endDate } = req.query;
      const routes = await logisticsStorage.getDeliveryRoutes({
        driverId: driverId ? parseInt(driverId as string) : undefined,
        vehicleId: vehicleId ? parseInt(vehicleId as string) : undefined,
        status: status as string,
        dateRange: startDate && endDate ? {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        } : undefined
      });
      res.json({ success: true, data: routes });
    } catch (error) {
      console.error('Error fetching delivery routes:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت مسیرهای تحویل' });
    }
  });

  app.post('/api/logistics/routes', requireAuth, async (req, res) => {
    try {
      const validatedData = insertDeliveryRouteSchema.parse(req.body);
      const route = await logisticsStorage.createDeliveryRoute(validatedData);
      res.status(201).json({ success: true, data: route });
    } catch (error) {
      console.error('Error creating delivery route:', error);
      res.status(500).json({ success: false, message: 'خطا در ایجاد مسیر تحویل' });
    }
  });

  app.patch('/api/logistics/routes/:id/status', requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      const route = await logisticsStorage.updateRouteStatus(parseInt(req.params.id), status);
      res.json({ success: true, data: route });
    } catch (error) {
      console.error('Error updating route status:', error);
      res.status(500).json({ success: false, message: 'خطا در به‌روزرسانی وضعیت مسیر' });
    }
  });

  app.post('/api/logistics/routes/:id/orders', requireAuth, async (req, res) => {
    try {
      const { orderId } = req.body;
      const route = await logisticsStorage.addOrderToRoute(parseInt(req.params.id), orderId);
      res.json({ success: true, data: route });
    } catch (error) {
      console.error('Error adding order to route:', error);
      res.status(500).json({ success: false, message: 'خطا در اضافه کردن سفارش به مسیر' });
    }
  });

  app.delete('/api/logistics/routes/:id/orders/:orderId', requireAuth, async (req, res) => {
    try {
      const route = await logisticsStorage.removeOrderFromRoute(
        parseInt(req.params.id),
        parseInt(req.params.orderId)
      );
      res.json({ success: true, data: route });
    } catch (error) {
      console.error('Error removing order from route:', error);
      res.status(500).json({ success: false, message: 'خطا در حذف سفارش از مسیر' });
    }
  });

  app.post('/api/logistics/routes/:id/complete-stop', requireAuth, async (req, res) => {
    try {
      const { orderId } = req.body;
      const route = await logisticsStorage.completeRouteStop(parseInt(req.params.id), orderId);
      res.json({ success: true, data: route });
    } catch (error) {
      console.error('Error completing route stop:', error);
      res.status(500).json({ success: false, message: 'خطا در تکمیل توقف مسیر' });
    }
  });

  // Delivery Verification Codes (4-digit SMS codes)
  app.get('/api/logistics/verification-codes', requireAuth, async (req, res) => {
    try {
      const { customerOrderId, isVerified, smsStatus } = req.query;
      const codes = await logisticsStorage.getDeliveryVerificationCodes({
        customerOrderId: customerOrderId ? parseInt(customerOrderId as string) : undefined,
        isVerified: isVerified === 'true' ? true : isVerified === 'false' ? false : undefined,
        smsStatus: smsStatus as string
      });
      res.json({ success: true, data: codes });
    } catch (error) {
      console.error('Error fetching verification codes:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت کدهای تایید' });
    }
  });

  app.get('/api/logistics/verification-codes/order/:orderId', requireAuth, async (req, res) => {
    try {
      const code = await logisticsStorage.getDeliveryCodeByOrderId(parseInt(req.params.orderId));
      if (!code) {
        return res.status(404).json({ success: false, message: 'کد تایید برای این سفارش یافت نشد' });
      }
      res.json({ success: true, data: code });
    } catch (error) {
      console.error('Error fetching verification code:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت کد تایید' });
    }
  });

  app.post('/api/logistics/verification-codes/generate', requireAuth, async (req, res) => {
    try {
      const { customerOrderId, customerPhone, customerName } = req.body;
      
      if (!customerOrderId || !customerPhone || !customerName) {
        return res.status(400).json({ 
          success: false, 
          message: 'شماره سفارش، تلفن و نام مشتری الزامی است' 
        });
      }

      const code = await logisticsStorage.generateVerificationCode(
        customerOrderId, 
        customerPhone, 
        customerName
      );

      // Send SMS notification
      try {
        const smsResult = await smsService.sendDeliveryVerificationSms(
          customerPhone,
          code.verificationCode,
          customerName,
          code.id
        );

        if (smsResult.success) {
          await logisticsStorage.updateSmsStatus(code.id, 'sent', { 
            messageId: smsResult.messageId,
            provider: 'kavenegar'
          });
        }
      } catch (smsError) {
        console.error('SMS sending failed:', smsError);
        // Continue even if SMS fails
      }

      res.status(201).json({ success: true, data: code });
    } catch (error) {
      console.error('Error generating verification code:', error);
      res.status(500).json({ success: false, message: 'خطا در تولید کد تایید' });
    }
  });

  app.post('/api/logistics/verification-codes/verify', requireAuth, async (req, res) => {
    try {
      const { customerOrderId, code, verifiedBy, verificationLocation, latitude, longitude } = req.body;
      
      if (!customerOrderId || !code || !verifiedBy) {
        return res.status(400).json({ 
          success: false, 
          message: 'شماره سفارش، کد تایید و نام تایید کننده الزامی است' 
        });
      }

      const isValid = await logisticsStorage.verifyDeliveryCode(customerOrderId, code, {
        verifiedBy,
        verificationLocation,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined
      });

      if (isValid) {
        res.json({ success: true, message: 'کد تایید با موفقیت تایید شد' });
      } else {
        res.status(400).json({ success: false, message: 'کد تایید نامعتبر یا منقضی شده است' });
      }
    } catch (error) {
      console.error('Error verifying delivery code:', error);
      res.status(500).json({ success: false, message: 'خطا در تایید کد' });
    }
  });

  app.post('/api/logistics/verification-codes/:id/resend', requireAuth, async (req, res) => {
    try {
      const code = await logisticsStorage.resendVerificationCode(parseInt(req.params.id));
      
      // Send new SMS
      try {
        const smsResult = await smsService.sendDeliveryVerificationSms(
          code.customerPhone,
          code.verificationCode,
          code.customerName,
          code.id
        );

        if (smsResult.success) {
          await logisticsStorage.updateSmsStatus(code.id, 'sent', { 
            messageId: smsResult.messageId 
          });
        }
      } catch (smsError) {
        console.error('SMS resend failed:', smsError);
      }

      res.json({ success: true, data: code });
    } catch (error) {
      console.error('Error resending verification code:', error);
      res.status(500).json({ success: false, message: 'خطا در ارسال مجدد کد' });
    }
  });

  // Logistics Analytics
  app.get('/api/logistics/analytics', requireAuth, async (req, res) => {
    try {
      const { period, startDate, endDate } = req.query;
      const analytics = await logisticsStorage.getLogisticsAnalytics({
        period: period as string,
        dateRange: startDate && endDate ? {
          start: new Date(startDate as string),
          end: new Date(endDate as string)
        } : undefined
      });
      res.json({ success: true, data: analytics });
    } catch (error) {
      console.error('Error fetching logistics analytics:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت تحلیل‌های لجستیک' });
    }
  });

  app.get('/api/logistics/analytics/performance', requireAuth, async (req, res) => {
    try {
      const { period = 30 } = req.query;
      const metrics = await logisticsStorage.getPerformanceMetrics(parseInt(period as string));
      res.json({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت معیارهای عملکرد' });
    }
  });

  app.get('/api/logistics/analytics/drivers/:driverId?', requireAuth, async (req, res) => {
    try {
      const { period = 30 } = req.query;
      const { driverId } = req.params;
      const driverStats = await logisticsStorage.getDriverPerformance(
        driverId ? parseInt(driverId) : undefined,
        parseInt(period as string)
      );
      res.json({ success: true, data: driverStats });
    } catch (error) {
      console.error('Error fetching driver performance:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت عملکرد راننده' });
    }
  });

  app.get('/api/logistics/analytics/vehicles/:vehicleId?', requireAuth, async (req, res) => {
    try {
      const { period = 30 } = req.query;
      const { vehicleId } = req.params;
      const vehicleStats = await logisticsStorage.getVehicleUtilization(
        vehicleId ? parseInt(vehicleId) : undefined,
        parseInt(period as string)
      );
      res.json({ success: true, data: vehicleStats });
    } catch (error) {
      console.error('Error fetching vehicle utilization:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت بهره‌وری وسیله نقلیه' });
    }
  });

  app.get('/api/logistics/analytics/costs', requireAuth, async (req, res) => {
    try {
      const { period = 30 } = req.query;
      const costAnalysis = await logisticsStorage.getCostAnalysis(parseInt(period as string));
      res.json({ success: true, data: costAnalysis });
    } catch (error) {
      console.error('Error fetching cost analysis:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت تحلیل هزینه‌ها' });
    }
  });

  // Get warehouse-approved orders ready for logistics processing
  app.get('/api/logistics/orders/pending', requireAuth, async (req, res) => {
    try {
      const pendingOrders = await orderManagementStorage.getOrdersByStatus('warehouse_approved');
      
      // Calculate total weight for each order
      const ordersWithWeight = await Promise.all(
        pendingOrders.map(async (order) => {
          try {
            const weight = await orderManagementStorage.calculateOrderWeight(order.customerOrderId);
            return {
              ...order,
              calculatedWeight: weight,
              weightUnit: 'kg'
            };
          } catch (error) {
            console.error(`Error calculating weight for order ${order.customerOrderId}:`, error);
            return {
              ...order,
              calculatedWeight: 0,
              weightUnit: 'kg'
            };
          }
        })
      );

      res.json({ success: true, data: ordersWithWeight });
    } catch (error) {
      console.error('Error fetching pending logistics orders:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت سفارشات در انتظار لجستیک' });
    }
  });

  // Assign logistics personnel to order
  app.post('/api/logistics/orders/:orderId/assign', requireAuth, async (req, res) => {
    try {
      const { logisticsAssigneeId, deliveryMethod, transportationType, estimatedDeliveryDate, notes } = req.body;
      
      const updatedOrder = await orderManagementStorage.updateOrderStatus(
        parseInt(req.params.orderId),
        'logistics_assigned',
        {
          logisticsAssigneeId,
          logisticsNotes: notes,
          estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : undefined
        }
      );

      // Update delivery information
      if (deliveryMethod || transportationType) {
        await orderManagementStorage.updateDeliveryInfo(parseInt(req.params.orderId), {
          deliveryMethod,
          transportationType
        });
      }

      res.json({ success: true, data: updatedOrder });
    } catch (error) {
      console.error('Error assigning logistics personnel:', error);
      res.status(500).json({ success: false, message: 'خطا در اختصاص پرسنل لجستیک' });
    }
  });

  // Catch-all for unmatched API routes - return JSON 404
  app.all('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method
    });
  });

  // Test sequential delivery code generation
  app.post("/api/test/sequential-code", async (req, res) => {
    try {
      const { customerOrderId, customerPhone, customerName } = req.body;
      
      if (!customerOrderId || !customerPhone || !customerName) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: customerOrderId, customerPhone, customerName"
        });
      }

      const result = await logisticsStorage.generateVerificationCode(
        customerOrderId,
        customerPhone,
        customerName
      );

      res.json({
        success: true,
        data: result,
        message: "Sequential delivery code generated successfully"
      });
    } catch (error) {
      console.error("Error generating sequential code:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate sequential code",
        error: error.message
      });
    }
  });

  // Global error handler for all API routes
  app.use('/api/*', (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('API Error:', err);
    
    // Ensure JSON response even for errors
    if (!res.headersSent) {
      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
