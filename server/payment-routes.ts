import { Router } from "express";
import { paymentWorkflow } from "./payment-workflow";

const router = Router();

// =============================================================================
// PAYMENT WORKFLOW ROUTES - مسیرهای سیستم پرداخت
// =============================================================================

// محاسبه گزینه‌های پرداخت
router.post("/payment/preview", async (req, res) => {
  try {
    const { cartItems, shippingCost, customerId } = req.body;
    
    if (!cartItems || typeof cartItems !== 'object') {
      return res.status(400).json({
        success: false,
        message: "اطلاعات سبد خرید نامعتبر است"
      });
    }
    
    const result = await paymentWorkflow.calculatePaymentOptions(
      cartItems,
      parseFloat(shippingCost || "0"),
      customerId
    );
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error("❌ [PAYMENT PREVIEW] Error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در محاسبه گزینه‌های پرداخت",
      error: error.message
    });
  }
});

// ایجاد سفارش با روش پرداخت انتخابی
router.post("/order/create-with-payment", async (req, res) => {
  try {
    const { orderData, paymentMethod } = req.body;
    
    if (!orderData || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "اطلاعات سفارش یا روش پرداخت نامعتبر است"
      });
    }
    
    const order = await paymentWorkflow.createOrderWithPayment(orderData, paymentMethod);
    
    res.json({
      success: true,
      order,
      message: "سفارش با موفقیت ایجاد شد"
    });
    
  } catch (error) {
    console.error("❌ [CREATE ORDER] Error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در ایجاد سفارش",
      error: error.message
    });
  }
});

// لیست سفارشات در انتظار بررسی مالی
router.get("/financial/pending-orders", async (req, res) => {
  try {
    const result = await db.execute(sql`
      SELECT 
        om.*,
        co.order_number,
        co.total_amount,
        co.customer_id,
        COALESCE(cc.first_name || ' ' || cc.last_name, c.email) as customer_name
      FROM order_management om
      LEFT JOIN customer_orders co ON om.customer_order_id = co.id
      LEFT JOIN crm_customers cc ON co.customer_id = cc.id
      LEFT JOIN customers c ON co.customer_id = c.id
      WHERE om.current_status IN ('financial_reviewing', 'payment_grace_period', 'payment_uploaded')
      ORDER BY om.created_at ASC
    `);

    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error("❌ [PENDING ORDERS] Error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در دریافت سفارشات در انتظار",
      error: error.message
    });
  }
});

// تایید دستی توسط مدیر مالی
router.post("/finance/approve/:orderMgmtId", async (req, res) => {
  try {
    const orderMgmtId = parseInt(req.params.orderMgmtId);
    const { reviewerId, notes, excessAmount } = req.body;
    
    if (isNaN(orderMgmtId)) {
      return res.status(400).json({
        success: false,
        message: "شناسه سفارش نامعتبر است"
      });
    }
    
    await paymentWorkflow.manualFinancialApproval(
      orderMgmtId,
      reviewerId,
      notes,
      excessAmount ? parseFloat(excessAmount) : undefined
    );
    
    res.json({
      success: true,
      message: "سفارش با موفقیت تایید و به انبار منتقل شد"
    });
    
  } catch (error) {
    console.error("❌ [MANUAL APPROVAL] Error:", error);
    res.status(500).json({
      success: false,
      message: "خطا در تایید سفارش",
      error: error.message
    });
  }
});

export { router as paymentRoutes };