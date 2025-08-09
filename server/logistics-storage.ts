import { eq, and, desc, asc, gte, lte, sql, inArray, between, or, like } from "drizzle-orm";
import { db } from "./db";
import { 
  transportationCompanies,
  deliveryVehicles, 
  deliveryPersonnel,
  deliveryRoutes,
  deliveryCodeCounter,
  deliveryVerificationCodes,
  logisticsAnalytics,
  vehicleTemplates,
  readyVehicles,
  vehicleSelectionHistory,
  type TransportationCompany,
  type InsertTransportationCompany,
  type DeliveryVehicle,
  type InsertDeliveryVehicle,
  type DeliveryPersonnel,
  type InsertDeliveryPersonnel,
  type DeliveryRoute,
  type InsertDeliveryRoute,
  type DeliveryCodeCounter,
  type InsertDeliveryCodeCounter,
  type DeliveryVerificationCode,
  type InsertDeliveryVerificationCode,
  type LogisticsAnalytics,
  type InsertLogisticsAnalytics,
  type VehicleTemplate,
  type InsertVehicleTemplate,
  type ReadyVehicle,
  type InsertReadyVehicle,
  type VehicleSelectionHistory,
  type InsertVehicleSelectionHistory,
  VEHICLE_TYPES,
  DELIVERY_STATUS,
  ROUTE_STATUS,
  SMS_STATUS
} from "@shared/logistics-schema";

export interface ILogisticsStorage {
  // Transportation Companies
  getTransportationCompanies(filters?: { isActive?: boolean }): Promise<TransportationCompany[]>;
  getTransportationCompanyById(id: number): Promise<TransportationCompany | null>;
  createTransportationCompany(data: InsertTransportationCompany): Promise<TransportationCompany>;
  updateTransportationCompany(id: number, data: Partial<InsertTransportationCompany>): Promise<TransportationCompany>;
  deleteTransportationCompany(id: number): Promise<void>;

  // Delivery Vehicles
  getDeliveryVehicles(filters?: { 
    companyId?: number; 
    vehicleType?: string; 
    currentStatus?: string; 
    isActive?: boolean 
  }): Promise<DeliveryVehicle[]>;
  getDeliveryVehicleById(id: number): Promise<DeliveryVehicle | null>;
  getAvailableVehicles(criteria: {
    vehicleType?: string;
    minWeight?: number;
    minVolume?: number;
  }): Promise<DeliveryVehicle[]>;
  createDeliveryVehicle(data: InsertDeliveryVehicle): Promise<DeliveryVehicle>;
  updateDeliveryVehicle(id: number, data: Partial<InsertDeliveryVehicle>): Promise<DeliveryVehicle>;
  updateVehicleStatus(id: number, status: string): Promise<DeliveryVehicle>;
  deleteDeliveryVehicle(id: number): Promise<void>;

  // Delivery Personnel
  getDeliveryPersonnel(filters?: { 
    companyId?: number; 
    currentStatus?: string; 
    isActive?: boolean 
  }): Promise<DeliveryPersonnel[]>;
  getDeliveryPersonnelById(id: number): Promise<DeliveryPersonnel | null>;
  getAvailableDrivers(criteria?: {
    serviceArea?: string;
    vehicleType?: string;
  }): Promise<DeliveryPersonnel[]>;
  createDeliveryPersonnel(data: InsertDeliveryPersonnel): Promise<DeliveryPersonnel>;
  updateDeliveryPersonnel(id: number, data: Partial<InsertDeliveryPersonnel>): Promise<DeliveryPersonnel>;
  updateDriverStatus(id: number, status: string): Promise<DeliveryPersonnel>;
  updateDriverLocation(id: number, latitude: number, longitude: number): Promise<DeliveryPersonnel>;
  deleteDeliveryPersonnel(id: number): Promise<void>;

  // Delivery Routes
  getDeliveryRoutes(filters?: { 
    driverId?: number; 
    vehicleId?: number; 
    status?: string; 
    dateRange?: { start: Date; end: Date }
  }): Promise<DeliveryRoute[]>;
  getDeliveryRouteById(id: number): Promise<DeliveryRoute | null>;
  createDeliveryRoute(data: InsertDeliveryRoute): Promise<DeliveryRoute>;
  updateDeliveryRoute(id: number, data: Partial<InsertDeliveryRoute>): Promise<DeliveryRoute>;
  updateRouteStatus(id: number, status: string): Promise<DeliveryRoute>;
  addOrderToRoute(routeId: number, orderId: number): Promise<DeliveryRoute>;
  removeOrderFromRoute(routeId: number, orderId: number): Promise<DeliveryRoute>;
  completeRouteStop(routeId: number, orderId: number): Promise<DeliveryRoute>;
  deleteDeliveryRoute(id: number): Promise<void>;

