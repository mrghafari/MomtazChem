import { db } from "./db";
import { eq, and, gt, sql, desc, asc } from "drizzle-orm";
import { showcaseProducts } from "@shared/showcase-schema";
import { shopProducts } from "@shared/shop-schema";

/**
 * FIFO Batch Management System
 * Handles First In, First Out inventory management for products with batches
 */
export class FIFOBatchManager {
  
  /**
   * Get all batches for a product ordered by FIFO (oldest first)
   * @param productName - Name of the product to get batches for
   * @returns Array of batches sorted by creation date (oldest first)
   */
  static async getBatchesFIFO(productName: string): Promise<any[]> {
    try {
      console.log(`📦 [FIFO] Getting batches for product: ${productName}`);
      
      // Get batches from showcase_products (کاردکس) ordered by creation date (FIFO)
      const batches = await db
        .select({
          id: showcaseProducts.id,
          name: showcaseProducts.name,
          batchNumber: showcaseProducts.batchNumber,
          stockQuantity: showcaseProducts.stockQuantity,
          unitPrice: showcaseProducts.unitPrice,
          currency: showcaseProducts.currency,
          expiryDate: showcaseProducts.expiryDate,
          createdAt: showcaseProducts.createdAt,
          barcode: showcaseProducts.barcode,
          weight: showcaseProducts.weight,
          weightUnit: showcaseProducts.weightUnit
        })
        .from(showcaseProducts)
        .where(
          and(
            eq(showcaseProducts.name, productName),
            gt(showcaseProducts.stockQuantity, 0) // Only show batches with stock
          )
        )
        .orderBy(asc(showcaseProducts.createdAt)); // FIFO: oldest first
      
      console.log(`📦 [FIFO] Found ${batches.length} batches for ${productName}`);
      
      return batches.map((batch, index) => ({
        ...batch,
        fifoOrder: index + 1, // Add FIFO position for display
        isOldest: index === 0, // Mark the oldest batch
        willSellNext: index === 0 ? "اولین مورد برای فروش" : `ردیف ${index + 1} در نوبت فروش`
      }));
      
    } catch (error) {
      console.error(`❌ [FIFO] Error getting batches for ${productName}:`, error);
      return [];
    }
  }
  
  /**
   * Get total stock across all batches for a product
   * @param productName - Name of the product
   * @returns Total stock quantity across all batches
   */
  static async getTotalStock(productName: string): Promise<number> {
    try {
      const result = await db
        .select({
          totalStock: sql<number>`SUM(${showcaseProducts.stockQuantity})`
        })
        .from(showcaseProducts)
        .where(
          and(
            eq(showcaseProducts.name, productName),
            gt(showcaseProducts.stockQuantity, 0)
          )
        );
      
      return result[0]?.totalStock || 0;
    } catch (error) {
      console.error(`❌ [FIFO] Error getting total stock for ${productName}:`, error);
      return 0;
    }
  }
  
  /**
   * Process order using FIFO batch allocation
   * @param productName - Name of the product
   * @param quantityNeeded - Quantity to allocate
   * @param orderId - Order ID for tracking
   * @returns Allocation details including which batches were used
   */
  static async allocateInventoryFIFO(
    productName: string, 
    quantityNeeded: number, 
    orderId?: string
  ): Promise<{
    success: boolean;
    batchesUsed: any[];
    totalAllocated: number;
    remainingNeeded: number;
    message: string;
  }> {
    try {
      console.log(`🛒 [FIFO-ALLOCATION] Allocating ${quantityNeeded} units of ${productName} using FIFO`);
      
      // Get batches in FIFO order (oldest first)
      const availableBatches = await this.getBatchesFIFO(productName);
      
      if (availableBatches.length === 0) {
        return {
          success: false,
          batchesUsed: [],
          totalAllocated: 0,
          remainingNeeded: quantityNeeded,
          message: `هیچ بچی برای محصول ${productName} موجود نیست`
        };
      }
      
      let remainingNeeded = quantityNeeded;
      let totalAllocated = 0;
      const batchesUsed: any[] = [];
      
      // Allocate from oldest batches first (FIFO)
      for (const batch of availableBatches) {
        if (remainingNeeded <= 0) break;
        
        const availableInBatch = batch.stockQuantity;
        const quantityFromThisBatch = Math.min(remainingNeeded, availableInBatch);
        
        if (quantityFromThisBatch > 0) {
          // Record batch usage
          batchesUsed.push({
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            quantityUsed: quantityFromThisBatch,
            remainingInBatch: availableInBatch - quantityFromThisBatch,
            createdAt: batch.createdAt,
            expiryDate: batch.expiryDate
          });
          
          // Update remaining quantities
          remainingNeeded -= quantityFromThisBatch;
          totalAllocated += quantityFromThisBatch;
          
          console.log(`📦 [FIFO] Allocated ${quantityFromThisBatch} from batch ${batch.batchNumber}`);
        }
      }
      
      const allocationComplete = remainingNeeded === 0;
      
      return {
        success: allocationComplete,
        batchesUsed,
        totalAllocated,
        remainingNeeded,
        message: allocationComplete 
          ? `تخصیص کامل: ${totalAllocated} واحد از ${batchesUsed.length} بچ`
          : `تخصیص ناقص: ${totalAllocated} واحد تخصیص یافت، ${remainingNeeded} واحد کم است`
      };
      
    } catch (error: any) {
      console.error(`❌ [FIFO-ALLOCATION] Error allocating inventory for ${productName}:`, error);
      return {
        success: false,
        batchesUsed: [],
        totalAllocated: 0,
        remainingNeeded: quantityNeeded,
        message: `خطا در تخصیص موجودی: ${error?.message || 'خطای نامشخص'}`
      };
    }
  }
  
