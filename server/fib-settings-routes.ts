import { Router, type Request, type Response } from 'express';
import { storage } from './storage';
import { encryptFibCredential } from './fib-credentials-service';
import { fibService } from './fib-service';

const router = Router();

// Middleware to require authentication
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.adminId) {
    return res.status(401).json({
      success: false,
      message: 'نیاز به ورود دارید'
    });
  }
  next();
}

// Get FIB settings
router.get("/settings", requireAuth, async (req: Request, res: Response) => {
  try {
    const settings = await storage.getActiveFibSettings();
    
    if (!settings) {
      return res.json({
        success: true,
        settings: null
      });
    }

    // Return settings without exposing actual credentials
    res.json({
      success: true,
      settings: {
        ...settings,
        clientId: settings.clientId ? '••••••••' : '',
        clientSecret: settings.clientSecret ? '••••••••' : ''
      }
    });
  } catch (error: any) {
    console.error('Error fetching FIB settings:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تنظیمات'
    });
  }
});

// Save/Update FIB settings
router.post("/settings", requireAuth, async (req: Request, res: Response) => {
  try {
    const { 
      environment, 
      clientId, 
      clientSecret, 
      isActive, 
      baseUrl, 
      callbackBaseUrl,
      paymentExpiryMinutes,
      autoRefreshToken,
      config
    } = req.body;

    // Check if settings already exist
    const existingSettings = await storage.getActiveFibSettings();

    // Validate required fields
    if (!environment || !baseUrl) {
      return res.status(400).json({
        success: false,
        message: 'Environment و Base URL الزامی هستند'
      });
    }

    // For new settings, credentials are required
    if (!existingSettings && (!clientId || !clientSecret)) {
      return res.status(400).json({
        success: false,
        message: 'برای ایجاد تنظیمات جدید، Client ID و Client Secret الزامی هستند'
      });
    }

    let savedSettings;
    if (existingSettings) {
      // Update existing settings
      // Use existing credentials if not provided or if masked
      const encryptedClientId = (clientId && clientId !== '••••••••') 
        ? encryptFibCredential(clientId) 
        : existingSettings.clientId;
      const encryptedClientSecret = (clientSecret && clientSecret !== '••••••••') 
        ? encryptFibCredential(clientSecret) 
        : existingSettings.clientSecret;

      savedSettings = await storage.updateFibSettings(existingSettings.id, {
        environment,
        clientId: encryptedClientId,
        clientSecret: encryptedClientSecret,
        isActive: isActive !== undefined ? isActive : existingSettings.isActive,
        baseUrl,
        callbackBaseUrl: callbackBaseUrl !== undefined ? callbackBaseUrl : existingSettings.callbackBaseUrl,
        paymentExpiryMinutes: paymentExpiryMinutes !== undefined ? paymentExpiryMinutes : existingSettings.paymentExpiryMinutes,
        autoRefreshToken: autoRefreshToken !== undefined ? autoRefreshToken : existingSettings.autoRefreshToken,
        config: config !== undefined ? config : existingSettings.config
      });
    } else {
      // Create new settings
      savedSettings = await storage.createFibSettings({
        environment,
        clientId: encryptFibCredential(clientId),
        clientSecret: encryptFibCredential(clientSecret),
        isActive: isActive !== undefined ? isActive : true,
        baseUrl,
        callbackBaseUrl: callbackBaseUrl || undefined,
        paymentExpiryMinutes: paymentExpiryMinutes || 30,
        autoRefreshToken: autoRefreshToken !== undefined ? autoRefreshToken : true,
        config: config || undefined
      });
    }

    // Reinitialize FIB service with new settings
    try {
      await fibService.initialize();
      console.log('✅ [FIB] Service reinitialized with new settings');
    } catch (error) {
      console.error('⚠️  [FIB] Failed to reinitialize service:', error);
    }

    res.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد',
      settings: {
        ...savedSettings,
        clientId: '••••••••',
        clientSecret: '••••••••'
      }
    });
  } catch (error: any) {
    console.error('Error saving FIB settings:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ذخیره تنظیمات: ' + error.message
    });
  }
});

// Test FIB connection
router.post("/test-connection", requireAuth, async (req: Request, res: Response) => {
  try {
    const settings = await storage.getActiveFibSettings();
    
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'تنظیمات FIB یافت نشد. ابتدا تنظیمات را ذخیره کنید.'
      });
    }

    // Try to authenticate with FIB
    try {
      await fibService.initialize();
      
      // Try to get an access token (this will test authentication)
      const testResponse = await (fibService as any).getAccessToken();
      
      if (testResponse) {
        return res.json({
          success: true,
          message: 'اتصال موفق! احراز هویت با FIB Payment Gateway انجام شد.'
        });
      } else {
        return res.status(400).json({
          success: false,
          message: 'اتصال ناموفق. لطفاً Client ID و Client Secret را بررسی کنید.'
        });
      }
    } catch (authError: any) {
      console.error('FIB authentication error:', authError);
      return res.status(400).json({
        success: false,
        message: 'خطا در احراز هویت: ' + (authError.message || 'Client ID یا Client Secret نامعتبر است')
      });
    }
  } catch (error: any) {
    console.error('Error testing FIB connection:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تست اتصال: ' + error.message
    });
  }
});

export default router;
