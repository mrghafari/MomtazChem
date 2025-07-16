import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Eye, 
  Ban, 
  Check, 
  X, 
  Search, 
  RefreshCw, 
  Settings, 
  Lock, 
  Unlock,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  Globe,
  Download,
  Play,
  Pause,
  BarChart3
} from "lucide-react";

interface SecurityDashboard {
  recentAlerts: SecurityAlert[];
  activeThreatLevel: string;
  suspiciousActivities: number;
  failedLogins24h: number;
  activeAdminSessions: number;
  lastScanResults: SecurityScan[];
  criticalIssues: number;
  ipBlacklist: number;
  systemHealthScore: number;
}

interface SecurityAlert {
  id: number;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
}

interface SecurityScan {
  id: number;
  scanType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
}

interface SecurityLog {
  id: number;
  eventType: string;
  severity: string;
  description: string;
  ipAddress?: string;
  username?: string;
  createdAt: string;
}

interface IpAccessControl {
  id: number;
  ipAddress: string;
  type: string;
  reason?: string;
  category: string;
  createdAt: string;
}

interface SecuritySetting {
  id: number;
  setting: string;
  value: string;
  category: string;
  description?: string;
}

const ipAccessSchema = z.object({
  ipAddress: z.string().min(1, "IP address is required"),
  type: z.enum(["blacklist", "whitelist"]),
  reason: z.string().optional(),
  category: z.string().min(1, "Category is required"),
});

