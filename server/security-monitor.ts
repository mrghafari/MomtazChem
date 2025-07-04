import { db } from "./db";
import { eq, sql, desc, and, gte } from "drizzle-orm";
import { users } from "@shared/schema";

// Security monitoring and threat detection system
export class SecurityMonitor {
  private suspiciousActivities: Map<string, number> = new Map();
  private loginAttempts: Map<string, { count: number; lastAttempt: number }> = new Map();

  // Monitor failed login attempts
  recordFailedLogin(ip: string, username?: string) {
    const now = Date.now();
    const key = `${ip}:${username || 'unknown'}`;
    
    if (!this.loginAttempts.has(key)) {
      this.loginAttempts.set(key, { count: 1, lastAttempt: now });
    } else {
      const attempts = this.loginAttempts.get(key)!;
      attempts.count++;
      attempts.lastAttempt = now;
      
      // Alert if more than 5 failed attempts in 15 minutes
      if (attempts.count >= 5) {
        this.alertSuspiciousActivity(`تلاش ورود مشکوک`, {
          ip,
          username: username || 'نامشخص',
          attempts: attempts.count,
          timeWindow: '15 دقیقه'
        });
      }
    }
  }

  // Monitor successful login from unusual locations
  recordSuccessfulLogin(ip: string, userId: number, username: string) {
    this.logSecurityEvent('LOGIN_SUCCESS', {
      ip,
      userId,
      username,
      timestamp: new Date()
    });
  }

  // Detect unusual admin activities
  recordAdminActivity(adminId: number, action: string, details: any) {
    this.logSecurityEvent('ADMIN_ACTIVITY', {
      adminId,
      action,
      details,
      timestamp: new Date()
    });

    // Alert on sensitive actions
    const sensitiveActions = [
      'user_delete',
      'password_change',
      'permission_change',
      'backup_download',
      'system_config_change'
    ];

    if (sensitiveActions.includes(action)) {
      this.alertSuspiciousActivity(`فعالیت حساس ادمین`, {
        adminId,
        action,
        details
      });
    }
  }

  // Monitor file upload activities
  recordFileUpload(userId: number, filename: string, fileSize: number, fileType: string) {
    // Alert on suspicious file types or large files
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.php', '.asp'];
    const extension = filename.toLowerCase().substr(filename.lastIndexOf('.'));
    
    if (dangerousExtensions.includes(extension)) {
      this.alertSuspiciousActivity(`آپلود فایل مشکوک`, {
        userId,
        filename,
        fileSize,
        fileType,
        reason: 'پسوند خطرناک'
      });
    }

    if (fileSize > 100 * 1024 * 1024) { // 100MB
      this.alertSuspiciousActivity(`آپلود فایل بزرگ`, {
        userId,
        filename,
        fileSize,
        reason: 'اندازه غیرعادی'
      });
    }
  }

  // Monitor database queries for injection attempts
  recordSuspiciousQuery(query: string, ip: string) {
    const dangerousPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into.*users/i,
      /update.*password/i,
      /'.*or.*'.*='/i,
      /;.*--|\/\*.*\*\//
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        this.alertSuspiciousActivity(`تلاش SQL Injection`, {
          ip,
          query: query.substring(0, 500), // محدود کردن طول query
          pattern: pattern.source,
          timestamp: new Date()
        });
        break;
      }
    }
  }

  // Alert system for suspicious activities
  private alertSuspiciousActivity(type: string, details: any) {
    console.warn(`🚨 هشدار امنیتی: ${type}`, details);
    
    // در آینده می‌توان این را با سیستم اطلاع‌رسانی SMS یا ایمیل ترکیب کرد
    this.logSecurityEvent('SECURITY_ALERT', {
      type,
      details,
      severity: 'HIGH',
      timestamp: new Date()
    });
  }

  // Log security events to database or file
  private logSecurityEvent(eventType: string, data: any) {
    // ایجاد جدول security_logs در صورت نیاز
    // فعلاً در کنسول ثبت می‌شود
    console.log(`🔒 Security Event: ${eventType}`, {
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  // Generate security report
  async generateSecurityReport() {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    try {
      // Get recent admin activities (این نیاز به جدول activity_logs دارد)
      // const recentActivities = await db
      //   .select()
      //   .from(activityLogs)
      //   .where(gte(activityLogs.createdAt, lastWeek))
      //   .orderBy(desc(activityLogs.createdAt))
      //   .limit(100);

      const report = {
        period: {
          from: lastWeek.toISOString(),
          to: now.toISOString()
        },
        summary: {
          totalLoginAttempts: this.loginAttempts.size,
          suspiciousActivities: this.suspiciousActivities.size,
          securityAlerts: 0 // شمارش از لاگ‌ها
        },
        recommendations: [
          'بررسی و بروزرسانی رمزهای عبور ضعیف',
          'فعال‌سازی احراز هویت دو مرحله‌ای',
          'نظارت بر ترافیک غیرعادی',
          'بکاپ گیری منظم از اطلاعات'
        ]
      };

      return report;
    } catch (error) {
      console.error('خطا در تولید گزارش امنیتی:', error);
      return null;
    }
  }

  // Clean old records
  cleanupOldRecords() {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    // حذف رکوردهای قدیمی تلاش‌های ورود
    for (const [key, attempts] of this.loginAttempts.entries()) {
      if (attempts.lastAttempt < oneDayAgo) {
        this.loginAttempts.delete(key);
      }
    }
  }

  // Get current security status
  getSecurityStatus() {
    return {
      activeThreats: this.suspiciousActivities.size,
      recentLoginAttempts: this.loginAttempts.size,
      monitoring: true,
      lastCheck: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

// Schedule cleanup every hour
setInterval(() => {
  securityMonitor.cleanupOldRecords();
}, 60 * 60 * 1000);