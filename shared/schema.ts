import { pgTable, text, serial, timestamp, decimal, boolean, integer, json, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";
import { customers, insertCustomerSchema, type InsertCustomer, type Customer } from "./customer-schema";

// =============================================================================
// MAIN CRM & ADMIN SYSTEM SCHEMA
// =============================================================================

// Import showcase and shop schemas
export * from "./showcase-schema";
export * from "./shop-schema";
export * from "./content-schema";
export * from "./security-schema";
export * from "./ticketing-schema";
export * from "./cart-schema";
export * from "./logistics-schema";

// =============================================================================
// SEO MANAGEMENT SCHEMA
// =============================================================================

// SEO Settings table for managing site-wide and page-specific SEO
export const seoSettings = pgTable("seo_settings", {
  id: serial("id").primaryKey(),
  pageType: text("page_type").notNull(), // 'global', 'home', 'products', 'category', 'about', etc.
  pageIdentifier: text("page_identifier"), // category ID, product ID, or null for global
  language: text("language").notNull().default("fa"), // Language code: 'fa', 'en', 'ar', etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  keywords: text("keywords"), // comma-separated keywords
  ogTitle: text("og_title"), // Open Graph title
  ogDescription: text("og_description"), // Open Graph description
  ogImage: text("og_image"), // Open Graph image URL
  twitterTitle: text("twitter_title"),
  twitterDescription: text("twitter_description"),
  twitterImage: text("twitter_image"),
  canonicalUrl: text("canonical_url"),
  robots: text("robots").default("index,follow"), // robots meta tag
  schema: json("schema"), // JSON-LD structured data
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // for ordering/priority
  hreflangUrl: text("hreflang_url"), // URL for hreflang alternate
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// SEO Analytics table for tracking performance
export const seoAnalytics = pgTable("seo_analytics", {
  id: serial("id").primaryKey(),
  seoSettingId: integer("seo_setting_id").notNull().references(() => seoSettings.id),
  pageUrl: text("page_url").notNull(),
  language: text("language").notNull().default("fa"), // Language code for analytics
  country: text("country"), // Country code for geo-targeting
  device: text("device").default("desktop"), // desktop, mobile, tablet
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  position: decimal("position", { precision: 10, scale: 2 }),
  ctr: decimal("ctr", { precision: 5, scale: 4 }), // click-through rate
  dateRecorded: timestamp("date_recorded").notNull().defaultNow(),
  source: text("source").default("manual"), // 'google_search_console', 'manual', etc.
});

// Sitemap entries for XML sitemap generation
export const sitemapEntries = pgTable("sitemap_entries", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  language: text("language").notNull().default("fa"), // Language code
  priority: decimal("priority", { precision: 3, scale: 2 }).default("0.5"),
  changeFreq: text("change_freq").default("weekly"), // always, hourly, daily, weekly, monthly, yearly, never
  lastModified: timestamp("last_modified").notNull().defaultNow(),
  isActive: boolean("is_active").default(true),
  pageType: text("page_type"), // 'product', 'category', 'page', etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Languages table for managing supported languages
export const supportedLanguages = pgTable("supported_languages", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // 'fa', 'en', 'ar', etc.
  name: text("name").notNull(), // 'فارسی', 'English', 'العربية'
  nativeName: text("native_name").notNull(), // Native language name
  direction: text("direction").notNull().default("rtl"), // 'rtl' or 'ltr'
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // for ordering
  googleAnalyticsCode: text("google_analytics_code"), // GA tracking code for this language
  searchConsoleProperty: text("search_console_property"), // GSC property URL
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Multilingual keywords table for tracking different language keywords
export const multilingualKeywords = pgTable("multilingual_keywords", {
  id: serial("id").primaryKey(),
  seoSettingId: integer("seo_setting_id").notNull().references(() => seoSettings.id),
  keyword: text("keyword").notNull(),
  language: text("language").notNull(),
  searchVolume: integer("search_volume").default(0),
  difficulty: integer("difficulty").default(0), // 1-100 scale
  currentPosition: integer("current_position"),
  targetPosition: integer("target_position").default(1),
  isTracking: boolean("is_tracking").default(true),
  lastChecked: timestamp("last_checked"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Redirects table for managing URL redirects
export const redirects = pgTable("redirects", {
  id: serial("id").primaryKey(),
  fromUrl: text("from_url").notNull().unique(),
  toUrl: text("to_url").notNull(),
  statusCode: integer("status_code").default(301), // 301, 302, etc.
  isActive: boolean("is_active").default(true),
  hitCount: integer("hit_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

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
  department: text("department"), // 'financial', 'warehouse', 'logistics', 'super_admin'
  phone: text("phone"),
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  phoneVerified: boolean("phone_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Super Admin Verification Codes table
export const superAdminVerifications = pgTable("super_admin_verifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  phone: text("phone"),
  verificationCode: text("verification_code").notNull(),
  type: text("type").notNull(), // 'email', 'sms', 'password_reset'
  isUsed: boolean("is_used").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// TypeScript types for super admin verification
export type SuperAdminVerification = typeof superAdminVerifications.$inferSelect;
export type InsertSuperAdminVerification = typeof superAdminVerifications.$inferInsert;

// Department managers table - تعیین مدیر هر بخش توسط سوپر ادمین
export const departmentManagers = pgTable("department_managers", {
  id: serial("id").primaryKey(),
  department: text("department").notNull(), // 'financial', 'warehouse', 'logistics'
  managerId: integer("manager_id").notNull().references(() => users.id),
  assignedBy: integer("assigned_by").notNull().references(() => users.id), // سوپر ادمین که تعیین کرده
  isActive: boolean("is_active").default(true),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  deactivatedAt: timestamp("deactivated_at"),
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

export const insertDepartmentManagerSchema = createInsertSchema(departmentManagers).omit({
  id: true,
  assignedAt: true,
});

// Export types
export type InsertAdminRole = z.infer<typeof insertAdminRoleSchema>;
export type AdminRole = typeof adminRoles.$inferSelect;
export type InsertDepartmentManager = z.infer<typeof insertDepartmentManagerSchema>;
export type DepartmentManager = typeof departmentManagers.$inferSelect;
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



// =============================================================================
// SMS AUTHENTICATION SCHEMA
// =============================================================================

// SMS verification codes table
export const smsVerifications = pgTable("sms_verifications", {
  id: serial("id").primaryKey(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  purpose: text("purpose").notNull(), // 'login', 'registration', 'password_reset'
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  attempts: integer("attempts").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// SMS authentication settings
export const smsSettings = pgTable("sms_settings", {
  id: serial("id").primaryKey(),
  isEnabled: boolean("is_enabled").default(false), // Global SMS system toggle
  provider: text("provider").default("kavenegar"), // 'kavenegar', 'melipayamak', 'farapayamak', 'sms_ir', 'parsgreen'
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  username: text("username"), // Username for SMS provider
  password: text("password"), // Password for SMS provider  
  senderNumber: text("sender_number"),
  apiEndpoint: text("api_endpoint"), // Custom API endpoint URL
  serviceType: text("service_type").default("pattern"), // 'pattern', 'simple', 'otp'
  patternId: text("pattern_id"), // Pattern ID for template-based SMS
  codeLength: integer("code_length").default(6),
  codeExpiry: integer("code_expiry").default(300), // seconds (5 minutes)
  maxAttempts: integer("max_attempts").default(3),
  rateLimitMinutes: integer("rate_limit_minutes").default(60),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// SMS Template Categories
export const smsTemplateCategories = pgTable("sms_template_categories", {
  id: serial("id").primaryKey(),
  categoryNumber: integer("category_number").notNull().unique(), // Sequential numbering: 1, 2, 3...
  categoryName: text("category_name").notNull(),
  categoryDescription: text("category_description"),
  systemUsage: text("system_usage").notNull(), // 'temporary_orders', 'delivery_verification', 'customer_notification', etc.
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// SMS Templates with category assignment
export const smsTemplates = pgTable("sms_templates", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => smsTemplateCategories.id),
  templateNumber: integer("template_number").notNull(), // Sequential numbering within category: 1, 2, 3...
  templateName: text("template_name").notNull(),
  templateContent: text("template_content").notNull(),
  variables: json("variables"), // Available variables like {{customer_name}}, {{order_number}}
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Customer SMS preferences
export const customerSmsSettings = pgTable("customer_sms_settings", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  smsAuthEnabled: boolean("sms_auth_enabled").default(false),
  enabledBy: text("enabled_by"), // admin username who enabled it
  enabledAt: timestamp("enabled_at"),
  disabledBy: text("disabled_by"),
  disabledAt: timestamp("disabled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Create insert schemas for SMS tables
export const insertSmsVerificationSchema = createInsertSchema(smsVerifications).omit({
  id: true,
  createdAt: true,
});

export const insertSmsSettingsSchema = createInsertSchema(smsSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSmsSettingsSchema = createInsertSchema(customerSmsSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsTemplateCategorySchema = createInsertSchema(smsTemplateCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmsTemplateSchema = createInsertSchema(smsTemplates).omit({
  id: true,
  usageCount: true,
  lastUsed: true,
  createdAt: true,
  updatedAt: true,
});

// Export types
export type InsertSmsVerification = z.infer<typeof insertSmsVerificationSchema>;
export type SmsVerification = typeof smsVerifications.$inferSelect;
export type InsertSmsSettings = z.infer<typeof insertSmsSettingsSchema>;
export type SmsSettings = typeof smsSettings.$inferSelect;
export type InsertCustomerSmsSettings = z.infer<typeof insertCustomerSmsSettingsSchema>;
export type CustomerSmsSettings = typeof customerSmsSettings.$inferSelect;
export type InsertSmsTemplateCategory = z.infer<typeof insertSmsTemplateCategorySchema>;
export type SmsTemplateCategory = typeof smsTemplateCategories.$inferSelect;
export type InsertSmsTemplate = z.infer<typeof insertSmsTemplateSchema>;
export type SmsTemplate = typeof smsTemplates.$inferSelect;

// =============================================================================
// CUSTOM USER MANAGEMENT SYSTEM
// =============================================================================

// Custom roles table for user-defined roles
export const customRoles = pgTable('custom_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#3b82f6'),
  priority: integer('priority').notNull().default(1),
  permissions: text('permissions').array().notNull().default(sql`ARRAY[]::text[]`),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Custom users table for role-based users
export const customUsers = pgTable('custom_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  roleId: uuid('role_id').references(() => customRoles.id).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  smsNotifications: boolean('sms_notifications').notNull().default(true),
  emailNotifications: boolean('email_notifications').notNull().default(true),
  lastLogin: timestamp('last_login'),
  loginAttempts: integer('login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// SMS notifications log table
export const smsNotifications = pgTable('sms_notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  recipientId: uuid('recipient_id').references(() => customUsers.id).notNull(),
  recipientPhone: text('recipient_phone').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('pending'), // pending, sent, failed
  sentAt: timestamp('sent_at'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Create insert schemas for custom user management
export const insertCustomRoleSchema = createInsertSchema(customRoles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCustomUserSchema = createInsertSchema(customUsers).omit({
  id: true,
  passwordHash: true,
  lastLogin: true,
  loginAttempts: true,
  lockedUntil: true,
  createdAt: true,
  updatedAt: true
});

export const insertSmsNotificationSchema = createInsertSchema(smsNotifications).omit({
  id: true,
  sentAt: true,
  createdAt: true
});

// Export types for custom user management
export type InsertCustomRole = z.infer<typeof insertCustomRoleSchema>;
export type CustomRole = typeof customRoles.$inferSelect;
export type InsertCustomUser = z.infer<typeof insertCustomUserSchema>;
export type CustomUser = typeof customUsers.$inferSelect;
export type InsertSmsNotification = z.infer<typeof insertSmsNotificationSchema>;
export type SmsNotification = typeof smsNotifications.$inferSelect;

// =============================================================================
// CRM CUSTOMERS SCHEMA - Main Customer Management
// =============================================================================

// CRM Customers table - comprehensive customer data with authentication
export const crmCustomers = pgTable("crm_customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"), // For unified authentication
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  phone: text("phone"),
  alternatePhone: text("alternate_phone"),
  country: text("country"),
  state: text("state"),
  city: text("city"),
  address: text("address"),
  secondaryAddress: text("secondary_address"),
  postalCode: text("postal_code"),
  industry: text("industry"),
  businessType: text("business_type"), // manufacturer, distributor, retailer, end_user
  companySize: text("company_size"), // small, medium, large, enterprise
  annualRevenue: text("annual_revenue"),
  customerType: text("customer_type").notNull().default("retail"), // retail, wholesale, b2b, distributor
  customerStatus: text("customer_status").notNull().default("active"), // active, inactive, vip, blacklisted
  customerSource: text("customer_source").notNull().default("website"), // website, referral, marketing, cold_call, trade_show
  assignedSalesRep: text("assigned_sales_rep"),
  
  // Purchase analytics (auto-calculated)
  totalOrdersCount: integer("total_orders_count").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0"),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).default("0"),
  lastOrderDate: timestamp("last_order_date"),
  firstOrderDate: timestamp("first_order_date"),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  
  // Communication preferences
  communicationPreference: text("communication_preference").default("email"), // email, phone, sms, whatsapp
  preferredLanguage: text("preferred_language").default("fa"), // fa (Persian), en (English), ar (Arabic), ku (Kurdish), tr (Turkish)
  marketingConsent: boolean("marketing_consent").default(false),
  smsEnabled: boolean("sms_enabled").default(true), // Individual SMS setting for this customer
  productInterests: json("product_interests"), // Array of product categories
  priceRange: text("price_range"),
  orderFrequency: text("order_frequency"),
  
  // Credit and payment
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }),
  paymentTerms: text("payment_terms").default("immediate"), // immediate, net_30, net_60, net_90
  preferredPaymentMethod: text("preferred_payment_method"),
  creditStatus: text("credit_status").default("good"), // good, fair, poor, blocked
  
  // Internal management
  tags: json("tags"), // Array of custom tags
  internalNotes: text("internal_notes"),
  publicNotes: text("public_notes"), // Notes visible to customer
  
  // System fields
  isActive: boolean("is_active").default(true),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: text("created_by"),
});

export const insertCrmCustomerSchema = createInsertSchema(crmCustomers).omit({
  id: true,
  totalOrdersCount: true,
  totalSpent: true,
  averageOrderValue: true,
  lastOrderDate: true,
  firstOrderDate: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCrmCustomer = z.infer<typeof insertCrmCustomerSchema>;
export type CrmCustomer = typeof crmCustomers.$inferSelect;

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

// =============================================================================
// INVENTORY THRESHOLD SETTINGS SCHEMA
// =============================================================================

// Inventory threshold settings for alert management
export const inventoryThresholdSettings = pgTable("inventory_threshold_settings", {
  id: serial("id").primaryKey(),
  settingName: text("setting_name").notNull().unique(), // 'global_default', 'category_specific', etc.
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10), // First warning level
  warningStockLevel: integer("warning_stock_level").notNull().default(5), // Critical warning level
  
  // Notification settings
  emailEnabled: boolean("email_enabled").default(true),
  smsEnabled: boolean("sms_enabled").default(true),
  
  // Manager contact information
  managerEmail: text("manager_email").notNull().default("manager@momtazchem.com"),
  managerPhone: text("manager_phone").notNull().default("+9647700000000"),
  managerName: text("manager_name").notNull().default("مدیر انبار"),
  
  // Alert frequency settings
  lowStockAlertSent: boolean("low_stock_alert_sent").default(false),
  warningAlertSent: boolean("warning_alert_sent").default(false),
  lastLowStockAlert: timestamp("last_low_stock_alert"),
  lastWarningAlert: timestamp("last_warning_alert"),
  
  // Additional settings
  checkFrequency: integer("check_frequency").default(60), // Check every N minutes
  businessHoursOnly: boolean("business_hours_only").default(true),
  weekendsEnabled: boolean("weekends_enabled").default(false),
  
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInventoryThresholdSettingsSchema = createInsertSchema(inventoryThresholdSettings).omit({
  id: true,
  lowStockAlertSent: true,
  warningAlertSent: true,
  lastLowStockAlert: true,
  lastWarningAlert: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInventoryThresholdSettings = z.infer<typeof insertInventoryThresholdSettingsSchema>;
export type InventoryThresholdSettings = typeof inventoryThresholdSettings.$inferSelect;

// Inventory alert log for tracking sent notifications
export const inventoryAlertLog = pgTable("inventory_alert_log", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  alertType: text("alert_type").notNull(), // 'low_stock', 'warning_level'
  currentStock: integer("current_stock").notNull(),
  thresholdValue: integer("threshold_value").notNull(),
  
  // Notification details
  emailSent: boolean("email_sent").default(false),
  smsSent: boolean("sms_sent").default(false),
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),
  
  // Message content
  emailContent: text("email_content"),
  smsContent: text("sms_content"),
  
  // Delivery status
  emailDelivered: boolean("email_delivered").default(false),
  smsDelivered: boolean("sms_delivered").default(false),
  deliveryErrors: text("delivery_errors"),
  
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInventoryAlertLogSchema = createInsertSchema(inventoryAlertLog).omit({
  id: true,
  createdAt: true,
});

export type InsertInventoryAlertLog = z.infer<typeof insertInventoryAlertLogSchema>;
export type InventoryAlertLog = typeof inventoryAlertLog.$inferSelect;

// Dashboard widget usage tracking
export const dashboardWidgets = pgTable("dashboard_widgets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // sales_overview, recent_orders, customer_analytics, etc.
  displayName: text("display_name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // analytics, sales, customers, inventory, system
  iconName: text("icon_name").default("BarChart3"), // Lucide icon name
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0), // Higher = more important
  minUserLevel: text("min_user_level").default("admin"), // admin, super_admin
  dependencies: json("dependencies"), // Array of required features/permissions
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDashboardWidgetSchema = createInsertSchema(dashboardWidgets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDashboardWidget = z.infer<typeof insertDashboardWidgetSchema>;
export type DashboardWidget = typeof dashboardWidgets.$inferSelect;

// User widget preferences and usage tracking
export const userWidgetPreferences = pgTable("user_widget_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  widgetId: integer("widget_id").notNull(),
  isVisible: boolean("is_visible").default(true),
  position: integer("position").default(0), // Dashboard position
  size: text("size").default("medium"), // small, medium, large
  customSettings: json("custom_settings"), // Widget-specific configuration
  lastViewed: timestamp("last_viewed"),
  viewCount: integer("view_count").default(0),
  clickCount: integer("click_count").default(0),
  timeSpent: integer("time_spent").default(0), // Total seconds spent viewing
  isStarred: boolean("is_starred").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserWidgetPreferenceSchema = createInsertSchema(userWidgetPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUserWidgetPreference = z.infer<typeof insertUserWidgetPreferenceSchema>;
export type UserWidgetPreference = typeof userWidgetPreferences.$inferSelect;

// Widget usage analytics
export const widgetUsageAnalytics = pgTable("widget_usage_analytics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  widgetId: integer("widget_id").notNull(),
  action: text("action").notNull(), // view, click, interact, configure, hide, show
  sessionId: text("session_id"),
  duration: integer("duration"), // Seconds spent on action
  metadata: json("metadata"), // Additional context about the action
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
});

export const insertWidgetUsageAnalyticsSchema = createInsertSchema(widgetUsageAnalytics).omit({
  id: true,
  timestamp: true,
});

export type InsertWidgetUsageAnalytics = z.infer<typeof insertWidgetUsageAnalyticsSchema>;
export type WidgetUsageAnalytics = typeof widgetUsageAnalytics.$inferSelect;

// Widget recommendations based on user behavior
export const widgetRecommendations = pgTable("widget_recommendations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  widgetId: integer("widget_id").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(), // Recommendation strength 0-100
  reason: text("reason").notNull(), // similar_users, usage_pattern, role_based, trending
  explanation: text("explanation"), // Human-readable explanation
  isAccepted: boolean("is_accepted"),
  isDismissed: boolean("is_dismissed").default(false),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  metadata: json("metadata"), // Additional recommendation context
});

export const insertWidgetRecommendationSchema = createInsertSchema(widgetRecommendations).omit({
  id: true,
  generatedAt: true,
});

export type InsertWidgetRecommendation = z.infer<typeof insertWidgetRecommendationSchema>;
export type WidgetRecommendation = typeof widgetRecommendations.$inferSelect;

// =============================================================================
// SEO SCHEMA TYPES AND VALIDATION
// =============================================================================

export const insertSeoSettingSchema = createInsertSchema(seoSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSeoAnalyticsSchema = createInsertSchema(seoAnalytics).omit({
  id: true,
  dateRecorded: true,
});

export const insertSitemapEntrySchema = createInsertSchema(sitemapEntries).omit({
  id: true,
  createdAt: true,
});

export const insertRedirectSchema = createInsertSchema(redirects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  hitCount: true,
});

export const insertSupportedLanguageSchema = createInsertSchema(supportedLanguages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMultilingualKeywordSchema = createInsertSchema(multilingualKeywords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSeoSetting = z.infer<typeof insertSeoSettingSchema>;
export type SeoSetting = typeof seoSettings.$inferSelect;

export type InsertSeoAnalytics = z.infer<typeof insertSeoAnalyticsSchema>;
export type SeoAnalytics = typeof seoAnalytics.$inferSelect;

export type InsertSitemapEntry = z.infer<typeof insertSitemapEntrySchema>;
export type SitemapEntry = typeof sitemapEntries.$inferSelect;

export type InsertRedirect = z.infer<typeof insertRedirectSchema>;
export type Redirect = typeof redirects.$inferSelect;

export type InsertSupportedLanguage = z.infer<typeof insertSupportedLanguageSchema>;
export type SupportedLanguage = typeof supportedLanguages.$inferSelect;

export type InsertMultilingualKeyword = z.infer<typeof insertMultilingualKeywordSchema>;
export type MultilingualKeyword = typeof multilingualKeywords.$inferSelect;

// SMS Logs table for tracking all SMS communications
export const smsLogs = pgTable("sms_logs", {
  id: serial("id").primaryKey(),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  message: text("message").notNull(),
  purpose: varchar("purpose", { length: 50 }).notNull(), // verification, delivery_notification, marketing, etc.
  status: varchar("status", { length: 20 }).notNull().default("sent"), // sent, failed, pending
  relatedOrderId: integer("related_order_id"),
  deliveryCode: varchar("delivery_code", { length: 20 }),
  sentBy: varchar("sent_by", { length: 50 }).default("system"),
  smsProvider: varchar("sms_provider", { length: 50 }).default("console"), // can be twilio, aws_sns, etc.
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSmsLogSchema = createInsertSchema(smsLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertSmsLog = z.infer<typeof insertSmsLogSchema>;
export type SmsLog = typeof smsLogs.$inferSelect;

// =============================================================================
// ROLE-BASED ACCESS CONTROL SCHEMA
// =============================================================================

// Module permissions table
export const modulePermissions = pgTable("module_permissions", {
  id: serial("id").primaryKey(),
  roleId: varchar("role_id", { length: 50 }).notNull(),
  moduleId: varchar("module_id", { length: 50 }).notNull(),
  canView: boolean("can_view").default(true),
  canCreate: boolean("can_create").default(false),
  canEdit: boolean("can_edit").default(false),
  canDelete: boolean("can_delete").default(false),
  canApprove: boolean("can_approve").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User role assignments table
export const userRoleAssignments = pgTable("user_role_assignments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 50 }).notNull(),
  roleId: varchar("role_id", { length: 50 }).notNull(),
  assignedBy: varchar("assigned_by", { length: 50 }).notNull(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  isActive: boolean("is_active").default(true),
});

export const insertModulePermissionSchema = createInsertSchema(modulePermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserRoleAssignmentSchema = createInsertSchema(userRoleAssignments).omit({
  id: true,
  assignedAt: true,
});

export type InsertModulePermission = z.infer<typeof insertModulePermissionSchema>;
export type ModulePermission = typeof modulePermissions.$inferSelect;

export type InsertUserRoleAssignment = z.infer<typeof insertUserRoleAssignmentSchema>;
export type UserRoleAssignment = typeof userRoleAssignments.$inferSelect;

// =============================================================================
// SIMPLE SMS TEMPLATES SCHEMA
// =============================================================================

// Simple SMS templates table without categories
export const simpleSmsTemplates = pgTable("simple_sms_templates", {
  id: serial("id").primaryKey(),
  templateName: varchar("template_name", { length: 255 }).notNull(),
  templateContent: text("template_content").notNull(),
  variables: text("variables").array(),
  usageConditions: text("usage_conditions"), // شرایط استفاده قابل تغییر توسط مدیر
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  createdBy: varchar("created_by", { length: 100 }).default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSimpleSmsTemplateSchema = createInsertSchema(simpleSmsTemplates).omit({
  id: true,
  usageCount: true,
  lastUsed: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSimpleSmsTemplate = z.infer<typeof insertSimpleSmsTemplateSchema>;
export type SimpleSmsTemplate = typeof simpleSmsTemplates.$inferSelect;
