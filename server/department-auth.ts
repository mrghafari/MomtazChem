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
    if (req.user?.id) {
      const departments = await getUserDepartments(req.user.id);
      req.user.departments = departments;
    }
    next();
  } catch (error) {
    console.error("Error attaching user departments:", error);
    next();
  }
};