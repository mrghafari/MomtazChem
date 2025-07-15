import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { departmentAssignments } from "../shared/order-management-schema";
import { eq, and } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: string;
    departments: string[];
  };
}

// Check if user has access to specific department
export const requireDepartment = (requiredDepartment: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const adminId = req.user?.id;
      
      if (!adminId) {
        return res.status(401).json({
          success: false,
          message: "احراز هویت مورد نیاز است"
        });
      }

      // Check if user is super admin (has access to all departments)
      const { users } = await import("../shared/schema");
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, adminId))
        .limit(1);

      // Super admin has access to all departments
      if (user.length > 0 && (user[0].username === 'admin@momtazchem.com' || user[0].username === 'Omid Mohammad')) {
        return next();
      }

      // Check if user is assigned to the required department
      const assignment = await db
        .select()
        .from(departmentAssignments)
        .where(and(
          eq(departmentAssignments.adminUserId, adminId),
          eq(departmentAssignments.department, requiredDepartment),
          eq(departmentAssignments.isActive, true)
        ))
        .limit(1);

      if (assignment.length === 0) {
        return res.status(403).json({
          success: false,
          message: `شما به بخش ${requiredDepartment} دسترسی ندارید`
        });
      }

      next();
    } catch (error) {
      console.error("Error checking department access:", error);
      res.status(500).json({
        success: false,
        message: "خطا در بررسی دسترسی بخش",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
};

// Get user's departments
export const getUserDepartments = async (adminId: number): Promise<string[]> => {
  try {
    const assignments = await db
      .select()
      .from(departmentAssignments)
      .where(and(
        eq(departmentAssignments.adminUserId, adminId),
        eq(departmentAssignments.isActive, true)
      ));

    return assignments.map(assignment => assignment.department);
  } catch (error) {
    console.error("Error fetching user departments:", error);
    return [];
  }
};

// Middleware to add departments to user object
export const attachUserDepartments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Only process if user is authenticated
    const adminId = req.session?.adminId;
    if (adminId) {
      const { users } = await import("../shared/schema");
      
      // Get user info from database
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, adminId))
        .limit(1);

      if (userResult.length > 0) {
        const user = userResult[0];
        const departments = await getUserDepartments(adminId);
        
        // Attach user info to request
        req.user = {
          id: adminId,
          username: user.username,
          role: user.roleId ? 'admin' : 'super_admin',
          departments: departments
        };
      }
    }
    next();
  } catch (error) {
    console.error("Error attaching user departments:", error);
    next();
  }
};