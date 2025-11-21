import { Router } from "express";
import { vendorStorage } from "./vendor-storage";
import { requireAdminAuth, requireAdminRole } from "./admin-auth";

export function createAdminVendorRouter() {
  const router = Router();

  // Apply admin authentication to all routes
  router.use(requireAdminAuth);
  router.use(requireAdminRole(['admin', 'super_admin']));

  // Get all vendors (admin only)
  router.get("/", async (req, res) => {
    try {
      const vendors = await vendorStorage.getVendors();

      res.json({
        success: true,
        vendors,
        totalCount: vendors.length
      });
    } catch (error: any) {
      console.error("Error getting vendors:", error);
      res.status(500).json({
        success: false,
        message: "Error getting vendors"
      });
    }
  });

  // Get pending vendors (awaiting approval)
  router.get("/pending", async (req, res) => {
    try {
      const pendingVendors = await vendorStorage.getPendingVendors();

      res.json({
        success: true,
        vendors: pendingVendors,
        totalCount: pendingVendors.length
      });
    } catch (error: any) {
      console.error("Error getting pending vendors:", error);
      res.status(500).json({
        success: false,
        message: "Error getting pending vendors"
      });
    }
  });

  // Get approved vendors
  router.get("/approved", async (req, res) => {
    try {
      const approvedVendors = await vendorStorage.getApprovedVendors();

      res.json({
        success: true,
        vendors: approvedVendors,
        totalCount: approvedVendors.length
      });
    } catch (error: any) {
      console.error("Error getting approved vendors:", error);
      res.status(500).json({
        success: false,
        message: "Error getting approved vendors"
      });
    }
  });

  // Get vendor by ID
  router.get("/:id", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const vendor = await vendorStorage.getVendorById(vendorId);

      if (!vendor) {
        return res.status(404).json({
          success: false,
          message: "Vendor not found"
        });
      }

      // Get vendor users
      const vendorUsers = await vendorStorage.getVendorUsers(vendorId);

      // Get vendor product count
      const productCount = await vendorStorage.getVendorProductCount(vendorId);

      res.json({
        success: true,
        vendor: {
          ...vendor,
          totalProducts: productCount,
          users: vendorUsers
        }
      });
    } catch (error: any) {
      console.error("Error getting vendor:", error);
      res.status(500).json({
        success: false,
        message: "Error getting vendor"
      });
    }
  });

  // Approve vendor
  router.post("/:id/approve", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      
      // Get admin user ID from session (already verified by requireAdminAuth)
      const adminUserId = req.session?.adminId;
      
      if (!adminUserId) {
        return res.status(401).json({
          success: false,
          message: "Admin authentication required"
        });
      }

      const vendor = await vendorStorage.approveVendor(vendorId, adminUserId);

      res.json({
        success: true,
        message: "Vendor approved successfully",
        vendor
      });
    } catch (error: any) {
      console.error("Error approving vendor:", error);
      res.status(500).json({
        success: false,
        message: "Error approving vendor"
      });
    }
  });

  // Reject vendor
  router.post("/:id/reject", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: "Rejection reason required"
        });
      }

      const vendor = await vendorStorage.rejectVendor(vendorId, reason);

      res.json({
        success: true,
        message: "Vendor rejected successfully",
        vendor
      });
    } catch (error: any) {
      console.error("Error rejecting vendor:", error);
      res.status(500).json({
        success: false,
        message: "Error rejecting vendor"
      });
    }
  });

  // Update vendor (admin can update any field)
  router.patch("/:id", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);

      const vendor = await vendorStorage.updateVendor(vendorId, req.body);

      res.json({
        success: true,
        message: "Vendor updated successfully",
        vendor
      });
    } catch (error: any) {
      console.error("Error updating vendor:", error);
      res.status(500).json({
        success: false,
        message: "Error updating vendor"
      });
    }
  });

  // Delete vendor (soft delete by deactivating)
  router.delete("/:id", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);

      // Deactivate instead of delete
      await vendorStorage.updateVendor(vendorId, {
        isActive: false,
        isApproved: false
      });

      res.json({
        success: true,
        message: "Vendor deactivated successfully"
      });
    } catch (error: any) {
      console.error("Error deactivating vendor:", error);
      res.status(500).json({
        success: false,
        message: "Error deactivating vendor"
      });
    }
  });

  // Get vendor products (admin can see all vendor products)
  router.get("/:id/products", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);

      const showcaseProducts = await vendorStorage.getVendorShowcaseProducts(vendorId);
      const shopProducts = await vendorStorage.getVendorShopProducts(vendorId);

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
        message: "Error getting vendor products"
      });
    }
  });

  // Get vendor statistics
  router.get("/:id/statistics", async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);

      const vendor = await vendorStorage.getVendorById(vendorId);
      const productCount = await vendorStorage.getVendorProductCount(vendorId);

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
          isActive: vendor.isActive,
          vendorName: vendor.vendorName,
          contactEmail: vendor.contactEmail
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

  console.log("✅ [ADMIN-VENDOR] Admin vendor management router created");
  
  return router;
}
