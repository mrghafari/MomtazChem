/**
 * Migration Script: Convert remaining document upload endpoints to use Amazon S3
 * 
 * Endpoints updated:
 * - Additional documents upload
 * - Order management payment receipt
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const routesPath = join(process.cwd(), 'server', 'routes.ts');
let content = readFileSync(routesPath, 'utf-8');

console.log('🔄 Starting migration of remaining document upload endpoints to S3...');

// 1. Update documentStorage configuration to use memory storage
const oldDocumentStorage = `// Multer configuration for document uploads
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, documentsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});`;

const newDocumentStorage = `// Multer configuration for document uploads - using memory storage for S3 upload
const documentStorage = multer.memoryStorage();`;

if (content.includes(oldDocumentStorage)) {
  content = content.replace(oldDocumentStorage, newDocumentStorage);
  console.log('✅ Updated document storage configuration to memory storage');
} else {
  console.log('⚠️  Document storage already updated or not found');
}

// 2. Update additional documents endpoint (line ~8033-8100)
const oldAdditionalDocs = `  app.post("/api/customers/orders/:orderId/upload-additional-documents", upload.single('additionalReceipt'), async (req, res) => {
    try {
      const { orderId } = req.params;
      const { notes } = req.body;
      const uploadedFile = req.file;
      
      console.log(\`📋 [ADDITIONAL DOCS UPLOAD] Customer uploading additional documents for order \${orderId}\`);

      if (!uploadedFile) {
        return res.status(400).json({
          success: false,
          message: "فایل مدرک الزامی است"
        });
      }

      // Find the order that requires additional documents
      const [order] = await db
        .select()
        .from(customerOrders)
        .where(and(
          eq(customerOrders.id, parseInt(orderId)),
          eq(customerOrders.paymentStatus, 'additional_documents_required')
        ))
        .limit(1);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "سفارش یافت نشد یا نیازی به مدارک تکمیلی ندارد"
        });
      }

      // Save the uploaded file path and update order status back to grace period review
      const additionalDocumentPath = \`/uploads/\${uploadedFile.filename}\`;`;

const newAdditionalDocs = `  app.post("/api/customers/orders/:orderId/upload-additional-documents", upload.single('additionalReceipt'), async (req, res) => {
    try {
      const { orderId } = req.params;
      const { notes } = req.body;
      const uploadedFile = req.file;
      
      console.log(\`📋 [ADDITIONAL DOCS UPLOAD] Customer uploading additional documents for order \${orderId}\`);

      if (!uploadedFile) {
        return res.status(400).json({
          success: false,
          message: "فایل مدرک الزامی است"
        });
      }

      // Find the order that requires additional documents
      const [order] = await db
        .select()
        .from(customerOrders)
        .where(and(
          eq(customerOrders.id, parseInt(orderId)),
          eq(customerOrders.paymentStatus, 'additional_documents_required')
        ))
        .limit(1);

      if (!order) {
        return res.status(404).json({
          success: false,
          message: "سفارش یافت نشد یا نیازی به مدارک تکمیلی ندارد"
        });
      }

      // Upload to S3
      const s3Service = getAwsS3Service();
      const uploadResult = await s3Service.uploadPrivateFile(
        uploadedFile.buffer,
        uploadedFile.originalname,
        uploadedFile.mimetype,
        'additional-documents'
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: uploadResult.message || "Failed to upload document to S3"
        });
      }

      console.log(\`✅ [S3 UPLOAD] Additional document uploaded: \${uploadResult.key}\`);

      // Save the uploaded file URL from S3
      const additionalDocumentPath = uploadResult.url;`;

if (content.includes(oldAdditionalDocs)) {
  content = content.replace(oldAdditionalDocs, newAdditionalDocs);
  console.log('✅ Updated additional documents endpoint');
} else {
  console.log('⚠️  Additional documents endpoint already updated or not found');
}

// 3. Update order management payment receipt endpoint (line ~27956-27980)
const oldOrderMgmtReceipt = `  app.post('/api/order-management/:customerOrderId/payment-receipt', upload.single('receipt'), async (req, res) => {
    try {
      const customerOrderId = parseInt(req.params.customerOrderId);
      const customerId = req.session.customerId;

      if (!customerId) {
        return res.status(401).json({ success: false, message: 'احراز هویت نشده' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'فایل رسید الزامی است' });
      }

      // Save payment receipt
      const receipt = await orderManagementStorage.uploadPaymentReceipt({
        customerOrderId,
        customerId,
        receiptUrl: \`/uploads/documents/\${req.file.filename}\`,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        notes: req.body.notes || ''
      });`;

const newOrderMgmtReceipt = `  app.post('/api/order-management/:customerOrderId/payment-receipt', upload.single('receipt'), async (req, res) => {
    try {
      const customerOrderId = parseInt(req.params.customerOrderId);
      const customerId = req.session.customerId;

      if (!customerId) {
        return res.status(401).json({ success: false, message: 'احراز هویت نشده' });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'فایل رسید الزامی است' });
      }

      // Upload to S3
      const s3Service = getAwsS3Service();
      const uploadResult = await s3Service.uploadPrivateFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'payment-receipts'
      );

      if (!uploadResult.success) {
        return res.status(500).json({
          success: false,
          message: uploadResult.message || "Failed to upload receipt to S3"
        });
      }

      console.log(\`✅ [S3 UPLOAD] Payment receipt uploaded: \${uploadResult.key}\`);

      // Save payment receipt with S3 URL
      const receipt = await orderManagementStorage.uploadPaymentReceipt({
        customerOrderId,
        customerId,
        receiptUrl: uploadResult.url,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        notes: req.body.notes || ''
      });`;

if (content.includes(oldOrderMgmtReceipt)) {
  content = content.replace(oldOrderMgmtReceipt, newOrderMgmtReceipt);
  console.log('✅ Updated order management payment receipt endpoint');
} else {
  console.log('⚠️  Order management payment receipt endpoint already updated or not found');
}

// Write back to file
writeFileSync(routesPath, content, 'utf-8');

console.log('\n✅ Migration completed! All remaining document upload endpoints now use Amazon S3.');
console.log('📝 Updated endpoints:');
console.log('   - Additional documents: /api/customers/orders/:orderId/upload-additional-documents');
console.log('   - Payment receipts: /api/order-management/:customerOrderId/payment-receipt');
