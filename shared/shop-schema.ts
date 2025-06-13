import { pgTable, text, serial, timestamp, decimal, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// SHOP/ECOMMERCE SCHEMA - For actual product sales and inventory management
// =============================================================================

// Shop products with actual pricing and inventory
export const shopProducts = pgTable("shop_products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 10, scale: 2 }), // Original price for discounts
  priceUnit: text("price_unit").notNull(), // per liter, per kg, per ton
  inStock: boolean("in_stock").default(true),
  stockQuantity: integer("stock_quantity").default(0),
  lowStockThreshold: integer("low_stock_threshold").default(10),
  sku: text("sku").unique().notNull(),
  barcode: text("barcode"),
  weight: decimal("weight", { precision: 8, scale: 2 }), // Product weight
  weightUnit: text("weight_unit").default("kg"),
  dimensions: json("dimensions"), // {length, width, height}
  imageUrls: json("image_urls"), // Array of product images
  thumbnailUrl: text("thumbnail_url"),
  specifications: json("specifications"),
  features: json("features"),
  applications: json("applications"),
  tags: json("tags"), // For search and filtering
  minimumOrderQuantity: integer("minimum_order_quantity").default(1),
  maximumOrderQuantity: integer("maximum_order_quantity"),
  leadTime: text("lead_time"), // Delivery time
  shippingClass: text("shipping_class"), // standard, hazardous, etc.
  taxClass: text("tax_class").default("standard"),
  quantityDiscounts: json("quantity_discounts"), // [{minQty: 10, discount: 0.05}, {minQty: 50, discount: 0.10}]
  isActive: boolean("is_active").default(true),
  isFeatured: boolean("is_featured").default(false),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Discount settings table for admin management
export const discountSettings = pgTable("discount_settings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Bulk Discount 1"
  type: text("type").notNull().default("quantity"), // quantity, percentage, fixed
  minQuantity: integer("min_quantity").notNull(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull(),
  isActive: boolean("is_active").default(true),
  description: text("description"),
  applicableProducts: json("applicable_products"), // Array of selected product IDs
  applyToAllProducts: boolean("apply_to_all_products").default(true), // If false, apply only to selected products
  applicableCategories: json("applicable_categories"), // Array of category IDs for category-based discounts
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDiscountSettingsSchema = createInsertSchema(discountSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertDiscountSetting = z.infer<typeof insertDiscountSettingsSchema>;
export type DiscountSetting = typeof discountSettings.$inferSelect;

// Financial transactions table for accounting
export const financialTransactions = pgTable("financial_transactions", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'sale', 'refund', 'adjustment', 'return'
  orderId: integer("order_id").references(() => orders.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description").notNull(),
  referenceNumber: text("reference_number"),
  status: text("status").notNull().default("completed"), // completed, pending, cancelled
  processingDate: timestamp("processing_date").notNull().defaultNow(),
  metadata: json("metadata"), // Additional transaction details
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;

// Sales reports table for daily/monthly summaries
export const salesReports = pgTable("sales_reports", {
  id: serial("id").primaryKey(),
  reportDate: timestamp("report_date").notNull(),
  reportType: text("report_type").notNull(), // 'daily', 'monthly', 'yearly'
  totalSales: decimal("total_sales", { precision: 12, scale: 2 }).notNull().default("0"),
  totalRefunds: decimal("total_refunds", { precision: 12, scale: 2 }).notNull().default("0"),
  totalReturns: decimal("total_returns", { precision: 12, scale: 2 }).notNull().default("0"),
  netRevenue: decimal("net_revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  orderCount: integer("order_count").notNull().default(0),
  refundCount: integer("refund_count").notNull().default(0),
  returnCount: integer("return_count").notNull().default(0),
  averageOrderValue: decimal("average_order_value", { precision: 10, scale: 2 }).notNull().default("0"),
  topSellingProducts: json("top_selling_products"), // Array of product sales data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSalesReportSchema = createInsertSchema(salesReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSalesReport = z.infer<typeof insertSalesReportSchema>;
export type SalesReport = typeof salesReports.$inferSelect;

export const insertShopProductSchema = createInsertSchema(shopProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertShopProduct = z.infer<typeof insertShopProductSchema>;
export type ShopProduct = typeof shopProducts.$inferSelect;

// Product categories for shop
export const shopCategories = pgTable("shop_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  parentId: integer("parent_id"), // For subcategories
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertShopCategorySchema = createInsertSchema(shopCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertShopCategory = z.infer<typeof insertShopCategorySchema>;
export type ShopCategory = typeof shopCategories.$inferSelect;

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  company: text("company"),
  taxId: text("tax_id"), // For business customers
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  totalOrders: integer("total_orders").default(0),
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 }).default("0"),
  lastOrderDate: timestamp("last_order_date"),
  notes: text("notes"),
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

// Customer addresses
export const customerAddresses = pgTable("customer_addresses", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  type: text("type").notNull(), // billing, shipping
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  company: text("company"),
  address1: text("address1").notNull(),
  address2: text("address2"),
  city: text("city").notNull(),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").notNull(),
  phone: text("phone"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;
export type CustomerAddress = typeof customerAddresses.$inferSelect;

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").unique().notNull(),
  customerId: integer("customer_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, processing, shipped, delivered, cancelled
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, failed, refunded
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  shippingAmount: decimal("shipping_amount", { precision: 12, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  notes: text("notes"),
  billingAddress: json("billing_address"),
  shippingAddress: json("shipping_address"),
  shippingMethod: text("shipping_method"),
  trackingNumber: text("tracking_number"),
  orderDate: timestamp("order_date").notNull().defaultNow(),
  shippedDate: timestamp("shipped_date"),
  deliveredDate: timestamp("delivered_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  productSku: text("product_sku").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  productSnapshot: json("product_snapshot"), // Store product details at time of order
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Inventory tracking
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  type: text("type").notNull(), // purchase, sale, adjustment, return
  quantity: integer("quantity").notNull(), // Positive for incoming, negative for outgoing
  referenceId: integer("reference_id"), // Order ID, Purchase ID, etc.
  referenceType: text("reference_type"), // order, purchase, adjustment
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInventoryTransactionSchema = createInsertSchema(inventoryTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertInventoryTransaction = z.infer<typeof insertInventoryTransactionSchema>;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;