import fs from 'fs';
import path from 'path';

interface MigrationReport {
  timestamp: string;
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  errors: string[];
  urlMapping: Array<[string, string]>;
}

async function cleanupMigratedFiles() {
  console.log('🧹 Starting cleanup of migrated files...\n');

  // Read migration report
  const reportPath = 'migration-report.json';
  if (!fs.existsSync(reportPath)) {
    console.error('❌ Migration report not found!');
    console.error('Please run migration first before cleanup.');
    process.exit(1);
  }

  const reportContent = fs.readFileSync(reportPath, 'utf8');
  const report: MigrationReport = JSON.parse(reportContent);

  console.log('📊 Migration Report Summary:');
  console.log(`   Total files: ${report.totalFiles}`);
  console.log(`   Successfully migrated: ${report.migratedFiles}`);
  console.log(`   Failed: ${report.failedFiles}\n`);

  if (report.migratedFiles === 0) {
    console.log('⚠️  No files were migrated, nothing to clean up.');
    process.exit(0);
  }

  // Get list of successfully migrated files
  const migratedFiles = report.urlMapping.map(([oldUrl, newUrl]) => {
    // Convert URL to local path
    // Example: /uploads/images/product-123.png → uploads/images/product-123.png
    return oldUrl.startsWith('/') ? oldUrl.substring(1) : oldUrl;
  });

  console.log(`🗑️  Preparing to delete ${migratedFiles.length} migrated files...\n`);

  let deletedCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  for (const filePath of migratedFiles) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`  ✅ Deleted: ${filePath}`);
      } else {
        console.log(`  ⚠️  Not found (already deleted?): ${filePath}`);
      }
    } catch (error: any) {
      errorCount++;
      errors.push(`${filePath}: ${error.message}`);
      console.error(`  ❌ Error deleting ${filePath}: ${error.message}`);
    }
  }

  // Clean up empty directories
  console.log('\n🧹 Cleaning up empty directories...');
  const directories = [
    'uploads/images',
    'uploads/catalogs',
    'uploads/msds',
    'uploads/receipts',
    'uploads/logos',
    'uploads/documents'
  ];

  for (const dir of directories) {
    try {
      if (fs.existsSync(dir)) {
        const files = fs.readdirSync(dir);
        if (files.length === 0) {
          fs.rmdirSync(dir);
          console.log(`  ✅ Removed empty directory: ${dir}`);
        } else {
          console.log(`  ℹ️  Directory not empty: ${dir} (${files.length} files remaining)`);
        }
      }
    } catch (error: any) {
      console.error(`  ⚠️  Could not remove directory ${dir}: ${error.message}`);
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 CLEANUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files deleted: ${deletedCount}`);
  console.log(`Errors: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log(`\n⚠️ Errors (${errors.length}):`);
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err}`);
    });
  }

  // Show disk space saved
  console.log('\n💾 Checking disk space...');
  const uploadsSize = getDirSize('uploads');
  console.log(`   Remaining uploads folder size: ${formatBytes(uploadsSize)}`);
  
  console.log('='.repeat(60) + '\n');
  console.log('✅ Cleanup completed!');
}

function getDirSize(dirPath: string): number {
  let totalSize = 0;
  
  if (!fs.existsSync(dirPath)) {
    return 0;
  }

  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      totalSize += getDirSize(filePath);
    } else {
      totalSize += stats.size;
    }
  }
  
  return totalSize;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Run cleanup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupMigratedFiles()
    .then(() => {
      console.log('✅ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}
