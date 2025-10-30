import fs from 'fs';
import path from 'path';
import { getAwsS3Service, initializeAwsS3FromDb } from './aws-s3-service';
import { db } from './db';
import { customerDb } from './customer-db';
import { shopProducts } from '@shared/shop-schema';
import { customerOrders } from '@shared/customer-schema';
import { eq, sql } from 'drizzle-orm';

interface MigrationResult {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  errors: string[];
  urlMapping: Map<string, string>;
}

interface FileToMigrate {
  localPath: string;
  s3Folder: string;
  fileName: string;
}

async function getAllFilesToMigrate(): Promise<FileToMigrate[]> {
  const files: FileToMigrate[] = [];
  const uploadsDir = 'uploads';

  const folderMapping: Record<string, string> = {
    'images': 'product-images',
    'catalogs': 'product-catalogs',
    'msds': 'product-msds',
    'receipts': 'payment-receipts',
    'logos': 'company-logos',
    'documents': 'documents'
  };

  for (const [localFolder, s3Folder] of Object.entries(folderMapping)) {
    const folderPath = path.join(uploadsDir, localFolder);
    
    if (!fs.existsSync(folderPath)) {
      console.log(`⚠️ Folder ${folderPath} does not exist, skipping...`);
      continue;
    }

    const filesInFolder = fs.readdirSync(folderPath);
    
    for (const fileName of filesInFolder) {
      const filePath = path.join(folderPath, fileName);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile()) {
        files.push({
          localPath: filePath,
          s3Folder: s3Folder,
          fileName: fileName
        });
      }
    }
  }

  return files;
}

async function migrateFile(file: FileToMigrate, s3Service: any): Promise<{ success: boolean; oldUrl: string; newUrl?: string; error?: string }> {
  try {
    // Read file
    const fileBuffer = fs.readFileSync(file.localPath);
    
    // Determine MIME type based on extension
    const ext = path.extname(file.fileName).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };
    
    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    // Upload to S3
    const uploadResult = await s3Service.uploadFile(
      fileBuffer,
      file.fileName,
      mimeType,
      file.s3Folder
    );

    if (!uploadResult.success) {
      return {
        success: false,
        oldUrl: `/uploads/${file.s3Folder === 'product-images' ? 'images' : file.s3Folder.replace('product-', '')}/${file.fileName}`,
        error: uploadResult.message || 'Upload failed'
      };
    }

    const oldUrl = `/uploads/${file.s3Folder === 'product-images' ? 'images' : file.s3Folder.replace('product-', '')}/${file.fileName}`;
    
    console.log(`✅ Migrated: ${file.fileName} → ${uploadResult.url}`);

    return {
      success: true,
      oldUrl: oldUrl,
      newUrl: uploadResult.url
    };

  } catch (error: any) {
    console.error(`❌ Error migrating ${file.fileName}:`, error.message);
    return {
      success: false,
      oldUrl: file.localPath,
      error: error.message
    };
  }
}

