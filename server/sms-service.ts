import { deliveryVerificationStorage } from "./delivery-verification-storage";
import { generateSMSMessage } from './multilingual-messages';

export interface SmsConfig {
  provider: 'kavenegar' | 'sms_ir' | 'melipayamak';
  apiKey: string;
  sender: string;
  baseUrl: string;
  isActive: boolean;
}

export interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
  cost?: number;
}

export class SmsService {
  private config: SmsConfig;
  
  constructor(config: SmsConfig) {
    this.config = config;
  }
  
  // Enhanced multilingual SMS sending method
  async sendLocalizedSms(
    phone: string,
    messageType: string,
    customerLanguage: string,
    variables: Record<string, string>
  ): Promise<SmsResult> {
    try {
      const message = generateSMSMessage(messageType as any, customerLanguage, variables);
      return await this.sendSms(phone, message);
    } catch (error) {
      console.error('Error sending localized SMS:', error);
      return { success: false, error: error.message };
    }
  }

  async sendDeliveryVerificationSms(
    phone: string, 
    verificationCode: string, 
    customerName: string = 'مشتری',
    deliveryVerificationId?: number,
    customerLanguage: string = 'fa'
  ): Promise<SmsResult> {
    // Use multilingual messaging if language preference is available
    if (customerLanguage && customerLanguage !== 'fa') {
      return await this.sendLocalizedSms(phone, 'smsOrderUpdate', customerLanguage, {
        orderNumber: verificationCode,
        status: 'در راه / On the way',
        customerName
      });
    }
    
    // Default Persian message for backward compatibility
    const message = `${customerName} عزیز، سفارش شما در راه است.
کد تحویل: ${verificationCode}
این کد را هنگام تحویل به پیک اعلام کنید.
ممتازکم - Momtazchem`;
    
    try {
      const result = await this.sendSms(phone, message);
      
      if (deliveryVerificationId && result.success) {
        await deliveryVerificationStorage.updateSmsStatus(
          deliveryVerificationId, 
          'sent', 
          { messageId: result.messageId, provider: this.config.provider }
        );
      }
      
      return result;
    } catch (error) {
      console.error('SMS sending failed:', error);
      
      if (deliveryVerificationId) {
        await deliveryVerificationStorage.updateSmsStatus(
          deliveryVerificationId, 
          'failed', 
          { reason: error.message }
        );
      }
      
      return { success: false, error: error.message };
    }
  }
  
  private async sendSms(phone: string, message: string): Promise<SmsResult> {
    // Clean phone number
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    
    switch (this.config.provider) {
      case 'kavenegar':
        return await this.sendKavenegarSms(cleanPhone, message);
      case 'sms_ir':
        return await this.sendSmsIrSms(cleanPhone, message);
      case 'melipayamak':
        return await this.sendMelipayamakSms(cleanPhone, message);
      default:
        throw new Error('Invalid SMS provider');
    }
  }
  
  private async sendKavenegarSms(phone: string, message: string): Promise<SmsResult> {
    const url = `${this.config.baseUrl}/send.json`;
    
    const params = new URLSearchParams({
      apikey: this.config.apiKey,
      sender: this.config.sender,
      receptor: phone,
      message: message,
    });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });
    
    const data = await response.json();
    
    if (data.return?.status === 200) {
      return {
        success: true,
        messageId: data.return.entries[0].messageid?.toString(),
        cost: data.return.entries[0].cost,
      };
    } else {
      throw new Error(data.return?.message || 'SMS sending failed');
    }
  }
  
  private async sendSmsIrSms(phone: string, message: string): Promise<SmsResult> {
    const url = `${this.config.baseUrl}/send`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.config.apiKey,
      },
      body: JSON.stringify({
        mobile: phone,
        message: message,
        lineNumber: this.config.sender,
      }),
    });
    
    const data = await response.json();
    
    if (data.status === 1) {
      return {
        success: true,
        messageId: data.messageId?.toString(),
        cost: data.cost,
      };
    } else {
      throw new Error(data.message || 'SMS sending failed');
    }
  }
  
  private async sendMelipayamakSms(phone: string, message: string): Promise<SmsResult> {
    const url = `${this.config.baseUrl}/send`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: this.config.apiKey.split(':')[0],
        password: this.config.apiKey.split(':')[1],
        to: phone,
        from: this.config.sender,
        text: message,
      }),
    });
    
    const data = await response.json();
    
    if (data.Value && data.Value !== '0') {
      return {
        success: true,
        messageId: data.Value.toString(),
      };
    } else {
      throw new Error(data.RetStatus || 'SMS sending failed');
    }
  }
  
  async checkDeliveryStatus(messageId: string): Promise<'sent' | 'delivered' | 'failed'> {
    // Implementation depends on provider
    // This is a placeholder for delivery status checking
    return 'sent';
  }
}

// Default SMS service configuration
const defaultSmsConfig: SmsConfig = {
  provider: 'kavenegar',
  apiKey: process.env.SMS_API_KEY || 'demo-key',
  sender: process.env.SMS_SENDER || '10008663',
  baseUrl: 'https://api.kavenegar.com/v1/{api-key}',
  isActive: !!process.env.SMS_API_KEY,
};

export const smsService = new SmsService(defaultSmsConfig);

// Function to get SMS configuration from database (future enhancement)
export async function getSmsConfiguration(): Promise<SmsConfig> {
  // This would fetch from database in a real implementation
  return defaultSmsConfig;
}

// Function to update SMS configuration in database (future enhancement)
export async function updateSmsConfiguration(config: Partial<SmsConfig>): Promise<void> {
  // This would update database in a real implementation
  console.log('SMS configuration updated:', config);
}