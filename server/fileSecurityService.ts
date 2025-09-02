import fs from 'fs';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { createHash } from 'crypto';
import NodeClam from 'clamscan';
import mime from 'mime-types';

export interface SecurityScanResult {
  isClean: boolean;
  threat?: string;
  details?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  processedBuffer?: Buffer;
  metadata?: {
    originalSize: number;
    compressedSize?: number;
    mimeType: string;
    extension?: string;
    hash: string;
  };
}

export interface FileSecurityConfig {
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  enableImageCompression: boolean;
  compressionQuality: number;
  maxImageDimensions: { width: number; height: number };
  enableVirusScanning: boolean;
  blockedPatterns: RegExp[];
}

export class FileSecurityService {
  private config: FileSecurityConfig;
  private clamScanner: NodeClam | null = null;

  constructor(config: Partial<FileSecurityConfig> = {}) {
    this.config = {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB default
      allowedMimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.doc', '.docx'],
      enableImageCompression: true,
      compressionQuality: 80,
      maxImageDimensions: { width: 2048, height: 2048 },
      enableVirusScanning: true,
      blockedPatterns: [
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi, // Script tags
        /javascript:/gi, // JavaScript protocols
        /on\w+\s*=/gi, // Event handlers
        /<%[\s\S]*?%>/gi, // Server-side script tags
        /\$\{[\s\S]*?\}/gi, // Template literals
      ],
      ...config
    };

    this.initializeVirusScanner();
  }

  private async initializeVirusScanner(): Promise<void> {
    if (!this.config.enableVirusScanning) return;

    try {
      // Initialize ClamAV scanner (simplified to avoid type issues)
      this.clamScanner = await new NodeClam().init({
        removeInfected: false,
        quarantineInfected: false,
        preference: 'clamscan'
      } as any);
      console.log('🛡️ [SECURITY] Virus scanner initialized successfully');
    } catch (error) {
      console.warn('⚠️ [SECURITY] Virus scanner not available, skipping virus scanning:', error);
      this.config.enableVirusScanning = false;
    }
  }

  /**
   * Comprehensive file validation with multiple security layers
   */
  async validateFile(fileBuffer: Buffer, originalName: string): Promise<FileValidationResult> {
    const errors: string[] = [];
    let processedBuffer = fileBuffer;

    try {
      // Layer 1: Size validation
      if (fileBuffer.length > this.config.maxSizeBytes) {
        errors.push(`حجم فایل نباید بیشتر از ${this.formatFileSize(this.config.maxSizeBytes)} باشد`);
      }

      // Layer 2: MIME type detection and validation
      const detectedType = await fileTypeFromBuffer(fileBuffer);
      const declaredMimeType = mime.lookup(originalName) || 'application/octet-stream';
      
      if (!detectedType) {
        errors.push('نوع فایل قابل تشخیص نیست');
        return { isValid: false, errors };
      }

      // Verify MIME type consistency
      if (detectedType.mime !== declaredMimeType && !this.isMimeTypeCompatible(detectedType.mime, declaredMimeType)) {
        errors.push(`نوع فایل مطابقت ندارد. انتظار: ${declaredMimeType}, یافت شده: ${detectedType.mime}`);
      }

      // Check if MIME type is allowed
      if (!this.config.allowedMimeTypes.includes(detectedType.mime)) {
        errors.push(`نوع فایل مجاز نیست: ${detectedType.mime}`);
      }

      // Layer 3: Extension validation
      const fileExtension = path.extname(originalName).toLowerCase();
      if (!this.config.allowedExtensions.includes(fileExtension)) {
        errors.push(`پسوند فایل مجاز نیست: ${fileExtension}`);
      }

      // Layer 4: Content pattern scanning for malicious code
      const contentStr = fileBuffer.toString('utf8');
      for (const pattern of this.config.blockedPatterns) {
        if (pattern.test(contentStr)) {
          errors.push('فایل حاوی محتوای مشکوک است');
          break;
        }
      }

      // Layer 5: Virus scanning (if available)
      if (this.config.enableVirusScanning && this.clamScanner) {
        const scanResult = await this.scanForViruses(fileBuffer);
        if (!scanResult.isClean) {
          errors.push(`فایل آلوده است: ${scanResult.threat || 'تهدید شناسایی شده'}`);
        }
      }

      // Layer 6: Image processing and compression
      if (this.isImageFile(detectedType.mime) && this.config.enableImageCompression) {
        try {
          processedBuffer = await this.processImage(fileBuffer, detectedType.mime);
          console.log(`🖼️ [COMPRESSION] Image compressed: ${fileBuffer.length} → ${processedBuffer.length} bytes`);
        } catch (error) {
          console.error('❌ [COMPRESSION] Image processing failed:', error);
          errors.push('خطا در پردازش تصویر');
        }
      }

      // Calculate file hash for integrity
      const hash = createHash('sha256').update(processedBuffer).digest('hex');

      const metadata = {
        originalSize: fileBuffer.length,
        compressedSize: processedBuffer.length !== fileBuffer.length ? processedBuffer.length : undefined,
        mimeType: detectedType.mime,
        extension: detectedType.ext,
        hash
      };

      return {
        isValid: errors.length === 0,
        errors,
        processedBuffer: errors.length === 0 ? processedBuffer : undefined,
        metadata
      };

    } catch (error) {
      console.error('❌ [SECURITY] File validation error:', error);
      errors.push('خطا در اعتبارسنجی فایل');
      return { isValid: false, errors };
    }
  }

