import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Globe, 
  MapPin, 
  Plane, 
  Ship, 
  Truck, 
  Package, 
  DollarSign, 
  Clock, 
  Plus, 
  Edit, 
  CheckCircle, 
  AlertCircle,
  Flame,
  Snowflake,
  AlertTriangle
} from 'lucide-react';

interface InternationalCountry {
  id: number;
  name: string;
  nameEn: string;
  nameLocal: string;
  countryCode: string;
  region: string;
  currency: string;
  isActive: boolean;
  hasCustomsAgreement: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InternationalCity {
  id: number;
  name: string;
  nameEn: string;
  nameLocal: string;
  countryId: number;
  provinceState: string;
  cityType: 'port' | 'airport' | 'border' | 'major_city' | 'commercial_hub';
  distanceFromErbilKm: number;
  isActive: boolean;
  hasShippingRoutes: boolean;
  isPriorityDestination: boolean;
  customsInformation?: string;
  notes?: string;
  countryName?: string;
  countryCode?: string;
}

interface InternationalShippingRate {
  id: number;
  countryId: number;
  cityId?: number;
  shippingMethod: 'air_freight' | 'sea_freight' | 'road_transport' | 'rail_transport' | 'express_courier';
  transportProvider: string;
  basePrice: number;
  pricePerKg: number;
  pricePerKm?: number;
  minimumCharge: number;
  maximumWeight: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  currency: string;
  supportsHazardous: boolean;
  supportsFlammable: boolean;
  supportsRefrigerated: boolean;
  requiresCustomsClearance: boolean;
  isActive: boolean;
  notes?: string;
  countryName?: string;
  cityName?: string;
}

const CITY_TYPES = {
  'port': 'بندر دریایی',
  'airport': 'فرودگاه',
  'border': 'مرز زمینی',
  'major_city': 'شهر بزرگ',
  'commercial_hub': 'مرکز تجاری'
};

const SHIPPING_METHODS = {
  'air_freight': 'حمل هوایی',
  'sea_freight': 'حمل دریایی',
  'road_transport': 'حمل جاده‌ای',
  'rail_transport': 'حمل ریلی',
  'express_courier': 'پیک سریع'
};

const REGIONS = {
  'middle_east': 'خاورمیانه',
  'europe': 'اروپا',
  'asia': 'آسیا',
  'africa': 'آفریقا',
  'americas': 'قاره آمریکا',
  'oceania': 'اقیانوسیه'
};

const InternationalGeographyTab: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('countries');
  
  // Dialog states
  const [isAddCountryOpen, setIsAddCountryOpen] = useState(false);
  const [isAddCityOpen, setIsAddCityOpen] = useState(false);
  const [isAddRateOpen, setIsAddRateOpen] = useState(false);
  const [isEditCountryOpen, setIsEditCountryOpen] = useState(false);
  const [isEditCityOpen, setIsEditCityOpen] = useState(false);
  const [isEditRateOpen, setIsEditRateOpen] = useState(false);
  
  // Editing states
  const [editingCountry, setEditingCountry] = useState<InternationalCountry | null>(null);
  const [editingCity, setEditingCity] = useState<InternationalCity | null>(null);
  const [editingRate, setEditingRate] = useState<InternationalShippingRate | null>(null);

  // Form states
  const [countryForm, setCountryForm] = useState({
    name: '',
    nameEn: '',
    nameLocal: '',
    countryCode: '',
    region: 'middle_east',
    currency: 'USD',
    isActive: true,
    hasCustomsAgreement: false,
    notes: ''
  });

  const [cityForm, setCityForm] = useState({
    name: '',
    nameEn: '',
    nameLocal: '',
    countryId: 0,
    provinceState: '',
    cityType: 'major_city' as const,
    distanceFromErbilKm: 0,
    isActive: true,
    hasShippingRoutes: false,
    isPriorityDestination: false,
    customsInformation: '',
    notes: ''
  });

  const [rateForm, setRateForm] = useState({
    countryId: 0,
    cityId: 0,
    shippingMethod: 'air_freight' as const,
    transportProvider: '',
    basePrice: 0,
    pricePerKg: 0,
    pricePerKm: 0,
    minimumCharge: 0,
    maximumWeight: 1000,
    estimatedDaysMin: 1,
    estimatedDaysMax: 7,
    currency: 'USD',
    supportsHazardous: false,
    supportsFlammable: false,
    supportsRefrigerated: false,
    requiresCustomsClearance: true,
    isActive: true,
    notes: ''
  });

  // Queries
  const { data: countriesResponse, isLoading: loadingCountries } = useQuery({
    queryKey: ['/api/logistics/international-countries'],
    enabled: true
  });
  const countries = (countriesResponse as any)?.data || [];

  const { data: citiesResponse, isLoading: loadingCities } = useQuery({
    queryKey: ['/api/logistics/international-cities'],
    enabled: true
  });
  const cities = (citiesResponse as any)?.data || [];

  const { data: ratesResponse, isLoading: loadingRates } = useQuery({
    queryKey: ['/api/logistics/international-shipping-rates'],
    enabled: true
  });
  const rates = (ratesResponse as any)?.data || [];

