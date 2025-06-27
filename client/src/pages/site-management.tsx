import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Settings, Globe, Users, Database, Monitor, Shield, Zap, Package, RefreshCw, BarChart3, QrCode, Mail, MessageSquare, Factory, UserCog, Users2, DollarSign, BookOpen, TestTube, Truck, Box, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

export default function SiteManagement() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const syncProductsMutation = useMutation({
    mutationFn: () => apiRequest("/api/sync-products", "POST"),
    onSuccess: () => {
      toast({ title: "Success", description: "All products synchronized with shop successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/shop/products"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to sync products", variant: "destructive" });
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/admin")}
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Site Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive website management and configuration
              </p>
            </div>
          </div>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Website Status</CardTitle>
                  <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Online</div>
                  <p className="text-xs text-muted-foreground">All services operational</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0</div>
                  <p className="text-xs text-muted-foreground">Currently online</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">System Health</CardTitle>
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">Healthy</div>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common site management tasks - functions will be added based on your requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-green-300 text-green-600 hover:bg-green-50"
                    onClick={() => syncProductsMutation.mutate()}
                    disabled={syncProductsMutation.isPending}
                  >
                    <RefreshCw className={`h-6 w-6 mb-2 ${syncProductsMutation.isPending ? 'animate-spin' : ''}`} />
                    <span className="text-sm">{syncProductsMutation.isPending ? 'Syncing...' : 'Sync Shop'}</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => setLocation("/admin/inquiries")}
                  >
                    <BarChart3 className="h-6 w-6 mb-2" />
                    <span className="text-sm">Inquiries</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-cyan-300 text-cyan-600 hover:bg-cyan-50"
                    onClick={() => setLocation("/admin/barcode-inventory")}
                  >
                    <QrCode className="h-6 w-6 mb-2" />
                    <span className="text-sm">Barcode</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => setLocation("/admin/advanced-email-settings")}
                  >
                    <Mail className="h-6 w-6 mb-2" />
                    <span className="text-sm">Email Settings</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-slate-300 text-slate-600 hover:bg-slate-50"
                    onClick={() => setLocation("/admin/database-management")}
                  >
                    <Database className="h-6 w-6 mb-2" />
                    <span className="text-sm">Database Backup</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-pink-300 text-pink-600 hover:bg-pink-50"
                    onClick={() => setLocation("/crm")}
                  >
                    <Users className="h-6 w-6 mb-2" />
                    <span className="text-sm">CRM</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-purple-300 text-purple-600 hover:bg-purple-50"
                    onClick={() => setLocation("/seo-management")}
                  >
                    <Globe className="h-6 w-6 mb-2" />
                    <span className="text-sm">SEO</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={() => setLocation("/category-management")}
                  >
                    <Package className="h-6 w-6 mb-2" />
                    <span className="text-sm">Categories</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-green-300 text-green-600 hover:bg-green-50"
                    onClick={() => setLocation("/admin/sms-management")}
                  >
                    <MessageSquare className="h-6 w-6 mb-2" />
                    <span className="text-sm">SMS</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-purple-300 text-purple-600 hover:bg-purple-50"
                    onClick={() => setLocation("/admin/factory-management")}
                  >
                    <Factory className="h-6 w-6 mb-2" />
                    <span className="text-sm">Factory</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => setLocation("/super-admin/settings")}
                  >
                    <UserCog className="h-6 w-6 mb-2" />
                    <span className="text-sm">Super Admin</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => setLocation("/admin/user-management")}
                  >
                    <Users2 className="h-6 w-6 mb-2" />
                    <span className="text-sm">User Management</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-purple-300 text-purple-600 hover:bg-purple-50"
                    onClick={() => setLocation("/shop-admin")}
                  >
                    <DollarSign className="h-6 w-6 mb-2" />
                    <span className="text-sm">Shop</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-amber-300 text-amber-600 hover:bg-amber-50"
                    onClick={() => setLocation("/admin/procedures-management")}
                  >
                    <BookOpen className="h-6 w-6 mb-2" />
                    <span className="text-sm">Procedures</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-sky-300 text-sky-600 hover:bg-sky-50"
                    onClick={() => setLocation("/admin/smtp-test")}
                  >
                    <TestTube className="h-6 w-6 mb-2" />
                    <span className="text-sm">SMTP Test</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={() => setLocation("/admin/order-management")}
                  >
                    <Truck className="h-6 w-6 mb-2" />
                    <span className="text-sm">Order Management</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-violet-300 text-violet-600 hover:bg-violet-50"
                    onClick={() => setLocation("/admin/products")}
                  >
                    <Box className="h-6 w-6 mb-2" />
                    <span className="text-sm">Products</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-20 flex flex-col items-center justify-center border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                    onClick={() => setLocation("/admin/payment-settings")}
                  >
                    <CreditCard className="h-6 w-6 mb-2" />
                    <span className="text-sm">Payment Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>
                  Manage website content, pages, and media
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Content management functions will be added here based on your specifications.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user accounts, permissions, and access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">User management functions will be added here based on your specifications.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Configure security policies and monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Security management functions will be added here based on your specifications.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Monitoring</CardTitle>
                <CardDescription>
                  Monitor site performance and optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Performance monitoring functions will be added here based on your specifications.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">System settings functions will be added here based on your specifications.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}