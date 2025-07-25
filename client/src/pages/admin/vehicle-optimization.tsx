import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VehicleTemplateEditor from "@/components/admin/VehicleTemplateEditor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Truck, Plus, Edit, Trash2, Calculator, History, CheckCircle, AlertCircle } from "lucide-react";

interface VehicleTemplate {
  id: number;
  name: string;
  nameEn: string | null;
  vehicleType: string;
  maxWeightKg: string;
  maxVolumeM3: string | null;
  allowedRoutes: string[];
  basePrice: string;
  pricePerKm: string;
  pricePerKg: string;
  supportsHazardous: boolean;
  supportsRefrigerated: boolean;
  supportsFragile: boolean;
  averageSpeedKmh: string;
  fuelConsumptionL100km: string | null;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface VehicleSelectionHistory {
  id: number;
  orderNumber: string;
  customerId: number | null;
  orderWeightKg: string;
  routeType: string;
  distanceKm: string;
  isHazardous: boolean;
  selectedVehicleName: string;
  totalCost: string;
  selectionCriteria: string;
  createdAt: string;
}

interface OptimalVehicleRequest {
  orderNumber: string;
  weightKg: number;
  volumeM3?: number;
  routeType: string;
  distanceKm: number;
  isHazardous?: boolean;
  isRefrigerated?: boolean;
  isFragile?: boolean;
  customerId?: number;
}

const VEHICLE_TYPES = {
  motorcycle: "موتور",
  van: "وانت", 
  light_truck: "کامیون سبک",
  heavy_truck: "کامیون سنگین"
};

const ROUTE_TYPES = {
  urban: "شهری",
  interurban: "بین شهری",
  highway: "آزادراه"
};

export default function VehicleOptimization() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleTemplate | null>(null);
  const [optimizationRequest, setOptimizationRequest] = useState<Partial<OptimalVehicleRequest>>({});

