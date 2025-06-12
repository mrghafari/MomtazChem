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