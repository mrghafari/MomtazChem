import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Truck, Plus, Edit, Trash2, Save, X } from "lucide-react";

interface VehicleType {
  id: number;
  code: string;
  nameFa: string;
  nameEn: string | null;
  nameAr: string | null;
  nameKu: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function VehicleTypesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<VehicleType | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    nameFa: '',
    nameEn: '',
    nameAr: '',
    nameKu: '',
    description: '',
    sortOrder: 0
  });

  // Fetch vehicle types
  const { data: vehicleTypesData, isLoading } = useQuery({
    queryKey: ['/api/logistics/vehicle-types']
  });

  // Create vehicle type mutation
  const createTypeMutation = useMutation({
    mutationFn: (data: Partial<VehicleType>) => 
      apiRequest('/api/logistics/vehicle-types', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-types'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({ title: "موفقیت", description: "نوع خودرو جدید ایجاد شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در ایجاد نوع خودرو", variant: "destructive" });
    }
  });

  // Update vehicle type mutation
  const updateTypeMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<VehicleType> & { id: number }) => 
      apiRequest(`/api/logistics/vehicle-types/${id}`, { method: 'PATCH', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-types'] });
      setEditingType(null);
      resetForm();
      toast({ title: "موفقیت", description: "نوع خودرو بروزرسانی شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در بروزرسانی نوع خودرو", variant: "destructive" });
    }
  });

  // Delete vehicle type mutation
  const deleteTypeMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/logistics/vehicle-types/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-types'] });
      toast({ title: "موفقیت", description: "نوع خودرو حذف شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در حذف نوع خودرو", variant: "destructive" });
    }
  });

  const vehicleTypes: VehicleType[] = vehicleTypesData?.data || [];

  const resetForm = () => {
    setFormData({
      code: '',
      nameFa: '',
      nameEn: '',
      nameAr: '',
      nameKu: '',
      description: '',
      sortOrder: 0
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.nameFa) {
      toast({ 
        title: "خطا", 
        description: "کد و نام فارسی الزامی است", 
        variant: "destructive" 
      });
      return;
    }

    if (editingType) {
      updateTypeMutation.mutate({ 
        id: editingType.id, 
        ...formData 
      });
    } else {
      createTypeMutation.mutate(formData);
    }
  };

  const handleEdit = (vehicleType: VehicleType) => {
    setEditingType(vehicleType);
    setFormData({
      code: vehicleType.code,
      nameFa: vehicleType.nameFa,
      nameEn: vehicleType.nameEn || '',
      nameAr: vehicleType.nameAr || '',
      nameKu: vehicleType.nameKu || '',
      description: vehicleType.description || '',
      sortOrder: vehicleType.sortOrder
    });
    setIsCreateDialogOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingType(null);
    setIsCreateDialogOpen(false);
    resetForm();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="w-6 h-6" />
            دسته‌بندی خودرو سطح یک
          </h1>
          <p className="text-gray-600 mt-1">
            مدیریت و تنظیم دسته‌بندی‌های سطح یک خودروها برای سیستم لجستیک
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="w-4 h-4 ml-2" />
              افزودن دسته‌بندی جدید
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'ویرایش دسته‌بندی خودرو' : 'افزودن دسته‌بندی جدید'}
              </DialogTitle>
              <DialogDescription>
                {editingType 
                  ? 'اطلاعات دسته‌بندی خودرو را ویرایش کنید'
                  : 'اطلاعات دسته‌بندی خودرو جدید را وارد کنید'
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">کد انگلیسی *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  placeholder="مثال: heavy_truck"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  از حروف انگلیسی کوچک و خط فاصل استفاده کنید
                </p>
              </div>

              <div>
                <Label htmlFor="nameFa">نام فارسی *</Label>
                <Input
                  id="nameFa"
                  value={formData.nameFa}
                  onChange={(e) => setFormData({...formData, nameFa: e.target.value})}
                  placeholder="مثال: کامیون سنگین"
                  required
                />
              </div>

              <div>
                <Label htmlFor="nameEn">نام انگلیسی</Label>
                <Input
                  id="nameEn"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                  placeholder="مثال: Heavy Truck"
                />
              </div>

              <div>
                <Label htmlFor="nameAr">نام عربی</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({...formData, nameAr: e.target.value})}
                  placeholder="مثال: شاحنة ثقيلة"
                />
              </div>

              <div>
                <Label htmlFor="nameKu">نام کردی</Label>
                <Input
                  id="nameKu"
                  value={formData.nameKu}
                  onChange={(e) => setFormData({...formData, nameKu: e.target.value})}
                  placeholder="مثال: لۆری قورس"
                />
              </div>

              <div>
                <Label htmlFor="description">توضیحات</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="توضیحات اختیاری در مورد این نوع خودرو"
                />
              </div>

              <div>
                <Label htmlFor="sortOrder">اولویت نمایش</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  عدد کمتر = نمایش بالاتر در لیست
                </p>
              </div>

              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  <X className="w-4 h-4 ml-2" />
                  لغو
                </Button>
                <Button type="submit" disabled={createTypeMutation.isPending || updateTypeMutation.isPending}>
                  <Save className="w-4 h-4 ml-2" />
                  {editingType ? 'بروزرسانی' : 'ایجاد'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>دسته‌بندی‌های خودرو موجود</CardTitle>
        </CardHeader>
        <CardContent>
          {vehicleTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              هیچ نوع خودرویی تعریف نشده است. اولین نوع خودرو را اضافه کنید.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>کد</TableHead>
                  <TableHead>نام فارسی</TableHead>
                  <TableHead>نام انگلیسی</TableHead>
                  <TableHead>نام عربی</TableHead>
                  <TableHead>نام کردی</TableHead>
                  <TableHead>اولویت</TableHead>
                  <TableHead>وضعیت</TableHead>
                  <TableHead className="text-left">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleTypes
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((vehicleType) => (
                  <TableRow key={vehicleType.id}>
                    <TableCell className="font-mono text-sm">
                      {vehicleType.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      {vehicleType.nameFa}
                    </TableCell>
                    <TableCell>{vehicleType.nameEn || '-'}</TableCell>
                    <TableCell>{vehicleType.nameAr || '-'}</TableCell>
                    <TableCell>{vehicleType.nameKu || '-'}</TableCell>
                    <TableCell>{vehicleType.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={vehicleType.isActive ? "default" : "secondary"}>
                        {vehicleType.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(vehicleType)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm('آیا مطمئن هستید که می‌خواهید این نوع خودرو را حذف کنید؟')) {
                              deleteTypeMutation.mutate(vehicleType.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">راهنمای استفاده:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• کد انگلیسی برای استفاده در سیستم و API ضروری است</li>
              <li>• از کدهای یکتا و بدون فاصله استفاده کنید (مثل: heavy_truck)</li>
              <li>• نام‌های چندزبانه برای نمایش در رابط کاربری استفاده می‌شود</li>
              <li>• اولویت نمایش برای ترتیب نمایش در لیست‌ها مهم است</li>
              <li>• پس از تغییرات، قالب‌های خودرو نیز بروزرسانی می‌شوند</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}