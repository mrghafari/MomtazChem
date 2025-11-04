import { S3Client, PutObjectCommand, GetObjectCommand, HeadBucketCommand, GetObjectCommand as GetObjectCommandType } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { Upload } from '@aws-sdk/lib-storage';
import crypto from 'crypto';
import type { AwsS3Settings } from '../shared/schema';

// Encryption key MUST be set in environment variables for security
const ENCRYPTION_KEY = process.env.AWS_CREDENTIALS_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-cbc';

// Validate encryption key exists
if (!ENCRYPTION_KEY) {
  console.error('❌ AWS_CREDENTIALS_ENCRYPTION_KEY environment variable is not set!');
  console.error('⚠️  AWS S3 integration will not work without a secure encryption key.');
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('AWS_CREDENTIALS_ENCRYPTION_KEY environment variable is not set. Cannot encrypt credentials.');
  }
  
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('AWS_CREDENTIALS_ENCRYPTION_KEY environment variable is not set. Cannot decrypt credentials.');
  }
  
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * AWS S3 Service class
 */
export class AwsS3Service {
  private client: S3Client | null = null;
  private settings: AwsS3Settings | null = null;

  constructor(settings?: AwsS3Settings) {
    if (settings) {
      this.initialize(settings);
    }
  }

  /**
   * Initialize S3 client with settings
   */
  initialize(settings: AwsS3Settings) {
    try {
      // Decrypt keys
      const accessKeyId = settings.accessKeyId.includes(':') 
        ? decrypt(settings.accessKeyId) 
        : settings.accessKeyId;
      const secretAccessKey = settings.secretAccessKey.includes(':') 
        ? decrypt(settings.secretAccessKey) 
        : settings.secretAccessKey;

      // Create S3 client configuration
      const config: any = {
        region: settings.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      };

      // Add custom endpoint if provided
      if (settings.endpoint) {
        config.endpoint = settings.endpoint;
      }

      // Force path style if needed
      if (settings.usePathStyle) {
        config.forcePathStyle = true;
      }

      this.client = new S3Client(config);
      this.settings = settings;
      
      console.log('✅ AWS S3 Client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize AWS S3 Client:', error);
      throw new Error('Failed to initialize AWS S3 client');
    }
  }

