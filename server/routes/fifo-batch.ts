import { Router } from "express";
import FIFOBatchManager from "../fifo-batch-manager";

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

export default router;