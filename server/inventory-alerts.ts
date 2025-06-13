import { shopStorage } from "./shop-storage";
import nodemailer from "nodemailer";

interface InventoryAlert {
  productId: number;
  productName: string;
  currentStock: number;
  minimumThreshold: number;
  category: string;
  sku: string;
  alertLevel: 'low_stock' | 'out_of_stock';
}

export class InventoryAlertService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  /**
   * Check all products and send alerts for low stock items
   */
  static async checkInventoryLevels(): Promise<void> {
    try {
      const products = await shopStorage.getShopProducts();
      const alertProducts: InventoryAlert[] = [];

      for (const product of products) {
        const currentStock = product.stockQuantity || 0;
        const minimumThreshold = product.lowStockThreshold || 10;
        
        if (currentStock <= 0) {
          alertProducts.push({
            productId: product.id,
            productName: product.name,
            currentStock,
            minimumThreshold,
            category: product.category,
            sku: product.sku,
            alertLevel: 'out_of_stock'
          });
        } else if (currentStock <= minimumThreshold) {
          alertProducts.push({
            productId: product.id,
            productName: product.name,
            currentStock,
            minimumThreshold,
            category: product.category,
            sku: product.sku,
            alertLevel: 'low_stock'
          });
        }
      }

      if (alertProducts.length > 0) {
        await this.sendInventoryAlert(alertProducts);
      }
    } catch (error) {
      console.error('Error checking inventory levels:', error);
    }
  }

  /**
   * Send inventory alert email to management
   */
  private static async sendInventoryAlert(alerts: InventoryAlert[]): Promise<void> {
    try {
      const htmlContent = this.generateAlertEmailHtml(alerts);
      const textContent = this.generateAlertEmailText(alerts);

      const mailOptions = {
        from: `"Momtazchem Inventory System" <${process.env.SMTP_USER}>`,
        to: 'info@momtazchem.com',
        subject: `🚨 هشدار موجودی انبار - ${alerts.length} محصول نیاز به بررسی`,
        html: htmlContent,
        text: textContent,
      };

      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await this.transporter.sendMail(mailOptions);
        console.log(`Inventory alert sent for ${alerts.length} products`);
      } else {
        console.log('SMTP configuration missing - would send inventory alert:', mailOptions);
      }
    } catch (error) {
      console.error('Error sending inventory alert:', error);
    }
  }

  /**
   * Generate HTML email content for inventory alerts
   */
  private static generateAlertEmailHtml(alerts: InventoryAlert[]): string {
    const outOfStock = alerts.filter(a => a.alertLevel === 'out_of_stock');
    const lowStock = alerts.filter(a => a.alertLevel === 'low_stock');

    return `
<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>هشدار موجودی انبار</title>
    <style>
        body { font-family: Tahoma, Arial, sans-serif; direction: rtl; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 25px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .alert-section { margin-bottom: 30px; }
        .alert-title { color: #dc2626; font-size: 20px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #dc2626; padding-bottom: 5px; }
        .product-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .product-table th { background: #fee2e2; color: #dc2626; padding: 12px; text-align: right; font-weight: bold; }
        .product-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .out-of-stock { background-color: #fef2f2; }
        .low-stock { background-color: #fffbeb; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status-out { background: #dc2626; color: white; }
        .status-low { background: #f59e0b; color: white; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; }
        .urgent { color: #dc2626; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 هشدار موجودی انبار</h1>
            <p>گزارش خودکار سیستم مدیریت موجودی مؤتازشیمی</p>
            <p>${new Date().toLocaleDateString('fa-IR')} - ${new Date().toLocaleTimeString('fa-IR')}</p>
        </div>
        
        <div class="content">
            <p>سلام مدیر گرامی،</p>
            <p>سیستم مدیریت موجودی ${alerts.length} محصول را شناسایی کرده که نیاز به بررسی فوری دارند:</p>
            
            ${outOfStock.length > 0 ? `
            <div class="alert-section">
                <div class="alert-title">📵 محصولات تمام شده (${outOfStock.length} قلم)</div>
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>نام محصول</th>
                            <th>دسته‌بندی</th>
                            <th>کد محصول</th>
                            <th>موجودی فعلی</th>
                            <th>حداقل مورد نیاز</th>
                            <th>وضعیت</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${outOfStock.map(product => `
                        <tr class="out-of-stock">
                            <td><strong>${product.productName}</strong></td>
                            <td>${product.category}</td>
                            <td>${product.sku}</td>
                            <td class="urgent">${product.currentStock}</td>
                            <td>${product.minimumThreshold}</td>
                            <td><span class="status-badge status-out">تمام شده</span></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            ${lowStock.length > 0 ? `
            <div class="alert-section">
                <div class="alert-title">⚠️ محصولات کم موجود (${lowStock.length} قلم)</div>
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>نام محصول</th>
                            <th>دسته‌بندی</th>
                            <th>کد محصول</th>
                            <th>موجودی فعلی</th>
                            <th>حداقل مورد نیاز</th>
                            <th>وضعیت</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lowStock.map(product => `
                        <tr class="low-stock">
                            <td><strong>${product.productName}</strong></td>
                            <td>${product.category}</td>
                            <td>${product.sku}</td>
                            <td class="urgent">${product.currentStock}</td>
                            <td>${product.minimumThreshold}</td>
                            <td><span class="status-badge status-low">کم موجود</span></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3 style="color: #1e40af; margin-top: 0;">اقدامات پیشنهادی:</h3>
                <ul style="color: #374151;">
                    <li>بررسی فوری موجودی محصولات تمام شده</li>
                    <li>ثبت سفارش خرید برای محصولات کم موجود</li>
                    <li>تماس با تأمین‌کنندگان برای تسریع در تحویل</li>
                    <li>بررسی تنظیمات حداقل موجودی</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>این ایمیل به صورت خودکار از سیستم مدیریت موجودی مؤتازشیمی ارسال شده است.</p>
            <p>برای اطلاعات بیشتر با واحد فناوری اطلاعات تماس بگیرید.</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate plain text email content for inventory alerts
   */
  private static generateAlertEmailText(alerts: InventoryAlert[]): string {
    const outOfStock = alerts.filter(a => a.alertLevel === 'out_of_stock');
    const lowStock = alerts.filter(a => a.alertLevel === 'low_stock');

    let text = `هشدار موجودی انبار - مؤتازشیمی\n\n`;
    text += `تاریخ: ${new Date().toLocaleDateString('fa-IR')}\n`;
    text += `زمان: ${new Date().toLocaleTimeString('fa-IR')}\n\n`;
    text += `سلام مدیر گرامی،\n\n`;
    text += `سیستم مدیریت موجودی ${alerts.length} محصول را شناسایی کرده که نیاز به بررسی فوری دارند:\n\n`;

    if (outOfStock.length > 0) {
      text += `محصولات تمام شده (${outOfStock.length} قلم):\n`;
      text += `----------------------------------------\n`;
      outOfStock.forEach(product => {
        text += `- ${product.productName} (${product.sku})\n`;
        text += `  دسته‌بندی: ${product.category}\n`;
        text += `  موجودی: ${product.currentStock}\n`;
        text += `  حداقل مورد نیاز: ${product.minimumThreshold}\n\n`;
      });
    }

    if (lowStock.length > 0) {
      text += `محصولات کم موجود (${lowStock.length} قلم):\n`;
      text += `----------------------------------------\n`;
      lowStock.forEach(product => {
        text += `- ${product.productName} (${product.sku})\n`;
        text += `  دسته‌بندی: ${product.category}\n`;
        text += `  موجودی: ${product.currentStock}\n`;
        text += `  حداقل مورد نیاز: ${product.minimumThreshold}\n\n`;
      });
    }

    text += `اقدامات پیشنهادی:\n`;
    text += `- بررسی فوری موجودی محصولات تمام شده\n`;
    text += `- ثبت سفارش خرید برای محصولات کم موجود\n`;
    text += `- تماس با تأمین‌کنندگان برای تسریع در تحویل\n`;
    text += `- بررسی تنظیمات حداقل موجودی\n\n`;
    text += `این ایمیل به صورت خودکار از سیستم مدیریت موجودی مؤتازشیمی ارسال شده است.\n`;

    return text;
  }

  /**
   * Check specific product inventory and send alert if needed
   */
  static async checkProductInventory(productId: number): Promise<boolean> {
    try {
      const product = await shopStorage.getShopProductById(productId);
      if (!product) return false;

      const currentStock = product.stockQuantity || 0;
      const minimumThreshold = product.lowStockThreshold || 10;
      
      if (currentStock <= minimumThreshold) {
        const alert: InventoryAlert = {
          productId: product.id,
          productName: product.name,
          currentStock,
          minimumThreshold,
          category: product.category,
          sku: product.sku,
          alertLevel: currentStock <= 0 ? 'out_of_stock' : 'low_stock'
        };

        await this.sendInventoryAlert([alert]);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking product inventory:', error);
      return false;
    }
  }

  /**
   * Schedule daily inventory checks
   */
  static startInventoryMonitoring(): void {
    // Check inventory every hour during business hours (8 AM to 6 PM)
    setInterval(async () => {
      const hour = new Date().getHours();
      if (hour >= 8 && hour <= 18) {
        await this.checkInventoryLevels();
      }
    }, 60 * 60 * 1000); // Every hour

    console.log('Inventory monitoring started - checking every hour during business hours');
  }
}

export default InventoryAlertService;