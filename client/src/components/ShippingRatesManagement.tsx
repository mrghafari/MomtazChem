import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, DollarSign, MapPin, Clock, Truck } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ShippingRate {
  id: number;
  deliveryMethod: string;
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

export default function ShippingRatesManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<ShippingRate | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<ShippingRateForm>({
    deliveryMethod: '',
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
  const { data: rates = [], isLoading } = useQuery({
    queryKey: ['/api/logistics/shipping-rates'],
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Fetch delivery methods for dropdown
  const { data: deliveryMethods = [] } = useQuery({
    queryKey: ['/api/delivery-methods'],
    retry: 3
  });

  // Create shipping rate
  const createMutation = useMutation({
    mutationFn: (data: ShippingRateForm) => apiRequest('/api/logistics/shipping-rates', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/shipping-rates'] });
      toast({ title: "موفقیت", description: "تعرفه ارسال جدید اضافه شد" });
      resetForm();
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در اضافه کردن تعرفه ارسال", variant: "destructive" });
    }
  });

  // Update shipping rate
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ShippingRateForm }) => 
      apiRequest(`/api/logistics/shipping-rates/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/shipping-rates'] });
      toast({ title: "موفقیت", description: "تعرفه ارسال به‌روزرسانی شد" });
      resetForm();
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در به‌روزرسانی تعرفه ارسال", variant: "destructive" });
    }
  });

  // Delete shipping rate
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/logistics/shipping-rates/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/shipping-rates'] });
      toast({ title: "موفقیت", description: "تعرفه ارسال حذف شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در حذف تعرفه ارسال", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      deliveryMethod: '',
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
      smsVerificationEnabled: rate.smsVerificationEnabled,
      description: rate.description || '',
      internalNotes: rate.internalNotes || ''
    });
    setEditingRate(rate);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.deliveryMethod.trim() || !formData.basePrice.trim()) {
      toast({ 
        title: "خطا", 
        description: "لطفاً روش ارسال و قیمت پایه را وارد کنید", 
        variant: "destructive" 
      });
      return;
    }

    if (editingRate) {
      updateMutation.mutate({ id: editingRate.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('fa-IR').format(parseInt(price || '0'));
  };

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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>مدیریت تعرفه‌های ارسال</CardTitle>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingRate(null)}>
                <Plus className="h-4 w-4 mr-2" />
                افزودن تعرفه جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRate ? 'ویرایش تعرفه ارسال' : 'افزودن تعرفه ارسال جدید'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div>
                      <Label>روش ارسال *</Label>
                      <Select 
                        value={formData.deliveryMethod} 
                        onValueChange={(value) => setFormData({...formData, deliveryMethod: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب روش ارسال" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryMethods.map((method: any) => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>نام شهر</Label>
                      <Input
                        value={formData.cityName}
                        onChange={(e) => setFormData({...formData, cityName: e.target.value})}
                        placeholder="خالی = همه شهرها"
                      />
                    </div>

                    <div>
                      <Label>نام استان</Label>
                      <Input
                        value={formData.provinceName}
                        onChange={(e) => setFormData({...formData, provinceName: e.target.value})}
                        placeholder="خالی = همه استان‌ها"
                      />
                    </div>

                    <div>
                      <Label>حداقل وزن (کیلوگرم) *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.minWeight}
                        onChange={(e) => setFormData({...formData, minWeight: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label>حداکثر وزن (کیلوگرم)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.maxWeight}
                        onChange={(e) => setFormData({...formData, maxWeight: e.target.value})}
                        placeholder="خالی = بدون محدودیت"
                      />
                    </div>

                    <div>
                      <Label>ابعاد حداکثر</Label>
                      <Input
                        value={formData.maxDimensions}
                        onChange={(e) => setFormData({...formData, maxDimensions: e.target.value})}
                        placeholder="طول × عرض × ارتفاع (سانتی‌متر)"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div>
                      <Label>قیمت پایه (دینار) *</Label>
                      <Input
                        type="number"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
                        required
                      />
                    </div>

                    <div>
                      <Label>قیمت هر کیلوگرم (دینار)</Label>
                      <Input
                        type="number"
                        value={formData.pricePerKg}
                        onChange={(e) => setFormData({...formData, pricePerKg: e.target.value})}
                      />
                    </div>

                    <div>
                      <Label>آستانه ارسال رایگان (دینار)</Label>
                      <Input
                        type="number"
                        value={formData.freeShippingThreshold}
                        onChange={(e) => setFormData({...formData, freeShippingThreshold: e.target.value})}
                        placeholder="خالی = بدون ارسال رایگان"
                      />
                    </div>

                    <div>
                      <Label>مدت تحویل تخمینی (روز)</Label>
                      <Input
                        type="number"
                        value={formData.estimatedDays}
                        onChange={(e) => setFormData({...formData, estimatedDays: parseInt(e.target.value) || 1})}
                      />
                    </div>

                    <div>
                      <Label>نرخ بیمه (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.insuranceRate}
                        onChange={(e) => setFormData({...formData, insuranceRate: e.target.value})}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.trackingAvailable}
                          onCheckedChange={(checked) => setFormData({...formData, trackingAvailable: checked})}
                        />
                        <Label>رهگیری در دسترس</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.insuranceAvailable}
                          onCheckedChange={(checked) => setFormData({...formData, insuranceAvailable: checked})}
                        />
                        <Label>بیمه در دسترس</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.smsVerificationEnabled}
                          onCheckedChange={(checked) => setFormData({...formData, smsVerificationEnabled: checked})}
                        />
                        <Label>تایید SMS</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                        />
                        <Label>فعال</Label>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>توضیحات (برای مشتریان)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="توضیحات نمایش داده شده به مشتریان"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>یادداشت‌های داخلی</Label>
                  <Textarea
                    value={formData.internalNotes}
                    onChange={(e) => setFormData({...formData, internalNotes: e.target.value})}
                    placeholder="یادداشت‌های مخصوص ادمین"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingRate ? 'به‌روزرسانی' : 'افزودن'}
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    انصراف
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rates.map((rate: ShippingRate) => (
              <div key={rate.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        <Truck className="h-3 w-3 mr-1" />
                        {rate.deliveryMethod}
                      </Badge>
                      {rate.cityName && (
                        <Badge variant="outline">
                          <MapPin className="h-3 w-3 mr-1" />
                          {rate.cityName}
                        </Badge>
                      )}
                      {rate.estimatedDays && (
                        <Badge variant="outline">
                          <Clock className="h-3 w-3 mr-1" />
                          {rate.estimatedDays} روز
                        </Badge>
                      )}
                      {!rate.isActive && (
                        <Badge variant="destructive">غیرفعال</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">قیمت پایه:</span>
                        <div className="font-medium">{formatPrice(rate.basePrice)} دینار</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">هر کیلوگرم:</span>
                        <div className="font-medium">{formatPrice(rate.pricePerKg)} دینار</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">حداقل وزن:</span>
                        <div className="font-medium">{rate.minWeight} کیلوگرم</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">ویژگی‌ها:</span>
                        <div className="flex gap-1">
                          {rate.trackingAvailable && <Badge variant="outline" className="text-xs">رهگیری</Badge>}
                          {rate.insuranceAvailable && <Badge variant="outline" className="text-xs">بیمه</Badge>}
                          {rate.smsVerificationEnabled && <Badge variant="outline" className="text-xs">SMS</Badge>}
                        </div>
                      </div>
                    </div>

                    {rate.description && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        {rate.description}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(rate)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteMutation.mutate(rate.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {rates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                هیچ تعرفه ارسالی تعریف نشده است
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}