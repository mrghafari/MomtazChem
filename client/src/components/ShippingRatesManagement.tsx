import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, Truck, Bike, Car, Package } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ShippingRate {
  id: number;
  deliveryMethod: string;
  transportationType?: string;
  cityName?: string;
  provinceName?: string;
  minWeight: string;
  maxWeight?: string;
  maxDimensions?: string;
  basePrice: string;
  pricePerKg: string;
  freeShippingThreshold?: string;
  estimatedDays?: number;
  trackingAvailable: boolean;
  insuranceAvailable: boolean;
  insuranceRate: string;
  isActive: boolean;
  smsVerificationEnabled: boolean;
  description?: string;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ShippingRateForm {
  deliveryMethod: string;
  transportationType?: string;
  cityName?: string;
  provinceName?: string;
  minWeight: string;
  maxWeight?: string;
  maxDimensions?: string;
  basePrice: string;
  pricePerKg: string;
  freeShippingThreshold?: string;
  estimatedDays?: number;
  trackingAvailable: boolean;
  insuranceAvailable: boolean;
  insuranceRate: string;
  isActive: boolean;
  smsVerificationEnabled: boolean;
  description?: string;
  internalNotes?: string;
}

const deliveryMethods = [
  { value: 'post', label: 'پست' },
  { value: 'courier', label: 'پیک موتوری' },
  { value: 'truck', label: 'کامیون' },
  { value: 'personal_pickup', label: 'تحویل حضوری' }
];

const transportationTypes = [
  { value: 'motorcycle', label: 'موتور' },
  { value: 'car', label: 'ماشین' },
  { value: 'truck', label: 'کامیون' },
  { value: 'van', label: 'ون' }
];

const getMethodIcon = (method: string) => {
  switch (method) {
    case 'post': return <Package className="h-4 w-4" />;
    case 'courier': return <Bike className="h-4 w-4" />;
    case 'truck': return <Truck className="h-4 w-4" />;
    default: return <Car className="h-4 w-4" />;
  }
};

const getMethodColor = (method: string) => {
  switch (method) {
    case 'post': return 'bg-blue-100 text-blue-800';
    case 'courier': return 'bg-green-100 text-green-800';
    case 'truck': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function ShippingRatesManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ShippingRateForm>({
    deliveryMethod: 'courier',
    transportationType: 'motorcycle',
    cityName: '',
    provinceName: '',
    minWeight: '0',
    maxWeight: '',
    maxDimensions: '',
    basePrice: '0',
    pricePerKg: '0',
    freeShippingThreshold: '',
    estimatedDays: 1,
    trackingAvailable: false,
    insuranceAvailable: false,
    insuranceRate: '0',
    isActive: true,
    smsVerificationEnabled: true,
    description: '',
    internalNotes: ''
  });

  // Fetch shipping rates
  const { data: ratesData, isLoading } = useQuery({
    queryKey: ['/api/logistics/shipping-rates'],
    queryFn: () => apiRequest('/api/logistics/shipping-rates')
  });

  // Create shipping rate mutation
  const createRateMutation = useMutation({
    mutationFn: (data: ShippingRateForm) => apiRequest('/api/logistics/shipping-rates', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast({ title: "موفق", description: "تعرفه ارسال جدید ایجاد شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/shipping-rates'] });
      resetForm();
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در ایجاد تعرفه ارسال", variant: "destructive" });
    }
  });

  // Update shipping rate mutation
  const updateRateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ShippingRateForm }) => 
      apiRequest(`/api/logistics/shipping-rates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      toast({ title: "موفق", description: "تعرفه ارسال به‌روزرسانی شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/shipping-rates'] });
      resetForm();
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در به‌روزرسانی تعرفه ارسال", variant: "destructive" });
    }
  });

  // Delete shipping rate mutation
  const deleteRateMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/logistics/shipping-rates/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast({ title: "موفق", description: "تعرفه ارسال حذف شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/shipping-rates'] });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در حذف تعرفه ارسال", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      deliveryMethod: 'courier',
      transportationType: 'motorcycle',
      cityName: '',
      provinceName: '',
      minWeight: '0',
      maxWeight: '',
      maxDimensions: '',
      basePrice: '0',
      pricePerKg: '0',
      freeShippingThreshold: '',
      estimatedDays: 1,
      trackingAvailable: false,
      insuranceAvailable: false,
      insuranceRate: '0',
      isActive: true,
      smsVerificationEnabled: true,
      description: '',
      internalNotes: ''
    });
    setEditingRate(null);
    setIsFormOpen(false);
  };

  const handleEdit = (rate: ShippingRate) => {
    setFormData({
      deliveryMethod: rate.deliveryMethod,
      transportationType: rate.transportationType || 'motorcycle',
      cityName: rate.cityName || '',
      provinceName: rate.provinceName || '',
      minWeight: rate.minWeight,
      maxWeight: rate.maxWeight || '',
      maxDimensions: rate.maxDimensions || '',
      basePrice: rate.basePrice,
      pricePerKg: rate.pricePerKg,
      freeShippingThreshold: rate.freeShippingThreshold || '',
      estimatedDays: rate.estimatedDays || 1,
      trackingAvailable: rate.trackingAvailable,
      insuranceAvailable: rate.insuranceAvailable,
      insuranceRate: rate.insuranceRate,
      isActive: rate.isActive,
      smsVerificationEnabled: rate.smsVerificationEnabled || false,
      description: rate.description || '',
      internalNotes: rate.internalNotes || ''
    });
    setEditingRate(rate);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRate) {
      updateRateMutation.mutate({ id: editingRate.id, data: formData });
    } else {
      createRateMutation.mutate(formData);
    }
  };

  const formatPrice = (price: string) => {
    return `${parseInt(price).toLocaleString('fa-IR')} دینار`;
  };

  const rates = ratesData?.rates || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">در حال بارگذاری...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">مدیریت تعرفه‌های ارسال</h2>
          <p className="text-gray-600">تنظیم هزینه‌های ارسال برای روش‌های مختلف</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          تعرفه جدید
        </Button>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <Card>
          <CardHeader>
            <CardTitle>{editingRate ? 'ویرایش تعرفه ارسال' : 'ایجاد تعرفه ارسال جدید'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Delivery Method */}
                <div>
                  <Label>روش ارسال</Label>
                  <Select 
                    value={formData.deliveryMethod} 
                    onValueChange={(value) => setFormData({...formData, deliveryMethod: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {deliveryMethods.map(method => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Transportation Type */}
                {formData.deliveryMethod === 'courier' && (
                  <div>
                    <Label>نوع وسیله نقلیه</Label>
                    <Select 
                      value={formData.transportationType} 
                      onValueChange={(value) => setFormData({...formData, transportationType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {transportationTypes.map(type => (
                          <SelectItem key={type.value} value={type.value || 'motorcycle'}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* City Name */}
                <div>
                  <Label>شهر (اختیاری - برای همه شهرها خالی بگذارید)</Label>
                  <Input
                    value={formData.cityName}
                    onChange={(e) => setFormData({...formData, cityName: e.target.value})}
                    placeholder="نام شهر"
                  />
                </div>

                {/* Province Name */}
                <div>
                  <Label>استان (اختیاری)</Label>
                  <Input
                    value={formData.provinceName}
                    onChange={(e) => setFormData({...formData, provinceName: e.target.value})}
                    placeholder="نام استان"
                  />
                </div>

                {/* Base Price */}
                <div>
                  <Label>هزینه پایه (دینار)</Label>
                  <Input
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                    placeholder="0"
                    required
                  />
                </div>

                {/* Price Per Kg */}
                <div>
                  <Label>هزینه هر کیلوگرم (دینار)</Label>
                  <Input
                    type="number"
                    value={formData.pricePerKg}
                    onChange={(e) => setFormData({...formData, pricePerKg: e.target.value})}
                    placeholder="0"
                  />
                </div>

                {/* Min Weight */}
                <div>
                  <Label>حداقل وزن (کیلوگرم)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.minWeight}
                    onChange={(e) => setFormData({...formData, minWeight: e.target.value})}
                    placeholder="0"
                  />
                </div>

                {/* Max Weight */}
                <div>
                  <Label>حداکثر وزن (کیلوگرم - اختیاری)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.maxWeight}
                    onChange={(e) => setFormData({...formData, maxWeight: e.target.value})}
                    placeholder="بدون محدودیت"
                  />
                </div>

                {/* Free Shipping Threshold */}
                <div>
                  <Label>آستانه ارسال رایگان (دینار - اختیاری)</Label>
                  <Input
                    type="number"
                    value={formData.freeShippingThreshold}
                    onChange={(e) => setFormData({...formData, freeShippingThreshold: e.target.value})}
                    placeholder="مبلغ برای ارسال رایگان"
                  />
                </div>

                {/* Estimated Days */}
                <div>
                  <Label>زمان تحویل (روز)</Label>
                  <Input
                    type="number"
                    value={formData.estimatedDays}
                    onChange={(e) => setFormData({...formData, estimatedDays: parseInt(e.target.value)})}
                    placeholder="1"
                  />
                </div>

                {/* Insurance Rate */}
                <div>
                  <Label>نرخ بیمه (درصد)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.insuranceRate}
                    onChange={(e) => setFormData({...formData, insuranceRate: e.target.value})}
                    placeholder="0"
                  />
                </div>

                {/* Max Dimensions */}
                <div>
                  <Label>حداکثر ابعاد (سانتی‌متر - اختیاری)</Label>
                  <Input
                    value={formData.maxDimensions}
                    onChange={(e) => setFormData({...formData, maxDimensions: e.target.value})}
                    placeholder="طول x عرض x ارتفاع"
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.trackingAvailable}
                    onCheckedChange={(checked) => setFormData({...formData, trackingAvailable: checked})}
                  />
                  <Label>رهگیری موجود</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.insuranceAvailable}
                    onCheckedChange={(checked) => setFormData({...formData, insuranceAvailable: checked})}
                  />
                  <Label>بیمه موجود</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label>فعال</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.smsVerificationEnabled}
                    onCheckedChange={(checked) => setFormData({...formData, smsVerificationEnabled: checked})}
                  />
                  <Label>تأیید پیامکی</Label>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>توضیحات (برای مشتریان)</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="توضیحات روش ارسال برای نمایش به مشتریان"
                  rows={2}
                />
              </div>

              {/* Internal Notes */}
              <div>
                <Label>یادداشت‌های داخلی</Label>
                <Textarea
                  value={formData.internalNotes}
                  onChange={(e) => setFormData({...formData, internalNotes: e.target.value})}
                  placeholder="یادداشت‌های داخلی (فقط برای ادمین‌ها)"
                  rows={2}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={createRateMutation.isPending || updateRateMutation.isPending}
                >
                  {editingRate ? 'به‌روزرسانی' : 'ایجاد'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Rates List */}
      <div className="grid gap-4">
        {rates.map((rate: ShippingRate) => (
          <Card key={rate.id} className={`${!rate.isActive ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getMethodIcon(rate.deliveryMethod)}
                    <Badge className={getMethodColor(rate.deliveryMethod)}>
                      {deliveryMethods.find(m => m.value === rate.deliveryMethod)?.label}
                    </Badge>
                    {rate.transportationType && (
                      <Badge variant="outline">
                        {transportationTypes.find(t => t.value === rate.transportationType)?.label}
                      </Badge>
                    )}
                    {!rate.isActive && <Badge variant="secondary">غیرفعال</Badge>}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">هزینه پایه:</span>
                      <div className="font-medium">{formatPrice(rate.basePrice)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">هر کیلوگرم:</span>
                      <div className="font-medium">{formatPrice(rate.pricePerKg)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">زمان تحویل:</span>
                      <div className="font-medium">{rate.estimatedDays} روز</div>
                    </div>
                    <div>
                      <span className="text-gray-500">منطقه:</span>
                      <div className="font-medium">{rate.cityName || 'سراسری'}</div>
                    </div>
                  </div>

                  {rate.freeShippingThreshold && (
                    <div className="mt-2 text-sm text-green-600">
                      ارسال رایگان برای خرید بالای {formatPrice(rate.freeShippingThreshold)}
                    </div>
                  )}

                  {rate.description && (
                    <div className="mt-2 text-sm text-gray-600">{rate.description}</div>
                  )}

                  <div className="flex gap-2 mt-2">
                    {rate.trackingAvailable && (
                      <Badge variant="outline" className="text-xs">رهگیری</Badge>
                    )}
                    {rate.insuranceAvailable && (
                      <Badge variant="outline" className="text-xs">بیمه</Badge>
                    )}
                    {rate.smsVerificationEnabled && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">تأیید پیامکی</Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(rate)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteRateMutation.mutate(rate.id)}
                    disabled={deleteRateMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {rates.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">هنوز تعرفه ارسالی تعریف نشده است</p>
              <Button onClick={() => setIsFormOpen(true)} className="mt-4">
                ایجاد اولین تعرفه
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}