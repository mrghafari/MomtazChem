import { db } from "./db";
import { showcaseProducts } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * FIFO (First In, First Out) Batch Manager
 * Shows oldest batch information first - unified FIFO methodology
 * Used for displaying batch info on product cards with FIFO ordering
 */
export class FIFOBatchManager {
  
  /**
   * Get FIFO batch information for a product (oldest first)
   * Used for product card displays showing oldest batch info first
   */
  static async getBatchInfoFIFO(productName: string): Promise<{
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

      // Keep FIFO ordering (oldest first)
      const fifoBatches = [...batches];
      
      console.log(`📦 [FIFO] Found ${fifoBatches.length} batches for ${productName}`);
      
      // Calculate total stock
      const totalStock = fifoBatches.reduce((sum, batch) => sum + (batch.stockQuantity || 0), 0);
      
      // Get oldest and newest batches
      const oldestBatch = fifoBatches[0]; // First in FIFO order (oldest)
      const newestBatch = fifoBatches[fifoBatches.length - 1]; // Last in FIFO order (newest)
      
      // Add FIFO display information
      const enrichedBatches = fifoBatches.map((batch, index) => ({
        ...batch,
        fifoOrder: index + 1, // 1 = oldest, 2 = second oldest, etc.
        isOldest: index === 0,
        isNewest: index === fifoBatches.length - 1,
        displayText: index === 0 
          ? "قدیمی‌ترین بچ - اولین مورد برای فروش" 
          : `ردیف ${index + 1} در نوبت فروش`
      }));
      
      const result = {
        totalStock: totalStock.toString(),
        batchCount: fifoBatches.length,
        oldestBatch: {
          ...oldestBatch,
          fifoOrder: 1,
          isOldest: true,
          displayText: "اولین مورد برای فروش"
        },
        newestBatch: {
          ...newestBatch,
          fifoOrder: fifoBatches.length,
          isNewest: true,
          displayText: `ردیف ${fifoBatches.length} در نوبت فروش`
        },
        nextToSell: {
          ...oldestBatch,
          fifoOrder: 1,
          isOldest: true,
          displayText: "اولین مورد برای فروش"
        },
        allBatches: enrichedBatches
      };
      
      console.log(`✅ [FIFO] Successfully processed ${fifoBatches.length} batches for ${productName}`);
      console.log(`📊 [FIFO] Total stock: ${totalStock}, Oldest: ${oldestBatch.batchNumber}, Newest: ${newestBatch.batchNumber}`);
      
      return {
        success: true,
        data: result
      };
      
    } catch (error: any) {
      console.error(`❌ [FIFO] Error getting FIFO batch info for ${productName}:`, error);
      return {
        success: false,
        message: `خطا در دریافت اطلاعات بچ‌های محصول: ${error?.message || 'خطای نامشخص'}`
      };
    }
  }
  
  /**
   * Get oldest batch information for display purposes
   * Used specifically for showing first batch to sell on product cards
   */
  static async getOldestBatchForDisplay(productName: string): Promise<{
    success: boolean;
    batch?: any;
    message?: string;
  }> {
    try {
      console.log(`🆕 [FIFO-DISPLAY] Getting oldest batch for ${productName}`);
      
      // Get oldest batch (earliest creation date)
      const oldestBatch = await db
        .select()
        .from(showcaseProducts)
        .where(eq(showcaseProducts.name, productName))
        .orderBy(showcaseProducts.createdAt)
        .limit(1);
      
      if (oldestBatch.length === 0) {
        return {
          success: false,
          message: `هیچ بچی برای ${productName} یافت نشد`
        };
      }
      
      const batch = oldestBatch[0];
      
      // Add display information
      const enrichedBatch = {
        ...batch,
        displayText: "قدیمی‌ترین بچ - اولین مورد برای فروش",
        fifoOrder: 1,
        isOldest: true,
        stockStatus: batch.stockQuantity > 0 ? "موجود" : "ناموجود",
        batchAge: this.calculateBatchAge(batch.createdAt)
      };
      
      console.log(`✅ [FIFO-DISPLAY] Found oldest batch: ${batch.batchNumber} with ${batch.stockQuantity} units`);
      
      return {
        success: true,
        batch: enrichedBatch
      };
      
    } catch (error: any) {
      console.error(`❌ [FIFO-DISPLAY] Error getting oldest batch for ${productName}:`, error);
      return {
        success: false,
        message: `خطا در دریافت قدیمی‌ترین بچ: ${error?.message || 'خطای نامشخص'}`
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
   * Get batch statistics for FIFO display
   */
  static async getBatchStatisticsFIFO(productName: string): Promise<{
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
      const batchInfo = await this.getBatchInfoFIFO(productName);
      
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
      console.error(`❌ [FIFO-STATS] Error getting batch statistics:`, error);
      return {
        success: false,
        message: `خطا در محاسبه آمار بچ‌ها: ${error?.message || 'خطای نامشخص'}`
      };
    }
  }
}

export default FIFOBatchManager;