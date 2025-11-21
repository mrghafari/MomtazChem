import { Router } from "express";
import { vendorStorage } from "./vendor-storage";
import {
  vendorAuth,
  requireVendorAuth,
  loadVendorUser,
  vendorProductAuth,
  vendorOwnerAuth,
  ensureOwnVendor
} from "./vendor-middleware";
import { z } from "zod";
import { insertVendorSchema, insertVendorUserSchema } from "@shared/schema";

export function createVendorRouter() {
  const router = Router();
  // ==========================================================================
  // VENDOR AUTHENTICATION ROUTES
  // ==========================================================================

  // Vendor registration
  router.post("/auth/register", async (req, res) => {
    try {
      const { vendorData, userData } = req.body;

      // Validate vendor data
      const vendorSchema = insertVendorSchema.pick({
        vendorName: true,
        contactEmail: true,
        contactPhone: true,
        businessLicense: true,
        taxId: true,
        description: true,
        address: true,
        city: true,
        country: true
      });

      const validatedVendorData = vendorSchema.parse(vendorData);

      // Check if vendor email already exists
      const existingVendor = await vendorStorage.getVendorByEmail(validatedVendorData.contactEmail);
      if (existingVendor) {
        return res.status(400).json({
          success: false,
          message: "A vendor with this email already exists"
        });
      }

      // Create vendor (inactive and unapproved by default)
      const vendor = await vendorStorage.createVendor({
        ...validatedVendorData,
        isActive: false,
        isApproved: false
      });

      // Validate user data
      const userSchema = insertVendorUserSchema.pick({
        username: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        phone: true
      });

      const validatedUserData = userSchema.parse(userData);

      // Check if username or email already exists
      const existingUsername = await vendorStorage.getVendorUserByUsername(validatedUserData.username);
      if (existingUsername) {
        // Rollback vendor creation
        await vendorStorage.deleteVendor(vendor.id);
        return res.status(400).json({
          success: false,
          message: "Username already exists"
        });
      }

      const existingEmail = await vendorStorage.getVendorUserByEmail(validatedUserData.email);
      if (existingEmail) {
        // Rollback vendor creation
        await vendorStorage.deleteVendor(vendor.id);
        return res.status(400).json({
          success: false,
          message: "Email already exists"
        });
      }

      // Create vendor user (owner role)
      await vendorStorage.createVendorUser({
        ...validatedUserData,
        vendorId: vendor.id,
        role: "vendor_owner",
        isActive: true,
        permissions: ["manage_products", "manage_orders", "manage_users", "view_reports"]
      });

      res.json({
        success: true,
        message: "Vendor registration successful. Your account is pending admin approval.",
        vendor: {
          id: vendor.id,
          vendorName: vendor.vendorName,
          contactEmail: vendor.contactEmail
        }
      });
    } catch (error: any) {
      console.error("Error in vendor registration:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: error.errors
        });
      }

      res.status(500).json({
        success: false,
        message: "Error registering vendor"
      });
    }
  });

  // Vendor login
  router.post("/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password are required"
        });
      }

      // Verify credentials
      const vendorUser = await vendorStorage.verifyVendorUserPassword(username, password);

      if (!vendorUser) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password"
        });
      }

      // Load vendor information
      const vendor = await vendorStorage.getVendorById(vendorUser.vendorId);

      if (!vendor) {
        return res.status(500).json({
          success: false,
          message: "Vendor not found"
        });
      }

      if (!vendor.isApproved) {
        return res.status(403).json({
          success: false,
          message: "Your vendor account is pending admin approval"
        });
      }

      if (!vendor.isActive) {
        return res.status(403).json({
          success: false,
          message: "Your vendor account is inactive. Please contact support."
        });
      }

      // Update login info
      const clientIp = req.ip || req.headers['x-forwarded-for']?.toString() || "unknown";
      await vendorStorage.updateVendorUserLoginInfo(vendorUser.id, clientIp);

      // Create session
      req.session.vendorUserId = vendorUser.id;

      res.json({
        success: true,
        message: "Login successful",
        user: {
          id: vendorUser.id,
          username: vendorUser.username,
          email: vendorUser.email,
          role: vendorUser.role,
          vendorId: vendorUser.vendorId,
          vendorName: vendor.vendorName
        }
      });
    } catch (error: any) {
      console.error("Error in vendor login:", error);
      res.status(500).json({
        success: false,
        message: "Error during login"
      });
    }
  });

  // Vendor logout
  router.post("/auth/logout", requireVendorAuth, (req, res) => {
    req.session.vendorUserId = null;
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).json({
          success: false,
          message: "Error during logout"
        });
      }

      res.json({
        success: true,
        message: "Logged out successfully"
      });
    });
  });

  // Get current vendor user session
  router.get("/auth/me", ...vendorAuth, async (req, res) => {
    try {
      if (!req.vendorUser) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }

      // Load full vendor user data
      const vendorUser = await vendorStorage.getVendorUserById(req.vendorUser.id);
      const vendor = await vendorStorage.getVendorById(req.vendorUser.vendorId);

      if (!vendorUser || !vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor or user not found"
        });
      }

      res.json({
        success: true,
        user: {
          id: vendorUser.id,
          username: vendorUser.username,
          email: vendorUser.email,
          firstName: vendorUser.firstName,
          lastName: vendorUser.lastName,
          phone: vendorUser.phone,
          role: vendorUser.role,
          permissions: vendorUser.permissions,
          vendorId: vendorUser.vendorId,
          vendorName: vendor.vendorName,
          vendorEmail: vendor.contactEmail,
          vendorApproved: vendor.isApproved,
          vendorActive: vendor.isActive
        }
      });
    } catch (error: any) {
      console.error("Error getting vendor user session:", error);
      res.status(500).json({
        success: false,
        message: "Error getting session"
      });
    }
  });

  // ==========================================================================
  // VENDOR MANAGEMENT ROUTES (for logged-in vendors)
  // ==========================================================================

  // Get own vendor details
  router.get("/profile", ...vendorAuth, async (req, res) => {
    try {
      if (!req.vendorUser) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }

      const vendor = await vendorStorage.getVendorById(req.vendorUser.vendorId);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found"
        });
      }

      res.json({
        success: true,
        vendor
      });
    } catch (error: any) {
      console.error("Error getting vendor profile:", error);
      res.status(500).json({
        success: false,
        message: "Error getting vendor profile"
      });
    }
  });

  // Update own vendor profile
  router.patch("/profile", ...vendorAuth, async (req, res) => {
    try {
      if (!req.vendorUser) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }

      const allowedFields = [
        "vendorName",
        "vendorNameEn",
        "vendorNameAr",
        "vendorNameKu",
        "vendorNameTr",
        "contactPhone",
        "description",
        "descriptionEn",
        "descriptionAr",
        "descriptionKu",
        "descriptionTr",
        "address",
        "city",
        "postalCode",
        "logoUrl",
        "bankAccountInfo"
      ];

      const updateData: any = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const vendor = await vendorStorage.updateVendor(req.vendorUser.vendorId, updateData);

      res.json({
        success: true,
        message: "Vendor profile updated successfully",
        vendor
      });
    } catch (error: any) {
      console.error("Error updating vendor profile:", error);
      res.status(500).json({
        success: false,
        message: "Error updating vendor profile"
      });
    }
  });

  // ==========================================================================
  // VENDOR PRODUCT MANAGEMENT ROUTES
  // ==========================================================================

  // Get vendor's products (both showcase and shop)
  router.get("/products", ...vendorAuth, async (req, res) => {
    try {
      if (!req.vendorUser) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }

      const showcaseProducts = await vendorStorage.getVendorShowcaseProducts(req.vendorUser.vendorId);
      const shopProducts = await vendorStorage.getVendorShopProducts(req.vendorUser.vendorId);

      res.json({
        success: true,
        products: {
          showcase: showcaseProducts,
          shop: shopProducts
        },
        totalCount: showcaseProducts.length + shopProducts.length
      });
    } catch (error: any) {
      console.error("Error getting vendor products:", error);
      res.status(500).json({
        success: false,
        message: "Error getting products"
      });
    }
  });

  // Search vendor's products
  router.get("/products/search", ...vendorAuth, async (req, res) => {
    try {
      if (!req.vendorUser) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }

      const query = req.query.q as string || "";

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Search query required"
        });
      }

      const results = await vendorStorage.searchVendorProducts(req.vendorUser.vendorId, query);

      res.json({
        success: true,
        results,
        totalCount: results.showcaseProducts.length + results.shopProducts.length
      });
    } catch (error: any) {
      console.error("Error searching vendor products:", error);
      res.status(500).json({
        success: false,
        message: "Error searching products"
      });
    }
  });

  // Create new shop product (vendor must have manage_products permission)
  router.post("/products/shop", ...vendorProductAuth, async (req, res) => {
    try {
      if (!req.vendorUser) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }

      // Validate product data with Zod schema
      const { insertShopProductSchema } = await import("@shared/shop-schema");
      
      const validationResult = insertShopProductSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid product data",
          errors: validationResult.error.errors
        });
      }

      // Import shop storage
      const { shopStorage } = await import("./shop-storage");
      
      // Add vendorId to product data
      const productData = {
        ...validationResult.data,
        vendorId: req.vendorUser.vendorId
      };

      const product = await shopStorage.createShopProduct(productData);

      // Update vendor product count
      await vendorStorage.updateVendorStats(req.vendorUser.vendorId);

      res.json({
        success: true,
        message: "Product created successfully",
        product
      });
    } catch (error: any) {
      console.error("Error creating shop product:", error);
      res.status(500).json({
        success: false,
        message: "Error creating product"
      });
    }
  });

  // Update shop product (vendor must own the product)
  router.patch("/products/shop/:id", ...vendorProductAuth, async (req, res) => {
    try {
      if (!req.vendorUser) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }

      const productId = parseInt(req.params.id);
      const { shopStorage } = await import("./shop-storage");

      // Verify product belongs to this vendor
      const existingProduct = await shopStorage.getShopProductById(productId);
      
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      if (existingProduct.vendorId !== req.vendorUser.vendorId) {
        return res.status(403).json({
          success: false,
          message: "You can only update your own products"
        });
      }

      // Validate product data with Zod schema (partial update)
      const { insertShopProductSchema } = await import("@shared/shop-schema");
      
      const validationResult = insertShopProductSchema.partial().safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid product data",
          errors: validationResult.error.errors
        });
      }

      // Don't allow changing vendorId
      const { vendorId, ...updateData } = validationResult.data;

      const product = await shopStorage.updateShopProduct(productId, updateData);

      res.json({
        success: true,
        message: "Product updated successfully",
        product
      });
    } catch (error: any) {
      console.error("Error updating shop product:", error);
      res.status(500).json({
        success: false,
        message: "Error updating product"
      });
    }
  });

  // Delete shop product (vendor must own the product and have vendor_owner role)
  router.delete("/products/shop/:id", ...vendorOwnerAuth, async (req, res) => {
    try {
      if (!req.vendorUser) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }

      const productId = parseInt(req.params.id);
      const { shopStorage } = await import("./shop-storage");

      // Verify product belongs to this vendor
      const existingProduct = await shopStorage.getShopProductById(productId);
      
      if (!existingProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found"
        });
      }

      if (existingProduct.vendorId !== req.vendorUser.vendorId) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own products"
        });
      }

      await shopStorage.deleteShopProduct(productId);

      // Update vendor product count
      await vendorStorage.updateVendorStats(req.vendorUser.vendorId);

      res.json({
        success: true,
        message: "Product deleted successfully"
      });
    } catch (error: any) {
      console.error("Error deleting shop product:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting product"
      });
    }
  });

  // Get vendor statistics
  router.get("/statistics", ...vendorAuth, async (req, res) => {
    try {
      if (!req.vendorUser) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated"
        });
      }

      const vendor = await vendorStorage.getVendorById(req.vendorUser.vendorId);
      const productCount = await vendorStorage.getVendorProductCount(req.vendorUser.vendorId);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found"
        });
      }

      res.json({
        success: true,
        statistics: {
          totalProducts: productCount,
          totalSales: vendor.totalSales,
          rating: vendor.rating,
          totalReviews: vendor.totalReviews,
          isApproved: vendor.isApproved,
          isActive: vendor.isActive
        }
      });
    } catch (error: any) {
      console.error("Error getting vendor statistics:", error);
      res.status(500).json({
        success: false,
        message: "Error getting statistics"
      });
    }
  });

  console.log("✅ [VENDOR] Vendor router created successfully");
  
  return router;
}
