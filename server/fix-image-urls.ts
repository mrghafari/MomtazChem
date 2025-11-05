import { db } from './db';
import { shopProducts } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function fixImageUrls() {
  try {
    console.log('🔧 [FIX IMAGES] Starting image URL fix...');
    
    // Get all products with image_urls
    const products = await db.select({
      id: shopProducts.id,
      name: shopProducts.name,
      imageUrls: shopProducts.imageUrls,
      thumbnailUrl: shopProducts.thumbnailUrl
    }).from(shopProducts);
    
    console.log(`📦 [FIX IMAGES] Found ${products.length} products to check`);
    
    let updatedCount = 0;
    
    for (const product of products) {
      let needsUpdate = false;
      let newImageUrls: string[] = [];
      let newThumbnailUrl = product.thumbnailUrl;
      
      // Fix image_urls array
      if (product.imageUrls && Array.isArray(product.imageUrls)) {
        for (const url of product.imageUrls) {
          if (typeof url === 'string') {
            // Convert direct S3 URLs to proxy format
            if (url.includes('momtazchem.s3.') || url.includes('.amazonaws.com')) {
              const filename = url.split('/').pop();
              const newUrl = `/uploads/product-images/${filename}`;
              console.log(`  📝 Converting: ${url} → ${newUrl}`);
              newImageUrls.push(newUrl);
              needsUpdate = true;
            }
            // Convert old /uploads/images/ to /uploads/product-images/
            else if (url.startsWith('/uploads/images/')) {
              const filename = url.replace('/uploads/images/', '');
              const newUrl = `/uploads/product-images/${filename}`;
              console.log(`  📝 Converting: ${url} → ${newUrl}`);
              newImageUrls.push(newUrl);
              needsUpdate = true;
            }
            // Convert /objects/images/ to /uploads/product-images/
            else if (url.startsWith('/objects/images/')) {
              const filename = url.replace('/objects/images/', '');
              const newUrl = `/uploads/product-images/${filename}`;
              console.log(`  📝 Converting: ${url} → ${newUrl}`);
              newImageUrls.push(newUrl);
              needsUpdate = true;
            }
            // Keep /uploads/product-images/ as is
            else if (url.startsWith('/uploads/product-images/')) {
              newImageUrls.push(url);
            }
            else {
              newImageUrls.push(url);
            }
          }
        }
      }
      
      // Fix thumbnail_url
      if (product.thumbnailUrl && typeof product.thumbnailUrl === 'string') {
        const url = product.thumbnailUrl;
        
        if (url.includes('momtazchem.s3.') || url.includes('.amazonaws.com')) {
          const filename = url.split('/').pop();
          newThumbnailUrl = `/uploads/product-images/${filename}`;
          console.log(`  🖼️ Thumbnail: ${url} → ${newThumbnailUrl}`);
          needsUpdate = true;
        }
        else if (url.startsWith('/uploads/images/')) {
          const filename = url.replace('/uploads/images/', '');
          newThumbnailUrl = `/uploads/product-images/${filename}`;
          console.log(`  🖼️ Thumbnail: ${url} → ${newThumbnailUrl}`);
          needsUpdate = true;
        }
        else if (url.startsWith('/objects/images/')) {
          const filename = url.replace('/objects/images/', '');
          newThumbnailUrl = `/uploads/product-images/${filename}`;
          console.log(`  🖼️ Thumbnail: ${url} → ${newThumbnailUrl}`);
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        await db.update(shopProducts)
          .set({
            imageUrls: newImageUrls.length > 0 ? newImageUrls : product.imageUrls,
            thumbnailUrl: newThumbnailUrl
          })
          .where(sql`${shopProducts.id} = ${product.id}`);
        
        console.log(`✅ [FIX IMAGES] Updated product ${product.id}: ${product.name}`);
        updatedCount++;
      }
    }
    
    console.log(`\n✅ [FIX IMAGES] Complete! Updated ${updatedCount} products`);
    
  } catch (error) {
    console.error('❌ [FIX IMAGES] Error:', error);
  }
}

fixImageUrls();
