import { pgTable, text, serial, timestamp, decimal, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// CUSTOMER PORTAL SCHEMA
// =============================================================================

// Customer accounts table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  phone: text("phone"),
  country: text("country"),
  city: text("city"),
  address: text("address"),
  postalCode: text("postal_code"),
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
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Customer orders table
export const customerOrders = pgTable("customer_orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  orderNumber: text("order_number").notNull().unique(),
  status: text("status").notNull().default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
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

// =============================================================================
// CRM CUSTOMERS - Enhanced customer management for shop purchases
// =============================================================================

// CRM Customers table - for shop customers with advanced tracking
export const crmCustomers = pgTable("crm_customers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  phone: text("phone"),
  alternatePhone: text("alternate_phone"),
  country: text("country"),
  state: text("state"),
  city: text("city"),
  address: text("address"),
  postalCode: text("postal_code"),
  
  // Business information
  industry: text("industry"),
  businessType: text("business_type"), // manufacturer, distributor, retailer, end_user
  companySize: text("company_size"), // small, medium, large, enterprise
  annualRevenue: text("annual_revenue"), // <1M, 1M-10M, 10M-100M, 100M+
  
  // Customer classification
  customerType: text("customer_type").notNull().default("retail"), // retail, wholesale, b2b, distributor
  customerStatus: text("customer_status").notNull().default("active"), // active, inactive, vip, blacklisted
  customerSource: text("customer_source").notNull().default("website"), // website, referral, marketing, cold_call, trade_show
  assignedSalesRep: text("assigned_sales_rep"),
  
  // Purchase behavior analytics
  totalOrdersCount: integer("total_orders_count").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0"),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).default("0"),
  lastOrderDate: timestamp("last_order_date"),
  firstOrderDate: timestamp("first_order_date"),
  
  // Engagement metrics
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  communicationPreference: text("communication_preference").default("email"), // email, phone, sms, whatsapp
  preferredLanguage: text("preferred_language").default("en"),
  
  // Marketing and preferences
  marketingConsent: boolean("marketing_consent").default(false),
  productInterests: json("product_interests"), // Array of product categories
  priceRange: text("price_range"), // budget, standard, premium
  orderFrequency: text("order_frequency"), // weekly, monthly, quarterly, yearly
  
  // Credit and payment
  creditLimit: decimal("credit_limit", { precision: 10, scale: 2 }),
  paymentTerms: text("payment_terms").default("immediate"), // immediate, net_30, net_60, net_90
  preferredPaymentMethod: text("preferred_payment_method"),
  creditStatus: text("credit_status").default("good"), // good, fair, poor, blocked
  
  // Internal notes and tags
  tags: json("tags"), // Array of custom tags
  internalNotes: text("internal_notes"),
  publicNotes: text("public_notes"), // Notes visible to customer
  
  // System fields
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: text("created_by").default("system"), // auto, admin_user_id, import
});

export const insertCrmCustomerSchema = createInsertSchema(crmCustomers).omit({
  id: true,
  totalOrdersCount: true,
  totalSpent: true,
  averageOrderValue: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCrmCustomer = z.infer<typeof insertCrmCustomerSchema>;
export type CrmCustomer = typeof crmCustomers.$inferSelect;

// Customer activities log
export const customerActivities = pgTable("customer_activities", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
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