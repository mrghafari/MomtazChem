/**
 * Migration Script: Convert final remaining upload endpoints to use Amazon S3
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const routesPath = join(process.cwd(), 'server', 'routes.ts');
let content = readFileSync(routesPath, 'utf-8');

console.log('🔄 Migrating final upload endpoints to S3...');

// 1. Update flexible upload endpoint /api/upload
const oldFlexibleUpload = `      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const uploadedFile = files?.file?.[0] || files?.image?.[0];

        if (!uploadedFile) {
          return res.status(400).json({ 
            success: false, 
            message: "No file uploaded" 
          });
        }

        const imageUrl = \`/uploads/images/\${uploadedFile.filename}\`;
        res.json({ 
          success: true, 
          url: imageUrl,
          filename: uploadedFile.filename,
          originalName: uploadedFile.originalname,
          size: uploadedFile.size
        });
      } catch (error) {
        console.error('Upload processing error:', error);
        res.status(500).json({ 
          success: false, 
          message: "Failed to process upload" 
        });
      }`;

const newFlexibleUpload = `      try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        const uploadedFile = files?.file?.[0] || files?.image?.[0];

        if (!uploadedFile) {
          return res.status(400).json({ 
            success: false, 
            message: "No file uploaded" 
          });
        }

        // Upload to S3
        const s3Service = getAwsS3Service();
        const folder = uploadedFile.fieldname === 'image' ? 'general-images' : 'general-files';
        const uploadResult = await s3Service.uploadPublicFile(
          uploadedFile.buffer,
          uploadedFile.originalname,
          uploadedFile.mimetype,
          folder
        );

        if (!uploadResult.success) {
          return res.status(500).json({
            success: false,
            message: uploadResult.message || "Failed to upload to S3"
          });
        }

        console.log(\`✅ [S3 UPLOAD] Flexible upload: \${uploadResult.key}\`);

        res.json({ 
          success: true, 
          url: uploadResult.url,
          filename: uploadResult.key?.split('/').pop() || uploadedFile.originalname,
          originalName: uploadedFile.originalname,
          size: uploadedFile.size
        });
      } catch (error) {
        console.error('Upload processing error:', error);
        res.status(500).json({ 
          success: false, 
          message: "Failed to process upload" 
        });
      }`;

if (content.includes(oldFlexibleUpload)) {
  content = content.replace(oldFlexibleUpload, newFlexibleUpload);
  console.log('✅ Updated flexible upload endpoint /api/upload');
} else {
  console.log('⚠️  Flexible upload endpoint already updated or not found');
}

// 2. Update procedure documents endpoint with middleware pattern
const oldProcedureMiddleware = `      const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];
      
      const { pool } = await import('./db');
      const result = await pool.query(\`
        INSERT INTO procedure_documents (
          procedure_id, outline_id, title, description, file_name, 
          file_path, file_size, file_type, uploaded_by, version, tags,
          upload_date, is_active, download_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, '1.0'), $11, NOW(), true, 0)
        RETURNING id, title, file_name, upload_date, version
      \`, [
        procedureId, 
        outlineId || null, 
        title || req.file.originalname, 
        description || null, 
        req.file.originalname, 
        req.file.path,`;

const newProcedureMiddleware = `      const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];
      
      // Upload to S3
      const s3Service = getAwsS3Service();
      const uploadResult = await s3Service.uploadPrivateFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'procedure-documents'
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: uploadResult.message || "Failed to upload document to S3"
        });
      }

      console.log(\`✅ [S3 UPLOAD] Procedure document (middleware pattern) uploaded: \${uploadResult.key}\`);

      const { pool } = await import('./db');
      const result = await pool.query(\`
        INSERT INTO procedure_documents (
          procedure_id, outline_id, title, description, file_name, 
          file_path, file_size, file_type, uploaded_by, version, tags,
          upload_date, is_active, download_count
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, '1.0'), $11, NOW(), true, 0)
        RETURNING id, title, file_name, upload_date, version
      \`, [
        procedureId, 
        outlineId || null, 
        title || req.file.originalname, 
        description || null, 
        req.file.originalname, 
        uploadResult.url,`;

if (content.includes(oldProcedureMiddleware)) {
  content = content.replace(oldProcedureMiddleware, newProcedureMiddleware);
  console.log('✅ Updated procedure documents endpoint (middleware pattern)');
} else {
  console.log('⚠️  Procedure documents middleware endpoint already updated or not found');
}

// Write back to file
writeFileSync(routesPath, content, 'utf-8');

console.log('\n✅ Migration completed! All upload endpoints now use Amazon S3.');
console.log('📝 Updated endpoints:');
console.log('   - Flexible upload: /api/upload');
console.log('   - Procedure documents (middleware): /api/procedures/:procedureId/documents');
