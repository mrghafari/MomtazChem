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
    console.log(`📧 [ORDER EMAIL] Sending to ${data.customerEmail} for order ${data.orderNumber}`);
    
    // Build order items HTML and text
    let orderItemsHTML = '';
    let orderItemsText = '';
    
    data.orderItems.forEach((item, index) => {
      const itemTotal = Math.round(parseFloat(item.totalPrice));
      const itemPrice = Math.round(parseFloat(item.unitPrice));
      
      orderItemsHTML += `
      <div style="padding: 12px 0; ${index < data.orderItems.length - 1 ? 'border-bottom: 1px solid #e5e7eb;' : ''}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
            <strong>${index + 1}. ${item.productName}</strong><br/>
            <span style="color: #6b7280; font-size: 13px;">تعداد: ${item.quantity} × ${itemPrice.toLocaleString()} دینار</span>
          </div>
          <div style="font-weight: bold; color: #059669; white-space: nowrap; margin-right: 10px;">
            ${itemTotal.toLocaleString()} دینار
          </div>
        </div>
      </div>`;
      
      orderItemsText += `${index + 1}. ${item.productName} - تعداد: ${item.quantity} × ${itemPrice.toLocaleString()} = ${itemTotal.toLocaleString()} دینار\n`;
    });
    
    // Payment note based on method
    let paymentNote = '';
    let paymentNoteText = '';
    
    if (data.paymentMethod === 'bank_transfer_grace' || data.paymentStatus === 'grace_period') {
      const graceDays = data.gracePeriodDays || 3;
      paymentNote = `سفارش شما به صورت مهلت‌دار ثبت شده است. لطفاً ظرف ${graceDays} روز مبلغ را واریز کرده و رسید را از طریق پنل کاربری آپلود کنید. در صورت عدم پرداخت، سفارش لغو خواهد شد.`;
      paymentNoteText = paymentNote;
    } else if (data.paymentMethod === 'online' || data.paymentStatus === 'paid') {
      paymentNote = 'پرداخت شما با موفقیت انجام شد. پس از بررسی واحد مالی، سفارش شما برای ارسال آماده می‌شود.';
      paymentNoteText = paymentNote;
    } else if (data.paymentMethod === 'bank_transfer') {
      paymentNote = 'لطفاً رسید بانکی خود را از طریق پنل کاربری آپلود کنید تا سفارش شما پردازش شود.';
      paymentNoteText = paymentNote;
    } else {
      paymentNote = 'سفارش شما در حال بررسی است و به زودی وضعیت آن به شما اطلاع داده خواهد شد.';
      paymentNoteText = paymentNote;
    }
    
    // Send email using template #14
    const emailSent = await UniversalEmailService.sendEmail({
      categoryKey: 'orders',
      to: [data.customerEmail],
      subject: `تاییدیه سفارش #${data.orderNumber} - شرکت ممتاز شیمی`,
      html: '',
      templateNumber: '#14',
      variables: {
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        orderDate: data.orderDate,
        totalAmount: Math.round(data.totalAmount).toLocaleString(),
        orderItems: orderItemsHTML,
        orderItemsText,
        paymentNote,
        paymentNoteText
      }
    });
    
    if (emailSent) {
      console.log(`✅ [ORDER EMAIL] Sent to ${data.customerEmail}`);
    } else {
      console.error(`❌ [ORDER EMAIL] Failed to send to ${data.customerEmail}`);
    }
    
    return emailSent;
    
  } catch (error) {
    console.error(`❌ [ORDER EMAIL] Error:`, error);
    return false;
  }
}
