import { Express, Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { AwsS3Service } from './aws-s3-service';
import { db } from './db';
import { awsS3Settings } from '../shared/schema';
import { sql } from 'drizzle-orm';

/**
 * Register S3 image serving routes
 * This middleware tries to serve images from S3 if they're not found locally
 */
export function registerS3ImageRoutes(app: Express) {
  // Serve images from S3 if not found locally
  app.get('/uploads/images/:fileName', async (req: Request, res: Response, next: NextFunction) => {
    const localPath = path.join(process.cwd(), 'uploads', 'images', req.params.fileName);
    
    // Check if file exists locally first
    if (fs.existsSync(localPath)) {
      console.log(`📁 [LOCAL IMAGE] Serving from local: ${req.params.fileName}`);
      return next(); // Let express.static handle it
    }
    
    // File not found locally, try S3
    try {
      console.log(`🔍 [S3 IMAGE] File not found locally, trying S3: ${req.params.fileName}`);
      
      // Get S3 settings from database
      const settings = await db.select().from(awsS3Settings).where(sql`is_active = true`).limit(1);
      
      if (settings.length === 0) {
        console.log('❌ [S3 IMAGE] No active S3 settings found');
        return res.status(404).json({ success: false, message: 'Image not found' });
      }
      
      const s3Service = new AwsS3Service(settings[0]);
      const s3Key = `images/${req.params.fileName}`;
      
      console.log(`🖼️ [S3 IMAGE] Fetching from S3: ${s3Key}`);
      
      const fileBuffer = await s3Service.getFile(s3Key);
      
      if (!fileBuffer) {
        console.log(`❌ [S3 IMAGE] File not found in S3: ${s3Key}`);
        return res.status(404).json({ success: false, message: 'Image not found' });
      }
      
      // Determine content type from file extension
      const ext = path.extname(req.params.fileName).toLowerCase();
      const contentTypes: {[key: string]: string} = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml'
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Content-Length': fileBuffer.length
      });
      
      res.send(fileBuffer);
      
      console.log(`✅ [S3 IMAGE] Successfully served from S3: ${s3Key} (${fileBuffer.length} bytes)`);
    } catch (error) {
      console.error('❌ [S3 IMAGE] Error serving image from S3:', error);
      res.status(500).json({ success: false, message: 'Error serving image' });
    }
  });
  
  // Also handle catalog files
  app.get('/uploads/catalogs/:fileName', async (req: Request, res: Response, next: NextFunction) => {
    const localPath = path.join(process.cwd(), 'uploads', 'catalogs', req.params.fileName);
    
    if (fs.existsSync(localPath)) {
      return next();
    }
    
    try {
      const settings = await db.select().from(awsS3Settings).where(sql`is_active = true`).limit(1);
      
      if (settings.length === 0) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }
      
      const s3Service = new AwsS3Service(settings[0]);
      const s3Key = `catalogs/${req.params.fileName}`;
      
      console.log(`📄 [S3 CATALOG] Fetching from S3: ${s3Key}`);
      
      const fileBuffer = await s3Service.getFile(s3Key);
      
      if (!fileBuffer) {
        return res.status(404).json({ success: false, message: 'File not found' });
      }
      
      res.set({
        'Content-Type': 'application/pdf',
        'Cache-Control': 'public, max-age=31536000',
        'Content-Length': fileBuffer.length
      });
      
      res.send(fileBuffer);
      
      console.log(`✅ [S3 CATALOG] Successfully served from S3: ${s3Key}`);
    } catch (error) {
      console.error('❌ [S3 CATALOG] Error:', error);
      res.status(500).json({ success: false, message: 'Error serving file' });
    }
  });
  
  console.log('✅ [S3 ROUTES] S3 image serving routes registered');
}
