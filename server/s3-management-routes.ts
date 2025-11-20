import { Router } from 'express';
import { getAwsS3Service } from './aws-s3-service';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * List all files in S3 bucket (Admin only)
 */
router.get('/api/admin/s3/list/:prefix?', async (req, res) => {
  try {
    const prefix = req.params.prefix || '';
    const s3Service = getAwsS3Service();
    
    const result = await s3Service.listFiles(prefix);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('❌ Error listing S3 files:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطا در لیست کردن فایل‌ها'
    });
  }
});

/**
 * Check which product images are missing from S3
 */
router.get('/api/admin/s3/check-missing-images', async (req, res) => {
  try {
    const { pool } = await import('./db');
    
    // Get all products directly from database instead of HTTP call  
    const productsResult = await pool.query(`
      SELECT id, name, image_url as "imageUrl"
      FROM products
    `);
    const products = productsResult.rows;
    
    // Get all files in S3
    const s3Service = getAwsS3Service();
    const productImagesResult = await s3Service.listFiles('product-images/');
    const generalFilesResult = await s3Service.listFiles('general-files/');
    
    const s3Files = new Set([
      ...productImagesResult.files.map(f => f.key),
      ...generalFilesResult.files.map(f => f.key)
    ]);
    
    // Extract all image URLs from products
    const allImageUrls: Set<string> = new Set();
    products.forEach((product: any) => {
      if (product.imageUrl) {
        allImageUrls.add(product.imageUrl);
      }
    });
    
    // Check which images are missing
    const missingImages: Array<{url: string; expectedKey: string; status: string}> = [];
    const foundImages: string[] = [];
    
    allImageUrls.forEach(url => {
      // Extract the S3 key from various URL patterns
      let s3Key = '';
      
      if (url.startsWith('/objects/images/')) {
        s3Key = 'product-images/' + url.replace('/objects/images/', '');
      } else if (url.startsWith('/uploads/images/')) {
        s3Key = 'product-images/' + url.replace('/uploads/images/', '');
      } else if (url.startsWith('/uploads/general-files/')) {
        s3Key = url.replace('/uploads/', '');
      }
      
      if (s3Key && !s3Files.has(s3Key)) {
        missingImages.push({
          url,
          expectedKey: s3Key,
          status: 'missing_in_s3'
        });
      } else if (s3Key) {
        foundImages.push(url);
      }
    });
    
    res.json({
      success: true,
      data: {
        totalProducts: products.length,
        totalImageReferences: allImageUrls.size,
        totalInS3: foundImages.length,
        totalMissing: missingImages.length,
        missingImages,
        s3Summary: {
          productImages: productImagesResult.totalCount,
          generalFiles: generalFilesResult.totalCount
        }
      }
    });
  } catch (error: any) {
    console.error('❌ Error checking missing images:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطا در بررسی عکس‌های گمشده'
    });
  }
});

/**
 * Upload missing image to S3 with the exact expected key
 */
router.post('/api/admin/s3/upload-missing-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'فایلی انتخاب نشده است'
      });
    }

    const expectedKey = req.body.expectedKey;
    if (!expectedKey) {
      return res.status(400).json({
        success: false,
        message: 'expectedKey ارسال نشده است'
      });
    }

    const s3Service = getAwsS3Service();
    
    // Upload to S3 with the exact expected key
    const result = await s3Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      expectedKey.split('/')[0] // folder name (product-images, general-files, etc.)
    );

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      data: {
        url: result.url,
        key: result.key,
        message: 'عکس با موفقیت آپلود شد'
      }
    });
  } catch (error: any) {
    console.error('❌ Error uploading missing image:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطا در آپلود عکس'
    });
  }
});

/**
 * Bulk upload all missing images at once
 */
