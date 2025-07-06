/**
 * Comprehensive Inventory Synchronization Manager
 * Ensures perfect bidirectional sync between showcase and shop inventories
 */

import { storage } from "./storage";
import { shopStorage } from "./shop-storage";

export class InventorySyncManager {
  
  /**
   * Force sync shop inventory to showcase (Shop → Showcase)
   */
  static async syncShopToShowcase(shopProductId: number): Promise<void> {
    try {
      console.log(`🔄 [SYNC] Starting Shop → Showcase sync for product ID: ${shopProductId}`);
      
      // Get shop product
      const shopProduct = await shopStorage.getShopProductById(shopProductId);
      if (!shopProduct) {
        console.log(`❌ [SYNC] Shop product ${shopProductId} not found`);
        return;
      }
      
      // Find matching showcase product by name
      const showcaseProducts = await storage.getProducts();
      const matchingShowcaseProduct = showcaseProducts.find(p => p.name === shopProduct.name);
      
      if (!matchingShowcaseProduct) {
        console.log(`❌ [SYNC] No matching showcase product found for: ${shopProduct.name}`);
        return;
      }
      
      // Update showcase inventory
      await storage.updateProduct(matchingShowcaseProduct.id, {
        stockQuantity: shopProduct.stockQuantity,
        minStockLevel: shopProduct.minStockLevel || matchingShowcaseProduct.minStockLevel
      });
      
      console.log(`✅ [SYNC] Shop → Showcase: ${shopProduct.name} inventory updated to ${shopProduct.stockQuantity}`);
      
    } catch (error) {
      console.error(`❌ [SYNC] Error in Shop → Showcase sync:`, error);
    }
  }
  
  /**
   * Force sync showcase inventory to shop (Showcase → Shop)
   */
  static async syncShowcaseToShop(showcaseProductId: number): Promise<void> {
    try {
      console.log(`🔄 [SYNC] Starting Showcase → Shop sync for product ID: ${showcaseProductId}`);
      
      // Get showcase product
      const showcaseProduct = await storage.getProductById(showcaseProductId);
      if (!showcaseProduct) {
        console.log(`❌ [SYNC] Showcase product ${showcaseProductId} not found`);
        return;
      }
      
      // Find matching shop product by name
      const shopProducts = await shopStorage.getShopProducts();
      const matchingShopProduct = shopProducts.find(p => p.name === showcaseProduct.name);
      
      if (!matchingShopProduct) {
        console.log(`❌ [SYNC] No matching shop product found for: ${showcaseProduct.name}`);
        return;
      }
      
      // Update shop inventory
      await shopStorage.updateProductStock(
        matchingShopProduct.id,
        showcaseProduct.stockQuantity || 0,
        `Synced from showcase product ${showcaseProductId}`
      );
      
      console.log(`✅ [SYNC] Showcase → Shop: ${showcaseProduct.name} inventory updated to ${showcaseProduct.stockQuantity}`);
      
    } catch (error) {
      console.error(`❌ [SYNC] Error in Showcase → Shop sync:`, error);
    }
  }
  
  /**
   * Bidirectional sync - ensure both inventories match
   */
  static async forceBidirectionalSync(): Promise<void> {
    try {
      console.log(`🔄 [SYNC] Starting FULL bidirectional inventory sync`);
      
      const showcaseProducts = await storage.getProducts();
      const shopProducts = await shopStorage.getShopProducts();
      
      let syncCount = 0;
      
      for (const showcaseProduct of showcaseProducts) {
        const matchingShopProduct = shopProducts.find(p => p.name === showcaseProduct.name);
        
        if (matchingShopProduct) {
          const showcaseStock = showcaseProduct.stockQuantity || 0;
          const shopStock = matchingShopProduct.stockQuantity || 0;
          
          if (showcaseStock !== shopStock) {
            console.log(`🔄 [SYNC] Mismatch found for ${showcaseProduct.name}:`);
            console.log(`   Showcase: ${showcaseStock}, Shop: ${shopStock}`);
            
            // Use showcase as source of truth
            await shopStorage.updateProductStock(
              matchingShopProduct.id,
              showcaseStock,
              `Bidirectional sync - aligned with showcase`
            );
            
            console.log(`✅ [SYNC] ${showcaseProduct.name} shop inventory updated to ${showcaseStock}`);
            syncCount++;
          }
        }
      }
      
      console.log(`✅ [SYNC] Bidirectional sync completed. ${syncCount} products synchronized.`);
      
    } catch (error) {
      console.error(`❌ [SYNC] Error in bidirectional sync:`, error);
    }
  }
  
  /**
   * Sync specific product by name across both systems
   */
  static async syncProductByName(productName: string): Promise<void> {
    try {
      console.log(`🔄 [SYNC] Syncing product by name: ${productName}`);
      
      const showcaseProducts = await storage.getProducts();
      const shopProducts = await shopStorage.getShopProducts();
      
      const showcaseProduct = showcaseProducts.find(p => p.name === productName);
      const shopProduct = shopProducts.find(p => p.name === productName);
      
      if (!showcaseProduct || !shopProduct) {
        console.log(`❌ [SYNC] Product ${productName} not found in both systems`);
        return;
      }
      
      const showcaseStock = showcaseProduct.stockQuantity || 0;
      const shopStock = shopProduct.stockQuantity || 0;
      
      if (showcaseStock !== shopStock) {
        // Use showcase as master
        await shopStorage.updateProductStock(
          shopProduct.id,
          showcaseStock,
          `Sync by name - aligned with showcase`
        );
        
        console.log(`✅ [SYNC] ${productName} synchronized: Shop updated to ${showcaseStock}`);
      } else {
        console.log(`✅ [SYNC] ${productName} already synchronized (${showcaseStock} units)`);
      }
      
    } catch (error) {
      console.error(`❌ [SYNC] Error syncing product ${productName}:`, error);
    }
  }
}