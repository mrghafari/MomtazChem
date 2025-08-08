import { db } from "./db";
import { customerDb } from "./customer-db";
import { eq, and, sql, isNull, ne, lt } from "drizzle-orm";
import { customerOrders, orderItems } from "@shared/customer-schema";
import { orderManagement, orderStatusHistory } from "@shared/order-management-schema";
import { UniversalEmailService } from "./universal-email-service";
import { simpleSmsStorage } from "./simple-sms-storage";

/**
 * خدمة إدارة الطلبات ذات المهلة الثلاثة أيام
 * Grace Period Management Service for 3-day payment window orders
 */
export class GracePeriodManagementService {
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * بدء خدمة مراقبة الطلبات ذات المهلة
   * Start grace period monitoring service
   */
  start() {
    if (this.isRunning) {
      console.log('⏰ [GRACE PERIOD] Service is already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 [GRACE PERIOD] Starting grace period management service');

    // فحص كل ساعة للطلبات الجديدة والمنتهية الصلاحية
    this.monitoringInterval = setInterval(async () => {
      await this.processGracePeriodOrders();
    }, 60 * 60 * 1000); // كل ساعة

    // تشغيل فوري
    setTimeout(() => {
      this.processGracePeriodOrders();
    }, 5000);
  }

  /**
   * إيقاف الخدمة
   * Stop the service
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isRunning = false;
    console.log('🛑 [GRACE PERIOD] Service stopped');
  }

  /**
   * معالجة الطلبات ذات المهلة الثلاثة أيام
   * Process 3-day grace period orders
   */
  async processGracePeriodOrders() {
    try {
      console.log('⏰ [GRACE PERIOD] Processing grace period orders...');
      
      // معالجة الطلبات التي تم رفع الحوالة لها
      await this.processOrdersWithUploadedReceipts();
      
      // معالجة الطلبات المنتهية الصلاحية
      await this.processExpiredGracePeriodOrders();
      
      // إرسال تذكيرات للطلبات القريبة من انتهاء المهلة
      await this.sendGracePeriodReminders();
      
    } catch (error) {
      console.error('❌ [GRACE PERIOD] Error processing grace period orders:', error);
    }
  }

  /**
   * معالجة الطلبات التي تم رفع الحوالة لها - نقلها للقسم المالي
   * Process orders with uploaded receipts - move to financial review
   */
  async processOrdersWithUploadedReceipts() {
    try {
      console.log('📄 [GRACE RECEIPT] Checking orders with uploaded receipts...');

      // البحث عن الطلبات ذات المهلة 3 أيام التي تم رفع الحوالة لها
      const ordersWithReceipts = await customerDb
        .select()
        .from(customerOrders)
        .where(
          and(
            // طلبات بنك تحويل مع مهلة 3 أيام
            eq(customerOrders.paymentMethod, 'واریز بانکی با مهلت 3 روزه'),
            // في مرحلة انتظار المراجعة المالية أو فترة السماح
            sql`${customerOrders.status} IN ('payment_grace_period', 'pending')`,
            // تم رفع الحوالة
            sql`${customerOrders.receiptPath} IS NOT NULL`,
            // لم يتم مراجعتها مالياً بعد
            sql`${customerOrders.paymentStatus} IN ('pending', 'unpaid') OR ${customerOrders.paymentStatus} IS NULL`
          )
        );

      if (ordersWithReceipts.length === 0) {
        console.log('✅ [GRACE RECEIPT] No orders with uploaded receipts found');
        return;
      }

      console.log(`📄 [GRACE RECEIPT] Found ${ordersWithReceipts.length} orders with uploaded receipts ready for financial review`);

      for (const order of ordersWithReceipts) {
        await this.moveOrderToFinancialReview(order);
      }

    } catch (error) {
      console.error('❌ [GRACE RECEIPT] Error processing orders with receipts:', error);
    }
  }

  /**
   * نقل الطلب للمراجعة المالية عند رفع الحوالة
   * Move order to financial review when receipt is uploaded
   */
  async moveOrderToFinancialReview(order: any) {
    try {
      console.log(`💼 [FINANCIAL REVIEW] Moving order ${order.orderNumber} to financial review`);

      // التحقق من وجود order_management record
      const existingManagement = await db
        .select()
        .from(orderManagement)
        .where(eq(orderManagement.customerOrderId, order.id))
        .limit(1);

      if (existingManagement.length === 0) {
        // إنشاء order_management record جديد
        await db.insert(orderManagement).values({
          customerOrderId: order.id,
          currentStatus: 'financial_reviewing',
          paymentMethod: 'grace_period',
          paymentSourceLabel: 'حواله بانکی آپلود شده - در انتظار تایید',
          paymentReceiptUrl: order.receiptPath,
          paymentGracePeriodStart: order.createdAt,
          paymentGracePeriodEnd: new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000),
          isOrderLocked: true, // قفل الطلب أثناء المراجعة
          isAutoApprovalEnabled: false, // لا موافقة تلقائية للحوالات البنكية
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // تحديث order_management الموجود
        await db
          .update(orderManagement)
          .set({
            currentStatus: 'financial_reviewing',
            paymentReceiptUrl: order.receiptPath,
            isOrderLocked: true,
            updatedAt: new Date()
          })
          .where(eq(orderManagement.customerOrderId, order.id));
      }

      // تحديث حالة الطلب في customer_orders
      await customerDb
        .update(customerOrders)
        .set({
          status: 'financial_reviewing',
          paymentStatus: 'reviewing',
          notes: sql`COALESCE(${customerOrders.notes}, '') || ' - تم نقل الطلب للمراجعة المالية بعد رفع الحوالة في ' || NOW()`,
          updatedAt: new Date()
        })
        .where(eq(customerOrders.id, order.id));

      console.log(`✅ [FINANCIAL REVIEW] Order ${order.orderNumber} moved to financial review successfully`);

      // إرسال تأكيد للعميل
      await this.sendReceiptConfirmationToCustomer(order);

    } catch (error) {
      console.error(`❌ [FINANCIAL REVIEW] Error moving order ${order.orderNumber} to financial review:`, error);
    }
  }

  /**
   * معالجة الطلبات المنتهية الصلاحية - أرشفة كطلبات فاشلة
   * Process expired grace period orders - archive as failed orders
   */
  async processExpiredGracePeriodOrders() {
    try {
      console.log('⌛ [GRACE EXPIRED] Checking for expired grace period orders...');

      // البحث عن الطلبات المنتهية الصلاحية (أكثر من 3 أيام + 6 ساعات بوفر)
      const expiredOrders = await customerDb
        .select()
        .from(customerOrders)
        .where(
          and(
            // طلبات بنك تحويل مع مهلة 3 أيام
            eq(customerOrders.paymentMethod, 'واریز بانکی با مهلت 3 روزه'),
            // في حالة انتظار أو فترة السماح
            sql`${customerOrders.status} IN ('payment_grace_period', 'pending')`,
            // لم يتم رفع الحوالة
            isNull(customerOrders.receiptPath),
            // منتهية الصلاحية (3 أيام + 6 ساعات)
            lt(customerOrders.createdAt, sql`NOW() - INTERVAL '78 hours'`)
          )
        );

      if (expiredOrders.length === 0) {
        console.log('✅ [GRACE EXPIRED] No expired grace period orders found');
        return;
      }

      console.log(`⌛ [GRACE EXPIRED] Found ${expiredOrders.length} expired grace period orders to archive`);

      for (const order of expiredOrders) {
        await this.archiveFailedOrder(order);
      }

    } catch (error) {
      console.error('❌ [GRACE EXPIRED] Error processing expired orders:', error);
    }
  }

  /**
   * أرشفة الطلب الفاشل
   * Archive failed order
   */
  async archiveFailedOrder(order: any) {
    try {
      console.log(`🗃️ [ARCHIVE] Archiving failed order ${order.orderNumber}`);

      // تحرير المخزون أولاً
      await this.releaseInventoryReservations(order.id);

      // أرشفة الطلب بدلاً من الحذف للحفاظ على التسلسل
      await customerDb
        .update(customerOrders)
        .set({
          status: 'failed_archived',
          paymentStatus: 'failed',
          notes: sql`COALESCE(${customerOrders.notes}, '') || ' - أرشفة الطلب الفاشل: انتهت مهلة الـ3 أيام لرفع الحوالة في ' || NOW()`,
          updatedAt: new Date()
        })
        .where(eq(customerOrders.id, order.id));

      // إنشاء أو تحديث order_management للأرشيف
      const existingManagement = await db
        .select()
        .from(orderManagement)
        .where(eq(orderManagement.customerOrderId, order.id))
        .limit(1);

      if (existingManagement.length === 0) {
        await db.insert(orderManagement).values({
          customerOrderId: order.id,
          currentStatus: 'cancelled',
          paymentMethod: 'grace_period',
          paymentSourceLabel: 'طلب منتهي الصلاحية - مؤرشف',
          financialNotes: 'الطلب مؤرشف تلقائياً بسبب انتهاء مهلة الـ3 أيام لرفع الحوالة البنكية',
          paymentGracePeriodStart: order.createdAt,
          paymentGracePeriodEnd: new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        await db
          .update(orderManagement)
          .set({
            currentStatus: 'cancelled',
            financialNotes: 'الطلب مؤرشف تلقائياً بسبب انتهاء مهلة الـ3 أيام لرفع الحوالة البنكية',
            updatedAt: new Date()
          })
          .where(eq(orderManagement.customerOrderId, order.id));
      }

      console.log(`✅ [ARCHIVE] Order ${order.orderNumber} successfully archived as failed`);

      // إرسال إشعار للعميل
      await this.sendFailureNotificationToCustomer(order);

    } catch (error) {
      console.error(`❌ [ARCHIVE] Error archiving order ${order.orderNumber}:`, error);
    }
  }

  /**
   * تحرير حجوزات المخزون
   * Release inventory reservations
   */
  async releaseInventoryReservations(orderId: number) {
    try {
      console.log(`📦 [INVENTORY] Releasing reservations for order ID: ${orderId}`);

      const items = await customerDb
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));

      if (items.length > 0) {
        const { shopProducts } = await import('@shared/shop-schema');
        
        for (const item of items) {
          if (item.productId && item.quantity) {
            await db
              .update(shopProducts)
              .set({
                stockQuantity: sql`stock_quantity + ${parseFloat(item.quantity)}`,
                updatedAt: new Date()
              })
              .where(eq(shopProducts.id, item.productId));

            console.log(`📦 [INVENTORY] Released ${item.quantity} units of product ${item.productId}`);
          }
        }

        // حذف عناصر الطلب
        await customerDb
          .delete(orderItems)
          .where(eq(orderItems.orderId, orderId));
      }

    } catch (error) {
      console.error(`❌ [INVENTORY] Error releasing reservations for order ${orderId}:`, error);
    }
  }

  /**
   * إرسال تذكيرات للطلبات القريبة من انتهاء المهلة
   * Send reminders for orders approaching deadline
   */
  async sendGracePeriodReminders() {
    try {
      console.log('🔔 [GRACE REMINDER] Checking for orders needing reminders...');

      // البحث عن الطلبات التي تبقى لها 24 ساعة أو أقل
      const urgentOrders = await customerDb
        .select()
        .from(customerOrders)
        .where(
          and(
            eq(customerOrders.paymentMethod, 'واریز بانکی با مهلت 3 روزه'),
            sql`${customerOrders.status} IN ('payment_grace_period', 'pending')`,
            isNull(customerOrders.receiptPath),
            // بين 48-72 ساعة (اليوم الأخير)
            and(
              lt(customerOrders.createdAt, sql`NOW() - INTERVAL '48 hours'`),
              sql`${customerOrders.createdAt} > NOW() - INTERVAL '72 hours'`
            )
          )
        );

      if (urgentOrders.length === 0) {
        console.log('✅ [GRACE REMINDER] No urgent reminders needed');
        return;
      }

      console.log(`🔔 [GRACE REMINDER] Sending urgent reminders for ${urgentOrders.length} orders`);

      for (const order of urgentOrders) {
        await this.sendUrgentReminderToCustomer(order);
      }

    } catch (error) {
      console.error('❌ [GRACE REMINDER] Error sending reminders:', error);
    }
  }

  /**
   * إرسال تأكيد رفع الحوالة للعميل
   * Send receipt upload confirmation to customer
   */
  async sendReceiptConfirmationToCustomer(order: any) {
    try {
      const { crmStorage } = await import('./crm-storage');
      const customer = await crmStorage.getCrmCustomerById(order.customerId);

      if (!customer) {
        console.log(`❌ [RECEIPT CONFIRM] Customer not found for order ${order.orderNumber}`);
        return;
      }

      const customerName = `${customer.firstName} ${customer.lastName}`;
      const orderAmount = parseFloat(order.totalAmount.toString());

      // إرسال SMS تأكيد
      if (customer.phone) {
        const smsMessage = `${customerName} عزیز
حواله سفارش ${order.orderNumber} دریافت شد.
در حال بررسی توسط واحد مالی.
نتیجه ظرف 24 ساعت اعلام میشود.
ممتاز شیمی`;

        await simpleSmsStorage.sendSms(customer.phone, smsMessage, 'system');
        console.log(`📱 [RECEIPT CONFIRM] SMS confirmation sent to ${customer.phone}`);
      }

      // إرسال إيميل تأكيد
      if (customer.email) {
        await UniversalEmailService.sendEmail({
          categoryKey: 'customer-notifications',
          to: [customer.email],
          subject: `تأكيد استلام حوالة الدفع - طلب ${order.orderNumber}`,
          html: `
            <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif;">
              <h2>عزيزنا ${customerName}</h2>
              <p>تم استلام حوالة الدفع الخاصة بطلبك رقم <strong>${order.orderNumber}</strong> بنجاح.</p>
              <p><strong>مبلغ الطلب:</strong> ${orderAmount.toLocaleString()} دينار عراقي</p>
              <p>سيتم مراجعة حوالة الدفع من قبل القسم المالي خلال 24 ساعة.</p>
              <p>سنقوم بإشعاركم فور اكتمال المراجعة.</p>
              <br>
              <p>شكراً لثقتكم بنا</p>
              <p><strong>فريق ممتاز شيمي</strong></p>
            </div>
          `
        });
        console.log(`📧 [RECEIPT CONFIRM] Email confirmation sent to ${customer.email}`);
      }

    } catch (error) {
      console.error(`❌ [RECEIPT CONFIRM] Error sending confirmation for order ${order.orderNumber}:`, error);
    }
  }

  /**
   * إرسال تذكير عاجل للعميل
   * Send urgent reminder to customer
   */
  async sendUrgentReminderToCustomer(order: any) {
    try {
      const { crmStorage } = await import('./crm-storage');
      const customer = await crmStorage.getCrmCustomerById(order.customerId);

      if (!customer) {
        console.log(`❌ [URGENT REMINDER] Customer not found for order ${order.orderNumber}`);
        return;
      }

      const customerName = `${customer.firstName} ${customer.lastName}`;
      const orderAmount = parseFloat(order.totalAmount.toString());
      const hoursLeft = 72 - Math.floor((Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60));

      // إرسال SMS عاجل
      if (customer.phone) {
        const smsMessage = `${customerName} عزیز
⚠️ تذکر فوری: ${hoursLeft} ساعت تا لغو سفارش ${order.orderNumber}
مبلغ: ${orderAmount.toLocaleString()} دینار
لطفاً حواله را فوری آپلود کنید.
ممتاز شیمی`;

        await simpleSmsStorage.sendSms(customer.phone, smsMessage, 'urgent');
        console.log(`📱 [URGENT REMINDER] Urgent SMS sent to ${customer.phone}`);
      }

      // تحديث ملاحظات الطلب
      await customerDb
        .update(customerOrders)
        .set({
          notes: sql`COALESCE(${customerOrders.notes}, '') || ' - تذكير عاجل: ' || ${hoursLeft} || ' ساعة متبقية في ' || NOW()`,
          updatedAt: new Date()
        })
        .where(eq(customerOrders.id, order.id));

    } catch (error) {
      console.error(`❌ [URGENT REMINDER] Error sending urgent reminder for order ${order.orderNumber}:`, error);
    }
  }

  /**
   * إرسال إشعار فشل الطلب للعميل
   * Send failure notification to customer
   */
  async sendFailureNotificationToCustomer(order: any) {
    try {
      const { crmStorage } = await import('./crm-storage');
      const customer = await crmStorage.getCrmCustomerById(order.customerId);

      if (!customer) {
        console.log(`❌ [FAILURE NOTIFY] Customer not found for order ${order.orderNumber}`);
        return;
      }

      const customerName = `${customer.firstName} ${customer.lastName}`;
      const orderAmount = parseFloat(order.totalAmount.toString());

      // إرسال SMS إشعار الفشل
      if (customer.phone) {
        const smsMessage = `${customerName} عزیز
متأسفانه سفارش ${order.orderNumber} به علت عدم ارسال حواله لغو شد.
مبلغ: ${orderAmount.toLocaleString()} دینار
برای خرید مجدد تماس بگیرید.
ممتاز شیمی`;

        await simpleSmsStorage.sendSms(customer.phone, smsMessage, 'system');
        console.log(`📱 [FAILURE NOTIFY] Failure SMS sent to ${customer.phone}`);
      }

      // إرسال إيميل إشعار الفشل
      if (customer.email) {
        await UniversalEmailService.sendEmail({
          categoryKey: 'customer-notifications',
          to: [customer.email],
          subject: `إلغاء الطلب - انتهاء مهلة الدفع ${order.orderNumber}`,
          html: `
            <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif;">
              <h2>عزيزنا ${customerName}</h2>
              <p>نأسف لإعلامكم أنه تم إلغاء طلبكم رقم <strong>${order.orderNumber}</strong></p>
              <p><strong>السبب:</strong> انتهاء مهلة الـ3 أيام المخصصة لرفع حوالة الدفع</p>
              <p><strong>مبلغ الطلب:</strong> ${orderAmount.toLocaleString()} دينار عراقي</p>
              <hr>
              <h3>إعادة تفعيل الطلب:</h3>
              <p>يمكنكم إعادة تفعيل الطلب بأحد الطرق التالية:</p>
              <ul>
                <li>الدفع من خلال محفظتكم الرقمية</li>
                <li>تقديم طلب جديد مع الدفع المباشر</li>
                <li>التواصل معنا لترتيب طريقة دفع أخرى</li>
              </ul>
              <br>
              <p>نعتذر عن أي إزعاج وشكراً لتفهمكم</p>
              <p><strong>فريق ممتاز شيمي</strong></p>
            </div>
          `
        });
        console.log(`📧 [FAILURE NOTIFY] Failure email sent to ${customer.email}`);
      }

    } catch (error) {
      console.error(`❌ [FAILURE NOTIFY] Error sending failure notification for order ${order.orderNumber}:`, error);
    }
  }

  /**
   * الحصول على حالة الخدمة
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: this.monitoringInterval !== null
    };
  }
}

// تصدير مثيل الخدمة
export const gracePeriodManagementService = new GracePeriodManagementService();