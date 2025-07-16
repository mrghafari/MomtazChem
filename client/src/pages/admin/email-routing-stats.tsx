import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { RefreshCw, Mail, Router, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface EmailRouteStats {
  categoryKey: string;
  categoryName: string;
  totalEmails: number;
  successfulEmails: number;
  failedEmails: number;
  lastEmailSent: string | null;
  hasSmtpConfig: boolean;
  hasRecipients: boolean;
  recentEmails: Array<{
    id: number;
    toEmail: string;
    subject: string;
    status: string;
    sentAt: string;
    errorMessage?: string;
  }>;
}

const EmailRoutingStats = () => {
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Get refresh interval from global settings
  const getRefreshInterval = () => {
    const globalSettings = localStorage.getItem('global-refresh-settings');
    if (globalSettings) {
      const settings = JSON.parse(globalSettings);
      const emailSettings = settings.departments.email;
      
      if (emailSettings?.autoRefresh) {
        const refreshInterval = settings.syncEnabled 
          ? settings.globalInterval 
          : emailSettings.interval;
        return refreshInterval * 1000; // Convert seconds to milliseconds
      }
    }
    return false; // Disable auto-refresh if no settings found
  };

  const { data: routingStats, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/email/routing-stats'],
    refetchInterval: autoRefresh ? getRefreshInterval() : false,
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/admin/email/categories'],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-50';
      case 'failed': return 'text-red-600 bg-red-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getConfigStatus = (hasSmtp: boolean, hasRecipients: boolean) => {
    if (hasSmtp && hasRecipients) {
      return { icon: CheckCircle, color: 'text-green-600', text: 'Fully Configured' };
    } else if (hasSmtp || hasRecipients) {
      return { icon: AlertTriangle, color: 'text-yellow-600', text: 'Partial Config' };
    } else {
      return { icon: XCircle, color: 'text-red-600', text: 'Not Configured' };
    }
  };

  const productCategoryMapping = {
    'fuel-additives': 'Fuel Additives',
    'water-treatment': 'Water Treatment',
    'paint-thinner': 'Paint & Thinner',
    'agricultural-fertilizers': 'Agricultural Fertilizers',
    'other': 'Other Products',
    'custom-solutions': 'Custom Solutions'
  };

  const emailRouting = {
    'fuel-additives': 'fuel-additives',
    'water-treatment': 'water-treatment',
    'paint-thinner': 'paint-thinner',
    'agricultural-fertilizers': 'agricultural-fertilizers',
    'other': 'notifications (Support)',
    'custom-solutions': 'orders (Sales department)'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Email Routing Statistics</h1>
          <p className="text-gray-600">Monitor intelligent email routing performance and configuration</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Routing Map Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Router className="h-5 w-5" />
            Contact Form Routing Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(productCategoryMapping).map(([key, productName]) => (
              <div key={key} className="p-4 border rounded-lg bg-gray-50">
                <div className="font-medium text-sm text-gray-700 mb-1">Product Category</div>
                <div className="font-semibold mb-2">{productName}</div>
                <div className="text-sm text-gray-600">
                  <Router className="h-3 w-3 inline mr-1" />
                  Routes to: <span className="font-medium text-blue-600">{emailRouting[key as keyof typeof emailRouting]}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories?.categories?.map((category: any) => {
          const stats = routingStats?.stats?.find((s: EmailRouteStats) => s.categoryKey === category.categoryKey);
          const successRate = stats ? (stats.successfulEmails / Math.max(stats.totalEmails, 1)) * 100 : 0;
          const configStatus = getConfigStatus(stats?.hasSmtpConfig || false, stats?.hasRecipients || false);

          return (
            <Card key={category.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{category.categoryName}</CardTitle>
                <div className="flex items-center gap-2">
                  <configStatus.icon className={`h-4 w-4 ${configStatus.color}`} />
                  <span className={`text-xs ${configStatus.color}`}>{configStatus.text}</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total Emails:</span>
                    <span className="font-medium">{stats?.totalEmails || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Success Rate:</span>
                    <span className="font-medium">{successRate.toFixed(1)}%</span>
                  </div>
                  <Progress value={successRate} className="h-2" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>✓ {stats?.successfulEmails || 0}</span>
                    <span>✗ {stats?.failedEmails || 0}</span>
                  </div>
                  {stats?.lastEmailSent && (
                    <div className="text-xs text-gray-500 mt-2">
                      Last: {new Date(stats.lastEmailSent).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Email Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Recent Email Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading email statistics...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent At</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routingStats?.recentEmails?.map((email: any) => (
                  <TableRow key={email.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {email.categoryName}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{email.toEmail}</TableCell>
                    <TableCell className="max-w-xs truncate">{email.subject}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(email.status)}>
                        {email.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {new Date(email.sentAt).toLocaleString()}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {email.errorMessage && (
                        <span className="text-xs text-red-600 truncate" title={email.errorMessage}>
                          {email.errorMessage}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!routingStats?.recentEmails || routingStats.recentEmails.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No recent email activity found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailRoutingStats;