import { db } from "./db";
import { showcaseProducts } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * LIFO (Last In, First Out) Batch Manager
 * Shows newest batch information first - complementary to FIFO system
 * Used for displaying latest batch info on product cards
 */
export class LIFOBatchManager {
  
  /**
   * Get LIFO batch information for a product (newest first)
   * Used for product card displays showing latest batch info
   */
  static async getBatchInfoLIFO(productName: string): Promise<{
    success: boolean;
    data?: {
      totalStock: string;
      batchCount: number;
      newestBatch: any;
      oldestBatch: any;
      nextToShow: any; // For LIFO display - newest batch shown first
      allBatches: any[];
    };
    message?: string;
  }> {
    try {
      console.log(`📦 [LIFO] Getting LIFO batches for product: ${productName}`);
      
      // Get all batches for this product name, ordered by creation date DESC (newest first)
      const batches = await db
        .select()
        .from(showcaseProducts)
        .where(eq(showcaseProducts.name, productName))
        .orderBy(showcaseProducts.createdAt); // We'll reverse this for LIFO
      
      if (batches.length === 0) {
        console.log(`📦 [LIFO] No batches found for ${productName}`);
        return {
          success: false,
          message: `هیچ بچی برای محصول ${productName} یافت نشد`
        };
      }

      // Reverse for LIFO ordering (newest first)
      const lifoBatches = [...batches].reverse();
      
      console.log(`📦 [LIFO] Found ${lifoBatches.length} batches for ${productName}`);
      
      // Calculate total stock
      const totalStock = lifoBatches.reduce((sum, batch) => sum + (batch.stockQuantity || 0), 0);
      
      // Get newest and oldest batches
      const newestBatch = lifoBatches[0]; // First in LIFO order (newest)
      const oldestBatch = lifoBatches[lifoBatches.length - 1]; // Last in LIFO order (oldest)
      
      // Add LIFO display information
      const enrichedBatches = lifoBatches.map((batch, index) => ({
        ...batch,
        lifoOrder: index + 1, // 1 = newest, 2 = second newest, etc.
        isNewest: index === 0,
        isOldest: index === lifoBatches.length - 1,
        displayText: index === 0 
          ? "جدیدترین بچ - اول در نمایش" 
          : `ردیف ${index + 1} در نمایش (${lifoBatches.length - index} روز قدیمی‌تر)`
      }));
      
      const result = {
        totalStock: totalStock.toString(),
        batchCount: lifoBatches.length,
        newestBatch: {
          ...newestBatch,
          lifoOrder: 1,
          isNewest: true,
          displayText: "جدیدترین بچ - اول در نمایش"
        },
        oldestBatch: {
          ...oldestBatch,
          lifoOrder: lifoBatches.length,
          isOldest: true,
          displayText: `قدیمی‌ترین بچ - ردیف ${lifoBatches.length} در نمایش`
        },
        nextToShow: {
          ...newestBatch,
          lifoOrder: 1,
          isNewest: true,
          displayText: "جدیدترین بچ با موجودی"
        },
        allBatches: enrichedBatches
      };
      
      console.log(`✅ [LIFO] Successfully processed ${lifoBatches.length} batches for ${productName}`);
      console.log(`📊 [LIFO] Total stock: ${totalStock}, Newest: ${newestBatch.batchNumber}, Oldest: ${oldestBatch.batchNumber}`);
      
      return {
        success: true,
        data: result
      };
      
    } catch (error: any) {
      console.error(`❌ [LIFO] Error getting LIFO batch info for ${productName}:`, error);
      return {
        success: false,
        message: `خطا در دریافت اطلاعات بچ‌های محصول: ${error?.message || 'خطای نامشخص'}`
      };
    }
  }
  
  /**
   * Get newest batch information for display purposes
   * Used specifically for showing latest batch on product cards
   */
  static async getNewestBatchForDisplay(productName: string): Promise<{
    success: boolean;
    batch?: any;
    message?: string;
  }> {
    try {
      console.log(`🆕 [LIFO-DISPLAY] Getting newest batch for ${productName}`);
      
      // Get newest batch (latest creation date)
      const newestBatch = await db
        .select()
        .from(showcaseProducts)
        .where(eq(showcaseProducts.name, productName))
        .orderBy(showcaseProducts.createdAt)
        .limit(1);
      
      if (newestBatch.length === 0) {
        return {
          success: false,
          message: `هیچ بچی برای ${productName} یافت نشد`
        };
      }
      
      const batch = newestBatch[0];
      
      // Add display information
      const enrichedBatch = {
        ...batch,
        displayText: "جدیدترین بچ با موجودی",
        lifoOrder: 1,
        isNewest: true,
        stockStatus: batch.stockQuantity > 0 ? "موجود" : "ناموجود",
        batchAge: this.calculateBatchAge(batch.createdAt)
      };
      
      console.log(`✅ [LIFO-DISPLAY] Found newest batch: ${batch.batchNumber} with ${batch.stockQuantity} units`);
      
      return {
        success: true,
        batch: enrichedBatch
      };
      
    } catch (error: any) {
      console.error(`❌ [LIFO-DISPLAY] Error getting newest batch for ${productName}:`, error);
      return {
        success: false,
        message: `خطا در دریافت جدیدترین بچ: ${error?.message || 'خطای نامشخص'}`
      };
    }
  }
  
  /**
   * Calculate how many days old a batch is
   */
  private static calculateBatchAge(createdAt: Date | string): string {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "امروز";
    if (diffDays === 1) return "دیروز";
    if (diffDays < 7) return `${diffDays} روز پیش`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} هفته پیش`;
    return `${Math.floor(diffDays / 30)} ماه پیش`;
  }
  
  /**
   * Get batch statistics for LIFO display
   */
  static async getBatchStatisticsLIFO(productName: string): Promise<{
    success: boolean;
    stats?: {
      totalBatches: number;
      totalStock: number;
      newestBatchAge: string;
      oldestBatchAge: string;
      averageStock: number;
    };
    message?: string;
  }> {
    try {
      const batchInfo = await this.getBatchInfoLIFO(productName);
      
      if (!batchInfo.success || !batchInfo.data) {
        return {
          success: false,
          message: batchInfo.message
        };
      }
      
      const { data } = batchInfo;
      const averageStock = Math.round(parseInt(data.totalStock) / data.batchCount);
      
      return {
        success: true,
        stats: {
          totalBatches: data.batchCount,
          totalStock: parseInt(data.totalStock),
          newestBatchAge: this.calculateBatchAge(data.newestBatch.createdAt),
          oldestBatchAge: this.calculateBatchAge(data.oldestBatch.createdAt),
          averageStock
        }
      };
      
    } catch (error: any) {
      console.error(`❌ [LIFO-STATS] Error getting batch statistics:`, error);
      return {
        success: false,
        message: `خطا در محاسبه آمار بچ‌ها: ${error?.message || 'خطای نامشخص'}`
      };
    }
  }
}

export default LIFOBatchManager;