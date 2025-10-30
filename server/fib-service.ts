import { FIBClient } from '@first-iraqi-bank/sdk';
import { storage } from './storage';

interface CreatePaymentParams {
  amount: string;
  currency?: string;
  description?: string;
  customerId?: number;
  orderId?: number;
  orderNumber?: string;
  callbackUrl?: string;
}

interface PaymentResponse {
  paymentId: string;
  readableCode: string;
  qrCode: string;
  personalAppLink?: string;
  businessAppLink?: string;
  corporateAppLink?: string;
  validUntil: string;
  amount: string;
  currency: string;
  status: string;
}

class FIBService {
  private client: FIBClient | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized && this.client) {
      return;
    }

    const clientId = process.env.FIB_CLIENT_ID;
    const clientSecret = process.env.FIB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('FIB credentials not configured. Please set FIB_CLIENT_ID and FIB_CLIENT_SECRET environment variables.');
    }

    const settings = await storage.getActiveFibSettings();
    const environment = settings?.environment || 'stage';

    this.client = new FIBClient({
      clientId,
      clientSecret,
      environment: environment as 'stage' | 'production',
    });

    this.initialized = true;
    console.log('✅ [FIB] FIB Payment Client initialized successfully');
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    await this.initialize();

    if (!this.client) {
      throw new Error('FIB Client not initialized');
    }

    const settings = await storage.getActiveFibSettings();
    const baseUrl = settings?.callbackBaseUrl || process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000';

    const callbackUrl = params.callbackUrl || `${baseUrl}/api/fib/payment-callback`;

    try {
      const payment = await this.client.createPayment({
        amount: params.amount,
        currency: params.currency || 'IQD',
        description: params.description?.substring(0, 50) || 'Order Payment',
        callbackUrl,
      });

      const fibPayment = await storage.createFibPayment({
        paymentId: payment.paymentId,
        orderId: params.orderId || null,
        customerId: params.customerId || null,
        orderNumber: params.orderNumber || null,
        amount: params.amount,
        currency: params.currency || 'IQD',
        qrCode: payment.qrCode,
        readableCode: payment.readableCode,
        personalAppLink: payment.personalAppLink,
        businessAppLink: payment.businessAppLink,
        corporateAppLink: payment.corporateAppLink,
        status: 'pending',
        description: params.description?.substring(0, 50),
        validUntil: payment.validUntil ? new Date(payment.validUntil) : null,
        callbackUrl,
      });

      console.log(`✅ [FIB] Payment created: ${payment.paymentId} for ${params.amount} ${params.currency || 'IQD'}`);

      return {
        paymentId: payment.paymentId,
        readableCode: payment.readableCode,
        qrCode: payment.qrCode,
        personalAppLink: payment.personalAppLink,
        businessAppLink: payment.businessAppLink,
        corporateAppLink: payment.corporateAppLink,
        validUntil: payment.validUntil,
        amount: params.amount,
        currency: params.currency || 'IQD',
        status: 'pending',
      };
    } catch (error: any) {
      console.error('❌ [FIB] Error creating payment:', error);
      throw new Error(`Failed to create FIB payment: ${error.message}`);
    }
  }

  async checkPaymentStatus(paymentId: string): Promise<{ status: string; updatedAt: Date }> {
    await this.initialize();

    if (!this.client) {
      throw new Error('FIB Client not initialized');
    }

    try {
      const status = await this.client.checkPaymentStatus(paymentId);
      
      const payment = await storage.getFibPaymentByPaymentId(paymentId);
      if (payment && payment.status !== status.status) {
        const metadata: any = { updatedAt: new Date() };
        
        if (status.status === 'PAID' || status.status === 'paid') {
          metadata.paidAt = new Date();
        } else if (status.status === 'CANCELLED' || status.status === 'cancelled') {
          metadata.cancelledAt = new Date();
        } else if (status.status === 'EXPIRED' || status.status === 'expired') {
          metadata.expiredAt = new Date();
        }

        await storage.updateFibPaymentStatus(paymentId, status.status.toLowerCase(), metadata);
        console.log(`🔄 [FIB] Payment ${paymentId} status updated to: ${status.status}`);
      }

      return {
        status: status.status.toLowerCase(),
        updatedAt: new Date(),
      };
    } catch (error: any) {
      console.error('❌ [FIB] Error checking payment status:', error);
      throw new Error(`Failed to check payment status: ${error.message}`);
    }
  }

  async cancelPayment(paymentId: string): Promise<{ success: boolean; message: string }> {
    await this.initialize();

    if (!this.client) {
      throw new Error('FIB Client not initialized');
    }

    try {
      await this.client.cancelPayment(paymentId);
      
      await storage.updateFibPaymentStatus(paymentId, 'cancelled', {
        cancelledAt: new Date(),
      });

      console.log(`🚫 [FIB] Payment ${paymentId} cancelled successfully`);

      return {
        success: true,
        message: 'Payment cancelled successfully',
      };
    } catch (error: any) {
      console.error('❌ [FIB] Error cancelling payment:', error);
      throw new Error(`Failed to cancel payment: ${error.message}`);
    }
  }

  async refundPayment(paymentId: string): Promise<{ success: boolean; message: string }> {
    await this.initialize();

    if (!this.client) {
      throw new Error('FIB Client not initialized');
    }

    try {
      await this.client.refundPayment(paymentId);
      
      await storage.updateFibPaymentStatus(paymentId, 'refunded', {
        refundedAt: new Date(),
      });

      console.log(`💰 [FIB] Payment ${paymentId} refunded successfully`);

      return {
        success: true,
        message: 'Payment refunded successfully',
      };
    } catch (error: any) {
      console.error('❌ [FIB] Error refunding payment:', error);
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  async handleCallback(callbackData: any): Promise<void> {
    try {
      const paymentId = callbackData.id || callbackData.paymentId;
      const newStatus = callbackData.status;

      if (!paymentId || !newStatus) {
        console.error('❌ [FIB] Invalid callback data:', callbackData);
        return;
      }

      const payment = await storage.getFibPaymentByPaymentId(paymentId);
      
      if (!payment) {
        console.error(`❌ [FIB] Payment not found: ${paymentId}`);
        await storage.createFibPaymentCallback({
          paymentId,
          fibPaymentRecordId: null,
          status: newStatus,
          previousStatus: null,
          callbackData,
          processedSuccessfully: false,
          errorMessage: 'Payment record not found',
        });
        return;
      }

      const previousStatus = payment.status;

      const metadata: any = {};
      if (newStatus === 'PAID' || newStatus === 'paid') {
        metadata.paidAt = new Date();
      } else if (newStatus === 'CANCELLED' || newStatus === 'cancelled') {
        metadata.cancelledAt = new Date();
      } else if (newStatus === 'EXPIRED' || newStatus === 'expired') {
        metadata.expiredAt = new Date();
      } else if (newStatus === 'REFUNDED' || newStatus === 'refunded') {
        metadata.refundedAt = new Date();
      }

      await storage.updateFibPaymentStatus(paymentId, newStatus.toLowerCase(), metadata);

      await storage.createFibPaymentCallback({
        paymentId,
        fibPaymentRecordId: payment.id,
        status: newStatus,
        previousStatus,
        callbackData,
        processedSuccessfully: true,
        errorMessage: null,
      });

      console.log(`📞 [FIB] Callback processed: ${paymentId} - ${previousStatus} → ${newStatus}`);

    } catch (error: any) {
      console.error('❌ [FIB] Error processing callback:', error);
      
      try {
        await storage.createFibPaymentCallback({
          paymentId: callbackData.id || callbackData.paymentId,
          fibPaymentRecordId: null,
          status: callbackData.status,
          previousStatus: null,
          callbackData,
          processedSuccessfully: false,
          errorMessage: error.message,
        });
      } catch (logError) {
        console.error('❌ [FIB] Failed to log callback error:', logError);
      }
    }
  }
}

export const fibService = new FIBService();
