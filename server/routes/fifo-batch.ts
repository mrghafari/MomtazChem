import { Router } from "express";
import { FIFODisplayManager } from "../fifo-display-manager";
import { FIFOBatchManager } from "../fifo-batch-manager";

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
    
  } catch (error: any) {
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
    
  } catch (error: any) {
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
    
  } catch (error: any) {
    console.error("Error simulating FIFO allocation:", error);
    res.status(500).json({
      success: false,
      message: "خطا در شبیه‌سازی تخصیص موجودی",
      error: error.message
    });
  }
});

// === FIFO Display Management Routes ===

/**
 * Get FIFO batch information for display (oldest first)
 * GET /api/products/:productName/batches/display
 */
router.get("/api/products/:productName/batches/display", async (req, res) => {
  try {
    const { productName } = req.params;
    const decodedProductName = decodeURIComponent(productName);
    
    console.log(`📦 [API] Getting FIFO display batches for: ${decodedProductName}`);
    
    const batchInfo = await FIFODisplayManager.getBatchInfoForDisplay(decodedProductName);
    
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
    console.error("Error fetching FIFO display batch info:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت اطلاعات قدیمی‌ترین بچ",
      error: error.message
    });
  }
});

/**
 * Get oldest batch for display on product cards (FIFO first to sell)
 * GET /api/products/:productName/batches/oldest
 */
router.get("/api/products/:productName/batches/oldest", async (req, res) => {
  try {
    const { productName } = req.params;
    const decodedProductName = decodeURIComponent(productName);
    
    console.log(`🆕 [API] Getting oldest batch for: ${decodedProductName}`);
    
    const oldestBatch = await FIFODisplayManager.getOldestBatchForDisplay(decodedProductName);
    
    if (oldestBatch.success) {
      res.json({
        success: true,
        productName: decodedProductName,
        batch: oldestBatch.batch
      });
    } else {
      res.status(404).json({
        success: false,
        message: oldestBatch.message || "قدیمی‌ترین بچ یافت نشد"
      });
    }
    
  } catch (error: any) {
    console.error("Error fetching oldest batch:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت قدیمی‌ترین بچ",
      error: error.message
    });
  }
});

/**
 * Get batch statistics for FIFO display
 * GET /api/products/:productName/batches/stats-fifo
 */
router.get("/api/products/:productName/batches/stats-fifo", async (req, res) => {
  try {
    const { productName } = req.params;
    const decodedProductName = decodeURIComponent(productName);
    
    console.log(`📊 [API] Getting FIFO batch statistics for: ${decodedProductName}`);
    
    const stats = await FIFODisplayManager.getBatchStatisticsFIFO(decodedProductName);
    
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