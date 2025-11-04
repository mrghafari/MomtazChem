import axios from 'axios';
import { getAwsS3Service, initializeAwsS3FromDb } from './aws-s3-service';
import { db } from './db';
import { customerDb } from './customer-db';
import { shopProducts } from '@shared/shop-schema';
import { customerOrders } from '@shared/customer-schema';
import { eq, sql, isNotNull, ne } from 'drizzle-orm';
import fs from 'fs';

interface MigrationStats {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  errors: string[];
}

async function migrateAllFilesToS3() {
  console.log('🚀 Starting complete migration to Amazon S3...\n');

  const stats: MigrationStats = {
    totalFiles: 0,
    migratedFiles: 0,
    failedFiles: 0,
    errors: []
  };

  try {
    // Initialize S3
    console.log('🔧 Initializing S3 service...');
    await initializeAwsS3FromDb(db);
    const s3Service = getAwsS3Service();
    console.log('✅ S3 service ready\n');

    // 1. Migrate catalogs
    console.log('📚 MIGRATING CATALOGS...\n');
    await migrateCatalogs(s3Service, stats);

    // 2. Migrate MSDS files
    console.log('\n📋 MIGRATING MSDS FILES...\n');
    await migrateMSDS(s3Service, stats);

    // 3. Migrate payment receipts
    console.log('\n💰 MIGRATING PAYMENT RECEIPTS...\n');
    await migratePaymentReceipts(s3Service, stats);

    // Save migration report
    const report = {
      timestamp: new Date().toISOString(),
      stats,
      errors: stats.errors
    };

    fs.writeFileSync('complete-migration-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Migration report saved to: complete-migration-report.json');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    stats.errors.push(`Fatal: ${error.message}`);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPLETE MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files processed: ${stats.totalFiles}`);
  console.log(`✅ Successfully migrated: ${stats.migratedFiles}`);
  console.log(`❌ Failed: ${stats.failedFiles}`);
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors (${stats.errors.length}):`);
    stats.errors.slice(0, 10).forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
    if (stats.errors.length > 10) {
      console.log(`   ... and ${stats.errors.length - 10} more`);
    }
  }
  console.log('='.repeat(60) + '\n');

  return stats;
}

async function migrateCatalogs(s3Service: any, stats: MigrationStats) {
  const products = await db
    .select()
    .from(shopProducts)
    .where(sql`${shopProducts.pdfCatalogUrl} IS NOT NULL AND ${shopProducts.pdfCatalogUrl} != ''`);

  console.log(`   Found ${products.length} products with catalogs`);

  for (const product of products) {
    const catalogUrl = product.pdfCatalogUrl as string;
    stats.totalFiles++;
    
    // Skip if already S3
    if (catalogUrl.includes('s3.') || catalogUrl.includes('amazonaws.com')) {
      console.log(`  ✅ Already in S3: ${catalogUrl}`);
      continue;
    }

    try {
      console.log(`  🔄 Migrating catalog for product ${product.id}: ${catalogUrl}`);
      
      let fullUrl = catalogUrl;
      if (catalogUrl.startsWith('/uploads/') || catalogUrl.startsWith('/objects/') || catalogUrl.startsWith('/replit-objstore')) {
        fullUrl = `http://localhost:5000${catalogUrl}`;
      }

      const response = await axios.get(fullUrl, { 
        responseType: 'arraybuffer',
        timeout: 60000
      });

      const fileBuffer = Buffer.from(response.data);
      const fileName = catalogUrl.split('/').pop() || `catalog-${Date.now()}.pdf`;

      const uploadResult = await s3Service.uploadFile(
        fileBuffer,
        fileName,
        'application/pdf',
        'catalogs'
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      // Convert to local proxy URL
      const localUrl = `/uploads/catalogs/${uploadResult.url.split('/').pop()}`;

      await db
        .update(shopProducts)
        .set({ pdfCatalogUrl: localUrl })
        .where(eq(shopProducts.id, product.id));

      console.log(`  ✅ Migrated and updated: ${localUrl}`);
      stats.migratedFiles++;

    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}`);
      stats.failedFiles++;
      stats.errors.push(`Catalog ${product.id}: ${error.message}`);
    }
  }
}

async function migrateMSDS(s3Service: any, stats: MigrationStats) {
  const products = await db
    .select()
    .from(shopProducts)
    .where(sql`${shopProducts.msdsUrl} IS NOT NULL AND ${shopProducts.msdsUrl} != ''`);

  console.log(`   Found ${products.length} products with MSDS files`);

  for (const product of products) {
    const msdsUrl = product.msdsUrl as string;
    stats.totalFiles++;
    
    // Skip if already S3
    if (msdsUrl.includes('s3.') || msdsUrl.includes('amazonaws.com')) {
      console.log(`  ✅ Already in S3: ${msdsUrl}`);
      
      // Convert S3 URL to local proxy URL
      const match = msdsUrl.match(/\/msds\/([^/?]+)/);
      if (match && match[1]) {
        const fileName = match[1];
        const localUrl = `/uploads/msds/${fileName}`;
        
        await db
          .update(shopProducts)
          .set({ msdsUrl: localUrl })
          .where(eq(shopProducts.id, product.id));
        
        console.log(`  🔄 Converted to local URL: ${localUrl}`);
      }
      continue;
    }

    try {
      console.log(`  🔄 Migrating MSDS for product ${product.id}: ${msdsUrl}`);
      
      let fullUrl = msdsUrl;
      if (msdsUrl.startsWith('/uploads/') || msdsUrl.startsWith('/objects/') || msdsUrl.startsWith('/replit-objstore')) {
        fullUrl = `http://localhost:5000${msdsUrl}`;
      }

      const response = await axios.get(fullUrl, { 
        responseType: 'arraybuffer',
        timeout: 60000
      });

      const fileBuffer = Buffer.from(response.data);
      const fileName = msdsUrl.split('/').pop() || `msds-${Date.now()}.pdf`;

      const uploadResult = await s3Service.uploadFile(
        fileBuffer,
        fileName,
        'application/pdf',
        'msds'
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      // Convert to local proxy URL
      const localUrl = `/uploads/msds/${uploadResult.url.split('/').pop()}`;

      await db
        .update(shopProducts)
        .set({ msdsUrl: localUrl })
        .where(eq(shopProducts.id, product.id));

      console.log(`  ✅ Migrated and updated: ${localUrl}`);
      stats.migratedFiles++;

    } catch (error: any) {
      console.error(`  ❌ Failed: ${error.message}`);
      stats.failedFiles++;
      stats.errors.push(`MSDS ${product.id}: ${error.message}`);
    }
  }
}