  // Delivery Verification Codes
  getDeliveryVerificationCodes(filters?: { 
    customerOrderId?: number; 
    isVerified?: boolean; 
    smsStatus?: string 
  }): Promise<DeliveryVerificationCode[]>;
  getDeliveryVerificationCodeById(id: number): Promise<DeliveryVerificationCode | null>;
  getDeliveryCodeByOrderId(customerOrderId: number): Promise<DeliveryVerificationCode | null>;
  createDeliveryVerificationCode(data: InsertDeliveryVerificationCode): Promise<DeliveryVerificationCode>;
  generateVerificationCode(customerOrderId: number, customerPhone: string, customerName: string): Promise<DeliveryVerificationCode>;
  generateSequentialDeliveryCode(orderManagementId: number, customerPhone: string): Promise<string>;
  verifyDeliveryCode(customerOrderId: number, code: string, verificationData: {
    verifiedBy: string;
    verificationLocation?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<boolean>;
  updateSmsStatus(id: number, status: string, metadata?: any): Promise<DeliveryVerificationCode>;
  resendVerificationCode(customerOrderId: number): Promise<DeliveryVerificationCode>;
  deleteDeliveryVerificationCode(id: number): Promise<void>;

  // Analytics
  getLogisticsAnalytics(filters?: { 
    period?: string; 
    dateRange?: { start: Date; end: Date }
  }): Promise<LogisticsAnalytics[]>;
  generateDailyAnalytics(date: Date): Promise<LogisticsAnalytics>;
  generateWeeklyAnalytics(weekStart: Date): Promise<LogisticsAnalytics>;
  generateMonthlyAnalytics(month: number, year: number): Promise<LogisticsAnalytics>;
  getPerformanceMetrics(period: number): Promise<any>;
  getDriverPerformance(driverId?: number, period?: number): Promise<any>;
  getVehicleUtilization(vehicleId?: number, period?: number): Promise<any>;
  getCostAnalysis(period: number): Promise<any>;

  // Vehicle Templates (الگوهای خودرو)
  getVehicleTemplates(filters?: { isActive?: boolean; vehicleType?: string }): Promise<VehicleTemplate[]>;
  getVehicleTemplateById(id: number): Promise<VehicleTemplate | null>;
  createVehicleTemplate(data: InsertVehicleTemplate): Promise<VehicleTemplate>;
  updateVehicleTemplate(id: number, data: Partial<InsertVehicleTemplate>): Promise<VehicleTemplate>;
  deleteVehicleTemplate(id: number): Promise<void>;

  // Ready Vehicles (خودروهای فیزیکی آماده)
  getReadyVehicles(filters?: { 
    isAvailable?: boolean; 
    vehicleTemplateId?: number;
    currentLocation?: string;
  }): Promise<ReadyVehicle[]>;
  getReadyVehicleById(id: number): Promise<ReadyVehicle | null>;
  createReadyVehicle(data: InsertReadyVehicle): Promise<ReadyVehicle>;
  updateReadyVehicle(id: number, data: Partial<InsertReadyVehicle>): Promise<ReadyVehicle>;
  updateReadyVehicleAvailability(id: number, isAvailable: boolean): Promise<ReadyVehicle>;
  deleteReadyVehicle(id: number): Promise<void>;

  // Vehicle Assignment System (سیستم تخصیص خودرو)
  getSuitableVehiclesForOrder(orderId: number, orderData: {
    weightKg: number;
    volumeM3?: number;
    routeType: string;
    distanceKm: number;
    isHazardous?: boolean;
    isFlammable?: boolean;
    isRefrigerated?: boolean;
    isFragile?: boolean;
  }): Promise<{
    recommendedVehicles: Array<{
      template: VehicleTemplate;
      readyVehicles: ReadyVehicle[];
      estimatedCost: number;
      reasonForSelection: string;
    }>;
    allCompatibleTemplates: VehicleTemplate[];
  }>;
  
  assignVehicleToOrder(orderNumber: string, vehicleTemplateId: number, readyVehicleId?: number): Promise<{
    success: boolean;
    message: string;
    assignedVehicle?: ReadyVehicle;
    selectionHistory: VehicleSelectionHistory;
  }>;

  // Vehicle Selection History
  getVehicleSelectionHistory(filters?: { 
    orderNumber?: string;
    customerId?: number;
    vehicleTemplateId?: number;
  }): Promise<VehicleSelectionHistory[]>;
  createVehicleSelectionHistory(data: InsertVehicleSelectionHistory): Promise<VehicleSelectionHistory>;
}

export class LogisticsStorage implements ILogisticsStorage {
  // Transportation Companies
  async getTransportationCompanies(filters?: { isActive?: boolean }): Promise<TransportationCompany[]> {
    if (filters?.isActive !== undefined) {
      return db.select().from(transportationCompanies)
        .where(eq(transportationCompanies.isActive, filters.isActive))
        .orderBy(desc(transportationCompanies.totalDeliveries));
    }
    
    return db.select().from(transportationCompanies)
      .orderBy(desc(transportationCompanies.totalDeliveries));
  }

  async getTransportationCompanyById(id: number): Promise<TransportationCompany | null> {
    const results = await db
      .select()
      .from(transportationCompanies)
      .where(eq(transportationCompanies.id, id))
      .limit(1);
    
    return results[0] || null;
  }

  async createTransportationCompany(data: InsertTransportationCompany): Promise<TransportationCompany> {
    const [company] = await db
      .insert(transportationCompanies)
      .values(data)
      .returning();
    
    return company;
  }

  async updateTransportationCompany(id: number, data: Partial<InsertTransportationCompany>): Promise<TransportationCompany> {
    const [company] = await db
      .update(transportationCompanies)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(transportationCompanies.id, id))
      .returning();
    
    return company;
  }

  async deleteTransportationCompany(id: number): Promise<void> {
    await db
      .update(transportationCompanies)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(transportationCompanies.id, id));
  }

  // Delivery Vehicles
  async getDeliveryVehicles(filters?: { 
    companyId?: number; 
    vehicleType?: string; 
    currentStatus?: string; 
    isActive?: boolean 
  }): Promise<DeliveryVehicle[]> {
    const conditions = [];
    
    if (filters?.companyId) {
      conditions.push(eq(deliveryVehicles.companyId, filters.companyId));
    }
    if (filters?.vehicleType) {
      conditions.push(eq(deliveryVehicles.vehicleType, filters.vehicleType));
    }
    if (filters?.currentStatus) {
      conditions.push(eq(deliveryVehicles.currentStatus, filters.currentStatus));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(deliveryVehicles.isActive, filters.isActive));
    }
    
