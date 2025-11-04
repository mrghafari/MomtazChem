/**
 * Migration Script: Convert content images endpoint to use Amazon S3
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const routesPath = join(process.cwd(), 'server', 'routes.ts');
let content = readFileSync(routesPath, 'utf-8');

console.log('🔄 Migrating content images endpoint to S3...');

// Find and replace the content images upload endpoint
const oldContentImages = `  // Upload new image asset
  app.post("/api/admin/content/images/upload", requireAuth, async (req: Request, res: Response) => {
    try {
      const multer = await import("multer");
      const path = await import("path");
      const fs = await import("fs");

      // Configure multer for image uploads
      const storage = multer.default.diskStorage({
        destination: (req, file, cb) => {
          const uploadDir = path.join(process.cwd(), 'uploads', 'content');
          if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
          }
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const extension = path.extname(file.originalname);
          cb(null, \`content-\${uniqueSuffix}\${extension}\`);
        }
      });

      const upload = multer.default({
        storage,
        fileFilter: (req, file, cb) => {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'));
          }
        },
        limits: {
          fileSize: 5 * 1024 * 1024 // 5MB limit
        }
      }).single('image');

      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "No image file uploaded"
          });
        }

        try {
          const { db } = await import("./db");
          const { imageAssets } = await import("../shared/content-schema");

          const { section = 'general', alt = '' } = req.body;
          const imageUrl = \`/uploads/content/\${req.file.filename}\`;

          const [newImage] = await db
            .insert(imageAssets)
            .values({
              filename: req.file.filename,
              originalName: req.file.originalname,
              mimeType: req.file.mimetype,
              size: req.file.size,
              url: imageUrl,
              alt,
              section,
              isActive: true
            })
            .returning();

          res.json({
            success: true,
            data: newImage,
            message: "Image uploaded successfully"
          });
        } catch (dbError) {
          console.error("Error saving image to database:", dbError);
          res.status(500).json({
            success: false,
            message: "Failed to save image information",
            error: dbError instanceof Error ? dbError.message : 'Unknown error'
          });
        }
      });
    } catch (error) {
      console.error("Error setting up image upload:", error);
      res.status(500).json({`;

const newContentImages = `  // Upload new image asset - uses S3
  app.post("/api/admin/content/images/upload", requireAuth, async (req: Request, res: Response) => {
    try {
      const multer = await import("multer");

      // Configure multer for memory storage (S3 upload)
      const storage = multer.default.memoryStorage();

      const upload = multer.default({
        storage,
        fileFilter: (req, file, cb) => {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new Error('Only image files are allowed'));
          }
        },
        limits: {
          fileSize: 5 * 1024 * 1024 // 5MB limit
        }
      }).single('image');

      upload(req, res, async (err) => {
        if (err) {
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: "No image file uploaded"
          });
        }

        try {
          // Upload to S3
          const s3Service = getAwsS3Service();
          const uploadResult = await s3Service.uploadPublicFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype,
            'content-images'
          );

          if (!uploadResult.success) {
            return res.status(500).json({
              success: false,
              message: uploadResult.message || "Failed to upload image to S3"
            });
          }

          console.log(\`✅ [S3 UPLOAD] Content image uploaded: \${uploadResult.key}\`);

          const { db } = await import("./db");
          const { imageAssets } = await import("../shared/content-schema");

          const { section = 'general', alt = '' } = req.body;
          const imageUrl = uploadResult.url;
          const filename = uploadResult.key?.split('/').pop() || req.file.originalname;

          const [newImage] = await db
            .insert(imageAssets)
            .values({
              filename,
              originalName: req.file.originalname,
              mimeType: req.file.mimetype,
              size: req.file.size,
              url: imageUrl,
              alt,
              section,
              isActive: true
            })
            .returning();

          res.json({
            success: true,
            data: newImage,
            message: "Image uploaded successfully"
          });
        } catch (dbError) {
          console.error("Error saving image to database:", dbError);
          res.status(500).json({
            success: false,
            message: "Failed to save image information",
            error: dbError instanceof Error ? dbError.message : 'Unknown error'
          });
        }
      });
    } catch (error) {
      console.error("Error setting up image upload:", error);
      res.status(500).json({`;

if (content.includes(oldContentImages)) {
  content = content.replace(oldContentImages, newContentImages);
  console.log('✅ Updated content images endpoint to use S3');
  writeFileSync(routesPath, content, 'utf-8');
  console.log('✅ Migration completed!');
} else {
  console.log('⚠️  Content images endpoint already updated or pattern not found');
}
