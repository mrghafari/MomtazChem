// Temporary fix for critical TypeScript compilation errors
// This file temporarily disables problematic features to restore preview functionality

export const TempFix = {
  // Disable security storage until schema issues are resolved
  disableSecurityStorage: true,
  
  // Use simplified type handling for unitPrice
  convertUnitPrice: (value: any): string => {
    return String(value || "0");
  },
  
  // Mock security data to prevent undefined errors
  mockSecurityData: {
    activeThreatLevel: "low",
    systemHealthScore: 85,
    failedLogins24h: 3,
    activeAdminSessions: 2,
    recentAlerts: [],
    logs: [],
    lastScanResults: {
      vulnerabilityCount: 0,
      lastScan: new Date().toISOString(),
      status: "clean"
    }
  }
};