import { pgTable, text, serial, timestamp, decimal, boolean, integer, json, varchar, uuid, date } from "drizzle-orm/pg-core";
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
// ABANDONED ORDERS TRACKING SYSTEM
// =============================================================================

// Abandoned Orders table for tracking incomplete orders that customers started but didn't complete
export const abandonedOrders = pgTable("abandoned_orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"), // Customer who started the order
  customerEmail: text("customer_email"), // Customer email for follow-up
  customerName: text("customer_name"), // Customer name
  customerPhone: text("customer_phone"), // Customer phone
  cartData: json("cart_data").notNull(), // Cart contents when abandoned
  shippingData: json("shipping_data"), // Shipping information if entered
  paymentData: json("payment_data"), // Payment method if selected
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }), // Order total
  currency: text("currency").default("IQD"),
  checkoutStep: text("checkout_step").notNull(), // cart, shipping, payment, review, hybrid_payment_pending
  sessionId: varchar("session_id", { length: 255 }), // Session identifier
  ipAddress: varchar("ip_address", { length: 45 }), // Client IP address
  userAgent: text("user_agent"), // Browser/client information
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  isRecovered: boolean("is_recovered").default(false), // Whether customer came back to complete
  recoveredOrderId: integer("recovered_order_id"), // Reference to completed order if recovered
  walletAmountUsed: decimal("wallet_amount_used", { precision: 10, scale: 2 }), // Amount paid via wallet
  bankAmountPending: decimal("bank_amount_pending", { precision: 10, scale: 2 }), // Amount pending from bank gateway
  hybridOrderNumber: text("hybrid_order_number"), // Order number for hybrid payments
  remindersSent: integer("reminders_sent").default(0), // Number of reminder emails sent
  lastReminderAt: timestamp("last_reminder_at"), // When last reminder was sent
  notes: text("notes"), // Admin notes
});

export const insertAbandonedOrderSchema = createInsertSchema(abandonedOrders);
export type InsertAbandonedOrder = z.infer<typeof insertAbandonedOrderSchema>;
export type AbandonedOrder = typeof abandonedOrders.$inferSelect;

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

