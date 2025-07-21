import { pool } from './db';

/**
 * Delivery Code Generator
 * Generates sequential delivery codes from 1111 to 9999, then cycles back to 1111
 * Format: 4-digit sequential number (1111, 1112, ..., 9999, 1111, ...)
 */

interface DeliveryCodeCounter {
  id: number;
  year: number;
  currentCode: number;
  createdAt: Date;
  updatedAt: Date;
}

const DELIVERY_CODE_START = 1111;
const DELIVERY_CODE_END = 9999;

/**
 * Get the current delivery code counter for the given year
 */
async function getDeliveryCodeCounter(year: number): Promise<DeliveryCodeCounter | null> {
  try {
    const result = await pool.query(
      'SELECT id, year, current_code, created_at, updated_at FROM delivery_code_counter WHERE year = $1',
      [year]
    );
    
    if (result.rows[0]) {
      console.log(`🔍 [DELIVERY-CODE] Found counter for year ${year}:`, result.rows[0]);
      return result.rows[0];
    } else {
      console.log(`🔍 [DELIVERY-CODE] No counter found for year ${year}`);
      return null;
    }
  } catch (error) {
    console.error('Error fetching delivery code counter:', error);
    throw error;
  }
}

/**
 * Initialize delivery code counter for new year
 */
async function initializeDeliveryCodeCounter(year: number): Promise<DeliveryCodeCounter> {
  try {
    const result = await pool.query(
      `INSERT INTO delivery_code_counter (year, current_code, created_at, updated_at) 
       VALUES ($1, $2, NOW(), NOW()) 
       RETURNING *`,
      [year, DELIVERY_CODE_START]
    );
    
    console.log(`🔢 [DELIVERY-CODE] Initialized delivery code counter for year ${year} starting at ${DELIVERY_CODE_START}`);
    return result.rows[0];
  } catch (error) {
    console.error('Error initializing delivery code counter:', error);
    throw error;
  }
}

/**
 * Generate next delivery code in sequence
 */
export async function generateDeliveryCode(): Promise<string> {
  try {
    const currentYear = new Date().getFullYear();
    
    // Check if counter exists for current year
    let counter = await getDeliveryCodeCounter(currentYear);
    
    if (!counter) {
      // Initialize counter if it doesn't exist
      counter = await initializeDeliveryCodeCounter(currentYear);
    }
    
    // Generate current code 
    const currentCodeValue = counter.currentCode || DELIVERY_CODE_START;
    const deliveryCode = String(currentCodeValue).padStart(4, '0');
    
    // Calculate next code (cycle back to DELIVERY_CODE_START after DELIVERY_CODE_END)
    let nextCode = parseInt(currentCodeValue.toString()) + 1;
    if (isNaN(nextCode) || nextCode > DELIVERY_CODE_END) {
      nextCode = DELIVERY_CODE_START;
      console.log(`🔄 [DELIVERY-CODE] Cycling back to ${DELIVERY_CODE_START} after reaching ${DELIVERY_CODE_END}`);
    }
    
    // Update counter with next code  
    console.log(`🔢 [DELIVERY-CODE] Updating counter from ${currentCodeValue} to ${nextCode} for year ${currentYear}`);
    
    await pool.query(
      'UPDATE delivery_code_counter SET current_code = $1, updated_at = NOW() WHERE year = $2',
      [nextCode, currentYear]
    );
    
    console.log(`🔢 [DELIVERY-CODE] Generated delivery code: ${deliveryCode} (next will be: ${nextCode})`);
    
    return deliveryCode;
  } catch (error) {
    console.error('Error generating delivery code:', error);
    throw error;
  }
}

/**
 * Get current delivery code counter status
 */
export async function getDeliveryCodeStatus(): Promise<{
  currentYear: number;
  currentCode: number;
  nextCode: number;
  totalGenerated: number;
}> {
  try {
    const currentYear = new Date().getFullYear();
    const counter = await getDeliveryCodeCounter(currentYear);
    
    if (!counter) {
      return {
        currentYear,
        currentCode: DELIVERY_CODE_START,
        nextCode: DELIVERY_CODE_START,
        totalGenerated: 0
      };
    }
    
    const nextCode = counter.currentCode > DELIVERY_CODE_END ? DELIVERY_CODE_START : counter.currentCode + 1;
    const totalGenerated = counter.currentCode - DELIVERY_CODE_START + 1;
    
    return {
      currentYear,
      currentCode: counter.currentCode,
      nextCode,
      totalGenerated
    };
  } catch (error) {
    console.error('Error getting delivery code status:', error);
    throw error;
  }
}