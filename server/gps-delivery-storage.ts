import { eq, and, desc, asc, gte, lte, sql, between } from "drizzle-orm";
import { db } from "./db";
import { 
  gpsDeliveryConfirmations, 
  gpsDeliveryAnalytics,
  GpsDeliveryConfirmation,
  InsertGpsDeliveryConfirmation,
  GpsDeliveryAnalytics,
  InsertGpsDeliveryAnalytics,
  deliveryZones,
  deliveryMetrics
} from "../shared/gps-delivery-schema";

export interface IGpsDeliveryStorage {
  // GPS Delivery Confirmations
  recordGpsDelivery(data: InsertGpsDeliveryConfirmation): Promise<GpsDeliveryConfirmation>;
  getGpsDeliveryById(id: number): Promise<GpsDeliveryConfirmation | null>;
  getGpsDeliveriesByOrder(customerOrderId: number): Promise<GpsDeliveryConfirmation[]>;
  getGpsDeliveriesByDeliveryPerson(deliveryPersonPhone: string): Promise<GpsDeliveryConfirmation[]>;
  getGpsDeliveriesByLocation(country: string, city: string, startDate?: Date, endDate?: Date): Promise<GpsDeliveryConfirmation[]>;
  
  // Analytics
  generateDailyAnalytics(date: Date): Promise<void>;
  getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<GpsDeliveryAnalytics[]>;
  getAnalyticsByLocation(country: string, city?: string): Promise<GpsDeliveryAnalytics[]>;
  getDeliveryPerformanceStats(period: number): Promise<any>;
  getGeographicCoverage(country?: string): Promise<any>;
  getDeliveryPersonStats(deliveryPersonPhone: string, period: number): Promise<any>;
  
  // Location Analysis
  validateDeliveryLocation(latitude: number, longitude: number, customerAddress: string): Promise<any>;
  getDeliveryHeatmapData(country: string, city?: string): Promise<any>;
  getDeliveryRouteAnalysis(deliveryPersonPhone: string, date: Date): Promise<any>;
}

export class GpsDeliveryStorage implements IGpsDeliveryStorage {
  
  // ===========================================
  // GPS DELIVERY CONFIRMATIONS
  // ===========================================
  
