import { PaymentSDK } from '@first-iraqi-bank/sdk/payment';
import { storage } from './storage';

type Environment = "dev" | "stage" | "prod";

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
  paymentUrl?: string;
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
  private client: ReturnType<typeof PaymentSDK.getClient> | null = null;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized && this.client) {
      return;
    }

    // Try to get credentials from database first
    const settings = await storage.getActiveFibSettings();
    let clientId: string;
    let clientSecret: string;

    if (settings && settings.clientId && settings.clientSecret) {
      // Use encrypted credentials from database
      try {
        const { getDecryptedFibCredentials } = await import('./fib-credentials-service');
        const credentials = getDecryptedFibCredentials(settings);
        clientId = credentials.clientId;
        clientSecret = credentials.clientSecret;
        console.log('✅ [FIB] Using encrypted credentials from database');
      } catch (error) {
        console.error('❌ [FIB] Failed to decrypt credentials from database:', error);
        throw new Error('Failed to decrypt FIB credentials. Please check encryption key.');
      }
    } else {
      // Fallback to environment variables
      clientId = process.env.FIB_CLIENT_ID || '';
      clientSecret = process.env.FIB_CLIENT_SECRET || '';
      
      if (!clientId || !clientSecret) {
        throw new Error('FIB credentials not configured. Please set credentials in admin panel or environment variables.');
      }
      console.log('⚠️  [FIB] Using credentials from environment variables');
    }

    const environment = (settings?.environment || 'stage') as Environment;

    this.client = PaymentSDK.getClient(clientId, clientSecret, environment);

    this.initialized = true;
    console.log('✅ [FIB] FIB Payment Client initialized successfully');
  }

  private async getAccessToken(): Promise<string> {
    if (!this.client) {
      await this.initialize();
    }

    if (!this.client) {
      throw new Error('FIB Client not initialized');
    }

    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    try {
      const response = await this.client.authenticate();
      
      if (!response.ok) {
        throw new Error('Failed to authenticate with FIB');
      }

      const data = await response.json();

      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000);

      console.log('✅ [FIB] Authentication successful');
      
      return this.accessToken;
    } catch (error: any) {
      console.error('❌ [FIB] Authentication error:', error);
      throw new Error(`Failed to authenticate with FIB: ${error.message}`);
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    await this.initialize();

    if (!this.client) {
      throw new Error('FIB Client not initialized');
    }

    const settings = await storage.getActiveFibSettings();
    const baseUrl = settings?.callbackBaseUrl ?? (process.env.REPLIT_DEV_DOMAIN 
      ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
      : 'http://localhost:5000');

    const callbackUrl = params.callbackUrl || `${baseUrl}/api/fib/payment-callback`;

    try {
      const accessToken = await this.getAccessToken();
      
      const amountInDinars = parseFloat(params.amount);
      
      const response = await this.client.createPayment({
        amount: amountInDinars,
        description: params.description?.substring(0, 50) || 'Order Payment',
        statusCallbackUrl: new URL(callbackUrl),
        expiresIn: { minutes: 30 },
      }, accessToken);

      if (!response.ok) {
        throw new Error('Failed to create payment');
      }

      const payment = await response.json();

      const fibPayment = await storage.createFibPayment({
        paymentId: payment.paymentId,
        orderId: params.orderId || null,
        customerId: params.customerId || null,
        orderNumber: params.orderNumber || null,
        amount: params.amount,
        currency: params.currency || 'IQD',
        qrCode: payment.qrCode,
        readableCode: payment.readableCode,
        personalAppLink: payment.personalAppLink || null,
        businessAppLink: payment.businessAppLink || null,
        corporateAppLink: payment.corporateAppLink || null,
        status: 'pending',
        description: params.description?.substring(0, 50),
        validUntil: payment.validUntil ? new Date(payment.validUntil) : null,
        callbackUrl,
      });

      console.log(`✅ [FIB] Payment created: ${payment.paymentId} for ${params.amount} ${params.currency || 'IQD'}`);

      const paymentInterfaceUrl = `${baseUrl}/payment/fib/${payment.paymentId}`;

      return {
        paymentId: payment.paymentId,
        paymentUrl: paymentInterfaceUrl,
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
      const accessToken = await this.getAccessToken();
      const response = await this.client.getPaymentStatus(paymentId, accessToken);

      if (!response.ok) {
        throw new Error('Failed to get payment status');
      }

      const statusData = await response.json();
      const normalizedStatus = this.normalizeStatus(statusData.status);
      
      const payment = await storage.getFibPaymentByPaymentId(paymentId);
      if (payment && payment.status !== normalizedStatus) {
        const metadata: any = { updatedAt: new Date() };
        
        if (normalizedStatus === 'paid' && statusData.status === 'PAID') {
          metadata.paidAt = statusData.paidAt ? new Date(statusData.paidAt) : new Date();
        } else if (normalizedStatus === 'cancelled' && statusData.status === 'DECLINED') {
          metadata.cancelledAt = statusData.declinedAt ? new Date(statusData.declinedAt) : new Date();
        } else if (normalizedStatus === 'refunded' && statusData.status === 'REFUNDED') {
          metadata.refundedAt = new Date();
        }

        await storage.updateFibPaymentStatus(paymentId, normalizedStatus, metadata);
        console.log(`🔄 [FIB] Payment ${paymentId} status updated to: ${normalizedStatus}`);
      }

      return {
        status: normalizedStatus,
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
      const accessToken = await this.getAccessToken();
      await this.client.cancelPayment(paymentId, accessToken);
      
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
      const accessToken = await this.getAccessToken();
      await this.client.refundPayment(paymentId, accessToken);
      
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

  private normalizeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'UNPAID': 'pending',
      'PAID': 'paid',
      'DECLINED': 'cancelled',
      'REFUNDED': 'refunded',
      'REFUND_REQUESTED': 'refund_requested',
    };

    return statusMap[status] || status.toLowerCase();
  }

  async handleCallback(callbackData: any): Promise<void> {
    try {
      const paymentId = callbackData.id || callbackData.paymentId;
      const newStatus = this.normalizeStatus(callbackData.status);

      if (!paymentId || !callbackData.status) {
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
      if (newStatus === 'paid') {
        metadata.paidAt = callbackData.paidAt ? new Date(callbackData.paidAt) : new Date();
      } else if (newStatus === 'cancelled') {
        metadata.cancelledAt = callbackData.declinedAt ? new Date(callbackData.declinedAt) : new Date();
      } else if (newStatus === 'refunded') {
        metadata.refundedAt = new Date();
      }

      await storage.updateFibPaymentStatus(paymentId, newStatus, metadata);

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
          status: this.normalizeStatus(callbackData.status),
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
