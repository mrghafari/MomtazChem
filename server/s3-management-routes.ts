import { Router } from 'express';
import { getAwsS3Service } from './aws-s3-service';

const router = Router();

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
    
    // Get all products from API (they're loaded from somewhere)
    const productsResponse = await fetch('http://localhost:5000/api/products');
    const products = await productsResponse.json();
    
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
      if (product.imageUrl) allImageUrls.add(product.imageUrl);
      if (product.imageUrls && Array.isArray(product.imageUrls)) {
        product.imageUrls.forEach((url: string) => allImageUrls.add(url));
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

export default router;
