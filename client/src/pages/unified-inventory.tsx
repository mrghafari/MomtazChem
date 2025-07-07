import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Icons
import { 
  Package, 
  Bell, 
  Settings, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  XCircle,
  TrendingUp
} from "lucide-react";

// Import existing components
import InventoryAlerts from "@/pages/admin/inventory-alerts";
import InventoryNotificationSettings from "@/pages/admin/inventory-notification-settings";

// Types
import { ShopProduct } from "@shared/shop-schema";

// Helper functions
const getActualInventoryStatus = (stock: number | null, threshold: number | null) => {
  const currentStock = stock || 0;
  const minLevel = threshold || 10;
  
  if (currentStock === 0) return 'out_of_stock';
  if (currentStock <= minLevel) return 'low_stock';
  return 'in_stock';
};

export default function UnifiedInventory() {
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch products for statistics
  const { data: products = [], isLoading } = useQuery<ShopProduct[]>({
    queryKey: ["/api/shop/products"],
    staleTime: 0,
    gcTime: 0,
  });

  // Statistics calculations
  const inventoryStats = {
    totalProducts: products.length,
    inStockProducts: products.filter(p => getActualInventoryStatus(p.stockQuantity, p.lowStockThreshold) === 'in_stock').length,
    lowStockProducts: products.filter(p => getActualInventoryStatus(p.stockQuantity, p.lowStockThreshold) === 'low_stock').length,
    outOfStockProducts: products.filter(p => getActualInventoryStatus(p.stockQuantity, p.lowStockThreshold) === 'out_of_stock').length,
    activeAlerts: products.filter(p => getActualInventoryStatus(p.stockQuantity, p.lowStockThreshold) !== 'in_stock').length,
    lastUpdateTime: new Date().toLocaleString('en-US')
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Unified Inventory Management</h1>
          <p className="text-gray-600 mt-2">
            Complete inventory control, alerts, and automated notifications
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Last update: {inventoryStats.lastUpdateTime}
          </Badge>
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Products</p>
                <p className="text-2xl font-bold text-blue-800">{inventoryStats.totalProducts}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">In Stock</p>
                <p className="text-2xl font-bold text-green-800">{inventoryStats.inStockProducts}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-800">{inventoryStats.lowStockProducts}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Out of Stock</p>
                <p className="text-2xl font-bold text-red-800">{inventoryStats.outOfStockProducts}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest inventory changes and alerts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {inventoryStats.activeAlerts > 0 ? (
                  <>
                    {products.filter(p => getActualInventoryStatus(p.stockQuantity, p.lowStockThreshold) === 'out_of_stock').slice(0, 2).map((product) => (
                      <div key={product.id} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Out of Stock Alert</p>
                          <p className="text-xs text-gray-600">{product.name} - Stock: {product.stockQuantity || 0}</p>
                        </div>
                        <Badge variant="destructive">Critical</Badge>
                      </div>
                    ))}
                    {products.filter(p => getActualInventoryStatus(p.stockQuantity, p.lowStockThreshold) === 'low_stock').slice(0, 2).map((product) => (
                      <div key={product.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Low Stock Warning</p>
                          <p className="text-xs text-gray-600">{product.name} - Stock: {product.stockQuantity || 0}</p>
                        </div>
                        <Badge variant="secondary">Warning</Badge>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">All Good!</p>
                      <p className="text-xs text-gray-600">No critical inventory issues</p>
                    </div>
                    <Badge variant="outline">Healthy</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Rapid access to key functions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("alerts")}
                >
                  <Bell className="w-4 h-4" />
                  View All Alerts
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="w-4 h-4" />
                  Notification Settings
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => setActiveTab("analytics")}
                >
                  <BarChart3 className="w-4 h-4" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle>System Status</CardTitle>
              <CardDescription>
                Overall inventory management system health
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <p className="font-medium text-green-900">Notification System</p>
                    <p className="text-sm text-green-600">Active & Operational</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Bell className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="font-medium text-blue-900">Stock Monitoring</p>
                    <p className="text-sm text-blue-600">Real-time Updates</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <Users className="w-6 h-6 text-purple-500" />
                  <div>
                    <p className="font-medium text-purple-900">Active Products</p>
                    <p className="text-sm text-purple-600">{inventoryStats.totalProducts} items tracked</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts">
          <InventoryAlerts />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <InventoryNotificationSettings />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Analytics</CardTitle>
              <CardDescription>
                Detailed analysis of inventory trends and performance
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Advanced Analytics Coming Soon</p>
              <p className="text-sm text-gray-500">
                Detailed inventory analysis, consumption patterns, and demand forecasting
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}