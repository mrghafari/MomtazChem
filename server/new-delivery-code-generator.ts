import { pool } from './db';

const DELIVERY_CODE_START = 1111;
const DELIVERY_CODE_END = 9999;

interface DeliveryCodeCounter {
  id: number;
  year: number;
  currentCode: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generate next sequential delivery code (1111-9999, then cycles back to 1111)
 */
export async function generateSequentialDeliveryCode(): Promise<string> {
  try {
    const currentYear = new Date().getFullYear();
    
    // Get or create counter for current year
    let counterResult = await pool.query(
      'SELECT * FROM delivery_code_counter WHERE year = $1',
      [currentYear]
    );
    
    let currentCode: number;
    
    if (counterResult.rows.length === 0) {
      // Create new counter starting at 1111
      await pool.query(
        'INSERT INTO delivery_code_counter (year, current_code) VALUES ($1, $2)',
        [currentYear, DELIVERY_CODE_START]
      );
      currentCode = DELIVERY_CODE_START;
    } else {
      currentCode = counterResult.rows[0].current_code;
    }
    
    // Calculate next code (cycle back if needed)
    let nextCode = currentCode + 1;
    if (nextCode > DELIVERY_CODE_END) {
      nextCode = DELIVERY_CODE_START;
    }
    
    // Update counter to next code first
    await pool.query(
      'UPDATE delivery_code_counter SET current_code = $1, updated_at = NOW() WHERE year = $2',
      [nextCode, currentYear]
    );
    
    // Use current code for this delivery
    const deliveryCode = String(currentCode).padStart(4, '0');
    
    console.log(`🔢 [DELIVERY-CODE] Generated: ${deliveryCode}, next will be: ${String(nextCode).padStart(4, '0')}`);
    
    return deliveryCode;
    
  } catch (error) {
    console.error('Error generating sequential delivery code:', error);
    throw error;
  }
}