/**
 * Migration Script: Convert procedure document upload endpoints to use Amazon S3
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const routesPath = join(process.cwd(), 'server', 'routes.ts');
let content = readFileSync(routesPath, 'utf-8');

console.log('🔄 Migrating procedure document endpoints to S3...');

// 1. Update safety protocol documents endpoint
const oldSafetyProtocolDocs = `  // Upload safety protocol document
  app.post("/api/procedures/safety-protocols/:protocolId/documents", requireAuth, upload.single('document'), async (req, res) => {
    try {
      const { protocolId } = req.params;
      const { title, description, version, tags } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const userId = req.session.adminId;
      const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];

      const { pool } = await import('./db');
      const result = await pool.query(\`
        INSERT INTO procedure_documents (
          procedure_id, title, description, file_name, file_path, 
          file_size, file_type, uploaded_by, version, tags, document_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'safety_protocol')
        RETURNING *
      \`, [
        protocolId, 
        title || file.originalname, 
        description || null, 
        file.originalname, 
        file.path,`;

const newSafetyProtocolDocs = `  // Upload safety protocol document
  app.post("/api/procedures/safety-protocols/:protocolId/documents", requireAuth, upload.single('document'), async (req, res) => {
    try {
      const { protocolId } = req.params;
      const { title, description, version, tags } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const userId = req.session.adminId;
      const tagsArray = tags ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];

      // Upload to S3
      const s3Service = getAwsS3Service();
      const uploadResult = await s3Service.uploadPrivateFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'procedure-documents'
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: uploadResult.message || "Failed to upload document to S3"
        });
      }

      console.log(\`✅ [S3 UPLOAD] Safety protocol document uploaded: \${uploadResult.key}\`);

      const { pool } = await import('./db');
      const result = await pool.query(\`
        INSERT INTO procedure_documents (
          procedure_id, title, description, file_name, file_path, 
          file_size, file_type, uploaded_by, version, tags, document_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'safety_protocol')
        RETURNING *
      \`, [
        protocolId, 
        title || file.originalname, 
        description || null, 
        file.originalname, 
        uploadResult.url,`;

if (content.includes(oldSafetyProtocolDocs)) {
  content = content.replace(oldSafetyProtocolDocs, newSafetyProtocolDocs);
  console.log('✅ Updated safety protocol documents endpoint');
} else {
  console.log('⚠️  Safety protocol documents endpoint already updated or not found');
}

// 2. Update procedure documents endpoint
const oldProcedureDocs = `  // Upload procedure document
  app.post("/api/procedures/:procedureId/documents", requireAuth, upload.single('document'), async (req, res) => {
    try {
      const { procedureId } = req.params;
      const { title, description } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const { pool } = await import('./db');
      
      const result = await pool.query(\`
        INSERT INTO procedure_documents (
          procedure_id, title, description, file_name, file_path, 
          file_size, file_type, upload_date, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        RETURNING *
      \`, [
        procedureId,
        title || file.originalname,
        description || null,
        file.originalname,
        file.path,`;

const newProcedureDocs = `  // Upload procedure document
  app.post("/api/procedures/:procedureId/documents", requireAuth, upload.single('document'), async (req, res) => {
    try {
      const { procedureId } = req.params;
      const { title, description } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      // Upload to S3
      const s3Service = getAwsS3Service();
      const uploadResult = await s3Service.uploadPrivateFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'procedure-documents'
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: uploadResult.message || "Failed to upload document to S3"
        });
      }

      console.log(\`✅ [S3 UPLOAD] Procedure document uploaded: \${uploadResult.key}\`);

      const { pool } = await import('./db');
      
      const result = await pool.query(\`
        INSERT INTO procedure_documents (
          procedure_id, title, description, file_name, file_path, 
          file_size, file_type, upload_date, uploaded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        RETURNING *
      \`, [
        procedureId,
        title || file.originalname,
        description || null,
        file.originalname,
        uploadResult.url,`;

if (content.includes(oldProcedureDocs)) {
  content = content.replace(oldProcedureDocs, newProcedureDocs);
  console.log('✅ Updated procedure documents endpoint');
} else {
  console.log('⚠️  Procedure documents endpoint already updated or not found');
}

// Write back to file
writeFileSync(routesPath, content, 'utf-8');

console.log('\n✅ Migration completed! All procedure document upload endpoints now use Amazon S3.');
console.log('📝 Updated endpoints:');
console.log('   - Safety protocol documents: /api/procedures/safety-protocols/:protocolId/documents');
console.log('   - Procedure documents: /api/procedures/:procedureId/documents');