router.post('/api/admin/s3/bulk-upload-missing', upload.array('files', 50), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'فایلی انتخاب نشده است'
      });
    }

    const s3Service = getAwsS3Service();
    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        const result = await s3Service.uploadPublicFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          'product-images',
          { preserveFileName: true }
        );

        results.push({
          fileName: file.originalname,
          success: result.success,
          url: result.url,
          key: result.key
        });
      } catch (error: any) {
        errors.push({
          fileName: file.originalname,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        totalUploaded: results.filter(r => r.success).length,
        totalFailed: errors.length,
        results,
        errors
      }
    });
  } catch (error: any) {
    console.error('❌ Error in bulk upload:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطا در آپلود دسته‌جمعی'
    });
  }
});

/**
 * Fix product image URLs - Convert /uploads/ and /objects/ paths to S3 URLs
 */
router.post('/api/admin/s3/fix-product-urls', async (req, res) => {
  try {
    const { pool } = await import('./db');
    const s3Service = getAwsS3Service();
    
    console.log('🔍 Starting product image URL fix...');
    
    // Get all files from S3
    const [generalFiles, productImages] = await Promise.all([
      s3Service.listFiles('general-files/'),
      s3Service.listFiles('product-images/')
    ]);
    
    // Create a map: filename → S3 URL
    const s3FileMap = new Map<string, string>();
    
    [...generalFiles.files, ...productImages.files].forEach(file => {
      const filename = file.key.split('/').pop();
      if (filename) {
        s3FileMap.set(filename, s3Service.getPublicUrl(file.key));
      }
    });
    
    console.log(`✅ Found ${s3FileMap.size} files in S3`);
    
    // Get all products
    const result = await pool.query(`
      SELECT id, name, image_urls, thumbnail_url 
      FROM shop_products
    `);
    
    console.log(`📋 Processing ${result.rows.length} products...`);
    
    let updatedCount = 0;
    let unchangedCount = 0;
    const updates = [];
    
    for (const product of result.rows) {
      let needsUpdate = false;
      let updatedImageUrls = product.image_urls;
      let updatedThumbnail = product.thumbnail_url;
      const details: any = { id: product.id, name: product.name, changes: [] };
      
      // Fix image_urls array
      if (Array.isArray(product.image_urls)) {
        const newUrls = product.image_urls.map((url: string) => {
          // Skip if already S3 URL
          if (url.startsWith('https://') && url.includes('amazonaws.com')) {
            return url;
          }
          
          // Extract filename from old path
          const filename = url.split('/').pop();
          if (filename && s3FileMap.has(filename)) {
            needsUpdate = true;
            const s3Url = s3FileMap.get(filename)!;
            details.changes.push({ from: url, to: s3Url });
            return s3Url;
          }
          
          details.changes.push({ from: url, to: url, status: 'not_found_in_s3' });
          return url;
        });
        
        updatedImageUrls = newUrls;
      }
      
      // Fix thumbnail_url
      if (product.thumbnail_url && !product.thumbnail_url.startsWith('https://')) {
        const filename = product.thumbnail_url.split('/').pop();
        if (filename && s3FileMap.has(filename)) {
          needsUpdate = true;
          updatedThumbnail = s3FileMap.get(filename)!;
          details.changes.push({ 
            type: 'thumbnail', 
            from: product.thumbnail_url, 
            to: updatedThumbnail 
          });
        }
      }
      
      if (needsUpdate) {
        await pool.query(`
          UPDATE shop_products 
          SET image_urls = $1, thumbnail_url = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [JSON.stringify(updatedImageUrls), updatedThumbnail, product.id]);
        
        console.log(`✅ Updated: ${product.name} (ID: ${product.id})`);
        updatedCount++;
        details.status = 'updated';
      } else {
        unchangedCount++;
        details.status = 'unchanged';
      }
      
      updates.push(details);
    }
    
    console.log(`📊 Summary: ${updatedCount} updated, ${unchangedCount} unchanged`);
    
    res.json({
      success: true,
      data: {
        totalProducts: result.rows.length,
        updatedCount,
        unchangedCount,
        s3FilesCount: s3FileMap.size,
        updates
      }
    });
    
  } catch (error: any) {
    console.error('❌ Error fixing product URLs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'خطا در تصحیح آدرس‌ها'
    });
  }
});

export default router;
