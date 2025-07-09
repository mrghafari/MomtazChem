import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Calculator, Settings, Info } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface VatSettings {
  id: number;
  vatRate: string;
  vatEnabled: boolean;
  exemptCategories: string[];
  exemptProductIds: number[];
  applicableRegions: string[];
  defaultRegion: string;
  vatIncludedInPrice: boolean;
  vatDisplayName: string;
  vatNumber?: string;
  shippingTaxable: boolean;
  minimumTaxableAmount?: string;
  isActive: boolean;
  effectiveDate: string;
  notes?: string;
}

interface VatForm {
  vatRate: string;
  vatEnabled: boolean;
  exemptCategories: string[];
  exemptProductIds: string;
  applicableRegions: string[];
  defaultRegion: string;
  vatIncludedInPrice: boolean;
  vatDisplayName: string;
  vatNumber: string;
  shippingTaxable: boolean;
  minimumTaxableAmount: string;
  notes: string;
}

const availableCategories = [
  'fuel-additives',
  'paint-solvents',
  'industrial-chemicals',
  'agricultural-products',
  'agricultural-fertilizers',
  'water-treatment',
  'paint-thinner',
  'technical-equipment',
  'commercial-goods'
];

const availableRegions = [
  'Iraq',
  'Kurdistan',
  'Baghdad',
  'Basra',
  'Erbil',
  'Sulaymaniyah',
  'Mosul',
  'Najaf',
  'Karbala'
];

