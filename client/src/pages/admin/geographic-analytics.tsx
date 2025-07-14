import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { MapPin, Package, TrendingUp, Users, DollarSign, ShoppingCart, Calendar, Download, Filter, ArrowUpDown, ArrowUp, ArrowDown, Navigation, Target, Clock, CheckCircle, AlertTriangle } from "lucide-react";

interface GeographicData {
  region: string;
  country: string;
  city: string;
  totalOrders: number;
  totalRevenue: number;
  customerCount: number;
  avgOrderValue: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
}

interface ProductAnalytics {
  name: string;
  category: string;
  totalSales: number;
  revenue: number;
  regions: Array<{
    region: string;
    city: string;
    quantity: number;
    revenue: number;
  }>;
}

interface TimeSeriesData {
  date: string;
  orders: number;
  revenue: number;
  regions: { [key: string]: number };
}

interface GpsDeliveryData {
  id: number;
  deliveryVerificationId: number;
  customerOrderId: number;
  latitude: string;
  longitude: string;
  accuracy: string;
  deliveryPersonName: string;
  deliveryPersonPhone: string;
  addressMatched: boolean;
  customerAddress: string;
  detectedAddress: string;
  distanceFromCustomer: string;
  country: string;
  city: string;
  region: string;
  verificationTime: string;
  deliveryNotes: string;
}

interface GpsDeliveryStats {
  totalDeliveries: number;
  successfulDeliveries: number;
  averageAccuracy: number;
  coverageCountries: number;
  coverageCities: number;
  uniqueDeliveryPersons: number;
  analytics: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function GeographicAnalytics() {
  const [dateRange, setDateRange] = useState("30d");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sorting function
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get sort icon
  const getSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // English translations
  const t = {
    title: "Geographic Analytics",
    subtitle: "Track sales performance by region and product",
    totalRevenue: "Total Revenue",
    totalOrders: "Total Orders", 
    customers: "Customers",
    regions: "Regions",
    avgOrderValue: "Average Order Value",
    export: "Export",
    loading: "Loading analytics data...",
    last7Days: "Last 7 Days",
    last30Days: "Last 30 Days", 
    last3Months: "Last 3 Months",
    lastYear: "Last Year",
    regionalAnalysis: "Regional Analysis",
    productPerformance: "Product Performance",
    trends: "Trends",
    revenueByRegion: "Revenue by Region",
    ordersByRegion: "Orders by Region",
    topRegions: "Top Regions",
    productSales: "Product Sales",
    revenueDistribution: "Revenue Distribution",
    topProducts: "Top Products",
    salesTrends: "Sales Trends Over Time",
    orders: "Orders",
    revenue: "Revenue",
    unitsSold: "Units Sold"
  };

  // Fetch geographic sales data
  const { data: geoResult, isLoading: geoLoading } = useQuery<{data: GeographicData[], summary?: {totalUniqueCustomers: number}}>({
    queryKey: ['/api/analytics/geographic', dateRange, selectedRegion],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/geographic?period=${dateRange}&region=${selectedRegion}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch geographic data');
      const result = await response.json();
      return result || { data: [], summary: { totalUniqueCustomers: 0 } };
    }
  });

  const geoData = geoResult?.data || [];
  const totalUniqueCustomers = geoResult?.summary?.totalUniqueCustomers || 0;