  /**
   * Scan file for viruses using ClamAV
   */
  private async scanForViruses(fileBuffer: Buffer): Promise<SecurityScanResult> {
    if (!this.clamScanner) {
      return { isClean: true };
    }

    try {
      // Write buffer to temporary file for scanning
      const tempPath = `/tmp/scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      fs.writeFileSync(tempPath, fileBuffer);

      const { isInfected, viruses } = await this.clamScanner.scanFile(tempPath);

      // Clean up temporary file
      fs.unlinkSync(tempPath);

      if (isInfected && viruses && viruses.length > 0) {
        return {
          isClean: false,
          threat: viruses[0],
          details: `Virus detected: ${viruses.join(', ')}`
        };
      }

      return { isClean: true };
    } catch (error) {
      console.error('❌ [SECURITY] Virus scanning error:', error);
      // On scanning error, be conservative and reject
      return {
        isClean: false,
        threat: 'Scanner Error',
        details: 'Unable to complete virus scan'
      };
    }
  }

  /**
   * Process and compress images
   */
  private async processImage(imageBuffer: Buffer, mimeType: string): Promise<Buffer> {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // Check dimensions and resize if necessary
    let processedImage = image;
    
    if (metadata.width && metadata.height) {
      if (metadata.width > this.config.maxImageDimensions.width || 
          metadata.height > this.config.maxImageDimensions.height) {
        processedImage = processedImage.resize(
          this.config.maxImageDimensions.width, 
          this.config.maxImageDimensions.height, 
          { fit: 'inside', withoutEnlargement: true }
        );
      }
    }

    // Apply compression based on format
    switch (mimeType) {
      case 'image/jpeg':
        return await processedImage
          .jpeg({ quality: this.config.compressionQuality, progressive: true })
          .toBuffer();
      
      case 'image/png':
        return await processedImage
          .png({ quality: this.config.compressionQuality, compressionLevel: 9 })
          .toBuffer();
      
      case 'image/webp':
        return await processedImage
          .webp({ quality: this.config.compressionQuality })
          .toBuffer();
      
      default:
        return imageBuffer; // Return original for unsupported formats
    }
  }

  /**
   * Check if file is an image
   */
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check MIME type compatibility (e.g., image/jpg vs image/jpeg)
   */
  private isMimeTypeCompatible(detected: string, declared: string): boolean {
    const compatibilityMap: Record<string, string[]> = {
      'image/jpeg': ['image/jpg'],
      'image/jpg': ['image/jpeg'],
    };

    return compatibilityMap[detected]?.includes(declared) || 
           compatibilityMap[declared]?.includes(detected) || 
           false;
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
   * Get file security report
   */
  generateSecurityReport(validationResult: FileValidationResult): string {
    const { metadata, isValid, errors } = validationResult;
    
    let report = `🛡️ گزارش امنیتی فایل:\n`;
    report += `✅ وضعیت: ${isValid ? 'تأیید شده' : 'رد شده'}\n`;
    
    if (metadata) {
      report += `📊 حجم اصلی: ${this.formatFileSize(metadata.originalSize)}\n`;
      if (metadata.compressedSize) {
        report += `📊 حجم فشرده: ${this.formatFileSize(metadata.compressedSize)}\n`;
        const ratio = ((metadata.originalSize - metadata.compressedSize) / metadata.originalSize * 100);
        report += `📉 نرخ فشردگی: ${ratio.toFixed(1)}%\n`;
      }
      report += `🔍 نوع: ${metadata.mimeType}\n`;
      report += `🏷️ پسوند: ${metadata.extension}\n`;
      report += `🔐 هش: ${metadata.hash.substring(0, 16)}...\n`;
    }
    
    if (errors.length > 0) {
      report += `❌ خطاها:\n${errors.map(e => `  • ${e}`).join('\n')}\n`;
    }
    
    return report;
  }
}

// Export configured instance
export const fileSecurityService = new FileSecurityService({
  maxSizeBytes: 10 * 1024 * 1024, // 10MB for production
  enableImageCompression: true,
  compressionQuality: 85,
  maxImageDimensions: { width: 1920, height: 1080 },
  enableVirusScanning: true,
});