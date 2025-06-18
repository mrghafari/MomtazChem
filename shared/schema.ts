import { pgTable, text, serial, timestamp, decimal, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// MAIN CRM & ADMIN SYSTEM SCHEMA
// =============================================================================

// Import showcase and shop schemas
export * from "./showcase-schema";
export * from "./shop-schema";

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
