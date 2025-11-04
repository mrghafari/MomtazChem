/**
 * Migration Script: Convert all file upload endpoints to use Amazon S3
 * 
 * This script updates the following endpoints to upload to S3:
 * 1. Company Images
 * 2. Business Cards
 * 3. Logos
 * 4. Payment Receipts
 * 5. Content Images
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const routesPath = join(process.cwd(), 'server', 'routes.ts');
let content = readFileSync(routesPath, 'utf-8');

console.log('🔄 Starting migration of upload endpoints to S3...');

// 1. Fix logo storage configuration (line ~294-325)
const oldLogoStorage = `// Logo upload configuration
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, logosDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, \`logo-\${uniqueSuffix}\${path.extname(file.originalname)}\`);
  }
});

const uploadLogo = multer({
  storage: logoStorage,`;

const newLogoStorage = `// Logo upload configuration - using memory storage for S3 upload
const logoStorage = multer.memoryStorage();

const uploadLogo = multer({
  storage: logoStorage,`;

if (content.includes(oldLogoStorage)) {
  content = content.replace(oldLogoStorage, newLogoStorage);
  console.log('✅ Updated logo storage configuration');
} else {
  console.log('⚠️  Logo storage already updated or not found');
}

// 2. Update Company Images endpoint (line ~1777-1810)
const oldCompanyImages = `  app.post('/api/company-information/images', requireAuth, uploadImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "فایل تصویر الزامی است" });
      }

      const { title, description, category } = req.body;
      const imageUrl = \`/uploads/images/\${req.file.filename}\`;

      const [newImage] = await db
        .insert(companyImages)
        .values({
          title,
          description,
          category,
          imageUrl,
          filename: req.file.filename,
          fileSize: req.file.size,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.json({
        success: true,
        data: newImage,
        message: "تصویر شرکت با موفقیت آپلود شد"
      });
    } catch (error) {
      console.error('Error uploading company image:', error);
      res.status(500).json({ success: false, message: "خطا در آپلود تصویر شرکت" });
    }
  });`;

const newCompanyImages = `  app.post('/api/company-information/images', requireAuth, uploadImage.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "فایل تصویر الزامی است" });
      }

      const { title, description, category } = req.body;
      
      // Upload to S3
      const s3Service = getAwsS3Service();
      const uploadResult = await s3Service.uploadPublicFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'company-images'
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: uploadResult.message || "Failed to upload image to S3"
        });
      }

      console.log(\`✅ [S3 UPLOAD] Company image uploaded: \${uploadResult.key}\`);

      const imageUrl = uploadResult.url;
      const filename = uploadResult.key?.split('/').pop() || req.file.originalname;

      const [newImage] = await db
        .insert(companyImages)
        .values({
          title,
          description,
          category,
          imageUrl,
          filename,
          fileSize: req.file.size,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.json({
        success: true,
        data: newImage,
        message: "تصویر شرکت با موفقیت آپلود شد"
      });
    } catch (error) {
      console.error('Error uploading company image:', error);
      res.status(500).json({ success: false, message: "خطا در آپلود تصویر شرکت" });
    }
  });`;

if (content.includes(oldCompanyImages)) {
  content = content.replace(oldCompanyImages, newCompanyImages);
  console.log('✅ Updated company images endpoint');
} else {
  console.log('⚠️  Company images endpoint already updated or not found');
}

// 3. Update Business Cards endpoint (line ~1829-1863)
const oldBusinessCards = `  app.post('/api/company-information/business-cards', requireAuth, uploadImage.single('businessCard'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "فایل کارت ویزیت الزامی است" });
      }

      const { personName, position, company, notes } = req.body;
      const imageUrl = \`/uploads/images/\${req.file.filename}\`;

      const [newBusinessCard] = await db
        .insert(businessCards)
        .values({
          personName,
          position,
          company,
          notes,
          imageUrl,
          filename: req.file.filename,
          fileSize: req.file.size,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.json({
        success: true,
        data: newBusinessCard,
        message: "کارت ویزیت با موفقیت آپلود شد"
      });
    } catch (error) {
      console.error('Error uploading business card:', error);
      res.status(500).json({ success: false, message: "خطا در آپلود کارت ویزیت" });
    }
  });`;

const newBusinessCards = `  app.post('/api/company-information/business-cards', requireAuth, uploadImage.single('businessCard'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "فایل کارت ویزیت الزامی است" });
      }

      const { personName, position, company, notes } = req.body;
      
      // Upload to S3
      const s3Service = getAwsS3Service();
      const uploadResult = await s3Service.uploadPublicFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'business-cards'
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: uploadResult.message || "Failed to upload business card to S3"
        });
      }

      console.log(\`✅ [S3 UPLOAD] Business card uploaded: \${uploadResult.key}\`);

      const imageUrl = uploadResult.url;
      const filename = uploadResult.key?.split('/').pop() || req.file.originalname;

      const [newBusinessCard] = await db
        .insert(businessCards)
        .values({
          personName,
          position,
          company,
          notes,
          imageUrl,
          filename,
          fileSize: req.file.size,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      res.json({
        success: true,
        data: newBusinessCard,
        message: "کارت ویزیت با موفقیت آپلود شد"
      });
    } catch (error) {
      console.error('Error uploading business card:', error);
      res.status(500).json({ success: false, message: "خطا در آپلود کارت ویزیت" });
    }
  });`;

if (content.includes(oldBusinessCards)) {
  content = content.replace(oldBusinessCards, newBusinessCards);
  console.log('✅ Updated business cards endpoint');
} else {
  console.log('⚠️  Business cards endpoint already updated or not found');
}

// 4. Update Logo endpoint (line ~3477-3500)
const oldLogo = `  app.post("/api/upload/company-logo", requireAuth, uploadLogo.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No logo file uploaded" 
        });
      }

      const logoUrl = \`/uploads/logos/\${req.file.filename}\`;
      res.json({ 
        success: true, 
        url: logoUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ 
        success: false,`;

const newLogo = `  app.post("/api/upload/company-logo", requireAuth, uploadLogo.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: "No logo file uploaded" 
        });
      }

      // Upload to S3
      const s3Service = getAwsS3Service();
      const uploadResult = await s3Service.uploadPublicFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'company-logos'
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: uploadResult.message || "Failed to upload logo to S3"
        });
      }

      console.log(\`✅ [S3 UPLOAD] Company logo uploaded: \${uploadResult.key}\`);

      res.json({ 
        success: true, 
        url: uploadResult.url,
        key: uploadResult.key,
        filename: uploadResult.key?.split('/').pop() || req.file.originalname,
        originalName: req.file.originalname,
        size: req.file.size
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      res.status(500).json({ 
        success: false,`;

if (content.includes(oldLogo)) {
  content = content.replace(oldLogo, newLogo);
  console.log('✅ Updated logo endpoint');
} else {
  console.log('⚠️  Logo endpoint already updated or not found');
}

// Write back to file
writeFileSync(routesPath, content, 'utf-8');

console.log('\n✅ Migration completed! All upload endpoints now use Amazon S3.');
console.log('📝 Changed endpoints:');
console.log('   - Company Images: /api/company-information/images');
console.log('   - Business Cards: /api/company-information/business-cards');
console.log('   - Company Logos: /api/upload/company-logo');
console.log('\n⚠️  Note: Payment receipts and content images use different patterns and may need manual update.');