  // Mutations
  const createCountryMutation = useMutation({
    mutationFn: async (data: any) => {
      const { apiRequest } = await import('@/lib/queryClient');
      return await apiRequest('/api/logistics/international-countries', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/international-countries'] });
      setIsAddCountryOpen(false);
      toast({ title: "کشور با موفقیت اضافه شد", variant: "default" });
      setCountryForm({
        name: '',
        nameEn: '',
        nameLocal: '',
        countryCode: '',
        region: 'middle_east',
        currency: 'USD',
        isActive: true,
        hasCustomsAgreement: false,
        notes: ''
      });
    },
    onError: (error) => {
      toast({ title: "خطا در ایجاد کشور", description: error.message, variant: "destructive" });
    }
  });

  const updateCountryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const { apiRequest } = await import('@/lib/queryClient');
      return await apiRequest(`/api/logistics/international-countries/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/international-countries'] });
      setIsEditCountryOpen(false);
      toast({ title: "کشور با موفقیت به‌روزرسانی شد", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "خطا در به‌روزرسانی کشور", description: error.message, variant: "destructive" });
    }
  });

  const deleteCountryMutation = useMutation({
    mutationFn: async (id: number) => {
      const { apiRequest } = await import('@/lib/queryClient');
      return await apiRequest(`/api/logistics/international-countries/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/international-countries'] });
      toast({ title: "کشور با موفقیت حذف شد", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "خطا در حذف کشور", description: error.message, variant: "destructive" });
    }
  });

  const createCityMutation = useMutation({
    mutationFn: async (data: any) => {
      const { apiRequest } = await import('@/lib/queryClient');
      return await apiRequest('/api/logistics/international-cities', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/international-cities'] });
      setIsAddCityOpen(false);
      toast({ title: "شهر با موفقیت اضافه شد", variant: "default" });
      setCityForm({
        name: '',
        nameEn: '',
        nameLocal: '',
        countryId: 0,
        provinceState: '',
        cityType: 'major_city' as const,
        distanceFromErbilKm: 0,
        isActive: true,
        hasShippingRoutes: false,
        isPriorityDestination: false,
        customsInformation: '',
        notes: ''
      });
    },
    onError: (error) => {
      toast({ title: "خطا در ایجاد شهر", description: error.message, variant: "destructive" });
    }
  });

  const updateCityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const { apiRequest } = await import('@/lib/queryClient');
      return await apiRequest(`/api/logistics/international-cities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/international-cities'] });
      setIsEditCityOpen(false);
      toast({ title: "شهر با موفقیت به‌روزرسانی شد", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "خطا در به‌روزرسانی شهر", description: error.message, variant: "destructive" });
    }
  });

  const deleteCityMutation = useMutation({
    mutationFn: async (id: number) => {
      const { apiRequest } = await import('@/lib/queryClient');
      return await apiRequest(`/api/logistics/international-cities/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/international-cities'] });
      toast({ title: "شهر با موفقیت حذف شد", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "خطا در حذف شهر", description: error.message, variant: "destructive" });
    }
  });

  const createRateMutation = useMutation({
    mutationFn: async (data: any) => {
      const { apiRequest } = await import('@/lib/queryClient');
      return await apiRequest('/api/logistics/international-shipping-rates', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/international-shipping-rates'] });
      setIsAddRateOpen(false);
      toast({ title: "نرخ حمل با موفقیت اضافه شد", variant: "default" });
      setRateForm({
        countryId: 0,
        cityId: 0,
        shippingMethod: 'air_freight' as const,
        transportProvider: '',
        basePrice: 0,
        pricePerKg: 0,
        pricePerKm: 0,
        minimumCharge: 0,
        maximumWeight: 1000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 7,
        currency: 'USD',
        supportsHazardous: false,
        supportsFlammable: false,
        supportsRefrigerated: false,
        requiresCustomsClearance: true,
        isActive: true,
        notes: ''
      });
    },
    onError: (error) => {
      toast({ title: "خطا در ایجاد نرخ حمل", description: error.message, variant: "destructive" });
    }
  });

  const updateRateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const { apiRequest } = await import('@/lib/queryClient');
      return await apiRequest(`/api/logistics/international-shipping-rates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/international-shipping-rates'] });
      setIsEditRateOpen(false);
      toast({ title: "نرخ حمل با موفقیت به‌روزرسانی شد", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "خطا در به‌روزرسانی نرخ حمل", description: error.message, variant: "destructive" });
    }
  });

  const deleteRateMutation = useMutation({
    mutationFn: async (id: number) => {
      const { apiRequest } = await import('@/lib/queryClient');
      return await apiRequest(`/api/logistics/international-shipping-rates/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/international-shipping-rates'] });
      toast({ title: "نرخ حمل با موفقیت حذف شد", variant: "default" });
    },
    onError: (error) => {
      toast({ title: "خطا در حذف نرخ حمل", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
            <Globe className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">جغرافیای بین‌المللی</h2>
            <p className="text-gray-600 dark:text-gray-300">مدیریت کشورها، شهرها و نرخ‌های حمل بین‌المللی</p>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="text-2xl font-bold text-blue-600">{countries.length}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">کشور</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="text-2xl font-bold text-green-600">{cities.length}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">شهر</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <h3 className="text-2xl font-bold text-purple-600">{rates.length}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">نرخ حمل</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="countries" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            کشورها
          </TabsTrigger>
          <TabsTrigger value="cities" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            شهرها
          </TabsTrigger>
          <TabsTrigger value="rates" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            نرخ‌های حمل
          </TabsTrigger>
        </TabsList>

        {/* Countries Tab */}
        <TabsContent value="countries">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="w-5 h-5" />
                    کشورهای بین‌المللی
                  </CardTitle>
                  <CardDescription>
                    مدیریت کشورهای مقصد برای حمل بین‌المللی
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddCountryOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  افزودن کشور
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCountries ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : countries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  هیچ کشوری ثبت نشده است
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام کشور</TableHead>
                      <TableHead>کد کشور</TableHead>
                      <TableHead>منطقه</TableHead>
                      <TableHead>ارز</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {countries.map((country: InternationalCountry) => (
                      <TableRow key={country.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{country.name}</div>
                            <div className="text-sm text-gray-500">{country.nameEn}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{country.countryCode}</Badge>
                        </TableCell>
                        <TableCell>{REGIONS[country.region as keyof typeof REGIONS] || country.region}</TableCell>
                        <TableCell>{country.currency}</TableCell>
                        <TableCell>
                          {country.isActive ? (
                            <Badge className="bg-green-100 text-green-800">فعال</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">غیرفعال</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCountry(country);
                              setIsEditCountryOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cities Tab */}
        <TabsContent value="cities">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    شهرهای بین‌المللی
                  </CardTitle>
                  <CardDescription>
                    مدیریت شهرها و بنادر برای حمل بین‌المللی
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddCityOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  افزودن شهر
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCities ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : cities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  هیچ شهری ثبت نشده است
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام شهر</TableHead>
                      <TableHead>کشور</TableHead>
                      <TableHead>نوع</TableHead>
                      <TableHead>فاصله از اربیل</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cities.map((city: InternationalCity) => (
                      <TableRow key={city.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{city.name}</div>
                            <div className="text-sm text-gray-500">{city.nameEn}</div>
                          </div>
                        </TableCell>
                        <TableCell>{city.countryName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {CITY_TYPES[city.cityType as keyof typeof CITY_TYPES] || city.cityType}
                          </Badge>
                        </TableCell>
                        <TableCell>{city.distanceFromErbilKm.toLocaleString()} کیلومتر</TableCell>
                        <TableCell>
                          {city.isActive ? (
                            <Badge className="bg-green-100 text-green-800">فعال</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">غیرفعال</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCity(city);
                              setIsEditCityOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Rates Tab */}
        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    نرخ‌های حمل بین‌المللی
                  </CardTitle>
                  <CardDescription>
                    مدیریت نرخ‌های حمل برای کشورها و شهرهای مختلف
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddRateOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  افزودن نرخ
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingRates ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : rates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  هیچ نرخی ثبت نشده است
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>مقصد</TableHead>
                      <TableHead>روش حمل</TableHead>
                      <TableHead>شرکت حمل</TableHead>
                      <TableHead>قیمت پایه</TableHead>
                      <TableHead>قیمت هر کیلو</TableHead>
                      <TableHead>زمان تحویل</TableHead>
                      <TableHead>ویژگی‌ها</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rates.map((rate: InternationalShippingRate) => (
                      <TableRow key={rate.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{rate.countryName}</div>
                            {rate.cityName && (
                              <div className="text-sm text-gray-500">{rate.cityName}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {SHIPPING_METHODS[rate.shippingMethod as keyof typeof SHIPPING_METHODS] || rate.shippingMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>{rate.transportProvider}</TableCell>
                        <TableCell>{rate.basePrice.toLocaleString()} {rate.currency}</TableCell>
                        <TableCell>{rate.pricePerKg.toLocaleString()} {rate.currency}</TableCell>
                        <TableCell>{rate.estimatedDaysMin}-{rate.estimatedDaysMax} روز</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {rate.supportsFlammable && (
                              <Badge variant="outline" className="text-red-600">
                                <Flame className="w-3 h-3 ml-1" />
                                آتش‌زا
                              </Badge>
                            )}
                            {rate.supportsRefrigerated && (
                              <Badge variant="outline" className="text-blue-600">
                                <Snowflake className="w-3 h-3 ml-1" />
                                یخچالی
                              </Badge>
                            )}
                            {rate.supportsHazardous && (
                              <Badge variant="outline" className="text-orange-600">
                                <AlertTriangle className="w-3 h-3 ml-1" />
                                خطرناک
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingRate(rate);
                              setIsEditRateOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Country Dialog */}
      <Dialog open={isAddCountryOpen} onOpenChange={setIsAddCountryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              افزودن کشور جدید
            </DialogTitle>
            <DialogDescription>
              اطلاعات کشور جدید را برای حمل بین‌المللی وارد کنید
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">نام کشور (فارسی/عربی) *</Label>
              <Input
                id="name"
                value={countryForm.name}
                onChange={(e) => setCountryForm({...countryForm, name: e.target.value})}
                placeholder="مثال: ترکیه"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nameEn">نام کشور (انگلیسی) *</Label>
              <Input
                id="nameEn"
                value={countryForm.nameEn}
                onChange={(e) => setCountryForm({...countryForm, nameEn: e.target.value})}
                placeholder="مثال: Turkey"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="countryCode">کد کشور *</Label>
              <Input
                id="countryCode"
                value={countryForm.countryCode}
                onChange={(e) => setCountryForm({...countryForm, countryCode: e.target.value.toUpperCase()})}
                placeholder="مثال: TR"
                maxLength={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region">منطقه *</Label>
              <Select
                value={countryForm.region}
                onValueChange={(value) => setCountryForm({...countryForm, region: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REGIONS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">ارز *</Label>
              <Input
                id="currency"
                value={countryForm.currency}
                onChange={(e) => setCountryForm({...countryForm, currency: e.target.value.toUpperCase()})}
                placeholder="مثال: TRY"
                maxLength={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nameLocal">نام محلی</Label>
              <Input
                id="nameLocal"
                value={countryForm.nameLocal}
                onChange={(e) => setCountryForm({...countryForm, nameLocal: e.target.value})}
                placeholder="مثال: Türkiye"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={countryForm.isActive}
                onCheckedChange={(checked) => setCountryForm({...countryForm, isActive: checked})}
              />
              <Label htmlFor="isActive">فعال</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="hasCustomsAgreement"
                checked={countryForm.hasCustomsAgreement}
                onCheckedChange={(checked) => setCountryForm({...countryForm, hasCustomsAgreement: checked})}
              />
              <Label htmlFor="hasCustomsAgreement">دارای توافق گمرکی</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">یادداشت‌ها</Label>
            <Textarea
              id="notes"
              value={countryForm.notes}
              onChange={(e) => setCountryForm({...countryForm, notes: e.target.value})}
              placeholder="یادداشت‌های اضافی..."
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCountryOpen(false)}>
              انصراف
            </Button>
            <Button 
              onClick={() => createCountryMutation.mutate(countryForm)}
              disabled={createCountryMutation.isPending}
            >
              {createCountryMutation.isPending ? 'در حال ذخیره...' : 'ذخیره کشور'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add City Dialog */}
      <Dialog open={isAddCityOpen} onOpenChange={setIsAddCityOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              افزودن شهر جدید
            </DialogTitle>
            <DialogDescription>
              اطلاعات شهر جدید را برای حمل بین‌المللی وارد کنید
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cityName">نام شهر (فارسی/عربی) *</Label>
              <Input
                id="cityName"
                value={cityForm.name}
                onChange={(e) => setCityForm({...cityForm, name: e.target.value})}
                placeholder="مثال: استانبول"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cityNameEn">نام شهر (انگلیسی) *</Label>
              <Input
                id="cityNameEn"
                value={cityForm.nameEn}
                onChange={(e) => setCityForm({...cityForm, nameEn: e.target.value})}
                placeholder="مثال: Istanbul"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cityNameLocal">نام محلی</Label>
              <Input
                id="cityNameLocal"
                value={cityForm.nameLocal}
                onChange={(e) => setCityForm({...cityForm, nameLocal: e.target.value})}
                placeholder="مثال: İstanbul"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="countryId">کشور *</Label>
              <Select
                value={cityForm.countryId.toString()}
                onValueChange={(value) => setCityForm({...cityForm, countryId: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کشور" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country: InternationalCountry) => (
                    <SelectItem key={country.id} value={country.id.toString()}>
                      {country.name} ({country.nameEn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="provinceState">استان/ایالت</Label>
              <Input
                id="provinceState"
                value={cityForm.provinceState}
                onChange={(e) => setCityForm({...cityForm, provinceState: e.target.value})}
                placeholder="مثال: مرمره"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cityType">نوع شهر *</Label>
              <Select
                value={cityForm.cityType}
                onValueChange={(value) => setCityForm({...cityForm, cityType: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CITY_TYPES).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="distanceFromErbilKm">فاصله از اربیل (کیلومتر) *</Label>
              <Input
                id="distanceFromErbilKm"
                type="number"
                min="0"
                value={cityForm.distanceFromErbilKm}
                onChange={(e) => setCityForm({...cityForm, distanceFromErbilKm: parseInt(e.target.value) || 0})}
                placeholder="0"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customsInformation">اطلاعات گمرکی</Label>
              <Input
                id="customsInformation"
                value={cityForm.customsInformation}
                onChange={(e) => setCityForm({...cityForm, customsInformation: e.target.value})}
                placeholder="اطلاعات گمرک و ترخیص"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="cityIsActive"
                checked={cityForm.isActive}
                onCheckedChange={(checked) => setCityForm({...cityForm, isActive: checked})}
              />
              <Label htmlFor="cityIsActive">فعال</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="hasShippingRoutes"
                checked={cityForm.hasShippingRoutes}
                onCheckedChange={(checked) => setCityForm({...cityForm, hasShippingRoutes: checked})}
              />
              <Label htmlFor="hasShippingRoutes">دارای مسیر حمل</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isPriorityDestination"
                checked={cityForm.isPriorityDestination}
                onCheckedChange={(checked) => setCityForm({...cityForm, isPriorityDestination: checked})}
              />
              <Label htmlFor="isPriorityDestination">مقصد اولویت‌دار</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="cityNotes">یادداشت‌ها</Label>
            <Textarea
              id="cityNotes"
              value={cityForm.notes}
              onChange={(e) => setCityForm({...cityForm, notes: e.target.value})}
              placeholder="یادداشت‌های اضافی..."
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCityOpen(false)}>
              انصراف
            </Button>
            <Button 
              onClick={() => createCityMutation.mutate(cityForm)}
              disabled={createCityMutation.isPending}
            >
              {createCityMutation.isPending ? 'در حال ذخیره...' : 'ذخیره شهر'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Shipping Rate Dialog */}
      <Dialog open={isAddRateOpen} onOpenChange={setIsAddRateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              افزودن نرخ حمل جدید
            </DialogTitle>
            <DialogDescription>
              نرخ حمل جدید برای کشور و شهر مشخص وارد کنید
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rateCountryId">کشور *</Label>
              <Select
                value={rateForm.countryId.toString()}
                onValueChange={(value) => setRateForm({...rateForm, countryId: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب کشور" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country: InternationalCountry) => (
                    <SelectItem key={country.id} value={country.id.toString()}>
                      {country.name} ({country.nameEn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rateCityId">شهر (اختیاری)</Label>
              <Select
                value={rateForm.cityId?.toString() || "all"}
                onValueChange={(value) => setRateForm({...rateForm, cityId: value === "all" ? null : parseInt(value) as any})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب شهر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه شهرها</SelectItem>
                  {cities
                    .filter((city: InternationalCity) => city.countryId === rateForm.countryId)
                    .map((city: InternationalCity) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {city.name} ({city.nameEn})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="shippingMethod">روش حمل *</Label>
              <Select
                value={rateForm.shippingMethod}
                onValueChange={(value) => setRateForm({...rateForm, shippingMethod: value as any})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SHIPPING_METHODS).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transportProvider">شرکت حمل *</Label>
              <Input
                id="transportProvider"
                value={rateForm.transportProvider}
                onChange={(e) => setRateForm({...rateForm, transportProvider: e.target.value})}
                placeholder="مثال: Turkish Cargo"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="basePrice">قیمت پایه *</Label>
              <Input
                id="basePrice"
                type="number"
                min="0"
                step="0.01"
                value={rateForm.basePrice}
                onChange={(e) => setRateForm({...rateForm, basePrice: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pricePerKg">قیمت هر کیلوگرم *</Label>
              <Input
                id="pricePerKg"
                type="number"
                min="0"
                step="0.01"
                value={rateForm.pricePerKg}
                onChange={(e) => setRateForm({...rateForm, pricePerKg: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pricePerKm">قیمت هر کیلومتر (اختیاری)</Label>
              <Input
                id="pricePerKm"
                type="number"
                min="0"
                step="0.01"
                value={rateForm.pricePerKm}
                onChange={(e) => setRateForm({...rateForm, pricePerKm: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minimumCharge">حداقل هزینه *</Label>
              <Input
                id="minimumCharge"
                type="number"
                min="0"
                step="0.01"
                value={rateForm.minimumCharge}
                onChange={(e) => setRateForm({...rateForm, minimumCharge: parseFloat(e.target.value) || 0})}
                placeholder="0.00"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maximumWeight">حداکثر وزن (کیلوگرم) *</Label>
              <Input
                id="maximumWeight"
                type="number"
                min="1"
                value={rateForm.maximumWeight}
                onChange={(e) => setRateForm({...rateForm, maximumWeight: parseFloat(e.target.value) || 1000})}
                placeholder="1000"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="currency">ارز *</Label>
              <Input
                id="currency"
                value={rateForm.currency}
                onChange={(e) => setRateForm({...rateForm, currency: e.target.value.toUpperCase()})}
                placeholder="USD"
                maxLength={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedDaysMin">حداقل زمان تحویل (روز) *</Label>
              <Input
                id="estimatedDaysMin"
                type="number"
                min="1"
                value={rateForm.estimatedDaysMin}
                onChange={(e) => setRateForm({...rateForm, estimatedDaysMin: parseInt(e.target.value) || 1})}
                placeholder="7"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="estimatedDaysMax">حداکثر زمان تحویل (روز) *</Label>
              <Input
                id="estimatedDaysMax"
                type="number"
                min="1"
                value={rateForm.estimatedDaysMax}
                onChange={(e) => setRateForm({...rateForm, estimatedDaysMax: parseInt(e.target.value) || 14})}
                placeholder="14"
                required
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="rateIsActive"
                checked={rateForm.isActive}
                onCheckedChange={(checked) => setRateForm({...rateForm, isActive: checked})}
              />
              <Label htmlFor="rateIsActive">فعال</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="supportsHazardous"
                checked={rateForm.supportsHazardous}
                onCheckedChange={(checked) => setRateForm({...rateForm, supportsHazardous: checked})}
              />
              <Label htmlFor="supportsHazardous">پشتیبانی از مواد خطرناک</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="supportsFlammable"
                checked={rateForm.supportsFlammable}
                onCheckedChange={(checked) => setRateForm({...rateForm, supportsFlammable: checked})}
              />
              <Label htmlFor="supportsFlammable">پشتیبانی از مواد آتش‌زا</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="supportsRefrigerated"
                checked={rateForm.supportsRefrigerated}
                onCheckedChange={(checked) => setRateForm({...rateForm, supportsRefrigerated: checked})}
              />
              <Label htmlFor="supportsRefrigerated">پشتیبانی از محصولات یخچالی</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="requiresCustomsClearance"
                checked={rateForm.requiresCustomsClearance}
                onCheckedChange={(checked) => setRateForm({...rateForm, requiresCustomsClearance: checked})}
              />
              <Label htmlFor="requiresCustomsClearance">نیاز به ترخیص گمرکی</Label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rateNotes">یادداشت‌ها</Label>
            <Textarea
              id="rateNotes"
              value={rateForm.notes}
              onChange={(e) => setRateForm({...rateForm, notes: e.target.value})}
              placeholder="یادداشت‌های اضافی..."
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRateOpen(false)}>
              انصراف
            </Button>
            <Button 
              onClick={() => createRateMutation.mutate(rateForm)}
              disabled={createRateMutation.isPending}
            >
              {createRateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره نرخ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Country Dialog */}
      <Dialog open={isEditCountryOpen} onOpenChange={setIsEditCountryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              ویرایش کشور
            </DialogTitle>
            <DialogDescription>
              اطلاعات کشور را ویرایش کنید
            </DialogDescription>
          </DialogHeader>
          
          {editingCountry && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editName">نام کشور (فارسی/عربی) *</Label>
                  <Input
                    id="editName"
                    defaultValue={editingCountry.name}
                    placeholder="مثال: ترکیه"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editNameEn">نام کشور (انگلیسی) *</Label>
                  <Input
                    id="editNameEn"
                    defaultValue={editingCountry.nameEn}
                    placeholder="مثال: Turkey"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editCountryCode">کد کشور *</Label>
                  <Input
                    id="editCountryCode"
                    defaultValue={editingCountry.countryCode}
                    placeholder="مثال: TR"
                    maxLength={3}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editRegion">منطقه *</Label>
                  <Select defaultValue={editingCountry.region}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(REGIONS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editCurrency">ارز *</Label>
                  <Input
                    id="editCurrency"
                    defaultValue={editingCountry.currency}
                    placeholder="مثال: TRY"
                    maxLength={3}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editNameLocal">نام محلی</Label>
                  <Input
                    id="editNameLocal"
                    defaultValue={editingCountry.nameLocal}
                    placeholder="مثال: Türkiye"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editIsActive"
                    defaultChecked={editingCountry.isActive}
                  />
                  <Label htmlFor="editIsActive">فعال</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editHasCustomsAgreement"
                    defaultChecked={editingCountry.hasCustomsAgreement}
                  />
                  <Label htmlFor="editHasCustomsAgreement">دارای توافق گمرکی</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editNotes">یادداشت‌ها</Label>
                <Textarea
                  id="editNotes"
                  defaultValue={editingCountry.notes}
                  placeholder="یادداشت‌های اضافی..."
                  rows={3}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditCountryOpen(false)}>
                  انصراف
                </Button>
                <Button 
                  onClick={() => {
                    const form = document.querySelector('#editName') as HTMLInputElement;
                    const nameEn = document.querySelector('#editNameEn') as HTMLInputElement;
                    const countryCode = document.querySelector('#editCountryCode') as HTMLInputElement;
                    const currency = document.querySelector('#editCurrency') as HTMLInputElement;
                    const nameLocal = document.querySelector('#editNameLocal') as HTMLInputElement;
                    const notes = document.querySelector('#editNotes') as HTMLTextAreaElement;
                    const isActive = document.querySelector('#editIsActive') as HTMLInputElement;
                    const hasCustomsAgreement = document.querySelector('#editHasCustomsAgreement') as HTMLInputElement;
                    
                    updateCountryMutation.mutate({
                      id: editingCountry.id,
                      data: {
                        name: form.value,
                        nameEn: nameEn.value,
                        countryCode: countryCode.value.toUpperCase(),
                        currency: currency.value.toUpperCase(),
                        nameLocal: nameLocal.value,
                        notes: notes.value,
                        isActive: isActive.checked,
                        hasCustomsAgreement: hasCustomsAgreement.checked
                      }
                    });
                  }}
                  disabled={updateCountryMutation.isPending}
                >
                  {updateCountryMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit City Dialog */}
      <Dialog open={isEditCityOpen} onOpenChange={setIsEditCityOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              ویرایش شهر بین‌المللی
            </DialogTitle>
            <DialogDescription>
              اطلاعات شهر را برای حمل بین‌المللی به‌روزرسانی کنید
            </DialogDescription>
          </DialogHeader>
          
          {editingCity && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editCityName">نام شهر (فارسی/عربی) *</Label>
                  <Input
                    id="editCityName"
                    defaultValue={editingCity.name}
                    placeholder="مثال: استانبول"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editCityNameEn">نام شهر (انگلیسی) *</Label>
                  <Input
                    id="editCityNameEn"
                    defaultValue={editingCity.nameEn}
                    placeholder="مثال: Istanbul"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editCityNameLocal">نام محلی</Label>
                  <Input
                    id="editCityNameLocal"
                    defaultValue={editingCity.nameLocal}
                    placeholder="مثال: İstanbul"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editCountryId">کشور *</Label>
                  <Select defaultValue={editingCity.countryId.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کشور" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country: InternationalCountry) => (
                        <SelectItem key={country.id} value={country.id.toString()}>
                          {country.name} ({country.nameEn})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editProvinceState">استان/ایالت</Label>
                  <Input
                    id="editProvinceState"
                    defaultValue={editingCity.provinceState}
                    placeholder="مثال: مرمره"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editCityType">نوع شهر *</Label>
                  <Select defaultValue={editingCity.cityType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CITY_TYPES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editDistanceFromErbilKm">فاصله از اربیل (کیلومتر) *</Label>
                  <Input
                    id="editDistanceFromErbilKm"
                    type="number"
                    defaultValue={editingCity.distanceFromErbilKm}
                    placeholder="مثال: 1200"
                    min="0"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editCustomsInformation">اطلاعات گمرکی</Label>
                  <Input
                    id="editCustomsInformation"
                    defaultValue={editingCity.customsInformation}
                    placeholder="مثال: دفتر گمرک اصلی"
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editCityIsActive"
                    defaultChecked={editingCity.isActive}
                  />
                  <Label htmlFor="editCityIsActive">فعال</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editHasShippingRoutes"
                    defaultChecked={editingCity.hasShippingRoutes}
                  />
                  <Label htmlFor="editHasShippingRoutes">دارای مسیر حمل</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editIsPriorityDestination"
                    defaultChecked={editingCity.isPriorityDestination}
                  />
                  <Label htmlFor="editIsPriorityDestination">مقصد اولویت‌دار</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editCityNotes">یادداشت‌ها</Label>
                <Textarea
                  id="editCityNotes"
                  defaultValue={editingCity.notes}
                  placeholder="یادداشت‌های اضافی..."
                  rows={3}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditCityOpen(false)}>
                  انصراف
                </Button>
                <Button 
                  onClick={() => {
                    const name = document.querySelector('#editCityName') as HTMLInputElement;
                    const nameEn = document.querySelector('#editCityNameEn') as HTMLInputElement;
                    const nameLocal = document.querySelector('#editCityNameLocal') as HTMLInputElement;
                    const countrySelect = document.querySelector('#editCountryId') as HTMLSelectElement;
                    const provinceState = document.querySelector('#editProvinceState') as HTMLInputElement;
                    const cityTypeSelect = document.querySelector('#editCityType') as HTMLSelectElement;
                    const distance = document.querySelector('#editDistanceFromErbilKm') as HTMLInputElement;
                    const customsInfo = document.querySelector('#editCustomsInformation') as HTMLInputElement;
                    const isActive = document.querySelector('#editCityIsActive') as HTMLInputElement;
                    const hasShippingRoutes = document.querySelector('#editHasShippingRoutes') as HTMLInputElement;
                    const isPriority = document.querySelector('#editIsPriorityDestination') as HTMLInputElement;
                    const notes = document.querySelector('#editCityNotes') as HTMLTextAreaElement;
                    
                    updateCityMutation.mutate({
                      id: editingCity.id,
                      data: {
                        name: name.value,
                        nameEn: nameEn.value,
                        nameLocal: nameLocal.value,
                        countryId: parseInt(countrySelect.value),
                        provinceState: provinceState.value,
                        cityType: cityTypeSelect.value,
                        distanceFromErbilKm: parseFloat(distance.value),
                        customsInformation: customsInfo.value,
                        isActive: isActive.checked,
                        hasShippingRoutes: hasShippingRoutes.checked,
                        isPriorityDestination: isPriority.checked,
                        notes: notes.value
                      }
                    });
                  }}
                  disabled={updateCityMutation.isPending}
                >
                  {updateCityMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Shipping Rate Dialog */}
      <Dialog open={isEditRateOpen} onOpenChange={setIsEditRateOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              ویرایش نرخ حمل بین‌المللی
            </DialogTitle>
            <DialogDescription>
              اطلاعات نرخ حمل را برای مقصد مورد نظر به‌روزرسانی کنید
            </DialogDescription>
          </DialogHeader>
          
          {editingRate && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editRateCountryId">کشور *</Label>
                  <Select defaultValue={editingRate.countryId.toString()}>
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب کشور" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country: InternationalCountry) => (
                        <SelectItem key={country.id} value={country.id.toString()}>
                          {country.name} ({country.nameEn})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editRateCityId">شهر (اختیاری)</Label>
                  <Select defaultValue={editingRate.cityId?.toString() || "all"}>
                    <SelectTrigger>
                      <SelectValue placeholder="همه شهرها" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه شهرها</SelectItem>
                      {cities.filter((city: InternationalCity) => 
                        city.countryId === editingRate.countryId
                      ).map((city: InternationalCity) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name} ({city.nameEn})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editShippingMethod">روش حمل *</Label>
                  <Select defaultValue={editingRate.shippingMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SHIPPING_METHODS).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editTransportProvider">شرکت حمل *</Label>
                  <Input
                    id="editTransportProvider"
                    defaultValue={editingRate.transportProvider}
                    placeholder="مثال: Turkish Airlines Cargo"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editBasePrice">قیمت پایه *</Label>
                  <Input
                    id="editBasePrice"
                    type="number"
                    defaultValue={editingRate.basePrice}
                    placeholder="مثال: 50000"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editPricePerKg">قیمت هر کیلوگرم *</Label>
                  <Input
                    id="editPricePerKg"
                    type="number"
                    defaultValue={editingRate.pricePerKg}
                    placeholder="مثال: 500"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editPricePerKm">قیمت هر کیلومتر</Label>
                  <Input
                    id="editPricePerKm"
                    type="number"
                    defaultValue={editingRate.pricePerKm || 0}
                    placeholder="مثال: 100"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editMinimumCharge">حداقل هزینه *</Label>
                  <Input
                    id="editMinimumCharge"
                    type="number"
                    defaultValue={editingRate.minimumCharge}
                    placeholder="مثال: 10000"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editMaximumWeight">حداکثر وزن (کیلوگرم) *</Label>
                  <Input
                    id="editMaximumWeight"
                    type="number"
                    defaultValue={editingRate.maximumWeight}
                    placeholder="مثال: 1000"
                    min="1"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editEstimatedDaysMin">حداقل زمان تحویل (روز) *</Label>
                  <Input
                    id="editEstimatedDaysMin"
                    type="number"
                    defaultValue={editingRate.estimatedDaysMin}
                    placeholder="مثال: 1"
                    min="1"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editEstimatedDaysMax">حداکثر زمان تحویل (روز) *</Label>
                  <Input
                    id="editEstimatedDaysMax"
                    type="number"
                    defaultValue={editingRate.estimatedDaysMax}
                    placeholder="مثال: 7"
                    min="1"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editCurrency">ارز *</Label>
                  <Input
                    id="editCurrency"
                    defaultValue={editingRate.currency}
                    placeholder="مثال: TRY"
                    maxLength={3}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editSupportsHazardous"
                    defaultChecked={editingRate.supportsHazardous}
                  />
                  <Label htmlFor="editSupportsHazardous">پشتیبانی از مواد خطرناک</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editSupportsFlammable"
                    defaultChecked={editingRate.supportsFlammable}
                  />
                  <Label htmlFor="editSupportsFlammable">پشتیبانی از مواد آتش‌زا</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editSupportsRefrigerated"
                    defaultChecked={editingRate.supportsRefrigerated}
                  />
                  <Label htmlFor="editSupportsRefrigerated">پشتیبانی از حمل یخچالی</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editRequiresCustomsClearance"
                    defaultChecked={editingRate.requiresCustomsClearance}
                  />
                  <Label htmlFor="editRequiresCustomsClearance">نیاز به ترخیص گمرکی</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="editRateIsActive"
                    defaultChecked={editingRate.isActive}
                  />
                  <Label htmlFor="editRateIsActive">فعال</Label>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="editRateNotes">یادداشت‌ها</Label>
                <Textarea
                  id="editRateNotes"
                  defaultValue={editingRate.notes}
                  placeholder="یادداشت‌های اضافی..."
                  rows={3}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditRateOpen(false)}>
                  انصراف
                </Button>
                <Button 
                  onClick={() => {
                    const countrySelect = document.querySelector('#editRateCountryId') as HTMLSelectElement;
                    const citySelect = document.querySelector('#editRateCityId') as HTMLSelectElement;
                    const methodSelect = document.querySelector('#editShippingMethod') as HTMLSelectElement;
                    const provider = document.querySelector('#editTransportProvider') as HTMLInputElement;
                    const basePrice = document.querySelector('#editBasePrice') as HTMLInputElement;
                    const pricePerKg = document.querySelector('#editPricePerKg') as HTMLInputElement;
                    const pricePerKm = document.querySelector('#editPricePerKm') as HTMLInputElement;
                    const minCharge = document.querySelector('#editMinimumCharge') as HTMLInputElement;
                    const maxWeight = document.querySelector('#editMaximumWeight') as HTMLInputElement;
                    const minDays = document.querySelector('#editEstimatedDaysMin') as HTMLInputElement;
                    const maxDays = document.querySelector('#editEstimatedDaysMax') as HTMLInputElement;
                    const currency = document.querySelector('#editCurrency') as HTMLInputElement;
                    const supportsHazardous = document.querySelector('#editSupportsHazardous') as HTMLInputElement;
                    const supportsFlammable = document.querySelector('#editSupportsFlammable') as HTMLInputElement;
                    const supportsRefrigerated = document.querySelector('#editSupportsRefrigerated') as HTMLInputElement;
                    const requiresCustoms = document.querySelector('#editRequiresCustomsClearance') as HTMLInputElement;
                    const isActive = document.querySelector('#editRateIsActive') as HTMLInputElement;
                    const notes = document.querySelector('#editRateNotes') as HTMLTextAreaElement;
                    
                    updateRateMutation.mutate({
                      id: editingRate.id,
                      data: {
                        countryId: parseInt(countrySelect.value),
                        cityId: citySelect.value === "all" ? null : parseInt(citySelect.value),
                        shippingMethod: methodSelect.value,
                        transportProvider: provider.value,
                        basePrice: parseFloat(basePrice.value),
                        pricePerKg: parseFloat(pricePerKg.value),
                        pricePerKm: parseFloat(pricePerKm.value) || 0,
                        minimumCharge: parseFloat(minCharge.value),
                        maximumWeight: parseFloat(maxWeight.value),
                        estimatedDaysMin: parseInt(minDays.value),
                        estimatedDaysMax: parseInt(maxDays.value),
                        currency: currency.value.toUpperCase(),
                        supportsHazardous: supportsHazardous.checked,
                        supportsFlammable: supportsFlammable.checked,
                        supportsRefrigerated: supportsRefrigerated.checked,
                        requiresCustomsClearance: requiresCustoms.checked,
                        isActive: isActive.checked,
                        notes: notes.value
                      }
                    });
                  }}
                  disabled={updateRateMutation.isPending}
                >
                  {updateRateMutation.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InternationalGeographyTab;