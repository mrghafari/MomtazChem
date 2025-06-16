import { pgTable, text, serial, timestamp, decimal, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// MAIN CRM & ADMIN SYSTEM SCHEMA
// =============================================================================

// Import showcase and shop schemas
export * from "./showcase-schema";
export * from "./shop-schema";
export * from "./correspondence-schema";

// Admin roles table
export const adminRoles = pgTable("admin_roles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // super_admin, products_admin, crm_admin, etc.
  displayName: text("display_name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Admin permissions table
export const adminPermissions = pgTable("admin_permissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // manage_products, view_analytics, etc.
  displayName: text("display_name").notNull(),
  description: text("description"),
  module: text("module").notNull(), // products, crm, shop, analytics, users, etc.
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Role permissions junction table
export const rolePermissions = pgTable("role_permissions", {
  id: serial("id").primaryKey(),
  roleId: integer("role_id").notNull().references(() => adminRoles.id),
  permissionId: integer("permission_id").notNull().references(() => adminPermissions.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Users table for admin authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  roleId: integer("role_id").references(() => adminRoles.id),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Password reset tokens table
export const passwordResets = pgTable("password_resets", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Create insert schemas for new tables
export const insertAdminRoleSchema = createInsertSchema(adminRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminPermissionSchema = createInsertSchema(adminPermissions).omit({
  id: true,
  createdAt: true,
});

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertPasswordResetSchema = createInsertSchema(passwordResets).omit({
  id: true,
  createdAt: true,
});

// Export types
export type InsertAdminRole = z.infer<typeof insertAdminRoleSchema>;
export type AdminRole = typeof adminRoles.$inferSelect;
export type InsertAdminPermission = z.infer<typeof insertAdminPermissionSchema>;
export type AdminPermission = typeof adminPermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPasswordReset = z.infer<typeof insertPasswordResetSchema>;
export type PasswordReset = typeof passwordResets.$inferSelect;

// =============================================================================
// BARCODE & INVENTORY TRACKING SYSTEM
// =============================================================================

// Inventory transactions for tracking stock movements
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  transactionType: text("transaction_type").notNull(), // "in", "out", "adjustment", "transfer"
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  reason: text("reason"), // "purchase", "sale", "return", "damage", "audit", etc.
  reference: text("reference"), // Order ID, PO number, etc.
  notes: text("notes"),
  scannedBarcode: text("scanned_barcode"), // Barcode used for this transaction
  userId: integer("user_id"), // Who performed the transaction
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Barcode scan log for tracking all scanning activities
export const barcodeScanLog = pgTable("barcode_scan_log", {
  id: serial("id").primaryKey(),
  barcode: text("barcode").notNull(),
  scanType: text("scan_type").notNull(), // "product_lookup", "inventory_in", "inventory_out", "audit"
  productId: integer("product_id"),
  scanResult: text("scan_result").notNull(), // "success", "not_found", "error"
  userId: integer("user_id"),
  location: text("location"), // Warehouse location or device location
  additionalData: json("additional_data"), // Extra scan data
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Barcode generation settings and templates
export const barcodeSettings = pgTable("barcode_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertBarcodeScanLogSchema = createInsertSchema(barcodeScanLog).omit({
  id: true,
  createdAt: true,
});

export const insertBarcodeSettingsSchema = createInsertSchema(barcodeSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InsertBarcodeScanLog = z.infer<typeof insertBarcodeScanLogSchema>;
export type BarcodeScanLog = typeof barcodeScanLog.$inferSelect;
export type InsertBarcodeSettings = z.infer<typeof insertBarcodeSettingsSchema>;
export type BarcodeSettings = typeof barcodeSettings.$inferSelect;

// Online Specialists table for live chat management
export const specialists = pgTable("specialists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  department: text("department").notNull(),
  status: text("status").notNull().default("offline"), // online, busy, away, offline
  expertise: json("expertise").$type<string[]>().default([]),
  isActive: boolean("is_active").default(true),
  workingHours: json("working_hours").$type<{
    start: string;
    end: string;
    days: string[];
  }>().default({
    start: "08:00",
    end: "17:00",
    days: ["saturday", "sunday", "monday", "tuesday", "wednesday"]
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSpecialistSchema = createInsertSchema(specialists).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertSpecialist = z.infer<typeof insertSpecialistSchema>;
export type Specialist = typeof specialists.$inferSelect;

// Specialist correspondence storage for one month retention
export const specialistCorrespondence = pgTable("specialist_correspondence", {
  id: serial("id").primaryKey(),
  specialistId: text("specialist_id").notNull().references(() => specialists.id),
  customerId: integer("customer_id"), // Optional: link to customer if applicable
  customerEmail: text("customer_email"),
  customerName: text("customer_name"),
  messageType: text("message_type").notNull(), // "incoming", "outgoing", "internal_note"
  subject: text("subject"),
  messageContent: text("message_content").notNull(),
  channel: text("channel").notNull(), // "email", "chat", "phone", "internal"
  priority: text("priority").default("normal"), // "low", "normal", "high", "urgent"
  status: text("status").default("active"), // "active", "resolved", "archived"
  tags: json("tags").$type<string[]>().default([]),
  attachments: json("attachments").$type<string[]>().default([]),
  responseTime: integer("response_time"), // Response time in minutes
  followUpRequired: boolean("follow_up_required").default(false),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Correspondence threads for tracking conversation chains
export const correspondenceThreads = pgTable("correspondence_threads", {
  id: serial("id").primaryKey(),
  threadId: text("thread_id").notNull().unique(),
  specialistId: text("specialist_id").notNull().references(() => specialists.id),
  customerIdentifier: text("customer_identifier"), // Email or customer ID
  subject: text("subject").notNull(),
  status: text("status").default("open"), // "open", "closed", "pending"
  priority: text("priority").default("normal"),
  messageCount: integer("message_count").default(0),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

export const insertSpecialistCorrespondenceSchema = createInsertSchema(specialistCorrespondence).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  expiresAt: true,
});

export const insertCorrespondenceThreadSchema = createInsertSchema(correspondenceThreads).omit({
  id: true,
  createdAt: true,
  expiresAt: true,
});

export type InsertSpecialistCorrespondence = z.infer<typeof insertSpecialistCorrespondenceSchema>;
export type SpecialistCorrespondence = typeof specialistCorrespondence.$inferSelect;
export type InsertCorrespondenceThread = z.infer<typeof insertCorrespondenceThreadSchema>;
export type CorrespondenceThread = typeof correspondenceThreads.$inferSelect;

// Specialist chat sessions for real-time conversation management
export const specialistChatSessions = pgTable("specialist_chat_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  specialistId: text("specialist_id").notNull().references(() => specialists.id),
  customerPhone: text("customer_phone").notNull(),
  customerName: text("customer_name").notNull(),
  status: text("status").notNull().default("active"), // "active", "completed", "abandoned"
  startedAt: timestamp("started_at").notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
  messageCount: integer("message_count").default(0),
  isSpecialistTyping: boolean("is_specialist_typing").default(false),
  isCustomerTyping: boolean("is_customer_typing").default(false),
  customerRating: integer("customer_rating"), // 1-5 rating after session
  sessionNotes: text("session_notes"),
  tags: json("tags").$type<string[]>().default([]),
  expiresAt: timestamp("expires_at").notNull(), // Auto-cleanup after 30 days
});

// Chat messages for specialist sessions
export const specialistChatMessages = pgTable("specialist_chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => specialistChatSessions.sessionId),
  sender: text("sender").notNull(), // "specialist", "customer"
  message: text("message").notNull(),
  messageType: text("message_type").default("text"), // "text", "image", "file", "system"
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at"),
  attachments: json("attachments").$type<string[]>().default([]),
  metadata: json("metadata"), // Additional message data
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertSpecialistChatSessionSchema = createInsertSchema(specialistChatSessions).omit({
  id: true,
  startedAt: true,
  lastMessageAt: true,
  expiresAt: true,
});

export const insertSpecialistChatMessageSchema = createInsertSchema(specialistChatMessages).omit({
  id: true,
  timestamp: true,
});

export type InsertSpecialistChatSession = z.infer<typeof insertSpecialistChatSessionSchema>;
export type SpecialistChatSession = typeof specialistChatSessions.$inferSelect;
export type InsertSpecialistChatMessage = z.infer<typeof insertSpecialistChatMessageSchema>;
export type SpecialistChatMessage = typeof specialistChatMessages.$inferSelect;

// Leads table for CRM system
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  company: text("company"),
  jobTitle: text("job_title"),
  industry: text("industry"),
  country: text("country"),
  city: text("city"),
  leadSource: text("lead_source").notNull(), // contact_form, website, email, phone, referral
  status: text("status").notNull().default("new"), // new, contacted, qualified, proposal, negotiation, closed_won, closed_lost
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  productInterest: text("product_interest"), // Which product category they're interested in
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  probability: integer("probability").default(25), // Percentage chance of closing
  expectedCloseDate: timestamp("expected_close_date"),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  notes: text("notes"),
  assignedTo: integer("assigned_to"), // User ID of assigned sales rep
  tags: json("tags"), // Array of tags for categorization
  customFields: json("custom_fields"), // Additional custom data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

// Lead activities table for tracking interactions
export const leadActivities = pgTable("lead_activities", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull(),
  activityType: text("activity_type").notNull(), // call, email, meeting, note, status_change
  subject: text("subject").notNull(),
  description: text("description"),
  contactMethod: text("contact_method"), // phone, email, in_person, video_call
  outcome: text("outcome"), // positive, negative, neutral, no_response
  duration: integer("duration"), // Duration in minutes
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at"),
  createdBy: integer("created_by"), // User ID who created the activity
  attachments: json("attachments"), // Array of file paths/URLs
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLeadActivitySchema = createInsertSchema(leadActivities).omit({
  id: true,
  createdAt: true,
});

export type InsertLeadActivity = z.infer<typeof insertLeadActivitySchema>;
export type LeadActivity = typeof leadActivities.$inferSelect;
