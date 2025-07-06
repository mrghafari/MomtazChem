import { db } from './db';
import { showcaseProducts, shopProducts } from '../shared/schema';
import { eq } from 'drizzle-orm';

export class StockSynchronizer {
  /**
   * Synchronize stock between showcase and shop databases
   * Shop database is considered the source of truth for stock quantities
   */
  async syncStockFromShopToShowcase() {
    try {
      // Get all products from shop database
      const shopItems = await db.select().from(shopProducts);
      
      const syncResults = {
        updated: 0,
        errors: 0,
        skipped: 0
      };

      for (const shopItem of shopItems) {
        try {
          // Find matching product in showcase by SKU or name
          const showcaseItem = await db.select()
            .from(showcaseProducts)
            .where(eq(showcaseProducts.sku, shopItem.sku))
            .limit(1);

          if (showcaseItem.length > 0) {
            // Update showcase stock to match shop stock
            await db.update(showcaseProducts)
              .set({
                stock_quantity: shopItem.stock_quantity,
                updated_at: new Date()
              })
              .where(eq(showcaseProducts.id, showcaseItem[0].id));
              
            syncResults.updated++;
            console.log(`✅ Synced stock for ${shopItem.name}: ${shopItem.stock_quantity} units`);
          } else {
            syncResults.skipped++;
            console.log(`⚠️  No matching showcase product found for shop item: ${shopItem.name}`);
          }
        } catch (error) {
          syncResults.errors++;
          console.error(`❌ Error syncing ${shopItem.name}:`, error);
        }
      }

      console.log(`\n📊 Stock sync completed:
        - Updated: ${syncResults.updated} products
        - Skipped: ${syncResults.skipped} products  
        - Errors: ${syncResults.errors} products`);

      return syncResults;
    } catch (error) {
      console.error('❌ Stock synchronization failed:', error);
      throw error;
    }
  }

  /**
   * Sync stock in the opposite direction (showcase to shop)
   * Used when showcase is the source of truth
   */
  async syncStockFromShowcaseToShop() {
    try {
      const showcaseItems = await db.select().from(showcaseProducts);
      
      const syncResults = {
        updated: 0,
        errors: 0,
        skipped: 0
      };

      for (const showcaseItem of showcaseItems) {
        try {
          const shopItem = await db.select()
            .from(shopProducts)
            .where(eq(shopProducts.sku, showcaseItem.sku))
            .limit(1);

          if (shopItem.length > 0) {
            await db.update(shopProducts)
              .set({
                stock_quantity: showcaseItem.stock_quantity,
                updated_at: new Date()
              })
              .where(eq(shopProducts.id, shopItem[0].id));
              
            syncResults.updated++;
            console.log(`✅ Synced stock for ${showcaseItem.name}: ${showcaseItem.stock_quantity} units`);
          } else {
            syncResults.skipped++;
            console.log(`⚠️  No matching shop product found for showcase item: ${showcaseItem.name}`);
          }
        } catch (error) {
          syncResults.errors++;
          console.error(`❌ Error syncing ${showcaseItem.name}:`, error);
        }
      }

      return syncResults;
    } catch (error) {
      console.error('❌ Stock synchronization failed:', error);
      throw error;
    }
  }

  /**
   * Get stock discrepancies between databases
   */
  async getStockDiscrepancies() {
    try {
      const showcaseItems = await db.select().from(showcaseProducts);
      const shopItems = await db.select().from(shopProducts);
      
      const discrepancies = [];

      for (const showcaseItem of showcaseItems) {
        const matchingShopItem = shopItems.find(shop => shop.sku === showcaseItem.sku);
        
        if (matchingShopItem) {
          if (showcaseItem.stock_quantity !== matchingShopItem.stock_quantity) {
            discrepancies.push({
              name: showcaseItem.name,
              sku: showcaseItem.sku,
              showcase_stock: showcaseItem.stock_quantity,
              shop_stock: matchingShopItem.stock_quantity,
              difference: showcaseItem.stock_quantity - matchingShopItem.stock_quantity
            });
          }
        }
      }

      return discrepancies;
    } catch (error) {
      console.error('❌ Error checking stock discrepancies:', error);
      throw error;
    }
  }
}

export const stockSynchronizer = new StockSynchronizer();