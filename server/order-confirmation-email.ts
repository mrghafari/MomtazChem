import { UniversalEmailService } from './universal-email-service';

interface OrderConfirmationEmailData {
  customerEmail: string;
  customerName: string;
  orderNumber: string;
  orderDate: string;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderItems: Array<{
    productName: string;
    quantity: string;
    unitPrice: string;
    totalPrice: string;
  }>;
  gracePeriodDays?: number;
}

export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<boolean> {
  try {
    console.log(`📧 [ORDER CONFIRMATION] Sending email to ${data.customerEmail} for order ${data.orderNumber}`);
    
    // Format payment method name in Persian
    const paymentMethodNames: Record<string, string> = {
      'online': 'پرداخت آنلاین',
      'bank_transfer': 'انتقال بانکی',
      'bank_transfer_grace': 'انتقال بانکی مهلت‌دار',
      'wallet': 'کیف پول',
      'wallet_partial': 'کیف پول + پرداخت آنلاین',
      'cash_on_delivery': 'پرداخت در محل'
    };
    const paymentMethodName = paymentMethodNames[data.paymentMethod] || 'نامشخص';
    
    // Format order status in Persian
    const orderStatusNames: Record<string, string> = {
      'pending': 'در انتظار پرداخت',
      'grace_period': 'مهلت پرداخت',
      'paid': 'پرداخت شده',
      'confirmed': 'تایید شده',
      'processing': 'در حال پردازش'
    };
    const orderStatus = orderStatusNames[data.paymentStatus] || 'در انتظار بررسی';
    
    // Build order items HTML
    let orderItemsHTML = '';
    let orderItemsText = '';
    
    data.orderItems.forEach((item, index) => {
      const itemTotal = Math.round(parseFloat(item.totalPrice));
      const itemPrice = Math.round(parseFloat(item.unitPrice));
      
      orderItemsHTML += `
      <div style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <strong>${index + 1}. ${item.productName}</strong><br/>
            <span style="color: #6b7280; font-size: 13px;">تعداد: ${item.quantity} × ${itemPrice.toLocaleString()} دینار</span>
          </div>
          <div style="font-weight: bold; color: #059669; white-space: nowrap;">
            ${itemTotal.toLocaleString()} دینار
          </div>
        </div>
      </div>`;
      
      orderItemsText += `${index + 1}. ${item.productName} - تعداد: ${item.quantity} × ${itemPrice.toLocaleString()} = ${itemTotal.toLocaleString()} دینار\n`;
    });
    
    // Build payment instructions based on payment method
    let paymentInstructions = '';
    let paymentInstructionsText = '';
    let step1 = '';
    
    if (data.paymentMethod === 'bank_transfer_grace' || data.paymentStatus === 'grace_period') {
      const graceDays = data.gracePeriodDays || 3;
      paymentInstructions = `
      <div style="background: #fef2f2; padding: 20px; border-radius: 6px; margin: 20px 0; border-right: 4px solid #dc2626;">
        <h3 style="color: #dc2626; margin-top: 0; font-size: 16px;">⏰ مهلت پرداخت</h3>
        <p style="margin: 10px 0; line-height: 1.8;">
          <strong>سفارش شما به صورت مهلت‌دار ثبت شده است.</strong><br/>
          شما <strong>${graceDays} روز</strong> فرصت دارید که مبلغ <strong>${Math.round(data.totalAmount).toLocaleString()} دینار عراقی</strong> را به حساب ما واریز کنید.
        </p>
        <div style="background: white; padding: 15px; border-radius: 4px; margin: 15px 0;">
          <h4 style="color: #059669; margin-top: 0;">مراحل پرداخت:</h4>
          <ol style="margin: 10px 0; padding-right: 20px; line-height: 1.8;">
            <li>مبلغ ${Math.round(data.totalAmount).toLocaleString()} دینار را به حساب بانکی ما واریز کنید</li>
            <li>رسید بانکی را از طریق پنل کاربری خود آپلود کنید</li>
            <li>پس از تایید واحد مالی، سفارش شما برای ارسال آماده خواهد شد</li>
          </ol>
        </div>
        <p style="background: #fee2e2; padding: 12px; border-radius: 4px; margin: 15px 0; font-size: 14px;">
          <strong>توجه مهم:</strong> در صورت عدم پرداخت ظرف ${graceDays} روز، سفارش شما به طور خودکار لغو خواهد شد.
        </p>
      </div>`;
      
      paymentInstructionsText = `⏰ مهلت پرداخت: شما ${graceDays} روز فرصت دارید مبلغ ${Math.round(data.totalAmount).toLocaleString()} دینار را واریز کنید. در غیر این صورت سفارش لغو می‌شود.`;
      step1 = 'مبلغ سفارش را ظرف مهلت تعیین شده واریز کنید و رسید بانکی را آپلود نمایید';
      
    } else if (data.paymentMethod === 'online' || data.paymentStatus === 'paid') {
      paymentInstructions = `
      <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-right: 4px solid #059669;">
        <h3 style="color: #059669; margin-top: 0; font-size: 16px;">✅ پرداخت موفق</h3>
        <p style="margin: 10px 0; line-height: 1.8;">
          پرداخت شما با موفقیت انجام شد. سفارش شما در صف بررسی واحد مالی قرار گرفته و پس از تایید، برای ارسال آماده خواهد شد.
        </p>
      </div>`;
      
      paymentInstructionsText = '✅ پرداخت شما با موفقیت انجام شد. سفارش در صف بررسی واحد مالی است.';
      step1 = 'واحد مالی پرداخت شما را بررسی و تایید خواهد کرد';
      
    } else if (data.paymentMethod === 'bank_transfer') {
      paymentInstructions = `
      <div style="background: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0; border-right: 4px solid #f59e0b;">
        <h3 style="color: #b45309; margin-top: 0; font-size: 16px;">📝 در انتظار رسید بانکی</h3>
        <p style="margin: 10px 0; line-height: 1.8;">
          سفارش شما ثبت شد. لطفاً رسید بانکی پرداخت را از طریق پنل کاربری خود آپلود کنید تا سفارش شما پردازش شود.
        </p>
      </div>`;
      
      paymentInstructionsText = '📝 لطفاً رسید بانکی پرداخت خود را از طریق پنل کاربری آپلود کنید.';
      step1 = 'رسید بانکی خود را از طریق پنل کاربری آپلود کنید';
      
    } else {
      step1 = 'واحد مالی سفارش شما را بررسی خواهد کرد';
    }
    
    // Send email using template #14
    const emailSent = await UniversalEmailService.sendEmail({
      categoryKey: 'orders',
      to: [data.customerEmail],
      subject: `تاییدیه سفارش #${data.orderNumber} - شرکت ممتاز شیمی`,
      html: '', // Will be filled by template
      templateNumber: '#14',
      variables: {
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        orderDate: data.orderDate,
        totalAmount: Math.round(data.totalAmount).toLocaleString(),
        paymentMethodName,
        orderStatus,
        orderItems: orderItemsHTML,
        orderItemsText,
        paymentInstructions,
        paymentInstructionsText,
        step1
      }
    });
    
    if (emailSent) {
      console.log(`✅ [ORDER CONFIRMATION] Email sent successfully to ${data.customerEmail}`);
    } else {
      console.error(`❌ [ORDER CONFIRMATION] Failed to send email to ${data.customerEmail}`);
    }
    
    return emailSent;
    
  } catch (error) {
    console.error(`❌ [ORDER CONFIRMATION] Error sending email:`, error);
    return false;
  }
}
