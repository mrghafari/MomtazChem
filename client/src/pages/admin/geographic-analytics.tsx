import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { MapPin, Package, TrendingUp, Users, DollarSign, ShoppingCart, Calendar, Download, Filter, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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
  const { data: geoData, isLoading: geoLoading } = useQuery<GeographicData[]>({
    queryKey: ['/api/analytics/geographic', dateRange, selectedRegion],
    queryFn: async () => {
      const response = await fetch(`/api/analytics/geographic?period=${dateRange}&region=${selectedRegion}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch geographic data');
      const result = await response.json();
      return result.data || [];
    }
  });

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
    totalCustomers: geoData.reduce((sum, region) => sum + region.customerCount, 0),
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
      </Tabs>
    </div>
  );
}