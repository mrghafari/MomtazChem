import { Router } from 'express';
import { storage } from './storage';
import { encrypt, decrypt, getAwsS3Service } from './aws-s3-service';
import { z } from 'zod';

export const awsS3Router = Router();

// Get AWS S3 settings
awsS3Router.get('/settings', async (req, res) => {
  try {
    const settings = await storage.getActiveAwsS3Settings();
    
    if (!settings) {
      return res.json({
        success: true,
        settings: null
      });
    }

    // Return settings without exposing actual keys
    res.json({
      success: true,
      settings: {
        ...settings,
        accessKeyId: settings.accessKeyId ? '••••••••' : '',
        secretAccessKey: settings.secretAccessKey ? '••••••••' : ''
      }
    });
  } catch (error: any) {
    console.error('Error fetching AWS S3 settings:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت تنظیمات'
    });
  }
});

// Save/Update AWS S3 settings
awsS3Router.post('/settings', async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region, bucketName, isActive, endpoint, usePathStyle, publicUrl, description } = req.body;

    // Validate required fields
    if (!accessKeyId || !secretAccessKey || !region || !bucketName) {
      return res.status(400).json({
        success: false,
        message: 'تمام فیلدهای ضروری را پر کنید'
      });
    }

    // Check if settings already exist
    const existingSettings = await storage.getActiveAwsS3Settings();

    let savedSettings;
    if (existingSettings) {
      // Update existing settings
      // Only encrypt if not already masked
      const encryptedAccessKey = accessKeyId === '••••••••' 
        ? existingSettings.accessKeyId 
        : encrypt(accessKeyId);
      const encryptedSecretKey = secretAccessKey === '••••••••' 
        ? existingSettings.secretAccessKey 
        : encrypt(secretAccessKey);

      savedSettings = await storage.updateAwsS3Settings(existingSettings.id, {
        accessKeyId: encryptedAccessKey,
        secretAccessKey: encryptedSecretKey,
        region,
        bucketName,
        isActive: isActive !== undefined ? isActive : true,
        endpoint: endpoint || undefined,
        usePathStyle: usePathStyle || false,
        publicUrl: publicUrl || undefined,
        description: description || undefined
      });
    } else {
      // Create new settings
      savedSettings = await storage.createAwsS3Settings({
        accessKeyId: encrypt(accessKeyId),
        secretAccessKey: encrypt(secretAccessKey),
        region,
        bucketName,
        isActive: isActive !== undefined ? isActive : true,
        endpoint: endpoint || undefined,
        usePathStyle: usePathStyle || false,
        publicUrl: publicUrl || undefined,
        description: description || undefined
      });
    }

    // Initialize AWS S3 service with new settings
    const s3Service = getAwsS3Service();
    s3Service.initialize(savedSettings);

    res.json({
      success: true,
      message: 'تنظیمات با موفقیت ذخیره شد',
      settings: {
        ...savedSettings,
        accessKeyId: '••••••••',
        secretAccessKey: '••••••••'
      }
    });
  } catch (error: any) {
    console.error('Error saving AWS S3 settings:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ذخیره تنظیمات: ' + error.message
    });
  }
});

// Test AWS S3 connection
awsS3Router.post('/test', async (req, res) => {
  try {
    const settings = await storage.getActiveAwsS3Settings();
    
    if (!settings) {
      return res.status(400).json({
        success: false,
        message: 'تنظیمات AWS S3 یافت نشد. ابتدا تنظیمات را ذخیره کنید.'
      });
    }

    const s3Service = getAwsS3Service();
    s3Service.initialize(settings);
    
    const testResult = await s3Service.testConnection();
    
    if (testResult.success) {
      res.json({
        success: true,
        message: testResult.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: testResult.message
      });
    }
  } catch (error: any) {
    console.error('Error testing AWS S3 connection:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تست اتصال: ' + error.message
    });
  }
});
