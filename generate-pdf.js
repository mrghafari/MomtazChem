import fs from 'fs';
import { marked } from 'marked';

// خواندن محتوای فایل‌ها
const mainProposal = fs.readFileSync('پروپوزال-اصلی-momtazchem.docx.txt', 'utf8');
const businessProposal = fs.readFileSync('پروپوزال-کسب‌وکار-momtazchem.docx.txt', 'utf8');
const technicalGuide = fs.readFileSync('راهنمای-فنی-momtazchem.docx.txt', 'utf8');

// تولید HTML برای PDF
const generateHTML = (content, title) => {
  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Tahoma', 'Arial', 'Segoe UI', sans-serif;
            line-height: 1.6;
            margin: 40px;
            direction: rtl;
            text-align: right;
            background: white;
        }
        
        h1 {
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 10px;
            font-size: 28px;
            text-align: center;
        }
        
        h2 {
            color: #1e40af;
            margin-top: 30px;
            margin-bottom: 15px;
            font-size: 22px;
            border-right: 4px solid #3b82f6;
            padding-right: 15px;
        }
        
        h3 {
            color: #1d4ed8;
            margin-top: 25px;
            margin-bottom: 12px;
            font-size: 18px;
        }
        
        h4 {
            color: #2563eb;
            margin-top: 20px;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        p {
            margin-bottom: 12px;
            text-align: justify;
            line-height: 1.8;
        }
        
        ul, ol {
            margin-bottom: 15px;
            padding-right: 20px;
        }
        
        li {
            margin-bottom: 8px;
            line-height: 1.6;
        }
        
        code {
            background-color: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        }
        
        pre {
            background-color: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            overflow-x: auto;
            direction: ltr;
            text-align: left;
        }
        
        blockquote {
            border-right: 4px solid #fbbf24;
            background-color: #fffbeb;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 14px;
        }
        
        th, td {
            border: 1px solid #d1d5db;
            padding: 12px;
            text-align: center;
        }
        
        th {
            background-color: #f3f4f6;
            font-weight: bold;
            color: #374151;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
            border-radius: 10px;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            border-top: 2px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
        }
        
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        
        .highlight {
            background-color: #fef3c7;
            padding: 15px;
            border-radius: 8px;
            border-right: 4px solid #f59e0b;
            margin: 15px 0;
        }
        
        .english {
            direction: ltr;
            text-align: left;
            font-style: italic;
            color: #6b7280;
        }
        
        @media print {
            body {
                margin: 20px;
            }
            .section {
                page-break-inside: avoid;
            }
        }
        
        /* پشتیبانی از فونت‌های فارسی */
        @font-face {
            font-family: 'Persian';
            src: local('Tahoma'), local('Arial Unicode MS');
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p><strong>Momtazchem Chemical Solutions Platform</strong></p>
        <p>تاریخ: ژانویه 2025 | Date: January 2025</p>
    </div>
    
    <div class="content">
        ${marked(content)}
    </div>
    
    <div class="footer">
        <hr>
        <p><strong>Momtazchem Chemical Solutions</strong></p>
        <p>www.momtazchem.com | info@momtazchem.com</p>
        <p>این سند محرمانه بوده و مخصوص استفاده داخلی شرکت می‌باشد</p>
        <p class="english">This document is confidential and for internal company use only</p>
    </div>
</body>
</html>
  `;
};

// تولید فایل‌های HTML
console.log('📄 Creating PDF-ready HTML files...');

const mainHTML = generateHTML(mainProposal, 'پروپوزال و راهنمای جامع پلتفرم');
const businessHTML = generateHTML(businessProposal, 'پروپوزال کسب‌وکار پلتفرم');
const technicalHTML = generateHTML(technicalGuide, 'راهنمای معماری فنی پلتفرم');

fs.writeFileSync('پروپوزال-اصلی-momtazchem.html', mainHTML, 'utf8');
fs.writeFileSync('پروپوزال-کسب‌وکار-momtazchem.html', businessHTML, 'utf8');
fs.writeFileSync('راهنمای-فنی-momtazchem.html', technicalHTML, 'utf8');

console.log('✅ HTML files created successfully!');
console.log('📁 Files created:');
console.log('  - پروپوزال-اصلی-momtazchem.html');
console.log('  - پروپوزال-کسب‌وکار-momtazchem.html');
console.log('  - راهنمای-فنی-momtazchem.html');
console.log('');
console.log('💡 برای تبدیل به PDF:');
console.log('   1. فایل‌های HTML را در مرورگر باز کنید');
console.log('   2. Ctrl+P یا Cmd+P فشار دهید');
console.log('   3. "Print to PDF" را انتخاب کنید');
console.log('   4. تنظیمات: A4, Portrait, Include headers/footers');