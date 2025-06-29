import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Users, BarChart3, Globe, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CustomerLocation {
  id: number;
  name: string;
  email: string;
  country: string;
  city: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lat?: number;
  lng?: number;
}

interface GeographicStats {
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
  topRegions: Array<{
    region: string;
    customers: number;
    revenue: number;
    averageOrderValue: number;
  }>;
}

export default function GeographicDistribution() {
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [searchCity, setSearchCity] = useState("");
  const [selectedMetric, setSelectedMetric] = useState<"customers" | "revenue">("customers");

  // Fetch geographic distribution data
  const { data: geoData, isLoading } = useQuery<GeographicStats>({
    queryKey: ['/api/reports/geographic-distribution'],
  });

  // Fetch customer locations
  const { data: customerLocations } = useQuery<CustomerLocation[]>({
    queryKey: ['/api/reports/customer-locations', selectedCountry],
  });

  const filteredCities = geoData?.cities.filter(city => 
    selectedCountry === "all" || city.country === selectedCountry
  ).filter(city =>
    city.city.toLowerCase().includes(searchCity.toLowerCase())
  ) || [];

  const downloadReport = async () => {
    try {
      const response = await fetch('/api/reports/geographic-distribution/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          country: selectedCountry,
          metric: selectedMetric 
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `geographic-distribution-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
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
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">توزیع جغرافیایی مشتریان</h1>
            <p className="text-gray-600">تحلیل پراکندگی مشتریان بر اساس موقعیت جغرافیایی</p>
          </div>
        </div>
        <Button onClick={downloadReport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          دانلود گزارش
        </Button>
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
                <p className="text-2xl font-bold">{geoData?.totalCustomers.toLocaleString()}</p>
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
                <p className="text-sm text-gray-600">تعداد کشورها</p>
                <p className="text-2xl font-bold">{geoData?.countries.length}</p>
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
                <p className="text-2xl font-bold">{geoData?.cities.length}</p>
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
                <p className="text-lg font-bold">{geoData?.countries[0]?.country}</p>
                <p className="text-sm text-gray-500">
                  {geoData?.countries[0]?.count} مشتری
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
            <SelectValue placeholder="انتخاب کشور" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه کشورها</SelectItem>
            {geoData?.countries.map(country => (
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

        <Select value={selectedMetric} onValueChange={(value: "customers" | "revenue") => setSelectedMetric(value)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="customers">بر اساس تعداد مشتری</SelectItem>
            <SelectItem value="revenue">بر اساس درآمد</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="countries" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="countries">توزیع کشورها</TabsTrigger>
          <TabsTrigger value="cities">توزیع شهرها</TabsTrigger>
          <TabsTrigger value="map">نمای نقشه</TabsTrigger>
        </TabsList>

        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>توزیع مشتریان بر اساس کشور</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {geoData?.countries.map((country, index) => (
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

        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>نقشه توزیع مشتریان</CardTitle>
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
              
              {/* Simple coordinate display for now */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {customerLocations?.slice(0, 9).map(location => (
                  <div key={location.id} className="p-3 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <h4 className="font-medium text-sm">{location.name}</h4>
                    </div>
                    <p className="text-xs text-gray-600">{location.city}, {location.country}</p>
                    <p className="text-xs text-gray-500">{location.address}</p>
                    <div className="mt-2 flex justify-between text-xs">
                      <span>{location.totalOrders} سفارش</span>
                      <span className="text-green-600">${location.totalSpent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}