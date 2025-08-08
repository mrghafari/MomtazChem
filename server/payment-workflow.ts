import { db } from "./db";
import { eq, and, lte, gte, sql } from "drizzle-orm";
import { customerOrders, orderItems } from "../shared/customer-schema";
import { orderManagement, orderStatusHistory } from "../shared/order-management-schema";
import { shopProducts } from "../shared/shop-schema";
import { customerWallets, walletTransactions } from "../shared/customer-schema";

// منطق کامل سیستم پرداخت مطابق با خواسته کاربر
export class PaymentWorkflowService {
  
  // 1. محاسبه گزینه‌های پرداخت برای مشتری
  async calculatePaymentOptions(cartItems: any, shippingCost: number, customerId?: number) {
    console.log("💳 [PAYMENT OPTIONS] Starting calculation...");
    
    // محاسبه مجموع سفارش
    let orderTotal = 0;
    const productIds = Object.keys(cartItems).map(id => parseInt(id));
    console.log(`🛒 [CART] Product IDs:`, productIds);
    
    const products = await db
      .select({ id: shopProducts.id, price: shopProducts.price })
      .from(shopProducts)
      .where(sql`${shopProducts.id} IN (${productIds.join(',')})`);
    
    for (const product of products) {
      const quantity = cartItems[product.id.toString()] || 0;
      const productTotal = parseFloat(product.price) * quantity;
      orderTotal += productTotal;
      console.log(`📦 [PRODUCT] ID: ${product.id}, Price: ${product.price}, Qty: ${quantity}, Total: ${productTotal}`);
    }
    
    const totalWithShipping = orderTotal + shippingCost;
    console.log(`💰 [PAYMENT] Order total: ${totalWithShipping} IQD`);
    
    // بررسی موجودی کیف پول
    let walletBalance = 0;
    if (customerId) {
      const [wallet] = await db
        .select({ balance: customerWallets.balance })
        .from(customerWallets)
        .where(eq(customerWallets.customerId, customerId))
        .limit(1);
      
      walletBalance = parseFloat(wallet?.balance || "0");
      console.log(`💼 [WALLET] Balance: ${walletBalance} IQD`);
    }
    
    // گزینه‌های پرداخت
    const options: Record<string, any> = {
      // گزینه 1: درگاه بانکی
      bankGateway: {
        method: "bank_gateway",
        label: "پرداخت از طریق درگاه بانکی",
        description: "پرداخت آنلاین - تایید خودکار پس از 5 دقیقه",
        amount: totalWithShipping,
        sourceLabel: "پرداخت توسط بانک",
        autoApproval: true,
        approvalMinutes: 5,
        smsReminders: false,
        emailReminders: false
      },
      
      // گزینه 2: کیف پول (اگر موجودی کافی باشد)
      wallet: walletBalance >= totalWithShipping ? {
        method: "wallet",
        label: "پرداخت از کیف پول",
        description: "برداشت از موجودی کیف پول - تایید خودکار پس از 5 دقیقه",
        amount: totalWithShipping,
        walletAmount: totalWithShipping,
        bankAmount: 0,
        sourceLabel: "از طریق کیف پول",
        autoApproval: true,
        approvalMinutes: 5,
        smsReminders: false,
        emailReminders: false
      } : null,
      
      // گزینه 3: ترکیبی کیف پول + بانک
      walletPartial: (walletBalance > 0 && walletBalance < totalWithShipping) ? {
        method: "wallet_partial",
        label: "ترکیبی: کیف پول + درگاه بانکی",
        description: `${walletBalance.toLocaleString()} دینار از کیف پول + ${(totalWithShipping - walletBalance).toLocaleString()} دینار از بانک`,
        amount: totalWithShipping,
        walletAmount: walletBalance,
        bankAmount: totalWithShipping - walletBalance,
        sourceLabel: "ترکیبی: کیف پول + بانک",
        autoApproval: true,
        approvalMinutes: 5,
        smsReminders: false,
        emailReminders: false
      } : null,
      
      // گزینه 4: مهلت‌دار 3 روزه (واریز بانکی)
      gracePeriod: {
        method: "grace_period",
        label: "مهلت‌دار 3 روزه - واریز بانکی",
        description: "واریز به حساب بانکی شرکت - مهلت آپلود فیش 3 روز",
        amount: totalWithShipping,
        sourceLabel: "سفارش مهلت دار 3 روزه",
        autoApproval: false,
        graceDays: 3,
        smsReminders: true,
        emailReminders: true
      }
    };
    
    return {
      orderTotal,
      shippingCost,
      totalAmount: totalWithShipping,
      walletBalance,
      options: Object.fromEntries(
        Object.entries(options).filter(([_, option]) => option !== null)
      )
    };
  }
  
