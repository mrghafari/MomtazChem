import { pgTable, text, serial, timestamp, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// SECURITY MANAGEMENT SCHEMA - For security monitoring and management
// =============================================================================

// Security audit logs
export const securityLogs = pgTable("security_logs", {
  id: serial("id").primaryKey(),
  eventType: text("event_type").notNull(), // login_attempt, failed_login, admin_access, file_upload, etc.
  severity: text("severity").notNull().default("info"), // low, medium, high, critical
  description: text("description").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: integer("user_id"), // Reference to user if applicable
  username: text("username"),
  endpoint: text("endpoint"), // API endpoint accessed
  method: text("method"), // HTTP method
  statusCode: integer("status_code"),
  metadata: json("metadata"), // Additional security context
  blocked: boolean("blocked").default(false), // Whether action was blocked
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSecurityLogSchema = createInsertSchema(securityLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertSecurityLog = z.infer<typeof insertSecurityLogSchema>;
export type SecurityLog = typeof securityLogs.$inferSelect;

// Security settings and configurations
export const securitySettings = pgTable("security_settings", {
  id: serial("id").primaryKey(),
  setting: text("setting").notNull().unique(), // Setting name
  value: text("value").notNull(), // Setting value
  category: text("category").notNull(), // auth, upload, access, monitoring, etc.
  description: text("description"),
  isActive: boolean("is_active").default(true),
  updatedBy: integer("updated_by"), // Admin who updated
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSecuritySettingSchema = createInsertSchema(securitySettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSecuritySetting = z.infer<typeof insertSecuritySettingSchema>;
export type SecuritySetting = typeof securitySettings.$inferSelect;

// IP blacklist/whitelist management
export const ipAccessControl = pgTable("ip_access_control", {
  id: serial("id").primaryKey(),
  ipAddress: text("ip_address").notNull(),
  type: text("type").notNull(), // blacklist, whitelist
  reason: text("reason"),
  category: text("category").notNull(), // admin, customer, api, etc.
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"), // Optional expiration
  addedBy: integer("added_by"), // Admin who added
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIpAccessControlSchema = createInsertSchema(ipAccessControl).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIpAccessControl = z.infer<typeof insertIpAccessControlSchema>;
export type IpAccessControl = typeof ipAccessControl.$inferSelect;

// Session management for security tracking
export const securitySessions = pgTable("security_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  userId: integer("user_id"),
  username: text("username"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  loginTime: timestamp("login_time").notNull().defaultNow(),
  lastActivity: timestamp("last_activity").notNull().defaultNow(),
  isActive: boolean("is_active").default(true),
  logoutTime: timestamp("logout_time"),
  logoutReason: text("logout_reason"), // manual, timeout, security, admin_terminated
  riskScore: integer("risk_score").default(0), // 0-100 risk assessment
  location: text("location"), // Geolocation if available
  deviceFingerprint: text("device_fingerprint"),
});

export const insertSecuritySessionSchema = createInsertSchema(securitySessions).omit({
  id: true,
  loginTime: true,
  lastActivity: true,
});

export type InsertSecuritySession = z.infer<typeof insertSecuritySessionSchema>;
export type SecuritySession = typeof securitySessions.$inferSelect;

// Security alerts and notifications
export const securityAlerts = pgTable("security_alerts", {
  id: serial("id").primaryKey(),
  alertType: text("alert_type").notNull(), // suspicious_login, multiple_failures, admin_breach, etc.
  severity: text("severity").notNull(), // low, medium, high, critical
  title: text("title").notNull(),
  description: text("description").notNull(),
  source: text("source"), // system, user_report, automated_scan
  status: text("status").notNull().default("open"), // open, investigating, resolved, false_positive
  assignedTo: integer("assigned_to"), // Admin assigned to handle
  metadata: json("metadata"), // Additional alert context
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSecurityAlertSchema = createInsertSchema(securityAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSecurityAlert = z.infer<typeof insertSecurityAlertSchema>;
export type SecurityAlert = typeof securityAlerts.$inferSelect;

// Security scan results
export const securityScans = pgTable("security_scans", {
  id: serial("id").primaryKey(),
  scanType: text("scan_type").notNull(), // vulnerability, file_integrity, permission_audit, etc.
  status: text("status").notNull(), // running, completed, failed
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  results: json("results"), // Scan results and findings
  issuesFound: integer("issues_found").default(0),
  criticalIssues: integer("critical_issues").default(0),
  highIssues: integer("high_issues").default(0),
  mediumIssues: integer("medium_issues").default(0),
  lowIssues: integer("low_issues").default(0),
  initiatedBy: integer("initiated_by"), // Admin who started scan
  automated: boolean("automated").default(false), // Whether scan was automated
});

export const insertSecurityScanSchema = createInsertSchema(securityScans).omit({
  id: true,
  startedAt: true,
});

export type InsertSecurityScan = z.infer<typeof insertSecurityScanSchema>;
export type SecurityScan = typeof securityScans.$inferSelect;