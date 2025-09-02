import { ObjectStorageService } from './objectStorage';
import { fileSecurityService, FileValidationResult } from './fileSecurityService';
import { randomUUID } from 'crypto';

export interface SecureUploadResult {
  success: boolean;
  uploadUrl?: string;
  errors?: string[];
  fileId?: string;
  securityReport?: string;
}

export interface SecureUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType?: string;
  userId?: string;
  allowedTypes?: string[];
  customSizeLimit?: number;
}

export class SecureObjectStorageService extends ObjectStorageService {
  
  /**
   * Generate secure upload URL with validation
   */
  async generateSecureUploadUrl(request: SecureUploadRequest): Promise<SecureUploadResult> {
    try {
      const errors: string[] = [];

      // Pre-upload validation
      const sizeLimit = request.customSizeLimit || 25 * 1024 * 1024; // 25MB default
      if (request.fileSize > sizeLimit) {
        errors.push(`حجم فایل نباید بیشتر از ${this.formatFileSize(sizeLimit)} باشد`);
      }

      // Validate file extension
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx'];
      const fileExtension = this.getFileExtension(request.fileName);
      if (!allowedExtensions.includes(fileExtension)) {
        errors.push(`پسوند فایل مجاز نیست: ${fileExtension}`);
      }

      // Validate MIME type if provided
      if (request.mimeType && request.allowedTypes) {
        if (!request.allowedTypes.includes(request.mimeType)) {
          errors.push(`نوع فایل مجاز نیست: ${request.mimeType}`);
        }
      }

      if (errors.length > 0) {
        return { success: false, errors };
      }

      // Generate unique file ID
      const fileId = randomUUID();
      const sanitizedFileName = this.sanitizeFileName(request.fileName);
      const finalFileName = `${fileId}_${sanitizedFileName}`;

      // Get upload URL from parent class
      const uploadUrl = await this.getObjectEntityUploadURL();

      console.log(`🔐 [SECURE UPLOAD] Generated secure upload URL for: ${finalFileName}`);
      console.log(`📊 [SECURE UPLOAD] File size: ${this.formatFileSize(request.fileSize)}`);
      console.log(`👤 [SECURE UPLOAD] User: ${request.userId || 'anonymous'}`);

      return {
        success: true,
        uploadUrl,
        fileId,
        securityReport: this.generateUploadReport(request, fileId)
      };

    } catch (error) {
      console.error('❌ [SECURE UPLOAD] Error generating upload URL:', error);
      return {
        success: false,
        errors: ['خطا در تولید لینک آپلود']
      };
    }
  }

  /**
   * Validate uploaded file after upload
   */
  async validateUploadedFile(fileBuffer: Buffer, originalName: string, fileId: string): Promise<FileValidationResult & { fileId: string }> {
    console.log(`🔍 [POST-UPLOAD VALIDATION] Starting validation for file: ${fileId}`);

    const validationResult = await fileSecurityService.validateFile(fileBuffer, originalName);
    
    if (validationResult.isValid) {
      console.log(`✅ [POST-UPLOAD VALIDATION] File ${fileId} passed all security checks`);
    } else {
      console.log(`❌ [POST-UPLOAD VALIDATION] File ${fileId} failed validation:`, validationResult.errors);
    }

    // Log security report
    const securityReport = fileSecurityService.generateSecurityReport(validationResult);
    console.log(`📋 [SECURITY REPORT] ${fileId}:\n${securityReport}`);

    return {
      ...validationResult,
      fileId
    };
  }

  /**
   * Secure file processing pipeline
   */
  async processSecureUpload(fileBuffer: Buffer, originalName: string, userId?: string): Promise<{
    success: boolean;
    processedFile?: Buffer;
    metadata?: any;
    errors?: string[];
    fileId: string;
  }> {
    const fileId = randomUUID();
    
    try {
      console.log(`🚀 [SECURE PIPELINE] Starting processing for file: ${fileId}`);

      // Step 1: Comprehensive validation
      const validationResult = await this.validateUploadedFile(fileBuffer, originalName, fileId);

      if (!validationResult.isValid) {
        return {
          success: false,
          errors: validationResult.errors,
          fileId
        };
      }

      // Step 2: Store metadata
      const fileMetadata = {
        fileId,
        originalName,
        userId,
        uploadedAt: new Date().toISOString(),
        ...validationResult.metadata
      };

      console.log(`💾 [SECURE PIPELINE] File ${fileId} processed successfully`);

      return {
        success: true,
        processedFile: validationResult.processedBuffer,
        metadata: fileMetadata,
        fileId
      };

    } catch (error) {
      console.error(`❌ [SECURE PIPELINE] Processing failed for file ${fileId}:`, error);
      return {
        success: false,
        errors: ['خطا در پردازش فایل'],
        fileId
      };
    }
  }

  /**
   * Sanitize file name to prevent path traversal
   */
  private sanitizeFileName(fileName: string): string {
    // Remove dangerous characters and paths
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_') // Replace dangerous chars
      .replace(/\.\./g, '_') // Remove parent directory references
      .replace(/^\.+/, '_') // Remove leading dots
      .substring(0, 100); // Limit length
  }

  /**
   * Get file extension safely
   */
  private getFileExtension(fileName: string): string {
    const match = fileName.match(/\.[^.]*$/);
    return match ? match[0].toLowerCase() : '';
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Generate upload report
   */
  private generateUploadReport(request: SecureUploadRequest, fileId: string): string {
    let report = `📋 گزارش آپلود امن:\n`;
    report += `🆔 شناسه فایل: ${fileId}\n`;
    report += `📁 نام فایل: ${request.fileName}\n`;
    report += `📊 حجم: ${this.formatFileSize(request.fileSize)}\n`;
    report += `👤 کاربر: ${request.userId || 'ناشناس'}\n`;
    report += `⏰ زمان: ${new Date().toLocaleString('fa-IR')}\n`;
    report += `🔐 وضعیت: آماده برای آپلود امن\n`;
    
    return report;
  }

  /**
   * Check file against blacklisted patterns
   */
  async checkFileAgainstBlacklist(fileName: string, fileBuffer: Buffer): Promise<{
    isBlacklisted: boolean;
    reason?: string;
  }> {
    // Check file name patterns
    const dangerousPatterns = [
      /\.exe$/i, /\.bat$/i, /\.cmd$/i, /\.scr$/i, /\.vbs$/i, 
      /\.js$/i, /\.jar$/i, /\.com$/i, /\.pif$/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(fileName)) {
        return {
          isBlacklisted: true,
          reason: `نوع فایل خطرناک: ${fileName}`
        };
      }
    }

    // Check file content for suspicious patterns
    const content = fileBuffer.toString('utf8', 0, Math.min(fileBuffer.length, 1024));
    const suspiciousContent = [
      /eval\s*\(/gi,
      /exec\s*\(/gi,
      /system\s*\(/gi,
      /shell_exec/gi,
      /base64_decode/gi
    ];

    for (const pattern of suspiciousContent) {
      if (pattern.test(content)) {
        return {
          isBlacklisted: true,
          reason: 'محتوای مشکوک در فایل'
        };
      }
    }

    return { isBlacklisted: false };
  }
}

// Export configured instance
export const secureObjectStorageService = new SecureObjectStorageService();