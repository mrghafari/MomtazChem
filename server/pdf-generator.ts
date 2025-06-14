import puppeteer from 'puppeteer';
import { marked } from 'marked';
import path from 'path';
import fs from 'fs';

export class PDFGenerator {
  static async generateProcedurePDF(procedure: any, outlines: any[], documents: any[]): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      
      // Create HTML content
      const htmlContent = this.createProcedureHTML(procedure, outlines, documents);
      
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size: 10px; margin: 0 auto; color: #666;">
            <span>دستورالعمل: ${procedure.title}</span>
          </div>
        `,
        footerTemplate: `
          <div style="font-size: 10px; margin: 0 auto; color: #666;">
            <span>صفحه <span class="pageNumber"></span> از <span class="totalPages"></span></span>
            <span style="margin-left: 20px;">تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')}</span>
          </div>
        `
      });
      
      // Save PDF file
      const fileName = `procedure-${procedure.id}-${Date.now()}.pdf`;
      const filePath = path.join(process.cwd(), 'uploads', 'documents', fileName);
      
      fs.writeFileSync(filePath, pdfBuffer);
      
      return fileName;
    } finally {
      await browser.close();
    }
  }

  private static createProcedureHTML(procedure: any, outlines: any[], documents: any[]): string {
    // Convert markdown content to HTML
    const contentHTML = marked(procedure.content);
    
    // Group outlines by level for hierarchical display
    const groupedOutlines = this.groupOutlinesByLevel(outlines);
    
    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${procedure.title}</title>
      <style>
        body {
          font-family: 'Tahoma', 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
          direction: rtl;
        }
        
        .header {
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
          text-align: center;
        }
        
        .title {
          font-size: 24px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 10px;
        }
        
        .metadata {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
          font-size: 14px;
        }
        
        .metadata-item {
          display: flex;
          justify-content: space-between;
        }
        
        .metadata-label {
          font-weight: bold;
          color: #475569;
        }
        
        .outline {
          margin: 20px 0;
        }
        
        .outline-level-1 {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin: 20px 0 10px 0;
          padding: 10px;
          background: #eff6ff;
          border-right: 4px solid #2563eb;
        }
        
        .outline-level-2 {
          font-size: 16px;
          font-weight: 600;
          color: #1e40af;
          margin: 15px 0 8px 20px;
          padding: 8px;
          background: #f1f5f9;
          border-right: 3px solid #64748b;
        }
        
        .outline-content {
          margin: 10px 0;
          padding: 10px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }
        
        .content {
          margin: 30px 0;
          padding: 20px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        
        .documents {
          margin: 30px 0;
        }
        
        .documents-title {
          font-size: 18px;
          font-weight: bold;
          color: #1e40af;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .document-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          margin: 10px 0;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }
        
        .document-info {
          flex: 1;
        }
        
        .document-title {
          font-weight: 600;
          color: #374151;
        }
        
        .document-meta {
          font-size: 12px;
          color: #6b7280;
          margin-top: 4px;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .status-approved {
          background: #dcfce7;
          color: #166534;
        }
        
        .status-review {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .status-draft {
          background: #fef3c7;
          color: #92400e;
        }
        
        .priority-critical {
          background: #fecaca;
          color: #991b1b;
        }
        
        .priority-high {
          background: #fed7aa;
          color: #9a3412;
        }
        
        .priority-normal {
          background: #dbeafe;
          color: #1e40af;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        
        th, td {
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          text-align: right;
        }
        
        th {
          background: #f1f5f9;
          font-weight: 600;
        }
        
        .page-break {
          page-break-before: always;
        }
        
        h1, h2, h3, h4, h5, h6 {
          color: #1e40af;
          margin-top: 25px;
          margin-bottom: 15px;
        }
        
        ul, ol {
          margin: 15px 0;
          padding-right: 30px;
        }
        
        blockquote {
          margin: 15px 0;
          padding: 10px 15px;
          background: #f8fafc;
          border-right: 4px solid #2563eb;
          color: #475569;
        }
        
        pre {
          background: #f1f5f9;
          padding: 15px;
          border-radius: 6px;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
        }
        
        code {
          background: #f1f5f9;
          padding: 2px 4px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${procedure.title}</div>
        <div style="color: #6b7280; font-size: 14px;">نسخه ${procedure.version}</div>
      </div>
      
      <div class="metadata">
        <div class="metadata-item">
          <span class="metadata-label">وضعیت:</span>
          <span class="status-badge status-${procedure.status}">
            ${procedure.status === 'approved' ? 'تأیید شده' :
              procedure.status === 'review' ? 'در بررسی' :
              procedure.status === 'draft' ? 'پیش‌نویس' : 'بایگانی'}
          </span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">اولویت:</span>
          <span class="status-badge priority-${procedure.priority}">
            ${procedure.priority === 'critical' ? 'بحرانی' :
              procedure.priority === 'high' ? 'بالا' :
              procedure.priority === 'normal' ? 'عادی' : 'پایین'}
          </span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">تاریخ اجرا:</span>
          <span>${procedure.effectiveDate ? new Date(procedure.effectiveDate).toLocaleDateString('fa-IR') : 'تعیین نشده'}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">تاریخ بازنگری:</span>
          <span>${procedure.reviewDate ? new Date(procedure.reviewDate).toLocaleDateString('fa-IR') : 'تعیین نشده'}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">سطح دسترسی:</span>
          <span>${procedure.accessLevel === 'public' ? 'عمومی' :
                   procedure.accessLevel === 'internal' ? 'داخلی' :
                   procedure.accessLevel === 'restricted' ? 'محدود' : 'محرمانه'}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">برچسب‌ها:</span>
          <span>${procedure.tags ? procedure.tags.join(', ') : 'ندارد'}</span>
        </div>
      </div>

      ${procedure.description ? `
      <div class="outline">
        <div class="outline-level-1">خلاصه توضیحات</div>
        <div class="outline-content">${procedure.description}</div>
      </div>
      ` : ''}

      ${outlines.length > 0 ? `
      <div class="page-break"></div>
      <div class="outline">
        <div class="outline-level-1">فهرست مطالب</div>
        ${this.generateOutlinesHTML(groupedOutlines)}
      </div>
      ` : ''}

      <div class="page-break"></div>
      <div class="content">
        <div class="outline-level-1">محتوای دستورالعمل</div>
        ${contentHTML}
      </div>

      ${documents.length > 0 ? `
      <div class="page-break"></div>
      <div class="documents">
        <div class="documents-title">مستندات و پیوست‌ها</div>
        ${documents.map(doc => `
          <div class="document-item">
            <div class="document-info">
              <div class="document-title">${doc.title}</div>
              <div class="document-meta">
                نوع فایل: ${doc.fileType} | اندازه: ${this.formatFileSize(doc.fileSize)} | 
                آپلود شده در: ${new Date(doc.uploadDate).toLocaleDateString('fa-IR')}
                ${doc.outlineTitle ? ` | مربوط به: ${doc.outlineTitle}` : ''}
              </div>
              ${doc.description ? `<div style="margin-top: 8px; color: #6b7280;">${doc.description}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div style="margin-top: 50px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #6b7280; font-size: 12px;">
        <p>این مستند به صورت خودکار تولید شده است</p>
        <p>تاریخ تولید: ${new Date().toLocaleDateString('fa-IR')} - ساعت: ${new Date().toLocaleTimeString('fa-IR')}</p>
      </div>
    </body>
    </html>
    `;
  }

  private static groupOutlinesByLevel(outlines: any[]): any[] {
    return outlines.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level;
      return a.orderNumber - b.orderNumber;
    });
  }

  private static generateOutlinesHTML(outlines: any[]): string {
    return outlines.map(outline => `
      <div class="outline-level-${outline.level}">
        ${outline.orderNumber}. ${outline.title}
      </div>
      ${outline.content ? `<div class="outline-content">${outline.content}</div>` : ''}
    `).join('');
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 بایت';
    const k = 1024;
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}