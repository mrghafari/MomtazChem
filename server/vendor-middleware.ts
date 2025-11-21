import type { Request, Response, NextFunction } from "express";
import { vendorStorage } from "./vendor-storage";

// Extend Express Request interface to include vendorUser
declare global {
  namespace Express {
    interface Request {
      vendorUser?: {
        id: number;
        vendorId: number;
        username: string;
        email: string;
        role: string;
        permissions?: string[];
      };
    }
  }
}

/**
 * Middleware to check if vendor user is authenticated
 * Requires vendor session to be active
 */
export function requireVendorAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Check if vendor session exists
  if (!req.session?.vendorUserId) {
    return res.status(401).json({
      success: false,
      message: "Vendor authentication required"
    });
  }

  next();
}

/**
 * Middleware to load vendor user information into request
 * Must be used after requireVendorAuth
 */
export async function loadVendorUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const vendorUserId = req.session?.vendorUserId;

    if (!vendorUserId) {
      return res.status(401).json({
        success: false,
        message: "Vendor authentication required"
      });
    }

    // Load vendor user from database
    const vendorUser = await vendorStorage.getVendorUserById(vendorUserId);

    if (!vendorUser || !vendorUser.isActive) {
      // Clear invalid session
      req.session.vendorUserId = null;
      return res.status(401).json({
        success: false,
        message: "Vendor user not found or inactive"
      });
    }

    // Check if user account is locked
    if (vendorUser.lockedUntil && new Date(vendorUser.lockedUntil) > new Date()) {
      return res.status(403).json({
        success: false,
        message: "Account is temporarily locked due to multiple failed login attempts"
      });
    }

    // Load vendor information
    const vendor = await vendorStorage.getVendorById(vendorUser.vendorId);

    if (!vendor || !vendor.isActive || !vendor.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Vendor account is not active or not approved"
      });
    }

    // Attach vendor user info to request
    req.vendorUser = {
      id: vendorUser.id,
      vendorId: vendorUser.vendorId,
      username: vendorUser.username,
      email: vendorUser.email,
      role: vendorUser.role,
      permissions: vendorUser.permissions as string[] | undefined
    };

    next();
  } catch (error) {
    console.error("Error loading vendor user:", error);
    return res.status(500).json({
      success: false,
      message: "Error loading vendor user information"
    });
  }
}

/**
 * Middleware to check if vendor user has specific permission
 */
export function requireVendorPermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.vendorUser) {
      return res.status(401).json({
        success: false,
        message: "Vendor authentication required"
      });
    }

    // Vendor owners have all permissions
    if (req.vendorUser.role === "vendor_owner") {
      return next();
    }

    // Check if user has the required permission
    const permissions = req.vendorUser.permissions || [];
    if (!permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: ${permission} required`
      });
    }

    next();
  };
}

/**
 * Middleware to check if vendor user has specific role
 */
export function requireVendorRole(allowedRoles: string | string[]) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.vendorUser) {
      return res.status(401).json({
        success: false,
        message: "Vendor authentication required"
      });
    }

    if (!roles.includes(req.vendorUser.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: requires one of these roles: ${roles.join(", ")}`
      });
    }

    next();
  };
}

/**
 * Middleware to ensure vendor user can only access their own vendor's data
 * Checks vendorId parameter in request params
 */
export function ensureOwnVendor(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.vendorUser) {
    return res.status(401).json({
      success: false,
      message: "Vendor authentication required"
    });
  }

  // Get vendorId from request params or body
  const requestedVendorId = parseInt(req.params.vendorId || req.body.vendorId);

  if (!requestedVendorId) {
    return res.status(400).json({
      success: false,
      message: "Vendor ID required"
    });
  }

  // Check if vendor user is trying to access their own vendor
  if (requestedVendorId !== req.vendorUser.vendorId) {
    return res.status(403).json({
      success: false,
      message: "Access denied: you can only access your own vendor's data"
    });
  }

  next();
}

/**
 * Combined middleware for vendor routes
 * Checks authentication and loads user data
 */
export const vendorAuth = [requireVendorAuth, loadVendorUser];

/**
 * Combined middleware for vendor product management
 * Requires authentication, user load, and product management permission
 */
export const vendorProductAuth = [
  requireVendorAuth,
  loadVendorUser,
  requireVendorPermission("manage_products")
];

/**
 * Combined middleware for vendor owner only routes
 * Requires authentication, user load, and owner role
 */
export const vendorOwnerAuth = [
  requireVendorAuth,
  loadVendorUser,
  requireVendorRole("vendor_owner")
];

// Extend Express Session to include vendorUserId
declare module "express-session" {
  interface SessionData {
    vendorUserId?: number;
  }
}