  // Fetch vehicle templates
  const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['/api/logistics/vehicle-templates'],
    queryFn: () => apiRequest({ url: '/api/logistics/vehicle-templates' })
  });

  // Fetch selection history
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/logistics/vehicle-selection-history'],
    queryFn: () => apiRequest({ url: '/api/logistics/vehicle-selection-history' })
  });

  // Create vehicle template mutation
  const createVehicleMutation = useMutation({
    mutationFn: (data: Partial<VehicleTemplate>) => 
      apiRequest({ url: '/api/logistics/vehicle-templates', method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-templates'] });
      setIsCreateDialogOpen(false);
      toast({ title: "موفقیت", description: "الگوی خودرو ایجاد شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در ایجاد الگوی خودرو", variant: "destructive" });
    }
  });

  // Update vehicle template mutation
  const updateVehicleMutation = useMutation({
    mutationFn: ({ id, ...data }: Partial<VehicleTemplate> & { id: number }) => 
      apiRequest({ url: `/api/logistics/vehicle-templates/${id}`, method: 'PATCH', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-templates'] });
      setEditingVehicle(null);
      toast({ title: "موفقیت", description: "الگوی خودرو بروزرسانی شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در بروزرسانی الگوی خودرو", variant: "destructive" });
    }
  });

  // Delete vehicle template mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest({ url: `/api/logistics/vehicle-templates/${id}`, method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-templates'] });
      toast({ title: "موفقیت", description: "الگوی خودرو حذف شد" });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در حذف الگوی خودرو", variant: "destructive" });
    }
  });

  // Optimize vehicle selection mutation
  const optimizeVehicleMutation = useMutation({
    mutationFn: (data: OptimalVehicleRequest) => 
      apiRequest({ url: '/api/logistics/select-optimal-vehicle', method: 'POST', data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/logistics/vehicle-selection-history'] });
      toast({ 
        title: "انتخاب بهینه انجام شد", 
        description: `وسیله انتخاب شده: ${result.data.selectedVehicle.vehicleName} - هزینه: ${parseInt(result.data.selectedVehicle.totalCost).toLocaleString()} دینار`
      });
    },
    onError: () => {
      toast({ title: "خطا", description: "خطا در انتخاب وسیله بهینه", variant: "destructive" });
    }
  });

  const vehicles: VehicleTemplate[] = vehiclesData?.data || [];
  const history: VehicleSelectionHistory[] = historyData?.data || [];

  const handleCreateVehicle = (formData: FormData) => {
    const vehicleData = {
      name: formData.get('name') as string,
      nameEn: formData.get('nameEn') as string,
      vehicleType: formData.get('vehicleType') as string,
      maxWeightKg: formData.get('maxWeightKg') as string,
      maxVolumeM3: formData.get('maxVolumeM3') as string || null,
      allowedRoutes: (formData.get('allowedRoutes') as string).split(',').map(r => r.trim()),
      basePrice: formData.get('basePrice') as string,
      pricePerKm: formData.get('pricePerKm') as string,
      pricePerKg: formData.get('pricePerKg') as string || "0",
      supportsHazardous: formData.get('supportsHazardous') === 'true',
      supportsRefrigerated: formData.get('supportsRefrigerated') === 'true',
      supportsFragile: formData.get('supportsFragile') !== 'false',
      averageSpeedKmh: formData.get('averageSpeedKmh') as string || "50",
      fuelConsumptionL100km: formData.get('fuelConsumptionL100km') as string || null,
      priority: parseInt(formData.get('priority') as string) || 0
    };
    createVehicleMutation.mutate(vehicleData);
  };

  const handleOptimizeVehicle = () => {
    if (!optimizationRequest.orderNumber || !optimizationRequest.weightKg || !optimizationRequest.routeType || !optimizationRequest.distanceKm) {
      toast({ title: "خطا", description: "لطفاً همه فیلدهای اجباری را پر کنید", variant: "destructive" });
      return;
    }
    optimizeVehicleMutation.mutate(optimizationRequest as OptimalVehicleRequest);
  };

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            سیستم انتخاب بهینه وسیله نقلیه
          </h1>
          <p className="text-muted-foreground">مدیریت الگوهای خودرو و انتخاب بهینه بر اساس الگوریتم هزینه</p>
        </div>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates">الگوهای خودرو</TabsTrigger>
          <TabsTrigger value="editor">ویرایش الگوها</TabsTrigger>
          <TabsTrigger value="optimization">انتخاب بهینه</TabsTrigger>
          <TabsTrigger value="history">تاریخچه انتخاب</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">الگوهای خودرو</h2>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن الگوی جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle>افزودن الگوی خودروی جدید</DialogTitle>
                  <DialogDescription>اطلاعات الگوی خودرو را برای استفاده در انتخاب بهینه وارد کنید</DialogDescription>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); handleCreateVehicle(new FormData(e.currentTarget)); }}>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">نام فارسی *</Label>
                      <Input id="name" name="name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nameEn">نام انگلیسی</Label>
                      <Input id="nameEn" name="nameEn" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vehicleType">نوع خودرو *</Label>
                      <Select name="vehicleType" required>
                        <SelectTrigger>
                          <SelectValue placeholder="انتخاب نوع خودرو" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(VEHICLE_TYPES).map(([key, value]) => (
                            <SelectItem key={key} value={key}>{value}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxWeightKg">حداکثر وزن (کیلوگرم) *</Label>
                      <Input id="maxWeightKg" name="maxWeightKg" type="number" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxVolumeM3">حداکثر حجم (متر مکعب)</Label>
                      <Input id="maxVolumeM3" name="maxVolumeM3" type="number" step="0.01" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allowedRoutes">مسیرهای مجاز *</Label>
                      <Input id="allowedRoutes" name="allowedRoutes" placeholder="urban,interurban,highway" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="basePrice">قیمت پایه (دینار) *</Label>
                      <Input id="basePrice" name="basePrice" type="number" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerKm">قیمت هر کیلومتر (دینار) *</Label>
                      <Input id="pricePerKm" name="pricePerKm" type="number" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pricePerKg">قیمت هر کیلوگرم (دینار)</Label>
                      <Input id="pricePerKg" name="pricePerKg" type="number" defaultValue="0" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="averageSpeedKmh">سرعت متوسط (کیلومتر/ساعت)</Label>
                      <Input id="averageSpeedKmh" name="averageSpeedKmh" type="number" defaultValue="50" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fuelConsumptionL100km">مصرف سوخت (لیتر/100کیلومتر)</Label>
                      <Input id="fuelConsumptionL100km" name="fuelConsumptionL100km" type="number" step="0.1" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">اولویت</Label>
                      <Input id="priority" name="priority" type="number" defaultValue="0" />
                    </div>
                    <div className="col-span-2 space-y-4">
                      <div className="flex items-center space-x-2">
                        <input type="hidden" name="supportsHazardous" value="false" />
                        <input type="checkbox" name="supportsHazardous" value="true" id="supportsHazardous" />
                        <Label htmlFor="supportsHazardous">پشتیبانی از مواد خطرناک</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="hidden" name="supportsRefrigerated" value="false" />
                        <input type="checkbox" name="supportsRefrigerated" value="true" id="supportsRefrigerated" />
                        <Label htmlFor="supportsRefrigerated">پشتیبانی از محصولات یخچالی</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="hidden" name="supportsFragile" value="false" />
                        <input type="checkbox" name="supportsFragile" value="true" id="supportsFragile" defaultChecked />
                        <Label htmlFor="supportsFragile">پشتیبانی از اقلام شکستنی</Label>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>انصراف</Button>
                    <Button type="submit" disabled={createVehicleMutation.isPending}>
                      {createVehicleMutation.isPending ? "در حال ایجاد..." : "ایجاد الگو"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>نوع</TableHead>
                    <TableHead>حداکثر وزن</TableHead>
                    <TableHead>مسیرهای مجاز</TableHead>
                    <TableHead>قیمت پایه</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehiclesLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">در حال بارگذاری...</TableCell>
                    </TableRow>
                  ) : vehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">هیچ الگوی خودرویی یافت نشد</TableCell>
                    </TableRow>
                  ) : (
                    vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">
                          <div>
                            <div>{vehicle.name}</div>
                            {vehicle.nameEn && <div className="text-sm text-muted-foreground">{vehicle.nameEn}</div>}
                          </div>
                        </TableCell>
                        <TableCell>{VEHICLE_TYPES[vehicle.vehicleType as keyof typeof VEHICLE_TYPES]}</TableCell>
                        <TableCell>{parseFloat(vehicle.maxWeightKg).toLocaleString()} kg</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {vehicle.allowedRoutes.map((route) => (
                              <Badge key={route} variant="secondary" className="text-xs">
                                {ROUTE_TYPES[route as keyof typeof ROUTE_TYPES] || route}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{parseFloat(vehicle.basePrice).toLocaleString()} IQD</TableCell>
                        <TableCell>
                          <Badge variant={vehicle.isActive ? "default" : "secondary"}>
                            {vehicle.isActive ? "فعال" : "غیرفعال"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setEditingVehicle(vehicle)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => deleteVehicleMutation.mutate(vehicle.id)}
                              disabled={deleteVehicleMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <VehicleTemplateEditor />
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                انتخاب بهینه وسیله نقلیه
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>شماره سفارش *</Label>
                  <Input 
                    value={optimizationRequest.orderNumber || ''} 
                    onChange={(e) => setOptimizationRequest(prev => ({ ...prev, orderNumber: e.target.value }))}
                    placeholder="M2507240001"
                  />
                </div>
                <div className="space-y-2">
                  <Label>وزن سفارش (کیلوگرم) *</Label>
                  <Input 
                    type="number"
                    value={optimizationRequest.weightKg || ''} 
                    onChange={(e) => setOptimizationRequest(prev => ({ ...prev, weightKg: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>حجم سفارش (متر مکعب)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={optimizationRequest.volumeM3 || ''} 
                    onChange={(e) => setOptimizationRequest(prev => ({ ...prev, volumeM3: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>نوع مسیر *</Label>
                  <Select 
                    value={optimizationRequest.routeType || ''} 
                    onValueChange={(value) => setOptimizationRequest(prev => ({ ...prev, routeType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="انتخاب نوع مسیر" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROUTE_TYPES).map(([key, value]) => (
                        <SelectItem key={key} value={key}>{value}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>فاصله (کیلومتر) *</Label>
                  <Input 
                    type="number"
                    value={optimizationRequest.distanceKm || ''} 
                    onChange={(e) => setOptimizationRequest(prev => ({ ...prev, distanceKm: parseFloat(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>شناسه مشتری</Label>
                  <Input 
                    type="number"
                    value={optimizationRequest.customerId || ''} 
                    onChange={(e) => setOptimizationRequest(prev => ({ ...prev, customerId: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isHazardous"
                    checked={optimizationRequest.isHazardous || false}
                    onChange={(e) => setOptimizationRequest(prev => ({ ...prev, isHazardous: e.target.checked }))}
                  />
                  <Label htmlFor="isHazardous">مواد خطرناک</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isRefrigerated"
                    checked={optimizationRequest.isRefrigerated || false}
                    onChange={(e) => setOptimizationRequest(prev => ({ ...prev, isRefrigerated: e.target.checked }))}
                  />
                  <Label htmlFor="isRefrigerated">نیاز به یخچال</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="isFragile"
                    checked={optimizationRequest.isFragile !== false}
                    onChange={(e) => setOptimizationRequest(prev => ({ ...prev, isFragile: e.target.checked }))}
                  />
                  <Label htmlFor="isFragile">اقلام شکستنی</Label>
                </div>
              </div>

              <Button 
                onClick={handleOptimizeVehicle} 
                disabled={optimizeVehicleMutation.isPending}
                className="w-full"
              >
                {optimizeVehicleMutation.isPending ? "در حال محاسبه..." : "انتخاب بهینه وسیله نقلیه"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                تاریخچه انتخاب وسایل نقلیه
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>شماره سفارش</TableHead>
                    <TableHead>وسیله انتخاب شده</TableHead>
                    <TableHead>وزن</TableHead>
                    <TableHead>مسیر</TableHead>
                    <TableHead>فاصله</TableHead>
                    <TableHead>هزینه کل</TableHead>
                    <TableHead>تاریخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">در حال بارگذاری...</TableCell>
                    </TableRow>
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">هیچ تاریخچه‌ای یافت نشد</TableCell>
                    </TableRow>
                  ) : (
                    history.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.orderNumber}</TableCell>
                        <TableCell>{record.selectedVehicleName}</TableCell>
                        <TableCell>{parseFloat(record.orderWeightKg).toLocaleString()} kg</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {ROUTE_TYPES[record.routeType as keyof typeof ROUTE_TYPES] || record.routeType}
                          </Badge>
                        </TableCell>
                        <TableCell>{parseFloat(record.distanceKm).toLocaleString()} km</TableCell>
                        <TableCell>{parseFloat(record.totalCost).toLocaleString()} IQD</TableCell>
                        <TableCell>{new Date(record.createdAt).toLocaleDateString('fa-IR')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}