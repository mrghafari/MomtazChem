import { 
  shopProducts, 
  shopCategories,
  customers,
  customerAddresses,
  orders,
  orderItems,
  inventoryTransactions,
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
  type InventoryTransaction,
  type InsertInventoryTransaction
} from "@shared/shop-schema";
import { shopDb } from "./shop-db";
import { eq, desc, and, gte, lte, sql, count } from "drizzle-orm";

export interface IShopStorage {
  // Shop products with inventory management
  getShopProducts(): Promise<ShopProduct[]>;
  getShopProductsByCategory(category: string): Promise<ShopProduct[]>;
  getShopProductById(id: number): Promise<ShopProduct | undefined>;
  getShopProductBySku(sku: string): Promise<ShopProduct | undefined>;
  createShopProduct(product: InsertShopProduct): Promise<ShopProduct>;
  updateShopProduct(id: number, product: Partial<InsertShopProduct>): Promise<ShopProduct>;
  deleteShopProduct(id: number): Promise<void>;
  
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
  getInventoryTransactions(productId?: number): Promise<InventoryTransaction[]>;
  createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction>;
  updateProductStock(productId: number, newQuantity: number, reason: string): Promise<void>;
  
  // Analytics
  getOrderStatistics(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
    pendingOrders: number;
    shippedOrders: number;
  }>;
}

export class ShopStorage implements IShopStorage {
  // Shop Products
  async getShopProducts(): Promise<ShopProduct[]> {
    return await shopDb
      .select()
      .from(shopProducts)
      .where(eq(shopProducts.isActive, true))
      .orderBy(shopProducts.name);
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

  async createShopProduct(product: InsertShopProduct): Promise<ShopProduct> {
    const [newProduct] = await shopDb
      .insert(shopProducts)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateShopProduct(id: number, productUpdate: Partial<InsertShopProduct>): Promise<ShopProduct> {
    const [updatedProduct] = await shopDb
      .update(shopProducts)
      .set({ ...productUpdate, updatedAt: new Date() })
      .where(eq(shopProducts.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteShopProduct(id: number): Promise<void> {
    await shopDb
      .update(shopProducts)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(shopProducts.id, id));
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
  async getInventoryTransactions(productId?: number): Promise<InventoryTransaction[]> {
    const query = shopDb
      .select()
      .from(inventoryTransactions)
      .orderBy(desc(inventoryTransactions.createdAt));

    if (productId) {
      return await query.where(eq(inventoryTransactions.productId, productId));
    }

    return await query;
  }

  async createInventoryTransaction(transaction: InsertInventoryTransaction): Promise<InventoryTransaction> {
    const [newTransaction] = await shopDb
      .insert(inventoryTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateProductStock(productId: number, newQuantity: number, reason: string): Promise<void> {
    // Get current stock
    const product = await this.getShopProductById(productId);
    if (!product) throw new Error("Product not found");

    const difference = newQuantity - product.stockQuantity;

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
}

export const shopStorage = new ShopStorage();