  // 2. ایجاد سفارش با روش پرداخت انتخابی
  async createOrderWithPayment(orderData: any, paymentMethod: string) {
    console.log(`📝 [CREATE ORDER] Method: ${paymentMethod}`);
    
    let customerOrder: any = null;
    let managementData: any = null;
    
    try {
      // برای bank_gateway، ابتدا تراکنش را تایید کنیم قبل از ایجاد سفارش
      if (paymentMethod === 'bank_gateway') {
        const transactionValid = await this.verifyBankGatewayTransaction(orderData);
        if (!transactionValid) {
          console.log(`❌ [BANK GATEWAY] Transaction verification failed for customer ${orderData.customerId}`);
          throw new Error('تراکنش بانکی ناموفق بود. لطفاً مجدداً تلاش کنید یا از روش پرداخت دیگری استفاده کنید.');
        }
      }
      
      // ایجاد سفارش در customer_orders
      [customerOrder] = await db
        .insert(customerOrders)
        .values({
          ...orderData,
          paymentMethod,
          status: this.getInitialStatus(paymentMethod),
          paymentStatus: this.getInitialPaymentStatus(paymentMethod)
        })
        .returning();
      
      // ایجاد رکورد در order_management
      managementData = await this.createOrderManagement(customerOrder, paymentMethod);
      
      // پردازش پرداخت بر اساس روش انتخابی
      await this.processPaymentMethod(customerOrder, managementData, paymentMethod, orderData);
      
      console.log(`✅ [CREATE ORDER] Order ${customerOrder.orderNumber} created successfully`);
      return customerOrder;
      
    } catch (error) {
      console.error(`❌ [CREATE ORDER] Error:`, error);
      
      // اگر سفارش ایجاد شده بود ولی پرداخت ناموفق بود، سفارش را کنسل کنیم
      if (customerOrder && paymentMethod === 'bank_gateway') {
        await this.cancelFailedBankGatewayOrder(customerOrder, managementData);
      }
      
      throw error;
    }
  }
  
  // 3. ایجاد رکورد مدیریت سفارش
  private async createOrderManagement(customerOrder: any, paymentMethod: string) {
    const sourceLabel = this.getPaymentSourceLabel(paymentMethod);
    
    const [orderMgmt] = await db
      .insert(orderManagement)
      .values({
        customerOrderId: customerOrder.id,
        currentStatus: this.getInitialManagementStatus(paymentMethod),
        paymentMethod,
        paymentSourceLabel: sourceLabel,
        autoApprovalScheduledAt: this.shouldAutoApprove(paymentMethod) ? 
          new Date(Date.now() + 5 * 60 * 1000) : null, // 5 minutes from now
        isAutoApprovalEnabled: this.shouldAutoApprove(paymentMethod),
        paymentGracePeriodStart: paymentMethod === 'grace_period' ? new Date() : null,
        paymentGracePeriodEnd: paymentMethod === 'grace_period' ? 
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null // 3 days from now
      })
      .returning();
    
    return orderMgmt;
  }
  
  // 4. پردازش روش‌های مختلف پرداخت
  private async processPaymentMethod(customerOrder: any, orderMgmt: any, paymentMethod: string, orderData: any) {
    switch (paymentMethod) {
      case 'bank_gateway':
        await this.processBankGatewayPayment(customerOrder, orderMgmt);
        break;
        
      case 'wallet':
        await this.processWalletPayment(customerOrder, orderMgmt, orderData);
        break;
        
      case 'wallet_partial':
        await this.processPartialWalletPayment(customerOrder, orderMgmt, orderData);
        break;
        
      case 'grace_period':
        await this.processGracePeriodOrder(customerOrder, orderMgmt);
        break;
    }
  }
  
