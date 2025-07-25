import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Package, 
  Flame, 
  Weight, 
  MapPin,
  Phone,
  Globe,
  Clock,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PostalService {
  id: number;
  name: string;
  nameEn?: string;
  contactInfo?: string;
  phone: string;
  email?: string;
  website?: string;
  maxWeightKg: number;
  allowsFlammable: boolean;
  basePrice: number;
  pricePerKg: number;
  estimatedDays: number;
  trackingAvailable: boolean;
  isActive: boolean;
  supportedRegions?: string[];
  specialRequirements?: string;
}

const PostalServicesTab = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<PostalService | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    contactInfo: '',
    phone: '',
    email: '',
    website: '',
    maxWeightKg: 0,
    allowsFlammable: false,
    basePrice: 0,
    pricePerKg: 0,
    estimatedDays: 1,
    trackingAvailable: false,
    isActive: true,
    supportedRegions: '',
    specialRequirements: ''
  });

  // Fetch postal services data
  const { data: postalServicesResponse, isLoading: loadingPostalServices } = useQuery({
    queryKey: ['/api/logistics/postal-services'],
    enabled: true
  });

  const postalServices = (postalServicesResponse as any)?.data || [];

  // Create postal service mutation
  const createPostalServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/logistics/postal-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          supportedRegions: data.supportedRegions ? data.supportedRegions.split(',').map((r: string) => r.trim()) : []
        })
      });
      if (!response.ok) throw new Error('Failed to create postal service');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/postal-services'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "موفق", description: "سرویس پستی جدید ثبت شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در ایجاد سرویس پستی", variant: "destructive" });
    }
  });

  // Update postal service mutation
  const updatePostalServiceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/logistics/postal-services/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          supportedRegions: data.supportedRegions ? data.supportedRegions.split(',').map((r: string) => r.trim()) : []
        })
      });
      if (!response.ok) throw new Error('Failed to update postal service');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/postal-services'] });
      setEditingService(null);
      resetForm();
      toast({ title: "موفق", description: "سرویس پستی بروزرسانی شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در بروزرسانی سرویس پستی", variant: "destructive" });
    }
  });

  // Delete postal service mutation
  const deletePostalServiceMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/logistics/postal-services/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete postal service');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/postal-services'] });
      toast({ title: "موفق", description: "سرویس پستی حذف شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در حذف سرویس پستی", variant: "destructive" });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      nameEn: '',
      contactInfo: '',
      phone: '',
      email: '',
      website: '',
      maxWeightKg: 0,
      allowsFlammable: false,
      basePrice: 0,
      pricePerKg: 0,
      estimatedDays: 1,
      trackingAvailable: false,
      isActive: true,
      supportedRegions: '',
      specialRequirements: ''
    });
  };

  const handleEdit = (service: PostalService) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      nameEn: service.nameEn || '',
      contactInfo: service.contactInfo || '',
      phone: service.phone,
      email: service.email || '',
      website: service.website || '',
      maxWeightKg: service.maxWeightKg,
      allowsFlammable: service.allowsFlammable,
      basePrice: service.basePrice,
      pricePerKg: service.pricePerKg,
      estimatedDays: service.estimatedDays,
      trackingAvailable: service.trackingAvailable,
      isActive: service.isActive,
      supportedRegions: service.supportedRegions?.join(', ') || '',
      specialRequirements: service.specialRequirements || ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      toast({ 
        title: "خطا", 
        description: "لطفاً نام سرویس و شماره تماس را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    if (editingService) {
      updatePostalServiceMutation.mutate({ ...formData, id: editingService.id });
    } else {
      createPostalServiceMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('آیا از حذف این سرویس پستی اطمینان دارید؟')) {
      deletePostalServiceMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold">خدمات پستی</h3>
          <Badge variant="outline">{postalServices.length} سرویس ثبت شده</Badge>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingService(null); }}>
              <Plus className="w-4 h-4 mr-2" />
              سرویس پستی جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'ویرایش سرویس پستی' : 'ثبت سرویس پستی جدید'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">نام سرویس پستی *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: پست عراق"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nameEn">نام انگلیسی</Label>
                  <Input
                    id="nameEn"
                    value={formData.nameEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                    placeholder="Iraq Post"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">شماره تماس *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+964xxxxxxxxx"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="info@iraqpost.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="website">وب‌سایت</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://www.iraqpost.com"
                />
              </div>

              <div>
                <Label htmlFor="contactInfo">اطلاعات تماس اضافی</Label>
                <Textarea
                  id="contactInfo"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                  placeholder="آدرس دفتر مرکزی، شعبه‌ها و سایر اطلاعات"
                  rows={2}
                />
              </div>

              {/* Service Specifications */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxWeightKg">حداکثر وزن (کیلوگرم)</Label>
                  <Input
                    id="maxWeightKg"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.maxWeightKg}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxWeightKg: parseFloat(e.target.value) || 0 }))}
                    placeholder="30"
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedDays">زمان تحویل (روز)</Label>
                  <Input
                    id="estimatedDays"
                    type="number"
                    min="1"
                    value={formData.estimatedDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDays: parseInt(e.target.value) || 1 }))}
                    placeholder="3"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="basePrice">هزینه پایه (دینار)</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    min="0"
                    value={formData.basePrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                    placeholder="5000"
                  />
                </div>
                <div>
                  <Label htmlFor="pricePerKg">هزینه هر کیلو (دینار)</Label>
                  <Input
                    id="pricePerKg"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.pricePerKg}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricePerKg: parseFloat(e.target.value) || 0 }))}
                    placeholder="1000"
                  />
                </div>
              </div>

              {/* Restrictions and Features */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="allowsFlammable" className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-red-500" />
                    قابلیت حمل مواد قابل اشتعال
                  </Label>
                  <Switch
                    id="allowsFlammable"
                    checked={formData.allowsFlammable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, allowsFlammable: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="trackingAvailable" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    قابلیت ردیابی مرسوله
                  </Label>
                  <Switch
                    id="trackingAvailable"
                    checked={formData.trackingAvailable}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, trackingAvailable: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive" className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    فعال بودن سرویس
                  </Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="supportedRegions">نواحی تحت پوشش</Label>
                <Input
                  id="supportedRegions"
                  value={formData.supportedRegions}
                  onChange={(e) => setFormData(prev => ({ ...prev, supportedRegions: e.target.value }))}
                  placeholder="بغداد، اربیل، بصره، موصل (جدا شده با کاما)"
                />
              </div>

              <div>
                <Label htmlFor="specialRequirements">الزامات ویژه</Label>
                <Textarea
                  id="specialRequirements"
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequirements: e.target.value }))}
                  placeholder="الزامات بسته‌بندی، مدارک مورد نیاز، و سایر الزامات"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingService(null);
                  resetForm();
                }}>
                  انصراف
                </Button>
                <Button type="submit" disabled={createPostalServiceMutation.isPending || updatePostalServiceMutation.isPending}>
                  {createPostalServiceMutation.isPending || updatePostalServiceMutation.isPending ? 'در حال ذخیره...' : (editingService ? 'بروزرسانی' : 'ثبت سرویس')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingService} onOpenChange={(open) => {
          if (!open) {
            setEditingService(null);
            resetForm();
          }
        }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>ویرایش سرویس پستی</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Same form fields as above - duplicated for edit dialog */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">نام سرویس پستی *</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="مثال: پست عراق"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-nameEn">نام انگلیسی</Label>
                  <Input
                    id="edit-nameEn"
                    value={formData.nameEn}
                    onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                    placeholder="Iraq Post"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-phone">شماره تماس *</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+964xxxxxxxxx"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-email">ایمیل</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="info@iraqpost.com"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setEditingService(null);
                  resetForm();
                }}>
                  انصراف
                </Button>
                <Button type="submit" disabled={updatePostalServiceMutation.isPending}>
                  {updatePostalServiceMutation.isPending ? 'در حال بروزرسانی...' : 'بروزرسانی'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Postal Services List */}
      <div className="grid gap-4">
        {loadingPostalServices ? (
          <div className="text-center py-8">در حال بارگذاری...</div>
        ) : postalServices.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">هیچ سرویس پستی ثبت نشده است</p>
              <p className="text-sm text-gray-400 mt-2">
                برای شروع، سرویس پستی جدید اضافه کنید
              </p>
            </CardContent>
          </Card>
        ) : (
          postalServices.map((service: PostalService) => (
            <Card key={service.id} className={`border-l-4 ${service.isActive ? 'border-l-green-500' : 'border-l-red-500'}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-lg">{service.name}</h4>
                      {service.nameEn && (
                        <span className="text-sm text-gray-500">({service.nameEn})</span>
                      )}
                      <Badge className={service.isActive ? 'bg-green-500' : 'bg-red-500'}>
                        {service.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </div>

                    {/* Contact Information */}
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {service.phone}
                      </span>
                      {service.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {service.email}
                        </span>
                      )}
                      {service.website && (
                        <a 
                          href={service.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Globe className="w-3 h-3" />
                          وب‌سایت
                        </a>
                      )}
                    </div>

                    {/* Service Specifications */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Weight className="w-3 h-3 text-gray-500" />
                        حداکثر: {service.maxWeightKg} کیلو
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-500" />
                        {service.estimatedDays} روز تحویل
                      </span>
                      <span>هزینه پایه: {service.basePrice.toLocaleString()} دینار</span>
                      <span>هر کیلو: {service.pricePerKg.toLocaleString()} دینار</span>
                    </div>

                    {/* Features and Restrictions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {service.allowsFlammable ? (
                        <Badge variant="outline" className="bg-red-50 border-red-200 text-red-700">
                          <Flame className="w-3 h-3 mr-1" />
                          قابل اشتعال ✓
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-600">
                          <XCircle className="w-3 h-3 mr-1" />
                          بدون مواد قابل اشتعال
                        </Badge>
                      )}
                      
                      {service.trackingAvailable && (
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
                          <MapPin className="w-3 h-3 mr-1" />
                          ردیابی ✓
                        </Badge>
                      )}
                    </div>

                    {/* Supported Regions */}
                    {service.supportedRegions && service.supportedRegions.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-600">نواحی تحت پوشش: </span>
                        <span className="text-blue-600">{service.supportedRegions.join('، ')}</span>
                      </div>
                    )}

                    {/* Special Requirements */}
                    {service.specialRequirements && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">الزامات ویژه: </span>
                        {service.specialRequirements}
                      </div>
                    )}

                    {/* Contact Info */}
                    {service.contactInfo && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">اطلاعات تماس: </span>
                        {service.contactInfo}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(service)}>
                      <Edit className="w-4 h-4 mr-1" />
                      ویرایش
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleDelete(service.id)}
                      disabled={deletePostalServiceMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default PostalServicesTab;