const securitySettingSchema = z.object({
  setting: z.string().min(1, "Setting name is required"),
  value: z.string().min(1, "Value is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

export default function SecurityManagement() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isAddIpDialogOpen, setIsAddIpDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Fetch security dashboard data
  const { data: dashboard, isLoading: dashboardLoading } = useQuery({
    queryKey: ["/api/security/dashboard"],
    refetchInterval: getSecurityRefreshInterval(),
  });

  // Fetch security logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/security/logs"],
  });

  // Fetch IP access control list
  const { data: ipAccessList, isLoading: ipLoading } = useQuery({
    queryKey: ["/api/security/ip-access"],
  });

  // Fetch security settings
  const { data: securitySettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/security/settings"],
  });

  // Add IP to access control
  const addIpMutation = useMutation({
    mutationFn: (data: z.infer<typeof ipAccessSchema>) =>
      apiRequest("/api/security/ip-access", "POST", data),
    onSuccess: () => {
      toast({
        title: "IP Access Updated",
        description: "IP address has been added to access control",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/security/ip-access"] });
      setIsAddIpDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update IP access control",
        variant: "destructive",
      });
    },
  });

  // Remove IP from access control
  const removeIpMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/security/ip-access/${id}`, "DELETE"),
    onSuccess: () => {
      toast({
        title: "IP Access Updated",
        description: "IP address has been removed from access control",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/security/ip-access"] });
    },
  });

  // Start security scan
  const startScanMutation = useMutation({
    mutationFn: (scanType: string) =>
      apiRequest("/api/security/scan", "POST", { scanType }),
    onSuccess: () => {
      toast({
        title: "Security Scan Started",
        description: "Security scan has been initiated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/security/dashboard"] });
    },
  });

  // Update security setting
  const updateSettingMutation = useMutation({
    mutationFn: (data: z.infer<typeof securitySettingSchema>) =>
      apiRequest("/api/security/settings", "POST", data),
    onSuccess: () => {
      toast({
        title: "Setting Updated",
        description: "Security setting has been updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/security/settings"] });
      setIsSettingsDialogOpen(false);
    },
  });

  const ipForm = useForm<z.infer<typeof ipAccessSchema>>({
    resolver: zodResolver(ipAccessSchema),
    defaultValues: {
      type: "blacklist",
      category: "admin",
    },
  });

  const settingsForm = useForm<z.infer<typeof securitySettingSchema>>({
    resolver: zodResolver(securitySettingSchema),
    defaultValues: {
      category: "auth",
    },
  });

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getThreatLevelIcon = (level: string) => {
    switch (level) {
      case "critical": return <AlertTriangle className="h-4 w-4" />;
      case "high": return <AlertCircle className="h-4 w-4" />;
      case "medium": return <Activity className="h-4 w-4" />;
      case "low": return <CheckCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Management
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage website security, access control, and threat detection
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/security"] })}
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="logs">Security Logs</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="scans">Security Scans</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Security Dashboard */}
        <TabsContent value="dashboard" className="space-y-6">
          {dashboardLoading ? (
            <div className="text-center py-8">Loading dashboard...</div>
          ) : dashboard ? (
            <>
              {/* Threat Level Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Threat Level</CardTitle>
                    {getThreatLevelIcon(dashboard.activeThreatLevel)}
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      <Badge variant={getThreatLevelColor(dashboard.activeThreatLevel)}>
                        {dashboard.activeThreatLevel.toUpperCase()}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">System Health</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard.systemHealthScore}%</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.systemHealthScore >= 90 ? "Excellent" : 
                       dashboard.systemHealthScore >= 70 ? "Good" :
                       dashboard.systemHealthScore >= 50 ? "Fair" : "Poor"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Failed Logins (24h)</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard.failedLogins24h}</div>
                    <p className="text-xs text-muted-foreground">
                      {dashboard.failedLogins24h > 10 ? "High activity" : "Normal"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dashboard.activeAdminSessions}</div>
                    <p className="text-xs text-muted-foreground">Admin sessions</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Alerts */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Security Alerts</CardTitle>
                  <CardDescription>Latest security events requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  {dashboard.recentAlerts.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No recent security alerts</p>
                  ) : (
                    <div className="space-y-3">
                      {dashboard.recentAlerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge variant={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <div>
                              <p className="font-medium">{alert.title}</p>
                              <p className="text-sm text-gray-600">{alert.description}</p>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(alert.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Security Actions</CardTitle>
                  <CardDescription>Common security management tasks</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    onClick={() => startScanMutation.mutate("vulnerability")}
                    disabled={startScanMutation.isPending}
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <Search className="h-6 w-6" />
                    <span className="text-sm">Vulnerability Scan</span>
                  </Button>
                  
                  <Button 
                    onClick={() => startScanMutation.mutate("file_integrity")}
                    disabled={startScanMutation.isPending}
                    variant="outline"
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <Shield className="h-6 w-6" />
                    <span className="text-sm">File Integrity</span>
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab("access")}
                    variant="outline"
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <Ban className="h-6 w-6" />
                    <span className="text-sm">IP Management</span>
                  </Button>
                  
                  <Button 
                    onClick={() => setActiveTab("settings")}
                    variant="outline"
                    className="h-20 flex flex-col items-center gap-2"
                  >
                    <Settings className="h-6 w-6" />
                    <span className="text-sm">Security Settings</span>
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-8">Failed to load dashboard</div>
          )}
        </TabsContent>

        {/* Security Alerts */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts</CardTitle>
              <CardDescription>Monitor and manage security alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8">Security alerts management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Security Event Logs</CardTitle>
              <CardDescription>Detailed security event history</CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8">Loading logs...</div>
              ) : logsData?.logs ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsData.logs.map((log: SecurityLog) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{log.eventType}</TableCell>
                        <TableCell>
                          <Badge variant={getSeverityColor(log.severity)}>
                            {log.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.description}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ipAddress || "-"}
                        </TableCell>
                        <TableCell>{log.username || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">No security logs available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control */}
        <TabsContent value="access">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>IP Access Control</CardTitle>
                <CardDescription>Manage IP blacklist and whitelist</CardDescription>
              </div>
              <Dialog open={isAddIpDialogOpen} onOpenChange={setIsAddIpDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Ban className="h-4 w-4 mr-2" />
                    Add IP Rule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add IP Access Rule</DialogTitle>
                    <DialogDescription>
                      Add an IP address to blacklist or whitelist
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...ipForm}>
                    <form onSubmit={ipForm.handleSubmit((data) => addIpMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={ipForm.control}
                        name="ipAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>IP Address</FormLabel>
                            <FormControl>
                              <Input placeholder="192.168.1.1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={ipForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="blacklist">Blacklist</SelectItem>
                                <SelectItem value="whitelist">Whitelist</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={ipForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="api">API</SelectItem>
                                <SelectItem value="general">General</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={ipForm.control}
                        name="reason"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reason (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Reason for blocking/allowing this IP..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={addIpMutation.isPending}>
                        {addIpMutation.isPending ? "Adding..." : "Add IP Rule"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {ipLoading ? (
                <div className="text-center py-8">Loading IP access rules...</div>
              ) : ipAccessList ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipAccessList.map((ip: IpAccessControl) => (
                      <TableRow key={ip.id}>
                        <TableCell className="font-mono">{ip.ipAddress}</TableCell>
                        <TableCell>
                          <Badge variant={ip.type === 'blacklist' ? 'destructive' : 'default'}>
                            {ip.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{ip.category}</TableCell>
                        <TableCell>{ip.reason || "-"}</TableCell>
                        <TableCell className="text-sm">
                          {new Date(ip.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeIpMutation.mutate(ip.id)}
                            disabled={removeIpMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">No IP access rules configured</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Scans */}
        <TabsContent value="scans">
          <Card>
            <CardHeader>
              <CardTitle>Security Scans</CardTitle>
              <CardDescription>Automated security scanning and vulnerability assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Button
                  onClick={() => startScanMutation.mutate("vulnerability")}
                  disabled={startScanMutation.isPending}
                  className="h-24 flex flex-col items-center gap-2"
                >
                  <Search className="h-8 w-8" />
                  <span>Vulnerability Scan</span>
                </Button>
                
                <Button
                  onClick={() => startScanMutation.mutate("file_integrity")}
                  disabled={startScanMutation.isPending}
                  variant="outline"
                  className="h-24 flex flex-col items-center gap-2"
                >
                  <Shield className="h-8 w-8" />
                  <span>File Integrity Check</span>
                </Button>
                
                <Button
                  onClick={() => startScanMutation.mutate("permission_audit")}
                  disabled={startScanMutation.isPending}
                  variant="outline"
                  className="h-24 flex flex-col items-center gap-2"
                >
                  <Lock className="h-8 w-8" />
                  <span>Permission Audit</span>
                </Button>
              </div>

              {dashboard?.lastScanResults && dashboard.lastScanResults.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Recent Scan Results</h3>
                  {dashboard.lastScanResults.map((scan: SecurityScan) => (
                    <div key={scan.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{scan.scanType.replace('_', ' ').toUpperCase()}</h4>
                          <p className="text-sm text-gray-600">
                            Started: {new Date(scan.startedAt).toLocaleString()}
                          </p>
                          {scan.completedAt && (
                            <p className="text-sm text-gray-600">
                              Completed: {new Date(scan.completedAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <Badge variant={scan.status === 'completed' ? 'default' : 'secondary'}>
                          {scan.status}
                        </Badge>
                      </div>
                      
                      {scan.status === 'completed' && (
                        <div className="grid grid-cols-4 gap-4 mt-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{scan.criticalIssues}</p>
                            <p className="text-sm text-gray-600">Critical</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">{scan.highIssues}</p>
                            <p className="text-sm text-gray-600">High</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">{scan.mediumIssues}</p>
                            <p className="text-sm text-gray-600">Medium</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{scan.lowIssues}</p>
                            <p className="text-sm text-gray-600">Low</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="settings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure security parameters and policies</CardDescription>
              </div>
              <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Settings className="h-4 w-4 mr-2" />
                    Add Setting
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Security Setting</DialogTitle>
                    <DialogDescription>
                      Configure a new security parameter
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...settingsForm}>
                    <form onSubmit={settingsForm.handleSubmit((data) => updateSettingMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={settingsForm.control}
                        name="setting"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Setting Name</FormLabel>
                            <FormControl>
                              <Input placeholder="max_login_attempts" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={settingsForm.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Value</FormLabel>
                            <FormControl>
                              <Input placeholder="5" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={settingsForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="auth">Authentication</SelectItem>
                                <SelectItem value="upload">File Upload</SelectItem>
                                <SelectItem value="access">Access Control</SelectItem>
                                <SelectItem value="monitoring">Monitoring</SelectItem>
                                <SelectItem value="general">General</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={settingsForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Description of this setting..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" disabled={updateSettingMutation.isPending}>
                        {updateSettingMutation.isPending ? "Saving..." : "Save Setting"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {settingsLoading ? (
                <div className="text-center py-8">Loading settings...</div>
              ) : securitySettings ? (
                <div className="space-y-6">
                  {Object.entries(
                    securitySettings.reduce((acc: any, setting: SecuritySetting) => {
                      if (!acc[setting.category]) acc[setting.category] = [];
                      acc[setting.category].push(setting);
                      return acc;
                    }, {})
                  ).map(([category, settings]: [string, any]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold mb-3 capitalize">{category}</h3>
                      <div className="grid gap-4">
                        {settings.map((setting: SecuritySetting) => (
                          <div key={setting.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="font-medium">{setting.setting}</p>
                              <p className="text-sm text-gray-600">{setting.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{setting.value}</Badge>
                              <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">No security settings configured</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}