  // 5. پردازش پرداخت درگاه بانکی
  private async processBankGatewayPayment(customerOrder: any, orderMgmt: any) {
    console.log(`🏦 [BANK GATEWAY] Processing payment for order ${customerOrder.orderNumber}`);
    
    try {
      // تایید نهایی تراکنش قبل از پردازش
      const transactionConfirmed = await this.confirmBankGatewayTransaction(customerOrder);
      
      if (!transactionConfirmed) {
        console.log(`❌ [BANK GATEWAY] Final transaction confirmation failed for order ${customerOrder.orderNumber}`);
        throw new Error('تایید نهایی تراکنش بانکی ناموفق بود. سفارش لغو شد.');
      }
      
      console.log(`✅ [BANK GATEWAY] Transaction confirmed for order ${customerOrder.orderNumber}`);
      
      // بروزرسانی وضعیت به financial_reviewing برای تایید 5 دقیقه‌ای
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'financial_reviewing',
          paymentSourceLabel: 'پرداخت توسط بانک',
          bankAmountPaid: customerOrder.totalAmount
        })
        .where(eq(orderManagement.id, orderMgmt.id));
      
      // زمان‌بندی تایید خودکار
      this.scheduleAutoApproval(orderMgmt.id, 5);
      
    } catch (error) {
      console.error(`❌ [BANK GATEWAY] Payment processing failed for order ${customerOrder.orderNumber}:`, error);
      throw error;
    }
  }
  
  // 6. پردازش پرداخت کیف پول
  private async processWalletPayment(customerOrder: any, orderMgmt: any, orderData: any) {
    console.log(`💼 [WALLET] Processing payment for order ${customerOrder.orderNumber}`);
    
    const totalAmount = parseFloat(customerOrder.totalAmount);
    
    // ✅ CRITICAL: بررسی موجودی کیف پول قبل از برداشت
    const [currentWallet] = await db
      .select({ balance: customerWallets.balance })
      .from(customerWallets)
      .where(eq(customerWallets.customerId, orderData.customerId))
      .limit(1);
    
    const currentBalance = parseFloat(currentWallet?.balance || "0");
    
    if (currentBalance < totalAmount) {
      console.log(`❌ [WALLET] Insufficient balance for order ${customerOrder.orderNumber}:`, {
        required: totalAmount,
        available: currentBalance,
        deficit: totalAmount - currentBalance
      });
      
      throw new Error(`موجودی کیف پول کافی نیست. مورد نیاز: ${totalAmount.toLocaleString()} دینار، موجود: ${currentBalance.toLocaleString()} دینار`);
    }
    
    console.log(`✅ [WALLET] Sufficient balance confirmed:`, {
      required: totalAmount,
      available: currentBalance,
      remaining: currentBalance - totalAmount
    });
    
    // برداشت از کیف پول
    await this.deductFromWallet(orderData.customerId, totalAmount, customerOrder.orderNumber);
    
    // بروزرسانی وضعیت
    await db
      .update(orderManagement)
      .set({
        currentStatus: 'financial_reviewing',
        paymentSourceLabel: 'از طریق کیف پول',
        walletAmountUsed: totalAmount.toString()
      })
      .where(eq(orderManagement.id, orderMgmt.id));
    
    // زمان‌بندی تایید خودکار
    this.scheduleAutoApproval(orderMgmt.id, 5);
  }
  
  // 7. پردازش پرداخت ترکیبی - با تشخیص پوشش کامل کیف پول
  private async processPartialWalletPayment(customerOrder: any, orderMgmt: any, orderData: any) {
    console.log(`🔄 [PARTIAL] Processing hybrid payment for order ${customerOrder.orderNumber}`);
    
    const totalAmount = parseFloat(customerOrder.totalAmount);
    const requestedWalletAmount = parseFloat(orderData.walletAmount || "0");
    
    // ✅ ENHANCED: بررسی موجودی کیف پول برای تشخیص پوشش کامل
    const [currentWallet] = await db
      .select({ balance: customerWallets.balance })
      .from(customerWallets)
      .where(eq(customerWallets.customerId, orderData.customerId))
      .limit(1);
    
    const currentBalance = parseFloat(currentWallet?.balance || "0");
    
    console.log(`💰 [PARTIAL] Wallet coverage analysis:`, {
      totalAmount,
      requestedWalletAmount,
      currentBalance,
      canCoverFull: currentBalance >= totalAmount
    });
    
    // 🎯 KEY FEATURE: اگر کیف پول کاملاً پوشش می‌دهد، به wallet-only تبدیل شود
    if (currentBalance >= totalAmount) {
      console.log(`✅ [WALLET UPGRADE] Hybrid order can be fully covered by wallet - converting to wallet-only payment`);
      console.log(`💰 [WALLET UPGRADE] Full coverage: ${totalAmount} <= ${currentBalance} (${((currentBalance/totalAmount)*100).toFixed(1)}% coverage)`);
      
      // برداشت کامل از کیف پول
      await this.deductFromWallet(orderData.customerId, totalAmount, customerOrder.orderNumber);
      
      // بروزرسانی وضعیت به پرداخت کامل کیف پول
      await db
        .update(orderManagement)
        .set({
          currentStatus: 'financial_reviewing',
          paymentMethod: 'wallet', // تغییر به کیف پول خالص
          paymentSourceLabel: 'ترکیبی به کیف پول کامل - پوشش 100%',
          walletAmountUsed: totalAmount.toString(),
          bankAmountPaid: '0' // هیچ پرداخت بانکی نیاز نیست
        })
        .where(eq(orderManagement.id, orderMgmt.id));
      
      console.log(`✅ [WALLET UPGRADE] Order ${customerOrder.orderNumber} upgraded to full wallet payment - ready for auto-approval`);
      
      // زمان‌بندی تایید خودکار فوری (کیف پول کامل)
      this.scheduleAutoApproval(orderMgmt.id, 5);
      return;
    }
    
    // ادامه فرآیند ترکیبی عادی (اگر کیف پول کامل پوشش نمی‌دهد)
    const walletAmount = Math.min(requestedWalletAmount, currentBalance); // استفاده از حداکثر موجود
    const bankAmount = totalAmount - walletAmount;
    
    console.log(`🔄 [PARTIAL] Continuing with hybrid payment:`, {
      walletAmount,
      bankAmount,
      coverage: ((walletAmount/totalAmount)*100).toFixed(1) + '%'
    });
    
    // بررسی موجودی کافی برای قسمت کیف پول
    if (walletAmount > 0) {
      if (currentBalance < walletAmount) {
        console.log(`❌ [PARTIAL WALLET] Insufficient balance for hybrid payment:`, {
          walletRequired: walletAmount,
          available: currentBalance,
          deficit: walletAmount - currentBalance
        });
        
        throw new Error(`موجودی کیف پول برای پرداخت ترکیبی کافی نیست. مورد نیاز: ${walletAmount.toLocaleString()} دینار، موجود: ${currentBalance.toLocaleString()} دینار`);
      }
      
      console.log(`✅ [PARTIAL WALLET] Sufficient balance for wallet portion:`, {
        walletRequired: walletAmount,
        available: currentBalance,
        bankAmount: bankAmount
      });
      
      // برداشت از کیف پول
      await this.deductFromWallet(orderData.customerId, walletAmount, customerOrder.orderNumber);
    }
    
    // بروزرسانی وضعیت ترکیبی عادی
    await db
      .update(orderManagement)
      .set({
        currentStatus: 'financial_reviewing',
        paymentSourceLabel: 'ترکیبی: کیف پول + بانک',
        walletAmountUsed: walletAmount.toString(),
        bankAmountPaid: bankAmount.toString()
      })
      .where(eq(orderManagement.id, orderMgmt.id));
    
    // زمان‌بندی تایید خودکار
    this.scheduleAutoApproval(orderMgmt.id, 5);
  }
  
  // 8. پردازش سفارش مهلت‌دار
  private async processGracePeriodOrder(customerOrder: any, orderMgmt: any) {
    console.log(`⏰ [GRACE PERIOD] Setting up 3-day grace period for order ${customerOrder.orderNumber}`);
    
    // بروزرسانی وضعیت
    await db
      .update(orderManagement)
      .set({
        currentStatus: 'payment_grace_period',
        paymentSourceLabel: 'سفارش مهلت دار 3 روزه'
      })
      .where(eq(orderManagement.id, orderMgmt.id));
    
    // زمان‌بندی یادآوری SMS و ایمیل
    this.scheduleGracePeriodReminders(customerOrder, orderMgmt);
  }
  
  // 9. برداشت از کیف پول با بررسی نهایی موجودی
  private async deductFromWallet(customerId: number, amount: number, orderNumber: string) {
    console.log(`💰 [WALLET DEDUCT] ${amount} IQD from customer ${customerId}`);
    
    // 🔒 FINAL SAFETY CHECK: بررسی نهایی موجودی قبل از برداشت
    const [wallet] = await db
      .select({ balance: customerWallets.balance })
      .from(customerWallets)
      .where(eq(customerWallets.customerId, customerId))
      .limit(1);
    
    const currentBalance = parseFloat(wallet?.balance || "0");
    
    if (currentBalance < amount) {
      console.error(`🚨 [WALLET SAFETY] CRITICAL: Attempted overdraft prevented!`, {
        customerId,
        orderNumber,
        attemptedDeduction: amount,
        currentBalance,
        deficit: amount - currentBalance
      });
      
      throw new Error(`خطای امنیتی: تلاش برای برداشت بیش از موجودی کیف پول. موجود: ${currentBalance.toLocaleString()}, درخواستی: ${amount.toLocaleString()}`);
    }
    
    // بروزرسانی موجودی با UPDATE امن
    const updateResult = await db
      .update(customerWallets)
      .set({
        balance: sql`${customerWallets.balance} - ${amount}`,
        updatedAt: new Date()
      })
      .where(and(
        eq(customerWallets.customerId, customerId),
        gte(customerWallets.balance, amount.toString()) // شرط اضافی برای جلوگیری از منفی شدن
      ))
      .returning({ newBalance: customerWallets.balance });
    
    if (updateResult.length === 0) {
      throw new Error(`خطا در بروزرسانی کیف پول: موجودی ناکافی یا مشکل در دیتابیس`);
    }
    
    console.log(`✅ [WALLET DEDUCT] Successfully deducted ${amount} IQD, new balance: ${updateResult[0].newBalance}`);
    
    // ثبت تراکنش
    await db
      .insert(walletTransactions)
      .values({
        walletId: sql`(SELECT id FROM customer_wallets WHERE customer_id = ${customerId})`,
        customerId,
        transactionType: 'debit',
        amount: amount.toString(),
        currency: 'IQD',
        balanceBefore: sql`(SELECT balance FROM customer_wallets WHERE customer_id = ${customerId}) + ${amount}`,
        balanceAfter: sql`(SELECT balance FROM customer_wallets WHERE customer_id = ${customerId})`,
        description: `برداشت برای سفارش ${orderNumber}`,
        referenceType: 'order',
        referenceId: parseInt(orderNumber.replace('M25', '')),
        status: 'completed'
      });
  }
  
  // 10. زمان‌بندی تایید خودکار 5 دقیقه‌ای
  private async scheduleAutoApproval(orderMgmtId: number, minutes: number) {
    console.log(`⏰ [AUTO APPROVAL] Scheduled for ${minutes} minutes`);
    
    // در پروژه واقعی از job queue استفاده می‌شود
    // اینجا تنها autoApprovalScheduledAt را به‌روزرسانی می‌کنیم
    await db
      .update(orderManagement)
      .set({
        autoApprovalScheduledAt: new Date(Date.now() + minutes * 60 * 1000),
        isAutoApprovalEnabled: true
      })
      .where(eq(orderManagement.id, orderMgmtId));
  }
  
  // 11. زمان‌بندی یادآوری مهلت‌دار
  private async scheduleGracePeriodReminders(customerOrder: any, orderMgmt: any) {
    console.log(`📅 [GRACE REMINDERS] Setting up reminders for order ${customerOrder.orderNumber}`);
    
    // در پروژه واقعی SMS و ایمیل یادآوری ارسال می‌شود
    // روز 1، 2، و 3 یادآوری
  }
  
  // 12. تایید اولیه تراکنش درگاه بانکی قبل از ایجاد سفارش
  private async verifyBankGatewayTransaction(orderData: any): Promise<boolean> {
    console.log(`🏦 [BANK VERIFICATION] Verifying transaction for customer ${orderData.customerId}`);
    
    try {
      // شبیه‌سازی تایید تراکنش با درگاه بانکی
      // در پروژه واقعی، اینجا API درگاه بانکی فراخوانی می‌شود
      
      // بررسی پارامترهای ضروری
      if (!orderData.bankTransactionId && !orderData.paymentReference) {
        console.log(`❌ [BANK VERIFICATION] Missing transaction reference`);
        return false;
      }
      
      // شبیه‌سازی فراخوانی API درگاه بانکی
      const transactionStatus = await this.callBankGatewayAPI(orderData);
      
      if (transactionStatus === 'SUCCESSFUL') {
        console.log(`✅ [BANK VERIFICATION] Transaction verified successfully`);
        return true;
      } else {
        console.log(`❌ [BANK VERIFICATION] Transaction failed or pending: ${transactionStatus}`);
        return false;
      }
      
    } catch (error) {
      console.error(`❌ [BANK VERIFICATION] Verification error:`, error);
      return false;
    }
  }
  
  // 13. تایید نهایی تراکنش درگاه بانکی
  private async confirmBankGatewayTransaction(customerOrder: any): Promise<boolean> {
    console.log(`🏦 [BANK CONFIRMATION] Final confirmation for order ${customerOrder.orderNumber}`);
    
    try {
      // شبیه‌سازی تایید نهایی تراکنش
      // در پروژه واقعی، اینجا تایید نهایی با درگاه انجام می‌شود
      
      const finalStatus = await this.callBankGatewayAPI({
        orderNumber: customerOrder.orderNumber,
        amount: customerOrder.totalAmount
      });
      
      return finalStatus === 'SUCCESSFUL';
      
    } catch (error) {
      console.error(`❌ [BANK CONFIRMATION] Final confirmation error:`, error);
      return false;
    }
  }
  
  // 14. فراخوانی API درگاه بانکی (شبیه‌سازی)
  private async callBankGatewayAPI(data: any): Promise<string> {
    console.log(`🏦 [BANK API] Calling bank gateway API with:`, data);
    
    // شبیه‌سازی تاخیر شبکه
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // شبیه‌سازی نرخ موفقیت 85% برای تراکنش‌های بانکی
    const random = Math.random();
    
    if (random > 0.85) {
      console.log(`❌ [BANK API] Transaction failed (${(random * 100).toFixed(1)}% - >85% threshold)`);
      return 'FAILED';
    } else if (random > 0.75) {
      console.log(`⏳ [BANK API] Transaction pending (${(random * 100).toFixed(1)}% - 75-85% range)`);
      return 'PENDING';
    } else {
      console.log(`✅ [BANK API] Transaction successful (${(random * 100).toFixed(1)}% - <75% threshold)`);
      return 'SUCCESSFUL';
    }
  }
  
  // 15. لغو سفارش ناموفق درگاه بانکی
  private async cancelFailedBankGatewayOrder(customerOrder: any, orderMgmt: any) {
    console.log(`🚫 [BANK CANCEL] Cancelling failed bank gateway order ${customerOrder.orderNumber}`);
    
    try {
      // لغو سفارش در customer_orders
      await db
        .update(customerOrders)
        .set({
          status: 'cancelled',
          paymentStatus: 'failed',
          updatedAt: new Date()
        })
        .where(eq(customerOrders.id, customerOrder.id));
      
      // لغو در order_management (اگر ایجاد شده باشد)
      if (orderMgmt) {
        await db
          .update(orderManagement)
          .set({
            currentStatus: 'cancelled',
            financialNotes: 'لغو به دلیل ناموفق بودن تراکنش بانکی',
            updatedAt: new Date()
          })
          .where(eq(orderManagement.id, orderMgmt.id));
      }
      
      console.log(`✅ [BANK CANCEL] Order ${customerOrder.orderNumber} cancelled successfully`);
      
    } catch (error) {
      console.error(`❌ [BANK CANCEL] Error cancelling order ${customerOrder.orderNumber}:`, error);
    }
  }
  
  // توابع کمکی
  private getInitialStatus(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'bank_gateway':
      case 'wallet':
      case 'wallet_partial':
        return 'confirmed';
      case 'grace_period':
        return 'pending_payment';
      default:
        return 'pending';
    }
  }
  
  private getInitialPaymentStatus(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'bank_gateway':
      case 'wallet':
      case 'wallet_partial':
        return 'processing';
      case 'grace_period':
        return 'pending';
      default:
        return 'pending';
    }
  }
  
  private getInitialManagementStatus(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'bank_gateway':
      case 'wallet':
      case 'wallet_partial':
        return 'financial_reviewing';
      case 'grace_period':
        return 'payment_grace_period';
      default:
        return 'pending';
    }
  }
  
  private getPaymentSourceLabel(paymentMethod: string): string {
    switch (paymentMethod) {
      case 'bank_gateway':
        return 'پرداخت توسط بانک';
      case 'wallet':
        return 'از طریق کیف پول';
      case 'wallet_partial':
        return 'ترکیبی: کیف پول + بانک';
      case 'grace_period':
        return 'سفارش مهلت دار 3 روزه';
      default:
        return 'نامشخص';
    }
  }
  
  private shouldAutoApprove(paymentMethod: string): boolean {
    return ['bank_gateway', 'wallet', 'wallet_partial'].includes(paymentMethod);
  }
}

// نمونه پیاده‌سازی
export const paymentWorkflow = new PaymentWorkflowService();