async function updateDatabaseUrls(urlMapping: Map<string, string>): Promise<void> {
  console.log('\n📝 Updating database URLs...');
  
  let updatedProducts = 0;
  let updatedOrders = 0;
  let updatedReceipts = 0;

  // Update shop_products table
  for (const [oldUrl, newUrl] of urlMapping.entries()) {
    try {
      // Update product images (imageUrls is a JSON array)
      if (oldUrl.includes('/images/')) {
        // Find products with this URL in their imageUrls array
        const products = await db
          .select()
          .from(shopProducts)
          .where(sql`${shopProducts.imageUrls}::text LIKE ${`%${oldUrl}%`}`);
        
        for (const product of products) {
          const imageUrls = product.imageUrls as string[] || [];
          const updatedUrls = imageUrls.map(url => url === oldUrl ? newUrl : url);
          
          await db
            .update(shopProducts)
            .set({ imageUrls: updatedUrls })
            .where(eq(shopProducts.id, product.id));
          
          updatedProducts++;
          console.log(`  ✅ Updated product ${product.id} with image: ${oldUrl}`);
        }
      }

      // Update catalog URLs
      if (oldUrl.includes('/catalogs/')) {
        const result = await db
          .update(shopProducts)
          .set({ pdfCatalogUrl: newUrl })
          .where(eq(shopProducts.pdfCatalogUrl, oldUrl));
        
        if (result.rowCount && result.rowCount > 0) {
          updatedProducts += result.rowCount;
          console.log(`  ✅ Updated ${result.rowCount} product(s) with catalog: ${oldUrl}`);
        }
      }

      // Update MSDS URLs
      if (oldUrl.includes('/msds/')) {
        const result = await db
          .update(shopProducts)
          .set({ msdsUrl: newUrl })
          .where(eq(shopProducts.msdsUrl, oldUrl));
        
        if (result.rowCount && result.rowCount > 0) {
          updatedProducts += result.rowCount;
          console.log(`  ✅ Updated ${result.rowCount} product(s) with MSDS: ${oldUrl}`);
        }
      }

      // Update payment receipts in customer_orders
      if (oldUrl.includes('/receipts/')) {
        const result = await customerDb
          .update(customerOrders)
          .set({ receiptPath: newUrl })
          .where(eq(customerOrders.receiptPath, oldUrl));
        
        if (result.rowCount && result.rowCount > 0) {
          updatedOrders += result.rowCount;
          console.log(`  ✅ Updated ${result.rowCount} order(s) with receipt: ${oldUrl}`);
        }
      }

    } catch (error: any) {
      console.error(`  ❌ Error updating URL ${oldUrl}:`, error.message);
    }
  }

  console.log(`\n📊 Database Update Summary:`);
  console.log(`   Products updated: ${updatedProducts}`);
  console.log(`   Orders updated: ${updatedOrders}`);
  console.log(`   Receipts updated: ${updatedReceipts}`);
}

export async function runMigration(): Promise<MigrationResult> {
  console.log('🚀 Starting migration from local storage to AWS S3...\n');

  const result: MigrationResult = {
    totalFiles: 0,
    migratedFiles: 0,
    failedFiles: 0,
    errors: [],
    urlMapping: new Map()
  };

  try {
    // Initialize S3 service from database
    console.log('🔧 Initializing AWS S3 service from database...');
    await initializeAwsS3FromDb(db);
    
    const s3Service = getAwsS3Service();
    console.log('✅ AWS S3 service initialized\n');

    // Get all files to migrate
    console.log('📂 Scanning files...');
    const files = await getAllFilesToMigrate();
    result.totalFiles = files.length;
    console.log(`   Found ${files.length} files to migrate\n`);

    // Migrate files in batches
    const batchSize = 10;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}...`);

      const batchResults = await Promise.all(
        batch.map(file => migrateFile(file, s3Service))
      );

      for (const batchResult of batchResults) {
        if (batchResult.success && batchResult.newUrl) {
          result.migratedFiles++;
          result.urlMapping.set(batchResult.oldUrl, batchResult.newUrl);
        } else {
          result.failedFiles++;
          if (batchResult.error) {
            result.errors.push(`${batchResult.oldUrl}: ${batchResult.error}`);
          }
        }
      }

      console.log(`   Progress: ${result.migratedFiles}/${files.length} files migrated`);
    }

    // Update database
    if (result.urlMapping.size > 0) {
      await updateDatabaseUrls(result.urlMapping);
    }

    // Save migration report
    const reportPath = 'migration-report.json';
    const report = {
      timestamp: new Date().toISOString(),
      totalFiles: result.totalFiles,
      migratedFiles: result.migratedFiles,
      failedFiles: result.failedFiles,
      errors: result.errors,
      urlMapping: Array.from(result.urlMapping.entries())
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Migration report saved to: ${reportPath}`);

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    result.errors.push(error.message);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files: ${result.totalFiles}`);
  console.log(`✅ Successfully migrated: ${result.migratedFiles}`);
  console.log(`❌ Failed: ${result.failedFiles}`);
  if (result.errors.length > 0) {
    console.log(`\n⚠️ Errors (${result.errors.length}):`);
    result.errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
  }
  console.log('='.repeat(60) + '\n');

  return result;
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('✅ Migration completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}
