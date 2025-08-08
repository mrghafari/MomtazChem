import { db } from "./db";
import { customerDb } from "./customer-db";
import { eq, sql } from "drizzle-orm";
import { customerOrders } from "@shared/customer-schema";
import { orderManagement, orderStatusHistory } from "@shared/order-management-schema";
import { customerWallets, walletTransactions } from "@shared/customer-schema";
import { UniversalEmailService } from "./universal-email-service";
import { simpleSmsStorage } from "./simple-sms-storage";

/**
 * خدمة مراجعة الحوالات المالية
 * Financial Receipt Review Service
 */
export class FinancialReceiptReviewService {

  /**
   * موافقة القسم المالي على الحوالة - نقل للمستودع
   * Financial department approval - move to warehouse
   */
  async approveReceipt(orderManagementId: number, reviewerId: number, approvalNotes?: string, overpaidAmount?: number) {
    try {
      console.log(`✅ [FINANCIAL APPROVAL] Processing approval for order management ID: ${orderManagementId}`);

      // الحصول على بيانات الطلب
      const orderData = await this.getOrderData(orderManagementId);
      if (!orderData) {
        throw new Error('Order not found');
      }

      // تحديث حالة order_management
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'warehouse_pending',
          financialReviewerId: reviewerId,
          financialReviewedAt: new Date(),
          financialNotes: approvalNotes || 'تم تایید حواله بانکی توسط واحد مالی',
          isOrderLocked: false, // فتح قفل الطلب
          updatedAt: new Date()
        })
        .where(eq(orderManagement.id, orderManagementId));

      // تحديث حالة customer_orders
      await customerDb
        .update(customerOrders)
        .set({
          status: 'warehouse_ready',
          paymentStatus: 'paid',
          notes: sql`COALESCE(${customerOrders.notes}, '') || ' - تم تایید حواله توسط واحد مالی در ' || NOW()`,
          updatedAt: new Date()
        })
        .where(eq(customerOrders.id, orderData.customerOrderId));

      // معالجة المبلغ الزائد إذا وجد
      if (overpaidAmount && overpaidAmount > 0) {
        await this.processOverpayment(orderData, overpaidAmount);
      }

      // تسجيل تاريخ الحالة
      await this.recordStatusHistory(orderManagementId, 'financial_reviewing', 'warehouse_pending', reviewerId, 'financial', approvalNotes);

      console.log(`✅ [FINANCIAL APPROVAL] Order ${orderData.orderNumber} approved and moved to warehouse`);

      // إرسال إشعار موافقة للعميل
      await this.sendApprovalNotificationToCustomer(orderData, overpaidAmount);

