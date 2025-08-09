import { pgTable, text, serial, timestamp, decimal, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { crmCustomers } from "./schema";

// =============================================================================
// CUSTOMER PORTAL SCHEMA
// =============================================================================

// Customer accounts table - merged with CRM requirements
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  phone: text("phone").notNull(), // Mandatory mobile phone
  country: text("country").notNull(), // Mandatory country
  province: text("province").notNull(), // Mandatory province/state
  cityRegion: text("city_region").notNull(), // Mandatory city/region (شهر/منطقه)
  address: text("address").notNull(), // Mandatory address
  postalCode: text("postal_code"),
  
  // Additional CRM fields for comprehensive customer management
  alternatePhone: text("alternate_phone"),
  state: text("state"),
  industry: text("industry"),
  businessType: text("business_type"), // manufacturer, distributor, retailer, end_user
  companySize: text("company_size"), // small, medium, large, enterprise
  customerType: text("customer_type").notNull().default("retail"), // retail, wholesale, b2b, distributor
  customerStatus: text("customer_status").notNull().default("active"), // active, inactive, vip, blacklisted
  customerSource: text("customer_source").notNull().default("website"), // website, referral, marketing, cold_call, trade_show
  
  // Purchase behavior analytics (auto-calculated)
  totalOrdersCount: integer("total_orders_count").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0"),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).default("0"),
  lastOrderDate: timestamp("last_order_date"),
  firstOrderDate: timestamp("first_order_date"),
  
  // Communication preferences
  communicationPreference: text("communication_preference").default("email"), // email, phone, sms, whatsapp
  preferredLanguage: text("preferred_language").default("en"),
  marketingConsent: boolean("marketing_consent").default(false),
  productInterests: json("product_interests"), // Array of product categories
  
  // Credit and payment
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }),
  paymentTerms: text("payment_terms").default("immediate"), // immediate, net_30, net_60, net_90
  preferredPaymentMethod: text("preferred_payment_method"),
  
  // Internal management
  assignedSalesRep: text("assigned_sales_rep"),
  tags: json("tags"), // Array of custom tags
  internalNotes: text("internal_notes"),
  publicNotes: text("public_notes"), // Notes visible to customer
  
  // System fields
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  totalOrdersCount: true,
  totalSpent: true,
  averageOrderValue: true,
  lastOrderDate: true,
  firstOrderDate: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Ensure mandatory fields are required
  phone: z.string().min(1, "Phone number is required"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Customer addresses table - multiple shipping addresses per customer
export const customerAddresses = pgTable("customer_addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  title: text("title").notNull(), // Home, Office, Warehouse, etc.
  recipientName: text("recipient_name").notNull(), // نام تحویل‌گیرنده
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  phone: text("phone").notNull(),
  country: text("country").notNull(),
  state: text("state"),
  city: text("city").notNull(),
  address: text("address").notNull(),
  postalCode: text("postal_code"),
  // GPS Location fields
  latitude: decimal("latitude", { precision: 10, scale: 8 }), // GPS موقعیت عرض جغرافیایی
  longitude: decimal("longitude", { precision: 11, scale: 8 }), // GPS موقعیت طول جغرافیایی
  locationAccuracy: decimal("location_accuracy", { precision: 6, scale: 2 }), // دقت موقعیت به متر
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Ensure recipient name defaults to customer's full name if not provided
  recipientName: z.string().min(1, "نام تحویل‌گیرنده الزامی است"),
});

export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;
export type CustomerAddress = typeof customerAddresses.$inferSelect;

