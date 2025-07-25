import { Router } from "express";
import FIFOBatchManager from "../fifo-batch-manager";
import LIFOBatchManager from "../lifo-batch-manager";

const router = Router();

/**
 * Get FIFO batch information for a product
 * GET /api/products/:productName/batches/fifo
 */
router.get("/api/products/:productName/batches/fifo", async (req, res) => {
  try {
    const { productName } = req.params;
    const decodedProductName = decodeURIComponent(productName);
    
    console.log(`📦 [API] Getting FIFO batches for: ${decodedProductName}`);
    
    const batchInfo = await FIFOBatchManager.getBatchInfoForDisplay(decodedProductName);
    
    res.json({
      success: true,
      productName: decodedProductName,
      data: batchInfo
    });
    
  } catch (error) {
    console.error("Error fetching FIFO batch info:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت اطلاعات بچ‌های محصول",
      error: error.message
    });
  }
});

/**
 * Get all batches for a product in FIFO order
 * GET /api/products/:productName/batches/list
 */
router.get("/api/products/:productName/batches/list", async (req, res) => {
  try {
    const { productName } = req.params;
    const decodedProductName = decodeURIComponent(productName);
    
    const batches = await FIFOBatchManager.getBatchesFIFO(decodedProductName);
    
    res.json({
      success: true,
      productName: decodedProductName,
      batches,
      count: batches.length
    });
    
  } catch (error) {
    console.error("Error fetching product batches:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت لیست بچ‌های محصول",
      error: error.message
    });
  }
});

/**
 * Simulate FIFO allocation for an order (without committing)
 * POST /api/products/:productName/batches/allocate-simulate
 */
router.post("/api/products/:productName/batches/allocate-simulate", async (req, res) => {
  try {
    const { productName } = req.params;
    const { quantity, orderId } = req.body;
    const decodedProductName = decodeURIComponent(productName);
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "مقدار نامعتبر است"
      });
    }
    
    const allocation = await FIFOBatchManager.allocateInventoryFIFO(
      decodedProductName,
      quantity,
      orderId
    );
    
    res.json({
      success: true,
      productName: decodedProductName,
      simulation: allocation
    });
    
  } catch (error) {
    console.error("Error simulating FIFO allocation:", error);
    res.status(500).json({
      success: false,
      message: "خطا در شبیه‌سازی تخصیص موجودی",
      error: error.message
    });
  }
});

// === LIFO Batch Management Routes ===

/**
 * Get LIFO batch information for a product (newest first)
 * GET /api/products/:productName/batches/lifo
 */
router.get("/api/products/:productName/batches/lifo", async (req, res) => {
  try {
    const { productName } = req.params;
    const decodedProductName = decodeURIComponent(productName);
    
    console.log(`📦 [API] Getting LIFO batches for: ${decodedProductName}`);
    
    const batchInfo = await LIFOBatchManager.getBatchInfoLIFO(decodedProductName);
    
    if (batchInfo.success) {
      res.json({
        success: true,
        productName: decodedProductName,
        data: batchInfo.data
      });
    } else {
      res.status(404).json({
        success: false,
        message: batchInfo.message || "اطلاعات بچ یافت نشد"
      });
    }
    
  } catch (error: any) {
    console.error("Error fetching LIFO batch info:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت اطلاعات جدیدترین بچ",
      error: error.message
    });
  }
});

/**
 * Get newest batch for display on product cards
 * GET /api/products/:productName/batches/newest
 */
router.get("/api/products/:productName/batches/newest", async (req, res) => {
  try {
    const { productName } = req.params;
    const decodedProductName = decodeURIComponent(productName);
    
    console.log(`🆕 [API] Getting newest batch for: ${decodedProductName}`);
    
    const newestBatch = await LIFOBatchManager.getNewestBatchForDisplay(decodedProductName);
    
    if (newestBatch.success) {
      res.json({
        success: true,
        productName: decodedProductName,
        batch: newestBatch.batch
      });
    } else {
      res.status(404).json({
        success: false,
        message: newestBatch.message || "جدیدترین بچ یافت نشد"
      });
    }
    
  } catch (error: any) {
    console.error("Error fetching newest batch:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت جدیدترین بچ",
      error: error.message
    });
  }
});

/**
 * Get batch statistics for LIFO display
 * GET /api/products/:productName/batches/stats-lifo
 */
router.get("/api/products/:productName/batches/stats-lifo", async (req, res) => {
  try {
    const { productName } = req.params;
    const decodedProductName = decodeURIComponent(productName);
    
    console.log(`📊 [API] Getting LIFO batch statistics for: ${decodedProductName}`);
    
    const stats = await LIFOBatchManager.getBatchStatisticsLIFO(decodedProductName);
    
    if (stats.success) {
      res.json({
        success: true,
        productName: decodedProductName,
        stats: stats.stats
      });
    } else {
      res.status(404).json({
        success: false,
        message: stats.message || "آمار بچ‌ها یافت نشد"
      });
    }
    
  } catch (error: any) {
    console.error("Error fetching batch statistics:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت آمار بچ‌ها",
      error: error.message
    });
  }
});

export default router;