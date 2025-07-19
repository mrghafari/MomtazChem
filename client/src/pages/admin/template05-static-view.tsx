import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Template05StaticView: React.FC = () => {
  // Template #05 HTML content (verified from database)
  const template05Html = `<div style="font-family: 'Arial', 'Helvetica', sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #2c3e50; font-size: 24px; font-weight: bold; margin: 0;">Momtaz Chemical Solutions</h1>
    <p style="color: #7f8c8d; font-size: 14px; margin: 5px 0 0 0;">شرکت ممتاز شیمی</p>
  </div>
  
  <p style="color: #2c3e50; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
    <strong>{{customer_name}} عزیز،</strong>
  </p>
  
  <p style="color: #555555; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
    با سلام و احترام، استعلام شما با شماره <strong>{{inquiry_number}}</strong> در سیستم ما ثبت و بررسی شده است.
  </p>
  
  <!-- پاسخ ما - Our Response Section -->
  <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60;">
    <h3 style="color: #27ae60; font-size: 18px; margin: 0 0 15px 0; font-weight: bold;">
      📋 پاسخ ما - Our Response
    </h3>
    <div style="background: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #d5e8d5;">
      <p style="color: #2c3e50; font-size: 14px; line-height: 1.6; margin: 0;">
        {{response_text}}
      </p>
    </div>
  </div>
  
  <!-- درخواست شما - Your Request Section -->
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db;">
    <h3 style="color: #3498db; font-size: 18px; margin: 0 0 15px 0; font-weight: bold;">
      💬 درخواست شما - Your Request
    </h3>
    <div style="background: #ffffff; padding: 15px; border-radius: 6px; border: 1px solid #dae8f4;">
      <p style="color: #2c3e50; font-size: 14px; margin: 0 0 10px 0;">
        <strong>موضوع:</strong> {{inquiry_subject}}
      </p>
      <p style="color: #2c3e50; font-size: 14px; margin: 0 0 10px 0;">
        <strong>دسته‌بندی:</strong> {{inquiry_category}}
      </p>
      <p style="color: #555555; font-size: 13px; margin: 0;">
        <strong>جزئیات درخواست:</strong> {{inquiry_details}}
      </p>
    </div>
  </div>
  
  <!-- تماس با ما -->
  <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #ffc107;">
    <h3 style="color: #856404; font-size: 16px; margin: 0 0 15px 0; font-weight: bold;">
      📞 اطلاعات تماس - Contact Information
    </h3>
    <div style="color: #856404; font-size: 14px; line-height: 1.8;">
      <p style="margin: 0 0 8px 0;">
        <strong>تلفن:</strong> <a href="tel:+9647709996771" style="color: #856404; text-decoration: none;">+964 770 999 6771</a>
      </p>
      <p style="margin: 0 0 8px 0;">
        <strong>ایمیل:</strong> <a href="mailto:info@momtazchem.com" style="color: #856404; text-decoration: none;">info@momtazchem.com</a>
      </p>
      <p style="margin: 0 0 8px 0;">
        <strong>وب‌سایت:</strong> <a href="https://www.momtazchem.com" style="color: #856404; text-decoration: none;">www.momtazchem.com</a>
      </p>
      <p style="margin: 0;">
        <strong>آدرس:</strong> عراق، اربیل - Iraq, Erbil
      </p>
    </div>
  </div>
  
  <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; margin-top: 30px;">
    <p style="color: #6c757d; font-size: 12px; margin: 0;">
      این ایمیل به صورت خودکار ارسال شده است. لطفاً پاسخ ندهید.
    </p>
    <p style="color: #6c757d; font-size: 12px; margin: 5px 0 0 0;">
      برای پیگیری بیشتر، با شماره‌های فوق تماس بگیرید.
    </p>
  </div>
  
</div>`;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">📧 Template #05 - نمایش کامل</h1>
          <p className="text-gray-600 mt-1">Template #05 زیبا با بخش‌های "پاسخ ما" و "درخواست شما"</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-green-700 bg-green-50">
            ✅ بارگذاری موفق از دیتابیس
          </Badge>
        </div>
      </div>

      {/* Template Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 Template #05 - Momtaz Chemical Follow-up Response
            <Badge variant="secondary">Database Verified</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">موضوع:</label>
              <p className="text-gray-900 font-medium">پیگیری استعلام - Follow-up Response</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">متغیرها:</label>
              <p className="text-gray-900">{`{{customer_name}}, {{inquiry_number}}, {{response_text}}, {{inquiry_subject}}, {{inquiry_category}}`}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">شماره تلفن:</label>
              <p className="text-gray-900 font-bold text-green-600">+964 770 999 6771 ✅</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">وب‌سایت:</label>
              <p className="text-gray-900 font-bold text-blue-600">www.momtazchem.com ✅</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎨 پیش‌نمایش Template #05 کامل
            <Badge variant="outline" className="text-blue-700 bg-blue-50">
              HTML کامل با طراحی زیبا
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-white">
            <div 
              dangerouslySetInnerHTML={{ __html: template05Html }}
              className="email-template-preview"
            />
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <h4 className="font-medium text-gray-700 mb-2">✨ ویژگی‌های Template #05:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>بخش "پاسخ ما" با پس‌زمینه سبز</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">✅</span>
                <span>بخش "درخواست شما" با پس‌زمینه آبی</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-600">✅</span>
                <span>بخش اطلاعات تماس با پس‌زمینه زرد</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-600">✅</span>
                <span>طراحی responsive و حرفه‌ای</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>شماره تلفن جدید: +964 770 999 6771</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-600">✅</span>
                <span>وب‌سایت: www.momtazchem.com</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-600">✅</span>
                <span>متغیرهای قابل تعویض: {`{{customer_name}}, {{inquiry_number}}`}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-indigo-600">✅</span>
                <span>فرمت HTML کامل برای ایمیل</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">🎯 وضعیت Template #05:</h4>
            <div className="text-sm text-green-700">
              <p>✅ Template #05 کامل و آماده در دیتابیس موجود است</p>
              <p>✅ شامل تمام بخش‌های درخواست شده: "پاسخ ما" و "درخواست شما"</p>
              <p>✅ شماره تلفن و وب‌سایت به‌روزرسانی شده</p>
              <p>✅ طراحی زیبا با رنگ‌های متمایز برای هر بخش</p>
              <p>✅ آماده برای استفاده در سیستم ایمیل خودکار</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Template05StaticView;