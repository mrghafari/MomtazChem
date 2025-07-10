import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit, Plus, Package, Truck, Bike, Car, Plane, Ship } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface DeliveryMethod {
  id: number;
  value: string;
  label: string;
  icon: string;
  color: string;
  baseCost: string;
  costPerKg: string;
  minimumOrder: string;
  freeShippingThreshold: string | null;
  estimatedDays: number;
  maxDistance: number | null;
  availableAreas: string[] | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface DeliveryMethodForm {
  value: string;
  label: string;
  icon: string;
  color: string;
  baseCost: string;
  costPerKg: string;
  minimumOrder: string;
  freeShippingThreshold: string;
  estimatedDays: number;
  maxDistance: string;
  availableAreas: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

const iconOptions = [
  { value: 'package', label: 'Package', icon: Package },
  { value: 'truck', label: 'Truck', icon: Truck },
  { value: 'bike', label: 'Bike/Motorcycle', icon: Bike },
  { value: 'car', label: 'Car/Van', icon: Car },
  { value: 'plane', label: 'Plane', icon: Plane },
  { value: 'ship', label: 'Ship', icon: Ship },
];

const colorOptions = [
  { value: 'blue', label: 'آبی', class: 'bg-blue-100 text-blue-800' },
  { value: 'green', label: 'سبز', class: 'bg-green-100 text-green-800' },
  { value: 'yellow', label: 'زرد', class: 'bg-yellow-100 text-yellow-800' },
  { value: 'orange', label: 'نارنجی', class: 'bg-orange-100 text-orange-800' },
  { value: 'purple', label: 'بنفش', class: 'bg-purple-100 text-purple-800' },
  { value: 'red', label: 'قرمز', class: 'bg-red-100 text-red-800' },
  { value: 'indigo', label: 'نیلی', class: 'bg-indigo-100 text-indigo-800' },
  { value: 'pink', label: 'صورتی', class: 'bg-pink-100 text-pink-800' },
  { value: 'cyan', label: 'فیروزه‌ای', class: 'bg-cyan-100 text-cyan-800' },
  { value: 'emerald', label: 'زمردی', class: 'bg-emerald-100 text-emerald-800' },
  { value: 'gray', label: 'خاکستری', class: 'bg-gray-100 text-gray-800' },
];

export default function DeliveryMethodsManagement() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<DeliveryMethodForm>({
    value: '',
    label: '',
    icon: 'package',
    color: 'blue',
    baseCost: '0',
    costPerKg: '0',
    minimumOrder: '0',
    freeShippingThreshold: '',
    estimatedDays: 1,
    maxDistance: '',
    availableAreas: '',
    description: '',
    isActive: true,
    sortOrder: 0
  });

  // Fetch delivery methods
  const { data: methods = [], isLoading } = useQuery({
    queryKey: ['/api/logistics/delivery-methods'],
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Create delivery method
  const createMutation = useMutation({
    mutationFn: (data: DeliveryMethodForm) => apiRequest('/api/logistics/delivery-methods', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/delivery-methods'] });
      toast({ title: "موفقیت", description: "روش ارسال جدید اضافه شد" });
      resetForm();
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در اضافه کردن روش ارسال", variant: "destructive" });
    }
  });

  // Update delivery method
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: DeliveryMethodForm }) => 
      apiRequest(`/api/logistics/delivery-methods/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/delivery-methods'] });
      toast({ title: "موفقیت", description: "روش ارسال به‌روزرسانی شد" });
      resetForm();
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در به‌روزرسانی روش ارسال", variant: "destructive" });
    }
  });

  // Delete delivery method
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/logistics/delivery-methods/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/delivery-methods'] });
      toast({ title: "موفقیت", description: "روش ارسال حذف شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در حذف روش ارسال", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      value: '',
      label: '',
      icon: 'package',
      color: 'blue',
      baseCost: '0',
      costPerKg: '0',
      minimumOrder: '0',
      freeShippingThreshold: '',
      estimatedDays: 1,
      maxDistance: '',
      availableAreas: '',
      description: '',
      isActive: true,
      sortOrder: 0
    });
    setEditingMethod(null);
    setIsFormOpen(false);
  };

  const handleEdit = (method: DeliveryMethod) => {
    setFormData({
      value: method.value,
      label: method.label,
      icon: method.icon,
      color: method.color,
      baseCost: method.baseCost || '0',
      costPerKg: method.costPerKg || '0',
      minimumOrder: method.minimumOrder || '0',
      freeShippingThreshold: method.freeShippingThreshold || '',
      estimatedDays: method.estimatedDays || 1,
      maxDistance: method.maxDistance?.toString() || '',
      availableAreas: method.availableAreas?.join(', ') || '',
      description: method.description || '',
      isActive: method.isActive,
      sortOrder: method.sortOrder
    });
    setEditingMethod(method);
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.value.trim() || !formData.label.trim()) {
      toast({ 
        title: "خطا", 
        description: "لطفاً تمام فیلدهای الزامی را پر کنید", 
        variant: "destructive" 
      });
      return;
    }

    if (editingMethod) {
      updateMutation.mutate({ id: editingMethod.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.value === iconName);
    if (iconOption) {
      const IconComponent = iconOption.icon;
      return <IconComponent className="h-4 w-4" />;
    }
    return <Package className="h-4 w-4" />;
  };

  const getColorClass = (colorName: string) => {
    const colorOption = colorOptions.find(opt => opt.value === colorName);
    return colorOption?.class || 'bg-gray-100 text-gray-800';
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
          <CardTitle>مدیریت انواع روش‌های ارسال</CardTitle>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMethod(null)}>
                <Plus className="h-4 w-4 mr-2" />
                افزودن روش جدید
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingMethod ? 'ویرایش روش ارسال' : 'افزودن روش ارسال جدید'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>شناسه روش (انگلیسی) *</Label>
                  <Input
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})}
                    placeholder="e.g. express_delivery"
                    required
                  />
                </div>

                <div>
                  <Label>نام نمایشی *</Label>
                  <Input
                    value={formData.label}
                    onChange={(e) => setFormData({...formData, label: e.target.value})}
                    placeholder="مثل: ارسال اکسپرس"
                    required
                  />
                </div>

                <div>
                  <Label>آیکون</Label>
                  <Select 
                    value={formData.icon} 
                    onValueChange={(value) => setFormData({...formData, icon: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {iconOptions.map(option => {
                        const IconComponent = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <IconComponent className="h-4 w-4" />
                              {option.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>رنگ</Label>
                  <Select 
                    value={formData.color} 
                    onValueChange={(value) => setFormData({...formData, color: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded ${option.class}`}></div>
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>هزینه پایه (IQD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.baseCost}
                    onChange={(e) => setFormData({...formData, baseCost: e.target.value})}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>هزینه به ازای هر کیلوگرم (IQD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.costPerKg}
                    onChange={(e) => setFormData({...formData, costPerKg: e.target.value})}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>حداقل مبلغ سفارش (IQD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.minimumOrder}
                    onChange={(e) => setFormData({...formData, minimumOrder: e.target.value})}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>آستانه ارسال رایگان (IQD)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.freeShippingThreshold}
                    onChange={(e) => setFormData({...formData, freeShippingThreshold: e.target.value})}
                    placeholder="اختیاری - برای ارسال رایگان"
                  />
                </div>

                <div>
                  <Label>مدت زمان تحویل (روز)</Label>
                  <Input
                    type="number"
                    value={formData.estimatedDays}
                    onChange={(e) => setFormData({...formData, estimatedDays: parseInt(e.target.value) || 1})}
                    placeholder="1"
                  />
                </div>

                <div>
                  <Label>حداکثر فاصله (کیلومتر)</Label>
                  <Input
                    type="number"
                    value={formData.maxDistance}
                    onChange={(e) => setFormData({...formData, maxDistance: e.target.value})}
                    placeholder="اختیاری"
                  />
                </div>

                <div>
                  <Label>مناطق قابل ارسال</Label>
                  <Input
                    value={formData.availableAreas}
                    onChange={(e) => setFormData({...formData, availableAreas: e.target.value})}
                    placeholder="مثل: تهران، مشهد، اصفهان (با کاما جدا کنید)"
                  />
                </div>

                <div>
                  <Label>توضیحات</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="توضیحات برای مشتریان"
                  />
                </div>

                <div>
                  <Label>ترتیب نمایش</Label>
                  <Input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                  />
                  <Label>فعال</Label>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingMethod ? 'به‌روزرسانی' : 'افزودن'}
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
            {methods.map((method: DeliveryMethod) => (
              <div key={method.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={getColorClass(method.color)}>
                      <div className="flex items-center gap-1">
                        {getIconComponent(method.icon)}
                        {method.label}
                      </div>
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      ({method.value})
                    </div>
                    {!method.isActive && (
                      <Badge variant="secondary">غیرفعال</Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(method)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => deleteMutation.mutate(method.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Cost Details */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">هزینه پایه:</span>
                    <div className="font-medium">{parseFloat(method.baseCost || '0').toLocaleString()} IQD</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">هزینه/کیلو:</span>
                    <div className="font-medium">{parseFloat(method.costPerKg || '0').toLocaleString()} IQD</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">حداقل سفارش:</span>
                    <div className="font-medium">{parseFloat(method.minimumOrder || '0').toLocaleString()} IQD</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ارسال رایگان از:</span>
                    <div className="font-medium text-green-600">
                      {method.freeShippingThreshold && parseFloat(method.freeShippingThreshold) > 0 
                        ? `${parseFloat(method.freeShippingThreshold).toLocaleString()} IQD`
                        : 'تعریف نشده'
                      }
                    </div>
                  </div>
                </div>
                
                {/* Additional Details */}
                {(method.estimatedDays || method.description) && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {method.estimatedDays && (
                        <span>⏱️ {method.estimatedDays} روز تحویل</span>
                      )}
                      {method.description && (
                        <span>📝 {method.description}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {methods.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                هیچ روش ارسالی تعریف نشده است
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}