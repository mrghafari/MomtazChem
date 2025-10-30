import fs from "fs";
import path from "path";

interface MigrationReport {
  timestamp: string;
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  errors: any[];
  urlMapping: [string, string][];
}

async function mergeMigrationReports() {
  console.log("📂 Merging migration reports...\n");

  // Read both migration reports
  const firstReportPath = "/tmp/first-migration.json";
  const secondReportPath = path.join(process.cwd(), "migration-report.json");

  if (!fs.existsSync(firstReportPath)) {
    console.error("❌ First migration report not found!");
    process.exit(1);
  }

  if (!fs.existsSync(secondReportPath)) {
    console.error("❌ Second migration report not found!");
    process.exit(1);
  }

  const firstReport: MigrationReport = JSON.parse(fs.readFileSync(firstReportPath, "utf-8"));
  const secondReport: MigrationReport = JSON.parse(fs.readFileSync(secondReportPath, "utf-8"));

  console.log(`📄 First migration: ${firstReport.migratedFiles} files`);
  console.log(`📄 Second migration: ${secondReport.migratedFiles} files`);

  // Combine URL mappings
  const combinedMapping = [...firstReport.urlMapping, ...secondReport.urlMapping];

  // Create merged report
  const mergedReport: MigrationReport = {
    timestamp: new Date().toISOString(),
    totalFiles: firstReport.totalFiles + secondReport.totalFiles,
    migratedFiles: firstReport.migratedFiles + secondReport.migratedFiles,
    failedFiles: firstReport.failedFiles + secondReport.failedFiles,
    errors: [...firstReport.errors, ...secondReport.errors],
    urlMapping: combinedMapping,
  };

  // Save merged report
  const mergedReportPath = path.join(process.cwd(), "migration-report-merged.json");
  fs.writeFileSync(mergedReportPath, JSON.stringify(mergedReport, null, 2));

  console.log(`\n✅ Merged report saved: ${mergedReportPath}`);
  console.log(`📊 Total files: ${mergedReport.totalFiles}`);
  console.log(`✅ Successfully migrated: ${mergedReport.migratedFiles}`);
  console.log(`❌ Failed: ${mergedReport.failedFiles}`);

  // Check for specific product images
  const targetFiles = [
    "product-1755492821626-122755276.jpg",
    "product-1755150312614-512744559.jpg",
    "product-1754492845775-152439449.jpeg",
    "product-1755492619056-737362270.jpg",
    "product-1755492730656-250288965.jpg",
    "product-1761669666979-990578505.png",
    "product-1755492930085-910707439.jpg",
  ];

  console.log("\n🔍 Checking for specific product images in migration reports:");
  for (const targetFile of targetFiles) {
    const found = combinedMapping.find(([oldPath]) => oldPath.includes(targetFile));
    if (found) {
      console.log(`  ✅ Found: ${targetFile}`);
      console.log(`     → ${found[1]}`);
    } else {
      console.log(`  ❌ Not found: ${targetFile}`);
    }
  }

  console.log("\n✅ Merge completed!");
}

mergeMigrationReports()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
