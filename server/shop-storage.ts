import { 
  shopProducts, 
  shopCategories,
  customers,
  customerAddresses,
  orders,
  orderItems,
  shopInventoryMovements,
  goodsInTransit,
  discountSettings,
  financialTransactions,
  salesReports,
  productReturns,
  type ShopProduct, 
  type InsertShopProduct,
  type ShopCategory,
  type InsertShopCategory,
  type Customer,
  type InsertCustomer,
  type CustomerAddress,
  type InsertCustomerAddress,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type ShopInventoryMovement,
  type InsertShopInventoryMovement,
  type GoodsInTransit,
  type InsertGoodsInTransit,
  type DiscountSetting,
  type InsertDiscountSetting,
  type FinancialTransaction,
  type InsertFinancialTransaction,
  type SalesReport,
  type InsertSalesReport,
  type ProductReturn,
  type InsertProductReturn
} from "@shared/shop-schema";
import { shopDb } from "./shop-db";
import { eq, desc, and, gte, lte, gt, sql, count, or, like, ilike, asc } from "drizzle-orm";

export interface IShopStorage {
  // Category management
  getCategories(): Promise<ShopCategory[]>;
  getCategoryById(id: number): Promise<ShopCategory | undefined>;
  getCategoryBySlug(slug: string): Promise<ShopCategory | undefined>;
  createCategory(category: InsertShopCategory): Promise<ShopCategory>;
  updateCategory(id: number, category: Partial<InsertShopCategory>): Promise<ShopCategory>;
  deleteCategory(id: number): Promise<void>;
  getSubcategories(parentId: number): Promise<ShopCategory[]>;
  getProductsByCategory(categoryId: number): Promise<ShopProduct[]>;
  
  // Shop products with inventory management
  getShopProducts(): Promise<ShopProduct[]>;
  getAllShopProducts(): Promise<ShopProduct[]>;
  getShopProductsByCategory(category: string): Promise<ShopProduct[]>;
  getShopProductById(id: number): Promise<ShopProduct | undefined>;
  searchShopProducts(query: string, filters?: {
    category?: string;
    priceMin?: number;
    priceMax?: number;
    inStock?: boolean;
    tags?: string[];
    sortBy?: 'name' | 'price' | 'created' | 'relevance';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<{
    products: ShopProduct[];
    total: number;
    filters: {
      categories: { name: string; count: number }[];
      priceRange: { min: number; max: number };
      availableTags: string[];
    };
  }>;
  getShopProductBySku(sku: string): Promise<ShopProduct | undefined>;
  createShopProduct(product: InsertShopProduct): Promise<ShopProduct>;
  updateShopProduct(id: number, product: Partial<InsertShopProduct>): Promise<ShopProduct>;
  deleteShopProduct(id: number): Promise<void>;
  
  // Discount settings management
  getDiscountSettings(): Promise<DiscountSetting[]>;
  getActiveDiscountSettings(): Promise<DiscountSetting[]>;
  getDiscountSettingById(id: number): Promise<DiscountSetting | undefined>;
  createDiscountSetting(discount: InsertDiscountSetting): Promise<DiscountSetting>;
  updateDiscountSetting(id: number, discount: Partial<InsertDiscountSetting>): Promise<DiscountSetting>;
  deleteDiscountSetting(id: number): Promise<void>;
  
  // Categories
  getShopCategories(): Promise<ShopCategory[]>;
  getShopCategoryById(id: number): Promise<ShopCategory | undefined>;
  createShopCategory(category: InsertShopCategory): Promise<ShopCategory>;
  updateShopCategory(id: number, category: Partial<InsertShopCategory>): Promise<ShopCategory>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: number): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  
  // Customer addresses
  getCustomerAddresses(customerId: number): Promise<CustomerAddress[]>;
  createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress>;
  updateCustomerAddress(id: number, address: Partial<InsertCustomerAddress>): Promise<CustomerAddress>;
  deleteCustomerAddress(id: number): Promise<void>;
  
  // Orders
  getOrders(): Promise<Order[]>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: number): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order>;
  
