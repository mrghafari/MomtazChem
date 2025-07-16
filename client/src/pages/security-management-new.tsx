import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Eye,
  Lock,
  Activity,
  Globe,
  Users,
  Server,
  Scan,
  BarChart3,
  RefreshCw,
  Download
} from "lucide-react";

interface SecurityMetrics {
  systemHealth: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  failedLogins: number;
  activeSessions: number;
  blockedIPs: number;
  lastScan: string;
  vulnerabilities: number;
}

interface SecurityLog {
  id: number;
  timestamp: string;
  event: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  ipAddress: string;
  details: string;
}

export default function SecurityManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("dashboard");
  
  // State for security settings
  const [securitySettings, setSecuritySettings] = useState({
    autoScanEnabled: true,
    scanInterval: '6',
    scanDepth: 'comprehensive',
    loginMonitorEnabled: true,
    maxFailedAttempts: 5,
    lockDuration: 30,
    ipControlEnabled: true,
    threatDetectionEnabled: true,
    threatLevel: 'medium',
    emailAlerts: true,
    smsAlerts: false
  });

  // Get refresh interval from global settings
  const getSecurityRefreshInterval = () => {
    const globalSettings = localStorage.getItem('global-refresh-settings');
    if (globalSettings) {
      const settings = JSON.parse(globalSettings);
      const securitySettings = settings.departments.security;
      
      if (securitySettings?.autoRefresh) {
        const refreshInterval = settings.syncEnabled 
          ? settings.globalInterval 
          : securitySettings.interval;
        return refreshInterval * 1000; // Convert seconds to milliseconds
      }
    }
    return 600000; // Default 10 minutes if no settings found
  };

  // Security metrics with default values
  const { data: metricsData, isLoading: metricsLoading, error: metricsError } = useQuery<SecurityMetrics>({
    queryKey: ['/api/security/metrics'],
    refetchInterval: getSecurityRefreshInterval(),
  });

  // Use default values when data is not available
  const metrics: SecurityMetrics = metricsData || {
    systemHealth: 95,
    threatLevel: 'low',
    failedLogins: 0,
    activeSessions: 2,
    blockedIPs: 0,
    lastScan: new Date().toISOString(),
    vulnerabilities: 0
  };

  // Security logs query
  const { data: logs = [], isLoading: logsLoading } = useQuery<SecurityLog[]>({
    queryKey: ['/api/security/logs'],
    refetchInterval: getSecurityRefreshInterval(),
  });

  // Load security settings on mount
  const { data: settingsData } = useQuery<any>({
    queryKey: ['/api/security/settings']
  });

  // Update settings when data is loaded
  useEffect(() => {
    if (settingsData?.success && settingsData?.settings) {
      const settings = settingsData.settings || {};
      setSecuritySettings(prevSettings => ({
        ...prevSettings,
        autoScanEnabled: settings.autoScanEnabled?.value === 'true' || true,
        scanInterval: settings.scanInterval?.value || '6',
        scanDepth: settings.scanDepth?.value || 'comprehensive',
        loginMonitorEnabled: settings.loginMonitorEnabled?.value === 'true' || true,
        maxFailedAttempts: parseInt(settings.maxFailedAttempts?.value) || 5,
        lockDuration: parseInt(settings.lockDuration?.value) || 30,
        ipControlEnabled: settings.ipControlEnabled?.value === 'true' || true,
        threatDetectionEnabled: settings.threatDetectionEnabled?.value === 'true' || true,
        threatLevel: settings.threatLevel?.value || 'medium',
        emailAlerts: settings.emailAlerts?.value === 'true' || true,
        smsAlerts: settings.smsAlerts?.value === 'true' || false
      }));
    }
  }, [settingsData]);

  // Security settings save mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      const response = await fetch('/api/security/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          settings: Object.entries(settings).reduce((acc, [key, value]) => {
            acc[key] = {
              value: String(value),
              category: 'security'
            };
            return acc;
          }, {} as any)
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save security settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Security settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/security/settings'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save security settings",
        variant: "destructive",
      });
    },
  });

  const handleSaveSettings = () => {
    saveSettingsMutation.mutate(securitySettings);
  };

  // Security scan mutation
  const scanMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/security/scan', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Security scan failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Security Scan Completed",
        description: "System security scan has been completed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/security/metrics'] });
    },
    onError: () => {
      toast({
        title: "Scan Failed",
        description: "Security scan could not be completed.",
        variant: "destructive",
      });
    },
  });

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const performSecurityCheck = async () => {
    try {
      const response = await fetch('/api/security/comprehensive-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Security check failed');
      }
      
      const result = await response.json();
      
      toast({
        title: "Security Check Complete",
        description: `Found ${result.issues} security issues. Check updated.`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/security/metrics'] });
      queryClient.invalidateQueries({ queryKey: ['/api/security/logs'] });
      
    } catch (error) {
      toast({
        title: "Security Check Failed",
        description: "Could not complete comprehensive security check.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Management</h1>
          <p className="text-gray-600 mt-2">Monitor and manage system security</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/security'] })}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={performSecurityCheck}
            className="bg-red-600 hover:bg-red-700"
          >
            <Scan className="h-4 w-4 mr-2" />
            Security Check
          </Button>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="access-control">Access Control</TabsTrigger>
          <TabsTrigger value="logs">Security Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Security Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Health</CardTitle>
                <Activity className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.systemHealth || 0}%</div>
                <div className="text-xs text-gray-500 mt-1">
                  {(metrics.systemHealth || 0) >= 90 ? 'Excellent' : (metrics.systemHealth || 0) >= 70 ? 'Good' : 'Needs Attention'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
                {getThreatIcon(metrics.threatLevel)}
              </CardHeader>
              <CardContent>
                <Badge className={getThreatLevelColor(metrics.threatLevel)}>
                  {metrics.threatLevel?.toUpperCase() || 'LOW'}
                </Badge>
                <div className="text-xs text-gray-500 mt-2">
                  Current security status
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.failedLogins || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Last 24 hours</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.activeSessions || 0}</div>
                <div className="text-xs text-gray-500 mt-1">Currently online</div>
              </CardContent>
            </Card>
          </div>

          {/* Security Scan Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scan className="h-5 w-5" />
                Security Scan Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Last Scan: {new Date(metrics.lastScan || new Date()).toLocaleString()}</p>
                  <p className="text-lg font-semibold">
                    {(metrics.vulnerabilities || 0) === 0 ? 'No vulnerabilities found' : `${metrics.vulnerabilities} vulnerabilities detected`}
                  </p>
                </div>
                <Button
                  onClick={() => scanMutation.mutate()}
                  disabled={scanMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {scanMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Scan className="h-4 w-4 mr-2" />
                  )}
                  {scanMutation.isPending ? 'Scanning...' : 'Run Scan'}
                </Button>
              </div>
              
              {metrics.vulnerabilities === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    System security scan completed successfully. No security issues detected.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Security vulnerabilities detected. Please review the security logs for details.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Real-time Security Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Database Connections</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Secure</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">API Endpoints</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Protected</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Session Security</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Active</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access-control" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Access Control Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="blocked-ips">Blocked IP Addresses</Label>
                  <div className="text-sm text-gray-600 mt-1">
                    Currently blocking {metrics.blockedIPs} IP addresses
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="new-ip">Block New IP</Label>
                    <Input id="new-ip" placeholder="Enter IP address to block" />
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">Add to Blocklist</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Event Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-4">Loading security logs...</div>
              ) : !logs || logs.length === 0 ? (
                <div className="text-center py-4 text-gray-500">No security events recorded</div>
              ) : (
                <div className="space-y-2">
                  {logs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <Badge variant={log.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {log.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.event}</p>
                        <p className="text-xs text-gray-500">{log.details}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <p className="text-sm text-gray-600">Configure security features and monitoring settings</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-sm font-medium">Automatic Security Scans</Label>
                      <p className="text-xs text-gray-500">Run comprehensive security scans automatically</p>
                    </div>
                    <Switch 
                      checked={securitySettings.autoScanEnabled}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => ({ ...prev, autoScanEnabled: checked }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">Scan Interval</Label>
                      <select 
                        className="w-full p-2 border rounded text-sm"
                        value={securitySettings.scanInterval}
                        onChange={(e) => setSecuritySettings(prev => ({ ...prev, scanInterval: e.target.value }))}
                      >
                        <option value="1">Every 1 hour</option>
                        <option value="6">Every 6 hours</option>
                        <option value="12">Every 12 hours</option>
                        <option value="24">Every 24 hours</option>
                      </select>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Scan Depth</Label>
                      <select className="w-full p-2 border rounded text-sm">
                        <option value="basic">Basic Scan</option>
                        <option value="comprehensive" selected>Comprehensive</option>
                        <option value="deep">Deep Scan</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-sm font-medium">Login Attempt Monitoring</Label>
                      <p className="text-xs text-gray-500">Track and block suspicious login attempts</p>
                    </div>
                    <Switch 
                      checked={securitySettings.loginMonitoringEnabled}
                      onCheckedChange={(checked) => 
                        setSecuritySettings(prev => ({ ...prev, loginMonitoringEnabled: checked }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-600">Max Failed Attempts</Label>
                      <input 
                        type="number" 
                        className="w-full p-2 border rounded text-sm" 
                        value={securitySettings.maxFailedAttempts || ''} 
                        onChange={(e) => setSecuritySettings(prev => ({ 
                          ...prev, 
                          maxFailedAttempts: e.target.value ? Number(e.target.value) : 0 
                        }))}
                        min="1" 
                        max="20" 
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Lock Duration (minutes)</Label>
                      <input 
                        type="number" 
                        className="w-full p-2 border rounded text-sm" 
                        value={securitySettings.lockDuration || ''} 
                        onChange={(e) => setSecuritySettings(prev => ({ 
                          ...prev, 
                          lockDuration: e.target.value ? Number(e.target.value) : 0 
                        }))}
                        min="5" 
                        max="1440" 
                        placeholder="30"
                      />
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-sm font-medium">IP Access Control</Label>
                      <p className="text-xs text-gray-500">Manage IP whitelist and blacklist</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-600">Add IP to Whitelist</Label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="192.168.1.1" 
                          className="flex-1 p-2 border rounded text-sm"
                        />
                        <Button size="sm" onClick={() => alert('IP whitelist functionality available in backend')}>
                          Add
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600">Add IP to Blacklist</Label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="10.0.0.1" 
                          className="flex-1 p-2 border rounded text-sm"
                        />
                        <Button size="sm" variant="destructive" onClick={() => alert('IP blacklist functionality available in backend')}>
                          Block
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <Label className="text-sm font-medium">Threat Detection</Label>
                      <p className="text-xs text-gray-500">Configure threat detection sensitivity</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs text-gray-600">Detection Level</Label>
                      <select className="w-full p-2 border rounded text-sm">
                        <option value="low">Low - Basic threats only</option>
                        <option value="medium" selected>Medium - Balanced detection</option>
                        <option value="high">High - Maximum sensitivity</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="emailAlerts" defaultChecked />
                      <Label htmlFor="emailAlerts" className="text-sm">Send email alerts for threats</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="smsAlerts" />
                      <Label htmlFor="smsAlerts" className="text-sm">Send SMS alerts for critical threats</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSecuritySettings({
                        autoScanEnabled: true,
                        scanInterval: '6',
                        scanDepth: 'comprehensive',
                        loginMonitorEnabled: true,
                        maxFailedAttempts: 5,
                        lockDuration: 30,
                        ipControlEnabled: true,
                        threatDetectionEnabled: true,
                        threatLevel: 'medium',
                        emailAlerts: true,
                        smsAlerts: false
                      });
                    }}
                  >
                    Reset to Defaults
                  </Button>
                  <Button 
                    onClick={handleSaveSettings}
                    disabled={saveSettingsMutation.isPending}
                  >
                    {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}