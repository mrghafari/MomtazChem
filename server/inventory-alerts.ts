import { shopStorage } from "./shop-storage";
import { UniversalEmailService } from "./universal-email-service";

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
  // Configuration for notifications
  private static notificationConfig = {
    emailEnabled: true,
    categoryKey: 'inventory-alerts', // Use universal email service  
    emergencyContacts: [
      { name: 'Manager', email: 'inventory@momtazchem.com' },
      // می‌توانید اعضای دیگر تیم مدیریت را اضافه کنید
    ]
  };

  /**
   * Check all products and send alerts for low stock items
   */
  static async checkInventoryLevels(): Promise<void> {
    try {
      const products = await shopStorage.getShopProducts();
      const alertProducts: InventoryAlert[] = [];

      for (const product of products) {
        const currentStock = product.stockQuantity || 0;
        const minimumThreshold = product.minStockLevel || 5; // حد مینیمم برای اعلام به مدیر تولید
        
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
   * Send inventory alert via email only
   */
  private static async sendInventoryAlert(alerts: InventoryAlert[]): Promise<void> {
    try {
      // Send Email Alert
      if (this.notificationConfig.emailEnabled) {
        await this.sendEmailAlert(alerts);
      }
    } catch (error) {
      console.error('Error sending inventory alerts:', error);
    }
  }

  /**
   * Send inventory alert email to management using Template #13 or #17
   */
  private static async sendEmailAlert(alerts: InventoryAlert[]): Promise<void> {
    try {
      const { emailStorage } = await import('./email-storage');
      
      // Determine which template to use based on alert severity
      const criticalAlerts = alerts.filter(a => a.alertLevel === 'out_of_stock');
      const templateNumber = criticalAlerts.length > 0 ? '#17' : '#13'; // Use #17 for comprehensive alerts, #13 for low stock
      
      const alertTemplate = await emailStorage.getTemplateByNumber(templateNumber);
      
      if (alertTemplate) {
        console.log(`📧 Using Template ${templateNumber} - ${alertTemplate.templateName} for inventory alerts`);
        
        const templateVariables = {
          alert_count: alerts.length.toString(),
          product_count: alerts.length.toString(),
          critical_count: criticalAlerts.length.toString(),
          low_stock_count: (alerts.length - criticalAlerts.length).toString(),
          alert_level: criticalAlerts.length > 0 ? 'critical' : 'warning',
          timestamp: new Date().toLocaleString('fa-IR'),
          products_list: alerts.map(a => `${a.productName} (موجودی: ${a.currentStock})`).join(', ')
        };

        // Process template content with variables
        let processedHtml = alertTemplate.htmlContent;
        let processedSubject = alertTemplate.subject;
        
        for (const [key, value] of Object.entries(templateVariables)) {
          const placeholder = `{{${key}}}`;
          processedHtml = processedHtml.replace(new RegExp(placeholder, 'g'), value);
          processedSubject = processedSubject.replace(new RegExp(placeholder, 'g'), value);
        }

        await UniversalEmailService.sendEmail({
          categoryKey: this.notificationConfig.categoryKey,
          to: ['inventory@momtazchem.com'],
          subject: processedSubject,
          html: processedHtml,
          templateNumber: templateNumber,
          variables: templateVariables
        });

        console.log(`✅ Inventory alert sent using Template ${templateNumber} for ${alerts.length} products`);
      } else {
        console.warn(`⚠️ Template ${templateNumber} not found, using fallback method`);
        
        // Fallback to hardcoded template
        const htmlContent = this.generateAlertEmailHtml(alerts);
        const textContent = this.generateAlertEmailText(alerts);

        await UniversalEmailService.sendEmail({
          categoryKey: this.notificationConfig.categoryKey,
          to: ['inventory@momtazchem.com'],
          subject: `🚨 Inventory Alert - ${alerts.length} Product${alerts.length > 1 ? 's' : ''} Need Attention`,
          html: htmlContent,
          text: textContent,
          variables: {
            alertCount: alerts.length.toString(),
            productCount: alerts.length.toString()
          }
        });

        console.log(`Inventory alert sent for ${alerts.length} products via fallback template`);
      }
    } catch (error) {
      console.error('Error sending inventory alert email:', error);
    }
  }

  // SMS notification functionality removed per requirements

  /**
   * Generate HTML email content for inventory alerts
   */
  private static generateAlertEmailHtml(alerts: InventoryAlert[]): string {
    const outOfStock = alerts.filter(a => a.alertLevel === 'out_of_stock');
    const lowStock = alerts.filter(a => a.alertLevel === 'low_stock');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inventory Alert</title>
    <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 25px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .alert-section { margin-bottom: 30px; }
        .alert-title { color: #dc2626; font-size: 20px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #dc2626; padding-bottom: 5px; }
        .product-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        .product-table th { background: #fee2e2; color: #dc2626; padding: 12px; text-align: left; font-weight: bold; }
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
            <h1>🚨 Inventory Alert</h1>
            <p>Automated Report from Momtazchem Inventory Management System</p>
            <p>${new Date().toLocaleDateString('en-US')} - ${new Date().toLocaleTimeString('en-US')}</p>
        </div>
        
        <div class="content">
            <p>Dear Management,</p>
            <p>The inventory management system has identified <strong>${alerts.length}</strong> product${alerts.length > 1 ? 's' : ''} that require immediate attention:</p>
            
            ${outOfStock.length > 0 ? `
            <div class="alert-section">
                <div class="alert-title">📵 Out of Stock Products (${outOfStock.length} items)</div>
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>SKU</th>
                            <th>Current Stock</th>
                            <th>Minimum Required</th>
                            <th>Status</th>
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
                            <td><span class="status-badge status-out">Out of Stock</span></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            ${lowStock.length > 0 ? `
            <div class="alert-section">
                <div class="alert-title">⚠️ Low Stock Products (${lowStock.length} items)</div>
                <table class="product-table">
                    <thead>
                        <tr>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>SKU</th>
                            <th>Current Stock</th>
                            <th>Minimum Required</th>
                            <th>Status</th>
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
                            <td><span class="status-badge status-low">Low Stock</span></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-top: 20px;">
                <h3 style="color: #1e40af; margin-top: 0;">Recommended Actions:</h3>
                <ul style="color: #374151;">
                    <li>Immediately review inventory for out-of-stock products</li>
                    <li>Place purchase orders for low stock items</li>
                    <li>Contact suppliers to expedite delivery</li>
                    <li>Review minimum stock threshold settings</li>
                    <li>Consider emergency procurement procedures</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p>This email was automatically sent from the Momtazchem Inventory Management System.</p>
            <p>For more information, please contact the IT department.</p>
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

    let text = `Inventory Alert - Momtazchem\n\n`;
    text += `Date: ${new Date().toLocaleDateString('en-US')}\n`;
    text += `Time: ${new Date().toLocaleTimeString('en-US')}\n\n`;
    text += `Dear Management,\n\n`;
    text += `The inventory management system has identified ${alerts.length} product${alerts.length > 1 ? 's' : ''} that require immediate attention:\n\n`;

    if (outOfStock.length > 0) {
      text += `Out of Stock Products (${outOfStock.length} items):\n`;
      text += `----------------------------------------\n`;
      outOfStock.forEach(product => {
        text += `- ${product.productName} (${product.sku})\n`;
        text += `  Category: ${product.category}\n`;
        text += `  Current Stock: ${product.currentStock}\n`;
        text += `  Minimum Required: ${product.minimumThreshold}\n\n`;
      });
    }

    if (lowStock.length > 0) {
      text += `Low Stock Products (${lowStock.length} items):\n`;
      text += `----------------------------------------\n`;
      lowStock.forEach(product => {
        text += `- ${product.productName} (${product.sku})\n`;
        text += `  Category: ${product.category}\n`;
        text += `  Current Stock: ${product.currentStock}\n`;
        text += `  Minimum Required: ${product.minimumThreshold}\n\n`;
      });
    }

    text += `Recommended Actions:\n`;
    text += `- Immediately review inventory for out-of-stock products\n`;
    text += `- Place purchase orders for low stock items\n`;
    text += `- Contact suppliers to expedite delivery\n`;
    text += `- Review minimum stock threshold settings\n`;
    text += `- Consider emergency procurement procedures\n\n`;
    text += `This email was automatically sent from the Momtazchem Inventory Management System.\n`;

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
      const minimumThreshold = product.minStockLevel || 5; // حد مینیمم برای اعلام به مدیر تولید
      
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
    // Get monitoring interval from global settings or use default
    const getMonitoringInterval = () => {
      try {
        // This could be extended to read from database or config file
        // For now, default to hourly checks during business hours
        return 60 * 60 * 1000; // Every hour in milliseconds
      } catch (error) {
        return 60 * 60 * 1000; // Default hourly interval
      }
    };

    const monitoringInterval = getMonitoringInterval();
    
    // Check inventory at specified intervals during business hours (8 AM to 6 PM)
    setInterval(async () => {
      const hour = new Date().getHours();
      if (hour >= 8 && hour <= 18) {
        await this.checkInventoryLevels();
      }
    }, monitoringInterval);

    console.log(`Inventory monitoring started - checking every ${monitoringInterval / 60000} minutes during business hours`);
  }
}

export default InventoryAlertService;