  // Order items
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: number, item: Partial<InsertOrderItem>): Promise<OrderItem>;
  deleteOrderItem(id: number): Promise<void>;
  
  // Inventory management
  getInventoryTransactions(productId?: number): Promise<any[]>;
  createInventoryTransaction(transaction: { productId: number; type: string; quantity: number; notes?: string }): Promise<void>;
  updateProductStock(productId: number, newQuantity: number, reason: string): Promise<void>;
  
  // Analytics
  getOrderStatistics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    pendingOrders: number;
    shippedOrders: number;
  }>;

  // Financial transactions for accounting
  createFinancialTransaction(transaction: InsertFinancialTransaction): Promise<FinancialTransaction>;
  getFinancialTransactions(filters?: {
    type?: string;
    startDate?: Date;
    endDate?: Date;
    orderId?: number;
  }): Promise<FinancialTransaction[]>;
  updateFinancialTransaction(id: number, transaction: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction>;
  
  // Sales reports for accounting dashboard
  createSalesReport(report: InsertSalesReport): Promise<SalesReport>;
  getSalesReports(filters?: {
    reportType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<SalesReport[]>;
  updateSalesReport(id: number, report: Partial<InsertSalesReport>): Promise<SalesReport>;
  
  // Real-time accounting statistics
  getAccountingStats(): Promise<{
    todaySales: number;
    todayReturns: number;
    todayRefunds: number;
    monthlyRevenue: number;
    totalTransactions: number;
    pendingRefunds: number;
    netProfit: number;
  }>;
  
  // Process order refund/return
  processOrderRefund(orderId: number, amount: number, reason: string, type: 'refund' | 'return'): Promise<void>;
  
  // Batch Management
  deleteBatch(batchId: number): Promise<boolean>;
}

export class ShopStorage implements IShopStorage {
  // Category Management
  async getCategories(): Promise<ShopCategory[]> {
    return await shopDb
      .select()
      .from(shopCategories)
      .orderBy(shopCategories.displayOrder, shopCategories.name);
  }

  async getCategoryById(id: number): Promise<ShopCategory | undefined> {
    const result = await shopDb
      .select()
      .from(shopCategories)
      .where(eq(shopCategories.id, id))
      .limit(1);
    return result[0];
  }

  async getCategoryBySlug(slug: string): Promise<ShopCategory | undefined> {
    const result = await shopDb
      .select()
      .from(shopCategories)
      .where(eq(shopCategories.slug, slug))
      .limit(1);
    return result[0];
  }

  async createCategory(categoryData: InsertShopCategory): Promise<ShopCategory> {
    const result = await shopDb
      .insert(shopCategories)
      .values(categoryData)
      .returning();
    return result[0];
  }

  async updateCategory(id: number, categoryData: Partial<InsertShopCategory>): Promise<ShopCategory> {
    const result = await shopDb
      .update(shopCategories)
      .set({ ...categoryData, updatedAt: new Date() })
      .where(eq(shopCategories.id, id))
      .returning();
    return result[0];
  }

  async deleteCategory(id: number): Promise<void> {
    await shopDb
      .delete(shopCategories)
      .where(eq(shopCategories.id, id));
  }

  async getSubcategories(parentId: number): Promise<ShopCategory[]> {
    return await shopDb
      .select()
      .from(shopCategories)
      .where(eq(shopCategories.parentId, parentId))
      .orderBy(shopCategories.displayOrder, shopCategories.name);
  }

  async getProductsByCategory(categoryId: number): Promise<ShopProduct[]> {
    // Get category info first
    const category = await this.getCategoryById(categoryId);
    if (!category) return [];
    
    return await shopDb
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.category, category.name))
      .orderBy(shopProducts.name);
  }

  // Shop Products
  async getAllShopProducts(): Promise<ShopProduct[]> {
    return await shopDb
      .select()
      .from(shopProducts)
      .orderBy(shopProducts.name);
  }

  async getShopProducts(): Promise<ShopProduct[]> {
    const products = await shopDb
      .select()
      .from(shopProducts)
      .where(and(
        eq(shopProducts.isActive, true),
        // Show products that are either in stock OR have showWhenOutOfStock enabled
        or(
          gt(shopProducts.stockQuantity, 0),
          eq(shopProducts.showWhenOutOfStock, true)
        )
      ))
      .orderBy(shopProducts.name);

    // Get active discount settings
    const activeDiscounts = await shopDb
      .select()
      .from(discountSettings)
      .where(eq(discountSettings.isActive, true));

    // Add discount information to each product
    return products.map(product => {
      const applicableDiscounts = activeDiscounts.filter(discount => {
        // Check if discount applies to all products or specific products
        if (discount.applyToAllProducts) {
          return true;
        }
        
        // Check if discount applies to this specific product
        if (discount.applicableProducts && Array.isArray(discount.applicableProducts)) {
          return discount.applicableProducts.includes(product.id);
        }
        
        return false;
      });

      // Convert discount settings to quantityDiscounts format for frontend compatibility
      const quantityDiscounts = applicableDiscounts
        .filter(discount => discount.type === 'quantity' && discount.minQuantity)
        .map(discount => ({
          minQty: discount.minQuantity!,
          discount: parseFloat(discount.discountPercentage) / 100
        }))
        .sort((a, b) => a.minQty - b.minQty);

      return {
        ...product,
        quantityDiscounts
      };
    });
  }

  async getShopProductsByCategory(category: string): Promise<ShopProduct[]> {
    return await shopDb
      .select()
      .from(shopProducts)
      .where(and(
        eq(shopProducts.category, category),
        eq(shopProducts.isActive, true)
      ))
      .orderBy(shopProducts.name);
  }

  async getShopProductById(id: number): Promise<ShopProduct | undefined> {
    const [product] = await shopDb
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.id, id));
    return product;
  }

  async getShopProductBySku(sku: string): Promise<ShopProduct | undefined> {
    const [product] = await shopDb
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.sku, sku));
    return product;
  }

  // SKU validation helper
  async checkSkuExists(sku: string, excludeId?: number): Promise<boolean> {
    if (!sku || sku.trim() === '') return false;
    
    const trimmedSku = sku.trim();
    let whereCondition = eq(shopProducts.sku, trimmedSku);
    
    if (excludeId) {
      whereCondition = and(
        eq(shopProducts.sku, trimmedSku),
        sql`${shopProducts.id} != ${excludeId}`
      );
    }
    
    const result = await shopDb
      .select({ id: shopProducts.id })
      .from(shopProducts)
      .where(whereCondition)
      .limit(1);
      
    return result.length > 0;
  }

  async createShopProduct(product: InsertShopProduct): Promise<ShopProduct> {
    // بررسی الزامی بودن بارکد
    if (!product.barcode || product.barcode.trim() === '') {
      throw new Error('خطا: بارکد الزامی است. محصولات بدون بارکد مجاز نیستند.');
    }
    
    // بررسی SKU تکراری قبل از ایجاد محصول
    if (product.sku && product.sku.trim() !== '') {
      const skuExists = await this.checkSkuExists(product.sku);
      if (skuExists) {
        throw new Error(`خطا: SKU "${product.sku}" قبلاً وجود دارد. لطفاً SKU منحصر به فرد انتخاب کنید.`);
      }
    }

    const [newProduct] = await shopDb
      .insert(shopProducts)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateShopProduct(id: number, productUpdate: Partial<InsertShopProduct>): Promise<ShopProduct> {
    // بررسی الزامی بودن بارکد در بروزرسانی (اگر مقدار داده شده)
    if (productUpdate.hasOwnProperty('barcode') && (!productUpdate.barcode || productUpdate.barcode.trim() === '')) {
      throw new Error('خطا: بارکد الزامی است. نمی‌توان بارکد را خالی گذاشت.');
    }
    
    // بررسی SKU تکراری قبل از بروزرسانی محصول
    if (productUpdate.sku && productUpdate.sku.trim() !== '') {
      const skuExists = await this.checkSkuExists(productUpdate.sku, id);
      if (skuExists) {
        throw new Error(`خطا: SKU "${productUpdate.sku}" قبلاً وجود دارد. لطفاً SKU منحصر به فرد انتخاب کنید.`);
      }
    }

    const [updatedProduct] = await shopDb
      .update(shopProducts)
      .set({ ...productUpdate, updatedAt: new Date() })
      .where(eq(shopProducts.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteShopProduct(id: number): Promise<void> {
    // Actually delete the product from shop database
    await shopDb
      .delete(shopProducts)
      .where(eq(shopProducts.id, id));
  }

  async searchShopProducts(query: string, filters: {
    category?: string;
    priceMin?: number;
    priceMax?: number;
    inStock?: boolean;
    tags?: string[];
    sortBy?: 'name' | 'price' | 'created' | 'relevance';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}): Promise<{
    products: ShopProduct[];
    total: number;
    filters: {
      categories: { name: string; count: number }[];
      priceRange: { min: number; max: number };
      availableTags: string[];
    };
  }> {
    const {
      category,
      priceMin,
      priceMax,
      inStock,
      tags,
      sortBy = 'relevance',
      sortOrder = 'desc',
      limit = 50,
      offset = 0
    } = filters;

    // Build WHERE conditions - only active products
    const whereConditions = [
      eq(shopProducts.isActive, true)
    ];

    // Text search in multiple fields
    if (query && query.trim()) {
      const searchTerm = `%${query.trim()}%`;
      whereConditions.push(
        or(
          ilike(shopProducts.name, searchTerm),
          ilike(shopProducts.description, searchTerm),
          ilike(shopProducts.shortDescription, searchTerm),
          ilike(shopProducts.category, searchTerm),
          ilike(shopProducts.sku, searchTerm),
          sql`${shopProducts.tags}::text ILIKE ${searchTerm}`,
          sql`${shopProducts.specifications}::text ILIKE ${searchTerm}`,
          sql`${shopProducts.features}::text ILIKE ${searchTerm}`,
          sql`${shopProducts.applications}::text ILIKE ${searchTerm}`
        )
      );
    }

    // Category filter
    if (category) {
      whereConditions.push(eq(shopProducts.category, category));
    }

    // Price range filter
    if (priceMin !== undefined) {
      whereConditions.push(gte(shopProducts.price, priceMin.toString()));
    }
    if (priceMax !== undefined) {
      whereConditions.push(lte(shopProducts.price, priceMax.toString()));
    }

    // Stock filter - check both inStock flag and actual stockQuantity
    if (inStock !== undefined) {
      if (inStock === true) {
        // For "In Stock Only" filter, require both inStock=true AND stockQuantity > 0
        whereConditions.push(
          and(
            eq(shopProducts.inStock, true),
            gt(shopProducts.stockQuantity, 0)
          )
        );
      } else {
        // For other cases, use the inStock flag
        whereConditions.push(eq(shopProducts.inStock, inStock));
      }
    } else {
      // When no inStock filter is applied, show products that are either in stock OR have showWhenOutOfStock enabled
      whereConditions.push(
        or(
          gt(shopProducts.stockQuantity, 0),
          eq(shopProducts.showWhenOutOfStock, true)
        )
      );
    }

    // Tags filter
    if (tags && tags.length > 0) {
      const tagConditions = tags.map(tag => 
        sql`${shopProducts.tags}::text ILIKE ${`%${tag}%`}`
      );
      whereConditions.push(or(...tagConditions));
    }

    // Build ORDER BY clause
    let orderByClause = asc(shopProducts.name); // Default fallback
    switch (sortBy) {
      case 'name':
        orderByClause = sortOrder === 'asc' ? asc(shopProducts.name) : desc(shopProducts.name);
        break;
      case 'price':
        orderByClause = sortOrder === 'asc' ? asc(shopProducts.price) : desc(shopProducts.price);
        break;
      case 'created':
        orderByClause = sortOrder === 'asc' ? asc(shopProducts.createdAt) : desc(shopProducts.createdAt);
        break;
      case 'relevance':
      default:
        // For relevance, prioritize featured products and then by name
        orderByClause = desc(shopProducts.isFeatured);
        break;
    }

    // Get filtered products with proper query building
    let baseQuery = shopDb
      .select()
      .from(shopProducts)
      .where(and(...whereConditions));

    // Apply ordering
    if (sortBy === 'relevance') {
      baseQuery = baseQuery.orderBy(desc(shopProducts.isFeatured), asc(shopProducts.name));
    } else {
      baseQuery = baseQuery.orderBy(orderByClause);
    }

    const products = await baseQuery
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await shopDb
      .select({ count: count() })
      .from(shopProducts)
      .where(and(...whereConditions));

    // Get filter metadata
    const categoriesResult = await shopDb
      .select({
        category: shopProducts.category,
        count: count()
      })
      .from(shopProducts)
      .where(eq(shopProducts.isActive, true))
      .groupBy(shopProducts.category);

    const priceRangeResult = await shopDb
      .select({
        min: sql<number>`MIN(CAST(${shopProducts.price} AS NUMERIC))`,
        max: sql<number>`MAX(CAST(${shopProducts.price} AS NUMERIC))`
      })
      .from(shopProducts)
      .where(eq(shopProducts.isActive, true));

    // Extract available tags
    const allTagsResult = await shopDb
      .select({ tags: shopProducts.tags })
      .from(shopProducts)
      .where(eq(shopProducts.isActive, true));

    const availableTags = [...new Set(
      allTagsResult
        .filter(item => item.tags)
        .flatMap(item => Array.isArray(item.tags) ? item.tags : [])
        .filter(tag => typeof tag === 'string' && tag.trim())
    )];

    // Get active discount settings
    const activeDiscounts = await shopDb
      .select()
      .from(discountSettings)
      .where(eq(discountSettings.isActive, true));

    // Add discount information to each product
    const productsWithDiscounts = products.map(product => {
      const applicableDiscounts = activeDiscounts.filter(discount => {
        // Check if discount applies to all products or specific products
        if (discount.applyToAllProducts) {
          return true;
        }
        
        // Check if discount applies to this specific product
        if (discount.applicableProducts && Array.isArray(discount.applicableProducts)) {
          return discount.applicableProducts.includes(product.id);
        }
        
        return false;
      });

      // Convert discount settings to quantityDiscounts format for frontend compatibility
      const quantityDiscounts = applicableDiscounts
        .filter(discount => discount.type === 'quantity' && discount.minQuantity)
        .map(discount => ({
          minQty: discount.minQuantity!,
          discount: parseFloat(discount.discountPercentage) / 100
        }))
        .sort((a, b) => a.minQty - b.minQty);

      return {
        ...product,
        quantityDiscounts
      };
    });

    return {
      products: productsWithDiscounts,
      total: totalResult.count,
      filters: {
        categories: categoriesResult.map(cat => ({
          name: cat.category,
          count: cat.count
        })),
        priceRange: {
          min: priceRangeResult[0]?.min || 0,
          max: priceRangeResult[0]?.max || 0
        },
        availableTags: availableTags as string[]
      }
    };
  }

  // Categories
  async getShopCategories(): Promise<ShopCategory[]> {
    return await shopDb
      .select()
      .from(shopCategories)
      .where(eq(shopCategories.isActive, true))
      .orderBy(shopCategories.displayOrder, shopCategories.name);
  }

  async getShopCategoryById(id: number): Promise<ShopCategory | undefined> {
    const [category] = await shopDb
      .select()
      .from(shopCategories)
      .where(eq(shopCategories.id, id));
    return category;
  }

  async createShopCategory(category: InsertShopCategory): Promise<ShopCategory> {
    const [newCategory] = await shopDb
      .insert(shopCategories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateShopCategory(id: number, categoryUpdate: Partial<InsertShopCategory>): Promise<ShopCategory> {
    const [updatedCategory] = await shopDb
      .update(shopCategories)
      .set({ ...categoryUpdate, updatedAt: new Date() })
      .where(eq(shopCategories.id, id))
      .returning();
    return updatedCategory;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await shopDb
      .select()
      .from(customers)
      .where(eq(customers.isActive, true))
      .orderBy(desc(customers.createdAt));
  }

  async getCustomerById(id: number): Promise<Customer | undefined> {
    const [customer] = await shopDb
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const [customer] = await shopDb
      .select()
      .from(customers)
      .where(eq(customers.email, email));
    return customer;
  }

  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await shopDb
      .insert(customers)
      .values(customer)
      .returning();
    return newCustomer;
  }

  async updateCustomer(id: number, customerUpdate: Partial<InsertCustomer>): Promise<Customer> {
    const [updatedCustomer] = await shopDb
      .update(customers)
      .set({ ...customerUpdate, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return updatedCustomer;
  }

  // Customer Addresses
  async getCustomerAddresses(customerId: number): Promise<CustomerAddress[]> {
    return await shopDb
      .select()
      .from(customerAddresses)
      .where(eq(customerAddresses.customerId, customerId))
      .orderBy(desc(customerAddresses.isDefault), customerAddresses.type);
  }

  async createCustomerAddress(address: InsertCustomerAddress): Promise<CustomerAddress> {
    const [newAddress] = await shopDb
      .insert(customerAddresses)
      .values(address)
      .returning();
    return newAddress;
  }

  async updateCustomerAddress(id: number, addressUpdate: Partial<InsertCustomerAddress>): Promise<CustomerAddress> {
    const [updatedAddress] = await shopDb
      .update(customerAddresses)
      .set({ ...addressUpdate, updatedAt: new Date() })
      .where(eq(customerAddresses.id, id))
      .returning();
    return updatedAddress;
  }

  async deleteCustomerAddress(id: number): Promise<void> {
    await shopDb
      .delete(customerAddresses)
      .where(eq(customerAddresses.id, id));
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return await shopDb
      .select()
      .from(orders)
      .orderBy(desc(orders.orderDate));
  }

  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await shopDb
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    return await shopDb
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.orderDate));
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await shopDb
      .insert(orders)
      .values(order)
      .returning();
    return newOrder;
  }

  async updateOrder(id: number, orderUpdate: Partial<InsertOrder>): Promise<Order> {
    const [updatedOrder] = await shopDb
      .update(orders)
      .set({ ...orderUpdate, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // Order Items
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await shopDb
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [newItem] = await shopDb
      .insert(orderItems)
      .values(item)
      .returning();
    return newItem;
  }

  async updateOrderItem(id: number, itemUpdate: Partial<InsertOrderItem>): Promise<OrderItem> {
    const [updatedItem] = await shopDb
      .update(orderItems)
      .set(itemUpdate)
      .where(eq(orderItems.id, id))
      .returning();
    return updatedItem;
  }

  async deleteOrderItem(id: number): Promise<void> {
    await shopDb
      .delete(orderItems)
      .where(eq(orderItems.id, id));
  }

  // Inventory Management
  async getShopInventoryMovements(productId?: number): Promise<ShopInventoryMovement[]> {
    const query = shopDb
      .select()
      .from(shopInventoryMovements)
      .orderBy(desc(shopInventoryMovements.createdAt));

    if (productId) {
      return await query.where(eq(shopInventoryMovements.productId, productId));
    }

    return await query;
  }

  async createShopInventoryMovement(movement: InsertShopInventoryMovement): Promise<ShopInventoryMovement> {
    const [newMovement] = await shopDb
      .insert(shopInventoryMovements)
      .values(movement)
      .returning();
    return newMovement;
  }

  // Goods in Transit Management
  async getGoodsInTransit(status?: string): Promise<any[]> {
    const query = shopDb
      .select({
        id: goodsInTransit.id,
        orderId: goodsInTransit.orderId,
        customerId: goodsInTransit.customerId,
        productId: goodsInTransit.productId,
        productName: shopProducts.name,
        quantity: goodsInTransit.quantity,
        status: goodsInTransit.status,
        paymentDate: goodsInTransit.paymentDate,
        expectedDeliveryDate: goodsInTransit.expectedDeliveryDate,
        actualDeliveryDate: goodsInTransit.actualDeliveryDate,
        trackingNumber: goodsInTransit.trackingNumber,
        notes: goodsInTransit.notes,
        createdAt: goodsInTransit.createdAt,
        updatedAt: goodsInTransit.updatedAt,
        totalAmount: sql<number>`${goodsInTransit.quantity} * ${shopProducts.price}`.as('total_amount')
      })
      .from(goodsInTransit)
      .leftJoin(shopProducts, eq(goodsInTransit.productId, shopProducts.id))
      .orderBy(desc(goodsInTransit.paymentDate));

    if (status) {
      return await query.where(eq(goodsInTransit.status, status));
    }

    return await query;
  }

  async createGoodsInTransit(transit: InsertGoodsInTransit): Promise<GoodsInTransit> {
    const [newTransit] = await shopDb
      .insert(goodsInTransit)
      .values(transit)
      .returning();
    return newTransit;
  }

  async updateGoodsInTransit(id: number, transitUpdate: any): Promise<GoodsInTransit> {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    // Handle each field separately
    if (transitUpdate.status) {
      updateData.status = transitUpdate.status;
    }
    
    if (transitUpdate.actualDeliveryDate) {
      updateData.actualDeliveryDate = new Date();
    }
    
    const [updatedTransit] = await shopDb
      .update(goodsInTransit)
      .set(updateData)
      .where(eq(goodsInTransit.id, id))
      .returning();
    return updatedTransit;
  }

  async updateGoodsInTransit(id: number, transitUpdate: Partial<InsertGoodsInTransit>): Promise<GoodsInTransit> {
    const [updatedTransit] = await shopDb
      .update(goodsInTransit)
      .set({ ...transitUpdate, updatedAt: new Date() })
      .where(eq(goodsInTransit.id, id))
      .returning();
    return updatedTransit;
  }

  async updateProductStock(productId: number, newQuantity: number, reason: string): Promise<void> {
    // Get current stock
    const product = await this.getShopProductById(productId);
    if (!product) throw new Error("Product not found");

    const difference = newQuantity - (product.stockQuantity || 0);

    // Update product stock
    await this.updateShopProduct(productId, { stockQuantity: newQuantity });

    // Record inventory transaction
    await this.createInventoryTransaction({
      productId,
      type: "adjustment",
      quantity: difference,
      notes: reason,
    });
  }

  // FIFO Batch Management: Reduce inventory from oldest batches first
  async reduceInventoryFIFO(barcode: string, quantityToReduce: number, reason: string): Promise<{ success: boolean, affectedBatches: any[] }> {
    try {
      const { pool } = await import('./db');
      let remainingQuantity = quantityToReduce;
      const affectedBatches = [];
      
      // Get all batches for this barcode, ordered by creation date (oldest first - FIFO)
      const batchesResult = await pool.query(`
        SELECT id, name, batch_number, stock_quantity, created_at
        FROM showcase_products 
        WHERE barcode = $1 AND stock_quantity > 0
        ORDER BY created_at ASC
      `, [barcode]);
      
      console.log(`🔄 [FIFO] Reducing ${quantityToReduce} units from barcode ${barcode} across ${batchesResult.rows.length} batches`);
      
      // Process batches in FIFO order (oldest first)
      for (const batch of batchesResult.rows) {
        if (remainingQuantity <= 0) break;
        
        const currentBatchStock = batch.stock_quantity;
        const reduceFromThisBatch = Math.min(remainingQuantity, currentBatchStock);
        const newBatchStock = currentBatchStock - reduceFromThisBatch;
        
        // Update batch stock
        await pool.query(`
          UPDATE showcase_products 
          SET stock_quantity = $1 
          WHERE id = $2
        `, [newBatchStock, batch.id]);
        
        // Log batch reduction
        affectedBatches.push({
          batchId: batch.id,
          batchNumber: batch.batch_number,
          productName: batch.name,
          previousStock: currentBatchStock,
          reducedQuantity: reduceFromThisBatch,
          newStock: newBatchStock,
          createdAt: batch.created_at
        });
        
        remainingQuantity -= reduceFromThisBatch;
        
        console.log(`  📦 Batch ${batch.batch_number}: ${currentBatchStock} → ${newBatchStock} (reduced ${reduceFromThisBatch})`);
      }
      
      if (remainingQuantity > 0) {
        console.log(`⚠️  [FIFO] Warning: Could not reduce ${remainingQuantity} units - insufficient stock`);
        return { success: false, affectedBatches };
      }
      
      console.log(`✅ [FIFO] Successfully reduced ${quantityToReduce} units from ${affectedBatches.length} batches`);
      return { success: true, affectedBatches };
      
    } catch (error) {
      console.error('Error in FIFO inventory reduction:', error);
      return { success: false, affectedBatches: [] };
    }
  }

  // Get current selling batch (oldest batch with stock > 0 - FIFO)
  async getCurrentSellingBatch(barcode: string): Promise<any> {
    try {
      const { pool } = await import('./db');
      
      const result = await pool.query(`
        SELECT id, name, batch_number, stock_quantity, created_at
        FROM showcase_products 
        WHERE barcode = $1 AND stock_quantity > 0
        ORDER BY created_at ASC
        LIMIT 1
      `, [barcode]);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting current selling batch:', error);
      return null;
    }
  }

  // Add new batch to the system
  async addBatch(batchData: { barcode: string, batchNumber: string, stockQuantity: number, createdAt: string, updatedAt: string }): Promise<any> {
    try {
      const { pool } = await import('./db');
      
      console.log(`📦 [ADD-BATCH] Adding new batch: ${batchData.batchNumber} for barcode: ${batchData.barcode}`);
      
      // First, get the original product data (the one with the base SKU without batch suffix)
      const originalResult = await pool.query(`
        SELECT * FROM showcase_products 
        WHERE barcode = $1 
        ORDER BY created_at ASC
        LIMIT 1
      `, [batchData.barcode]);
      
      if (originalResult.rows.length === 0) {
        throw new Error(`No product found with barcode ${batchData.barcode}`);
      }
      
      const originalProduct = originalResult.rows[0];
      
      // Extract base SKU (first 3 parts) to prevent accumulation of batch numbers
      
      // Create new batch entry with required fields
      const insertResult = await pool.query(`
        INSERT INTO showcase_products (
          name, category, description, short_description, barcode, sku, stock_quantity, 
          unit_price, currency, batch_number, is_active, is_non_chemical, sync_with_shop, 
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
        ) RETURNING *
      `, [
        originalProduct.name,                 // $1
        originalProduct.category,             // $2
        originalProduct.description,          // $3
        originalProduct.short_description,    // $4
        batchData.barcode,                    // $5
        originalProduct.sku.split('-').slice(0, 3).join('-') + '-' + batchData.batchNumber, // $6 - unique SKU with base only
        batchData.stockQuantity,              // $7
        originalProduct.unit_price,           // $8
        originalProduct.currency,             // $9
        batchData.batchNumber,                // $10 - new batch number
        originalProduct.is_active,            // $11
        originalProduct.is_non_chemical,      // $12
        originalProduct.sync_with_shop,       // $13
        batchData.createdAt,                  // $14
        batchData.updatedAt                   // $15
      ]);
      
      console.log(`✅ [ADD-BATCH] Successfully added batch ${batchData.batchNumber} with ${batchData.stockQuantity} units`);
      
      return insertResult.rows[0];
    } catch (error) {
      console.error('Error adding batch:', error);
      throw error;
    }
  }

  // Analytics
  async getOrderStatistics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    pendingOrders: number;
    shippedOrders: number;
  }> {
    const [stats] = await shopDb
      .select({
        totalOrders: count(orders.id),
        totalRevenue: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`,
        pendingOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'pending' THEN 1 END)`,
        shippedOrders: sql<number>`COUNT(CASE WHEN ${orders.status} = 'shipped' THEN 1 END)`,
      })
      .from(orders);

    const averageOrderValue = stats.totalOrders > 0 
      ? Number(stats.totalRevenue) / stats.totalOrders 
      : 0;

    return {
      totalOrders: stats.totalOrders,
      totalRevenue: Number(stats.totalRevenue),
      averageOrderValue,
      pendingOrders: Number(stats.pendingOrders),
      shippedOrders: Number(stats.shippedOrders),
    };
  }

  // Discount settings management
  async getDiscountSettings(): Promise<DiscountSetting[]> {
    return await shopDb.select().from(discountSettings).orderBy(desc(discountSettings.minQuantity));
  }

  async getActiveDiscountSettings(): Promise<DiscountSetting[]> {
    return await shopDb
      .select()
      .from(discountSettings)
      .where(eq(discountSettings.isActive, true))
      .orderBy(desc(discountSettings.minQuantity));
  }

  async getDiscountSettingById(id: number): Promise<DiscountSetting | undefined> {
    const [discount] = await shopDb
      .select()
      .from(discountSettings)
      .where(eq(discountSettings.id, id));
    return discount || undefined;
  }

  async createDiscountSetting(discountData: InsertDiscountSetting): Promise<DiscountSetting> {
    const [discount] = await shopDb
      .insert(discountSettings)
      .values(discountData)
      .returning();
    return discount;
  }

  async updateDiscountSetting(id: number, discountUpdate: Partial<InsertDiscountSetting>): Promise<DiscountSetting> {
    // If discount percentage is being updated, automatically update the description
    if (discountUpdate.discountPercentage) {
      // Get existing discount to get the current minQuantity if not provided
      const [existingDiscount] = await shopDb
        .select()
        .from(discountSettings)
        .where(eq(discountSettings.id, id));
      
      if (existingDiscount) {
        const percentage = parseFloat(discountUpdate.discountPercentage);
        const minQty = discountUpdate.minQuantity || existingDiscount.minQuantity || 10;
        
        // Generate Persian description (since the system primarily uses Persian)
        const persianDescription = `خرید عمده - ${percentage}% تخفیف برای ${minQty} عدد یا بیشتر`;
        
        discountUpdate.description = persianDescription;
      }
    }

    const [discount] = await shopDb
      .update(discountSettings)
      .set({ ...discountUpdate, updatedAt: new Date() })
      .where(eq(discountSettings.id, id))
      .returning();
    return discount;
  }

  async deleteDiscountSetting(id: number): Promise<void> {
    await shopDb.delete(discountSettings).where(eq(discountSettings.id, id));
  }

  // Financial transactions for accounting
  async createFinancialTransaction(transactionData: InsertFinancialTransaction): Promise<FinancialTransaction> {
    const [transaction] = await shopDb
      .insert(financialTransactions)
      .values(transactionData)
      .returning();
    return transaction;
  }

  async getFinancialTransactions(filters?: {
    type?: string;
    startDate?: Date;
    endDate?: Date;
    orderId?: number;
  }): Promise<FinancialTransaction[]> {
    let query = shopDb.select().from(financialTransactions);
    
    if (filters) {
      const conditions = [];
      if (filters.type) {
        conditions.push(eq(financialTransactions.type, filters.type));
      }
      if (filters.orderId) {
        conditions.push(eq(financialTransactions.orderId, filters.orderId));
      }
      if (filters.startDate) {
        conditions.push(gte(financialTransactions.processingDate, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(financialTransactions.processingDate, filters.endDate));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(financialTransactions.processingDate));
  }

  async updateFinancialTransaction(id: number, transactionUpdate: Partial<InsertFinancialTransaction>): Promise<FinancialTransaction> {
    const [transaction] = await shopDb
      .update(financialTransactions)
      .set(transactionUpdate)
      .where(eq(financialTransactions.id, id))
      .returning();
    return transaction;
  }

  // Sales reports for accounting dashboard
  async createSalesReport(reportData: InsertSalesReport): Promise<SalesReport> {
    const [report] = await shopDb
      .insert(salesReports)
      .values(reportData)
      .returning();
    return report;
  }

  async getSalesReports(filters?: {
    reportType?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<SalesReport[]> {
    let query = shopDb.select().from(salesReports);
    
    if (filters) {
      const conditions = [];
      if (filters.reportType) {
        conditions.push(eq(salesReports.reportType, filters.reportType));
      }
      if (filters.startDate) {
        conditions.push(gte(salesReports.reportDate, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(salesReports.reportDate, filters.endDate));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query.orderBy(desc(salesReports.reportDate));
  }

  async updateSalesReport(id: number, reportUpdate: Partial<InsertSalesReport>): Promise<SalesReport> {
    const [report] = await shopDb
      .update(salesReports)
      .set({
        ...reportUpdate,
        updatedAt: new Date()
      })
      .where(eq(salesReports.id, id))
      .returning();
    return report;
  }

  // Real-time accounting statistics
  async getAccountingStats(): Promise<{
    todaySales: number;
    todayReturns: number;
    todayRefunds: number;
    monthlyRevenue: number;
    totalTransactions: number;
    pendingRefunds: number;
    netProfit: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's sales
    const todaySalesResult = await shopDb
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${financialTransactions.amount} AS DECIMAL)), 0)` 
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.type, 'sale'),
          gte(financialTransactions.processingDate, today),
          lte(financialTransactions.processingDate, tomorrow)
        )
      );

    // Today's returns
    const todayReturnsResult = await shopDb
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${financialTransactions.amount} AS DECIMAL)), 0)` 
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.type, 'return'),
          gte(financialTransactions.processingDate, today),
          lte(financialTransactions.processingDate, tomorrow)
        )
      );

    // Today's refunds
    const todayRefundsResult = await shopDb
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${financialTransactions.amount} AS DECIMAL)), 0)` 
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.type, 'refund'),
          gte(financialTransactions.processingDate, today),
          lte(financialTransactions.processingDate, tomorrow)
        )
      );

    // Monthly revenue
    const monthlyRevenueResult = await shopDb
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${financialTransactions.amount} AS DECIMAL)), 0)` 
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.type, 'sale'),
          gte(financialTransactions.processingDate, thisMonth)
        )
      );

    // Total transactions count
    const totalTransactionsResult = await shopDb
      .select({ count: count() })
      .from(financialTransactions);

    // Pending refunds
    const pendingRefundsResult = await shopDb
      .select({ 
        total: sql<number>`COALESCE(SUM(CAST(${financialTransactions.amount} AS DECIMAL)), 0)` 
      })
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.type, 'refund'),
          eq(financialTransactions.status, 'pending')
        )
      );

    const todaySales = todaySalesResult[0]?.total || 0;
    const todayReturns = todayReturnsResult[0]?.total || 0;
    const todayRefunds = todayRefundsResult[0]?.total || 0;
    const monthlyRevenue = monthlyRevenueResult[0]?.total || 0;
    const totalTransactions = totalTransactionsResult[0]?.count || 0;
    const pendingRefunds = pendingRefundsResult[0]?.total || 0;

    return {
      todaySales,
      todayReturns,
      todayRefunds,
      monthlyRevenue,
      totalTransactions,
      pendingRefunds,
      netProfit: todaySales - todayReturns - todayRefunds
    };
  }

  // Create inventory transaction for tracking
  async createInventoryTransaction(transaction: {
    productId: number;
    type: string;
    quantity: number;
    notes?: string;
  }): Promise<void> {
    await shopDb
      .insert(shopInventoryMovements)
      .values({
        productId: transaction.productId,
        transactionType: transaction.type,
        quantity: transaction.quantity,
        previousStock: 0, // Will be calculated in updateProductStock
        newStock: 0, // Will be calculated in updateProductStock
        notes: transaction.notes,
        createdBy: null, // Can be updated with user ID if needed
      });
  }

  // Process order refund/return
  async processOrderRefund(orderId: number, amount: number, reason: string, type: 'refund' | 'return'): Promise<void> {
    // Update order status
    await shopDb
      .update(orders)
      .set({ status: type === 'refund' ? 'refunded' : 'returned' })
      .where(eq(orders.id, orderId));

    // Create financial transaction
    await this.createFinancialTransaction({
      type,
      orderId,
      amount: amount.toString(),
      description: `${type === 'refund' ? 'Refund' : 'Return'} processed: ${reason}`,
      referenceNumber: `${type.toUpperCase()}-${Date.now()}`,
      status: 'completed',
      processingDate: new Date(),
      metadata: { reason, originalOrderId: orderId }
    });

    // If it's a return, restore inventory
    if (type === 'return') {
      const orderItemsToRestore = await this.getOrderItems(orderId);
      for (const item of orderItemsToRestore) {
        const product = await this.getShopProductById(item.productId);
        if (product) {
          await this.updateProductStock(
            item.productId, 
            product.stockQuantity + item.quantity, 
            `Return from order #${orderId}`
          );
        }
      }
    }
  }

  // Product Returns Management
  async createProductReturn(returnData: InsertProductReturn): Promise<ProductReturn> {
    // Get product unit and price from showcase (kardex) if productId exists
    let unitPrice = parseFloat(returnData.unitPrice?.toString() || '0');
    
    if (returnData.productId && returnData.productId > 0) {
      try {
        // Import showcaseDb to get product info from kardex
        const { showcaseDb } = await import('./db');
        const { showcaseProducts } = await import('../shared/showcase-schema');
        const { eq } = await import('drizzle-orm');
        
        const [showcaseProduct] = await showcaseDb
          .select({
            unitPrice: showcaseProducts.unitPrice,
            stockUnit: showcaseProducts.stockUnit
          })
          .from(showcaseProducts)
          .where(eq(showcaseProducts.id, returnData.productId))
          .limit(1);
          
        if (showcaseProduct && showcaseProduct.unitPrice) {
          unitPrice = parseFloat(showcaseProduct.unitPrice);
          console.log(`✅ Unit price retrieved from Kardex for product ${returnData.productId}: ${unitPrice}`);
        }
      } catch (error) {
        console.log('Could not fetch product info from showcase:', error);
        // Continue with provided unitPrice
      }
    }
    
    // Calculate total return amount using actual unit price
    const totalAmount = (unitPrice * returnData.returnQuantity).toFixed(2);
    
    // Remove returnDate from data - let database handle it with defaultNow()
    const { returnDate, ...insertData } = returnData;
    
    const result = await shopDb
      .insert(productReturns)
      .values({
        ...insertData,
        unitPrice: unitPrice.toString(), // Use the actual unit price from kardex
        totalReturnAmount: totalAmount,
        returnDate: new Date(), // Explicitly provide current date as Date object
      })
      .returning();

    // Deduct from product sales (reduce stock quantity)
    await this.reduceProductStockForReturn(returnData.productId, returnData.returnQuantity);

    return result[0];
  }

  async getProductReturns(): Promise<ProductReturn[]> {
    return await shopDb
      .select()
      .from(productReturns)
      .orderBy(desc(productReturns.createdAt));
  }

  async getProductReturnById(id: number): Promise<ProductReturn | undefined> {
    const result = await shopDb
      .select()
      .from(productReturns)
      .where(eq(productReturns.id, id))
      .limit(1);
    return result[0];
  }

  async updateProductReturn(id: number, returnData: Partial<InsertProductReturn>): Promise<ProductReturn> {
    const result = await shopDb
      .update(productReturns)
      .set({ ...returnData, updatedAt: new Date() })
      .where(eq(productReturns.id, id))
      .returning();
    return result[0];
  }

  async deleteProductReturn(id: number): Promise<void> {
    // Get return details before deletion to restore stock
    const returnRecord = await this.getProductReturnById(id);
    if (returnRecord) {
      // Restore stock quantity (add back the returned quantity)
      const product = await this.getShopProductById(returnRecord.productId);
      if (product) {
        await this.updateProductStock(
          returnRecord.productId, 
          product.stockQuantity + returnRecord.returnQuantity, 
          `Restored stock from deleted return record #${id}`
        );
      }
    }

    await shopDb
      .delete(productReturns)
      .where(eq(productReturns.id, id));
  }

  // Find customer by phone number for returns
  async findCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const result = await shopDb
      .select()
      .from(customers)
      .where(eq(customers.phone, phone))
      .limit(1);
    return result[0];
  }

  // Reduce product stock for returns (deduct from total sales)
  private async reduceProductStockForReturn(productId: number, returnQuantity: number): Promise<void> {
    const product = await this.getShopProductById(productId);
    if (product) {
      const newStockQuantity = Math.max(0, product.stockQuantity - returnQuantity);
      await this.updateProductStock(
        productId, 
        newStockQuantity, 
        `Stock reduced due to product return: ${returnQuantity} units`
      );

      // Create inventory movement record
      await this.createInventoryTransaction({
        productId,
        type: 'return_deduction',
        quantity: -returnQuantity,
        notes: `Product return - stock deducted from sales`
      });
    }
  }

  // Get return statistics
  async getReturnStatistics(): Promise<{
    totalReturns: number;
    totalReturnAmount: string;
    pendingReturns: number;
    approvedReturns: number;
    rejectedReturns: number;
  }> {
    try {
      console.log("🔄 Getting return statistics...");
      
      // Get all returns first
      const allReturns = await shopDb.select().from(productReturns);
      console.log("✅ Found returns:", allReturns.length);
      
      // Calculate statistics manually
      const totalReturns = allReturns.length;
      const totalReturnAmount = allReturns.reduce((sum, ret) => sum + (ret.totalReturnAmount || 0), 0);
      const pendingReturns = allReturns.filter(ret => ret.refundStatus === 'pending').length;
      const approvedReturns = allReturns.filter(ret => ret.refundStatus === 'approved').length;
      const rejectedReturns = allReturns.filter(ret => ret.refundStatus === 'rejected').length;
      
      const stats = {
        totalReturns,
        totalReturnAmount: totalReturnAmount.toString(),
        pendingReturns,
        approvedReturns,
        rejectedReturns,
      };
      
      console.log("✅ Return statistics calculated:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error in getReturnStatistics:", error);
      // Return safe defaults if query fails
      return {
        totalReturns: 0,
        totalReturnAmount: "0",
        pendingReturns: 0,
        approvedReturns: 0,
        rejectedReturns: 0,
      };
    }
  }

  // Batch Management - Delete a batch by ID
  async deleteBatch(batchId: number): Promise<boolean> {
    try {
      console.log(`🗑️ [DELETE-BATCH] Attempting to delete batch with ID: ${batchId}`);
      
      // Use raw SQL to delete from showcase_products where batch information is stored
      const { pool } = await import('./db');
      
      // First check if batch exists and get product info
      const checkResult = await pool.query(`
        SELECT id, name, batch_number, barcode, image_urls, image_url FROM showcase_products 
        WHERE id = $1
      `, [batchId]);
      
      if (checkResult.rows.length === 0) {
        console.log(`⚠️ [DELETE-BATCH] No batch found with ID: ${batchId}`);
        return false;
      }
      
      const batch = checkResult.rows[0];
      console.log(`🗑️ [DELETE-BATCH] Found batch: ${batch.name} - ${batch.batch_number}`);
      
      // Check if there are other batches with the same barcode
      const otherBatchesResult = await pool.query(`
        SELECT id, image_urls, image_url FROM showcase_products 
        WHERE barcode = $1 AND id != $2 AND batch_number != 'PARENT'
      `, [batch.barcode, batchId]);
      
      console.log(`🔍 [DELETE-BATCH] Found ${otherBatchesResult.rows.length} other batches with barcode ${batch.barcode}`);
      
      if (otherBatchesResult.rows.length > 0) {
        // There are other batches, safe to delete this one
        const deleteResult = await pool.query(`
          DELETE FROM showcase_products 
          WHERE id = $1
        `, [batchId]);
        
        if (deleteResult.rowCount > 0) {
          console.log(`✅ [DELETE-BATCH] Successfully deleted batch ${batch.batch_number} (ID: ${batchId})`);
          return true;
        }
      } else {
        // This is the last batch, preserve the parent product by converting it to a parent record
        console.log(`🔄 [DELETE-BATCH] Converting last batch to parent for ${batch.name}`);
        
        const updateResult = await pool.query(`
          UPDATE showcase_products 
          SET 
            batch_number = 'PARENT',
            stock_quantity = 0,
            created_at = NOW()
          WHERE id = $1
        `, [batchId]);
        
        if (updateResult.rowCount > 0) {
          console.log(`✅ [DELETE-BATCH] Converted batch ${batch.batch_number} to parent product (ID: ${batchId})`);
          return true;
        }
      }
      
      console.log(`❌ [DELETE-BATCH] Failed to delete/convert batch ${batch.batch_number} (ID: ${batchId})`);
      return false;
    } catch (error) {
      console.error(`❌ [DELETE-BATCH] Error deleting batch ${batchId}:`, error);
      throw new Error(`امکان حذف batch وجود ندارد: ${error instanceof Error ? error.message : 'خطای نامشخص'}`);
    }
  }
}

export const shopStorage = new ShopStorage();