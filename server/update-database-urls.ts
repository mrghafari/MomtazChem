import { db } from "./db";
import { shopProducts } from "../shared/shop-schema";
import { paymentReceipts } from "../shared/order-management-schema";
import { eq, or, like, sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

interface MigrationReport {
  urlMapping: [string, string][]; // [oldPath, newS3Url]
}

async function updateDatabaseUrls() {
  console.log("🔄 Starting database URL updates...\n");

  // Read merged migration report
  const reportPath = path.join(process.cwd(), "migration-report-merged.json");
  if (!fs.existsSync(reportPath)) {
    console.error("❌ Merged migration report not found!");
    console.log("ℹ️  Please run: npm run tsx server/merge-migration-reports.ts");
    process.exit(1);
  }

  const report: MigrationReport = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
  
  // Build filename-to-S3-URL mapping for easier lookup
  const filenameMap = new Map<string, string>();
  
  for (const [oldPath, newS3Url] of report.urlMapping) {
    // Extract filename from old path (everything after last '/')
    const filename = oldPath.split('/').pop();
    if (filename) {
      filenameMap.set(filename, newS3Url);
    }
  }

  console.log(`📊 Loaded ${filenameMap.size} file mappings\n`);

  let productsUpdated = 0;
  let receiptsUpdated = 0;

  // Update product images
  console.log("🖼️  Updating product images...");
  const productsWithLocalImages = await db
    .select()
    .from(shopProducts)
    .where(like(shopProducts.thumbnailUrl, "/uploads/%"));

  for (const product of productsWithLocalImages) {
    if (!product.thumbnailUrl) continue;
    
    const filename = product.thumbnailUrl.split('/').pop();
    const s3Url = filename ? filenameMap.get(filename) : null;
    
    if (s3Url) {
      await db
        .update(shopProducts)
        .set({ thumbnailUrl: s3Url })
        .where(eq(shopProducts.id, product.id));
      
      console.log(`  ✅ Updated product ${product.id}: ${filename} → S3`);
      productsUpdated++;
    } else {
      console.log(`  ⚠️  No S3 URL found for product ${product.id}: ${filename}`);
    }
  }

  // Update product MSDS files
  console.log("\n📋 Updating product MSDS files...");
  const productsWithLocalMsds = await db
    .select()
    .from(shopProducts)
    .where(like(shopProducts.msdsUrl, "/uploads/%"));

  for (const product of productsWithLocalMsds) {
    if (!product.msdsUrl) continue;
    
    const filename = product.msdsUrl.split('/').pop();
    const s3Url = filename ? filenameMap.get(filename) : null;
    
    if (s3Url) {
      await db
        .update(shopProducts)
        .set({ msdsUrl: s3Url })
        .where(eq(shopProducts.id, product.id));
      
      console.log(`  ✅ Updated product ${product.id}: ${filename} → S3`);
      productsUpdated++;
    } else {
      console.log(`  ⚠️  No S3 URL found for product ${product.id}: ${filename}`);
    }
  }

  // Update product catalogs
  console.log("\n📚 Updating product catalogs...");
  const productsWithLocalCatalogs = await db
    .select()
    .from(shopProducts)
    .where(like(shopProducts.pdfCatalogUrl, "/uploads/%"));

  for (const product of productsWithLocalCatalogs) {
    if (!product.pdfCatalogUrl) continue;
    
    const filename = product.pdfCatalogUrl.split('/').pop();
    const s3Url = filename ? filenameMap.get(filename) : null;
    
    if (s3Url) {
      await db
        .update(shopProducts)
        .set({ pdfCatalogUrl: s3Url })
        .where(eq(shopProducts.id, product.id));
      
      console.log(`  ✅ Updated product ${product.id}: ${filename} → S3`);
      productsUpdated++;
    } else {
      console.log(`  ⚠️  No S3 URL found for product ${product.id}: ${filename}`);
    }
  }

  // Update payment receipts
  console.log("\n💳 Updating payment receipts...");
  const receiptsWithOldUrls = await db
    .select()
    .from(paymentReceipts)
    .where(
      or(
        like(paymentReceipts.receiptUrl, "/uploads/%"),
        like(paymentReceipts.receiptUrl, "/replit-objstore%")
      )
    );

  for (const receipt of receiptsWithOldUrls) {
    // For Replit Object Storage URLs, we can't match by filename
    // We need to check if there's a receipt file that matches the order/customer
    if (receipt.receiptUrl.startsWith("/replit-objstore")) {
      console.log(`  ⚠️  Replit Object Storage URL found for receipt ${receipt.id}`);
      console.log(`     Customer Order ID: ${receipt.customerOrderId}`);
      console.log(`     These files were not in uploads folder and cannot be migrated`);
      continue;
    }
    
    const filename = receipt.receiptUrl.split('/').pop();
    const s3Url = filename ? filenameMap.get(filename) : null;
    
    if (s3Url) {
      await db
        .update(paymentReceipts)
        .set({ receiptUrl: s3Url })
        .where(eq(paymentReceipts.id, receipt.id));
      
      console.log(`  ✅ Updated receipt ${receipt.id}: ${filename} → S3`);
      receiptsUpdated++;
    } else {
      console.log(`  ⚠️  No S3 URL found for receipt ${receipt.id}: ${filename}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 DATABASE UPDATE SUMMARY");
  console.log("=".repeat(60));
  console.log(`Products updated: ${productsUpdated}`);
  console.log(`Payment receipts updated: ${receiptsUpdated}`);
  console.log(`Total updates: ${productsUpdated + receiptsUpdated}`);
  console.log("=".repeat(60));

  console.log("\n✅ Database URL updates completed!");
}

// Run the update
updateDatabaseUrls()
  .then(() => {
    console.log("✅ All done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error updating database URLs:", error);
    process.exit(1);
  });
