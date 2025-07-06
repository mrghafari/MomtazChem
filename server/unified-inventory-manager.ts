/**
 * Unified Inventory Management System
 * Makes showcase_products the single source of truth for inventory
 * Shop products will get inventory from showcase_products
 */

import { storage } from "./storage";
import { shopStorage } from "./shop-storage";

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
   * This will be used by both showcase and shop frontends
   */
  static async getAllProductsWithInventory(): Promise<any[]> {
    try {
      console.log(`📦 [INVENTORY] Getting all products with unified inventory`);
      
      // Get showcase products (single source of truth for inventory)
      const showcaseProducts = await storage.getProducts();
      
      // Get shop products (for pricing and SKU info only)
      const shopProducts = await shopStorage.getShopProducts();
      
      // Merge data with showcase_products as inventory source
      const unifiedProducts = showcaseProducts.map(showcaseProduct => {
        const shopProduct = shopProducts.find(sp => sp.name === showcaseProduct.name);
        
        return {
          ...showcaseProduct,
          // Use showcase inventory as single source of truth
          stockQuantity: showcaseProduct.stockQuantity || 0,
          minStockLevel: showcaseProduct.minStockLevel || 5,
          lowStockThreshold: 10, // Default threshold for customer warnings
          inStock: (showcaseProduct.stockQuantity || 0) > 0,
          // Include shop pricing if available
          shopPrice: shopProduct?.price,
          shopSku: shopProduct?.sku,
          shopId: shopProduct?.id
        };
      });
      
      console.log(`✅ [INVENTORY] Retrieved ${unifiedProducts.length} products with unified inventory`);
      return unifiedProducts;
      
    } catch (error) {
      console.error(`❌ [INVENTORY] Error getting unified products:`, error);
      return [];
    }
  }
  
  /**
   * Reduce inventory when order is placed
   * This is the single point for inventory reduction
   */
  static async reduceInventoryForOrder(orderItems: any[]): Promise<boolean> {
    try {
      console.log(`📦 [INVENTORY] Reducing inventory for order with ${orderItems.length} items`);
      
      for (const item of orderItems) {
        // Get current inventory
        const currentInventory = await this.getProductInventory(item.productName);
        
        if (!currentInventory) {
          console.log(`❌ [INVENTORY] Cannot find product: ${item.productName}`);
          continue;
        }
        
        // Calculate new quantity
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
      
      console.log(`✅ [INVENTORY] Successfully reduced inventory for all order items`);
      return true;
      
    } catch (error) {
      console.error(`❌ [INVENTORY] Error reducing inventory for order:`, error);
      return false;
    }
  }
}