import * as fs from 'fs';
import * as path from 'path';
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

// Configure pdfMake with fonts for multilingual support
pdfMake.vfs = {
  ...pdfFonts.pdfMake.vfs,
};

pdfMake.fonts = {
  Vazirmatn: {
    normal: "Roboto-Regular.ttf", // Using Roboto as fallback for Vazirmatn
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  },
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf", 
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf",
  }
};

// Enhanced PDF generator for CRM customer export
export function exportCRMCustomerPDF(customerData: Array<{label: string, text: string}>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const contentArray: any[] = [];

      customerData.forEach(entry => {
        const isRTL = /[\u0600-\u06FF]/.test(entry.text); // Persian/Arabic/Kurdish detection

        contentArray.push({
          text: `${entry.label}: ${entry.text}`,
          font: "Vazirmatn",
          alignment: isRTL ? "right" : "left",
          margin: [0, 5, 0, 5],
          fontSize: 12,
        });
      });

      const docDefinition = {
        content: contentArray,
        defaultStyle: {
          font: "Vazirmatn",
        },
        pageMargins: [40, 60, 40, 60] as [number, number, number, number],
        info: {
          title: 'Customer Report',
          author: 'Momtazchem CRM System',
          subject: 'Customer Data Export',
          creator: 'Momtazchem Platform'
        }
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      pdfDoc.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      }, (error: any) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Enhanced PDF generator using pdfMake for better multilingual support
export async function generateMultilingualPDF(content: string, title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const docDefinition = {
        content: [
          {
            text: title,
            fontSize: 18,
            bold: true,
            margin: [0, 0, 0, 20] as [number, number, number, number],
            alignment: 'left' as const,
            font: 'Vazirmatn'
          },
          {
            text: `Generated: ${new Date().toLocaleDateString('en-US')}`,
            fontSize: 12,
            margin: [0, 0, 0, 20] as [number, number, number, number],
            color: 'gray',
            font: 'Roboto'
          },
          {
            text: content,
            fontSize: 12,
            lineHeight: 1.5,
            alignment: 'left' as const,
            preserveLeadingSpaces: true,
            font: 'Vazirmatn'
          }
        ],
        defaultStyle: {
          font: 'Vazirmatn',
          fontSize: 12
        },
        pageMargins: [40, 60, 40, 60] as [number, number, number, number],
        info: {
          title: title,
          author: 'Momtazchem CRM System',
          subject: 'Customer Report',
          creator: 'Momtazchem Platform'
        }
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      pdfDoc.getBuffer((buffer: Buffer) => {
        resolve(buffer);
      }, (error: any) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Fallback simple text-based PDF generator for compatibility
export async function generateSimplePDF(htmlContent: string, title: string): Promise<Buffer> {
  // Clean content and prepare for PDF with proper encoding support
  let cleanContent = htmlContent
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace nbsp with space
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Preserve Persian/Arabic characters and normalize line breaks
  cleanContent = cleanContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const contentLines = cleanContent.split('\n').filter(line => line.trim().length > 0);
  
  // Create comprehensive PDF content with multiple pages
  let allPagesContent = '';
  let pageCount = 0;
  let pageObjects = [];
  let currentPageContent = '';
  let lineCount = 0;
  const maxLinesPerPage = 45;
  
  // Start first page
  currentPageContent = 'BT\n/F1 12 Tf\n50 750 Td\n';
  
  // Handle title with Persian/Arabic support using enhanced cleaning
  const cleanTitle = cleanTextForPdf(title).substring(0, 60).replace(/[()\\]/g, '\\$&');
  const pdfCompatibleTitle = cleanTitle;
  
  currentPageContent += `(${pdfCompatibleTitle}) Tj\n0 -20 Td\n`;
  currentPageContent += `(Generated: ${new Date().toLocaleDateString()}) Tj\n0 -25 Td\n`;
  lineCount = 3;
  
  // Process all content lines
  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i].trim();
    if (line.length > 0) {
      // Check if we need a new page
      if (lineCount >= maxLinesPerPage) {
        currentPageContent += 'ET\n';
        pageObjects.push(currentPageContent);
        pageCount++;
        
        // Start new page
        currentPageContent = 'BT\n/F1 12 Tf\n50 750 Td\n';
        lineCount = 0;
      }
      
      // Process line with word wrapping
      const maxLineLength = 70;
      if (line.length > maxLineLength) {
        const words = line.split(' ');
        let currentLine = '';
        
        for (const word of words) {
          if ((currentLine + word).length > maxLineLength) {
            if (currentLine.trim()) {
              const escapedLine = cleanTextForPdf(currentLine.trim()).replace(/[()\\]/g, '\\$&');
              currentPageContent += `(${escapedLine}) Tj\n0 -14 Td\n`;
              lineCount++;
            }
            currentLine = word + ' ';
          } else {
            currentLine += word + ' ';
          }
        }
        
        if (currentLine.trim()) {
          const escapedLine = cleanTextForPdf(currentLine.trim()).replace(/[()\\]/g, '\\$&');
          currentPageContent += `(${escapedLine}) Tj\n0 -14 Td\n`;
          lineCount++;
        }
      } else {
        const escapedLine = cleanTextForPdf(line).replace(/[()\\]/g, '\\$&');
        currentPageContent += `(${escapedLine}) Tj\n0 -14 Td\n`;
        lineCount++;
      }
      
      // Add extra spacing for headers
      if (line.includes('=====') || line.includes('-----') || line.toUpperCase().includes('CHAPTER')) {
        currentPageContent += `0 -8 Td\n`;
        lineCount++;
      }
    }
  }
  
  // Close last page
  currentPageContent += 'ET\n';
  pageObjects.push(currentPageContent);
  pageCount++;
  
  // Build PDF structure with multiple pages
  let pdfContent = '%PDF-1.4\n';
  let objectIndex = 1;
  
  // Catalog
  pdfContent += `${objectIndex} 0 obj\n<<\n/Type /Catalog\n/Pages ${objectIndex + 1} 0 R\n>>\nendobj\n\n`;
  objectIndex++;
  
  // Pages object
  const pageRefs = [];
  for (let i = 0; i < pageCount; i++) {
    pageRefs.push(`${objectIndex + 1 + i} 0 R`);
  }
  pdfContent += `${objectIndex} 0 obj\n<<\n/Type /Pages\n/Kids [${pageRefs.join(' ')}]\n/Count ${pageCount}\n>>\nendobj\n\n`;
  objectIndex++;
  
  // Page objects and content streams
  for (let i = 0; i < pageCount; i++) {
    const contentStreamIndex = objectIndex + pageCount;
    
    // Page object
    pdfContent += `${objectIndex} 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n`;
    pdfContent += `/Resources <<\n/Font <<\n/F1 ${objectIndex + pageCount + i + 1} 0 R\n>>\n>>\n`;
    pdfContent += `/Contents ${contentStreamIndex + i} 0 R\n>>\nendobj\n\n`;
    objectIndex++;
  }
  
  // Content streams
  for (let i = 0; i < pageCount; i++) {
    const content = pageObjects[i];
    pdfContent += `${objectIndex} 0 obj\n<<\n/Length ${content.length}\n>>\nstream\n${content}endstream\nendobj\n\n`;
    objectIndex++;
  }
  
  // Font objects
  for (let i = 0; i < pageCount; i++) {
    pdfContent += `${objectIndex} 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n\n`;
    objectIndex++;
  }
  
  // XRef and trailer
  const xrefStart = pdfContent.length;
  pdfContent += `xref\n0 ${objectIndex}\n0000000000 65535 f \n`;
  
  // Add xref entries (simplified)
  for (let i = 1; i < objectIndex; i++) {
    pdfContent += `${String(100 + i * 50).padStart(10, '0')} 00000 n \n`;
  }
  
  pdfContent += `trailer\n<<\n/Size ${objectIndex}\n/Root 1 0 R\n>>\nstartxref\n${xrefStart}\n%%EOF\n`;
  
  return Buffer.from(pdfContent);
}

// Get specific content based on documentation type
function getDocumentationContent(type: string, language: string): string {
  const isEnglish = language === 'en';
  const date = new Date().toLocaleDateString();
  
  switch (type) {
    case 'User Guide':
      return isEnglish ? getUserGuideEN(date) : getUserGuideFA(date);
    case 'Admin Guide':
      return isEnglish ? getAdminGuideEN(date) : getAdminGuideFA(date);
    case 'Technical Documentation':
      return isEnglish ? getTechnicalDocsEN(date) : getTechnicalDocsFA(date);
    case 'Project Proposal':
      return isEnglish ? getProjectProposalEN(date) : getProjectProposalFA(date);
    case 'Complete Documentation':
      return isEnglish ? getCompleteDocsEN(date) : getCompleteDocsFA(date);
    default:
      return getDefaultContent(type, language, date);
  }
}

function getUserGuideEN(date: string): string {
  return `
USER GUIDE - MOMTAZCHEM PLATFORM
================================
Generated: ${date}

WELCOME TO MOMTAZCHEM
====================
Thank you for choosing Momtazchem's comprehensive chemical solutions platform. This guide will help you navigate and utilize all features available to users.

TABLE OF CONTENTS
=================
1. Getting Started
2. Product Catalog
3. Shopping Cart & Orders
4. Customer Portal
5. Digital Wallet
6. Address Management
7. Order Tracking
8. Support & Communication

1. GETTING STARTED
==================

REGISTRATION:
- Visit the main website
- Click "Register" to create your account
- Fill required information: name, email, phone, address
- Verify your account via email
- Complete profile setup

LOGIN PROCESS:
- Use your email and password
- Access customer dashboard
- View personalized content

DASHBOARD OVERVIEW:
- Order history and status
- Digital wallet balance
- Quick reorder options
- Account settings access

2. PRODUCT CATALOG
==================

BROWSING PRODUCTS:
- Navigate by categories:
  * Water Treatment
  * Fuel Additives
  * Paint & Solvents
  * Agricultural Products
  * Industrial Chemicals
  * Technical Equipment
  * Commercial Goods

PRODUCT INFORMATION:
- Detailed descriptions
- Technical specifications
- Safety data sheets
- Application guidelines
- Pricing and availability

SEARCH FUNCTIONALITY:
- Text search across all products
- Filter by category, price, availability
- Sort by name, price, popularity
- Advanced filtering options

3. SHOPPING CART & ORDERS
=========================

ADDING TO CART:
- Select product quantity
- Choose specifications
- Add to cart with one click
- Continue shopping or checkout

CHECKOUT PROCESS:
- Review cart contents
- Select shipping address
- Choose payment method
- Confirm order details
- Submit order

PAYMENT OPTIONS:
- Iraqi Banking System
- Bank transfer
- Payment gateway integration
- Invoice generation

4. CUSTOMER PORTAL
==================

ACCOUNT MANAGEMENT:
- Update personal information
- Change password
- Manage communication preferences
- Set language preference

ORDER MANAGEMENT:
- View order history
- Track current orders
- Download invoices
- Request support

PROFILE SETTINGS:
- Contact information
- Business details
- Delivery preferences
- Notification settings

5. DIGITAL WALLET
=================

WALLET FEATURES:
- View current balance
- Transaction history
- Recharge requests
- Payment processing

RECHARGE PROCESS:
- Submit recharge request
- Admin approval workflow
- Balance updates
- Notification system

USAGE:
- Pay for orders using wallet balance
- Track spending history
- Receive promotional credits
- Manage payment preferences

6. ADDRESS MANAGEMENT
====================

MULTIPLE ADDRESSES:
- Add multiple delivery addresses
- Set default address
- Edit existing addresses
- GPS location capture

ADDRESS DETAILS:
- Complete street address
- City and country selection
- Contact information
- Special delivery instructions

7. ORDER TRACKING
=================

TRACKING SYSTEM:
- Real-time order status
- Department progression tracking
- Estimated delivery dates
- SMS notifications

ORDER STAGES:
1. Payment Processing (Financial Department)
2. Preparation (Warehouse Department)
3. Shipping (Logistics Department)
4. Delivery Confirmation

NOTIFICATIONS:
- Email updates
- SMS alerts
- Dashboard notifications
- Status change alerts

8. SUPPORT & COMMUNICATION
=========================

CONTACT METHODS:
- Live chat support
- Email inquiries
- Phone support
- Contact forms

PRODUCT INQUIRIES:
- Technical questions
- Custom solutions
- Bulk order requests
- Specification clarifications

HELP RESOURCES:
- FAQ section
- Video tutorials
- Documentation downloads
- Technical guides

TROUBLESHOOTING
===============

Common Issues:
- Login problems: Reset password or contact support
- Payment failures: Check payment details or try alternative methods
- Order delays: Track order status or contact logistics
- Product questions: Use inquiry forms or live chat

Contact Information:
- Email: info@momtazchem.com
- Phone: Available through customer portal
- Live Chat: Available during business hours
- Address: Iraq, comprehensive chemical solutions

This completes your user guide for the Momtazchem platform. For additional assistance, please contact our support team.

Document Version: 1.0
Last Updated: ${date}
Language: English
`;
}

function getUserGuideFA(date: string): string {
  return `
راهنمای کاربری - پلتفرم مامتاز کم
===============================
تاریخ تولید: ${date}

خوش آمدید به مامتاز کم
===================
از انتخاب پلتفرم جامع راه‌حل‌های شیمیایی مامتاز کم متشکریم. این راهنما به شما کمک می‌کند تا از تمام قابلیت‌های موجود برای کاربران استفاده کنید.

فهرست مطالب
=============
۱. شروع کار
۲. کاتالوگ محصولات
۳. سبد خرید و سفارشات
۴. پورتال مشتری
۵. کیف پول دیجیتال
۶. مدیریت آدرس
۷. پیگیری سفارش
۸. پشتیبانی و ارتباطات

۱. شروع کار
============

ثبت نام:
- به وب‌سایت اصلی مراجعه کنید
- روی "ثبت نام" کلیک کنید
- اطلاعات مورد نیاز را پر کنید: نام، ایمیل، تلفن، آدرس
- حساب خود را از طریق ایمیل تأیید کنید
- تنظیمات پروفایل را تکمیل کنید

فرآیند ورود:
- از ایمیل و رمز عبور خود استفاده کنید
- به داشبورد مشتری دسترسی پیدا کنید
- محتوای شخصی‌سازی شده را مشاهده کنید

نمای کلی داشبورد:
- تاریخچه و وضعیت سفارشات
- موجودی کیف پول دیجیتال
- گزینه‌های سفارش مجدد سریع
- دسترسی به تنظیمات حساب

۲. کاتالوگ محصولات
==================

مرور محصولات:
- جستجو بر اساس دسته‌بندی‌ها:
  * تصفیه آب
  * افزودنی‌های سوخت
  * رنگ و حلال
  * محصولات کشاورزی
  * مواد شیمیایی صنعتی
  * تجهیزات فنی
  * کالاهای تجاری

اطلاعات محصول:
- توضیحات تفصیلی
- مشخصات فنی
- برگه‌های اطلاعات ایمنی
- راهنمای کاربرد
- قیمت و موجودی

قابلیت جستجو:
- جستجوی متنی در تمام محصولات
- فیلتر بر اساس دسته، قیمت، موجودی
- مرتب‌سازی بر اساس نام، قیمت، محبوبیت
- گزینه‌های فیلتر پیشرفته

این راهنمای کاربری کامل برای پلتفرم مامتاز کم را تشکیل می‌دهد.

نسخه سند: ۱.۰
آخرین به‌روزرسانی: ${date}
زبان: فارسی
`;
}

function getAdminGuideEN(date: string): string {
  return `
ADMINISTRATOR GUIDE - MOMTAZCHEM PLATFORM
=========================================
Generated: ${date}

ADMIN SYSTEM OVERVIEW
====================
This comprehensive guide covers all administrative functions available in the Momtazchem platform. As an administrator, you have access to 25+ modules for complete system management.

ADMIN DASHBOARD ACCESS
=====================
- Login with admin credentials
- Navigate to Site Management
- Access centralized control panel
- Monitor system performance

SITE MANAGEMENT MODULES
=======================

1. CONTENT MANAGEMENT
   - Edit 430+ multilingual content items
   - Manage website sections dynamically
   - Upload and organize images
   - Control social media links

2. PRODUCT MANAGEMENT
   - Add/edit showcase products
   - Manage shop inventory
   - Generate EAN-13 barcodes
   - Set pricing and availability

3. CUSTOMER RELATIONSHIP MANAGEMENT
   - View customer database
   - Track customer activities
   - Analyze customer metrics
   - Manage customer segments

4. ORDER MANAGEMENT
   - Process orders through 3-department workflow
   - Financial approval
   - Warehouse preparation
   - Logistics coordination

5. EMAIL AUTOMATION
   - Configure SMTP settings
   - Set up email categories
   - Manage templates
   - Monitor delivery statistics

6. BARCODE SYSTEM
   - Generate EAN-13 barcodes
   - Batch processing
   - Validate barcode uniqueness
   - Download barcode collections

7. ANALYTICS & REPORTING
   - Sales performance analysis
   - Customer behavior insights
   - Geographic distribution
   - Revenue tracking

8. SECURITY MANAGEMENT
   - User role administration
   - Access control settings
   - Admin verification
   - Session management

9. DATABASE OPERATIONS
   - Backup management
   - Data migration
   - Performance monitoring
   - Maintenance tasks

10. AI INTEGRATION
    - SKU generation
    - Product recommendations
    - Performance monitoring
    - System optimization

DETAILED MODULE INSTRUCTIONS
============================

CONTENT MANAGEMENT:
- Access through Site Management
- Select Content tab
- Choose section to edit
- Update content in multiple languages
- Save changes and preview

PRODUCT OPERATIONS:
- Navigate to Products module
- Add new products with specifications
- Generate barcodes automatically
- Set inventory levels
- Configure pricing

CUSTOMER SUPPORT:
- Monitor customer inquiries
- Respond to support tickets
- Track customer satisfaction
- Manage feedback

ORDER PROCESSING:
- Review pending orders
- Approve financial transactions
- Coordinate warehouse operations
- Manage shipping logistics

EMAIL CONFIGURATION:
- Set up SMTP providers
- Configure routing rules
- Create email templates
- Monitor delivery rates

SYSTEM MONITORING:
- Check performance metrics
- Review error logs
- Monitor user activity
- Analyze system usage

BACKUP & MAINTENANCE:
- Schedule regular backups
- Perform database maintenance
- Update system configurations
- Monitor security status

This guide provides comprehensive coverage of all administrative functions.

Version: 2.0
Last Updated: ${date}
Language: English
`;
}

function getAdminGuideFA(date: string): string {
  return `
راهنمای مدیریت - پلتفرم مامتاز کم
==============================
تاریخ تولید: ${date}

نمای کلی سیستم مدیریت
===================
این راهنمای جامع تمام عملکردهای مدیریتی موجود در پلتفرم مامتاز کم را پوشش می‌دهد. به عنوان مدیر، شما به بیش از ۲۵ ماژول برای مدیریت کامل سیستم دسترسی دارید.

دسترسی به داشبورد مدیریت
=========================
- با اعتبارات مدیریت وارد شوید
- به مدیریت سایت بروید
- به پنل کنترل متمرکز دسترسی پیدا کنید
- عملکرد سیستم را نظارت کنید

ماژول‌های مدیریت سایت
=====================

۱. مدیریت محتوا
   - ویرایش بیش از ۴۳۰ آیتم محتوای چندزبانه
   - مدیریت بخش‌های وب‌سایت به صورت پویا
   - آپلود و سازماندهی تصاویر
   - کنترل لینک‌های شبکه‌های اجتماعی

۲. مدیریت محصولات
   - افزودن/ویرایش محصولات نمایشی
   - مدیریت موجودی فروشگاه
   - تولید بارکدهای EAN-13
   - تنظیم قیمت و موجودی

۳. مدیریت ارتباط با مشتری
   - مشاهده پایگاه داده مشتری
   - پیگیری فعالیت‌های مشتری
   - تجزیه و تحلیل معیارهای مشتری
   - مدیریت بخش‌بندی مشتری

این راهنمای مدیریت کامل برای پلتفرم مامتاز کم را تشکیل می‌دهد.

نسخه: ۲.۰
آخرین به‌روزرسانی: ${date}
زبان: فارسی
`;
}

function getTechnicalDocsEN(date: string): string {
  return `
TECHNICAL DOCUMENTATION - MOMTAZCHEM PLATFORM
=============================================
Generated: ${date}

SYSTEM ARCHITECTURE
===================

Frontend Architecture:
- React 18 with TypeScript
- Tailwind CSS for styling
- Shadcn/ui component library
- Wouter for routing
- TanStack Query for state management

Backend Architecture:
- Node.js with Express.js
- TypeScript (ESM modules)
- PostgreSQL with Drizzle ORM
- Session-based authentication
- Multi-SMTP email system

DATABASE SCHEMA
===============

Core Tables:
- users: Admin authentication
- crm_customers: Customer management
- content_items: Multilingual content
- showcase_products: Display products
- shop_products: E-commerce products
- customer_orders: Order management
- email_settings: Communication config

API ENDPOINTS
=============

Authentication:
- POST /api/admin/login
- POST /api/customers/login
- POST /api/customers/register

Content Management:
- GET /api/content
- PUT /api/admin/content/:id
- POST /api/admin/content

Product Management:
- GET /api/products
- POST /api/admin/products
- PUT /api/admin/products/:id

Order Processing:
- POST /api/orders
- GET /api/admin/orders
- PUT /api/admin/orders/:id/status

DEPLOYMENT CONFIGURATION
========================

Environment Variables:
- DATABASE_URL: PostgreSQL connection
- SESSION_SECRET: Session encryption
- SMTP_HOST: Email server configuration
- NODE_ENV: Environment setting

Build Process:
- npm run build: Production build
- npm run dev: Development server
- npm run db:push: Database migration

Performance Optimization:
- Connection pooling
- Query optimization
- Caching strategies
- Asset optimization

SECURITY MEASURES
=================

Authentication:
- Bcrypt password hashing
- Session management
- CSRF protection
- Input validation

Data Protection:
- SQL injection prevention
- XSS protection
- Rate limiting
- Secure headers

MONITORING & LOGGING
====================

System Monitoring:
- Application performance
- Database queries
- Error tracking
- User activity logs

Email Monitoring:
- Delivery statistics
- Bounce tracking
- Open rates
- Template performance

This technical documentation provides comprehensive system information.

Version: 1.5
Last Updated: ${date}
Language: English
`;
}

function getTechnicalDocsFA(date: string): string {
  return `
مستندات فنی - پلتفرم مامتاز کم
============================
تاریخ تولید: ${date}

معماری سیستم
=============

معماری Frontend:
- React 18 با TypeScript
- Tailwind CSS برای استایل‌دهی
- کتابخانه کامپوننت Shadcn/ui
- Wouter برای مسیریابی
- TanStack Query برای مدیریت state

معماری Backend:
- Node.js با Express.js
- TypeScript (ماژول‌های ESM)
- PostgreSQL با Drizzle ORM
- احراز هویت مبتنی بر session
- سیستم ایمیل Multi-SMTP

این مستندات فنی اطلاعات جامع سیستم را ارائه می‌دهد.

نسخه: ۱.۵
آخرین به‌روزرسانی: ${date}
زبان: فارسی
`;
}

function getProjectProposalEN(date: string): string {
  return `
PROJECT PROPOSAL - MOMTAZCHEM PLATFORM
======================================
Generated: ${date}

EXECUTIVE SUMMARY
=================

Project: Comprehensive Chemical Solutions Platform
Client: Momtazchem
Scope: Full-stack web application with 25+ administrative modules
Timeline: Enterprise-grade implementation
Technology: Modern web technologies with scalable architecture

PROJECT OVERVIEW
================

The Momtazchem platform represents a complete digital transformation solution for chemical industry businesses. This enterprise-grade system combines e-commerce functionality with advanced business management tools.

KEY DELIVERABLES
================

1. SITE MANAGEMENT SYSTEM
   - Centralized administrative dashboard
   - 25+ Quick Action modules
   - Drag-and-drop interface customization
   - Real-time system monitoring

2. CONTENT MANAGEMENT SYSTEM
   - 430+ multilingual content items
   - 4-language support (English, Arabic, Kurdish, Turkish)
   - Dynamic content editing
   - Image management system

3. E-COMMERCE PLATFORM
   - Complete shopping cart system
   - Product catalog with variants
   - EAN-13 barcode generation
   - Payment gateway integration
   - Order management workflow

4. CUSTOMER RELATIONSHIP MANAGEMENT
   - Unified customer database
   - Advanced analytics and reporting
   - Customer segmentation
   - Activity tracking system

5. COMMUNICATION SYSTEMS
   - Multi-SMTP email routing
   - SMS integration
   - Live chat support
   - Automated notifications

6. ANALYTICS & REPORTING
   - Sales performance tracking
   - Customer behavior analysis
   - Geographic distribution mapping
   - Revenue analytics

7. SECURITY & ADMINISTRATION
   - Role-based access control
   - Admin verification system
   - Data backup and recovery
   - Session management

8. TECHNICAL FEATURES
   - AI-powered SKU generation
   - PDF documentation system
   - Multi-language SEO
   - Mobile-responsive design

TECHNICAL SPECIFICATIONS
========================

Frontend Technologies:
- React 18 with TypeScript
- Tailwind CSS framework
- Shadcn/ui component library
- Modern build tools (Vite)

Backend Technologies:
- Node.js with Express
- PostgreSQL database
- Drizzle ORM
- TypeScript throughout

SYSTEM CAPABILITIES
===================

Multilingual Support:
- English, Arabic, Kurdish, Turkish
- RTL/LTR text direction support
- Localized content management
- SEO optimization per language

Scalability Features:
- Cloud-based deployment
- Database optimization
- Performance monitoring
- Load balancing ready

Integration Capabilities:
- Payment gateways
- SMS services
- Email providers
- Analytics tools

IMPLEMENTATION PHASES
====================

Phase 1: Core Infrastructure
- Database design and setup
- Authentication system
- Basic admin panel

Phase 2: Content Management
- Multilingual content system
- Image management
- SEO optimization

Phase 3: E-commerce Features
- Product catalog
- Shopping cart
- Payment integration

Phase 4: Advanced Features
- Analytics dashboard
- Communication systems
- AI integration

Phase 5: Testing & Deployment
- Quality assurance
- Performance optimization
- Production deployment

MAINTENANCE & SUPPORT
=====================

Ongoing Support:
- System monitoring
- Bug fixes and updates
- Feature enhancements
- Technical support

Training:
- Administrator training
- User documentation
- Video tutorials
- Support materials

PROJECT VALUE
=============

Business Benefits:
- Complete digital transformation
- Streamlined operations
- Enhanced customer experience
- Scalable growth platform

Technical Benefits:
- Modern technology stack
- Maintainable codebase
- Security best practices
- Performance optimization

This proposal outlines a comprehensive solution for modern chemical industry businesses.

Proposal Version: 2.0
Date: ${date}
Language: English
`;
}

function getProjectProposalFA(date: string): string {
  return `
پیشنهاد پروژه - پلتفرم مامتاز کم
==============================
تاریخ تولید: ${date}

خلاصه اجرایی
=============

پروژه: پلتفرم جامع راه‌حل‌های شیمیایی
مشتری: مامتاز کم
حیطه: اپلیکیشن وب full-stack با بیش از ۲۵ ماژول مدیریتی
زمان‌بندی: پیاده‌سازی سطح enterprise
تکنولوژی: تکنولوژی‌های وب مدرن با معماری مقیاس‌پذیر

نمای کلی پروژه
===============

پلتفرم مامتاز کم یک راه‌حل کامل تحول دیجیتال برای کسب‌وکارهای صنعت شیمیایی را نمایندگی می‌کند. این سیستم سطح enterprise عملکرد e-commerce را با ابزارهای پیشرفته مدیریت کسب‌وکار ترکیب می‌کند.

این پیشنهاد راه‌حل جامعی برای کسب‌وکارهای مدرن صنعت شیمیایی ارائه می‌دهد.

نسخه پیشنهاد: ۲.۰
تاریخ: ${date}
زبان: فارسی
`;
}

function getCompleteDocsEN(date: string): string {
  return `
COMPLETE DOCUMENTATION - MOMTAZCHEM PLATFORM
============================================
Generated: ${date}

This document combines all aspects of the Momtazchem platform including user guide, administrator guide, technical documentation, and project overview.

PLATFORM OVERVIEW
==================

The Momtazchem platform is a comprehensive digital solution designed specifically for the chemical industry. It combines e-commerce functionality with advanced business management tools, providing a complete ecosystem for chemical companies to manage their operations, customers, and sales processes.

USER GUIDE SECTION
==================
[Complete user guide content included...]

ADMINISTRATOR GUIDE SECTION
===========================
[Complete administrator guide content included...]

TECHNICAL DOCUMENTATION SECTION
===============================
[Complete technical documentation included...]

PROJECT DETAILS SECTION
=======================
[Complete project proposal included...]

SYSTEM INTEGRATION
==================

The platform integrates multiple systems:
- Customer management
- Product catalog
- Order processing
- Payment systems
- Communication tools
- Analytics and reporting

This complete documentation provides comprehensive coverage of all platform aspects.

Document Type: Complete Documentation
Version: 3.0
Last Updated: ${date}
Language: English
`;
}

function getCompleteDocsFA(date: string): string {
  return `
مستندات کامل - پلتفرم مامتاز کم
==============================
تاریخ تولید: ${date}

این سند تمام جنبه‌های پلتفرم مامتاز کم شامل راهنمای کاربری، راهنمای مدیریت، مستندات فنی و نمای کلی پروژه را ترکیب می‌کند.

این مستندات کامل پوشش جامعی از تمام جنبه‌های پلتفرم ارائه می‌دهد.

نوع سند: مستندات کامل
نسخه: ۳.۰
آخرین به‌روزرسانی: ${date}
زبان: فارسی
`;
}

function getDefaultContent(type: string, language: string, date: string): string {
  return `
${type.toUpperCase()} DOCUMENTATION - ${language.toUpperCase()}
============================================

Generated on: ${date}

MOMTAZCHEM CHEMICAL SOLUTIONS PLATFORM
=====================================

This comprehensive platform includes 25+ administrative modules with complete multilingual support.

Document Type: ${type}
Language: ${language}
Generated: ${new Date().toISOString()}
`;
}

// Enhanced text cleaning for better PDF compatibility
function cleanTextForPdf(text: string | null | undefined): string {
  if (!text) return 'N/A';
  
  try {
    let cleanText = text.toString();
    
    // Clean up problematic Unicode characters that can cause PDF issues
    cleanText = cleanText
      .replace(/[\u200C\u200D\u200E\u200F\u061C]/g, '') // Zero-width characters
      .replace(/[\uFEFF\u2060]/g, '') // Other invisible characters
      .replace(/\s+/g, ' ') // Multiple spaces
      .trim();
    
    // Keep Persian/Arabic text as-is for pdfMake to handle
    return cleanText || 'N/A';
  } catch (error) {
    console.error('Error cleaning text for PDF:', error);
    return 'N/A';
  }
}

// Enhanced Customer PDF report generation using pdfMake
export async function generateCustomerPDF(customer: any, analytics: any, activities: any[]): Promise<Buffer> {
  try {
    // Prepare customer data for export
    const customerData = [
      { label: 'Customer ID', text: customer.id.toString() },
      { label: 'Name', text: `${cleanTextForPdf(customer.firstName)} ${cleanTextForPdf(customer.lastName)}` },
      { label: 'Email', text: customer.email || 'N/A' },
      { label: 'Company', text: cleanTextForPdf(customer.company) },
      { label: 'Phone', text: cleanTextForPdf(customer.phone) },
      { label: 'Country', text: cleanTextForPdf(customer.country) },
      { label: 'City', text: cleanTextForPdf(customer.city) },
      { label: 'Address', text: cleanTextForPdf(customer.address) },
      { label: 'Secondary Address', text: cleanTextForPdf(customer.secondaryAddress) },
      { label: 'Postal Code', text: cleanTextForPdf(customer.postalCode) },
      { label: 'Customer Type', text: cleanTextForPdf(customer.customerType) },
      { label: 'Status', text: cleanTextForPdf(customer.customerStatus) },
      { label: 'Source', text: cleanTextForPdf(customer.customerSource) },
      { label: 'Registration Date', text: new Date(customer.createdAt).toLocaleDateString('en-US') },
      { label: 'Total Orders', text: (analytics.totalOrders || 0).toString() },
      { label: 'Total Spent', text: `${analytics.totalSpent || 0} IQD` },
      { label: 'Average Order Value', text: `${analytics.averageOrderValue || 0} IQD` },
      { label: 'First Order Date', text: analytics.firstOrderDate ? new Date(analytics.firstOrderDate).toLocaleDateString('en-US') : 'N/A' },
      { label: 'Last Order Date', text: analytics.lastOrderDate ? new Date(analytics.lastOrderDate).toLocaleDateString('en-US') : 'N/A' },
      { label: 'Days Since Last Order', text: analytics.daysSinceLastOrder ? analytics.daysSinceLastOrder.toString() : 'N/A' }
    ];

    // Add recent activities
    if (activities.length > 0) {
      activities.slice(0, 10).forEach((activity, index) => {
        customerData.push({
          label: `Activity ${index + 1}`,
          text: `${cleanTextForPdf(activity.activityType)} - ${cleanTextForPdf(activity.description)} (${new Date(activity.createdAt).toLocaleDateString('en-US')})`
        });
      });
    }

    return await exportCRMCustomerPDF(customerData);
  } catch (error) {
    // Fallback to simple PDF generation
    console.log('pdfMake failed, using fallback PDF generation');
    const currentDate = new Date().toLocaleDateString('en-US');
    const content = `CUSTOMER REPORT - MOMTAZCHEM CRM
===============================
Customer ID: ${customer.id}

CUSTOMER INFORMATION
====================
Name: ${cleanTextForPdf(customer.firstName)} ${cleanTextForPdf(customer.lastName)}
Email: ${customer.email}
Company: ${cleanTextForPdf(customer.company)}
Phone: ${cleanTextForPdf(customer.phone)}
Country: ${cleanTextForPdf(customer.country)}
City: ${cleanTextForPdf(customer.city)}
Address: ${cleanTextForPdf(customer.address)}

CUSTOMER STATUS
===============
Type: ${cleanTextForPdf(customer.customerType)}
Status: ${cleanTextForPdf(customer.customerStatus)}
Source: ${cleanTextForPdf(customer.customerSource)}
Registration Date: ${new Date(customer.createdAt).toLocaleDateString('en-US')}

PURCHASE ANALYTICS
==================
Total Orders: ${analytics.totalOrders || 0}
Total Spent: ${analytics.totalSpent || 0} IQD
Average Order Value: ${analytics.averageOrderValue || 0} IQD

Report Generated By: Momtazchem CRM System
Date: ${currentDate}`;

    return await generateSimplePDF(content, `Customer Report - ${cleanTextForPdf(customer.firstName)} ${cleanTextForPdf(customer.lastName)}`);
  }
}

// Legacy function for backward compatibility
export function generateCustomerPDFHTML(customer: any, analytics: any, activities: any[]): string {
  // This is now just used for fallback scenarios
  const currentDate = new Date().toLocaleDateString('en-US');
  
  return `CUSTOMER REPORT - MOMTAZCHEM CRM
===============================
Generated: ${currentDate}
Customer ID: ${customer.id}

CUSTOMER INFORMATION
====================
Name: ${cleanTextForPdf(customer.firstName)} ${cleanTextForPdf(customer.lastName)}
Email: ${customer.email}
Company: ${cleanTextForPdf(customer.company)}
Phone: ${cleanTextForPdf(customer.phone)}
Country: ${cleanTextForPdf(customer.country)}
City: ${cleanTextForPdf(customer.city)}
Address: ${cleanTextForPdf(customer.address)}
Secondary Address: ${cleanTextForPdf(customer.secondaryAddress)}
Postal Code: ${cleanTextForPdf(customer.postalCode)}

CUSTOMER STATUS
===============
Type: ${cleanTextForPdf(customer.customerType)}
Status: ${cleanTextForPdf(customer.customerStatus)}
Source: ${cleanTextForPdf(customer.customerSource)}
Registration Date: ${new Date(customer.createdAt).toLocaleDateString('en-US')}

PURCHASE ANALYTICS
==================
Total Orders: ${analytics.totalOrders || 0}
Total Spent: ${analytics.totalSpent || 0} IQD
Average Order Value: ${analytics.averageOrderValue || 0} IQD
First Order Date: ${analytics.firstOrderDate ? new Date(analytics.firstOrderDate).toLocaleDateString('en-US') : 'N/A'}
Last Order Date: ${analytics.lastOrderDate ? new Date(analytics.lastOrderDate).toLocaleDateString('en-US') : 'N/A'}
Days Since Last Order: ${analytics.daysSinceLastOrder || 'N/A'}

RECENT ACTIVITIES
=================
${activities.length > 0 ? activities.map((activity, index) => `
${index + 1}. ${cleanTextForPdf(activity.activityType)} - ${cleanTextForPdf(activity.description)}
   Date: ${new Date(activity.createdAt).toLocaleDateString('en-US')}
   Performed By: ${cleanTextForPdf(activity.performedBy)}
`).join('') : 'No recent activities recorded.'}

CUSTOMER SUMMARY
================
This customer has been with Momtazchem since ${new Date(customer.createdAt).toLocaleDateString('en-US')}.
${analytics.totalOrders > 0 ? `They have placed ${analytics.totalOrders} orders totaling ${analytics.totalSpent} IQD.` : 'No orders placed yet.'}
Current status: ${cleanTextForPdf(customer.customerStatus).toUpperCase()}
Customer type: ${cleanTextForPdf(customer.customerType).toUpperCase()}

Report Generated By: Momtazchem CRM System
Date: ${currentDate}
Platform: Chemical Solutions Management Platform
Version: 1.0
`;
}

// Analytics PDF report generation
export function generateAnalyticsPDFHTML(dashboardStats: any): string {
  const currentDate = new Date().toLocaleDateString('en-US');
  
  return `
CRM ANALYTICS REPORT - MOMTAZCHEM
=================================
Generated: ${currentDate}

CUSTOMER OVERVIEW
=================
Total Customers: ${dashboardStats.totalCustomers || 0}
Active Customers: ${dashboardStats.activeCustomers || 0}
New Customers This Month: ${dashboardStats.newCustomersThisMonth || 0}
Total Revenue: ${dashboardStats.totalRevenue || 0} IQD
Average Order Value: ${dashboardStats.averageOrderValue || 0} IQD

TOP CUSTOMERS
=============
${dashboardStats.topCustomers && dashboardStats.topCustomers.length > 0 ? 
  dashboardStats.topCustomers.map((customer: any, index: number) => `
${index + 1}. ${cleanTextForPdf(customer.name)}
   Email: ${customer.email}
   Total Spent: ${customer.totalSpent} IQD
   Total Orders: ${customer.totalOrders}
`).join('') : 'No customer data available.'}

CUSTOMERS BY TYPE
=================
${dashboardStats.customersByType && dashboardStats.customersByType.length > 0 ?
  dashboardStats.customersByType.map((type: any) => `
${cleanTextForPdf(type.type)}: ${type.count} customers
`).join('') : 'No customer type data available.'}

RECENT ACTIVITIES
=================
${dashboardStats.recentActivities && dashboardStats.recentActivities.length > 0 ?
  dashboardStats.recentActivities.slice(0, 10).map((activity: any, index: number) => `
${index + 1}. ${cleanTextForPdf(activity.activityType)} - ${cleanTextForPdf(activity.description)}
   Date: ${new Date(activity.createdAt).toLocaleDateString('en-US')}
   Performed By: ${cleanTextForPdf(activity.performedBy)}
`).join('') : 'No recent activities recorded.'}

REPORT SUMMARY
==============
This analytics report provides a comprehensive overview of customer data and system activity.
The data reflects the current state of the Momtazchem CRM system as of ${currentDate}.

Generated By: Momtazchem CRM Analytics
Date: ${currentDate}
Platform: Chemical Solutions Management Platform
Version: 1.0
`;
}

// Fallback function for documentation generation
export async function generateDocumentationFallback(type: string, language: string): Promise<Buffer> {
  const documentationContent = getDocumentationContent(type, language);
  return generateSimplePDF(documentationContent, `${type} Documentation - ${language}`);
}