// Customer orders table
export const customerOrders = pgTable("customer_orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal("shipping_cost", { precision: 10, scale: 2 }).default("0"),
  currency: text("currency").notNull().default("USD"),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed, refunded
  paymentMethod: text("payment_method"), // bank_transfer, credit_card, check, cash
  shippingAddress: json("shipping_address").notNull(), // Complete shipping address object
  billingAddress: json("billing_address"), // Complete billing address object
  notes: text("notes"),
  internalNotes: text("internal_notes"), // Notes visible only to admin
  estimatedDelivery: timestamp("estimated_delivery"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"), // DHL, FedEx, UPS, etc.
  receiptPath: text("receipt_path"), // Path to uploaded bank receipt
  
  // Recipient information (can be different from customer)
  recipientName: text("recipient_name"), // نام گیرنده
  recipientPhone: text("recipient_phone"), // شماره موبایل گیرنده
  recipientAddress: text("recipient_address"), // آدرس دریافت کالا
  
  // Second delivery address fields for CRM conditional logic
  secondDeliveryAddress: text("second_delivery_address"), // آدرس دوم تحویل
  secondDeliveryCity: text("second_delivery_city"), // شهر آدرس دوم
  secondDeliveryProvince: text("second_delivery_province"), // استان آدرس دوم
  secondDeliveryPostalCode: text("second_delivery_postal_code"), // کد پستی آدرس دوم
  recipientMobile: text("recipient_mobile"), // شماره موبایل گیرنده برای تحویل
  
  // Active delivery information tracking
  activeDeliveryInfo: json("active_delivery_info"), // Track which fields are active for delivery
  
  // GPS Location fields for delivery assistance
  gpsLatitude: decimal("gps_latitude", { precision: 10, scale: 8 }), // GPS موقعیت عرض جغرافیایی
  gpsLongitude: decimal("gps_longitude", { precision: 11, scale: 8 }), // GPS موقعیت طول جغرافیایی
  locationAccuracy: decimal("location_accuracy", { precision: 6, scale: 2 }), // دقت موقعیت به متر
  
  // Delivery method selected by customer during checkout
  deliveryMethod: text("delivery_method").default("courier"), // post, courier, truck, personal_pickup
  deliveryNotes: text("delivery_notes"), // Special delivery instructions from customer
  
  // Tax information saved at order creation time (frozen values)
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("0"), // VAT percentage at time of order
  vatAmount: decimal("vat_amount", { precision: 10, scale: 2 }).default("0"), // Calculated VAT amount
  surchargeRate: decimal("surcharge_rate", { precision: 5, scale: 2 }).default("0"), // Surcharge percentage at time of order
  surchargeAmount: decimal("surcharge_amount", { precision: 10, scale: 2 }).default("0"), // Calculated surcharge amount
  
  // Invoice type and conversion tracking
  invoiceType: text("invoice_type").default("proforma"), // proforma, official_invoice
  invoiceConvertedAt: timestamp("invoice_converted_at"), // When proforma was converted to official invoice
  
  // Payment rejection tracking
  rejectionReason: text("rejection_reason"), // Reason for payment rejection by financial department
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomerOrderSchema = createInsertSchema(customerOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomerOrder = z.infer<typeof insertCustomerOrderSchema>;
export type CustomerOrder = typeof customerOrders.$inferSelect;

// Order items table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id"), // Reference to showcase_products
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: text("unit").notNull().default("units"), // kg, liters, units, etc.
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  specifications: json("specifications"), // Custom specifications or requirements
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Customer inquiries table
export const customerInquiries = pgTable("customer_inquiries", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"), // Can be null for guest inquiries
  inquiryNumber: text("inquiry_number").notNull().unique(),
  type: text("type").notNull(), // product_info, quote_request, technical_support, complaint, general
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  status: text("status").notNull().default("open"), // open, in_progress, resolved, closed
  category: text("category"), // fuel_additives, water_treatment, paint_thinner, agricultural_fertilizers
  productIds: json("product_ids"), // Array of interested product IDs
  attachments: json("attachments"), // Array of uploaded file URLs
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  company: text("company"),
  assignedTo: integer("assigned_to"), // Admin user ID
  responseTime: timestamp("response_time"), // When first response was sent
  resolvedAt: timestamp("resolved_at"),
  customerRating: integer("customer_rating"), // 1-5 rating
  customerFeedback: text("customer_feedback"),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomerInquirySchema = createInsertSchema(customerInquiries).omit({
  id: true,
  inquiryNumber: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomerInquiry = z.infer<typeof insertCustomerInquirySchema>;
export type CustomerInquiry = typeof customerInquiries.$inferSelect;

// Inquiry responses table
export const inquiryResponses = pgTable("inquiry_responses", {
  id: serial("id").primaryKey(),
  inquiryId: integer("inquiry_id").notNull(),
  senderId: integer("sender_id"), // Admin user ID, null if from customer
  senderType: text("sender_type").notNull(), // customer, admin
  message: text("message").notNull(),
  attachments: json("attachments"), // Array of file URLs
  isInternal: boolean("is_internal").default(false), // Internal admin notes not visible to customer
  readAt: timestamp("read_at"), // When customer read the message
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInquiryResponseSchema = createInsertSchema(inquiryResponses).omit({
  id: true,
  createdAt: true,
});

export type InsertInquiryResponse = z.infer<typeof insertInquiryResponseSchema>;
export type InquiryResponse = typeof inquiryResponses.$inferSelect;

// Note: CRM functionality is now merged into the main customers table above
// This provides unified customer management for both portal and CRM features

// Customer activities log
export const customerActivities = pgTable("customer_activities", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  customerName: text("customer_name"), // Store customer name for display
  activityType: text("activity_type").notNull(), // order_placed, payment_received, inquiry_submitted, email_sent, call_made, meeting_held
  activityData: json("activity_data"), // Flexible data storage for activity details
  description: text("description").notNull(),
  performedBy: text("performed_by"), // system, admin_user_id
  relatedOrderId: integer("related_order_id"),
  relatedInquiryId: integer("related_inquiry_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCustomerActivitySchema = createInsertSchema(customerActivities).omit({
  id: true,
  createdAt: true,
});

export type InsertCustomerActivity = z.infer<typeof insertCustomerActivitySchema>;
export type CustomerActivity = typeof customerActivities.$inferSelect;

// Customer segments for marketing
export const customerSegments = pgTable("customer_segments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  criteria: json("criteria"), // Segmentation rules
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomerSegmentSchema = createInsertSchema(customerSegments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomerSegment = z.infer<typeof insertCustomerSegmentSchema>;
export type CustomerSegment = typeof customerSegments.$inferSelect;

// Email templates table for customizable support responses
export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(), // quote_response, product_info, technical_support, general, welcome, followup
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  variables: json("variables"), // Available template variables like {{customer_name}}, {{product_name}}
  isActive: boolean("is_active").default(true),
  isDefault: boolean("is_default").default(false), // Default template for category
  language: text("language").notNull().default("en"), // en, fa
  createdBy: integer("created_by").notNull(), // Admin user ID
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  usageCount: true,
  lastUsed: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;
export type EmailTemplate = typeof emailTemplates.$inferSelect;

// Quote requests table
export const quoteRequests = pgTable("quote_requests", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"), // Can be null for guest requests
  quoteNumber: text("quote_number").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, quoted, accepted, rejected, expired
  priority: text("priority").notNull().default("normal"),
  requestedProducts: json("requested_products").notNull(), // Array of product requests with quantities
  deliveryLocation: text("delivery_location").notNull(),
  requestedDeliveryDate: timestamp("requested_delivery_date"),
  paymentTerms: text("payment_terms"), // net_30, net_60, prepaid, etc.
  specialRequirements: text("special_requirements"),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone"),
  company: text("company").notNull(),
  quotedAmount: decimal("quoted_amount", { precision: 10, scale: 2 }),
  quotedCurrency: text("quoted_currency").default("USD"),
  validUntil: timestamp("valid_until"),
  quotedBy: integer("quoted_by"), // Admin user ID
  quotedAt: timestamp("quoted_at"),
  acceptedAt: timestamp("accepted_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertQuoteRequestSchema = createInsertSchema(quoteRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQuoteRequest = z.infer<typeof insertQuoteRequestSchema>;
export type QuoteRequest = typeof quoteRequests.$inferSelect;

// =============================================================================
// CUSTOMER WALLET SYSTEM
// =============================================================================

// Customer wallets table - stores customer credit balance
export const customerWallets = pgTable("customer_wallets", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().unique().references(() => crmCustomers.id),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  currency: text("currency").notNull().default("IQD"), // IQD, USD, EUR
  status: text("status").notNull().default("active"), // active, frozen, suspended
  creditLimit: decimal("credit_limit", { precision: 12, scale: 2 }).default("0"),
  lastActivityDate: timestamp("last_activity_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Wallet transactions table - all wallet transaction history
export const walletTransactions = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").notNull().references(() => customerWallets.id),
  customerId: integer("customer_id").notNull().references(() => crmCustomers.id),
  transactionType: text("transaction_type").notNull(), // credit, debit, refund, adjustment, payment
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("IQD"),
  balanceBefore: decimal("balance_before", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 12, scale: 2 }).notNull(),
  description: text("description").notNull(),
  referenceType: text("reference_type"), // order, refund, manual_adjustment, deposit
  referenceId: integer("reference_id"), // Related order ID, refund ID, etc.
  paymentMethod: text("payment_method"), // bank_transfer, credit_card, cash, admin_adjustment
  status: text("status").notNull().default("completed"), // pending, completed, failed, cancelled
  processedBy: integer("processed_by"), // Admin user ID who processed the transaction
  notes: text("notes"), // Internal notes
  metadata: json("metadata"), // Additional transaction data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Wallet recharge requests table - customer requests to add money to wallet
export const walletRechargeRequests = pgTable("wallet_recharge_requests", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull().references(() => crmCustomers.id),
  walletId: integer("wallet_id").notNull().references(() => customerWallets.id),
  requestNumber: text("request_number").notNull().unique(), // Auto-generated unique number
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("IQD"),
  paymentMethod: text("payment_method").notNull(), // bank_transfer, credit_card, cash_deposit
  paymentReference: text("payment_reference"), // Bank transaction reference, receipt number
  paymentGatewayId: integer("payment_gateway_id"), // If paid through gateway
  status: text("status").notNull().default("pending"), // pending, approved, rejected, processing, completed
  customerNotes: text("customer_notes"), // Customer's notes/remarks
  adminNotes: text("admin_notes"), // Admin internal notes
  rejectionReason: text("rejection_reason"), // Reason if rejected
  approvedBy: integer("approved_by"), // Admin user ID who approved
  approvedAt: timestamp("approved_at"),
  processedAt: timestamp("processed_at"),
  attachmentUrl: text("attachment_url"), // Payment receipt/proof upload
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Create insert schemas
export const insertCustomerWalletSchema = createInsertSchema(customerWallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWalletRechargeRequestSchema = createInsertSchema(walletRechargeRequests).omit({
  id: true,
  requestNumber: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type InsertCustomerWallet = z.infer<typeof insertCustomerWalletSchema>;
export type CustomerWallet = typeof customerWallets.$inferSelect;

export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactions.$inferSelect;

export type InsertWalletRechargeRequest = z.infer<typeof insertWalletRechargeRequestSchema>;
export type WalletRechargeRequest = typeof walletRechargeRequests.$inferSelect;

// =============================================================================
// CUSTOMER VERIFICATION SYSTEM (SMS + EMAIL)
// =============================================================================

// Customer verification codes for SMS verification
export const customerVerificationCodes = pgTable("customer_verification_codes", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"), // Nullable for pre-registration verification
  phoneNumber: text("phone_number").notNull(),
  verificationCode: text("verification_code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer email verification codes table
export const customerEmailVerificationCodes = pgTable("customer_email_verification_codes", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"),
  email: text("email").notNull(),
  verificationCode: text("verification_code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Customer verification settings - determines which verification methods are required
export const customerVerificationSettings = pgTable("customer_verification_settings", {
  id: serial("id").primaryKey(),
  smsVerificationEnabled: boolean("sms_verification_enabled").default(true),
  emailVerificationEnabled: boolean("email_verification_enabled").default(true),
  requireBothVerifications: boolean("require_both_verifications").default(true), // Dual authentication requirement
  allowSkipVerification: boolean("allow_skip_verification").default(false), // Allow skip during registration
  updatedBy: integer("updated_by"), // Admin who updated settings
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Create insert schemas
export const insertCustomerVerificationCodeSchema = createInsertSchema(customerVerificationCodes).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerEmailVerificationCodeSchema = createInsertSchema(customerEmailVerificationCodes).omit({
  id: true,
  createdAt: true,
});

export const insertCustomerVerificationSettingsSchema = createInsertSchema(customerVerificationSettings).omit({
  id: true,
  updatedAt: true,
});

// Types
export type InsertCustomerVerificationCode = z.infer<typeof insertCustomerVerificationCodeSchema>;
export type CustomerVerificationCode = typeof customerVerificationCodes.$inferSelect;

export type InsertCustomerEmailVerificationCode = z.infer<typeof insertCustomerEmailVerificationCodeSchema>;
export type CustomerEmailVerificationCode = typeof customerEmailVerificationCodes.$inferSelect;

export type InsertCustomerVerificationSettings = z.infer<typeof insertCustomerVerificationSettingsSchema>;
export type CustomerVerificationSettings = typeof customerVerificationSettings.$inferSelect;