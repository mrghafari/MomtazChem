/**
 * Vehicle Template Editor Component
 * Allows editing and modification of existing vehicle patterns/templates
 * for the optimization algorithm system
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

import { Edit3, Truck, Save, X, Plus, Settings, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { VehicleTemplate } from "@shared/logistics-schema";
import { apiRequest } from "@/lib/queryClient";

// Vehicle Template editing schema
const vehicleTemplateSchema = z.object({
  name: z.string().min(2, "نام باید حداقل 2 کاراکتر باشد"),
  nameEn: z.string().optional(),
  vehicleType: z.enum(["motorcycle", "van", "light_truck", "heavy_truck"]),
  maxWeightKg: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "وزن باید عدد مثبت باشد"),
  maxVolumeM3: z.string().optional(),
  allowedRoutes: z.array(z.string()).min(1, "حداقل یک نوع مسیر را انتخاب کنید"),
  basePrice: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "قیمت پایه باید عدد مثبت باشد"),
  pricePerKm: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "قیمت هر کیلومتر باید عدد مثبت باشد"),
  pricePerKg: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "قیمت هر کیلوگرم باید عدد مثبت باشد"),
  supportsHazardous: z.boolean(),
  supportsRefrigerated: z.boolean(),
  supportsFragile: z.boolean(),
  averageSpeedKmh: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "سرعت متوسط باید عدد مثبت باشد"),
  fuelConsumptionL100km: z.string().optional(),
  isActive: z.boolean(),
  priority: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, "اولویت باید عدد مثبت باشد")
});

type VehicleTemplateForm = z.infer<typeof vehicleTemplateSchema>;

const VEHICLE_TYPES = {
  motorcycle: "موتورسیکلت",
  van: "ون",
  light_truck: "کامیون سبک", 
  heavy_truck: "کامیون سنگین"
};

const ROUTE_TYPES = {
  urban: "شهری",
  interurban: "بین شهری",
  highway: "آزادراه"
};

interface VehicleTemplateEditorProps {
  className?: string;
}

export default function VehicleTemplateEditor({ className = "" }: VehicleTemplateEditorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingTemplate, setEditingTemplate] = useState<VehicleTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);

  // Fetch vehicle templates
  const { data: templatesData, isLoading, error } = useQuery({
    queryKey: ['/api/logistics/vehicle-templates'],
    queryFn: () => apiRequest({ url: '/api/logistics/vehicle-templates' })
  });

  const templates: VehicleTemplate[] = templatesData?.templates || [];

  // Form setup
  const form = useForm<VehicleTemplateForm>({
    resolver: zodResolver(vehicleTemplateSchema),
    defaultValues: {
      name: "",
      nameEn: "",
      vehicleType: "van",
      maxWeightKg: "1000",
      maxVolumeM3: "10",
      allowedRoutes: ["urban"],
      basePrice: "50000",
      pricePerKm: "1000",
      pricePerKg: "500",
      supportsHazardous: false,
      supportsRefrigerated: false,
      supportsFragile: true,
      averageSpeedKmh: "50",
      fuelConsumptionL100km: "12",
      isActive: true,
      priority: "0"
    }
  });

  // Update vehicle template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<VehicleTemplate> }) => 
      apiRequest({ 
        url: `/api/logistics/vehicle-templates/${id}`, 
        method: 'PUT', 
        data 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-templates'] });
      setIsEditDialogOpen(false);
      setEditingTemplate(null);
      toast({ 
        title: "موفقیت", 
        description: "الگوی خودرو با موفقیت بروزرسانی شد" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error?.message || "خطا در بروزرسانی الگوی خودرو", 
        variant: "destructive" 
      });
    }
  });

  // Delete vehicle template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest({ 
        url: `/api/logistics/vehicle-templates/${id}`, 
        method: 'DELETE' 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-templates'] });
      toast({ 
        title: "موفقیت", 
        description: "الگوی خودرو حذف شد" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "خطا", 
        description: error?.message || "خطا در حذف الگوی خودرو", 
        variant: "destructive" 
      });
    }
  });

  // Open edit dialog
  const handleEdit = (template: VehicleTemplate) => {
    setEditingTemplate(template);
    setSelectedRoutes(template.allowedRoutes || []);
    
    // Populate form with existing data
    form.reset({
      name: template.name,
      nameEn: template.nameEn || "",
      vehicleType: template.vehicleType as any,
      maxWeightKg: template.maxWeightKg.toString(),
      maxVolumeM3: template.maxVolumeM3?.toString() || "",
      allowedRoutes: template.allowedRoutes || [],
      basePrice: template.basePrice.toString(),
      pricePerKm: template.pricePerKm.toString(),
      pricePerKg: template.pricePerKg?.toString() || "0",
      supportsHazardous: template.supportsHazardous || false,
      supportsRefrigerated: template.supportsRefrigerated || false,
      supportsFragile: template.supportsFragile !== false,
      averageSpeedKmh: template.averageSpeedKmh?.toString() || "50",
      fuelConsumptionL100km: template.fuelConsumptionL100km?.toString() || "",
      isActive: template.isActive !== false,
      priority: template.priority?.toString() || "0"
    });
    
    setIsEditDialogOpen(true);
  };

  // Handle route selection
  const handleRouteToggle = (routeType: string) => {
    const newRoutes = selectedRoutes.includes(routeType)
      ? selectedRoutes.filter(r => r !== routeType)
      : [...selectedRoutes, routeType];
    
    setSelectedRoutes(newRoutes);
    form.setValue('allowedRoutes', newRoutes);
  };

  // Submit form
  const onSubmit = (data: VehicleTemplateForm) => {
    if (!editingTemplate) return;

    const updateData = {
      ...data,
      maxWeightKg: parseFloat(data.maxWeightKg),
      maxVolumeM3: data.maxVolumeM3 ? parseFloat(data.maxVolumeM3) : null,
      basePrice: parseFloat(data.basePrice),
      pricePerKm: parseFloat(data.pricePerKm),
      pricePerKg: parseFloat(data.pricePerKg),
      averageSpeedKmh: parseFloat(data.averageSpeedKmh),
      fuelConsumptionL100km: data.fuelConsumptionL100km ? parseFloat(data.fuelConsumptionL100km) : null,
      priority: parseInt(data.priority),
      allowedRoutes: selectedRoutes
    };

    updateTemplateMutation.mutate({ id: editingTemplate.id, data: updateData });
  };

  // Handle delete
  const handleDelete = (template: VehicleTemplate) => {
    if (confirm(`آیا از حذف الگوی "${template.name}" مطمئن هستید؟`)) {
      deleteTemplateMutation.mutate(template.id);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`} dir="rtl">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`text-center py-8 ${className}`} dir="rtl">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600">خطا در بارگذاری الگوهای خودرو</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6" />
            ویرایش الگوهای خودرو
          </h2>
          <p className="text-muted-foreground">
            تغییر و بروزرسانی الگوهای موجود برای سیستم انتخاب بهینه وسیله نقلیه
          </p>
        </div>
      </div>

      {/* Templates List */}
      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">هیچ الگوی خودرویی یافت نشد</p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      {template.name}
                      {template.nameEn && (
                        <span className="text-sm text-muted-foreground">({template.nameEn})</span>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "فعال" : "غیرفعال"}
                      </Badge>
                      <Badge variant="outline">
                        {VEHICLE_TYPES[template.vehicleType as keyof typeof VEHICLE_TYPES]}
                      </Badge>
                      <Badge variant="outline">
                        اولویت: {template.priority || 0}
                      </Badge>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="hover:bg-blue-50"
                    >
                      <Edit3 className="h-4 w-4 ml-1" />
                      ویرایش
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template)}
                      className="hover:bg-red-50 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 ml-1" />
                      حذف
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">حداکثر وزن:</span>
                    <div className="font-medium">{template.maxWeightKg} کیلوگرم</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">حجم:</span>
                    <div className="font-medium">{template.maxVolumeM3 || "-"} مترمکعب</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">قیمت پایه:</span>
                    <div className="font-medium">{template.basePrice} دینار</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">قیمت/کیلومتر:</span>
                    <div className="font-medium">{template.pricePerKm} دینار</div>
                  </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="space-y-2">
                  <div>
                    <span className="text-muted-foreground text-sm">مسیرهای مجاز:</span>
                    <div className="flex gap-1 mt-1">
                      {template.allowedRoutes?.map(route => (
                        <Badge key={route} variant="secondary" className="text-xs">
                          {ROUTE_TYPES[route as keyof typeof ROUTE_TYPES]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-3 text-xs">
                    {template.supportsHazardous && (
                      <Badge variant="destructive" className="text-xs">خطرناک</Badge>
                    )}
                    {template.supportsRefrigerated && (
                      <Badge variant="secondary" className="text-xs">یخچالی</Badge>
                    )}
                    {template.supportsFragile && (
                      <Badge variant="outline" className="text-xs">شکستنی</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              ویرایش الگوی خودرو: {editingTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              تغییر مشخصات و پارامترهای الگوی خودرو برای بهینه‌سازی انتخاب وسیله نقلیه
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">اطلاعات پایه</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام الگو *</FormLabel>
                        <FormControl>
                          <Input placeholder="مثال: ون استاندارد" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="nameEn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام انگلیسی</FormLabel>
                        <FormControl>
                          <Input placeholder="Standard Van" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vehicleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نوع خودرو *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب نوع خودرو" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                              <SelectItem key={key} value={key}>{value}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اولویت</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>عدد کمتر = اولویت بالاتر</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Capacity */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">ظرفیت و محدودیت‌ها</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="maxWeightKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>حداکثر وزن (کیلوگرم) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxVolumeM3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>حداکثر حجم (مترمکعب)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="averageSpeedKmh"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>سرعت متوسط (کیلومتر/ساعت)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">قیمت‌گذاری</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>قیمت پایه (دینار) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="50000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pricePerKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>قیمت هر کیلومتر (دینار) *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="pricePerKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>قیمت هر کیلوگرم (دینار)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Routes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">مسیرهای مجاز</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(ROUTE_TYPES).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2 space-x-reverse">
                      <input
                        type="checkbox"
                        id={`route-${key}`}
                        checked={selectedRoutes.includes(key)}
                        onChange={() => handleRouteToggle(key)}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`route-${key}`} className="text-sm font-medium">
                        {value}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Capabilities */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">قابلیت‌های ویژه</h3>
                
                <div className="grid grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="supportsHazardous"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>حمل مواد خطرناک</FormLabel>
                          <FormDescription className="text-xs">
                            قابلیت حمل مواد شیمیایی خطرناک
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="supportsRefrigerated"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>حمل یخچالی</FormLabel>
                          <FormDescription className="text-xs">
                            قابلیت حمل محصولات یخچالی
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="supportsFragile"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>حمل اجناس شکستنی</FormLabel>
                          <FormDescription className="text-xs">
                            قابلیت حمل محصولات شکستنی
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Additional Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">تنظیمات اضافی</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="fuelConsumptionL100km"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مصرف سوخت (لیتر/100کیلومتر)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>وضعیت فعال</FormLabel>
                          <FormDescription>
                            الگو در سیستم انتخاب فعال باشد
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  <X className="h-4 w-4 ml-1" />
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={updateTemplateMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateTemplateMutation.isPending ? (
                    <>درحال ذخیره...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-1" />
                      ذخیره تغییرات
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}