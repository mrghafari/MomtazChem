/**
 * Unified Inventory Management System
 * Makes showcase_products the single source of truth for inventory
 * Shop products will get inventory from showcase_products
 * Now includes FIFO batch tracking with waste management
 */

import { storage } from "./storage";
import { shopStorage } from "./shop-storage";
import { db } from "./db";
import { batchSalesTracking } from "../shared/shop-schema";
import { eq } from "drizzle-orm";

export class UnifiedInventoryManager {
  
  /**
   * Get inventory for any product from showcase_products table
   * This makes showcase_products the single source of truth
   */
  static async getProductInventory(productName: string): Promise<{
    stockQuantity: number;
    minStockLevel: number;
    lowStockThreshold: number;
    inStock: boolean;
  } | null> {
    try {
      console.log(`📦 [INVENTORY] Getting inventory for: ${productName}`);
      
      // Always get inventory from showcase_products (single source of truth)
      const showcaseProducts = await storage.getProducts();
      const showcaseProduct = showcaseProducts.find(p => p.name === productName);
      
      if (!showcaseProduct) {
        console.log(`❌ [INVENTORY] Product ${productName} not found in showcase_products`);
        return null;
      }
      
      const inventory = {
        stockQuantity: showcaseProduct.stockQuantity || 0,
        minStockLevel: showcaseProduct.minStockLevel || 5,
        lowStockThreshold: 10, // Default threshold for customer warnings
        inStock: (showcaseProduct.stockQuantity || 0) > 0
      };
      
      console.log(`✅ [INVENTORY] ${productName} inventory:`, inventory);
      return inventory;
      
    } catch (error) {
      console.error(`❌ [INVENTORY] Error getting inventory for ${productName}:`, error);
      return null;
    }
  }
  
  /**
   * Update inventory in showcase_products (single source of truth)
   * Shop products will reference this data
   */
  static async updateProductInventory(
    productName: string, 
    newQuantity: number, 
    reason: string
  ): Promise<boolean> {
    try {
      console.log(`📦 [INVENTORY] Updating inventory for: ${productName}`);
      console.log(`   New Quantity: ${newQuantity}`);
      console.log(`   Reason: ${reason}`);
      
      // Find showcase product
      const showcaseProducts = await storage.getProducts();
      const showcaseProduct = showcaseProducts.find(p => p.name === productName);
      
      if (!showcaseProduct) {
        console.log(`❌ [INVENTORY] Product ${productName} not found in showcase_products`);
        return false;
      }
      
      // Update showcase inventory (single source of truth)
      await storage.updateProduct(showcaseProduct.id, { stockQuantity: newQuantity });
      
      console.log(`✅ [INVENTORY] Updated ${productName} inventory to ${newQuantity}`);
      return true;
      
    } catch (error) {
      console.error(`❌ [INVENTORY] Error updating inventory for ${productName}:`, error);
      return false;
    }
  }
  
  /**
   * Get all products with their unified inventory
   * Only returns products that are actually available for sale in the shop
   */
  static async getAllProductsWithInventory(): Promise<any[]> {
    try {
      console.log(`📦 [INVENTORY] Getting all shop products with unified inventory`);
      
      // Get shop products (these are the products actually for sale)
      const shopProducts = await shopStorage.getShopProducts();
      
      // Get showcase products (for inventory data)
      const showcaseProducts = await storage.getProducts();
      
      // Only include products that exist in the shop (actually for sale)
      const unifiedProducts = shopProducts.map(shopProduct => {
        const showcaseProduct = showcaseProducts.find(sp => sp.name === shopProduct.name);
        
        return {
          id: shopProduct.id,
          name: shopProduct.name,
          category: shopProduct.category,
          // Use showcase inventory as single source of truth if available, otherwise shop inventory
          stockQuantity: showcaseProduct?.stockQuantity || shopProduct.stockQuantity || 0,
          minStockLevel: showcaseProduct?.minStockLevel || shopProduct.minStockLevel || 5,
          lowStockThreshold: shopProduct.lowStockThreshold || 10,
          inStock: (showcaseProduct?.stockQuantity || shopProduct.stockQuantity || 0) > 0,
          // Shop pricing and product data
          shopPrice: shopProduct.price,
          shopSku: shopProduct.sku,
          shopId: shopProduct.id,
          priceUnit: shopProduct.priceUnit,
          description: shopProduct.description
        };
      });
      
      console.log(`✅ [INVENTORY] Retrieved ${unifiedProducts.length} shop products with unified inventory`);
      return unifiedProducts;
      
    } catch (error) {
      console.error(`❌ [INVENTORY] Error getting unified products:`, error);
      return [];
    }
  }
  
