import express, { type Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { orderManagementStorage } from "./order-management-storage";
import { customerStorage } from "./customer-storage";
import { crmStorage } from "./crm-storage";
import { storage } from "./storage";
import { db } from "./db";
import { eq } from "drizzle-orm";
import * as schema from "@shared/schema";
const { footerSettings, contentItems } = schema;

// Extend session type to include admin user and customer user
declare module "express-session" {
  interface SessionData {
    adminId?: number;
    customerId?: number;
    crmCustomerId?: number;
    isAuthenticated?: boolean;
  }
}

// Admin authentication middleware
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  console.log('🔐 [AUTH DEBUG] ' + req.method + ' ' + req.path);
  console.log('🔐 [AUTH DEBUG] Session:', {
    exists: !!req.session,
    isAuthenticated: req.session?.isAuthenticated,
    adminId: req.session?.adminId,
    customerId: req.session?.customerId,
    sessionID: req.sessionID
  });

  if (req.session && req.session.isAuthenticated === true) {
    if (req.session.adminId) {
      console.log('✅ Admin authentication successful for admin ' + req.session.adminId);
      next();
    } else {
      console.log('❌ Authentication failed - no valid admin ID in session');
      res.status(401).json({ 
        success: false, 
        message: "احراز هویت مورد نیاز است" 
      });
    }
  } else {
    console.log('❌ Admin authentication failed for:', req.path);
    res.status(401).json({ 
      success: false, 
      message: "احراز هویت مدیریت مورد نیاز است" 
    });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  console.log("🚀 Starting server routes...");

  // Admin authentication check
  app.get('/api/admin/me', requireAuth, async (req, res) => {
    try {
      res.json({
        success: true,
        user: {
          id: req.session?.adminId,
          username: 'admin',
          email: 'admin@momtazchem.com',
          roleId: 1,
          roleName: 'admin',
          roleDisplayName: 'Administrator',
          userType: 'admin'
        }
      });
    } catch (error) {
      console.error('Error in admin auth check:', error);
      res.status(500).json({ success: false, message: 'خطای سرور' });
    }
  });

  // Customer authentication check
  app.get("/api/customers/me", async (req, res) => {
    try {
      const customerId = req.session?.customerId;
      const crmCustomerId = req.session?.crmCustomerId;
      const adminId = req.session?.adminId;
      
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

      // Get customer data
      let customer = null;
      if (crmCustomerId) {
        customer = await crmStorage.getCrmCustomerById(crmCustomerId);
      }

      if (!customer) {
        return res.status(404).json({ 
          success: false, 
          message: "اطلاعات مشتری یافت نشد" 
        });
      }

      res.json({
        success: true,
        customer: customer
      });
    } catch (error) {
      console.error("Error fetching customer profile:", error);
      res.status(500).json({ 
        success: false, 
        message: "خطا در دریافت اطلاعات مشتری" 
      });
    }
  });

  // Financial orders endpoint
  app.get('/api/financial/orders', async (req, res) => {
    try {
      console.log('🔍 [ROUTES] Financial endpoint called - using getOrdersByDepartment');
      const orders = await orderManagementStorage.getOrdersByDepartment('financial');
      
      console.log('🔍 [ROUTES] Received ' + orders.length + ' orders from financial department');
      
      // Transform orders to ensure compatibility with frontend interface
      const transformedOrders = orders.map(order => ({
        ...order,
        customerFirstName: order.customer?.firstName || '',
        customerLastName: order.customer?.lastName || '',
        customerEmail: order.customer?.email || '',
        customerPhone: order.customer?.phone || ''
      }));

      res.json({
        success: true,
        orders: transformedOrders
      });
    } catch (error) {
      console.error('Error fetching financial orders:', error);
      res.status(500).json({
        success: false,
        message: 'خطا در دریافت سفارشات مالی'
      });
    }
  });

  // Products endpoint
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json({ success: true, data: products });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت محصولات' });
    }
  });

  // Footer settings endpoint
  app.get('/api/footer-settings', async (req, res) => {
    try {
      const { language = 'en' } = req.query;
      
      const [footerSetting] = await db
        .select()
        .from(footerSettings)
        .where(eq(footerSettings.language, language as string))
        .limit(1);
      
      if (!footerSetting) {
        return res.json({
          success: true,
          data: {
            companyName: 'Momtazchem',
            companyDescription: 'Leading provider of advanced chemical solutions',
            showSocialMedia: true,
            showCompanyInfo: true,
            showLinks: true
          }
        });
      }
      
      res.json({ success: true, data: footerSetting });
    } catch (error) {
      console.error('Error fetching footer settings:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت تنظیمات فوتر' });
    }
  });

  // Public content settings endpoint
  app.get('/api/public/content-settings', async (req, res) => {
    try {
      console.log('📊 [PUBLIC CONTENT] Fetching public content settings:', req.query);
      const { language = 'en', section } = req.query;
      
      // Simplified content items for now
      const items = [
        {
          id: 1,
          section: 'social_media',
          key: 'facebook_url',
          value: 'https://facebook.com/momtazchem',
          language: 'en'
        },
        {
          id: 2,
          section: 'social_media', 
          key: 'twitter_url',
          value: 'https://twitter.com/momtazchem',
          language: 'en'
        }
      ];
      console.log('✅ [PUBLIC CONTENT] Found ' + items.length + ' content items');
      res.json({ success: true, data: items });
    } catch (error) {
      console.error('❌ [PUBLIC CONTENT] Error fetching content settings:', error);
      res.status(500).json({ success: false, message: "خطا در دریافت تنظیمات محتوا" });
    }
  });

  // Admin login endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, message: 'نام کاربری و رمز عبور الزامی است' });
      }

      // For now use admin credentials directly - need to implement proper admin auth
      const admin = { id: 1, username, name: 'Admin' };
      
      // Simple admin check (replace with proper DB lookup)
      if (username !== 'admin' || password !== 'admin123') {
        return res.status(401).json({ success: false, message: 'نام کاربری یا رمز عبور نادرست است' });
      }
      
      if (!admin) {
        return res.status(401).json({ success: false, message: 'نام کاربری یا رمز عبور نادرست است' });
      }

      // Set session
      req.session.isAuthenticated = true;
      req.session.adminId = admin.id;
      req.session.customerId = undefined; // Clear customer session

      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve(void 0);
        });
      });

      res.json({ success: true, data: admin, message: 'ورود موفقیت آمیز' });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ success: false, message: 'خطای سرور' });
    }
  });

  // Shop products endpoint
  app.get("/api/shop/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json({ success: true, data: products });
    } catch (error) {
      console.error('Error fetching shop products:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت محصولات' });
    }
  });

  // Shop categories endpoint
  app.get("/api/shop/categories", async (req, res) => {
    try {
      const categories = []; // Default empty categories for now
      res.json({ success: true, data: categories });
    } catch (error) {
      console.error('Error fetching shop categories:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت دسته‌بندی‌ها' });
    }
  });

  // Shop search endpoint
  app.get("/api/shop/search", async (req, res) => {
    try {
      const results = []; // Default empty search results for now
      res.json({ success: true, data: results });
    } catch (error) {
      console.error('Error searching shop products:', error);
      res.status(500).json({ success: false, message: 'خطا در جستجو' });
    }
  });

  // Shop discounts endpoint
  app.get("/api/shop/discounts", async (req, res) => {
    try {
      const discounts = []; // Default empty discounts for now
      res.json({ success: true, data: discounts });
    } catch (error) {
      console.error('Error fetching shop discounts:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت تخفیفات' });
    }
  });

  // Frontend controls endpoint
  app.get("/api/frontend-controls", async (req, res) => {
    try {
      const controls = null; // Default frontend controls
      res.json({ success: true, data: controls });
    } catch (error) {
      console.error('Error fetching frontend controls:', error);
      res.status(500).json({ success: false, data: null });
    }
  });

  // Shop product stats endpoint
  app.get("/api/shop/product-stats", async (req, res) => {
    try {
      const stats = {}; // Default empty stats
      res.json({ success: true, data: stats });
    } catch (error) {
      console.error('Error fetching product stats:', error);
      res.status(500).json({ success: false, data: {} });
    }
  });

  // Logistics provinces endpoint
  app.get("/api/logistics/provinces", async (req, res) => {
    try {
      const provinces = []; // Default empty provinces
      res.json({ success: true, data: provinces });
    } catch (error) {
      console.error('Error fetching provinces:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت استان‌ها' });
    }
  });

  // Customer verification settings endpoint
  app.get("/api/customer/verification-settings", async (req, res) => {
    try {
      const settings = {}; // Default verification settings
      res.json({ success: true, data: settings });
    } catch (error) {
      console.error('Error fetching verification settings:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت تنظیمات تایید' });
    }
  });

  // Content management items endpoint
  app.get("/api/content-management/items", async (req, res) => {
    try {
      const items = []; // Default empty content items
      res.json({ success: true, data: items });
    } catch (error) {
      console.error('Error fetching content items:', error);
      res.status(500).json({ success: false, message: 'خطا در دریافت آیتم‌های محتوا' });
    }
  });

  // Basic health check
  app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is healthy' });
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}