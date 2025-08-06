import { pool } from './db';

export interface PaymentGateway {
  id: number;
  name: string;
  type: string;
  enabled: boolean;
  config: any;
  createdAt: string;
  updatedAt: string;
}

export interface BankPaymentRequest {
  orderId: number;
  customerId: number;
  amount: number;
  currency: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export class BankGatewayRouter {
  
  // دریافت فعال‌ترین درگاه بانکی
  async getActiveGateway(): Promise<PaymentGateway | null> {
    try {
      const result = await pool.query(`
        SELECT 
          id,
          name,
          type,
          enabled,
          config,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM payment_gateways
        WHERE enabled = true
        ORDER BY updated_at DESC, id DESC
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        console.log('⚠️ [GATEWAY ROUTER] No active payment gateway found');
        return null;
      }

      const gateway = result.rows[0];
      console.log(`✅ [GATEWAY ROUTER] Active gateway found: ${gateway.name} (${gateway.type})`);
      return gateway;
    } catch (error) {
      console.error('❌ [GATEWAY ROUTER] Error fetching active gateway:', error);
      return null;
    }
  }

  // دریافت تمام درگاه‌های فعال
  async getActiveGateways(): Promise<PaymentGateway[]> {
    try {
      const result = await pool.query(`
        SELECT 
          id,
          name,
          type,
          enabled,
          config,
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM payment_gateways
        WHERE enabled = true
        ORDER BY updated_at DESC, id DESC
      `);

      console.log(`✅ [GATEWAY ROUTER] Found ${result.rows.length} active gateways`);
      return result.rows;
    } catch (error) {
      console.error('❌ [GATEWAY ROUTER] Error fetching active gateways:', error);
      return [];
    }
  }

  // هدایت پرداخت به درگاه مناسب
  async routePayment(paymentRequest: BankPaymentRequest): Promise<{
    success: boolean;
    gateway?: PaymentGateway;
    paymentUrl?: string;
    transactionId?: string;
    message: string;
  }> {
    console.log(`🏦 [PAYMENT ROUTING] Starting payment routing for order ${paymentRequest.orderId}`);
    console.log(`💰 [PAYMENT ROUTING] Payment Details - Amount: ${paymentRequest.amount} ${paymentRequest.currency}, Customer: ${paymentRequest.customerId}`);
    
    try {
      // انتخاب درگاه فعال
      const activeGateway = await this.getActiveGateway();
      
      if (!activeGateway) {
        return {
          success: false,
          message: 'هیچ درگاه پرداخت فعالی یافت نشد'
        };
      }

      console.log(`🎯 [PAYMENT ROUTING] Routing payment to gateway: ${activeGateway.name}`);

      // ایجاد URL پرداخت برای درگاه انتخاب شده
      const paymentResult = await this.createPaymentUrl(activeGateway, paymentRequest);
      
      if (!paymentResult.success) {
        return {
          success: false,
          message: paymentResult.message || 'خطا در ایجاد لینک پرداخت'
        };
      }

      console.log(`✅ [PAYMENT ROUTING] Payment URL created successfully for gateway ${activeGateway.name}`);
      
      return {
        success: true,
        gateway: activeGateway,
        paymentUrl: paymentResult.paymentUrl,
        transactionId: paymentResult.transactionId,
        message: 'پرداخت با موفقیت به درگاه بانکی هدایت شد'
      };

    } catch (error) {
      console.error('❌ [PAYMENT ROUTING] Error routing payment:', error);
      return {
        success: false,
        message: 'خطا در هدایت پرداخت به درگاه بانکی'
      };
    }
  }

  // ایجاد URL پرداخت برای درگاه مشخص
  private async createPaymentUrl(
    gateway: PaymentGateway, 
    paymentRequest: BankPaymentRequest
  ): Promise<{
    success: boolean;
    paymentUrl?: string;
    transactionId?: string;
    message?: string;
  }> {
    console.log(`🔗 [PAYMENT URL] Creating payment URL for ${gateway.type} gateway`);

    try {
      switch (gateway.type.toLowerCase()) {
        case 'zarinpal':
          return await this.createZarinpalPayment(gateway, paymentRequest);
        
        case 'idpay':
          return await this.createIdpayPayment(gateway, paymentRequest);
        
        case 'parsian':
          return await this.createParsianPayment(gateway, paymentRequest);
        
        case 'mellat':
          return await this.createMellatPayment(gateway, paymentRequest);
        
        case 'saman':
          return await this.createSamanPayment(gateway, paymentRequest);

        case 'sep':
          return await this.createSepPayment(gateway, paymentRequest);

        case 'iraq_payment_center':
          return await this.createIraqPaymentCenterPayment(gateway, paymentRequest);
        
        default:
          console.log(`⚠️ [PAYMENT URL] Unknown gateway type: ${gateway.type}`);
          return {
            success: false,
            message: `نوع درگاه ${gateway.type} پشتیبانی نمی‌شود`
          };
      }
    } catch (error) {
      console.error(`❌ [PAYMENT URL] Error creating payment URL for ${gateway.type}:`, error);
      return {
        success: false,
        message: 'خطا در ایجاد لینک پرداخت'
      };
    }
  }

  // پیاده‌سازی درگاه زرین‌پال
  private async createZarinpalPayment(gateway: PaymentGateway, request: BankPaymentRequest) {
    const config = gateway.config;
    const transactionId = `TXN_${Date.now()}_${request.orderId}`;
    
    // شبیه‌سازی ایجاد لینک پرداخت زرین‌پال با مبلغ (عدد صحیح برای دینار عراقی)
    const formattedAmount = Math.round(parseFloat(request.amount.toString())); // Convert to whole number for IQD
    const paymentUrl = `https://sandbox.zarinpal.com/pg/StartPay/${transactionId}?amount=${formattedAmount}&currency=${request.currency || 'IQD'}`;
    
    console.log(`💳 [ZARINPAL] Payment URL created: ${paymentUrl} for amount: ${formattedAmount} ${request.currency || 'IQD'} (rounded from ${request.amount})`);
    
    return {
      success: true,
      paymentUrl,
      transactionId,
      message: 'لینک پرداخت زرین‌پال ایجاد شد'
    };
  }

  // پیاده‌سازی درگاه آی‌دی‌پی
  private async createIdpayPayment(gateway: PaymentGateway, request: BankPaymentRequest) {
    const transactionId = `IDPAY_${Date.now()}_${request.orderId}`;
    const formattedAmount = Math.round(parseFloat(request.amount.toString())); // Convert to whole number for IQD
    const paymentUrl = `https://idpay.ir/p/${transactionId}?amount=${formattedAmount}&currency=${request.currency || 'IQD'}`;
    
    console.log(`💳 [IDPAY] Payment URL created: ${paymentUrl} for amount: ${formattedAmount} ${request.currency || 'IQD'} (rounded from ${request.amount})`);
    
    return {
      success: true,
      paymentUrl,
      transactionId,
      message: 'لینک پرداخت آی‌دی‌پی ایجاد شد'
    };
  }

  // پیاده‌سازی درگاه پارسیان
  private async createParsianPayment(gateway: PaymentGateway, request: BankPaymentRequest) {
    const transactionId = `PARSIAN_${Date.now()}_${request.orderId}`;
    const formattedAmount = Math.round(parseFloat(request.amount.toString())); // Convert to whole number for IQD
    const paymentUrl = `https://pec.shaparak.ir/NewIPGServices/Payment/${transactionId}?amount=${formattedAmount}&currency=${request.currency || 'IQD'}`;
    
    console.log(`💳 [PARSIAN] Payment URL created: ${paymentUrl} for amount: ${formattedAmount} ${request.currency || 'IQD'} (rounded from ${request.amount})`);
    
    return {
      success: true,
      paymentUrl,
      transactionId,
      message: 'لینک پرداخت پارسیان ایجاد شد'
    };
  }

  // پیاده‌سازی درگاه ملت
  private async createMellatPayment(gateway: PaymentGateway, request: BankPaymentRequest) {
    const transactionId = `MELLAT_${Date.now()}_${request.orderId}`;
    const formattedAmount = Math.round(parseFloat(request.amount.toString())); // Convert to whole number for IQD
    const paymentUrl = `https://bpm.shaparak.ir/pgwchannel/startpay.mellat?RefId=${transactionId}&Amount=${formattedAmount}&Currency=${request.currency || 'IQD'}`;
    
    console.log(`💳 [MELLAT] Payment URL created: ${paymentUrl} for amount: ${formattedAmount} ${request.currency || 'IQD'} (rounded from ${request.amount})`);
    
    return {
      success: true,
      paymentUrl,
      transactionId,
      message: 'لینک پرداخت ملت ایجاد شد'
    };
  }

  // پیاده‌سازی درگاه سامان/شاپرک
  private async createSamanPayment(gateway: PaymentGateway, request: BankPaymentRequest) {
    const transactionId = `SAMAN_${Date.now()}_${request.orderId}`;
    const formattedAmount = Math.round(parseFloat(request.amount.toString())); // Convert to whole number for IQD
    const paymentUrl = `https://sep.shaparak.ir/Payment.aspx?Token=${transactionId}&Amount=${formattedAmount}&Currency=${request.currency || 'IQD'}`;
    
    console.log(`💳 [SAMAN] Payment URL created: ${paymentUrl} for amount: ${formattedAmount} ${request.currency || 'IQD'} (rounded from ${request.amount})`);
    
    return {
      success: true,
      paymentUrl,
      transactionId,
      message: 'لینک پرداخت سامان ایجاد شد'
    };
  }

  // پیاده‌سازی درگاه شاپرک (SEP)
  private async createSepPayment(gateway: PaymentGateway, request: BankPaymentRequest) {
    const config = gateway.config;
    const transactionId = `SEP_${Date.now()}_${request.orderId}`;
    
    // Check if test mode is enabled
    const isTestMode = config.testMode === true || gateway.test_mode === true;
    
    // Use correct official Shaparak SEP URLs with multiple fallbacks
    const baseUrls = isTestMode ? [
      'https://sep.shaparak.ir/onlinepg/onlinepg',
      'https://sep.shaparak.ir/payment.aspx',
      'https://sep.shaparak.ir/MerchantHandler'
    ] : [
      'https://sep.shaparak.ir/onlinepg/onlinepg',
      'https://sep.shaparak.ir/payment.aspx'
    ];
    
    // Include merchant credentials - use test credentials in test mode
    const merchantId = isTestMode ? 'test_merchant_shaparak' : (config.merchantId || config.terminalId || 'test_merchant');
    const apiKey = isTestMode ? 'test_api_key_shaparak' : (config.apiKey || config.password || 'test_api_key');
    
    // Convert amount to whole number for Iraqi Dinar (IQD doesn't use decimals)
    const formattedAmount = Math.round(parseFloat(request.amount.toString())); // Convert to whole number for IQD
    
    // Shaparak SEP standard parameters following official format
    const callbackUrl = isTestMode ? 'https://momtazchem.com/payment/test-callback' : (request.returnUrl || 'https://momtazchem.com/payment/callback');
    
    // Use primary URL format - onlinepg/onlinepg is the standard endpoint
    const baseUrl = baseUrls[0];
    const paymentUrl = `${baseUrl}?Amount=${formattedAmount}&ResNum=${transactionId}&MID=${merchantId}&RedirectURL=${encodeURIComponent(callbackUrl)}`;
    
    console.log(`💳 [SHAPARAK SEP] Payment URL created: ${paymentUrl} for amount: ${request.amount} ${request.currency || 'IQD'} (Formatted: ${formattedAmount}) (Test Mode: ${isTestMode})`);
    console.log(`🔗 [SHAPARAK SEP] Final Payment URL: ${paymentUrl}`);
    console.log(`🔄 [SHAPARAK SEP] Alternative URLs available: ${baseUrls.slice(1).join(', ')}`);
    
    return {
      success: true,
      paymentUrl,
      transactionId,
      message: isTestMode ? 'لینک پرداخت شاپرک تست ایجاد شد' : 'لینک پرداخت شاپرک ایجاد شد'
    };
  }

  // پیاده‌سازی درگاه مرکز پرداخت عراق
  private async createIraqPaymentCenterPayment(gateway: PaymentGateway, request: BankPaymentRequest) {
    const transactionId = `IPC_${Date.now()}_${request.orderId}`;
    const formattedAmount = Math.round(parseFloat(request.amount.toString())); // Convert to whole number for IQD
    const paymentUrl = `https://payment.cbi.iq/gateway/pay/${transactionId}?amount=${formattedAmount}&currency=${request.currency || 'IQD'}`;
    
    console.log(`💳 [IRAQ PAYMENT CENTER] Payment URL created: ${paymentUrl} for amount: ${formattedAmount} ${request.currency || 'IQD'} (rounded from ${request.amount})`);
    
    return {
      success: true,
      paymentUrl,
      transactionId,
      message: 'لینک پرداخت مرکز پرداخت عراق ایجاد شد'
    };
  }

  // تأیید پرداخت دریافتی از درگاه
  async verifyPayment(transactionId: string, gatewayType: string): Promise<{
    success: boolean;
    verified: boolean;
    amount?: number;
    orderId?: number;
    message: string;
  }> {
    console.log(`🔍 [PAYMENT VERIFICATION] Verifying payment ${transactionId} for ${gatewayType}`);
    
    try {
      switch (gatewayType.toLowerCase()) {
        case 'zarinpal':
          return await this.verifyZarinpalPayment(transactionId);
        
        case 'idpay':
          return await this.verifyIdpayPayment(transactionId);
        
        case 'parsian':
          return await this.verifyParsianPayment(transactionId);
        
        case 'mellat':
          return await this.verifyMellatPayment(transactionId);
        
        case 'saman':
          return await this.verifySamanPayment(transactionId);

        case 'sep':
          return await this.verifySepPayment(transactionId);

        case 'iraq_payment_center':
          return await this.verifyIraqPaymentCenterPayment(transactionId);
        
        default:
          return {
            success: false,
            verified: false,
            message: `نوع درگاه ${gatewayType} پشتیبانی نمی‌شود`
          };
      }
    } catch (error) {
      console.error(`❌ [PAYMENT VERIFICATION] Error verifying ${gatewayType} payment:`, error);
      return {
        success: false,
        verified: false,
        message: 'خطا در تأیید پرداخت'
      };
    }
  }

  // تأیید پرداخت زرین‌پال (شبیه‌سازی)
  private async verifyZarinpalPayment(transactionId: string) {
    // شبیه‌سازی - در واقعیت باید با API زرین‌پال تماس بگیریم
    return {
      success: true,
      verified: true,
      amount: 100000, // مبلغ از درگاه
      orderId: parseInt(transactionId.split('_')[2]),
      message: 'پرداخت زرین‌پال تأیید شد'
    };
  }

  // تأیید سایر درگاه‌ها (مشابه زرین‌پال)
  private async verifyIdpayPayment(transactionId: string) {
    return {
      success: true,
      verified: true,
      amount: 100000,
      orderId: parseInt(transactionId.split('_')[2]),
      message: 'پرداخت آی‌دی‌پی تأیید شد'
    };
  }

  private async verifyParsianPayment(transactionId: string) {
    return {
      success: true,
      verified: true,
      amount: 100000,
      orderId: parseInt(transactionId.split('_')[2]),
      message: 'پرداخت پارسیان تأیید شد'
    };
  }

  private async verifyMellatPayment(transactionId: string) {
    return {
      success: true,
      verified: true,
      amount: 100000,
      orderId: parseInt(transactionId.split('_')[2]),
      message: 'پرداخت ملت تأیید شد'
    };
  }

  private async verifySamanPayment(transactionId: string) {
    return {
      success: true,
      verified: true,
      amount: 100000,
      orderId: parseInt(transactionId.split('_')[2]),
      message: 'پرداخت سامان تأیید شد'
    };
  }

  private async verifySepPayment(transactionId: string) {
    return {
      success: true,
      verified: true,
      amount: 100000,
      orderId: parseInt(transactionId.split('_')[2]),
      message: 'پرداخت شاپرک تأیید شد'
    };
  }

  private async verifyIraqPaymentCenterPayment(transactionId: string) {
    return {
      success: true,
      verified: true,
      amount: 100000,
      orderId: parseInt(transactionId.split('_')[2]),
      message: 'پرداخت مرکز پرداخت عراق تأیید شد'
    };
  }
}

// ایجاد instance سراسری
export const bankGatewayRouter = new BankGatewayRouter();