// Company Information table for business details
export const companyInformation = pgTable("company_information", {
  id: serial("id").primaryKey(),
  companyNameEn: text("company_name_en"),
  companyNameAr: text("company_name_ar"),
  companyNameTr: text("company_name_tr"),
  companyNameKu: text("company_name_ku"),
  tradeName: text("trade_name"),
  registrationNumber: text("registration_number"),
  taxNumber: text("tax_number"),
  legalForm: text("legal_form"),
  establishedDate: date("established_date"),
  capitalAmount: decimal("capital_amount"),
  capitalCurrency: text("capital_currency"),
  numberOfEmployees: integer("number_of_employees"),
  annualRevenue: decimal("annual_revenue"),
  businessSector: text("business_sector"),
  businessDescription: text("business_description"),
  mainAddress: text("main_address"),
  mailingAddress: text("mailing_address"),
  province: text("province"),
  city: text("city"),
  country: text("country").default("عراق"),
  postalCode: text("postal_code"),
  phonePrimary: text("phone_primary"),
  phoneSecondary: text("phone_secondary"),
  fax: text("fax"),
  emailPrimary: text("email_primary"),
  emailSecondary: text("email_secondary"),
  websiteUrl: text("website_url"),
  licenseNumber: text("license_number"),
  licenseType: text("license_type"),
  licenseAuthority: text("license_authority"),
  licenseExpiryDate: date("license_expiry_date"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  bankAccountHolder: text("bank_account_holder"),
  bankIban: text("bank_iban"),
  bankSwift: text("bank_swift"),
  contactPersonName: text("contact_person_name"),
  contactPersonTitle: text("contact_person_title"),
  contactPersonPhone: text("contact_person_phone"),
  contactPersonEmail: text("contact_person_email"),
  parentCompany: text("parent_company"),
  subsidiaries: text("subsidiaries"),
  branches: text("branches"),
  partnerships: text("partnerships"),
  certifications: text("certifications"),
  awards: text("awards"),
  socialLinkedin: text("social_linkedin"),
  socialFacebook: text("social_facebook"),
  socialTwitter: text("social_twitter"),
  socialInstagram: text("social_instagram"),
  logoUrl: text("logo_url"),
  companySealUrl: text("company_seal_url"),
  letterheadUrl: text("letterhead_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Correspondence management for incoming and outgoing mail
export const correspondence = pgTable("correspondence", {
  id: serial("id").primaryKey(),
  referenceNumber: text("reference_number").notNull().unique(),
  type: text("type").notNull(), // 'incoming' or 'outgoing'
  subject: text("subject").notNull(),
  senderName: text("sender_name"),
  recipientName: text("recipient_name"),
  senderOrganization: text("sender_organization"),
  recipientOrganization: text("recipient_organization"),
  senderEmail: text("sender_email"),
  recipientEmail: text("recipient_email"),
  dateReceived: timestamp("date_received"),
  dateSent: timestamp("date_sent"),
  priority: text("priority").notNull().default("medium"), // 'high', 'medium', 'low'
  status: text("status").notNull().default("pending"), // 'pending', 'in_progress', 'completed', 'archived'
  category: text("category").notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  notes: text("notes"),
  tags: text("tags"),
  createdBy: integer("created_by"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Company documents management
export const companyDocuments = pgTable("company_documents", {
  id: serial("id").primaryKey(),
  documentName: text("document_name").notNull(),
  documentType: text("document_type").notNull(), // 'license', 'certificate', 'permit', 'contract', 'other'
  documentNumber: text("document_number").notNull(),
  issueDate: timestamp("issue_date").notNull(),
  expiryDate: timestamp("expiry_date"),
  issuingAuthority: text("issuing_authority").notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status").notNull().default("active"), // 'active', 'expired', 'renewed', 'cancelled'
  description: text("description"),
  tags: text("tags"),
  reminderDays: integer("reminder_days").default(30), // Days before expiry to remind
  uploadedBy: integer("uploaded_by"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Business cards management
export const businessCards = pgTable("business_cards", {
  id: serial("id").primaryKey(),
  employeeName: text("employee_name").notNull(),
  employeeNameArabic: text("employee_name_arabic"),
  employeeNameKurdish: text("employee_name_kurdish"),
  jobTitle: text("job_title").notNull(),
  jobTitleArabic: text("job_title_arabic"),
  jobTitleKurdish: text("job_title_kurdish"),
  department: text("department"),
  directPhone: text("direct_phone"),
  mobilePhone: text("mobile_phone"),
  email: text("email"),
  officeLocation: text("office_location"),
  linkedinProfile: text("linkedin_profile"),
  whatsappNumber: text("whatsapp_number"),
  cardDesign: text("card_design").notNull().default("standard"), // 'standard', 'executive', 'creative'
  cardColor: text("card_color").notNull().default("#1e40af"),
  includeQrCode: boolean("include_qr_code").default(false),
  qrCodeData: text("qr_code_data"),
  specialNotes: text("special_notes"),
  isActive: boolean("is_active").default(true),
  printQuantity: integer("print_quantity").default(50),
  lastPrintDate: timestamp("last_print_date"),
  cardStatus: text("card_status").notNull().default("draft"), // 'draft', 'approved', 'printed', 'distributed'
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Company images and media management
export const companyImages = pgTable("company_images", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url").notNull(),
  category: text("category").notNull(), // 'logo', 'office', 'products', 'team', 'events', 'certificates', 'other'
  tags: text("tags"),
  fileSize: integer("file_size"), // in bytes
  dimensions: text("dimensions"), // width x height
  mimeType: text("mime_type"),
  isActive: boolean("is_active").default(true),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  uploadedBy: integer("uploaded_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod schemas for all company information tables
export const insertCorrespondenceSchema = createInsertSchema(correspondence);
export const insertCompanyDocumentsSchema = createInsertSchema(companyDocuments);
export const insertBusinessCardsSchema = createInsertSchema(businessCards);
export const insertCompanyImagesSchema = createInsertSchema(companyImages);

// Type exports
export type Correspondence = typeof correspondence.$inferSelect;
export type InsertCorrespondence = typeof correspondence.$inferInsert;
export type CompanyDocument = typeof companyDocuments.$inferSelect;
export type InsertCompanyDocument = typeof companyDocuments.$inferInsert;
export type BusinessCard = typeof businessCards.$inferSelect;
export type InsertBusinessCard = typeof businessCards.$inferInsert;
export type CompanyImage = typeof companyImages.$inferSelect;
export type InsertCompanyImage = typeof companyImages.$inferInsert;

// Tax settings for invoices and financial documents
export const taxSettings = pgTable("tax_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "VAT", "Added Value Duties"
  type: text("type").notNull(), // 'vat' or 'duties'
  rate: decimal("rate", { precision: 5, scale: 4 }).notNull().default("0.0500"), // 5% as 0.0500
  isEnabled: boolean("is_enabled").default(true),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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
  provider: text("provider").default("asiacell"), // 'asiacell', 'zain_iraq', 'korek_telecom', 'twilio', 'plivo', 'infobip', 'msg91', 'custom'
  customProviderName: text("custom_provider_name"), // Name for custom SMS provider
  
  // Authentication credentials
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  username: text("username"), // Username for SMS provider
  password: text("password"), // Password for SMS provider  
  accessToken: text("access_token"), // OAuth token or JWT token
  clientId: text("client_id"), // OAuth client ID
  clientSecret: text("client_secret"), // OAuth client secret
  
  // Provider configuration
  senderNumber: text("sender_number"),
  senderId: text("sender_id"), // Sender ID for some providers
  apiEndpoint: text("api_endpoint"), // Custom API endpoint URL
  baseUrl: text("base_url"), // Base URL for API requests
  serviceType: text("service_type").default("pattern"), // 'pattern', 'simple', 'otp'
  patternId: text("pattern_id"), // Pattern ID for template-based SMS
  templateId: text("template_id"), // Template ID for some providers
  serviceCode: text("service_code"), // Service code for SMS providers
  applicationId: text("application_id"), // Application ID for some providers
  
  // Additional provider-specific fields
  countryCode: text("country_code"), // Country code prefix
  encoding: text("encoding").default("UTF-8"), // Message encoding
  messageType: text("message_type").default("TEXT"), // TEXT, UNICODE, BINARY
  priority: text("priority").default("NORMAL"), // LOW, NORMAL, HIGH, URGENT
  validityPeriod: integer("validity_period").default(1440), // Message validity in minutes
  
  // Security and validation
  webhookUrl: text("webhook_url"), // Webhook for delivery reports
  webhookSecret: text("webhook_secret"), // Secret for webhook validation
  ipWhitelist: json("ip_whitelist"), // Array of allowed IP addresses
  
  // Rate limiting and quotas
  dailyLimit: integer("daily_limit").default(1000), // Daily SMS limit
  monthlyLimit: integer("monthly_limit").default(30000), // Monthly SMS limit
  rateLimitPerMinute: integer("rate_limit_per_minute").default(10), // Messages per minute
  
  // Message configuration
  codeLength: integer("code_length").default(6),
  codeExpiry: integer("code_expiry").default(300), // seconds (5 minutes)
  maxAttempts: integer("max_attempts").default(3),
  rateLimitMinutes: integer("rate_limit_minutes").default(60),
  
  // System fields
  isTestMode: boolean("is_test_mode").default(true), // Test mode toggle
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
  province: text("province"), // State/Province field
  cityRegion: text("city_region"), // شهر/منطقه
  address: text("address"),
  secondaryAddress: text("secondary_address"),
  postalCode: text("postal_code"),
  industry: text("industry"),
  businessType: text("business_type"), // manufacturer, distributor, retailer, end_user
  companySize: text("company_size"), // small, medium, large, enterprise
  website: text("website"), // Company website URL
  taxId: text("tax_id"), // Tax identification number
  registrationNumber: text("registration_number"), // Company registration number
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
  emailEnabled: boolean("email_enabled").default(true), // Individual email authentication setting for this customer
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
// IRAQI GEOGRAPHIC DATA SCHEMA
// =============================================================================

// Iraqi provinces table with trilingual support
export const iraqiProvinces = pgTable("iraqi_provinces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameArabic: text("name_arabic").notNull(),
  nameEnglish: text("name_english").notNull(),
  nameKurdish: text("name_kurdish"),
  capital: text("capital").notNull(),
  region: text("region"), // center, north, south
  population: integer("population"),
  area: integer("area"), // in square kilometers
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Iraqi cities table with comprehensive information
export const iraqiCities = pgTable("iraqi_cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameArabic: text("name_arabic").notNull(),
  nameEnglish: text("name_english").notNull(),
  nameKurdish: text("name_kurdish"),
  provinceId: integer("province_id").notNull().references(() => iraqiProvinces.id),
  provinceName: text("province_name").notNull(),
  region: text("region"), // center, north, south
  population: integer("population"),
  elevation: integer("elevation"), // in meters
  coordinates: text("coordinates"), // lat,lng format
  postalCode: text("postal_code"),
  economicActivity: text("economic_activity"),
  distanceFromBaghdad: integer("distance_from_baghdad"), // in kilometers
  distanceFromProvinceCapital: integer("distance_from_province_capital"),
  isProvinceCapital: boolean("is_province_capital").default(false),
  hasIntercityBusLine: boolean("has_intercity_bus_line").default(false), // خط مسافربری بین شهری موجود است
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertIraqiProvinceSchema = createInsertSchema(iraqiProvinces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIraqiCitySchema = createInsertSchema(iraqiCities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertIraqiProvince = z.infer<typeof insertIraqiProvinceSchema>;
export type IraqiProvince = typeof iraqiProvinces.$inferSelect;

export type InsertIraqiCity = z.infer<typeof insertIraqiCitySchema>;
export type IraqiCity = typeof iraqiCities.$inferSelect;

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

// Tax settings types
export const insertTaxSettingSchema = createInsertSchema(taxSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTaxSetting = z.infer<typeof insertTaxSettingSchema>;
export type TaxSetting = typeof taxSettings.$inferSelect;

// Company information types
export const insertCompanyInformationSchema = createInsertSchema(companyInformation).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCompanyInformation = z.infer<typeof insertCompanyInformationSchema>;
export type CompanyInformation = typeof companyInformation.$inferSelect;

// =============================================================================
// PRODUCT REVIEWS & RATINGS SCHEMA
// =============================================================================

// Product Reviews table for customer comments and ratings
export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(), // Reference to product
  customerId: integer("customer_id").notNull(), // Reference to customer from CRM
  customerName: text("customer_name").notNull(), // Customer display name
  customerEmail: text("customer_email").notNull(), // Customer email for verification
  rating: integer("rating").notNull(), // 1-5 star rating
  title: text("title"), // Review title (optional)
  comment: text("comment").notNull(), // Main review text
  isVerifiedPurchase: boolean("is_verified_purchase").default(false), // Did customer buy this product
  isApproved: boolean("is_approved").default(true), // Admin approval status
  adminResponse: text("admin_response"), // Admin response to review
  adminResponseDate: timestamp("admin_response_date"),
  helpfulVotes: integer("helpful_votes").default(0), // Number of helpful votes
  notHelpfulVotes: integer("not_helpful_votes").default(0), // Number of not helpful votes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Product Statistics table for caching review aggregations
export const productStats = pgTable("product_stats", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().unique(), // Reference to product
  totalReviews: integer("total_reviews").default(0), // Total number of reviews
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"), // Average rating (0-5.00)
  ratingDistribution: json("rating_distribution").$type<{[key: string]: number}>().default({}), // Distribution of ratings {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
  lastReviewDate: timestamp("last_review_date"), // Date of most recent review
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Review Helpfulness tracking to prevent duplicate voting
export const reviewHelpfulness = pgTable("review_helpfulness", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull().references(() => productReviews.id),
  customerId: integer("customer_id"), // Logged in customer ID
  customerIp: text("customer_ip"), // IP address for anonymous users
  isHelpful: boolean("is_helpful").notNull(), // true = helpful, false = not helpful
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema exports for Reviews
export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  helpfulVotes: true,
  notHelpfulVotes: true,
  adminResponse: true,
  adminResponseDate: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductReview = typeof productReviews.$inferSelect;

export const insertProductStatsSchema = createInsertSchema(productStats).omit({
  id: true,
  updatedAt: true,
});

export type InsertProductStats = z.infer<typeof insertProductStatsSchema>;
export type ProductStats = typeof productStats.$inferSelect;

export const insertReviewHelpfulnessSchema = createInsertSchema(reviewHelpfulness).omit({
  id: true,
  createdAt: true,
});

export type InsertReviewHelpfulness = z.infer<typeof insertReviewHelpfulnessSchema>;
export type ReviewHelpfulness = typeof reviewHelpfulness.$inferSelect;



// Re-export marketing schema
export * from './marketing-schema';