  /**
   * Test connection to S3
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.client || !this.settings) {
      return {
        success: false,
        message: 'تنظیمات AWS S3 یافت نشد. ابتدا تنظیمات را ذخیره کنید.'
      };
    }

    try {
      // Try to check if bucket exists
      const command = new HeadBucketCommand({
        Bucket: this.settings.bucketName,
      });

      await this.client.send(command);

      return {
        success: true,
        message: `اتصال به bucket "${this.settings.bucketName}" موفقیت‌آمیز بود ✅`
      };
    } catch (error: any) {
      console.error('S3 Connection Test Error:', error);
      
      if (error.name === 'NotFound') {
        return {
          success: false,
          message: `Bucket "${this.settings.bucketName}" یافت نشد. لطفاً نام bucket را بررسی کنید.`
        };
      } else if (error.name === 'Forbidden') {
        return {
          success: false,
          message: 'دسترسی به bucket رد شد. لطفاً مجوزهای IAM را بررسی کنید.'
        };
      } else if (error.name === 'InvalidAccessKeyId') {
        return {
          success: false,
          message: 'کلید دسترسی نامعتبر است. لطفاً Access Key ID را بررسی کنید.'
        };
      } else if (error.name === 'SignatureDoesNotMatch') {
        return {
          success: false,
          message: 'کلید مخفی نامعتبر است. لطفاً Secret Access Key را بررسی کنید.'
        };
      }

      return {
        success: false,
        message: `خطا در اتصال: ${error.message}`
      };
    }
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<{ success: boolean; url?: string; key?: string; message?: string }> {
    if (!this.client || !this.settings) {
      return {
        success: false,
        message: 'AWS S3 client not initialized'
      };
    }

    try {
      // Generate unique file name
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const extension = fileName.split('.').pop();
      const key = `${folder}/${timestamp}-${randomString}.${extension}`;

      // Upload using multipart upload for better reliability
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.settings.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          // NO ACL - bucket must have policy for public access
        },
      });

      await upload.done();

      // Generate URL
      let url: string;
      if (this.settings.publicUrl) {
        url = `${this.settings.publicUrl}/${key}`;
      } else {
        url = `https://${this.settings.bucketName}.s3.${this.settings.region}.amazonaws.com/${key}`;
      }

      console.log(`✅ File uploaded successfully to S3: ${key}`);

      return {
        success: true,
        url,
        key,
      };
    } catch (error: any) {
      console.error('❌ S3 Upload Error:', error);
      return {
        success: false,
        message: `خطا در آپلود فایل: ${error.message}`
      };
    }
  }

  /**
   * Upload PUBLIC file to S3 (images, catalogs, MSDS)
   * These files will be publicly accessible to anyone
   */
  async uploadPublicFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder: string = 'uploads'
  ): Promise<{ success: boolean; url?: string; key?: string; message?: string }> {
    if (!this.client || !this.settings) {
      return {
        success: false,
        message: 'AWS S3 client not initialized'
      };
    }

    try {
      // Generate unique file name
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const extension = fileName.split('.').pop();
      const key = `${folder}/${timestamp}-${randomString}.${extension}`;

      // Upload file for public access (bucket policy must allow public read)
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.settings.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          // NO ACL - bucket must have policy for public access
        },
      });

      await upload.done();

      // Generate public URL
      let url: string;
      if (this.settings.publicUrl) {
        url = `${this.settings.publicUrl}/${key}`;
      } else {
        url = `https://${this.settings.bucketName}.s3.${this.settings.region}.amazonaws.com/${key}`;
      }

      console.log(`✅ PUBLIC file uploaded to S3: ${key}`);

      return {
        success: true,
        url,
        key,
      };
    } catch (error: any) {
      console.error('❌ S3 Upload Error:', error);
      return {
        success: false,
        message: `خطا در آپلود فایل عمومی: ${error.message}`
      };
    }
  }

  /**
   * Upload PRIVATE file to S3 (receipts, user documents)
   * These files will require signed URLs to access
   */
  async uploadPrivateFile(
    fileBuffer: Buffer,
    fileName: string,
    contentType: string,
    folder: string = 'private'
  ): Promise<{ success: boolean; key?: string; message?: string }> {
    if (!this.client || !this.settings) {
      return {
        success: false,
        message: 'AWS S3 client not initialized'
      };
    }

    try {
      // Generate unique file name
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const extension = fileName.split('.').pop();
      const key = `${folder}/${timestamp}-${randomString}.${extension}`;

      // Upload WITHOUT ACL - file will be private by default
      const upload = new Upload({
        client: this.client,
        params: {
          Bucket: this.settings.bucketName,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
          // NO ACL - file is private by default
        },
      });

      await upload.done();

      console.log(`✅ PRIVATE file uploaded to S3: ${key}`);

      return {
        success: true,
        key, // Return only key, not URL - use getSignedUrl to access
      };
    } catch (error: any) {
      console.error('❌ S3 Upload Error:', error);
      return {
        success: false,
        message: `خطا در آپلود فایل خصوصی: ${error.message}`
      };
    }
  }

  /**
   * Generate a temporary signed URL for accessing private files
   * @param key - S3 object key
   * @param expiresIn - URL expiration time in seconds (default: 1 hour)
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string | null> {
    if (!this.client || !this.settings) {
      console.error('AWS S3 client not initialized');
      return null;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.settings.bucketName,
        Key: key,
      });

      // Generate signed URL that expires in specified seconds
      const signedUrl = await getS3SignedUrl(this.client, command, { expiresIn });
      
      console.log(`✅ Signed URL generated for: ${key} (expires in ${expiresIn}s)`);
      
      return signedUrl;
    } catch (error: any) {
      console.error('❌ Error generating signed URL:', error);
      return null;
    }
  }

  /**
   * Get file from S3
   */
  async getFile(key: string): Promise<Buffer | null> {
    if (!this.client || !this.settings) {
      throw new Error('AWS S3 client not initialized');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.settings.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      
      if (!response.Body) {
        return null;
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      
      return Buffer.concat(chunks);
    } catch (error) {
      console.error('S3 Get File Error:', error);
      return null;
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(key: string): string {
    if (!this.settings) {
      throw new Error('AWS S3 settings not initialized');
    }

    if (this.settings.publicUrl) {
      return `${this.settings.publicUrl}/${key}`;
    }

    return `https://${this.settings.bucketName}.s3.${this.settings.region}.amazonaws.com/${key}`;
  }
}

// Singleton instance
let s3ServiceInstance: AwsS3Service | null = null;

/**
 * Get or create AWS S3 service instance
 */
export function getAwsS3Service(): AwsS3Service {
  if (!s3ServiceInstance) {
    s3ServiceInstance = new AwsS3Service();
  }
  return s3ServiceInstance;
}

/**
 * Initialize AWS S3 service with settings from database
 */
export async function initializeAwsS3FromDb(db: any): Promise<void> {
  try {
    const { awsS3Settings } = await import('../shared/schema');
    const { eq } = await import('drizzle-orm');
    
    // Get active AWS S3 settings
    const settings = await db
      .select()
      .from(awsS3Settings)
      .where(eq(awsS3Settings.isActive, true))
      .limit(1);

    if (settings && settings.length > 0) {
      const service = getAwsS3Service();
      service.initialize(settings[0]);
      console.log('✅ AWS S3 Service initialized from database');
    } else {
      console.log('ℹ️ No active AWS S3 settings found');
    }
  } catch (error) {
    console.error('❌ Failed to initialize AWS S3 from database:', error);
  }
}
