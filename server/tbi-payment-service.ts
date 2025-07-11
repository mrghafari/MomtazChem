import crypto from 'crypto';

// TBI Bank POS Online Integration Service
export interface TBIAuthResponse {
  token: string;
  expiresIn: number;
  email: string;
}

export interface TBIPaymentRequest {
  customerName: string;
  customerAddress: string;
  orderId: string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  currency: string;
  callbackUrl: string;
  statusUrl: string;
  description?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export interface TBIPaymentResponse {
  creditApplicationId: string;
  orderId: string;
  url: string; // URL برای هدایت مشتری جهت پرداخت
}

export interface TBIPaymentStatus {
  orderId: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionId?: string;
  amount?: number;
  currency?: string;
  paymentDate?: string;
  errorMessage?: string;
}

class TBIPaymentService {
  private baseUrl: string;
  private subscriptionKey: string;
  private username: string;
  private password: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    // UAT Environment URLs
    this.baseUrl = 'https://tbi-apim.azure-api.net/ftosgr/api/v1';
    this.subscriptionKey = process.env.TBI_SUBSCRIPTION_KEY || '';
    this.username = process.env.TBI_USERNAME || '';
    this.password = process.env.TBI_PASSWORD || '';
  }

  /**
   * احراز هویت و دریافت توکن دسترسی
   */
  async authenticate(): Promise<TBIAuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/User/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
        },
        body: JSON.stringify({
          username: this.username,
          password: this.password,
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      this.token = data.token;
      this.tokenExpiry = Date.now() + (data.expiresIn * 1000);

      return {
        token: data.token,
        expiresIn: data.expiresIn,
        email: data.email,
      };
    } catch (error) {
      console.error('TBI Authentication error:', error);
      throw new Error('Failed to authenticate with TBI Bank');
    }
  }

  /**
   * بررسی اعتبار توکن و تجدید در صورت نیاز
   */
  async ensureValidToken(): Promise<string> {
    if (!this.token || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
    return this.token!;
  }

  /**
   * ثبت درخواست پرداخت
   */
  async registerPayment(paymentData: TBIPaymentRequest): Promise<TBIPaymentResponse> {
    try {
      const token = await this.ensureValidToken();

      const requestBody = {
        customerName: paymentData.customerName,
        customerAddress: paymentData.customerAddress,
        customerPhone: paymentData.customerPhone || '',
        customerEmail: paymentData.customerEmail || '',
        orderId: paymentData.orderId,
        orderItems: paymentData.orderItems.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          total: item.quantity * item.price,
        })),
        totalAmount: paymentData.totalAmount,
        currency: paymentData.currency,
        callbackUrl: paymentData.callbackUrl,
        statusUrl: paymentData.statusUrl,
        description: paymentData.description || `Payment for order ${paymentData.orderId}`,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(`${this.baseUrl}/Application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Payment registration failed: ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      return {
        creditApplicationId: data.creditApplicationId,
        orderId: data.orderId,
        url: data.url,
      };
    } catch (error) {
      console.error('TBI Payment registration error:', error);
      throw new Error('Failed to register payment with TBI Bank');
    }
  }

  /**
   * بررسی وضعیت پرداخت
   */
  async getPaymentStatus(orderId: string): Promise<TBIPaymentStatus> {
    try {
      const token = await this.ensureValidToken();

      const response = await fetch(`${this.baseUrl}/Application/${orderId}/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        orderId: data.orderId,
        status: this.mapTBIStatus(data.status),
        transactionId: data.transactionId,
        amount: data.amount,
        currency: data.currency,
        paymentDate: data.paymentDate,
        errorMessage: data.errorMessage,
      };
    } catch (error) {
      console.error('TBI Payment status error:', error);
      throw new Error('Failed to get payment status from TBI Bank');
    }
  }

  /**
   * لغو پرداخت
   */
  async cancelPayment(orderId: string): Promise<boolean> {
    try {
      const token = await this.ensureValidToken();

      const response = await fetch(`${this.baseUrl}/Application/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('TBI Payment cancellation error:', error);
      return false;
    }
  }

  /**
   * بازپرداخت
   */
  async refundPayment(orderId: string, amount?: number): Promise<boolean> {
    try {
      const token = await this.ensureValidToken();

      const requestBody = amount ? { amount } : {};

      const response = await fetch(`${this.baseUrl}/Application/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      return response.ok;
    } catch (error) {
      console.error('TBI Payment refund error:', error);
      return false;
    }
  }

  /**
   * تبدیل وضعیت TBI به وضعیت استاندارد
   */
  private mapTBIStatus(tbiStatus: string): 'pending' | 'completed' | 'failed' | 'cancelled' {
    switch (tbiStatus.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'paid':
        return 'completed';
      case 'pending':
      case 'processing':
        return 'pending';
      case 'failed':
      case 'error':
        return 'failed';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * اعتبارسنجی callback از TBI
   */
  validateCallback(payload: any, signature: string): boolean {
    try {
      // در صورت وجود امضای دیجیتال، اعتبارسنجی کنید
      // این بخش بستگی به مستندات TBI دارد
      return true; // موقتاً همیشه true برمی‌گرداند
    } catch (error) {
      console.error('TBI Callback validation error:', error);
      return false;
    }
  }

  /**
   * تست اتصال به سرویس TBI
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch (error) {
      console.error('TBI Connection test failed:', error);
      return false;
    }
  }
}

export default TBIPaymentService;
export const tbiPaymentService = new TBIPaymentService();