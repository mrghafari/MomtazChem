import https from 'https';
import http from 'http';

interface WhatsAppSettings {
  isEnabled: boolean;
  provider: string;
  apiKey?: string;
  apiSecret?: string;
  instanceId?: string;
  accessToken?: string;
  apiEndpoint?: string;
  webhookUrl?: string;
}

interface WhatsAppMessage {
  to: string;
  message: string;
  messageType?: 'text' | 'template';
  templateName?: string;
  variables?: Record<string, string>;
}

export class WhatsAppService {
  private settings: WhatsAppSettings;

  constructor(settings?: WhatsAppSettings) {
    this.settings = settings || {
      isEnabled: true,
      provider: 'whatsapp_business_api', // Default provider
      apiEndpoint: 'https://graph.facebook.com/v18.0'
    };
  }

  async sendMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.settings.isEnabled) {
      return { success: false, error: 'WhatsApp service is disabled' };
    }

    try {
      switch (this.settings.provider) {
        case 'whatsapp_business_api':
          return await this.sendWhatsAppBusinessMessage(message);
        case 'twilio_whatsapp':
          return await this.sendTwilioWhatsAppMessage(message);
        case 'green_api':
          return await this.sendGreenApiMessage(message);
        case 'ultramsg':
          return await this.sendUltraMsgMessage(message);
        default:
          return { success: false, error: 'Unsupported WhatsApp provider' };
      }
    } catch (error: any) {
      console.error('WhatsApp sending error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  private async sendWhatsAppBusinessMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return new Promise((resolve) => {
      const phoneNumber = this.formatPhoneNumber(message.to);
      
      const postData = JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message.message
        }
      });

      const options = {
        hostname: 'graph.facebook.com',
        port: 443,
        path: `/v18.0/${this.settings.instanceId}/messages`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.settings.accessToken}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200 && response.messages) {
              console.log('✅ [WHATSAPP] Message sent successfully:', response.messages[0]?.id);
              resolve({ success: true, messageId: response.messages[0]?.id });
            } else {
              console.error('❌ [WHATSAPP] Failed to send message:', response);
              resolve({ success: false, error: response.error?.message || 'Failed to send WhatsApp message' });
            }
          } catch (parseError) {
            console.error('❌ [WHATSAPP] Error parsing response:', parseError);
            resolve({ success: false, error: 'Invalid response from WhatsApp API' });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ [WHATSAPP] Request error:', error);
        resolve({ success: false, error: error.message });
      });

      req.write(postData);
      req.end();
    });
  }

  private async sendTwilioWhatsAppMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return new Promise((resolve) => {
      const phoneNumber = this.formatPhoneNumber(message.to);
      
      const postData = new URLSearchParams({
        From: 'whatsapp:+14155238886', // Twilio WhatsApp sandbox number
        To: `whatsapp:${phoneNumber}`,
        Body: message.message
      }).toString();

      const auth = Buffer.from(`${this.settings.apiKey}:${this.settings.apiSecret}`).toString('base64');

      const options = {
        hostname: 'api.twilio.com',
        port: 443,
        path: `/2010-04-01/Accounts/${this.settings.apiKey}/Messages.json`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 201) {
              console.log('✅ [WHATSAPP-TWILIO] Message sent successfully:', response.sid);
              resolve({ success: true, messageId: response.sid });
            } else {
              console.error('❌ [WHATSAPP-TWILIO] Failed to send message:', response);
              resolve({ success: false, error: response.message || 'Failed to send WhatsApp message via Twilio' });
            }
          } catch (parseError) {
            console.error('❌ [WHATSAPP-TWILIO] Error parsing response:', parseError);
            resolve({ success: false, error: 'Invalid response from Twilio WhatsApp API' });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ [WHATSAPP-TWILIO] Request error:', error);
        resolve({ success: false, error: error.message });
      });

      req.write(postData);
      req.end();
    });
  }

  private async sendGreenApiMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return new Promise((resolve) => {
      const phoneNumber = this.formatPhoneNumber(message.to, false);
      
      const postData = JSON.stringify({
        chatId: `${phoneNumber}@c.us`,
        message: message.message
      });

      const options = {
        hostname: 'api.green-api.com',
        port: 443,
        path: `/waInstance${this.settings.instanceId}/sendMessage/${this.settings.accessToken}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200 && response.idMessage) {
              console.log('✅ [WHATSAPP-GREEN] Message sent successfully:', response.idMessage);
              resolve({ success: true, messageId: response.idMessage });
            } else {
              console.error('❌ [WHATSAPP-GREEN] Failed to send message:', response);
              resolve({ success: false, error: response.error?.message || 'Failed to send WhatsApp message via Green API' });
            }
          } catch (parseError) {
            console.error('❌ [WHATSAPP-GREEN] Error parsing response:', parseError);
            resolve({ success: false, error: 'Invalid response from Green API' });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ [WHATSAPP-GREEN] Request error:', error);
        resolve({ success: false, error: error.message });
      });

      req.write(postData);
      req.end();
    });
  }

  private async sendUltraMsgMessage(message: WhatsAppMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return new Promise((resolve) => {
      const phoneNumber = this.formatPhoneNumber(message.to, false);
      
      const postData = new URLSearchParams({
        token: this.settings.accessToken || '',
        to: phoneNumber,
        body: message.message
      }).toString();

      const options = {
        hostname: 'api.ultramsg.com',
        port: 443,
        path: `/${this.settings.instanceId}/messages/chat`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200 && response.sent) {
              console.log('✅ [WHATSAPP-ULTRA] Message sent successfully:', response.id);
              resolve({ success: true, messageId: response.id });
            } else {
              console.error('❌ [WHATSAPP-ULTRA] Failed to send message:', response);
              resolve({ success: false, error: response.error || 'Failed to send WhatsApp message via UltraMsg' });
            }
          } catch (parseError) {
            console.error('❌ [WHATSAPP-ULTRA] Error parsing response:', parseError);
            resolve({ success: false, error: 'Invalid response from UltraMsg API' });
          }
        });
      });

      req.on('error', (error) => {
        console.error('❌ [WHATSAPP-ULTRA] Request error:', error);
        resolve({ success: false, error: error.message });
      });

      req.write(postData);
      req.end();
    });
  }

  private formatPhoneNumber(phoneNumber: string, includeCountryCode: boolean = true): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Iraqi numbers
    if (cleaned.startsWith('964')) {
      return includeCountryCode ? cleaned : cleaned.substring(3);
    } else if (cleaned.startsWith('07')) {
      return includeCountryCode ? `964${cleaned.substring(1)}` : cleaned.substring(1);
    } else if (cleaned.startsWith('7')) {
      return includeCountryCode ? `964${cleaned}` : cleaned;
    }
    
    // For other international numbers
    if (cleaned.length >= 10 && !cleaned.startsWith('964')) {
      return includeCountryCode ? cleaned : cleaned;
    }
    
    return includeCountryCode ? cleaned : cleaned;
  }

  // Method to create WhatsApp service instance from environment or database
  static async createService(): Promise<WhatsAppService> {
    // You can later implement database loading for WhatsApp settings
    // For now, use environment variables
    const settings: WhatsAppSettings = {
      isEnabled: process.env.WHATSAPP_ENABLED === 'true',
      provider: process.env.WHATSAPP_PROVIDER || 'whatsapp_business_api',
      apiKey: process.env.WHATSAPP_API_KEY,
      apiSecret: process.env.WHATSAPP_API_SECRET,
      instanceId: process.env.WHATSAPP_INSTANCE_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      apiEndpoint: process.env.WHATSAPP_API_ENDPOINT || 'https://graph.facebook.com/v18.0',
      webhookUrl: process.env.WHATSAPP_WEBHOOK_URL
    };

    return new WhatsAppService(settings);
  }

  // Helper method to send authentication codes
  async sendAuthenticationCode(phoneNumber: string, code: string, customerName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = customerName 
      ? `${customerName} عزیز، کد تایید شما: ${code}\nاین کد در ۵ دقیقه منقضی می‌شود.\nممتازکم`
      : `کد تایید شما: ${code}\nاین کد در ۵ دقیقه منقضی می‌شود.\nممتازکم`;
    
    return this.sendMessage({
      to: phoneNumber,
      message: message,
      messageType: 'text'
    });
  }

  // Helper method to send delivery codes
  async sendDeliveryCode(phoneNumber: string, code: string, customerName?: string, orderNumber?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = customerName 
      ? `${customerName} عزیز، سفارش ${orderNumber || 'شما'} در راه است.\nکد تحویل: ${code}\nاین کد را هنگام تحویل به پیک اعلام کنید.\nممتازکم`
      : `سفارش ${orderNumber || 'شما'} در راه است.\nکد تحویل: ${code}\nاین کد را هنگام تحویل به پیک اعلام کنید.\nممتازکم`;
    
    return this.sendMessage({
      to: phoneNumber,
      message: message,
      messageType: 'text'
    });
  }

  // Helper method to send password reset links
  async sendPasswordResetLink(phoneNumber: string, resetLink: string, customerName?: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = customerName 
      ? `${customerName} عزیز، برای بازیابی رمز عبور خود روی لینک زیر کلیک کنید:\n${resetLink}\nاین لینک در ۱ ساعت منقضی می‌شود.\nممتازکم`
      : `برای بازیابی رمز عبور خود روی لینک زیر کلیک کنید:\n${resetLink}\nاین لینک در ۱ ساعت منقضی می‌شود.\nممتازکم`;
    
    return this.sendMessage({
      to: phoneNumber,
      message: message,
      messageType: 'text'
    });
  }
}

// Export function to create WhatsApp service
export async function createWhatsAppService(): Promise<WhatsAppService> {
  return WhatsAppService.createService();
}