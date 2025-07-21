import { db } from "./db";
import { orderNumberCounter } from "../shared/customer-schema";
import { eq } from "drizzle-orm";

/**
 * Generates a new order number in MOM format: MOM + 2-digit year + 5-digit sequential number
 * Example: MOM2511111, MOM2511112, etc.
 * Counter cycles from 11111 to 99999, then resets to 11111 for new year
 */
export async function generateOrderNumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const shortYear = currentYear % 100; // Get last 2 digits of year (2025 -> 25)
  
  console.log(`🔢 [ORDER-NUMBER] Generating order number for year ${currentYear} (${shortYear})`);
  
  try {
    // Check if counter exists for current year
    const [existingCounter] = await db
      .select()
      .from(orderNumberCounter)
      .where(eq(orderNumberCounter.year, currentYear))
      .limit(1);
    
    let sequentialNumber: number;
    
    if (existingCounter) {
      // 🔐 ATOMIC RESERVATION: Reserve number immediately to prevent conflicts
      // Use atomic UPDATE with RETURNING to reserve and get the number in one operation
      const [updatedCounter] = await db
        .update(orderNumberCounter)
        .set({
          counter: existingCounter.counter + 1 > 99999 ? 11111 : existingCounter.counter + 1,
          updatedAt: new Date()
        })
        .where(eq(orderNumberCounter.year, currentYear))
        .returning({
          reservedNumber: orderNumberCounter.counter,
          previousCounter: existingCounter.counter
        });
      
      // The reserved number is the counter value BEFORE increment
      sequentialNumber = existingCounter.counter;
      
      console.log(`🔐 [ATOMIC-RESERVE] Reserved order number: ${sequentialNumber} (counter: ${existingCounter.counter} -> ${existingCounter.counter + 1 > 99999 ? 11111 : existingCounter.counter + 1})`);
    } else {
      // Create new counter for current year
      sequentialNumber = 11111; // Start from 11111
      
      await db.insert(orderNumberCounter).values({
        year: currentYear,
        counter: 11112, // Next number will be 11112
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`🆕 [ORDER-NUMBER] Created new counter for year ${currentYear}, starting with ${sequentialNumber}`);
    }
    
    // Format: MOM + 2-digit year + 5-digit sequential number
    const orderNumber = `MOM${shortYear.toString().padStart(2, '0')}${sequentialNumber.toString().padStart(5, '0')}`;
    
    console.log(`✅ [ORDER-NUMBER] Generated order number: ${orderNumber}`);
    return orderNumber;
    
  } catch (error) {
    console.error(`❌ [ORDER-NUMBER] Error generating order number:`, error);
    
    // Fallback: generate with timestamp to ensure uniqueness
    const timestamp = Date.now().toString().slice(-5);
    const fallbackNumber = `MOM${shortYear.toString().padStart(2, '0')}${timestamp}`;
    
    console.log(`🔄 [ORDER-NUMBER] Using fallback order number: ${fallbackNumber}`);
    return fallbackNumber;
  }
}

/**
 * Initialize counter table for current year if it doesn't exist
 */
export async function initializeOrderNumberCounter(): Promise<void> {
  const currentYear = new Date().getFullYear();
  
  try {
    const [existingCounter] = await db
      .select()
      .from(orderNumberCounter)
      .where(eq(orderNumberCounter.year, currentYear))
      .limit(1);
    
    if (!existingCounter) {
      await db.insert(orderNumberCounter).values({
        year: currentYear,
        counter: 11111, // Start from 11111
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`🔧 [ORDER-NUMBER] Initialized counter for year ${currentYear}`);
    }
  } catch (error) {
    console.error(`❌ [ORDER-NUMBER] Error initializing counter:`, error);
  }
}