  // Fetch product analytics
  const { data: productData, isLoading: productLoading } = useQuery<ProductAnalytics[]>({
    queryKey: ['/api/analytics/products', dateRange, selectedProduct],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/products?period=${dateRange}&product=${selectedProduct}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch product data');
      const result = await response.json();
      return result.data || [];
    }
  });

  // Fetch time series data
  const { data: timeData, isLoading: timeLoading } = useQuery<TimeSeriesData[]>({
    queryKey: ['/api/analytics/timeseries', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/timeseries?period=${dateRange}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch time series data');
      const result = await response.json();
      return result.data || [];
    }
  });

  // Fetch GPS delivery confirmations data  
  const { data: gpsDeliveries, isLoading: gpsLoading } = useQuery<GpsDeliveryData[]>({
    queryKey: ['/api/gps-delivery/confirmations'],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7); // Last 7 days instead of 30
      const endDate = new Date();
      
      const response = await fetch(`/api/gps-delivery/confirmations?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=100`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch GPS delivery confirmations');
      const result = await response.json();
      return result.data || [];
    }
  });

  // Fetch GPS delivery performance stats
  const { data: gpsStats, isLoading: gpsStatsLoading } = useQuery<GpsDeliveryStats>({
    queryKey: ['/api/gps-delivery/performance'],
    queryFn: async () => {
      const response = await fetch('/api/gps-delivery/performance?period=30', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch GPS stats');
      const result = await response.json();
      return result.data || { totalDeliveries: 0, successfulDeliveries: 0, averageAccuracy: 0, coverageCountries: 0, coverageCities: 0, uniqueDeliveryPersons: 0, analytics: [] };
    }
  });

  // Fetch GPS analytics data
  const gpsAnalytics = useQuery({
    queryKey: ['/api/gps-delivery/analytics', 'Iraq'],
    queryFn: async () => {
      const response = await fetch('/api/gps-delivery/analytics?country=Iraq', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch GPS analytics');
      const result = await response.json();
      console.log('🔍 [GPS-ANALYTICS] Data received:', result);
      return result && result.data ? result.data : [];
    }
  });

  // Fetch GPS heatmap data  
  const gpsHeatmap = useQuery({
    queryKey: ['/api/gps-delivery/heatmap', 'Iraq'],
    queryFn: async () => {
      const response = await fetch('/api/gps-delivery/heatmap?country=Iraq', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch GPS heatmap');
      const result = await response.json();
      console.log('🗺️ [GPS-HEATMAP] Data received:', result);
      return result && result.data ? result.data : [];
    }
  });

  // Fetch product trends data
  const { data: productTrendsData, isLoading: trendsLoading } = useQuery({
    queryKey: ['/api/analytics/product-trends', dateRange, selectedProduct],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/product-trends?period=${dateRange}&product=${selectedProduct}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch product trends');
      const result = await response.json();
      return result.data || [];
    }
  });

  // Calculate summary statistics
  const summaryStats = geoData ? {
    totalRevenue: geoData.reduce((sum, region) => sum + region.totalRevenue, 0),
    totalOrders: geoData.reduce((sum, region) => sum + region.totalOrders, 0),
    totalCustomers: totalUniqueCustomers, // Use actual unique customers count from backend
    regionsCount: geoData.length,
    avgOrderValue: geoData.reduce((sum, region) => sum + region.totalRevenue, 0) / geoData.reduce((sum, region) => sum + region.totalOrders, 0) || 0
  } : null;

  // Prepare chart data
  const regionChartData = geoData?.map(region => ({
    name: `${region.city}, ${region.country}`,
    revenue: region.totalRevenue,
    orders: region.totalOrders,
    customers: region.customerCount
  })) || [];

  const productChartData = productData?.map(product => ({
    name: product.name,
    sales: product.totalSales,
    revenue: product.revenue
  })) || [];

  const topRegions = geoData?.sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10) || [];
  const topProducts = productData?.sort((a, b) => b.revenue - a.revenue).slice(0, 10) || [];

  // Create flattened and sorted product-region data for table
  const getSortedProductRegionData = () => {
    if (!productData) return [];
    
    const flatData: any[] = [];
    productData.forEach(product => {
      if (product.regions && product.regions.length > 0) {
        product.regions.forEach(region => {
          flatData.push({
            productName: product.name,
            category: product.category,
            region: region.region,
            city: region.city,
            quantity: region.quantity,
            revenue: region.revenue
          });
        });
      } else {
        flatData.push({
          productName: product.name,
          category: product.category,
          region: null,
          city: null,
          quantity: 0,
          revenue: 0
        });
      }
    });

    // Apply sorting
    if (sortField) {
      flatData.sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];
        
        // Handle null/undefined values
        if (aVal === null || aVal === undefined) aVal = '';
        if (bVal === null || bVal === undefined) bVal = '';
        
        // Convert to string for text comparisons
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (sortDirection === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    return flatData;
  };

  const sortedProductRegionData = getSortedProductRegionData();

  if (geoLoading || productLoading || timeLoading || trendsLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>
        <div className="flex gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t.last7Days}</SelectItem>
              <SelectItem value="30d">{t.last30Days}</SelectItem>
              <SelectItem value="90d">{t.last3Months}</SelectItem>
              <SelectItem value="1y">{t.lastYear}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            {t.export}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.totalRevenue}</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summaryStats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalCustomers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regions</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.regionsCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${summaryStats.avgOrderValue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="regions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="regions">Regional Analysis</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="product-regions">Products by Region</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="gps-tracking">GPS Delivery Tracking</TabsTrigger>
        </TabsList>

        {/* Regional Analysis */}
        <TabsContent value="regions" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue by Region Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Orders by Region Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Orders by Region</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={regionChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Regions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Regions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topRegions.map((region, index) => (
                  <div key={`${region.country}-${region.city}`} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="secondary">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{region.city}, {region.country}</p>
                        <p className="text-sm text-gray-600">{region.customerCount} customers</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${region.totalRevenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">{region.totalOrders} orders</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Performance */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Product Sales Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Product Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sales" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Product Revenue Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={productChartData.slice(0, 6)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {productChartData.slice(0, 6).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Product Sales Trends Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Product Sales Trends Over Time</CardTitle>
              <p className="text-sm text-gray-600">Track how much each product sold during the selected period</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart
                  data={timeData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'orders' ? `${value} orders` : `$${value.toFixed(2)}`,
                      name === 'orders' ? 'Orders' : 'Revenue'
                    ]}
                  />
                  <Line type="monotone" dataKey="orders" stroke="#8884d8" strokeWidth={2} name="orders" />
                  <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} name="revenue" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Product Sales by Region - Complete Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Product Sales by Region - Complete Breakdown</CardTitle>
              <p className="text-sm text-gray-600">Detailed analysis of product performance across different regions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {productData && productData.length > 0 ? (
                  productData.slice(0, 10).map((product: any, index: number) => (
                    <div key={product.name} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">{product.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <Badge variant="outline">{product.category || 'Chemical Product'}</Badge>
                            <span>Total Sales: {product.totalSales || 0} units</span>
                            <span>Total Revenue: {(product.revenue || 0).toFixed(2)} IQD</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Regional Breakdown */}
                      {product.regions && product.regions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {product.regions.map((region: any, regionIndex: number) => (
                            <div key={regionIndex} className="bg-gray-50 p-3 rounded-lg">
                              <h4 className="font-medium text-sm">{region.region} - {region.city}</h4>
                              <div className="flex justify-between text-sm text-gray-600 mt-1">
                                <span>Quantity: {region.quantity} units</span>
                                <span>Revenue: {region.revenue.toFixed(2)} IQD</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-600 mb-4">
                          Regional breakdown data is being consolidated. This product has been sold but specific regional data is not yet available.
                        </div>
                      )}
                      
                      {/* Product Performance Chart */}
                      {productTrendsData && productTrendsData.filter((trend: any) => trend.productName === product.name).length > 0 && (
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={productTrendsData.filter((trend: any) => trend.productName === product.name)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip 
                              formatter={(value: any, name: string) => [
                                name === 'quantity' ? `${value} units sold` : `${Number(value).toFixed(2)} IQD revenue`,
                                name === 'quantity' ? 'Daily Sales' : 'Daily Revenue'
                              ]}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="quantity" 
                              stroke={COLORS[index % COLORS.length]} 
                              strokeWidth={2} 
                              name="quantity"
                            />
                            <Line 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke={COLORS[(index + 1) % COLORS.length]} 
                              strokeWidth={2} 
                              strokeDasharray="5 5"
                              name="revenue"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No product trends data available for the selected period
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Product Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Product Performance Summary</CardTitle>
              <p className="text-sm text-gray-600">Overall sales comparison across all products</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={productChartData.slice(0, 10)}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 80,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'sales' ? `${value} units` : `$${value.toFixed(2)}`,
                      name === 'sales' ? 'Units Sold' : 'Revenue'
                    ]}
                  />
                  <Bar dataKey="sales" fill="#0088FE" name="sales" />
                  <Bar dataKey="revenue" fill="#00C49F" name="revenue" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Products with Regional Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Products by Region - Detailed Breakdown</CardTitle>
              <p className="text-sm text-gray-600">Which products sold how much in which regions</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {topProducts.map((product, index) => (
                  <div key={product.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium text-lg">{product.name}</p>
                          <p className="text-sm text-gray-600">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">${product.revenue.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">{product.totalSales} units total</p>
                      </div>
                    </div>
                    
                    {/* Regional breakdown for this product */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h4 className="font-medium mb-3 text-sm">Sales by Region:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {product.regions && product.regions.length > 0 ? (
                          product.regions.map((region: any) => (
                            <div key={region.region} className="bg-white rounded p-3 border">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{region.region}</span>
                                <MapPin className="h-4 w-4 text-gray-400" />
                              </div>
                              <div className="mt-2">
                                <p className="text-sm text-green-600 font-medium">${(region.revenue || 0).toFixed(2)}</p>
                                <p className="text-xs text-gray-500">{region.quantity || 0} units</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full text-center text-gray-500 text-sm">
                            No regional data available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products by Region - Detailed Table */}
        <TabsContent value="product-regions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Sales by Region - Complete Breakdown</CardTitle>
              <p className="text-sm text-gray-600">Detailed view of which products sold where and how much revenue was generated</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        <button 
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                          onClick={() => handleSort('productName')}
                        >
                          Product Name
                          {getSortIcon('productName')}
                        </button>
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        <button 
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                          onClick={() => handleSort('category')}
                        >
                          Category
                          {getSortIcon('category')}
                        </button>
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        <button 
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                          onClick={() => handleSort('region')}
                        >
                          Country
                          {getSortIcon('region')}
                        </button>
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-left">
                        <button 
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors"
                          onClick={() => handleSort('city')}
                        >
                          City
                          {getSortIcon('city')}
                        </button>
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right">
                        <button 
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors ml-auto"
                          onClick={() => handleSort('quantity')}
                        >
                          Units Sold
                          {getSortIcon('quantity')}
                        </button>
                      </th>
                      <th className="border border-gray-300 px-4 py-2 text-right">
                        <button 
                          className="flex items-center gap-2 hover:text-blue-600 transition-colors ml-auto"
                          onClick={() => handleSort('revenue')}
                        >
                          Revenue
                          {getSortIcon('revenue')}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProductRegionData.map((row, index) => (
                      <tr key={`${row.productName}-${row.region}-${index}`} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2 font-medium">
                          {row.productName}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-gray-600">
                          {row.category}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {row.region ? (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {row.region}
                            </div>
                          ) : (
                            <span className="text-gray-500 italic">No regional data</span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {row.city || (row.region ? 'Various Cities' : '-')}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right">
                          {row.quantity || 0}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-medium text-green-600">
                          ${(row.revenue || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" name="Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue ($)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GPS Delivery Tracking */}
        <TabsContent value="gps-tracking" className="space-y-6">
          {gpsLoading || gpsStatsLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-600">Loading GPS delivery data...</p>
            </div>
          ) : (
            <>
              {/* GPS Summary Cards */}
              {gpsStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
                      <Navigation className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600">{gpsStats.totalDeliveries}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Successful</CardTitle>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">{gpsStats.successfulDeliveries}</div>
                      <p className="text-xs text-gray-600">
                        {gpsStats.totalDeliveries > 0 ? 
                          `${((gpsStats.successfulDeliveries / gpsStats.totalDeliveries) * 100).toFixed(1)}% success rate` : 
                          'No data'}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
                      <Target className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-orange-600">{gpsStats.averageAccuracy.toFixed(1)}m</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Countries</CardTitle>
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-purple-600">{gpsStats.coverageCountries}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Cities</CardTitle>
                      <MapPin className="h-4 w-4 text-indigo-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-indigo-600">{gpsStats.coverageCities}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Delivery Staff</CardTitle>
                      <Users className="h-4 w-4 text-teal-600" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-teal-600">{gpsStats.uniqueDeliveryPersons}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* GPS Deliveries Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-blue-600" />
                    Recent GPS Delivery Confirmations
                  </CardTitle>
                  <p className="text-sm text-gray-600">Latest delivery location confirmations with GPS coordinates</p>
                </CardHeader>
                <CardContent>
                  {gpsDeliveries && gpsDeliveries.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Order ID</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Delivery Person</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Location</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">GPS Coordinates</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Accuracy</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Address Match</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Verification Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {gpsDeliveries.map((delivery, index) => (
                            <tr key={delivery.id || index} className="hover:bg-gray-50">
                              <td className="border border-gray-300 px-3 py-2 font-medium">
                                #{delivery.customerOrderId}
                              </td>
                              <td className="border border-gray-300 px-3 py-2">
                                <div>
                                  <p className="font-medium">{delivery.deliveryPersonName}</p>
                                  <p className="text-xs text-gray-600">{delivery.deliveryPersonPhone}</p>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-3 py-2">
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span>{delivery.city}, {delivery.country}</span>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-xs">
                                <div>
                                  <p>Lat: {parseFloat(delivery.latitude).toFixed(6)}</p>
                                  <p>Lng: {parseFloat(delivery.longitude).toFixed(6)}</p>
                                </div>
                              </td>
                              <td className="border border-gray-300 px-3 py-2">
                                <Badge variant={parseFloat(delivery.accuracy) <= 10 ? "default" : "secondary"}>
                                  ±{delivery.accuracy}m
                                </Badge>
                              </td>
                              <td className="border border-gray-300 px-3 py-2">
                                {delivery.addressMatched ? (
                                  <Badge variant="default" className="bg-green-100 text-green-800">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Match
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    No Match
                                  </Badge>
                                )}
                              </td>
                              <td className="border border-gray-300 px-3 py-2 text-xs">
                                {new Date(delivery.verificationTime).toLocaleString('en-US')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Navigation className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No GPS delivery data available</p>
                      <p className="text-sm">GPS tracking data will appear here when delivery confirmations are made</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* GPS Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* GPS Delivery Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>GPS Delivery Performance</CardTitle>
                    <p className="text-sm text-gray-600">Success rate and accuracy by region</p>
                  </CardHeader>
                  <CardContent>
                    {gpsAnalytics.data && gpsAnalytics.data.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={gpsAnalytics.data.slice(0, 8).map((item: any) => ({
                          city: item.city,
                          totalDeliveries: item.totalDeliveries,
                          successfulDeliveries: item.successfulDeliveries,
                          deliverySuccessRate: item.totalDeliveries > 0 ? 
                            ((item.successfulDeliveries / item.totalDeliveries) * 100).toFixed(1) : 0,
                          averageAccuracy: parseFloat(item.averageAccuracy || '0')
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="city" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: any, name: string) => [
                              name === 'deliverySuccessRate' ? `${value}%` : value,
                              name === 'deliverySuccessRate' ? 'Success Rate' : 
                              name === 'totalDeliveries' ? 'Total Deliveries' : 
                              name === 'averageAccuracy' ? 'Average Accuracy (m)' : name
                            ]}
                          />
                          <Bar dataKey="totalDeliveries" fill="#3b82f6" name="Total Deliveries" />
                          <Bar dataKey="deliverySuccessRate" fill="#10b981" name="Success Rate %" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No GPS Analytics Data</p>
                          <p className="text-sm">Generate analytics to view performance charts</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* GPS Accuracy Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>GPS Accuracy Distribution</CardTitle>
                    <p className="text-sm text-gray-600">Delivery accuracy by city</p>
                  </CardHeader>
                  <CardContent>
                    {gpsAnalytics.data && gpsAnalytics.data.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={gpsAnalytics.data.slice(0, 10).map((item: any) => ({
                          city: item.city,
                          averageAccuracy: parseFloat(item.averageAccuracy || '0')
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="city" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis label={{ value: 'Accuracy (meters)', angle: -90, position: 'insideLeft' }} />
                          <Tooltip 
                            formatter={(value: any) => [`${value}m`, 'Average Accuracy']}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="averageAccuracy" 
                            stroke="#f59e0b" 
                            strokeWidth={3}
                            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[300px] flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <Navigation className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No Accuracy Data</p>
                          <p className="text-sm">GPS accuracy data will appear here</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* GPS Heatmap Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>GPS Delivery Heatmap</CardTitle>
                  <p className="text-sm text-gray-600">Geographic distribution of delivery confirmations</p>
                </CardHeader>
                <CardContent>
                  {gpsHeatmap.data && Array.isArray(gpsHeatmap.data) && gpsHeatmap.data.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{gpsHeatmap.data.length}</div>
                          <div className="text-sm text-blue-700">GPS Points</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">
                            {gpsHeatmap.data.filter((point: any) => point.weight >= 1).length}
                          </div>
                          <div className="text-sm text-green-700">High Accuracy</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">
                            {gpsHeatmap.data.filter((point: any) => point.weight < 1).length}
                          </div>
                          <div className="text-sm text-yellow-700">Needs Review</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">
                            {new Set(gpsHeatmap.data.map((point: any) => `${point.lat.toFixed(1)},${point.lng.toFixed(1)}`)).size}
                          </div>
                          <div className="text-sm text-purple-700">Unique Areas</div>
                        </div>
                      </div>
                      
                      {/* Interactive Delivery Distribution Map */}
                      <div className="bg-white border rounded-lg p-4">
                        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                          نقشه پراکندگی توزیع تحویل‌ها (Delivery Distribution Map)
                        </h4>
                        
                        {/* Map Container */}
                        <div className="relative bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
                            {/* Simple Geographic Map Background */}
                            <svg viewBox="0 0 800 600" className="w-full h-96">
                              {/* Iraq/Iran/Turkey Region Outline */}
                              <rect x="0" y="0" width="800" height="600" fill="#e8f4f8" />
                              
                              {/* Countries Boundaries */}
                              <path d="M200 300 L400 280 L600 300 L650 200 L700 150 L750 200 L700 350 L500 400 L300 380 L200 350 Z" 
                                    fill="#f0f9ff" stroke="#3b82f6" strokeWidth="2" opacity="0.7" />
                              
                              {/* Country Labels */}
                              <text x="350" y="250" textAnchor="middle" className="text-sm font-medium fill-gray-600">Iraq</text>
                              <text x="550" y="200" textAnchor="middle" className="text-sm font-medium fill-gray-600">Iran</text>
                              <text x="650" y="150" textAnchor="middle" className="text-sm font-medium fill-gray-600">Turkey</text>
                              
                              {/* Major Cities */}
                              <circle cx="350" cy="280" r="4" fill="#1f2937" />
                              <text x="355" y="295" className="text-xs fill-gray-700">Baghdad</text>
                              
                              <circle cx="380" cy="220" r="3" fill="#1f2937" />
                              <text x="385" y="235" className="text-xs fill-gray-700">Erbil</text>
                              
                              <circle cx="550" cy="180" r="3" fill="#1f2937" />
                              <text x="555" y="195" className="text-xs fill-gray-700">Tehran</text>
                              
                              <circle cx="650" cy="130" r="3" fill="#1f2937" />
                              <text x="655" y="145" className="text-xs fill-gray-700">Istanbul</text>
                              
                              {/* Plot GPS Delivery Points */}
                              {gpsHeatmap.data.slice(0, 50).map((point: any, index: number) => {
                                // Convert GPS coordinates to SVG coordinates
                                const x = ((point.lng + 50) / 100) * 800; // Rough longitude mapping
                                const y = ((50 - point.lat) / 50) * 600;  // Rough latitude mapping
                                
                                return (
                                  <g key={index}>
                                    <circle 
                                      cx={Math.max(50, Math.min(750, x))} 
                                      cy={Math.max(50, Math.min(550, y))} 
                                      r={point.weight >= 1 ? "6" : "4"}
                                      fill={point.weight >= 1 ? "#10b981" : "#f59e0b"}
                                      stroke="white"
                                      strokeWidth="2"
                                      opacity="0.8"
                                      className="hover:opacity-100 cursor-pointer"
                                    >
                                      <title>
                                        تحویل در موقعیت: {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
                                        تاریخ: {new Date(point.timestamp).toLocaleDateString('fa-IR')}
                                        دقت: {point.weight >= 1 ? 'بالا' : 'نیاز به بررسی'}
                                      </title>
                                    </circle>
                                    
                                    {/* Pulse animation for high-weight points */}
                                    {point.weight >= 1 && (
                                      <circle 
                                        cx={Math.max(50, Math.min(750, x))} 
                                        cy={Math.max(50, Math.min(550, y))} 
                                        r="6"
                                        fill="none"
                                        stroke="#10b981"
                                        strokeWidth="2"
                                        opacity="0.6"
                                      >
                                        <animate attributeName="r" values="6;12;6" dur="3s" repeatCount="indefinite" />
                                        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
                                      </circle>
                                    )}
                                  </g>
                                );
                              })}
                            </svg>
                          </div>
                          
                          {/* Map Legend */}
                          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
                            <h5 className="text-sm font-semibold text-gray-800 mb-2">راهنما (Legend)</h5>
                            <div className="space-y-2">
                              <div className="flex items-center text-xs">
                                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                <span>تحویل با دقت بالا ({gpsHeatmap.data.filter((p: any) => p.weight >= 1).length})</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                                <span>نیاز به بررسی ({gpsHeatmap.data.filter((p: any) => p.weight < 1).length})</span>
                              </div>
                              <div className="flex items-center text-xs">
                                <div className="w-3 h-3 rounded-full bg-gray-400 mr-2"></div>
                                <span>شهرهای اصلی</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Statistics Overlay */}
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-md">
                            <h5 className="text-sm font-semibold text-gray-800 mb-2">آمار توزیع</h5>
                            <div className="space-y-1 text-xs">
                              <div>کل نقاط: <span className="font-bold text-blue-600">{gpsHeatmap.data.length}</span></div>
                              <div>تحویل موفق: <span className="font-bold text-green-600">{gpsHeatmap.data.filter((p: any) => p.weight >= 1).length}</span></div>
                              <div>مناطق منحصر: <span className="font-bold text-purple-600">
                                {new Set(gpsHeatmap.data.map((point: any) => `${Math.floor(point.lat)},${Math.floor(point.lng)}`)).size}
                              </span></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-gray-600 text-center">
                          <p>🗺️ نقشه نمایش دهنده پراکندگی جغرافیایی {gpsHeatmap.data.length} نقطه تحویل در عراق، ایران و ترکیه است. نقاط سبز نشان‌دهنده تحویل‌های موفق و دقیق هستند.</p>
                        </div>
                      </div>
                      
                      {/* Detailed GPS Coordinates List */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-3">جزئیات مختصات GPS</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                          {gpsHeatmap.data.map((point: any, index: number) => (
                            <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                              <div className="flex items-center">
                                <div className={`w-3 h-3 rounded-full mr-2 ${
                                  point.weight >= 1 ? 'bg-green-500' : 'bg-yellow-500'
                                }`}></div>
                                <div className="text-sm">
                                  <div className="font-medium">{point.lat.toFixed(4)}, {point.lng.toFixed(4)}</div>
                                  <div className="text-gray-500 text-xs">
                                    {new Date(point.timestamp).toLocaleDateString('en-US')}
                                  </div>
                                </div>
                              </div>
                              <Badge variant={point.weight >= 1 ? "default" : "secondary"} className="text-xs">
                                {point.weight >= 1 ? "دقیق" : "بررسی"}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-500 mt-4">
                        <p><strong>Note:</strong> GPS coordinates represent actual delivery confirmation locations in Iraq, Iran, and Turkey. Green indicators show high-accuracy deliveries, yellow indicates locations requiring review.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No GPS Heatmap Data</p>
                        <p className="text-sm">GPS delivery locations will appear here when confirmations are made</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}