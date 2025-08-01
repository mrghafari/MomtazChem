// Manual test for incomplete payment cleaner
import { incompletePaymentCleaner } from './incomplete-payment-cleaner';

console.log('🧪 [TEST] Starting manual test of incomplete payment cleaner...');

// Process incomplete payments manually
incompletePaymentCleaner.processIncompletePayments()
  .then(() => {
    console.log('✅ [TEST] Manual test completed');
  })
  .catch((error) => {
    console.error('❌ [TEST] Manual test failed:', error);
  });