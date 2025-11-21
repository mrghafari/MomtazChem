import { Request, Response, NextFunction } from "express";

export const requireAdminAuth = async (req: Request, res: Response, next: NextFunction) => {
  console.log(`🔐 [ADMIN AUTH] ${req.method} ${req.path}`);
  console.log(`🔐 [ADMIN AUTH] Session:`, {
    exists: !!req.session,
    adminId: req.session?.adminId,
    sessionID: req.sessionID
  });

  // Check for valid admin authentication (admin login sets adminId)
  if (req.session && req.session.adminId) {
    console.log(`✅ Admin authentication successful for admin ${req.session.adminId}`);
    next();
  } else {
    console.log('❌ Admin authentication failed - no valid admin session');
    res.status(401).json({ 
      success: false, 
      message: "Admin authentication required" 
    });
  }
};

export const requireAdminRole = (allowedRoles: string[] = ['admin', 'super_admin']) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.adminId) {
      console.log('❌ Admin role check failed - not authenticated');
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    // Get admin user role from session
    const adminRole = (req.session as any).customUserRole || 'admin';
    
    console.log(`🔍 [ADMIN ROLE] Checking role for admin ${req.session.adminId}: ${adminRole}`);
    console.log(`🔍 [ADMIN ROLE] Allowed roles:`, allowedRoles);

    if (allowedRoles.includes(adminRole)) {
      console.log(`✅ Admin role check passed: ${adminRole}`);
      next();
    } else {
      console.log(`❌ Admin role check failed: ${adminRole} not in [${allowedRoles.join(', ')}]`);
      res.status(403).json({
        success: false,
        message: "Insufficient permissions"
      });
    }
  };
};

export const requireAdminPermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session?.adminId) {
      console.log('❌ Admin permission check failed - not authenticated');
      return res.status(401).json({
        success: false,
        message: "Admin authentication required"
      });
    }

    // Get admin permissions from session
    const adminPermissions = (req.session as any).customUserPermissions || [];
    
    console.log(`🔍 [ADMIN PERMISSION] Checking permission for admin ${req.session.adminId}: ${requiredPermission}`);
    console.log(`🔍 [ADMIN PERMISSION] User permissions:`, adminPermissions);

    // Super admins have all permissions
    const adminRole = (req.session as any).customUserRole;
    if (adminRole === 'super_admin') {
      console.log(`✅ Admin permission check passed: super_admin has all permissions`);
      return next();
    }

    if (adminPermissions.includes(requiredPermission)) {
      console.log(`✅ Admin permission check passed: ${requiredPermission}`);
      next();
    } else {
      console.log(`❌ Admin permission check failed: missing ${requiredPermission}`);
      res.status(403).json({
        success: false,
        message: "Insufficient permissions"
      });
    }
  };
};