export default function VatManagement() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<VatForm>({
    vatRate: '0',
    vatEnabled: false,
    exemptCategories: [],
    exemptProductIds: '',
    applicableRegions: ['Iraq'],
    defaultRegion: 'Iraq',
    vatIncludedInPrice: false,
    vatDisplayName: 'مالیات بر ارزش افزوده',
    vatNumber: '',
    shippingTaxable: false,
    minimumTaxableAmount: '',
    notes: ''
  });

  // Fetch current VAT settings
  const { data: vatData, isLoading } = useQuery({
    queryKey: ['/api/financial/vat-settings'],
    queryFn: () => apiRequest('/api/financial/vat-settings', 'GET')
  });

  // Update VAT settings mutation
  const updateVatMutation = useMutation({
    mutationFn: (data: VatForm) => apiRequest('/api/financial/vat-settings', 'PUT', {
      ...data,
      exemptProductIds: data.exemptProductIds ? 
        data.exemptProductIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : []
    }),
    onSuccess: () => {
      toast({ title: "موفق", description: "تنظیمات مالیات به‌روزرسانی شد" });
      queryClient.invalidateQueries({ queryKey: ['/api/financial/vat-settings'] });
      setIsEditing(false);
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در به‌روزرسانی تنظیمات مالیات", variant: "destructive" });
    }
  });

  const currentVat = vatData?.vatSettings;

  React.useEffect(() => {
    if (currentVat && !isEditing) {
      setFormData({
        vatRate: currentVat.vatRate || '0',
        vatEnabled: currentVat.vatEnabled || false,
        exemptCategories: currentVat.exemptCategories || [],
        exemptProductIds: (currentVat.exemptProductIds || []).join(', '),
        applicableRegions: currentVat.applicableRegions || ['Iraq'],
        defaultRegion: currentVat.defaultRegion || 'Iraq',
        vatIncludedInPrice: currentVat.vatIncludedInPrice || false,
        vatDisplayName: currentVat.vatDisplayName || 'مالیات بر ارزش افزوده',
        vatNumber: currentVat.vatNumber || '',
        shippingTaxable: currentVat.shippingTaxable || false,
        minimumTaxableAmount: currentVat.minimumTaxableAmount || '',
        notes: currentVat.notes || ''
      });
    }
  }, [currentVat, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateVatMutation.mutate(formData);
  };

  const toggleCategory = (category: string) => {
    const newCategories = formData.exemptCategories.includes(category)
      ? formData.exemptCategories.filter(c => c !== category)
      : [...formData.exemptCategories, category];
    setFormData({ ...formData, exemptCategories: newCategories });
  };

  const toggleRegion = (region: string) => {
    const newRegions = formData.applicableRegions.includes(region)
      ? formData.applicableRegions.filter(r => r !== region)
      : [...formData.applicableRegions, region];
    setFormData({ ...formData, applicableRegions: newRegions });
  };

  const formatPrice = (amount: string) => {
    if (!amount) return '0';
    return `${parseInt(amount).toLocaleString('fa-IR')} دینار`;
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
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="h-6 w-6" />
            مدیریت مالیات بر ارزش افزوده (VAT)
          </h2>
          <p className="text-gray-600">تنظیم نرخ و قوانین مالیات برای محصولات</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            ویرایش تنظیمات
          </Button>
        )}
      </div>

      {/* Current VAT Status */}
      {currentVat && !isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              وضعیت فعلی مالیات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {currentVat.vatRate}%
                </div>
                <div className="text-sm text-gray-600">نرخ مالیات</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold">
                  {currentVat.vatEnabled ? (
                    <Badge className="bg-green-100 text-green-800">فعال</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">غیرفعال</Badge>
                  )}
                </div>
                <div className="text-sm text-gray-600">وضعیت</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {(currentVat.exemptCategories || []).length}
                </div>
                <div className="text-sm text-gray-600">دسته معاف</div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">نام نمایشی:</span>
                <div>{currentVat.vatDisplayName}</div>
              </div>
              <div>
                <span className="font-medium">شماره مالیاتی:</span>
                <div>{currentVat.vatNumber || 'تعریف نشده'}</div>
              </div>
              <div>
                <span className="font-medium">هزینه ارسال:</span>
                <div>{currentVat.shippingTaxable ? 'مشمول مالیات' : 'معاف از مالیات'}</div>
              </div>
              <div>
                <span className="font-medium">حداقل مبلغ:</span>
                <div>{currentVat.minimumTaxableAmount ? formatPrice(currentVat.minimumTaxableAmount) : 'بدون محدودیت'}</div>
              </div>
            </div>

            {/* Exempt Categories */}
            {currentVat.exemptCategories && currentVat.exemptCategories.length > 0 && (
              <div className="mt-4">
                <span className="font-medium">دسته‌های معاف از مالیات:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {currentVat.exemptCategories.map((category: string) => (
                    <Badge key={category} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Important Notice about Shipping */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <strong>توجه:</strong> هزینه‌های ارسال و لجستیک طبق قوانین عراق معاف از مالیات بر ارزش افزوده هستند.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>ویرایش تنظیمات مالیات</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>نرخ مالیات (درصد)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.vatRate}
                    onChange={(e) => setFormData({...formData, vatRate: e.target.value})}
                    placeholder="9.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">مثال: 9 برای 9% مالیات</p>
                </div>

                <div>
                  <Label>نام نمایشی مالیات</Label>
                  <Input
                    value={formData.vatDisplayName}
                    onChange={(e) => setFormData({...formData, vatDisplayName: e.target.value})}
                    placeholder="مالیات بر ارزش افزوده"
                  />
                </div>

                <div>
                  <Label>شماره مالیاتی شرکت (اختیاری)</Label>
                  <Input
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({...formData, vatNumber: e.target.value})}
                    placeholder="شماره ثبت مالیاتی"
                  />
                </div>

                <div>
                  <Label>حداقل مبلغ برای مالیات (دینار - اختیاری)</Label>
                  <Input
                    type="number"
                    value={formData.minimumTaxableAmount}
                    onChange={(e) => setFormData({...formData, minimumTaxableAmount: e.target.value})}
                    placeholder="حداقل مبلغ سفارش"
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    checked={formData.vatEnabled}
                    onCheckedChange={(checked) => setFormData({...formData, vatEnabled: checked})}
                  />
                  <Label>فعال‌سازی محاسبه مالیات</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    checked={formData.vatIncludedInPrice}
                    onCheckedChange={(checked) => setFormData({...formData, vatIncludedInPrice: checked})}
                  />
                  <Label>مالیات در قیمت نمایشی گنجانده شده</Label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse">
                  <Switch
                    checked={formData.shippingTaxable}
                    onCheckedChange={(checked) => setFormData({...formData, shippingTaxable: checked})}
                    disabled={true}
                  />
                  <Label className="text-gray-400">هزینه ارسال مشمول مالیات (معاف در عراق)</Label>
                </div>
              </div>

              {/* Exempt Categories */}
              <div>
                <Label className="text-base font-medium">دسته‌های معاف از مالیات</Label>
                <p className="text-sm text-gray-600 mb-3">
                  دسته‌های محصولاتی که از پرداخت مالیات معاف هستند
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableCategories.map((category) => (
                    <div
                      key={category}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        formData.exemptCategories.includes(category)
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleCategory(category)}
                    >
                      <div className="text-sm">{category}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exempt Product IDs */}
              <div>
                <Label>شناسه محصولات معاف (اختیاری)</Label>
                <Input
                  value={formData.exemptProductIds}
                  onChange={(e) => setFormData({...formData, exemptProductIds: e.target.value})}
                  placeholder="123, 456, 789"
                />
                <p className="text-xs text-gray-500 mt-1">
                  شناسه محصولات خاص که از مالیات معاف هستند (با کاما جدا کنید)
                </p>
              </div>

              {/* Applicable Regions */}
              <div>
                <Label className="text-base font-medium">مناطق اعمال مالیات</Label>
                <p className="text-sm text-gray-600 mb-3">
                  مناطقی که مالیات در آنها اعمال می‌شود
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableRegions.map((region) => (
                    <div
                      key={region}
                      className={`p-2 border rounded cursor-pointer transition-colors ${
                        formData.applicableRegions.includes(region)
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => toggleRegion(region)}
                    >
                      <div className="text-sm">{region}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label>یادداشت‌های اداری</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="یادداشت‌های مربوط به تنظیمات مالیات"
                  rows={3}
                />
              </div>

              {/* Important Notice */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <strong>توجه مهم:</strong> طبق قوانین مالیاتی عراق، هزینه‌های حمل و نقل و ارسال معاف از مالیات بر ارزش افزوده هستند. 
                    این تنظیم به صورت خودکار اعمال می‌شود و تغییر آن امکان‌پذیر نیست.
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-2 pt-4">
                <Button 
                  type="submit" 
                  disabled={updateVatMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <Calculator className="h-4 w-4" />
                  به‌روزرسانی تنظیمات
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  انصراف
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}