  /**
   * Get batch info for a specific order
   * Returns detailed batch information including waste calculations
   */
  static async getBatchInfoForOrder(orderId: number): Promise<any[]> {
    try {
      console.log(`📊 [BATCH INFO] Getting batch information for order ${orderId}`);
      
      const batchSales = await db.select().from(batchSalesTracking).where(eq(batchSalesTracking.orderId, orderId));
      
      console.log(`✅ [BATCH INFO] Found ${batchSales.length} batch records for order ${orderId}`);
      return batchSales;
      
    } catch (error) {
      console.error(`❌ [BATCH INFO] Error getting batch info for order ${orderId}:`, error);
      return [];
    }
  }

  /**
   * Reduce inventory when order is placed using FIFO batch management
   * This is the single point for inventory reduction
   */
  static async reduceInventoryForOrder(orderItems: any[]): Promise<boolean> {
    try {
      console.log(`📦 [INVENTORY] Reducing inventory for order with ${orderItems.length} items using FIFO batch management`);
      
      // Import shop storage for FIFO functionality
      const { ShopStorage } = await import('./shop-storage');
      const shopStorage = new ShopStorage();
      
      for (const item of orderItems) {
        // Get current inventory
        const currentInventory = await this.getProductInventory(item.productName);
        
        if (!currentInventory) {
          console.log(`❌ [INVENTORY] Cannot find product: ${item.productName}`);
          continue;
        }
        
        // Use FIFO batch management if product has barcode
        if (currentInventory.barcode) {
          console.log(`📦 [INVENTORY] Using FIFO batch system for ${item.productName} (${currentInventory.barcode})`);
          
          const fifoResult = await shopStorage.reduceInventoryFIFO(
            currentInventory.barcode,
            item.quantity,
            `Order sale: ${item.quantity} units sold`
          );
          
          if (fifoResult.success) {
            console.log(`✅ [FIFO] Successfully reduced ${item.quantity} units from ${fifoResult.affectedBatches.length} batches`);
            
            // Show batch details
            for (const batch of fifoResult.affectedBatches) {
              console.log(`  📦 Batch ${batch.batchNumber}: ${batch.previousStock} → ${batch.newStock} (reduced ${batch.reducedQuantity})`);
            }
          } else {
            console.log(`❌ [FIFO] Failed to reduce inventory for ${item.productName} - insufficient stock`);
          }
        } else {
          // Fallback to traditional inventory reduction if no barcode
          console.log(`📦 [INVENTORY] Using traditional inventory reduction for ${item.productName} (no barcode)`);
          
          const newQuantity = Math.max(0, currentInventory.stockQuantity - item.quantity);
          
          console.log(`📦 [INVENTORY] ${item.productName}:`);
          console.log(`   Current: ${currentInventory.stockQuantity}`);
          console.log(`   Ordered: ${item.quantity}`);
          console.log(`   New: ${newQuantity}`);
          
          // Update inventory
          await this.updateProductInventory(
            item.productName,
            newQuantity,
            `Order sale: ${item.quantity} units sold`
          );
        }
      }
      
      console.log(`✅ [INVENTORY] Successfully reduced inventory for all order items using FIFO batch management`);
      return true;
      
    } catch (error) {
      console.error(`❌ [INVENTORY] Error reducing inventory for order:`, error);
      return false;
    }
  }

  /**
   * FIFO inventory reduction helper method
   */
  static async reduceInventoryFIFO(barcode: string, quantity: number, reason: string): Promise<{ 
    success: boolean; 
    batchesUsed: any[]; 
    totalReduced: number 
  }> {
    try {
      // Use shop storage FIFO method
      const { ShopStorage } = await import('./shop-storage');
      const shopStorage = new ShopStorage();
      
      const result = await shopStorage.reduceInventoryFIFO(barcode, quantity, reason);
      
      return {
        success: result.success,
        batchesUsed: result.affectedBatches,
        totalReduced: result.success ? quantity : 0
      };
      
    } catch (error) {
      console.error('Error in FIFO inventory reduction:', error);
      return { success: false, batchesUsed: [], totalReduced: 0 };
    }
  }