async function migratePaymentReceipts(s3Service: any, stats: MigrationStats) {
  const orders = await customerDb
    .select()
    .from(customerOrders)
    .where(sql`${customerOrders.receiptPath} IS NOT NULL AND ${customerOrders.receiptPath} != ''`);

  console.log(`   Found ${orders.length} orders with payment receipts`);

  for (const order of orders) {
    const receiptPath = order.receiptPath as string;
    stats.totalFiles++;
    
    // Skip if already S3
    if (receiptPath.includes('s3.') || receiptPath.includes('amazonaws.com')) {
      console.log(`  ✅ Already in S3: Order ${order.id}`);
      
      // Convert S3 URL to local proxy URL if needed
      const match = receiptPath.match(/\/payment-receipts\/([^/?]+)/);
      if (match && match[1]) {
        const fileName = match[1];
        const localUrl = `/uploads/receipts/${fileName}`;
        
        await customerDb
          .update(customerOrders)
          .set({ receiptPath: localUrl })
          .where(eq(customerOrders.id, order.id));
        
        console.log(`  🔄 Converted to local URL for order ${order.id}`);
      }
      continue;
    }

    try {
      console.log(`  🔄 Migrating receipt for order ${order.id}: ${receiptPath}`);
      
      // Handle Replit Object Storage paths
      let fullUrl = receiptPath;
      if (receiptPath.startsWith('/replit-objstore')) {
        // This is an object storage path - need to use the object storage API
        fullUrl = `http://localhost:5000${receiptPath}`;
      } else if (receiptPath.startsWith('/uploads/')) {
        fullUrl = `http://localhost:5000${receiptPath}`;
      }

      const response = await axios.get(fullUrl, { 
        responseType: 'arraybuffer',
        timeout: 60000
      });

      const fileBuffer = Buffer.from(response.data);
      
      // Determine file extension from content-type or path
      let extension = 'pdf';
      if (receiptPath.includes('.')) {
        extension = receiptPath.split('.').pop() || 'pdf';
      } else if (response.headers['content-type']) {
        const contentType = response.headers['content-type'];
        if (contentType.includes('image/png')) extension = 'png';
        else if (contentType.includes('image/jpeg')) extension = 'jpg';
        else if (contentType.includes('application/pdf')) extension = 'pdf';
      }
      
      const fileName = `receipt-${order.id}-${Date.now()}.${extension}`;
      const contentType = response.headers['content-type'] || 'application/pdf';

      const uploadResult = await s3Service.uploadFile(
        fileBuffer,
        fileName,
        contentType,
        'payment-receipts'
      );

      if (!uploadResult.success || !uploadResult.url) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      // Convert to local proxy URL
      const localUrl = `/uploads/receipts/${uploadResult.url.split('/').pop()}`;

      await customerDb
        .update(customerOrders)
        .set({ receiptPath: localUrl })
        .where(eq(customerOrders.id, order.id));

      console.log(`  ✅ Migrated receipt for order ${order.id}: ${localUrl}`);
      stats.migratedFiles++;

    } catch (error: any) {
      console.error(`  ❌ Failed for order ${order.id}: ${error.message}`);
      stats.failedFiles++;
      stats.errors.push(`Receipt order ${order.id}: ${error.message}`);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllFilesToS3()
    .then(() => {
      console.log('✅ Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

export { migrateAllFilesToS3 };
