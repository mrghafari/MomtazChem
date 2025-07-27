import { db } from './db';
import { eq, and, gte, lte } from 'drizzle-orm';
import { iraqiCities } from '@shared/logistics-schema';

export interface SmartVehicleCalculationResult {
  success: boolean;
  selectedVehicle?: {
    id?: number;
    name: string;
    type: string;
    capacity: string;
    pricePerKm: number;
  };
  totalCost?: number;
  distance?: number;
  deliveryTime?: string;
  message?: string;
  error?: string;
}

export class SmartVehicleCalculator {
  
  /**
   * محاسبه هزینه حمل با انتخاب هوشمند خودرو
   */
  async calculateShippingCost(
    weight: number, 
    destinationCity: string, 
    orderData?: any
  ): Promise<SmartVehicleCalculationResult> {
    
    try {
      console.log('🚚 [SMART CALC] Starting calculation:', { weight, destinationCity });

      // 1. Find destination city in database
      const cityQuery = await db.select()
        .from(iraqiCities)
        .where(eq(iraqiCities.nameArabic, destinationCity))
        .limit(1);

      if (cityQuery.length === 0) {
        console.log('🚚 [SMART CALC] City not found:', destinationCity);
        return {
          success: false,
          error: `شهر مقصد "${destinationCity}" یافت نشد`
        };
      }

      const city = cityQuery[0];
      const distance = city.distanceFromErbilKm || 0;
      
      console.log('🚚 [SMART CALC] City found:', {
        name: city.nameArabic,
        distance: distance + ' km'
      });

      // 2. Smart vehicle selection based on weight
      let selectedVehicle;
      let pricePerKm = 500; // Default price per km in IQD
      let deliveryTime = '24-48 ساعت';

      if (weight <= 25) {
        selectedVehicle = {
          name: 'وانت کوچک - پیکان',
          type: 'pickup_small',
          capacity: 'تا 25 کیلوگرم',
          pricePerKm: 400
        };
        pricePerKm = 400;
        deliveryTime = '12-24 ساعت';
      } else if (weight <= 100) {
        selectedVehicle = {
          name: 'وانت متوسط - نیسان',
          type: 'pickup_medium',
          capacity: 'تا 100 کیلوگرم',
          pricePerKm: 500
        };
        pricePerKm = 500;
        deliveryTime = '24-36 ساعت';
      } else if (weight <= 500) {
        selectedVehicle = {
          name: 'کامیونت - ایسوزو',
          type: 'truck_small',
          capacity: 'تا 500 کیلوگرم',
          pricePerKm: 700
        };
        pricePerKm = 700;
        deliveryTime = '24-48 ساعت';
      } else {
        selectedVehicle = {
          name: 'کامیون بزرگ - هیوو',
          type: 'truck_large',
          capacity: 'بیش از 500 کیلوگرم',
          pricePerKm: 1000
        };
        pricePerKm = 1000;
        deliveryTime = '48-72 ساعت';
      }

      // 3. Calculate total cost
      const baseCost = distance * pricePerKm;
      const weightSurcharge = weight > 50 ? (weight - 50) * 10 : 0;
      const totalCost = Math.round(baseCost + weightSurcharge);

      console.log('🚚 [SMART CALC] Calculation complete:', {
        vehicle: selectedVehicle.name,
        distance: distance + ' km',
        baseCost,
        weightSurcharge,
        totalCost: totalCost + ' IQD'
      });

      return {
        success: true,
        selectedVehicle,
        totalCost,
        distance,
        deliveryTime,
        message: `انتخاب هوشمند: ${selectedVehicle.name} برای ${weight} کیلوگرم به ${destinationCity}`
      };

    } catch (error) {
      console.error('🚚 [SMART CALC] Error:', error);
      return {
        success: false,
        error: 'خطا در محاسبه انتخاب خودروی هوشمند'
      };
    }
  }

  /**
   * دریافت لیست شهرهای موجود برای محاسبه
   */
  async getAvailableCities(): Promise<any[]> {
    try {
      const cities = await db.select({
        id: iraqiCities.id,
        nameArabic: iraqiCities.nameArabic,
        nameEnglish: iraqiCities.nameEnglish,
        distanceFromErbil: iraqiCities.distanceFromErbilKm
      })
      .from(iraqiCities)
      .where(eq(iraqiCities.isActive, true));

      return cities;
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  }

  /**
   * محاسبه هزینه برای چندین مقصد
   */
  async calculateMultipleDestinations(
    weight: number, 
    destinations: string[]
  ): Promise<SmartVehicleCalculationResult[]> {
    const results = [];
    
    for (const destination of destinations) {
      const result = await this.calculateShippingCost(weight, destination);
      results.push(result);
    }

    return results;
  }
}

// Export singleton instance
export const smartVehicleCalculator = new SmartVehicleCalculator();