  async recordGpsDelivery(data: InsertGpsDeliveryConfirmation): Promise<GpsDeliveryConfirmation> {
    try {
      console.log('📍 [GPS] Recording GPS delivery confirmation:', {
        orderId: data.customerOrderId,
        location: `${data.latitude}, ${data.longitude}`,
        deliveryPerson: data.deliveryPersonName,
        accuracy: data.accuracy
      });
      
      // Validate GPS coordinates
      const lat = parseFloat(data.latitude.toString());
      const lng = parseFloat(data.longitude.toString());
      
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new Error('Invalid GPS coordinates');
      }
      
      // Try to detect address from coordinates (basic implementation)
      const detectedLocation = await this.detectAddressFromCoordinates(lat, lng);
      
      const enrichedData = {
        ...data,
        detectedAddress: detectedLocation.address,
        country: detectedLocation.country,
        city: detectedLocation.city,
        region: detectedLocation.region,
        neighborhood: detectedLocation.neighborhood,
        addressMatched: await this.checkAddressMatch(data.customerAddress || '', detectedLocation.address),
        distanceFromCustomer: detectedLocation.distance || "0",
      };
      
      const [gpsDelivery] = await db
        .insert(gpsDeliveryConfirmations)
        .values(enrichedData)
        .returning();
      
      console.log('✅ [GPS] GPS delivery confirmation recorded successfully:', gpsDelivery.id);
      
      // Trigger analytics update (async)
      this.generateDailyAnalytics(new Date()).catch(console.error);
      
      return gpsDelivery;
    } catch (error) {
      console.error('❌ [GPS] Failed to record GPS delivery:', error);
      throw error;
    }
  }
  
  async getGpsDeliveryById(id: number): Promise<GpsDeliveryConfirmation | null> {
    const [delivery] = await db
      .select()
      .from(gpsDeliveryConfirmations)
      .where(eq(gpsDeliveryConfirmations.id, id));
    
    return delivery || null;
  }
  
  async getGpsDeliveriesByOrder(customerOrderId: number): Promise<GpsDeliveryConfirmation[]> {
    return await db
      .select()
      .from(gpsDeliveryConfirmations)
      .where(eq(gpsDeliveryConfirmations.customerOrderId, customerOrderId))
      .orderBy(desc(gpsDeliveryConfirmations.verificationTime));
  }
  
  async getGpsDeliveriesByDeliveryPerson(deliveryPersonPhone: string): Promise<GpsDeliveryConfirmation[]> {
    return await db
      .select()
      .from(gpsDeliveryConfirmations)
      .where(eq(gpsDeliveryConfirmations.deliveryPersonPhone, deliveryPersonPhone))
      .orderBy(desc(gpsDeliveryConfirmations.verificationTime));
  }
  
  async getGpsDeliveriesByLocation(
    country: string, 
    city: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<GpsDeliveryConfirmation[]> {
    let query = db
      .select()
      .from(gpsDeliveryConfirmations)
      .where(and(
        eq(gpsDeliveryConfirmations.country, country),
        eq(gpsDeliveryConfirmations.city, city)
      ));
    
    if (startDate && endDate) {
      query = query.where(
        between(gpsDeliveryConfirmations.verificationTime, startDate, endDate)
      );
    }
    
    return await query.orderBy(desc(gpsDeliveryConfirmations.verificationTime));
  }
  
  // ===========================================
  // ANALYTICS
  // ===========================================
  
  async generateDailyAnalytics(date: Date): Promise<void> {
    try {
      console.log('📊 [GPS-ANALYTICS] Generating daily analytics for:', date.toISOString().split('T')[0]);
      
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // Get all deliveries for this day
      const deliveries = await db
        .select()
        .from(gpsDeliveryConfirmations)
        .where(between(gpsDeliveryConfirmations.verificationTime, startOfDay, endOfDay));
      
      if (deliveries.length === 0) {
        console.log('📊 [GPS-ANALYTICS] No deliveries found for this date');
        return;
      }
      
      // Group by location
      const locationGroups = deliveries.reduce((acc, delivery) => {
        const key = `${delivery.country}-${delivery.city}`;
        if (!acc[key]) {
          acc[key] = {
            country: delivery.country || 'Unknown',
            city: delivery.city || 'Unknown',
            region: delivery.region || 'Unknown',
            deliveries: []
          };
        }
        acc[key].deliveries.push(delivery);
        return acc;
      }, {} as Record<string, any>);
      
      // Generate analytics for each location
      for (const [key, group] of Object.entries(locationGroups)) {
        await this.generateLocationAnalytics(date, group.country, group.city, group.region, group.deliveries);
      }
      
      console.log('✅ [GPS-ANALYTICS] Daily analytics generated successfully');
    } catch (error) {
      console.error('❌ [GPS-ANALYTICS] Failed to generate daily analytics:', error);
    }
  }
  
  private async generateLocationAnalytics(
    date: Date, 
    country: string, 
    city: string, 
    region: string, 
    deliveries: GpsDeliveryConfirmation[]
  ): Promise<void> {
    const totalDeliveries = deliveries.length;
    const successfulDeliveries = deliveries.filter(d => d.addressMatched).length;
    const addressMatchedDeliveries = deliveries.filter(d => d.addressMatched).length;
    
    // Calculate averages
    const totalAccuracy = deliveries.reduce((sum, d) => sum + parseFloat(d.accuracy?.toString() || '0'), 0);
    const averageAccuracy = totalAccuracy / totalDeliveries;
    
    const totalDistance = deliveries.reduce((sum, d) => sum + parseFloat(d.distanceFromCustomer?.toString() || '0'), 0);
    const averageDistanceFromCustomer = totalDistance / totalDeliveries;
    
    // Calculate geographic boundaries
    const latitudes = deliveries.map(d => parseFloat(d.latitude.toString()));
    const longitudes = deliveries.map(d => parseFloat(d.longitude.toString()));
    
    const northeastLat = Math.max(...latitudes);
    const southwestLat = Math.min(...latitudes);
    const northeastLng = Math.max(...longitudes);
    const southwestLng = Math.min(...longitudes);
    
    // Calculate coverage area (approximate)
    const latDiff = northeastLat - southwestLat;
    const lngDiff = northeastLng - southwestLng;
    const coverageAreaKm2 = latDiff * lngDiff * 111 * 111; // Rough conversion to km²
    
    // Unique delivery persons and neighborhoods
    const uniqueDeliveryPersons = new Set(deliveries.map(d => d.deliveryPersonPhone)).size;
    const uniqueNeighborhoods = new Set(deliveries.map(d => d.neighborhood).filter(Boolean)).size;
    
    // Performance metrics
    const deliverySuccessRate = (successfulDeliveries / totalDeliveries) * 100;
    const averageDeliveriesPerPerson = totalDeliveries / uniqueDeliveryPersons;
    
    // Issues
    const totalIssuesReported = deliveries.filter(d => d.deliveryIssues).length;
    
    const analyticsData: InsertGpsDeliveryAnalytics = {
      analysisDate: date,
      country,
      city,
      region,
      totalDeliveries,
      successfulDeliveries,
      addressMatchedDeliveries,
      averageAccuracy: averageAccuracy.toString(),
      averageDistanceFromCustomer: averageDistanceFromCustomer.toString(),
      coverageAreaKm2: coverageAreaKm2.toString(),
      uniqueNeighborhoods,
      northeastLat: northeastLat.toString(),
      northeastLng: northeastLng.toString(),
      southwestLat: southwestLat.toString(),
      southwestLng: southwestLng.toString(),
      uniqueDeliveryPersons,
      averageDeliveriesPerPerson: averageDeliveriesPerPerson.toString(),
      deliverySuccessRate: deliverySuccessRate.toString(),
      totalIssuesReported,
    };
    
    // Check if analytics already exist for this date/location
    const existing = await db
      .select()
      .from(gpsDeliveryAnalytics)
      .where(and(
        eq(gpsDeliveryAnalytics.analysisDate, date),
        eq(gpsDeliveryAnalytics.country, country),
        eq(gpsDeliveryAnalytics.city, city)
      ));
    
    if (existing.length > 0) {
      // Update existing record
      await db
        .update(gpsDeliveryAnalytics)
        .set({ ...analyticsData, updatedAt: new Date() })
        .where(eq(gpsDeliveryAnalytics.id, existing[0].id));
    } else {
      // Insert new record
      await db
        .insert(gpsDeliveryAnalytics)
        .values(analyticsData);
    }
  }
  
  async getAnalyticsByDateRange(startDate: Date, endDate: Date): Promise<GpsDeliveryAnalytics[]> {
    return await db
      .select()
      .from(gpsDeliveryAnalytics)
      .where(between(gpsDeliveryAnalytics.analysisDate, startDate, endDate))
      .orderBy(desc(gpsDeliveryAnalytics.analysisDate));
  }
  
  async getAnalyticsByLocation(country: string, city?: string): Promise<GpsDeliveryAnalytics[]> {
    let whereClause = eq(gpsDeliveryAnalytics.country, country);
    
    if (city) {
      whereClause = and(whereClause, eq(gpsDeliveryAnalytics.city, city));
    }
    
    return await db
      .select()
      .from(gpsDeliveryAnalytics)
      .where(whereClause)
      .orderBy(desc(gpsDeliveryAnalytics.analysisDate));
  }
  
  async getDeliveryPerformanceStats(period: number): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    const deliveries = await db
      .select()
      .from(gpsDeliveryConfirmations)
      .where(between(gpsDeliveryConfirmations.verificationTime, startDate, endDate));
    
    const analytics = await this.getAnalyticsByDateRange(startDate, endDate);
    
    return {
      totalDeliveries: deliveries.length,
      successfulDeliveries: deliveries.filter(d => d.addressMatched).length,
      averageAccuracy: deliveries.reduce((sum, d) => sum + parseFloat(d.accuracy?.toString() || '0'), 0) / deliveries.length,
      coverageCountries: new Set(deliveries.map(d => d.country)).size,
      coverageCities: new Set(deliveries.map(d => d.city)).size,
      uniqueDeliveryPersons: new Set(deliveries.map(d => d.deliveryPersonPhone)).size,
      analytics: analytics
    };
  }
  
  async getGeographicCoverage(country?: string): Promise<any> {
    let query = db.select().from(gpsDeliveryConfirmations);
    
    if (country) {
      query = query.where(eq(gpsDeliveryConfirmations.country, country));
    }
    
    const deliveries = await query;
    
    // Group by location
    const locationStats = deliveries.reduce((acc, delivery) => {
      const key = `${delivery.country}-${delivery.city}`;
      if (!acc[key]) {
        acc[key] = {
          country: delivery.country,
          city: delivery.city,
          region: delivery.region,
          deliveries: 0,
          coordinates: []
        };
      }
      acc[key].deliveries++;
      acc[key].coordinates.push([parseFloat(delivery.latitude.toString()), parseFloat(delivery.longitude.toString())]);
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(locationStats);
  }
  
  async getDeliveryPersonStats(deliveryPersonPhone: string, period: number): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    const deliveries = await db
      .select()
      .from(gpsDeliveryConfirmations)
      .where(and(
        eq(gpsDeliveryConfirmations.deliveryPersonPhone, deliveryPersonPhone),
        between(gpsDeliveryConfirmations.verificationTime, startDate, endDate)
      ));
    
    return {
      deliveryPersonPhone,
      totalDeliveries: deliveries.length,
      successfulDeliveries: deliveries.filter(d => d.addressMatched).length,
      averageAccuracy: deliveries.reduce((sum, d) => sum + parseFloat(d.accuracy?.toString() || '0'), 0) / deliveries.length,
      uniqueLocations: new Set(deliveries.map(d => `${d.city}, ${d.country}`)).size,
      deliveries: deliveries
    };
  }
  
  // ===========================================
  // LOCATION ANALYSIS
  // ===========================================
  
  async validateDeliveryLocation(latitude: number, longitude: number, customerAddress: string): Promise<any> {
    // Basic validation - in production you'd use a geocoding service
    const detectedLocation = await this.detectAddressFromCoordinates(latitude, longitude);
    const addressMatch = await this.checkAddressMatch(customerAddress, detectedLocation.address);
    
    return {
      isValid: addressMatch,
      detectedAddress: detectedLocation.address,
      confidence: detectedLocation.confidence,
      distance: detectedLocation.distance
    };
  }
  
  async getDeliveryHeatmapData(country: string, city?: string): Promise<any> {
    let whereClause = eq(gpsDeliveryConfirmations.country, country);
    
    if (city) {
      whereClause = and(whereClause, eq(gpsDeliveryConfirmations.city, city));
    }
    
    const deliveries = await db
      .select({
        latitude: gpsDeliveryConfirmations.latitude,
        longitude: gpsDeliveryConfirmations.longitude,
        addressMatched: gpsDeliveryConfirmations.addressMatched,
        verificationTime: gpsDeliveryConfirmations.verificationTime,
      })
      .from(gpsDeliveryConfirmations)
      .where(whereClause);
    
    return deliveries.map(d => ({
      lat: parseFloat(d.latitude.toString()),
      lng: parseFloat(d.longitude.toString()),
      weight: d.addressMatched ? 1 : 0.5,
      timestamp: d.verificationTime
    }));
  }
  
  async getDeliveryRouteAnalysis(deliveryPersonPhone: string, date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const deliveries = await db
      .select()
      .from(gpsDeliveryConfirmations)
      .where(and(
        eq(gpsDeliveryConfirmations.deliveryPersonPhone, deliveryPersonPhone),
        between(gpsDeliveryConfirmations.verificationTime, startOfDay, endOfDay)
      ))
      .orderBy(asc(gpsDeliveryConfirmations.verificationTime));
    
    // Calculate route efficiency
    let totalDistance = 0;
    const routes = [];
    
    for (let i = 0; i < deliveries.length - 1; i++) {
      const current = deliveries[i];
      const next = deliveries[i + 1];
      
      const distance = this.calculateDistance(
        parseFloat(current.latitude.toString()),
        parseFloat(current.longitude.toString()),
        parseFloat(next.latitude.toString()),
        parseFloat(next.longitude.toString())
      );
      
      totalDistance += distance;
      routes.push({
        from: current,
        to: next,
        distance,
        duration: (next.verificationTime.getTime() - current.verificationTime.getTime()) / 1000 / 60 // minutes
      });
    }
    
    return {
      deliveryPersonPhone,
      date: date.toISOString().split('T')[0],
      totalDeliveries: deliveries.length,
      totalDistanceKm: totalDistance,
      averageDistancePerDelivery: totalDistance / deliveries.length,
      routes,
      deliveries
    };
  }
  
  // ===========================================
  // HELPER METHODS
  // ===========================================
  
  private async detectAddressFromCoordinates(latitude: number, longitude: number): Promise<any> {
    // In production, you'd use a reverse geocoding service like Google Maps API
    // For now, return basic location based on known coordinates
    
    // Baghdad area
    if (latitude >= 33.2 && latitude <= 33.5 && longitude >= 44.2 && longitude <= 44.6) {
      return {
        address: 'Baghdad, Iraq',
        country: 'Iraq',
        city: 'Baghdad',
        region: 'Baghdad',
        neighborhood: 'Central Baghdad',
        confidence: 0.8,
        distance: 0
      };
    }
    
    // Erbil area
    if (latitude >= 36.1 && latitude <= 36.3 && longitude >= 43.9 && longitude <= 44.2) {
      return {
        address: 'Erbil, Iraq',
        country: 'Iraq',
        city: 'Erbil',
        region: 'Kurdistan',
        neighborhood: 'Central Erbil',
        confidence: 0.8,
        distance: 0
      };
    }
    
    // Tehran area
    if (latitude >= 35.6 && latitude <= 35.8 && longitude >= 51.3 && longitude <= 51.5) {
      return {
        address: 'Tehran, Iran',
        country: 'Iran',
        city: 'Tehran',
        region: 'Tehran Province',
        neighborhood: 'Central Tehran',
        confidence: 0.8,
        distance: 0
      };
    }
    
    return {
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
      neighborhood: 'Unknown',
      confidence: 0.3,
      distance: 0
    };
  }
  
  private async checkAddressMatch(customerAddress: string, detectedAddress: string): Promise<boolean> {
    if (!customerAddress || !detectedAddress) return false;
    
    const customer = customerAddress.toLowerCase();
    const detected = detectedAddress.toLowerCase();
    
    // Check for city matches
    const cities = ['baghdad', 'erbil', 'tehran', 'basra', 'بغداد', 'اربیل', 'تهران', 'بصره'];
    
    for (const city of cities) {
      if (customer.includes(city) && detected.includes(city)) {
        return true;
      }
    }
    
    return false;
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export const gpsDeliveryStorage = new GpsDeliveryStorage();