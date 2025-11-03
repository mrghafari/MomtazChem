import { Express } from 'express';
import { storage } from './storage';

export function registerFibRoutes(app: Express) {
  // =============================================================================
  // FIRST IRAQI BANK (FIB) ONLINE PAYMENT ROUTES
  // =============================================================================

  /**
   * Create new FIB payment
   * @route POST /api/fib/create-payment
   * @access Private (Customer or Admin)
   * @body { amount, currency, description, orderId, orderNumber }
   */
  app.post("/api/fib/create-payment", async (req, res) => {
    try {
      const customerId = req.session.customerId || req.session.adminId;
      
      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required / مطلوب المصادقة",
        });
      }

      const { amount, currency, description, orderId, orderNumber } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount / المبلغ غير صالح",
        });
      }

      const { fibService } = await import('./fib-service');
      
      const payment = await fibService.createPayment({
        amount: parseFloat(amount).toFixed(2),
        currency: currency || 'IQD',
        description: description || 'Order Payment',
        customerId,
        orderId: orderId || null,
        orderNumber: orderNumber || null,
      });

      console.log(`✅ [FIB API] Payment created: ${payment.paymentId}`);

      res.json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      console.error("❌ [FIB API] Error creating payment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create payment / فشل إنشاء الدفع",
      });
    }
  });

  /**
   * Check FIB payment status
   * @route GET /api/fib/payment-status/:paymentId
   * @access Private (Customer or Admin)
   */
  app.get("/api/fib/payment-status/:paymentId", async (req, res) => {
    try {
      const customerId = req.session.customerId || req.session.adminId;
      
      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required / مطلوب المصادقة",
        });
      }

      const { paymentId } = req.params;

      const payment = await storage.getFibPaymentByPaymentId(paymentId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found / الدفع غير موجود",
        });
      }

      if (payment.customerId !== customerId && !req.session.adminId) {
        return res.status(403).json({
          success: false,
          message: "Access denied / الوصول مرفوض",
        });
      }

      const { fibService } = await import('./fib-service');
      const status = await fibService.checkPaymentStatus(paymentId);

      res.json({
        success: true,
        data: {
          paymentId: payment.paymentId,
          status: status.status,
          amount: payment.amount,
          currency: payment.currency,
          readableCode: payment.readableCode,
          validUntil: payment.validUntil,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
        },
      });
    } catch (error: any) {
      console.error("❌ [FIB API] Error checking payment status:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check payment status / فشل التحقق من حالة الدفع",
      });
    }
  });

  /**
   * FIB payment callback endpoint (called by FIB servers)
   * @route POST /api/fib/payment-callback
   * @access Public (FIB servers)
   */
  app.post("/api/fib/payment-callback", async (req, res) => {
    try {
      console.log("📞 [FIB API] Received payment callback:", req.body);

      const { fibService } = await import('./fib-service');
      await fibService.handleCallback(req.body);

      res.json({
        success: true,
        message: "Callback processed successfully",
      });
    } catch (error: any) {
      console.error("❌ [FIB API] Error processing callback:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process callback",
      });
    }
  });

  /**
   * Cancel FIB payment
   * @route POST /api/fib/cancel-payment/:paymentId
   * @access Private (Customer or Admin)
   */
  app.post("/api/fib/cancel-payment/:paymentId", async (req, res) => {
    try {
      const customerId = req.session.customerId || req.session.adminId;
      
      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required / مطلوب المصادقة",
        });
      }

      const { paymentId } = req.params;

      const payment = await storage.getFibPaymentByPaymentId(paymentId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found / الدفع غير موجود",
        });
      }

      if (payment.customerId !== customerId && !req.session.adminId) {
        return res.status(403).json({
          success: false,
          message: "Access denied / الوصول مرفوض",
        });
      }

      if (payment.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel payment with status: ${payment.status} / لا يمكن إلغاء الدفع بحالة: ${payment.status}`,
        });
      }

      const { fibService } = await import('./fib-service');
      const result = await fibService.cancelPayment(paymentId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      console.error("❌ [FIB API] Error cancelling payment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to cancel payment / فشل إلغاء الدفع",
      });
    }
  });

  /**
   * Get FIB payment details for payment interface (Public - anyone with paymentId can view)
   * @route GET /api/payment/fib/:paymentId
   * @access Public (anyone with payment ID)
   */
  app.get("/api/payment/fib/:paymentId", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const payment = await storage.getFibPaymentByPaymentId(paymentId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found / الدفع غير موجود",
        });
      }

      // Return payment details for display
      res.json({
        success: true,
        data: {
          paymentId: payment.paymentId,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          readableCode: payment.readableCode,
          qrCode: payment.qrCode,
          personalAppLink: payment.personalAppLink,
          businessAppLink: payment.businessAppLink,
          corporateAppLink: payment.corporateAppLink,
          validUntil: payment.validUntil,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
          description: payment.description,
        },
      });
    } catch (error: any) {
      console.error("❌ [FIB API] Error fetching payment details:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment details / فشل جلب تفاصيل الدفع",
      });
    }
  });

  /**
   * Get customer's FIB payment history
   * @route GET /api/fib/my-payments
   * @access Private (Customer)
   */
  app.get("/api/fib/my-payments", async (req, res) => {
    try {
      const customerId = req.session.customerId;
      
      if (!customerId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required / مطلوب المصادقة",
        });
      }

      const payments = await storage.getFibPaymentsByCustomerId(customerId);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error: any) {
      console.error("❌ [FIB API] Error fetching payment history:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment history / فشل جلب سجل المدفوعات",
      });
    }
  });

  /**
   * Get FIB payment details by ID (Admin)
   * @route GET /api/admin/fib/payment/:paymentId
   * @access Private (Admin)
   */
  app.get("/api/admin/fib/payment/:paymentId", async (req, res) => {
    try {
      if (!req.session.adminId) {
        return res.status(401).json({
          success: false,
          message: "Admin authentication required / مطلوب مصادقة المسؤول",
        });
      }

      const { paymentId } = req.params;
      const payment = await storage.getFibPaymentByPaymentId(paymentId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found / الدفع غير موجود",
        });
      }

      const callbacks = await storage.getFibPaymentCallbacks(paymentId);

      res.json({
        success: true,
        data: {
          payment,
          callbacks,
        },
      });
    } catch (error: any) {
      console.error("❌ [FIB API] Error fetching payment details:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch payment details / فشل جلب تفاصيل الدفع",
      });
    }
  });

  /**
   * TEST ENDPOINT - Create FIB payment without authentication (Development Only)
   * @route POST /api/fib/test-payment
   * @access Public (for testing only)
   */
  app.post("/api/fib/test-payment", async (req, res) => {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: "This endpoint is only available in development mode",
      });
    }

    try {
      const { amount, currency, description } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount / المبلغ غير صالح",
        });
      }

      const { fibService } = await import('./fib-service');
      
      const payment = await fibService.createPayment({
        amount: parseFloat(amount).toFixed(2),
        currency: currency || 'IQD',
        description: description || 'Test Payment',
        customerId: 1, // Test customer ID
        orderId: undefined,
        orderNumber: undefined,
      });

      console.log(`✅ [FIB TEST] Payment created: ${payment.paymentId}`);

      res.json({
        success: true,
        data: payment,
      });
    } catch (error: any) {
      console.error("❌ [FIB TEST] Error creating payment:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create payment / فشل إنشاء الدفع",
      });
    }
  });

  /**
   * TEST ENDPOINT - Check payment status without authentication
   * @route GET /api/fib/test-status/:paymentId
   * @access Public (for testing only)
   */
  app.get("/api/fib/test-status/:paymentId", async (req, res) => {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        message: "This endpoint is only available in development mode",
      });
    }

    try {
      const { paymentId } = req.params;
      const payment = await storage.getFibPaymentByPaymentId(paymentId);
      
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: "Payment not found / الدفع غير موجود",
        });
      }

      const { fibService } = await import('./fib-service');
      const status = await fibService.checkPaymentStatus(paymentId);

      res.json({
        success: true,
        data: {
          paymentId: payment.paymentId,
          status: status.status,
          amount: payment.amount,
          currency: payment.currency,
          readableCode: payment.readableCode,
          qrCode: payment.qrCode,
          personalAppLink: payment.personalAppLink,
          businessAppLink: payment.businessAppLink,
          validUntil: payment.validUntil,
          createdAt: payment.createdAt,
          paidAt: payment.paidAt,
        },
      });
    } catch (error: any) {
      console.error("❌ [FIB TEST] Error checking payment status:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check payment status",
      });
    }
  });

  console.log('✅ [FIB] Payment routes registered successfully');
}