  /**
   * Actually reduce inventory from batches (commit the allocation)
   * @param allocationResult - Result from allocateInventoryFIFO
   * @param orderId - Order ID for tracking
   * @returns Success status and details
   */
  static async commitAllocation(
    allocationResult: any,
    orderId?: string
  ): Promise<{ success: boolean; message: string; updatedBatches: any[] }> {
    if (!allocationResult.success || allocationResult.batchesUsed.length === 0) {
      return {
        success: false,
        message: "هیچ تخصیصی برای اعمال وجود ندارد",
        updatedBatches: []
      };
    }
    
    const updatedBatches: any[] = [];
    
    try {
      // Reduce stock from each batch used
      for (const batchUsage of allocationResult.batchesUsed) {
        const newStockQuantity = batchUsage.remainingInBatch;
        
        await db
          .update(showcaseProducts)
          .set({ 
            stockQuantity: newStockQuantity,
            lastRestockDate: new Date() // Update last modified
          })
          .where(eq(showcaseProducts.id, batchUsage.batchId));
        
        updatedBatches.push({
          batchId: batchUsage.batchId,
          batchNumber: batchUsage.batchNumber,
          quantityReduced: batchUsage.quantityUsed,
          newStockQuantity,
          orderId
        });
        
        console.log(`✅ [FIFO-COMMIT] Reduced ${batchUsage.quantityUsed} from batch ${batchUsage.batchNumber}, new stock: ${newStockQuantity}`);
      }
      
      return {
        success: true,
        message: `موجودی ${allocationResult.totalAllocated} واحد از ${allocationResult.batchesUsed.length} بچ کاهش یافت`,
        updatedBatches
      };
      
    } catch (error: any) {
      console.error(`❌ [FIFO-COMMIT] Error committing allocation:`, error);
      return {
        success: false,
        message: `خطا در اعمال تغییرات موجودی: ${error?.message || 'خطای نامشخص'}`,
        updatedBatches: []
      };
    }
  }
  
  /**
   * Complete FIFO inventory reduction in one step
   * @param productName - Product name
   * @param quantity - Quantity to reduce
   * @param orderId - Order ID for tracking
   * @returns Complete result including allocation and reduction
   */
  static async reduceInventoryFIFO(
    productName: string,
    quantity: number,
    orderId?: string
  ): Promise<{
    success: boolean;
    message: string;
    allocation: any;
    commitment: any;
  }> {
    console.log(`🛒 [FIFO-COMPLETE] Starting FIFO inventory reduction for ${productName}, quantity: ${quantity}`);
    
    // Step 1: Allocate inventory using FIFO
    const allocation = await this.allocateInventoryFIFO(productName, quantity, orderId);
    
    if (!allocation.success) {
      return {
        success: false,
        message: allocation.message,
        allocation,
        commitment: null
      };
    }
    
    // Step 2: Commit the allocation (actually reduce stock)
    const commitment = await this.commitAllocation(allocation, orderId);
    
    return {
      success: commitment.success,
      message: commitment.success 
        ? `فروش FIFO موفق: ${allocation.totalAllocated} واحد از ${allocation.batchesUsed.length} بچ`
        : commitment.message,
      allocation,
      commitment
    };
  }
  
  /**
   * Get batch information for display on product cards
   * @param productName - Product name
   * @returns Formatted batch information for UI display
   */
  static async getBatchInfoForDisplay(productName: string): Promise<{
    totalStock: number;
    batchCount: number;
    oldestBatch: any;
    newestBatch: any;
    nextToSell: any;
    allBatches: any[];
  }> {
    try {
      const batches = await this.getBatchesFIFO(productName);
      const totalStock = await this.getTotalStock(productName);
      
      return {
        totalStock,
        batchCount: batches.length,
        oldestBatch: batches[0] || null,
        newestBatch: batches[batches.length - 1] || null,
        nextToSell: batches[0] || null, // First batch in FIFO order
        allBatches: batches
      };
      
    } catch (error) {
      console.error(`❌ [FIFO-DISPLAY] Error getting batch info for ${productName}:`, error);
      return {
        totalStock: 0,
        batchCount: 0,
        oldestBatch: null,
        newestBatch: null,
        nextToSell: null,
        allBatches: []
      };
    }
  }
}

export default FIFOBatchManager;