      return {
        success: true,
        message: 'تم تایید حواله و انتقال سفارش به انبار',
        orderNumber: orderData.orderNumber,
        overpaidAmount
      };

    } catch (error) {
      console.error(`❌ [FINANCIAL APPROVAL] Error approving receipt:`, error);
      throw error;
    }
  }

  /**
   * رفض القسم المالي للحوالة - إرسال SMS رفض
   * Financial department rejection - send rejection SMS
   */
  async rejectReceipt(orderManagementId: number, reviewerId: number, rejectionReason: string, rejectionCategory: 'invalid_amount' | 'invalid_receipt' | 'expired_receipt' | 'other' = 'other') {
    try {
      console.log(`❌ [FINANCIAL REJECTION] Processing rejection for order management ID: ${orderManagementId}`);

      // الحصول على بيانات الطلب
      const orderData = await this.getOrderData(orderManagementId);
      if (!orderData) {
        throw new Error('Order not found');
      }

      // تحديد نوع الرفض ورسالة مناسبة
      const rejectionMessages = {
        invalid_amount: 'مبلغ حواله با مبلغ سفارش مطابقت ندارد',
        invalid_receipt: 'تصویر حواله نامعتبر یا نامشخص است',
        expired_receipt: 'تاریخ حواله منقضی شده است',
        other: rejectionReason
      };

      const rejectionMessage = rejectionMessages[rejectionCategory];

      // تحديث حالة order_management
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'payment_grace_period', // إعادة للمهلة السماح
          financialReviewerId: reviewerId,
          financialReviewedAt: new Date(),
          financialNotes: `رفض حواله: ${rejectionMessage}`,
          paymentReceiptUrl: null, // حذف الحوالة المرفوضة
          isOrderLocked: false,
          updatedAt: new Date()
        })
        .where(eq(orderManagement.id, orderManagementId));

      // تحديث حالة customer_orders - إعادة للانتظار
      await customerDb
        .update(customerOrders)
        .set({
          status: 'payment_grace_period',
          paymentStatus: 'pending',
          receiptPath: null, // حذف الحوالة المرفوضة للسماح برفع أخرى
          notes: sql`COALESCE(${customerOrders.notes}, '') || ' - رفض حواله توسط واحد مالی: ' || ${rejectionMessage} || ' در ' || NOW()`,
          updatedAt: new Date()
        })
        .where(eq(customerOrders.id, orderData.customerOrderId));

      // تسجيل تاريخ الحالة
      await this.recordStatusHistory(orderManagementId, 'financial_reviewing', 'payment_grace_period', reviewerId, 'financial', `رفض حواله: ${rejectionMessage}`);

      console.log(`❌ [FINANCIAL REJECTION] Order ${orderData.orderNumber} rejected - reason: ${rejectionMessage}`);

      // إرسال إشعار رفض للعميل (SMS + Email)
      await this.sendRejectionNotificationToCustomer(orderData, rejectionMessage, rejectionCategory);

      return {
        success: true,
        message: 'حواله رفض شد و اطلاع رسانی به مشتری ارسال گردید',
        orderNumber: orderData.orderNumber,
        rejectionReason: rejectionMessage
      };

    } catch (error) {
      console.error(`❌ [FINANCIAL REJECTION] Error rejecting receipt:`, error);
      throw error;
    }
  }

  /**
   * معالجة المبلغ الزائد - إضافة للمحفظة
   * Process overpayment - add to wallet
   */
  async processOverpayment(orderData: any, overpaidAmount: number) {
    try {
      console.log(`💰 [OVERPAYMENT] Processing overpayment of ${overpaidAmount} for order ${orderData.orderNumber}`);

      // التحقق من وجود محفظة العميل
      const existingWallet = await customerDb
        .select()
        .from(customerWallets)
        .where(eq(customerWallets.customerId, orderData.customerId))
        .limit(1);

      if (existingWallet.length === 0) {
        // إنشاء محفظة جديدة إذا لم تكن موجودة
        await customerDb.insert(customerWallets).values({
          customerId: orderData.customerId,
          balance: overpaidAmount.toString(),
          currency: 'IQD',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // إضافة المبلغ للمحفظة الموجودة
        await customerDb
          .update(customerWallets)
          .set({
            balance: sql`${customerWallets.balance} + ${overpaidAmount}`,
            updatedAt: new Date()
          })
          .where(eq(customerWallets.customerId, orderData.customerId));
      }

      // تسجيل معاملة في المحفظة
      await customerDb.insert(walletTransactions).values({
        walletId: sql`(SELECT id FROM customer_wallets WHERE customer_id = ${orderData.customerId})`,
        customerId: orderData.customerId,
        transactionType: 'credit',
        amount: overpaidAmount.toString(),
        currency: 'IQD',
        balanceBefore: sql`(SELECT balance FROM customer_wallets WHERE customer_id = ${orderData.customerId}) - ${overpaidAmount}`,
        balanceAfter: sql`(SELECT balance FROM customer_wallets WHERE customer_id = ${orderData.customerId})`,
        description: `بازگشت مبلغ اضافی حواله سفارش ${orderData.orderNumber}`,
        referenceType: 'overpayment_refund',
        referenceId: orderData.id,
        status: 'completed',
        createdAt: new Date()
      });

      console.log(`✅ [OVERPAYMENT] ${overpaidAmount} IQD added to customer ${orderData.customerId} wallet`);

    } catch (error) {
      console.error(`❌ [OVERPAYMENT] Error processing overpayment:`, error);
      throw error;
    }
  }

  /**
   * الحصول على بيانات الطلب
   * Get order data
   */
  async getOrderData(orderManagementId: number) {
    try {
      const orderData = await db
        .select({
          id: orderManagement.id,
          customerOrderId: orderManagement.customerOrderId,
          customerId: customerOrders.customerId,
          orderNumber: customerOrders.orderNumber,
          totalAmount: customerOrders.totalAmount,
          receiptAmount: customerOrders.receiptAmount,
          paymentReceiptUrl: orderManagement.paymentReceiptUrl,
          currentStatus: orderManagement.currentStatus
        })
        .from(orderManagement)
        .innerJoin(customerOrders, eq(orderManagement.customerOrderId, customerOrders.id))
        .where(eq(orderManagement.id, orderManagementId))
        .limit(1);

      return orderData[0] || null;
    } catch (error) {
      console.error(`❌ [GET ORDER DATA] Error getting order data:`, error);
      return null;
    }
  }

  /**
   * تسجيل تاريخ تغيير الحالة
   * Record status change history
   */
  async recordStatusHistory(orderManagementId: number, fromStatus: string, toStatus: string, changedBy: number, department: string, notes?: string) {
    try {
      await db.insert(orderStatusHistory).values({
        orderManagementId,
        fromStatus,
        toStatus,
        changedBy,
        changedByDepartment: department,
        notes,
        createdAt: new Date()
      });
    } catch (error) {
      console.error(`❌ [STATUS HISTORY] Error recording status history:`, error);
    }
  }

  /**
   * إرسال إشعار موافقة للعميل
   * Send approval notification to customer
   */
  async sendApprovalNotificationToCustomer(orderData: any, overpaidAmount?: number) {
    try {
      const { crmStorage } = await import('./crm-storage');
      const customer = await crmStorage.getCrmCustomerById(orderData.customerId);

      if (!customer) {
        console.log(`❌ [APPROVAL NOTIFY] Customer not found for order ${orderData.orderNumber}`);
        return;
      }

      const customerName = `${customer.firstName} ${customer.lastName}`;
      const orderAmount = parseFloat(orderData.totalAmount.toString());

      // رسالة SMS للموافقة
      let smsMessage = `${customerName} عزیز
✅ حواله سفارش ${orderData.orderNumber} تایید شد.
سفارش به انبار منتقل گردید.
مبلغ: ${orderAmount.toLocaleString()} دینار`;

      if (overpaidAmount && overpaidAmount > 0) {
        smsMessage += `\n💰 مبلغ اضافی ${overpaidAmount.toLocaleString()} دینار به کیف پول شما اضافه شد.`;
      }

      smsMessage += `\nممتاز شیمی`;

      if (customer.phone) {
        await simpleSmsStorage.sendSms(customer.phone, smsMessage, 'system');
        console.log(`📱 [APPROVAL NOTIFY] Approval SMS sent to ${customer.phone}`);
      }

      // إيميل الموافقة
      if (customer.email) {
        let emailContent = `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif;">
            <h2 style="color: #22c55e;">✅ تم قبول حوالة الدفع</h2>
            <p>عزيزنا ${customerName}</p>
            <p>نسعد بإعلامكم أنه تم <strong>قبول وتأكيد</strong> حوالة الدفع الخاصة بطلبكم.</p>
            
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>تفاصيل الطلب:</h3>
              <p><strong>رقم الطلب:</strong> ${orderData.orderNumber}</p>
              <p><strong>مبلغ الطلب:</strong> ${orderAmount.toLocaleString()} دينار عراقي</p>
              <p><strong>الحالة:</strong> تم تأكيد الدفع ونقل الطلب للمستودع</p>
            </div>`;

        if (overpaidAmount && overpaidAmount > 0) {
          emailContent += `
            <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <h3 style="color: #16a34a;">💰 مبلغ إضافي مُضاف للمحفظة</h3>
              <p>تم إضافة مبلغ <strong>${overpaidAmount.toLocaleString()} دينار عراقي</strong> إلى محفظتكم الرقمية.</p>
              <p>يمكنكم استخدام هذا المبلغ في طلباتكم القادمة.</p>
            </div>`;
        }

        emailContent += `
            <p><strong>الخطوات التالية:</strong></p>
            <ul>
              <li>✅ تم تأكيد الدفع</li>
              <li>🏪 جاري تحضير الطلب في المستودع</li>
              <li>🚚 سيتم تسليم الطلب للشحن قريباً</li>
              <li>📱 ستصلكم رسالة عند شحن الطلب</li>
            </ul>
            
            <br>
            <p>شكراً لثقتكم بنا</p>
            <p><strong>فريق ممتاز شيمي</strong></p>
          </div>
        `;

        await UniversalEmailService.sendEmail({
          categoryKey: 'customer-notifications',
          to: [customer.email],
          subject: `✅ تأكيد الدفع وقبول الحوالة - طلب ${orderData.orderNumber}`,
          html: emailContent
        });
        console.log(`📧 [APPROVAL NOTIFY] Approval email sent to ${customer.email}`);
      }

    } catch (error) {
      console.error(`❌ [APPROVAL NOTIFY] Error sending approval notification:`, error);
    }
  }

  /**
   * إرسال إشعار رفض للعميل مع SMS
   * Send rejection notification to customer with SMS
   */
  async sendRejectionNotificationToCustomer(orderData: any, rejectionReason: string, rejectionCategory: string) {
    try {
      const { crmStorage } = await import('./crm-storage');
      const customer = await crmStorage.getCrmCustomerById(orderData.customerId);

      if (!customer) {
        console.log(`❌ [REJECTION NOTIFY] Customer not found for order ${orderData.orderNumber}`);
        return;
      }

      const customerName = `${customer.firstName} ${customer.lastName}`;
      const orderAmount = parseFloat(orderData.totalAmount.toString());
      
      // حساب الوقت المتبقي (3 أيام من تاريخ الإنشاء)
      const orderCreation = new Date(orderData.createdAt || Date.now());
      const graceEndTime = new Date(orderCreation.getTime() + 3 * 24 * 60 * 60 * 1000);
      const hoursLeft = Math.max(0, Math.floor((graceEndTime.getTime() - Date.now()) / (1000 * 60 * 60)));

      // رسالة SMS للرفض
      const smsMessage = `${customerName} عزیز
❌ حواله سفارش ${orderData.orderNumber} رد شد.
دلیل: ${rejectionReason}
${hoursLeft} ساعت برای ارسال حواله جدید باقی مانده.
مبلغ: ${orderAmount.toLocaleString()} دینار
ممتاز شیمی`;

      if (customer.phone) {
        await simpleSmsStorage.sendSms(customer.phone, smsMessage, 'urgent');
        console.log(`📱 [REJECTION NOTIFY] Rejection SMS sent to ${customer.phone}`);
      }

      // إيميل الرفض مع تفاصيل
      if (customer.email) {
        const categoryDescriptions = {
          invalid_amount: 'عدم تطابق المبلغ مع قيمة الطلب',
          invalid_receipt: 'صورة الحوالة غير واضحة أو غير صحيحة',
          expired_receipt: 'تاريخ الحوالة منتهي الصلاحية',
          other: 'أسباب أخرى'
        };

        const emailContent = `
          <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif;">
            <h2 style="color: #dc2626;">❌ تم رفض حوالة الدفع</h2>
            <p>عزيزنا ${customerName}</p>
            <p>نأسف لإعلامكم أنه تم رفض حوالة الدفع الخاصة بطلبكم للأسباب التالية:</p>
            
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <h3>تفاصيل الرفض:</h3>
              <p><strong>رقم الطلب:</strong> ${orderData.orderNumber}</p>
              <p><strong>فئة المشكلة:</strong> ${categoryDescriptions[rejectionCategory] || 'أسباب أخرى'}</p>
              <p><strong>السبب التفصيلي:</strong> ${rejectionReason}</p>
              <p><strong>مبلغ الطلب:</strong> ${orderAmount.toLocaleString()} دينار عراقي</p>
            </div>

            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #d97706;">⏰ المهلة المتبقية</h3>
              <p><strong>${hoursLeft} ساعة</strong> متبقية لرفع حوالة دفع جديدة</p>
              <p>في حالة عدم رفع حوالة صحيحة خلال هذه المدة، سيتم إلغاء الطلب تلقائياً</p>
            </div>

            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3>كيفية تصحيح المشكلة:</h3>
              <ul>
                <li>تأكد من وضوح صورة الحوالة</li>
                <li>تأكد من تطابق المبلغ مع قيمة الطلب (${orderAmount.toLocaleString()} دينار)</li>
                <li>تأكد من صحة تاريخ الحوالة (خلال آخر 7 أيام)</li>
                <li>قم برفع حوالة جديدة من خلال حسابكم</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="/bank-receipt-upload?orderId=${orderData.orderNumber}" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                رفع حوالة جديدة
              </a>
            </div>
            
            <br>
            <p>نعتذر عن أي إزعاج ونشكركم لتفهمكم</p>
            <p><strong>فريق ممتاز شيمي</strong></p>
          </div>
        `;

        await UniversalEmailService.sendEmail({
          categoryKey: 'customer-notifications',
          to: [customer.email],
          subject: `❌ رفض حوالة الدفع - طلب ${orderData.orderNumber}`,
          html: emailContent
        });
        console.log(`📧 [REJECTION NOTIFY] Rejection email sent to ${customer.email}`);
      }

    } catch (error) {
      console.error(`❌ [REJECTION NOTIFY] Error sending rejection notification:`, error);
    }
  }

  /**
   * الحصول على قائمة الحوالات في انتظار المراجعة
   * Get list of receipts pending review
   */
  async getPendingReceipts() {
    try {
      const pendingReceipts = await db
        .select({
          orderManagementId: orderManagement.id,
          orderNumber: customerOrders.orderNumber,
          customerId: customerOrders.customerId,
          totalAmount: customerOrders.totalAmount,
          receiptAmount: customerOrders.receiptAmount,
          paymentReceiptUrl: orderManagement.paymentReceiptUrl,
          uploadedAt: customerOrders.uploadedAt,
          currentStatus: orderManagement.currentStatus,
          paymentGracePeriodEnd: orderManagement.paymentGracePeriodEnd
        })
        .from(orderManagement)
        .innerJoin(customerOrders, eq(orderManagement.customerOrderId, customerOrders.id))
        .where(
          sql`
            order_management.current_status = 'financial_reviewing'
            AND order_management.payment_receipt_url IS NOT NULL
            AND order_management.financial_reviewed_at IS NULL
          `
        )
        .orderBy(sql`customer_orders.uploaded_at ASC`);

      return pendingReceipts;
    } catch (error) {
      console.error(`❌ [GET PENDING RECEIPTS] Error getting pending receipts:`, error);
      return [];
    }
  }
}

// تصدير مثيل الخدمة
export const financialReceiptReviewService = new FinancialReceiptReviewService();