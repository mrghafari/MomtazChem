/**
 * Fix Product Image URLs - Convert /uploads/ and /objects/ paths to S3 URLs
 * 
 * This script matches local file paths with actual S3 files and updates the database
 */

import { pool } from './db';
import { getAwsS3Service } from './aws-s3-service';

async function fixProductImageUrls() {
  console.log('🔍 Starting product image URL fix - Converting to S3 URLs...\n');
  
  try {
    const s3Service = getAwsS3Service();
    
    // Get all files from S3
    console.log('📦 Fetching S3 files...');
    const [generalFiles, productImages] = await Promise.all([
      s3Service.listFiles('general-files/'),
      s3Service.listFiles('product-images/')
    ]);
    
    // Create a map: filename → S3 URL
    const s3FileMap = new Map<string, string>();
    
    [...generalFiles.files, ...productImages.files].forEach(file => {
      const filename = file.key.split('/').pop();
      if (filename) {
        s3FileMap.set(filename, s3Service.getFileUrl(file.key));
      }
    });
    
    console.log(`✅ Found ${s3FileMap.size} files in S3\n`);
    
    // Get all products
    const result = await pool.query(`
      SELECT id, name, image_urls, thumbnail_url 
      FROM shop_products
    `);
    
    console.log(`📋 Processing ${result.rows.length} products...\n`);
    
    let updatedCount = 0;
    let unchangedCount = 0;
    
    for (const product of result.rows) {
      let needsUpdate = false;
      let updatedImageUrls = product.image_urls;
      let updatedThumbnail = product.thumbnail_url;
      
      // Fix image_urls array
      if (Array.isArray(product.image_urls)) {
        const newUrls = product.image_urls.map((url: string) => {
          // Skip if already S3 URL
          if (url.startsWith('https://') && url.includes('amazonaws.com')) {
            return url;
          }
          
          // Extract filename from old path (/uploads/..., /objects/...)
          const filename = url.split('/').pop();
          if (filename && s3FileMap.has(filename)) {
            needsUpdate = true;
            const s3Url = s3FileMap.get(filename)!;
            console.log(`  🔀 ${url} → ${s3Url}`);
            return s3Url;
          }
          
          console.log(`  ⚠️  Not found in S3: ${url}`);
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
          console.log(`  🔀 Thumbnail: ${product.thumbnail_url} → ${updatedThumbnail}`);
        }
      }
      
      if (needsUpdate) {
        await pool.query(`
          UPDATE shop_products 
          SET image_urls = $1, thumbnail_url = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [JSON.stringify(updatedImageUrls), updatedThumbnail, product.id]);
        
        console.log(`✅ Updated: ${product.name} (ID: ${product.id})\n`);
        updatedCount++;
      } else {
        console.log(`⏭️  Skipped: ${product.name} (ID: ${product.id}) - URLs already correct\n`);
        unchangedCount++;
      }
    }
    
    console.log('='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   ✅ Updated: ${updatedCount} products`);
    console.log(`   ⏭️  Unchanged: ${unchangedCount} products`);
    console.log(`   📦 Total S3 files: ${s3FileMap.size}`);
    console.log('='.repeat(60));
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing image URLs:', error);
    process.exit(1);
  }
}

fixProductImageUrls();
