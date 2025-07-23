import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RefreshCw, Search, MapPin, Building, Globe, Users, BarChart3, Edit } from 'lucide-react';
import type { IraqiProvince, IraqiCity } from '@shared/schema';

interface GeographyStats {
  totalProvinces: string;
  totalCities: string;
  provincialCapitals: string;
  regionBreakdown: Array<{
    region: string;
    count: string;
  }>;
  lastUpdated: string;
}

export default function IraqiGeography() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  // Fetch provinces from working API endpoints
  const { data: provinces, isLoading: provincesLoading, refetch: refetchProvinces } = useQuery<{ data: IraqiProvince[]; count: number }>({
    queryKey: ['/api/iraqi-provinces'],
  });

  // Fetch cities from working API endpoints
  const { data: cities, isLoading: citiesLoading, refetch: refetchCities } = useQuery<{ data: IraqiCity[]; count: number }>({
    queryKey: ['/api/iraqi-cities'],
  });

  // Fetch statistics from working API endpoints
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<{ data: GeographyStats }>({
    queryKey: ['/api/iraqi-geography-stats'],
  });

  // Filter cities based on search and province selection
  const filteredCities = cities?.data?.filter(city => {
    const matchesSearch = searchTerm === '' || 
      city.nameArabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      city.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (city.nameKurdish && city.nameKurdish.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesProvince = selectedProvince === 'all' || city.provinceId.toString() === selectedProvince;
    const matchesRegion = selectedRegion === 'all' || city.region === selectedRegion;
    
    return matchesSearch && matchesProvince && matchesRegion;
  }) || [];

  // Filter provinces based on search
  const filteredProvinces = provinces?.data?.filter(province => {
    return searchTerm === '' || 
      province.nameArabic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      province.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (province.nameKurdish && province.nameKurdish.toLowerCase().includes(searchTerm.toLowerCase()));
  }) || [];

  const handleRefreshAll = () => {
    refetchProvinces();
    refetchCities();
    refetchStats();
  };

  const formatNumber = (num: any): string => {
    try {
      if (num === undefined || num === null || num === '') return '0';
      const parsedNum = typeof num === 'string' ? parseInt(num) : Number(num);
      if (isNaN(parsedNum)) return '0';
      return parsedNum.toLocaleString('en-US');
    } catch (error) {
      console.error('formatNumber error:', error, 'value:', num);
      return '0';
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            جغرافیای عراق
          </h1>
          <p className="text-gray-600 mt-1">
            مدیریت استان‌ها و شهرهای عراق با پشتیبانی سه زبانه
          </p>
        </div>
        <Button onClick={handleRefreshAll} disabled={provincesLoading || citiesLoading || statsLoading}>
          <RefreshCw className={`h-4 w-4 ml-2 ${(provincesLoading || citiesLoading || statsLoading) ? 'animate-spin' : ''}`} />
          تازه‌سازی
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-600 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">استان‌ها</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.data.totalProvinces)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-green-600 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">شهرها</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.data.totalCities)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Globe className="h-8 w-8 text-purple-600 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">مراکز استان</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatNumber(stats.data.provincialCapitals)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-orange-600 ml-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">مناطق</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.data.regionBreakdown?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="جستجو در استان‌ها و شهرها..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="انتخاب استان" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه استان‌ها</SelectItem>
                {provinces?.data?.map((province) => (
                  <SelectItem key={province.id} value={province.id.toString()}>
                    {province.nameArabic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="انتخاب منطقه" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه مناطق</SelectItem>
                <SelectItem value="north">شمال</SelectItem>
                <SelectItem value="center">مرکز</SelectItem>
                <SelectItem value="south">جنوب</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="cities" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cities">شهرها ({cities?.count || 0})</TabsTrigger>
          <TabsTrigger value="provinces">استان‌ها ({provinces?.count || 0})</TabsTrigger>
          <TabsTrigger value="regions">توزیع منطقه‌ای</TabsTrigger>
        </TabsList>

        {/* Cities Tab */}
        <TabsContent value="cities">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 ml-2" />
                شهرهای عراق
                <Badge variant="secondary" className="mr-2">
                  {filteredCities.length} شهر
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام عربی</TableHead>
                      <TableHead className="text-right">نام انگلیسی</TableHead>
                      <TableHead className="text-right">نام کردی</TableHead>
                      <TableHead className="text-right">استان</TableHead>
                      <TableHead className="text-right">منطقه</TableHead>
                      <TableHead className="text-right">جمعیت</TableHead>
                      <TableHead className="text-right">ارتفاع (متر)</TableHead>
                      <TableHead className="text-right">کد پستی</TableHead>
                      <TableHead className="text-right">مرکز استان</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {citiesLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                          در حال بارگذاری...
                        </TableCell>
                      </TableRow>
                    ) : filteredCities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          هیچ شهری یافت نشد
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCities.map((city) => (
                        <TableRow key={city.id}>
                          <TableCell className="font-medium">{city.nameArabic}</TableCell>
                          <TableCell>{city.nameEnglish}</TableCell>
                          <TableCell>{city.nameKurdish || '-'}</TableCell>
                          <TableCell>{city.provinceName}</TableCell>
                          <TableCell>
                            <Badge variant={
                              city.region === 'north' ? 'default' :
                              city.region === 'center' ? 'secondary' : 'outline'
                            }>
                              {city.region === 'north' ? 'شمال' : 
                               city.region === 'center' ? 'مرکز' : 
                               city.region === 'south' ? 'جنوب' : city.region}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {city.population ? formatNumber(city.population) : '-'}
                          </TableCell>
                          <TableCell>{city.elevation || '-'}</TableCell>
                          <TableCell>{city.postalCode || '-'}</TableCell>
                          <TableCell>
                            {city.isProvinceCapital ? (
                              <Badge variant="default">مرکز استان</Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Provinces Tab */}
        <TabsContent value="provinces">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building className="h-5 w-5 ml-2" />
                استان‌های عراق
                <Badge variant="secondary" className="mr-2">
                  {filteredProvinces.length} استان
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">نام عربی</TableHead>
                      <TableHead className="text-right">نام انگلیسی</TableHead>
                      <TableHead className="text-right">نام کردی</TableHead>
                      <TableHead className="text-right">مرکز استان</TableHead>
                      <TableHead className="text-right">منطقه</TableHead>
                      <TableHead className="text-right">جمعیت</TableHead>
                      <TableHead className="text-right">مساحت (کیلومتر مربع)</TableHead>
                      <TableHead className="text-right">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {provincesLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                          در حال بارگذاری...
                        </TableCell>
                      </TableRow>
                    ) : filteredProvinces.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          هیچ استانی یافت نشد
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProvinces.map((province) => (
                        <TableRow key={province.id}>
                          <TableCell className="font-medium">{province.nameArabic}</TableCell>
                          <TableCell>{province.nameEnglish}</TableCell>
                          <TableCell>{province.nameKurdish || '-'}</TableCell>
                          <TableCell>{province.capital}</TableCell>
                          <TableCell>
                            <Badge variant={
                              province.region === 'north' ? 'default' :
                              province.region === 'center' ? 'secondary' : 'outline'
                            }>
                              {province.region === 'north' ? 'شمال' : 
                               province.region === 'center' ? 'مرکز' : 
                               province.region === 'south' ? 'جنوب' : province.region}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {province.population ? formatNumber(province.population) : '-'}
                          </TableCell>
                          <TableCell>
                            {province.area ? formatNumber(province.area) : '-'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Regional Distribution Tab */}
        <TabsContent value="regions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 ml-2" />
                توزیع منطقه‌ای شهرها
              </CardTitle>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  در حال بارگذاری آمار...
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.data?.regionBreakdown?.map((region) => (
                    <div key={region.region} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded ml-3 ${
                          region.region === 'north' ? 'bg-blue-500' :
                          region.region === 'center' ? 'bg-green-500' :
                          region.region === 'south' ? 'bg-orange-500' : 'bg-gray-500'
                        }`} />
                        <span className="font-medium">
                          {region.region === 'north' ? 'شمال عراق' : 
                           region.region === 'center' ? 'مرکز عراق' : 
                           region.region === 'south' ? 'جنوب عراق' : region.region}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Badge variant="secondary" className="ml-2">
                          {region.count} شهر
                        </Badge>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              region.region === 'north' ? 'bg-blue-500' :
                              region.region === 'center' ? 'bg-green-500' :
                              region.region === 'south' ? 'bg-orange-500' : 'bg-gray-500'
                            }`}
                            style={{ 
                              width: `${(parseInt(region.count) / (parseInt(stats?.data?.totalCities || '1'))) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}