  /**
   * Sync inventory from shop to showcase (for compatibility with existing system)
   * This ensures any updates in shop table are reflected in showcase table
   */
  static async syncFromShopToShowcase(): Promise<boolean> {
    try {
      console.log(`📦 [SYNC] Starting shop→showcase inventory sync...`);
      
      const { db } = await import("./db");
      const { shopProducts } = await import("../shared/shop-schema");
      const { showcaseProducts } = await import("../shared/showcase-schema");
      const { eq } = await import("drizzle-orm");
      
      // Get all shop products
      const shopProductsData = await db.select().from(shopProducts);
      console.log(`📦 [SYNC] Found ${shopProductsData.length} shop products to sync`);
      
      let synced = 0;
      for (const shopProduct of shopProductsData) {
        try {
          // Find corresponding showcase product by name
          const showcaseProduct = await db.select()
            .from(showcaseProducts)
            .where(eq(showcaseProducts.name, shopProduct.name))
            .limit(1);
          
          if (showcaseProduct.length > 0) {
            // Update showcase inventory with shop data
            await db.update(showcaseProducts)
              .set({ 
                stockQuantity: shopProduct.stockQuantity || 0,
                minStockLevel: shopProduct.minStockLevel || 5,
                updatedAt: new Date()
              })
              .where(eq(showcaseProducts.id, showcaseProduct[0].id));
            
            console.log(`✓ [SYNC] ${shopProduct.name}: shop(${shopProduct.stockQuantity}) → showcase`);
            synced++;
          } else {
            console.log(`⚠ [SYNC] No showcase product found for: ${shopProduct.name}`);
          }
        } catch (error) {
          console.error(`✗ [SYNC] Error syncing ${shopProduct.name}:`, error);
        }
      }
      
      console.log(`✅ [SYNC] Completed shop→showcase sync. ${synced}/${shopProductsData.length} products synced`);
      return true;
      
    } catch (error) {
      console.error(`❌ [SYNC] Error in shop→showcase sync:`, error);
      return false;
    }
  }
  /**
   * Get detailed inventory with batch information for all products
   * Returns inventory breakdown by batch for each product
   */
  static async getDetailedInventoryWithBatches(): Promise<{
    productName: string;
    barcode: string;
    totalStock: number;
    currentSellingBatch: string;
    batches: {
      batchNumber: string;
      stock: number;
      createdAt: Date;
      isActive: boolean;
      notes?: string;
    }[];
  }[]> {
    try {
      console.log(`📦 [INVENTORY] Getting detailed inventory with batch information from کاردکس...`);
      
      // Get all products with batch information from showcase_products (کاردکس) - consolidated view
      const { pool } = await import('./db');
      const result = await pool.query(`
        SELECT 
          name as product_name,
          barcode,
          batch_number,
          stock_quantity,
          created_at
        FROM showcase_products 
        WHERE barcode IS NOT NULL AND barcode != ''
        ORDER BY barcode, created_at DESC
      `);
      
      console.log(`📦 [INVENTORY] Found ${result.rows.length} batch entries from کاردکس`);
      
      // Group by barcode to consolidate batches under one product card
      const inventoryMap = new Map<string, {
        productName: string;
        barcode: string;
        totalStock: number;
        currentSellingBatch: string;
        batches: {
          batchNumber: string;
          stock: number;
          createdAt: Date;
          isActive: boolean;
          notes?: string;
        }[];
      }>();
      
      // Process each batch entry
      for (const row of result.rows) {
        const barcode = row.barcode;
        const batchNumber = row.batch_number || 'بدون شماره';
        const stock = parseInt(row.stock_quantity) || 0;
        const createdAt = new Date(row.created_at);
        
        console.log(`📦 [INVENTORY] Processing batch: ${batchNumber}, stock: ${stock}, barcode: ${barcode}`);
        
        if (!inventoryMap.has(barcode)) {
          inventoryMap.set(barcode, {
            productName: row.product_name,
            barcode,
            totalStock: 0,
            currentSellingBatch: 'بدون شماره',
            batches: []
          });
        }
        
        const inventoryItem = inventoryMap.get(barcode)!;
        inventoryItem.totalStock += stock;
        
        inventoryItem.batches.push({
          batchNumber,
          stock,
          createdAt,
          isActive: false, // Will be set correctly after processing all batches
          notes: undefined
        });
      }
      
      // Now determine the active batch for each product (LIFO - newest with stock > 0)
      for (const [barcode, inventoryItem] of inventoryMap) {
        // Sort batches by creation date (newest first)
        inventoryItem.batches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Find the first batch with stock > 0 (newest = LIFO)
        const activeBatch = inventoryItem.batches.find(batch => batch.stock > 0);
        
        if (activeBatch) {
          activeBatch.isActive = true;
          activeBatch.notes = 'دسته فعال (LIFO)';
          inventoryItem.currentSellingBatch = activeBatch.batchNumber;
        }
      }
      
      // Filter out products with no stock
      const resultArray = Array.from(inventoryMap.values()).filter(item => item.totalStock > 0);
      
      console.log(`✅ [INVENTORY] Consolidated ${resultArray.length} products with batch details`);
      
      // Log sample for debugging
      if (resultArray.length > 0) {
        console.log(`✅ [INVENTORY] Sample consolidated product:`, {
          name: resultArray[0].productName,
          barcode: resultArray[0].barcode,
          totalStock: resultArray[0].totalStock,
          currentBatch: resultArray[0].currentSellingBatch,
          batchCount: resultArray[0].batches.length
        });
      }
      
      return resultArray;
      
    } catch (error) {
      console.error(`❌ [INVENTORY] Error getting detailed inventory with batches:`, error);
      return [];
    }
  }