    if (conditions.length > 0) {
      return db.select().from(deliveryVehicles)
        .where(and(...conditions))
        .orderBy(asc(deliveryVehicles.plateNumber));
    }
    
    return db.select().from(deliveryVehicles)
      .orderBy(asc(deliveryVehicles.plateNumber));
  }

  async getDeliveryVehicleById(id: number): Promise<DeliveryVehicle | null> {
    const results = await db
      .select()
      .from(deliveryVehicles)
      .where(eq(deliveryVehicles.id, id))
      .limit(1);
    
    return results[0] || null;
  }

  async getAvailableVehicles(criteria: {
    vehicleType?: string;
    minWeight?: number;
    minVolume?: number;
  }): Promise<DeliveryVehicle[]> {
    const conditions = [
      eq(deliveryVehicles.isActive, true),
      eq(deliveryVehicles.currentStatus, 'available')
    ];
    
    if (criteria.vehicleType) {
      conditions.push(eq(deliveryVehicles.vehicleType, criteria.vehicleType));
    }
    if (criteria.minWeight) {
      conditions.push(gte(deliveryVehicles.maxWeight, criteria.minWeight.toString()));
    }
    if (criteria.minVolume) {
      conditions.push(gte(deliveryVehicles.maxVolume, criteria.minVolume.toString()));
    }
    
    return db.select().from(deliveryVehicles)
      .where(and(...conditions))
      .orderBy(desc(deliveryVehicles.maxWeight));
  }

  async createDeliveryVehicle(data: InsertDeliveryVehicle): Promise<DeliveryVehicle> {
    const [vehicle] = await db
      .insert(deliveryVehicles)
      .values(data)
      .returning();
    
    return vehicle;
  }

  async updateDeliveryVehicle(id: number, data: Partial<InsertDeliveryVehicle>): Promise<DeliveryVehicle> {
    const [vehicle] = await db
      .update(deliveryVehicles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(deliveryVehicles.id, id))
      .returning();
    
    return vehicle;
  }

  async updateVehicleStatus(id: number, status: string): Promise<DeliveryVehicle> {
    const [vehicle] = await db
      .update(deliveryVehicles)
      .set({ currentStatus: status, updatedAt: new Date() })
      .where(eq(deliveryVehicles.id, id))
      .returning();
    
    return vehicle;
  }

  async deleteDeliveryVehicle(id: number): Promise<void> {
    await db
      .update(deliveryVehicles)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(deliveryVehicles.id, id));
  }

  // Delivery Personnel
  async getDeliveryPersonnel(filters?: { 
    companyId?: number; 
    currentStatus?: string; 
    isActive?: boolean 
  }): Promise<DeliveryPersonnel[]> {
    const conditions = [];
    
    if (filters?.companyId) {
      conditions.push(eq(deliveryPersonnel.companyId, filters.companyId));
    }
    if (filters?.currentStatus) {
      conditions.push(eq(deliveryPersonnel.currentStatus, filters.currentStatus));
    }
    if (filters?.isActive !== undefined) {
      conditions.push(eq(deliveryPersonnel.isActive, filters.isActive));
    }
    
    if (conditions.length > 0) {
      return db.select().from(deliveryPersonnel)
        .where(and(...conditions))
        .orderBy(desc(deliveryPersonnel.averageRating));
    }
    
    return db.select().from(deliveryPersonnel)
      .orderBy(desc(deliveryPersonnel.averageRating));
  }

  async getDeliveryPersonnelById(id: number): Promise<DeliveryPersonnel | null> {
    const results = await db
      .select()
      .from(deliveryPersonnel)
      .where(eq(deliveryPersonnel.id, id))
      .limit(1);
    
    return results[0] || null;
  }

  async getAvailableDrivers(criteria?: {
    serviceArea?: string;
    vehicleType?: string;
  }): Promise<DeliveryPersonnel[]> {
    return await db
      .select()
      .from(deliveryPersonnel)
      .where(and(
        eq(deliveryPersonnel.isActive, true),
        eq(deliveryPersonnel.currentStatus, 'available')
      ))
      .orderBy(desc(deliveryPersonnel.averageRating));
  }

  async createDeliveryPersonnel(data: InsertDeliveryPersonnel): Promise<DeliveryPersonnel> {
    const [personnel] = await db
      .insert(deliveryPersonnel)
      .values(data)
      .returning();
    
    return personnel;
  }

  async updateDeliveryPersonnel(id: number, data: Partial<InsertDeliveryPersonnel>): Promise<DeliveryPersonnel> {
    const [personnel] = await db
      .update(deliveryPersonnel)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(deliveryPersonnel.id, id))
      .returning();
    
    return personnel;
  }

  async updateDriverStatus(id: number, status: string): Promise<DeliveryPersonnel> {
    const [personnel] = await db
      .update(deliveryPersonnel)
      .set({ currentStatus: status, updatedAt: new Date() })
      .where(eq(deliveryPersonnel.id, id))
      .returning();
    
    return personnel;
  }

  async updateDriverLocation(id: number, latitude: number, longitude: number): Promise<DeliveryPersonnel> {
    const [personnel] = await db
      .update(deliveryPersonnel)
      .set({ 
        currentLatitude: latitude.toString(),
        currentLongitude: longitude.toString(),
        lastLocationUpdate: new Date(),
        updatedAt: new Date()
      })
      .where(eq(deliveryPersonnel.id, id))
      .returning();
    
    return personnel;
  }

  async deleteDeliveryPersonnel(id: number): Promise<void> {
    await db
      .update(deliveryPersonnel)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(deliveryPersonnel.id, id));
  }

  // Delivery Routes
  async getDeliveryRoutes(filters?: { 
    driverId?: number; 
    vehicleId?: number; 
    status?: string; 
    dateRange?: { start: Date; end: Date }
  }): Promise<DeliveryRoute[]> {
    const conditions = [];
    
    if (filters?.driverId) {
      conditions.push(eq(deliveryRoutes.driverId, filters.driverId));
    }
    if (filters?.vehicleId) {
      conditions.push(eq(deliveryRoutes.vehicleId, filters.vehicleId));
    }
    if (filters?.status) {
      conditions.push(eq(deliveryRoutes.status, filters.status));
    }
    if (filters?.dateRange) {
      conditions.push(between(deliveryRoutes.plannedStartTime, filters.dateRange.start, filters.dateRange.end));
    }
    
    if (conditions.length > 0) {
      return db.select().from(deliveryRoutes)
        .where(and(...conditions))
        .orderBy(desc(deliveryRoutes.plannedStartTime));
    }
    
    return db.select().from(deliveryRoutes)
      .orderBy(desc(deliveryRoutes.plannedStartTime));
  }

  async getDeliveryRouteById(id: number): Promise<DeliveryRoute | null> {
    const results = await db
      .select()
      .from(deliveryRoutes)
      .where(eq(deliveryRoutes.id, id))
      .limit(1);
    
    return results[0] || null;
  }

  async createDeliveryRoute(data: InsertDeliveryRoute): Promise<DeliveryRoute> {
    const [route] = await db
      .insert(deliveryRoutes)
      .values(data)
      .returning();
    
    return route;
  }

  async updateDeliveryRoute(id: number, data: Partial<InsertDeliveryRoute>): Promise<DeliveryRoute> {
    const [route] = await db
      .update(deliveryRoutes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(deliveryRoutes.id, id))
      .returning();
    
    return route;
  }

  async updateRouteStatus(id: number, status: string): Promise<DeliveryRoute> {
    const updateData: any = { status, updatedAt: new Date() };
    
    if (status === 'in_progress' && !this.getDeliveryRouteById(id).then(r => r?.actualStartTime)) {
      updateData.actualStartTime = new Date();
    } else if (status === 'completed') {
      updateData.actualEndTime = new Date();
    }
    
    const [route] = await db
      .update(deliveryRoutes)
      .set(updateData)
      .where(eq(deliveryRoutes.id, id))
      .returning();
    
    return route;
  }

  async addOrderToRoute(routeId: number, orderId: number): Promise<DeliveryRoute> {
    const route = await this.getDeliveryRouteById(routeId);
    if (!route) throw new Error('Route not found');
    
    const currentOrderIds = route.orderIds || [];
    if (!currentOrderIds.includes(orderId)) {
      currentOrderIds.push(orderId);
      
      const [updatedRoute] = await db
        .update(deliveryRoutes)
        .set({ 
          orderIds: currentOrderIds,
          totalStops: currentOrderIds.length,
          updatedAt: new Date()
        })
        .where(eq(deliveryRoutes.id, routeId))
        .returning();
      
      return updatedRoute;
    }
    
    return route;
  }

  async removeOrderFromRoute(routeId: number, orderId: number): Promise<DeliveryRoute> {
    const route = await this.getDeliveryRouteById(routeId);
    if (!route) throw new Error('Route not found');
    
    const currentOrderIds = route.orderIds || [];
    const updatedOrderIds = currentOrderIds.filter(id => id !== orderId);
    
    const [updatedRoute] = await db
      .update(deliveryRoutes)
      .set({ 
        orderIds: updatedOrderIds,
        totalStops: updatedOrderIds.length,
        updatedAt: new Date()
      })
      .where(eq(deliveryRoutes.id, routeId))
      .returning();
    
    return updatedRoute;
  }

  async completeRouteStop(routeId: number, orderId: number): Promise<DeliveryRoute> {
    const route = await this.getDeliveryRouteById(routeId);
    if (!route) throw new Error('Route not found');
    
    const [updatedRoute] = await db
      .update(deliveryRoutes)
      .set({ 
        completedStops: (route.completedStops || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(deliveryRoutes.id, routeId))
      .returning();
    
    return updatedRoute;
  }

  async deleteDeliveryRoute(id: number): Promise<void> {
    await db
      .delete(deliveryRoutes)
      .where(eq(deliveryRoutes.id, id));
  }

  // Delivery Verification Codes
  async getDeliveryVerificationCodes(filters?: { 
    customerOrderId?: number; 
    isVerified?: boolean; 
    smsStatus?: string 
  }): Promise<DeliveryVerificationCode[]> {
    const conditions = [];
    
    if (filters?.customerOrderId) {
      conditions.push(eq(deliveryVerificationCodes.customerOrderId, filters.customerOrderId));
    }
    if (filters?.isVerified !== undefined) {
      conditions.push(eq(deliveryVerificationCodes.isVerified, filters.isVerified));
    }
    if (filters?.smsStatus) {
      conditions.push(eq(deliveryVerificationCodes.smsStatus, filters.smsStatus));
    }
    
    if (conditions.length > 0) {
      return db.select().from(deliveryVerificationCodes)
        .where(and(...conditions))
        .orderBy(desc(deliveryVerificationCodes.createdAt));
    }
    
    return db.select().from(deliveryVerificationCodes)
      .orderBy(desc(deliveryVerificationCodes.createdAt));
  }

  async getDeliveryVerificationCodeById(id: number): Promise<DeliveryVerificationCode | null> {
    const results = await db
      .select()
      .from(deliveryVerificationCodes)
      .where(eq(deliveryVerificationCodes.id, id))
      .limit(1);
    
    return results[0] || null;
  }

  async getDeliveryCodeByOrderId(customerOrderId: number): Promise<DeliveryVerificationCode | null> {
    const results = await db
      .select()
      .from(deliveryVerificationCodes)
      .where(eq(deliveryVerificationCodes.customerOrderId, customerOrderId))
      .limit(1);
    
    return results[0] || null;
  }

  async createDeliveryVerificationCode(data: InsertDeliveryVerificationCode): Promise<DeliveryVerificationCode> {
    const [code] = await db
      .insert(deliveryVerificationCodes)
      .values(data)
      .returning();
    
    return code;
  }

  // Get next sequential delivery code (1111-9999)
  async generateSequentialDeliveryCode(orderManagementId: number, customerPhone: string): Promise<string> {
    // Get next sequential code
    const sequentialCode = await this.getNextSequentialCode();
    
    // Store in delivery verification codes table for SMS tracking
    await db
      .insert(deliveryVerificationCodes)
      .values({
        customerOrderId: orderManagementId,
        verificationCode: sequentialCode,
        customerPhone,
        customerName: '', // Will be populated if needed
        smsMessage: `کد تحویل سفارش شما: ${sequentialCode}`,
        smsStatus: 'pending',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
    
    return sequentialCode;
  }

  private async getNextSequentialCode(): Promise<string> {
    // Get current code from counter table
    const counterResult = await db
      .select()
      .from(deliveryCodeCounter)
      .limit(1);
    
    let currentCode = 1111;
    
    if (counterResult.length > 0) {
      currentCode = counterResult[0].currentCode;
    } else {
      // Initialize counter if not exists
      await db
        .insert(deliveryCodeCounter)
        .values({ currentCode: 1111 });
    }
    
    // Calculate next code
    let nextCode = currentCode + 1;
    
    // If we reach 10000, cycle back to 1111
    if (nextCode > 9999) {
      nextCode = 1111;
    }
    
    // Update counter in database
    await db
      .update(deliveryCodeCounter)
      .set({ 
        currentCode: nextCode,
        lastUpdated: new Date()
      })
      .where(eq(deliveryCodeCounter.id, counterResult[0]?.id || 1));
    
    // Return next code as 4-digit string
    return nextCode.toString();
  }

  async generateVerificationCode(customerOrderId: number, customerPhone: string, customerName: string): Promise<DeliveryVerificationCode> {
    // Generate sequential 4-digit code
    const verificationCode = await this.getNextSequentialCode();
    
    // Code expires in 48 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);
    
    const smsMessage = `${customerName} عزیز، سفارش شما آماده ارسال است.
کد تحویل: ${verificationCode}
این کد را هنگام تحویل به پیک اعلام کنید.
ممتازکم - Momtazchem`;
    
    const data: InsertDeliveryVerificationCode = {
      customerOrderId,
      verificationCode,
      customerPhone,
      customerName,
      smsMessage,
      expiresAt
    };
    
    return this.createDeliveryVerificationCode(data);
  }

  async verifyDeliveryCode(customerOrderId: number, code: string, verificationData: {
    verifiedBy: string;
    verificationLocation?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<boolean> {
    const deliveryCode = await this.getDeliveryCodeByOrderId(customerOrderId);
    
    if (!deliveryCode) {
      return false;
    }
    
    // Check if code matches and hasn't expired
    if (deliveryCode.verificationCode !== code || new Date() > new Date(deliveryCode.expiresAt)) {
      return false;
    }
    
    // Update verification status
    await db
      .update(deliveryVerificationCodes)
      .set({
        isVerified: true,
        verifiedAt: new Date(),
        verifiedBy: verificationData.verifiedBy,
        verificationLocation: verificationData.verificationLocation,
        verificationLatitude: verificationData.latitude?.toString(),
        verificationLongitude: verificationData.longitude?.toString(),
        updatedAt: new Date()
      })
      .where(eq(deliveryVerificationCodes.id, deliveryCode.id));
    
    return true;
  }

  async updateSmsStatus(id: number, status: string, metadata?: any): Promise<DeliveryVerificationCode> {
    const updateData: any = { smsStatus: status, updatedAt: new Date() };
    
    if (status === 'sent') {
      updateData.smsSentAt = new Date();
      if (metadata?.messageId) updateData.smsMessageId = metadata.messageId;
      if (metadata?.provider) updateData.smsProvider = metadata.provider;
    }
    
    const [code] = await db
      .update(deliveryVerificationCodes)
      .set(updateData)
      .where(eq(deliveryVerificationCodes.id, id))
      .returning();
    
    return code;
  }

  async resendVerificationCode(customerOrderId: number): Promise<DeliveryVerificationCode> {
    const existingCode = await this.getDeliveryCodeByOrderId(customerOrderId);
    if (!existingCode) {
      throw new Error('No verification code found for this order');
    }
    
    // Generate new code and extend expiry
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);
    
    const smsMessage = `${existingCode.customerName} عزیز، کد تحویل جدید:
${verificationCode}
این کد را هنگام تحویل به پیک اعلام کنید.
ممتازکم - Momtazchem`;
    
    const [updatedCode] = await db
      .update(deliveryVerificationCodes)
      .set({
        verificationCode,
        smsMessage,
        expiresAt,
        smsStatus: 'pending',
        smsSentAt: null,
        updatedAt: new Date()
      })
      .where(eq(deliveryVerificationCodes.id, existingCode.id))
      .returning();
    
    return updatedCode;
  }

  async deleteDeliveryVerificationCode(id: number): Promise<void> {
    await db
      .delete(deliveryVerificationCodes)
      .where(eq(deliveryVerificationCodes.id, id));
  }

  // Analytics Methods
  async getLogisticsAnalytics(filters?: { 
    period?: string; 
    dateRange?: { start: Date; end: Date }
  }): Promise<LogisticsAnalytics[]> {
    const conditions = [];
    
    if (filters?.period) {
      conditions.push(eq(logisticsAnalytics.period, filters.period));
    }
    if (filters?.dateRange) {
      conditions.push(between(logisticsAnalytics.analyticsDate, filters.dateRange.start, filters.dateRange.end));
    }
    
    if (conditions.length > 0) {
      return db.select().from(logisticsAnalytics)
        .where(and(...conditions))
        .orderBy(desc(logisticsAnalytics.analyticsDate));
    }
    
    return db.select().from(logisticsAnalytics)
      .orderBy(desc(logisticsAnalytics.analyticsDate));
  }

  async generateDailyAnalytics(date: Date): Promise<LogisticsAnalytics> {
    // Implementation would calculate daily metrics
    // This is a placeholder - you would calculate real metrics from your order data
    const analyticsData: InsertLogisticsAnalytics = {
      analyticsDate: date,
      period: 'daily',
      totalOrders: 0,
      deliveredOrders: 0,
      failedDeliveries: 0,
      totalRoutes: 0,
      completedRoutes: 0,
      onTimeDeliveryRate: "0",
      customerSatisfactionScore: "0",
      totalDeliveryCost: "0"
    };
    
    const [analytics] = await db
      .insert(logisticsAnalytics)
      .values(analyticsData)
      .returning();
    
    return analytics;
  }

  async generateWeeklyAnalytics(weekStart: Date): Promise<LogisticsAnalytics> {
    const analyticsData: InsertLogisticsAnalytics = {
      analyticsDate: weekStart,
      period: 'weekly',
      totalOrders: 0,
      deliveredOrders: 0,
      failedDeliveries: 0,
      totalRoutes: 0,
      completedRoutes: 0,
      onTimeDeliveryRate: "0",
      customerSatisfactionScore: "0",
      totalDeliveryCost: "0"
    };
    
    const [analytics] = await db
      .insert(logisticsAnalytics)
      .values(analyticsData)
      .returning();
    
    return analytics;
  }

  async generateMonthlyAnalytics(month: number, year: number): Promise<LogisticsAnalytics> {
    const analyticsDate = new Date(year, month - 1, 1);
    
    const analyticsData: InsertLogisticsAnalytics = {
      analyticsDate,
      period: 'monthly',
      totalOrders: 0,
      deliveredOrders: 0,
      failedDeliveries: 0,
      totalRoutes: 0,
      completedRoutes: 0,
      onTimeDeliveryRate: "0",
      customerSatisfactionScore: "0",
      totalDeliveryCost: "0"
    };
    
    const [analytics] = await db
      .insert(logisticsAnalytics)
      .values(analyticsData)
      .returning();
    
    return analytics;
  }

  async getPerformanceMetrics(period: number): Promise<any> {
    // Calculate performance metrics for the last 'period' days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period);
    
    return {
      totalDeliveries: 0,
      successfulDeliveries: 0,
      averageDeliveryTime: 0,
      onTimeRate: 0,
      customerSatisfaction: 0
    };
  }

  async getDriverPerformance(driverId?: number, period?: number): Promise<any> {
    // Calculate driver performance metrics
    return {
      driverId,
      totalDeliveries: 0,
      successfulDeliveries: 0,
      averageRating: 0,
      totalDistance: 0,
      fuelEfficiency: 0
    };
  }

  async getVehicleUtilization(vehicleId?: number, period?: number): Promise<any> {
    // Calculate vehicle utilization metrics
    return {
      vehicleId,
      totalTrips: 0,
      totalDistance: 0,
      utilization: 0,
      maintenanceCost: 0,
      fuelCost: 0
    };
  }

  async getCostAnalysis(period: number): Promise<any> {
    // Calculate cost analysis for logistics operations
    return {
      totalCost: 0,
      fuelCost: 0,
      maintenanceCost: 0,
      driverCost: 0,
      costPerDelivery: 0,
      costPerKm: 0
    };
  }

  // =============================================================================
  // VEHICLE TEMPLATES MANAGEMENT (الگوهای خودرو)
  // =============================================================================
  
  async getVehicleTemplates(filters?: { isActive?: boolean; vehicleType?: string }): Promise<VehicleTemplate[]> {
    const conditions = [];
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(vehicleTemplates.isActive, filters.isActive));
    }
    if (filters?.vehicleType) {
      conditions.push(eq(vehicleTemplates.vehicleType, filters.vehicleType));
    }
    
    if (conditions.length > 0) {
      return db.select().from(vehicleTemplates)
        .where(and(...conditions))
        .orderBy(asc(vehicleTemplates.priority), desc(vehicleTemplates.maxWeightKg));
    }
    
    return db.select().from(vehicleTemplates)
      .orderBy(asc(vehicleTemplates.priority), desc(vehicleTemplates.maxWeightKg));
  }

  async getVehicleTemplateById(id: number): Promise<VehicleTemplate | null> {
    const results = await db
      .select()
      .from(vehicleTemplates)
      .where(eq(vehicleTemplates.id, id))
      .limit(1);
    
    return results[0] || null;
  }

  async createVehicleTemplate(data: InsertVehicleTemplate): Promise<VehicleTemplate> {
    const [template] = await db
      .insert(vehicleTemplates)
      .values(data)
      .returning();
    
    return template;
  }

  async updateVehicleTemplate(id: number, data: Partial<InsertVehicleTemplate>): Promise<VehicleTemplate> {
    const [template] = await db
      .update(vehicleTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vehicleTemplates.id, id))
      .returning();
    
    return template;
  }

  async deleteVehicleTemplate(id: number): Promise<void> {
    await db
      .update(vehicleTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(vehicleTemplates.id, id));
  }

  // =============================================================================
  // READY VEHICLES MANAGEMENT (خودروهای فیزیکی آماده)
  // =============================================================================

  async getReadyVehicles(filters?: { 
    isAvailable?: boolean; 
    vehicleTemplateId?: number;
    currentLocation?: string;
  }): Promise<ReadyVehicle[]> {
    const conditions = [];
    
    if (filters?.isAvailable !== undefined) {
      conditions.push(eq(readyVehicles.isAvailable, filters.isAvailable));
    }
    if (filters?.vehicleTemplateId) {
      conditions.push(eq(readyVehicles.vehicleTemplateId, filters.vehicleTemplateId));
    }
    if (filters?.currentLocation) {
      conditions.push(eq(readyVehicles.currentLocation, filters.currentLocation));
    }
    
    if (conditions.length > 0) {
      return db.select().from(readyVehicles)
        .where(and(...conditions))
        .orderBy(desc(readyVehicles.isAvailable), asc(readyVehicles.driverName));
    }
    
    return db.select().from(readyVehicles)
      .orderBy(desc(readyVehicles.isAvailable), asc(readyVehicles.driverName));
  }

  async getReadyVehicleById(id: number): Promise<ReadyVehicle | null> {
    const results = await db
      .select()
      .from(readyVehicles)
      .where(eq(readyVehicles.id, id))
      .limit(1);
    
    return results[0] || null;
  }

  async createReadyVehicle(data: InsertReadyVehicle): Promise<ReadyVehicle> {
    const [vehicle] = await db
      .insert(readyVehicles)
      .values(data)
      .returning();
    
    return vehicle;
  }

  async updateReadyVehicle(id: number, data: Partial<InsertReadyVehicle>): Promise<ReadyVehicle> {
    const [vehicle] = await db
      .update(readyVehicles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(readyVehicles.id, id))
      .returning();
    
    return vehicle;
  }

  async updateReadyVehicleAvailability(id: number, isAvailable: boolean): Promise<ReadyVehicle> {
    const [vehicle] = await db
      .update(readyVehicles)
      .set({ isAvailable, updatedAt: new Date() })
      .where(eq(readyVehicles.id, id))
      .returning();
    
    return vehicle;
  }

  async deleteReadyVehicle(id: number): Promise<void> {
    await db
      .delete(readyVehicles)
      .where(eq(readyVehicles.id, id));
  }

  // =============================================================================
  // VEHICLE ASSIGNMENT SYSTEM (سیستم تخصیص خودرو)
  // =============================================================================

  async getSuitableVehiclesForOrder(orderId: number, orderData: {
    weightKg: number;
    volumeM3?: number;
    routeType: string;
    distanceKm: number;
    isHazardous?: boolean;
    isFlammable?: boolean;
    isRefrigerated?: boolean;
    isFragile?: boolean;
  }): Promise<{
    recommendedVehicles: Array<{
      template: VehicleTemplate;
      readyVehicles: ReadyVehicle[];
      estimatedCost: number;
      reasonForSelection: string;
    }>;
    allCompatibleTemplates: VehicleTemplate[];
  }> {
    // 1. Get all active vehicle templates
    const allTemplates = await this.getVehicleTemplates({ isActive: true });
    
    // 2. Filter templates based on order requirements
    const compatibleTemplates = allTemplates.filter(template => {
      // Check weight capacity
      if (parseFloat(template.maxWeightKg.toString()) < orderData.weightKg) {
        return false;
      }
      
      // Check volume capacity if needed
      if (orderData.volumeM3 && template.maxVolumeM3) {
        if (parseFloat(template.maxVolumeM3.toString()) < orderData.volumeM3) {
          return false;
        }
      }
      
      // Check route compatibility
      if (!template.allowedRoutes?.includes(orderData.routeType)) {
        return false;
      }
      
      // Check special requirements
      if (orderData.isHazardous && !template.supportsHazardous) {
        return false;
      }
      
      if (orderData.isFlammable && (!template.supportsFlammable || template.notAllowedFlammable)) {
        return false;
      }
      
      if (orderData.isRefrigerated && !template.supportsRefrigerated) {
        return false;
      }
      
      if (orderData.isFragile && !template.supportsFragile) {
        return false;
      }
      
      return true;
    });

    // 3. For each compatible template, find available ready vehicles and calculate cost
    const recommendedVehicles = await Promise.all(
      compatibleTemplates.map(async (template) => {
        // Get ready vehicles for this template
        const availableVehicles = await this.getReadyVehicles({
          isAvailable: true,
          vehicleTemplateId: template.id
        });

        // Calculate estimated cost
        const basePrice = parseFloat(template.basePrice.toString());
        const distanceCost = parseFloat(template.pricePerKm.toString()) * orderData.distanceKm;
        const weightCost = parseFloat((template.pricePerKg || "0").toString()) * orderData.weightKg;
        const estimatedCost = basePrice + distanceCost + weightCost;

        // Generate reason for selection
        let reasonForSelection = `مناسب برای وزن ${orderData.weightKg} کیلوگرم`;
        if (orderData.volumeM3) {
          reasonForSelection += ` و حجم ${orderData.volumeM3} متر مکعب`;
        }
        reasonForSelection += `. مسیر: ${orderData.routeType}`;
        
        if (orderData.isHazardous) reasonForSelection += '. پشتیبانی از مواد خطرناک';
        if (orderData.isFlammable) reasonForSelection += '. پشتیبانی از مواد آتش‌زا';
        if (orderData.isRefrigerated) reasonForSelection += '. دارای سیستم سردخانه';
        if (orderData.isFragile) reasonForSelection += '. پشتیبانی از کالاهای شکستنی';

        return {
          template,
          readyVehicles: availableVehicles,
          estimatedCost,
          reasonForSelection
        };
      })
    );

    // 4. Sort by cost (cheapest first) and availability
    recommendedVehicles.sort((a, b) => {
      // Prioritize vehicles with available ready vehicles
      if (a.readyVehicles.length > 0 && b.readyVehicles.length === 0) return -1;
      if (a.readyVehicles.length === 0 && b.readyVehicles.length > 0) return 1;
      
      // Then sort by cost
      return a.estimatedCost - b.estimatedCost;
    });

    return {
      recommendedVehicles,
      allCompatibleTemplates: compatibleTemplates
    };
  }

  async assignVehicleToOrder(orderNumber: string, vehicleTemplateId: number, readyVehicleId?: number): Promise<{
    success: boolean;
    message: string;
    assignedVehicle: ReadyVehicle | null;
    selectionHistory: VehicleSelectionHistory;
  }> {
    // Get vehicle template
    const template = await this.getVehicleTemplateById(vehicleTemplateId);
    if (!template) {
      throw new Error('الگوی خودروی انتخاب شده یافت نشد');
    }

    let assignedVehicle: ReadyVehicle | null = null;
    let message = '';

    // If specific ready vehicle is requested
    if (readyVehicleId) {
      assignedVehicle = await this.getReadyVehicleById(readyVehicleId);
      if (!assignedVehicle) {
        return {
          success: false,
          message: 'خودروی مشخص شده یافت نشد',
          selectionHistory: {} as VehicleSelectionHistory
        };
      }

      if (!assignedVehicle.isAvailable) {
        return {
          success: false,
          message: 'خودروی انتخابی در حال حاضر در دسترس نیست',
          selectionHistory: {} as VehicleSelectionHistory
        };
      }

      // Mark vehicle as assigned
      await this.updateReadyVehicleAvailability(readyVehicleId, false);
      message = `خودرو ${assignedVehicle.licensePlate} با راننده ${assignedVehicle.driverName} تخصیص یافت`;
    } else {
      // Find any available vehicle for this template
      const availableVehicles = await this.getReadyVehicles({
        isAvailable: true,
        vehicleTemplateId
      });

      if (availableVehicles.length > 0) {
        assignedVehicle = availableVehicles[0];
        await this.updateReadyVehicleAvailability(assignedVehicle.id, false);
        message = `خودرو ${assignedVehicle.licensePlate} با راننده ${assignedVehicle.driverName} تخصیص یافت`;
      } else {
        message = `الگوی خودروی ${template.name} انتخاب شد اما هیچ خودروی فیزیکی در دسترس نیست. لطفاً با مدیریت لجستیک تماس بگیرید`;
      }
    }

    // Create selection history record
    const selectionHistory = await this.createVehicleSelectionHistory({
      orderNumber,
      selectedVehicleTemplateId: vehicleTemplateId,
      selectedVehicleName: template.name,
      orderWeightKg: "0", // This should be passed from the order data
      routeType: "urban", // This should be passed from the order data
      distanceKm: "0", // This should be passed from the order data
      basePrice: template.basePrice.toString(),
      distanceCost: "0",
      totalCost: template.basePrice.toString(),
      selectionCriteria: `انتخاب الگوی ${template.name}` + (assignedVehicle ? ` و تخصیص خودرو ${assignedVehicle.licensePlate}` : ' بدون تخصیص خودرو فیزیکی')
    });

    return {
      success: true,
      message,
      assignedVehicle,
      selectionHistory
    };
  }

  // =============================================================================
  // VEHICLE SELECTION HISTORY
  // =============================================================================

  async getVehicleSelectionHistory(filters?: { 
    orderNumber?: string;
    customerId?: number;
    vehicleTemplateId?: number;
  }): Promise<VehicleSelectionHistory[]> {
    const conditions = [];
    
    if (filters?.orderNumber) {
      conditions.push(eq(vehicleSelectionHistory.orderNumber, filters.orderNumber));
    }
    if (filters?.customerId) {
      conditions.push(eq(vehicleSelectionHistory.customerId, filters.customerId));
    }
    if (filters?.vehicleTemplateId) {
      conditions.push(eq(vehicleSelectionHistory.selectedVehicleTemplateId, filters.vehicleTemplateId));
    }
    
    if (conditions.length > 0) {
      return db.select().from(vehicleSelectionHistory)
        .where(and(...conditions))
        .orderBy(desc(vehicleSelectionHistory.createdAt));
    }
    
    return db.select().from(vehicleSelectionHistory)
      .orderBy(desc(vehicleSelectionHistory.createdAt));
  }

  async createVehicleSelectionHistory(data: InsertVehicleSelectionHistory): Promise<VehicleSelectionHistory> {
    const [history] = await db
      .insert(vehicleSelectionHistory)
      .values(data)
      .returning();
    
    return history;
  }
}

export const logisticsStorage = new LogisticsStorage();