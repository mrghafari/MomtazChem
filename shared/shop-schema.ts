import { pgTable, text, serial, timestamp, decimal, boolean, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// =============================================================================
// SHOP/ECOMMERCE SCHEMA - For actual product sales and inventory management
// =============================================================================

// Shop Inventory Movements - Track all shop inventory movements
export const shopInventoryMovements = pgTable("shop_inventory_movements", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  orderId: integer("order_id"), // ارتباط با سفارش
  customerId: integer("customer_id"),
  transactionType: text("transaction_type").notNull(), // 'sale', 'reserve', 'transit', 'delivered', 'returned', 'cancelled'
  quantity: integer("quantity").notNull(),
  previousStock: integer("previous_stock").notNull(),
  newStock: integer("new_stock").notNull(),
  notes: text("notes"),
  createdBy: integer("created_by"), // Admin ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Goods in Transit - کالاهای در راه
export const goodsInTransit = pgTable("goods_in_transit", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  customerId: integer("customer_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  status: text("status").notNull().default("paid"), // 'paid', 'prepared', 'shipped', 'delivered'
  paymentDate: timestamp("payment_date").notNull(),
  expectedDeliveryDate: timestamp("expected_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Product Waste Tracking - تتبع ضایعات محصولات
export const productWaste = pgTable("product_waste", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  wasteAmount: decimal("waste_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  reason: text("reason"), // دلیل ضایعات
  reportedBy: integer("reported_by"), // Admin ID
  reportedAt: timestamp("reported_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Batch Sales Tracking - ردیابی فروش بچ‌ها
export const batchSalesTracking = pgTable("batch_sales_tracking", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  customerId: integer("customer_id").notNull(),
  productId: integer("product_id").notNull(),
  barcode: text("barcode").notNull(),
  batchNumber: text("batch_number").notNull(),
  quantitySold: integer("quantity_sold").notNull(),
  wasteAmount: decimal("waste_amount", { precision: 10, scale: 2 }).default("0"), // ضایعات احتساب شده
  effectiveQuantity: integer("effective_quantity").notNull(), // مقدار مؤثر (quantity_sold + waste_amount)
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  batchExpiryDate: timestamp("batch_expiry_date"),
  manufacturingDate: timestamp("manufacturing_date"),
  saleDate: timestamp("sale_date").notNull().defaultNow(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
  reservedQuantity: integer("reserved_quantity").default(0), // کالای رزرو شده
  transitQuantity: integer("transit_quantity").default(0), // کالای در راه
  availableQuantity: integer("available_quantity").default(0), // موجودی قابل فروش
  minStockLevel: integer("min_stock_level").default(5), // حد مینیمم برای اعلام به مدیر تولید
  lowStockThreshold: integer("low_stock_threshold").default(10), // آستانه برای نمایش هشدار به مشتری
  maxStockLevel: integer("max_stock_level").default(1000), // حداکثر موجودی مجاز
  sku: text("sku").unique().notNull(),
  barcode: text("barcode"),
  // Weight fields - Enhanced with net and gross weights
  netWeight: decimal("net_weight", { precision: 8, scale: 2 }), // وزن خالص - Net weight (product only)
  grossWeight: decimal("gross_weight", { precision: 8, scale: 2 }), // وزن ناخالص - Gross weight (product + packaging)
  weightUnit: text("weight_unit").default("kg"), // Weight unit (kg, g, lb, oz, t)
  // Legacy weight field for backward compatibility
  weight: decimal("weight", { precision: 8, scale: 2 }), // Deprecated: use grossWeight for calculations
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
  visibleInShop: boolean("visible_in_shop").default(true), // کنترل نمایش در فروشگاه
  showWhenOutOfStock: boolean("show_when_out_of_stock").default(false), // نمایش در فروشگاه حتی با موجودی صفر
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  // MSDS (Material Safety Data Sheet) fields
  msdsUrl: text("msds_url"), // URL to MSDS PDF file
  showMsdsToCustomers: boolean("show_msds_to_customers").default(false), // Checkbox to control visibility
  msdsFileName: text("msds_file_name"), // Original filename for display
  msdsUploadDate: timestamp("msds_upload_date"), // When MSDS was uploaded
  // Product Catalog fields
  pdfCatalogUrl: text("pdf_catalog_url"), // URL to product catalog PDF file
  showCatalogToCustomers: boolean("show_catalog_to_customers").default(false), // Checkbox to control visibility
  catalogFileName: text("catalog_file_name"), // Original filename for display
  catalogUploadDate: timestamp("catalog_upload_date"), // When catalog was uploaded
  // Safety and hazard information
  isFlammable: boolean("is_flammable").default(false), // آتش‌زا بودن کالا
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Parent product relationship for variants
  parentProductId: integer("parent_product_id"),
  isVariant: boolean("is_variant").default(false),
  variantType: text("variant_type"), // size, concentration, packaging, etc.
  variantValue: text("variant_value"), // 1kg, 5kg, 25kg, 50%, 80%, etc.
  sortOrder: integer("sort_order").default(0), // Display order for variants
});

// Product variants relationship table
export const productVariants = pgTable("product_variants", {
  id: serial("id").primaryKey(),
  parentProductId: integer("parent_product_id").notNull(),
  variantProductId: integer("variant_product_id").notNull(),
  variantType: text("variant_type").notNull(), // size, concentration, packaging, purity
  variantName: text("variant_name").notNull(), // 1kg Bottle, 5kg Container, 95% Purity
  variantValue: text("variant_value").notNull(), // 1kg, 5kg, 95%
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Product variant options for different attributes
export const productVariantOptions = pgTable("product_variant_options", {
  id: serial("id").primaryKey(),
  parentProductId: integer("parent_product_id").notNull(),
  optionName: text("option_name").notNull(), // Size, Concentration, Package Type
  optionValues: json("option_values").notNull(), // ["1kg", "5kg", "25kg"] or ["50%", "80%", "95%"]
  isRequired: boolean("is_required").default(true),
  displayType: text("display_type").default("dropdown"), // dropdown, radio, buttons
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment gateways configuration table
export const paymentGateways = pgTable("payment_gateways", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Rasheed Bank", "Visa Iraq"
  type: text("type").notNull(), // 'iraqi_bank' | 'credit_card' | 'digital_wallet' | 'bank_transfer'
  enabled: boolean("enabled").default(true),
  config: json("config").notNull(), // Payment gateway specific configuration
  testMode: boolean("test_mode").default(false),
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
  orderId: integer("order_id"), // Reference to orders table (foreign key will be added separately)
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

// Product Returns - کالای برگشتی
export const productReturns = pgTable("product_returns", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  productSku: text("product_sku").notNull(),
  returnQuantity: integer("return_quantity").notNull(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  returnReason: text("return_reason").notNull(),
  returnDate: timestamp("return_date").notNull(),
  originalOrderId: integer("original_order_id"),
  originalOrderNumber: text("original_order_number"),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalReturnAmount: decimal("total_return_amount", { precision: 10, scale: 2 }).notNull(),
  refundStatus: text("refund_status").notNull().default("pending"), // pending, approved, refunded, rejected
  refundMethod: text("refund_method"), // cash, bank_transfer, store_credit, wallet
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }),
  processedBy: integer("processed_by"), // Admin user ID
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductReturnSchema = createInsertSchema(productReturns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProductReturn = z.infer<typeof insertProductReturnSchema>;
export type ProductReturn = typeof productReturns.$inferSelect;

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
  paymentMethod: text("payment_method"), // e.g., "Bank Transfer - Rasheed Bank"
  paymentGatewayId: integer("payment_gateway_id"), // Reference to payment_gateways table
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  shippingAmount: decimal("shipping_amount", { precision: 12, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("IQD"),
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

// Shop Inventory Movement types
export const insertShopInventoryMovementSchema = createInsertSchema(shopInventoryMovements).omit({
  id: true,
  createdAt: true,
});

export type InsertShopInventoryMovement = z.infer<typeof insertShopInventoryMovementSchema>;
export type ShopInventoryMovement = typeof shopInventoryMovements.$inferSelect;

// Goods in Transit types
export const insertGoodsInTransitSchema = createInsertSchema(goodsInTransit).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertGoodsInTransit = z.infer<typeof insertGoodsInTransitSchema>;
export type GoodsInTransit = typeof goodsInTransit.$inferSelect;



// Invoices table for customer billing
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").unique().notNull(),
  orderId: integer("order_id").notNull(),
  customerId: integer("customer_id").notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  type: text("type").notNull().default("standard"), // standard, official
  isOfficial: boolean("is_official").default(false), // For official government invoices
  issueDate: timestamp("issue_date").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  paymentDate: timestamp("payment_date"),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0"),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("IQD"),
  language: text("language").default("ar"), // ar for Arabic, en for English
  notes: text("notes"),
  terms: text("terms"), // Payment terms and conditions
  billingAddress: json("billing_address"),
  companyInfo: json("company_info"), // Company details for official invoices
  taxInfo: json("tax_info"), // Tax registration details
  officialRequestedAt: timestamp("official_requested_at"), // When customer requested official invoice
  officialProcessedAt: timestamp("official_processed_at"), // When official invoice was generated
  pdfPath: text("pdf_path"), // Path to generated PDF
  emailSent: boolean("email_sent").default(false),
  emailSentAt: timestamp("email_sent_at"),
  metadata: json("metadata"), // Additional invoice data
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

// Invoice items (mirror of order items for invoice records)
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  productId: integer("product_id").notNull(),
  productName: text("product_name").notNull(),
  productSku: text("product_sku").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }).default("0"),
  taxAmount: decimal("tax_amount", { precision: 10, scale: 2 }).default("0"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
});

export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;
export type InvoiceItem = typeof invoiceItems.$inferSelect;

// Payment Gateway types
export const insertPaymentGatewaySchema = createInsertSchema(paymentGateways).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPaymentGateway = z.infer<typeof insertPaymentGatewaySchema>;
export type PaymentGateway = typeof paymentGateways.$inferSelect;

// Product variants insert schemas and types
export const insertProductVariantSchema = createInsertSchema(productVariants).omit({
  id: true,
  createdAt: true,
});

export type InsertProductVariant = z.infer<typeof insertProductVariantSchema>;
export type ProductVariant = typeof productVariants.$inferSelect;

export const insertProductVariantOptionSchema = createInsertSchema(productVariantOptions).omit({
  id: true,
  createdAt: true,
});

export type InsertProductVariantOption = z.infer<typeof insertProductVariantOptionSchema>;
export type ProductVariantOption = typeof productVariantOptions.$inferSelect;

// =============================================================================
// PRODUCT REVIEWS & RATINGS SYSTEM - سیستم نظرسنجی و امتیازدهی
// =============================================================================

// Product Reviews and Ratings - نظرات و امتیازات محصولات
export const productReviews = pgTable("product_reviews", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  customerId: integer("customer_id"), // Optional for guest reviews
  customerName: text("customer_name").notNull(), // نام نمایش یافته
  customerEmail: text("customer_email"), // Optional for verification
  rating: integer("rating").notNull(), // 1-5 stars
  title: text("title"), // عنوان نظر
  review: text("review"), // متن نظر
  pros: json("pros"), // نقاط مثبت به صورت آرایه
  cons: json("cons"), // نقاط منفی به صورت آرایه
  isVerifiedPurchase: boolean("is_verified_purchase").default(false), // خرید تایید شده
  isApproved: boolean("is_approved").default(false), // تایید شده توسط ادمین
  helpfulVotes: integer("helpful_votes").default(0), // رای مفید بودن
  notHelpfulVotes: integer("not_helpful_votes").default(0), // رای مفید نبودن
  adminResponse: text("admin_response"), // پاسخ ادمین
  adminResponseDate: timestamp("admin_response_date"), // تاریخ پاسخ ادمین
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductReviewSchema = createInsertSchema(productReviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertProductReview = z.infer<typeof insertProductReviewSchema>;
export type ProductReview = typeof productReviews.$inferSelect;

// Product Statistics - آمار محصولات
export const productStats = pgTable("product_stats", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull().unique(),
  totalReviews: integer("total_reviews").default(0),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default("0"), // میانگین امتیاز
  ratingDistribution: json("rating_distribution").default({}), // {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
  totalViews: integer("total_views").default(0), // بازدید کل
  totalPurchases: integer("total_purchases").default(0), // خرید کل
  lastReviewDate: timestamp("last_review_date"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProductStatsSchema = createInsertSchema(productStats).omit({
  id: true,
  updatedAt: true,
});

export type InsertProductStats = z.infer<typeof insertProductStatsSchema>;
export type ProductStats = typeof productStats.$inferSelect;

// Review Helpfulness - مفید بودن نظرات
export const reviewHelpfulness = pgTable("review_helpfulness", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  customerId: integer("customer_id"), // کسی که رای داده
  customerIp: text("customer_ip"), // برای مهمان‌ها
  isHelpful: boolean("is_helpful").notNull(), // true = مفید، false = غیرمفید
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReviewHelpfulnessSchema = createInsertSchema(reviewHelpfulness).omit({
  id: true,
  createdAt: true,
});

export type InsertReviewHelpfulness = z.infer<typeof insertReviewHelpfulnessSchema>;
export type ReviewHelpfulness = typeof reviewHelpfulness.$inferSelect;