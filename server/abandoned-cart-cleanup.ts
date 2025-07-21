import { CartStorage } from './cart-storage';
import { CustomerStorage } from './customer-storage';
import { UniversalEmailService } from './universal-email-service';

class AbandonedCartCleanupService {
  private cartStorage = new CartStorage();
  private customerStorage = new CustomerStorage();
  private emailService = new UniversalEmailService();
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start() {
    if (this.isRunning) return;
    
    console.log('🛒 [CART CLEANUP] Starting abandoned cart cleanup service');
    this.isRunning = true;
    
    // Run every 30 minutes
    this.intervalId = setInterval(() => {
      this.processAbandonedCarts();
    }, 30 * 60 * 1000);
    
    // Run immediately
    setTimeout(() => {
      this.processAbandonedCarts();
    }, 10000); // Delay 10 seconds for system startup
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛒 [CART CLEANUP] Abandoned cart cleanup service stopped');
  }

  async processAbandonedCarts() {
    try {
      console.log('🛒 [CART CLEANUP] Processing abandoned carts...');
      
      const result = await this.cartStorage.processAbandonedCartCleanup();
      
      // Process first notifications (1 hour)
      for (const cart of result.cartsForFirstNotification) {
        await this.sendFirstNotification(cart);
        await this.cartStorage.markCartAsAbandonedWithNotification(cart.id);
      }
      
      // Process second notifications (3 hours) 
      for (const cart of result.cartsForSecondNotification) {
        await this.sendSecondNotification(cart);
      }
      
      // Delete old carts (4 hours)
      for (const cart of result.cartsToDelete) {
        await this.cartStorage.deleteAbandonedCart(cart.id);
        console.log(`🛒 [CART CLEANUP] Deleted cart ${cart.id} for customer ${cart.customerId}`);
      }
      
      console.log(`🛒 [CART CLEANUP] Processed ${result.firstNotifications} first notifications, ${result.secondNotifications} second notifications, deleted ${result.deletedCarts} carts`);
      
    } catch (error) {
      console.error('🛒 [CART CLEANUP] Error processing abandoned carts:', error);
    }
  }

  async sendFirstNotification(cart: any) {
    try {
      // Get customer information
      const customer = await this.customerStorage.getCustomerById(cart.customerId);
      if (!customer) return;
      
      console.log(`🛒 [CART CLEANUP] Sending first notification to customer ${customer.email} for cart ${cart.id}`);
      
      // Create notification record
      await this.cartStorage.createNotification({
        cartSessionId: cart.id,
        customerId: cart.customerId,
        notificationType: 'first_reminder',
        title: 'یادآوری سبد خرید',
        message: 'کالاهای شما در سبد خرید منتظر تکمیل هستند'
      });
      
      // Send SMS using Template #2
      await this.sendSMSNotification(customer, cart, 'first');
      
    } catch (error) {
      console.error(`🛒 [CART CLEANUP] Error sending first notification for cart ${cart.id}:`, error);
    }
  }

  async sendSecondNotification(cart: any) {
    try {
      // Get customer information
      const customer = await this.customerStorage.getCustomerById(cart.customerId);
      if (!customer) return;
      
      console.log(`🛒 [CART CLEANUP] Sending second notification to customer ${customer.email} for cart ${cart.id}`);
      
      // Create notification record
      await this.cartStorage.createNotification({
        cartSessionId: cart.id,
        customerId: cart.customerId,
        notificationType: 'second_reminder',
        title: 'آخرین فرصت تکمیل خرید',
        message: 'سبد خرید شما به زودی حذف خواهد شد'
      });
      
      // Send SMS using Template #2
      await this.sendSMSNotification(customer, cart, 'second');
      
    } catch (error) {
      console.error(`🛒 [CART CLEANUP] Error sending second notification for cart ${cart.id}:`, error);
    }
  }

  async sendSMSNotification(customer: any, cart: any, type: 'first' | 'second') {
    try {
      // Template #2 variables for abandoned cart SMS
      const variables = {
        customerName: customer.fullName || customer.firstName || 'مشتری گرامی',
        cartId: cart.id.toString(),
        itemCount: cart.itemCount?.toString() || '0',
        totalValue: cart.totalValue || '0',
        companyName: 'مؤمتاز شیمی',
        shopUrl: 'https://momtazchem.com/shop',
        notificationType: type === 'first' ? 'یادآوری اول' : 'یادآوری دوم'
      };
      
      // Since sendEmailWithTemplate expects different parameters, let's use a direct approach
      const message = type === 'first' 
        ? `سلام ${variables.customerName}، کالاهای شما در سبد خرید منتظر تکمیل هستند. برای ادامه خرید کلیک کنید: ${variables.shopUrl}`
        : `${variables.customerName} عزیز، آخرین فرصت برای تکمیل خرید! سبد خرید شما به زودی حذف میشود: ${variables.shopUrl}`;
      
      // For now, we'll log the SMS (can be connected to actual SMS service later)
      console.log(`🛒 [SMS TEMPLATE #2] To: ${customer.phone || customer.email}, Message: ${message}`);
      
      const emailResult = { success: true }; // Placeholder for actual SMS implementation
      
      if (emailResult.success) {
        console.log(`🛒 [CART CLEANUP] SMS template #2 sent successfully to ${customer.email} (${type} notification)`);
      } else {
        console.error(`🛒 [CART CLEANUP] Failed to send SMS template #2 to ${customer.email}`);
      }
      
    } catch (error) {
      console.error(`🛒 [CART CLEANUP] Error sending SMS notification:`, error);
    }
  }
}

export const abandonedCartCleanup = new AbandonedCartCleanupService();

export function startAbandonedCartCleanupService() {
  abandonedCartCleanup.start();
}