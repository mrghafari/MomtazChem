import { S3Client, PutObjectAclCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

async function makeAllFilesPublic() {
  console.log("🔓 Making all S3 files public...\n");

  // Validate environment variables
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
    console.error("❌ Missing required environment variables:");
    console.error("   - AWS_ACCESS_KEY_ID");
    console.error("   - AWS_SECRET_ACCESS_KEY");
    console.error("   - AWS_S3_BUCKET_NAME");
    process.exit(1);
  }

  // Get S3 client from environment variables
  const client = new S3Client({
    region: process.env.AWS_REGION || 'eu-central-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  try {
    // List all folders to process
    const folders = [
      'product-images',
      'product-catalogs',
      'product-msds',
      'payment-receipts',
      'company-logos',
      'documents',
    ];

    let totalFiles = 0;
    let successCount = 0;
    let errorCount = 0;

    for (const folder of folders) {
      console.log(`\n📁 Processing folder: ${folder}/`);

      // List all objects in this folder
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${folder}/`,
      });

      const listResponse = await client.send(listCommand);
      const objects = listResponse.Contents || [];

      console.log(`   Found ${objects.length} files`);

      for (const object of objects) {
        if (!object.Key) continue;
        
        totalFiles++;

        try {
          // Make file public by setting ACL
          const aclCommand = new PutObjectAclCommand({
            Bucket: bucketName,
            Key: object.Key,
            ACL: 'public-read',
          });

          await client.send(aclCommand);
          
          console.log(`  ✅ Made public: ${object.Key}`);
          successCount++;
        } catch (error: any) {
          console.error(`  ❌ Failed to make public: ${object.Key}`);
          console.error(`     Error: ${error.message}`);
          errorCount++;
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total files: ${totalFiles}`);
    console.log(`✅ Successfully made public: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log("=".repeat(60));

    console.log("\n✅ All files processed!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

makeAllFilesPublic()
  .then(() => {
    console.log("✅ Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
