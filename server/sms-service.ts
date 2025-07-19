import https from 'https';
import http from 'http';

interface SmsSettings {
  isEnabled: boolean;
  provider: string;
  customProviderName?: string;
  apiKey?: string;
  apiSecret?: string;
  username?: string;
  password?: string;
  senderNumber?: string;
  apiEndpoint?: string;
  serviceType?: string;
  patternId?: string;
  serviceCode?: string;
  codeLength: number;
  codeExpiry: number;
  maxAttempts: number;
  rateLimitMinutes: number;
}

interface SmsMessage {
  to: string;
  message: string;
  code?: string;
}

export class SmsService {
  private settings: SmsSettings;

  constructor(settings: SmsSettings) {
    this.settings = settings;
  }

  async sendSms(message: SmsMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.settings.isEnabled) {
      return { success: false, error: 'SMS service is disabled' };
    }

    try {
      switch (this.settings.provider) {
        case 'infobip':
          return await this.sendInfobipSms(message);
        case 'twilio':
          return await this.sendTwilioSms(message);
        case 'asiacell':
        case 'zain_iraq':
        case 'korek_telecom':
          return await this.sendIraqiOperatorSms(message);
        case 'custom':
          return await this.sendCustomProviderSms(message);
        default:
          return { success: false, error: 'Unsupported SMS provider' };
      }
    } catch (error: any) {
      console.error('SMS sending error:', error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  private async sendInfobipSms(message: SmsMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return new Promise((resolve) => {
      const postData = JSON.stringify({
        messages: [
          {
            destinations: [{ to: message.to }],
            from: this.settings.senderNumber || '447491163443',
            text: message.message
          }
        ]
      });

      const options = {
        method: 'POST',
        hostname: 'api.infobip.com',
        path: this.settings.serviceCode ? `/sms/2/text/advanced?serviceCode=${this.settings.serviceCode}` : '/sms/2/text/advanced',
        headers: {
          'Authorization': `App ${this.settings.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        maxRedirects: 20
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const body = Buffer.concat(chunks);
          const response = JSON.parse(body.toString());
          
          if (res.statusCode === 200 && response.messages && response.messages[0]) {
            const messageStatus = response.messages[0];
            if (messageStatus.status && messageStatus.status.groupId === 1) {
              resolve({ 
                success: true, 
                messageId: messageStatus.messageId 
              });
            } else {
              resolve({ 
                success: false, 
                error: `Infobip error: ${messageStatus.status?.description || 'Unknown error'}` 
              });
            }
          } else {
            resolve({ 
              success: false, 
              error: `HTTP ${res.statusCode}: ${response.requestError?.serviceException?.text || 'Unknown error'}` 
            });
          }
        });

        res.on('error', (error) => {
          resolve({ success: false, error: `Network error: ${error.message}` });
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: `Request error: ${error.message}` });
      });

      req.write(postData);
      req.end();
    });
  }

  private async sendTwilioSms(message: SmsMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    return new Promise((resolve) => {
      const auth = Buffer.from(`${this.settings.username}:${this.settings.password}`).toString('base64');
      
      const postData = new URLSearchParams({
        To: message.to,
        From: this.settings.senderNumber || '',
        Body: message.message
      }).toString();

      const options = {
        method: 'POST',
        hostname: 'api.twilio.com',
        path: `/2010-04-01/Accounts/${this.settings.username}/Messages.json`,
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const body = Buffer.concat(chunks);
          const response = JSON.parse(body.toString());
          
          if (res.statusCode === 201 && response.sid) {
            resolve({ 
              success: true, 
              messageId: response.sid 
            });
          } else {
            resolve({ 
              success: false, 
              error: `Twilio error: ${response.message || 'Unknown error'}` 
            });
          }
        });

        res.on('error', (error) => {
          resolve({ success: false, error: `Network error: ${error.message}` });
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: `Request error: ${error.message}` });
      });

      req.write(postData);
      req.end();
    });
  }

  private async sendIraqiOperatorSms(message: SmsMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Iraqi operators typically use custom APIs
    // This is a generic implementation that can be customized
    return new Promise((resolve) => {
      if (!this.settings.apiEndpoint) {
        resolve({ success: false, error: 'API endpoint not configured for Iraqi operator' });
        return;
      }

      const postData = JSON.stringify({
        username: this.settings.username,
        password: this.settings.password,
        to: message.to,
        from: this.settings.senderNumber,
        text: message.message,
        serviceCode: this.settings.serviceCode
      });

      const url = new URL(this.settings.apiEndpoint);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const options = {
        method: 'POST',
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = httpModule.request(options, (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const body = Buffer.concat(chunks);
          try {
            const response = JSON.parse(body.toString());
            
            if (res.statusCode === 200) {
              resolve({ 
                success: true, 
                messageId: response.messageId || response.id || 'success' 
              });
            } else {
              resolve({ 
                success: false, 
                error: `${this.settings.provider} error: ${response.message || response.error || 'Unknown error'}` 
              });
            }
          } catch (parseError) {
            resolve({ 
              success: false, 
              error: `Response parsing error: ${parseError}` 
            });
          }
        });

        res.on('error', (error) => {
          resolve({ success: false, error: `Network error: ${error.message}` });
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: `Request error: ${error.message}` });
      });

      req.write(postData);
      req.end();
    });
  }

  private async sendCustomProviderSms(message: SmsMessage): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Generic implementation for custom providers
    return new Promise((resolve) => {
      if (!this.settings.apiEndpoint) {
        resolve({ success: false, error: 'API endpoint not configured for custom provider' });
        return;
      }

      const postData = JSON.stringify({
        apiKey: this.settings.apiKey,
        apiSecret: this.settings.apiSecret,
        username: this.settings.username,
        password: this.settings.password,
        to: message.to,
        from: this.settings.senderNumber,
        message: message.message,
        serviceCode: this.settings.serviceCode,
        patternId: this.settings.patternId
      });

      const url = new URL(this.settings.apiEndpoint);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const options = {
        method: 'POST',
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': this.settings.apiKey ? `Bearer ${this.settings.apiKey}` : undefined,
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = httpModule.request(options, (res) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk) => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const body = Buffer.concat(chunks);
          try {
            const response = JSON.parse(body.toString());
            
            if (res.statusCode === 200 || res.statusCode === 201) {
              resolve({ 
                success: true, 
                messageId: response.messageId || response.id || response.reference || 'success' 
              });
            } else {
              resolve({ 
                success: false, 
                error: `${this.settings.customProviderName || 'Custom provider'} error: ${response.message || response.error || 'Unknown error'}` 
              });
            }
          } catch (parseError) {
            resolve({ 
              success: false, 
              error: `Response parsing error: ${parseError}` 
            });
          }
        });

        res.on('error', (error) => {
          resolve({ success: false, error: `Network error: ${error.message}` });
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: `Request error: ${error.message}` });
      });

      req.write(postData);
      req.end();
    });
  }

  async sendVerificationCode(phone: string, code: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const message = {
      to: phone,
      message: `کد تایید شما: ${code}`,
      code: code
    };

    return await this.sendSms(message);
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const testResult = await this.sendSms({
        to: '9647503533769', // Test number
        message: 'Test message from Momtaz Chemical SMS System'
      });

      return testResult;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export async function createSmsService(): Promise<SmsService> {
  const { pool } = await import('./db');
  
  const result = await pool.query('SELECT * FROM sms_settings WHERE id = 1');
  const settings = result.rows[0] || {
    isEnabled: false,
    provider: 'infobip',
    codeLength: 6,
    codeExpiry: 300,
    maxAttempts: 3,
    rateLimitMinutes: 5
  };

  return new SmsService(settings);
}