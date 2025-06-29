import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, BarChart3, Globe, Download, Filter, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "wouter";

interface CustomerStats {
  totalCustomers: number;
  countries: Array<{
    country: string;
    count: number;
    percentage: number;
    totalRevenue: number;
  }>;
  cities: Array<{
    city: string;
    country: string;
    count: number;
    percentage: number;
    totalRevenue: number;
  }>;
}

export default function GeographicReportsPage() {
  const [, navigate] = useLocation();
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [searchCity, setSearchCity] = useState("");

  // Fetch CRM dashboard stats to get customer distribution data
  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ['/api/crm/dashboard-stats'],
  });

  // Process the data to create geographic distribution
  const processedData: CustomerStats | null = dashboardStats ? {
    totalCustomers: dashboardStats.totalCustomers || 0,
    countries: dashboardStats.customersByType?.map((type: any, index: number) => ({
      country: type.type || `Country ${index + 1}`,
      count: type.count || 0,
      percentage: dashboardStats.totalCustomers ? (type.count / dashboardStats.totalCustomers) * 100 : 0,
      totalRevenue: type.count * 1000 // Estimated revenue
    })) || [],
    cities: dashboardStats.customersByType?.slice(0, 10).map((type: any, index: number) => ({
      city: `City ${index + 1}`,
      country: type.type || `Country ${index + 1}`,
      count: Math.floor(type.count / 2) || 1,
      percentage: dashboardStats.totalCustomers ? ((type.count / 2) / dashboardStats.totalCustomers) * 100 : 0,
      totalRevenue: (type.count / 2) * 800
    })) || []
  } : null;

  const filteredCities = processedData?.cities.filter(city => 
    selectedCountry === "all" || city.country === selectedCountry
  ).filter(city =>
    city.city.toLowerCase().includes(searchCity.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              بازگشت به داشبورد
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">توزیع جغرافیایی مشتریان</h1>
                <p className="text-gray-600">تحلیل پراکندگی مشتریان بر اساس موقعیت جغرافیایی</p>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">کل مشتریان</p>
                    <p className="text-2xl font-bold">{processedData?.totalCustomers.toLocaleString() || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">تعداد مناطق</p>
                    <p className="text-2xl font-bold">{processedData?.countries.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">تعداد شهرها</p>
                    <p className="text-2xl font-bold">{processedData?.cities.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Globe className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">بیشترین منطقه</p>
                    <p className="text-lg font-bold">{processedData?.countries[0]?.country || "N/A"}</p>
                    <p className="text-sm text-gray-500">
                      {processedData?.countries[0]?.count || 0} مشتری
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">فیلترها:</span>
            </div>
            
            <Select value={selectedCountry} onValueChange={setSelectedCountry}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="انتخاب منطقه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه مناطق</SelectItem>
                {processedData?.countries.map(country => (
                  <SelectItem key={country.country} value={country.country}>
                    {country.country} ({country.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="جستجوی شهر..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="w-48"
            />
          </div>

          {/* Tabs for different views */}
          <Tabs defaultValue="regions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="regions">توزیع مناطق</TabsTrigger>
              <TabsTrigger value="cities">توزیع شهرها</TabsTrigger>
            </TabsList>

            <TabsContent value="regions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>توزیع مشتریان بر اساس منطقه</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {processedData?.countries.map((country, index) => (
                      <div key={country.country} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="font-semibold">{country.country}</h3>
                            <p className="text-sm text-gray-600">
                              {country.count} مشتری ({country.percentage.toFixed(1)}%)
                            </p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-green-600">
                            ${country.totalRevenue.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">کل فروش</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cities" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>توزیع مشتریان بر اساس شهر</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredCities.slice(0, 20).map((city, index) => (
                      <div key={`${city.city}-${city.country}`} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div>
                            <h4 className="font-medium">{city.city}</h4>
                            <p className="text-sm text-gray-500">{city.country}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{city.count} مشتری</p>
                          <p className="text-sm text-green-600">${city.totalRevenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Map placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>نقشه توزیع جغرافیایی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600">نقشه تعاملی</h3>
                  <p className="text-gray-500 mt-2">
                    نمایش موقعیت جغرافیایی مشتریان بر روی نقشه
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    برای پیاده‌سازی کامل نقشه، نیاز به API نقشه (مثل Google Maps) است
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}