import { db } from "./db";
import { 
  securityLogs, 
  securitySettings, 
  ipAccessControl, 
  securitySessions, 
  securityAlerts, 
  securityScans,
  type InsertSecurityLog,
  type InsertSecuritySetting,
  type InsertIpAccessControl,
  type InsertSecuritySession,
  type InsertSecurityAlert,
  type InsertSecurityScan,
  type SecurityLog,
  type SecuritySetting,
  type IpAccessControl,
  type SecuritySession,
  type SecurityAlert,
  type SecurityScan
} from "@shared/security-schema";
import { eq, desc, and, gte, lte, count, sql } from "drizzle-orm";

export interface ISecurityStorage {
  // Security Logging
  logSecurityEvent(event: InsertSecurityLog): Promise<SecurityLog>;
  getSecurityLogs(filters?: {
    eventType?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: SecurityLog[]; total: number; }>;
  
  // Security Settings
  getSecuritySetting(setting: string): Promise<SecuritySetting | undefined>;
  updateSecuritySetting(setting: string, value: string, updatedBy: number): Promise<SecuritySetting>;
  getAllSecuritySettings(): Promise<SecuritySetting[]>;
  getSecuritySettingsByCategory(category: string): Promise<SecuritySetting[]>;
  
  // IP Access Control
  addIpToAccessControl(ipData: InsertIpAccessControl): Promise<IpAccessControl>;
  checkIpAccess(ipAddress: string, category: string): Promise<{ allowed: boolean; reason?: string; }>;
  getIpAccessList(type?: 'blacklist' | 'whitelist'): Promise<IpAccessControl[]>;
  removeIpFromAccessControl(id: number): Promise<void>;
  
  // Session Management
  createSecuritySession(sessionData: InsertSecuritySession): Promise<SecuritySession>;
  updateSessionActivity(sessionId: string): Promise<void>;
  terminateSession(sessionId: string, reason: string, terminatedBy?: number): Promise<void>;
  getActiveSessions(userId?: number): Promise<SecuritySession[]>;
  getSessionRiskAssessment(sessionId: string): Promise<{ riskScore: number; factors: string[]; }>;
  
  // Security Alerts
  createSecurityAlert(alertData: InsertSecurityAlert): Promise<SecurityAlert>;
  getSecurityAlerts(filters?: {
    severity?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ alerts: SecurityAlert[]; total: number; }>;
  resolveSecurityAlert(id: number, resolution: string, resolvedBy: number): Promise<SecurityAlert>;
  
  // Security Scans
  createSecurityScan(scanData: InsertSecurityScan): Promise<SecurityScan>;
  updateSecurityScan(id: number, updates: Partial<InsertSecurityScan>): Promise<SecurityScan>;
  getSecurityScans(limit?: number): Promise<SecurityScan[]>;
  getLatestScanByType(scanType: string): Promise<SecurityScan | undefined>;
  
  // Security Dashboard
  getSecurityDashboard(): Promise<{
    recentAlerts: SecurityAlert[];
    activeThreatLevel: string;
    suspiciousActivities: number;
    failedLogins24h: number;
    activeAdminSessions: number;
    lastScanResults: SecurityScan[];
    criticalIssues: number;
    ipBlacklist: number;
    systemHealthScore: number;
  }>;
}

export class SecurityStorage implements ISecurityStorage {
  
  async logSecurityEvent(eventData: InsertSecurityLog): Promise<SecurityLog> {
    const [log] = await db
      .insert(securityLogs)
      .values(eventData)
      .returning();
    return log;
  }
  
  async getSecurityLogs(filters: {
    eventType?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ logs: SecurityLog[]; total: number; }> {
    const { eventType, severity, startDate, endDate, limit = 50, offset = 0 } = filters;
    
    let query = db.select().from(securityLogs);
    const conditions = [];
    
    if (eventType) conditions.push(eq(securityLogs.eventType, eventType));
    if (severity) conditions.push(eq(securityLogs.severity, severity));
    if (startDate) conditions.push(gte(securityLogs.createdAt, startDate));
    if (endDate) conditions.push(lte(securityLogs.createdAt, endDate));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const logs = await query
      .orderBy(desc(securityLogs.createdAt))
      .limit(limit)
      .offset(offset);
    
    const [{ total }] = await db
      .select({ total: count() })
      .from(securityLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    return { logs, total };
  }
  
  async getSecuritySetting(setting: string): Promise<SecuritySetting | undefined> {
    const [result] = await db
      .select()
      .from(securitySettings)
      .where(eq(securitySettings.setting, setting))
      .limit(1);
    return result;
  }
  
  async updateSecuritySetting(setting: string, value: string, updatedBy: number): Promise<SecuritySetting> {
    const [result] = await db
      .update(securitySettings)
      .set({ 
        value, 
        updatedBy, 
        updatedAt: new Date() 
      })
      .where(eq(securitySettings.setting, setting))
      .returning();
    
    if (!result) {
      // Create new setting if it doesn't exist
      const [newSetting] = await db
        .insert(securitySettings)
        .values({
          setting,
          value,
          category: 'general',
          updatedBy
        })
        .returning();
      return newSetting;
    }
    
    return result;
  }
  
  async getAllSecuritySettings(): Promise<SecuritySetting[]> {
    return db
      .select()
      .from(securitySettings)
      .where(eq(securitySettings.isActive, true))
      .orderBy(securitySettings.category, securitySettings.setting);
  }
  
  async getSecuritySettingsByCategory(category: string): Promise<SecuritySetting[]> {
    return db
      .select()
      .from(securitySettings)
      .where(and(
        eq(securitySettings.category, category),
        eq(securitySettings.isActive, true)
      ))
      .orderBy(securitySettings.setting);
  }
  
  async addIpToAccessControl(ipData: InsertIpAccessControl): Promise<IpAccessControl> {
    const [result] = await db
      .insert(ipAccessControl)
      .values(ipData)
      .returning();
    return result;
  }
  
  async checkIpAccess(ipAddress: string, category: string): Promise<{ allowed: boolean; reason?: string; }> {
    // Check blacklist first
    const [blacklisted] = await db
      .select()
      .from(ipAccessControl)
      .where(and(
        eq(ipAccessControl.ipAddress, ipAddress),
        eq(ipAccessControl.type, 'blacklist'),
        eq(ipAccessControl.category, category),
        eq(ipAccessControl.isActive, true)
      ))
      .limit(1);
    
    if (blacklisted) {
      return { 
        allowed: false, 
        reason: blacklisted.reason || 'IP address is blacklisted' 
      };
    }
    
    // Check if whitelist exists for this category
    const whitelistExists = await db
      .select({ count: count() })
      .from(ipAccessControl)
      .where(and(
        eq(ipAccessControl.type, 'whitelist'),
        eq(ipAccessControl.category, category),
        eq(ipAccessControl.isActive, true)
      ));
    
    if (whitelistExists[0].count > 0) {
      // If whitelist exists, check if IP is whitelisted
      const [whitelisted] = await db
        .select()
        .from(ipAccessControl)
        .where(and(
          eq(ipAccessControl.ipAddress, ipAddress),
          eq(ipAccessControl.type, 'whitelist'),
          eq(ipAccessControl.category, category),
          eq(ipAccessControl.isActive, true)
        ))
        .limit(1);
      
      if (!whitelisted) {
        return { 
          allowed: false, 
          reason: 'IP address not in whitelist' 
        };
      }
    }
    
    return { allowed: true };
  }
  
  async getIpAccessList(type?: 'blacklist' | 'whitelist'): Promise<IpAccessControl[]> {
    let query = db
      .select()
      .from(ipAccessControl)
      .where(eq(ipAccessControl.isActive, true));
    
    if (type) {
      query = query.where(and(
        eq(ipAccessControl.isActive, true),
        eq(ipAccessControl.type, type)
      ));
    }
    
    return query.orderBy(desc(ipAccessControl.createdAt));
  }
  
  async removeIpFromAccessControl(id: number): Promise<void> {
    await db
      .update(ipAccessControl)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(ipAccessControl.id, id));
  }
  
  async createSecuritySession(sessionData: InsertSecuritySession): Promise<SecuritySession> {
    const [session] = await db
      .insert(securitySessions)
      .values(sessionData)
      .returning();
    return session;
  }
  
  async updateSessionActivity(sessionId: string): Promise<void> {
    await db
      .update(securitySessions)
      .set({ lastActivity: new Date() })
      .where(eq(securitySessions.sessionId, sessionId));
  }
  
  async terminateSession(sessionId: string, reason: string, terminatedBy?: number): Promise<void> {
    await db
      .update(securitySessions)
      .set({ 
        isActive: false, 
        logoutTime: new Date(), 
        logoutReason: reason 
      })
      .where(eq(securitySessions.sessionId, sessionId));
  }
  
  async getActiveSessions(userId?: number): Promise<SecuritySession[]> {
    let query = db
      .select()
      .from(securitySessions)
      .where(eq(securitySessions.isActive, true));
    
    if (userId) {
      query = query.where(and(
        eq(securitySessions.isActive, true),
        eq(securitySessions.userId, userId)
      ));
    }
    
    return query.orderBy(desc(securitySessions.lastActivity));
  }
  
  async getSessionRiskAssessment(sessionId: string): Promise<{ riskScore: number; factors: string[]; }> {
    const [session] = await db
      .select()
      .from(securitySessions)
      .where(eq(securitySessions.sessionId, sessionId))
      .limit(1);
    
    if (!session) {
      return { riskScore: 100, factors: ['Session not found'] };
    }
    
    const factors: string[] = [];
    let riskScore = session.riskScore || 0;
    
    // Check for suspicious patterns
    const now = new Date();
    const sessionAge = now.getTime() - session.loginTime.getTime();
    const inactiveTime = now.getTime() - session.lastActivity.getTime();
    
    if (sessionAge > 24 * 60 * 60 * 1000) { // 24 hours
      riskScore += 20;
      factors.push('Long session duration');
    }
    
    if (inactiveTime > 2 * 60 * 60 * 1000) { // 2 hours
      riskScore += 15;
      factors.push('Extended inactivity');
    }
    
    return { riskScore: Math.min(riskScore, 100), factors };
  }
  
  async createSecurityAlert(alertData: InsertSecurityAlert): Promise<SecurityAlert> {
    const [alert] = await db
      .insert(securityAlerts)
      .values(alertData)
      .returning();
    return alert;
  }
  
  async getSecurityAlerts(filters: {
    severity?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ alerts: SecurityAlert[]; total: number; }> {
    const { severity, status, limit = 50, offset = 0 } = filters;
    
    let query = db.select().from(securityAlerts);
    const conditions = [];
    
    if (severity) conditions.push(eq(securityAlerts.severity, severity));
    if (status) conditions.push(eq(securityAlerts.status, status));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    const alerts = await query
      .orderBy(desc(securityAlerts.createdAt))
      .limit(limit)
      .offset(offset);
    
    const [{ total }] = await db
      .select({ total: count() })
      .from(securityAlerts)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    
    return { alerts, total };
  }
  
  async resolveSecurityAlert(id: number, resolution: string, resolvedBy: number): Promise<SecurityAlert> {
    const [alert] = await db
      .update(securityAlerts)
      .set({ 
        status: 'resolved', 
        resolution, 
        resolvedBy, 
        resolvedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(securityAlerts.id, id))
      .returning();
    return alert;
  }
  
  async createSecurityScan(scanData: InsertSecurityScan): Promise<SecurityScan> {
    const [scan] = await db
      .insert(securityScans)
      .values(scanData)
      .returning();
    return scan;
  }
  
  async updateSecurityScan(id: number, updates: Partial<InsertSecurityScan>): Promise<SecurityScan> {
    const [scan] = await db
      .update(securityScans)
      .set({ ...updates, completedAt: new Date() })
      .where(eq(securityScans.id, id))
      .returning();
    return scan;
  }
  
  async getSecurityScans(limit: number = 20): Promise<SecurityScan[]> {
    return db
      .select()
      .from(securityScans)
      .orderBy(desc(securityScans.startedAt))
      .limit(limit);
  }
  
  async getLatestScanByType(scanType: string): Promise<SecurityScan | undefined> {
    const [scan] = await db
      .select()
      .from(securityScans)
      .where(eq(securityScans.scanType, scanType))
      .orderBy(desc(securityScans.startedAt))
      .limit(1);
    return scan;
  }
  
  async getSecurityDashboard(): Promise<{
    recentAlerts: SecurityAlert[];
    activeThreatLevel: string;
    suspiciousActivities: number;
    failedLogins24h: number;
    activeAdminSessions: number;
    lastScanResults: SecurityScan[];
    criticalIssues: number;
    ipBlacklist: number;
    systemHealthScore: number;
  }> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Get recent alerts
    const recentAlerts = await db
      .select()
      .from(securityAlerts)
      .where(eq(securityAlerts.status, 'open'))
      .orderBy(desc(securityAlerts.createdAt))
      .limit(5);
    
    // Count failed logins in last 24 hours
    const [{ failedLogins24h }] = await db
      .select({ failedLogins24h: count() })
      .from(securityLogs)
      .where(and(
        eq(securityLogs.eventType, 'failed_login'),
        gte(securityLogs.createdAt, yesterday)
      ));
    
    // Count suspicious activities
    const [{ suspiciousActivities }] = await db
      .select({ suspiciousActivities: count() })
      .from(securityLogs)
      .where(and(
        sql`severity IN ('high', 'critical')`,
        gte(securityLogs.createdAt, yesterday)
      ));
    
    // Count active admin sessions
    const [{ activeAdminSessions }] = await db
      .select({ activeAdminSessions: count() })
      .from(securitySessions)
      .where(and(
        eq(securitySessions.isActive, true),
        sql`username LIKE '%admin%' OR username = 'info@momtazchem.com'`
      ));
    
    // Get latest scan results
    const lastScanResults = await db
      .select()
      .from(securityScans)
      .where(eq(securityScans.status, 'completed'))
      .orderBy(desc(securityScans.completedAt))
      .limit(3);
    
    // Count critical issues from latest scans
    const criticalIssues = lastScanResults.reduce((sum, scan) => sum + (scan.criticalIssues || 0), 0);
    
    // Count blacklisted IPs
    const [{ ipBlacklist }] = await db
      .select({ ipBlacklist: count() })
      .from(ipAccessControl)
      .where(and(
        eq(ipAccessControl.type, 'blacklist'),
        eq(ipAccessControl.isActive, true)
      ));
    
    // Calculate system health score
    let systemHealthScore = 100;
    if (criticalIssues > 0) systemHealthScore -= criticalIssues * 10;
    if (suspiciousActivities > 5) systemHealthScore -= 20;
    if (failedLogins24h > 10) systemHealthScore -= 15;
    systemHealthScore = Math.max(0, systemHealthScore);
    
    // Determine threat level
    let activeThreatLevel = 'low';
    if (systemHealthScore < 60 || criticalIssues > 2) activeThreatLevel = 'critical';
    else if (systemHealthScore < 80 || suspiciousActivities > 3) activeThreatLevel = 'high';
    else if (systemHealthScore < 90 || suspiciousActivities > 1) activeThreatLevel = 'medium';
    
    return {
      recentAlerts,
      activeThreatLevel,
      suspiciousActivities,
      failedLogins24h,
      activeAdminSessions,
      lastScanResults,
      criticalIssues,
      ipBlacklist,
      systemHealthScore
    };
  }
}

export const securityStorage = new SecurityStorage();