import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { getAwsS3Service } from './aws-s3-service';

/**
 * Multer memory storage configuration for AWS S3 uploads
 */
export const memoryStorage = multer.memoryStorage();

/**
 * Upload images to AWS S3
 */
export const uploadImageToS3 = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  }
});

/**
 * Upload PDF documents to AWS S3
 */
export const uploadPdfToS3 = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

/**
 * Upload any file to AWS S3
 */
export const uploadFileToS3 = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  }
});

/**
 * Middleware to process uploaded file and send to AWS S3
 */
export async function processS3Upload(
  req: Request,
  res: Response,
  next: NextFunction,
  folder: string = 'uploads'
) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const s3Service = getAwsS3Service();
    
    const uploadResult = await s3Service.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      folder
    );

    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: uploadResult.message || 'Failed to upload file to S3'
      });
    }

    // Attach S3 info to request for use in route handler
    (req as any).s3File = {
      url: uploadResult.url,
      key: uploadResult.key,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    };

    next();
  } catch (error: any) {
    console.error('❌ [S3 Upload Middleware] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload file to S3'
    });
  }
}

/**
 * Helper function to create S3 upload middleware for specific folder
 */
export function createS3UploadMiddleware(folder: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    return processS3Upload(req, res, next, folder);
  };
}