  /**
   * Get batch details for a specific product by barcode
   * Returns all batches for that product with quantities
   */
  static async getProductBatchDetails(barcode: string): Promise<{
    productName: string;
    barcode: string;
    totalStock: number;
    batches: {
      batchNumber: string;
      stock: number;
      createdAt: Date;
      notes?: string;
    }[];
  } | null> {
    try {
      console.log(`📦 [INVENTORY] Getting batch details for barcode: ${barcode}`);
      
      const { db } = await import("./db");
      const { batchSalesTracking, shopProducts } = await import("../shared/shop-schema");
      const { eq } = await import("drizzle-orm");
      
      // Get product name
      const product = await db.select({ name: shopProducts.name })
        .from(shopProducts)
        .where(eq(shopProducts.barcode, barcode))
        .limit(1);
      
      if (product.length === 0) {
        console.log(`❌ [INVENTORY] Product with barcode ${barcode} not found`);
        return null;
      }
      
      const productName = product[0].name;
      
      // Get all batches for this product
      const batches = await db.select({
        batchNumber: batchSalesTracking.batchNumber,
        stock: batchSalesTracking.stockQuantity,
        createdAt: batchSalesTracking.createdAt,
        notes: batchSalesTracking.notes
      })
      .from(batchSalesTracking)
      .where(eq(batchSalesTracking.barcode, barcode))
      .orderBy(batchSalesTracking.createdAt);
      
      const totalStock = batches.reduce((sum, batch) => sum + (batch.stock || 0), 0);
      
      const result = {
        productName,
        barcode,
        totalStock,
        batches: batches.map(batch => ({
          batchNumber: batch.batchNumber,
          stock: batch.stock || 0,
          createdAt: batch.createdAt,
          notes: batch.notes || undefined
        }))
      };
      
      console.log(`✅ [INVENTORY] Found ${batches.length} batches for ${productName} (Total: ${totalStock})`);
      return result;
      
    } catch (error) {
      console.error(`❌ [INVENTORY] Error getting batch details for ${barcode}:`, error);
      return null;
    }
  }

  /**
   * Process order with batch tracking
   * Uses FIFO inventory reduction and tracks batch usage
   */
  static async processOrderWithBatchTracking(
    productId: number,
    quantityToSell: number,
    orderId: number,
    notes?: string
  ): Promise<{ success: boolean; batchesUsed: any[]; totalReduced: number }> {
    try {
      console.log(`🛒 [ORDER PROCESSING] Processing order ${orderId} for product ${productId}, quantity: ${quantityToSell}`);
      
      const { db } = await import("./db");
      const { shopProducts } = await import("../shared/shop-schema");
      const { eq } = await import("drizzle-orm");
      
      // Get product details
      const product = await db.select()
        .from(shopProducts)
        .where(eq(shopProducts.id, productId))
        .limit(1);
      
      if (product.length === 0) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      const productData = product[0];
      
      // Check if product has barcode for batch tracking
      if (!productData.barcode) {
        console.log(`Product ${productId} has no barcode, using simple stock reduction`);
        
        // Update stock directly
        await db.update(shopProducts)
          .set({ stockQuantity: Math.max(0, (productData.stockQuantity || 0) - quantityToSell) })
          .where(eq(shopProducts.id, productId));
        
        return {
          success: true,
          batchesUsed: [],
          totalReduced: quantityToSell
        };
      }
      
      // Use FIFO inventory reduction with batch tracking
      const result = await this.reduceInventoryFIFO(
        productData.barcode,
        quantityToSell,
        notes || `Order ${orderId} processing`
      );
      
      console.log(`✅ [ORDER PROCESSING] FIFO inventory reduction completed for order ${orderId}`);
      
      return {
        success: true,
        batchesUsed: result.batchesUsed || [],
        totalReduced: result.totalReduced || quantityToSell
      };
      
    } catch (error) {
      console.error(`❌ [ORDER PROCESSING] Error processing order ${orderId}:`, error);
      throw error;
    }
  }
}

// Export functions for compatibility
export async function syncFromShopToShowcase(): Promise<boolean> {
  return UnifiedInventoryManager.syncFromShopToShowcase();
}

// Export unified inventory manager instance
export const unifiedInventoryManager = new UnifiedInventoryManager();