import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Truck, Users, History, Plus, Search, CheckCircle, XCircle, MapPin, Phone, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface VehicleTemplate {
  id: number;
  name: string;
  nameEn: string;
  vehicleType: string;
  maxWeightKg: string;
  maxVolumeM3: string;
  allowedRoutes: string[];
  basePrice: string;
  pricePerKm: string;
  pricePerKg: string;
  supportsHazardous: boolean;
  supportsFlammable: boolean;
  supportsRefrigerated: boolean;
  supportsFragile: boolean;
  isActive: boolean;
  priority: number;
}

interface ReadyVehicle {
  id: number;
  vehicleTemplateId: number;
  licensePlate: string;
  driverName: string;
  driverMobile: string;
  loadCapacity: string;
  isAvailable: boolean;
  currentLocation: string;
  notes: string;
  supportsFlammable: boolean;
  notAllowedFlammable: boolean;
}

interface VehicleSelectionHistory {
  id: number;
  orderNumber: string;
  customerId: number;
  orderWeightKg: string;
  routeType: string;
  distanceKm: string;
  selectedVehicleName: string;
  totalCost: string;
  selectionAlgorithm: string;
  selectionCriteria: string;
  createdAt: string;
}

interface OrderAssignment {
  orderId: string;
  vehicleTemplateId: number;
  readyVehicleId: number;
}

export default function VehicleManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [assignmentForm, setAssignmentForm] = useState<OrderAssignment>({
    orderId: '',
    vehicleTemplateId: 0,
    readyVehicleId: 0
  });
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  // Fetch vehicle templates
  const { data: vehicleTemplatesResponse, isLoading: templatesLoading } = useQuery({
    queryKey: ['/api/vehicle-templates'],
    queryFn: () => apiRequest('/api/vehicle-templates', { method: 'GET' })
  });

  // Fetch ready vehicles
  const { data: readyVehiclesResponse, isLoading: vehiclesLoading } = useQuery({
    queryKey: ['/api/ready-vehicles'],
    queryFn: () => apiRequest('/api/ready-vehicles', { method: 'GET' })
  });

  // Fetch vehicle selection history
  const { data: selectionHistoryResponse, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/vehicle-selection-history'],
    queryFn: () => apiRequest('/api/vehicle-selection-history', { method: 'GET' })
  });

  // Extract data from API responses
  const vehicleTemplates = vehicleTemplatesResponse?.data || [];
  const readyVehicles = readyVehiclesResponse?.data || [];
  const selectionHistory = selectionHistoryResponse?.data || [];

  // Vehicle assignment mutation
  const assignVehicleMutation = useMutation({
    mutationFn: (assignment: OrderAssignment) => 
      apiRequest(`/api/orders/${assignment.orderId}/assign-vehicle`, {
        method: 'POST',
        body: JSON.stringify({
          vehicleTemplateId: assignment.vehicleTemplateId,
          readyVehicleId: assignment.readyVehicleId
        })
      }),
    onSuccess: (data) => {
      toast({
        title: "تخصیص موفق",
        description: data.message || "خودرو با موفقیت تخصیص یافت"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ready-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicle-selection-history'] });
      setShowAssignDialog(false);
      setAssignmentForm({ orderId: '', vehicleTemplateId: 0, readyVehicleId: 0 });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در تخصیص خودرو",
        description: error.message || "خطایی رخ داد",
        variant: "destructive"
      });
    }
  });

  const handleVehicleAssignment = () => {
    if (!assignmentForm.orderId || !assignmentForm.vehicleTemplateId || !assignmentForm.readyVehicleId) {
      toast({
        title: "اطلاعات ناقص",
        description: "لطفاً تمام فیلدها را پر کنید",
        variant: "destructive"
      });
      return;
    }
    assignVehicleMutation.mutate(assignmentForm);
  };

  const getVehicleTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      motorcycle: 'موتورسیکلت',
      van: 'وانت',
      light_truck: 'کامیون سبک',
      heavy_truck: 'کامیون سنگین'
    };
    return types[type] || type;
  };

  const availableVehicles = readyVehicles.filter((v: ReadyVehicle) => v.isAvailable);
  const availableTemplates = vehicleTemplates.filter((t: VehicleTemplate) => t.isActive);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">مدیریت خودروها و تخصیص</h1>
          <p className="text-gray-600">مدیریت الگوهای خودرو، خودروهای آماده و تخصیص به سفارشات</p>
        </div>

        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              الگوهای خودرو
            </TabsTrigger>
            <TabsTrigger value="vehicles" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              خودروهای آماده
            </TabsTrigger>
            <TabsTrigger value="assignment" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              تخصیص خودرو
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" />
              تاریخچه تخصیصات
            </TabsTrigger>
          </TabsList>

          {/* Vehicle Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  الگوهای خودرو
                </CardTitle>
                <CardDescription>
                  الگوهای خودرو برای محاسبه هزینه و انتخاب خودرو مناسب
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templatesLoading ? (
                  <div className="text-center py-8">در حال بارگذاری...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>نام</TableHead>
                        <TableHead>نوع</TableHead>
                        <TableHead>حداکثر وزن</TableHead>
                        <TableHead>قیمت پایه</TableHead>
                        <TableHead>قیمت کیلومتر</TableHead>
                        <TableHead>امکانات</TableHead>
                        <TableHead>وضعیت</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {availableTemplates.map((template: VehicleTemplate) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">{template.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {getVehicleTypeLabel(template.vehicleType)}
                            </Badge>
                          </TableCell>
                          <TableCell>{parseFloat(template.maxWeightKg).toLocaleString()} کیلوگرم</TableCell>
                          <TableCell>{parseFloat(template.basePrice).toLocaleString()} دینار</TableCell>
                          <TableCell>{parseFloat(template.pricePerKm).toLocaleString()} دینار</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {template.supportsFlammable && (
                                <Badge variant="secondary" className="text-xs">آتش‌زا</Badge>
                              )}
                              {template.supportsHazardous && (
                                <Badge variant="secondary" className="text-xs">خطرناک</Badge>
                              )}
                              {template.supportsFragile && (
                                <Badge variant="secondary" className="text-xs">شکستنی</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {template.isActive ? (
                              <Badge variant="default">فعال</Badge>
                            ) : (
                              <Badge variant="secondary">غیرفعال</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ready Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  خودروهای آماده
                </CardTitle>
                <CardDescription>
                  خودروهای فیزیکی با راننده آماده برای تخصیص
                </CardDescription>
              </CardHeader>
              <CardContent>
                {vehiclesLoading ? (
                  <div className="text-center py-8">در حال بارگذاری...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>پلاک</TableHead>
                        <TableHead>راننده</TableHead>
                        <TableHead>تلفن</TableHead>
                        <TableHead>موقعیت</TableHead>
                        <TableHead>وضعیت</TableHead>
                        <TableHead>توضیحات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {readyVehicles.map((vehicle: ReadyVehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">{vehicle.licensePlate}</TableCell>
                          <TableCell>{vehicle.driverName}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {vehicle.driverMobile}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {vehicle.currentLocation}
                            </div>
                          </TableCell>
                          <TableCell>
                            {vehicle.isAvailable ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                در دسترس
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-red-100 text-red-800">
                                <XCircle className="w-3 h-3 mr-1" />
                                مشغول
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{vehicle.notes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vehicle Assignment Tab */}
          <TabsContent value="assignment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  تخصیص خودرو به سفارش
                </CardTitle>
                <CardDescription>
                  تخصیص خودرو مناسب به سفارشات مشتریان
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="p-4 bg-blue-50">
                    <h3 className="font-semibold text-blue-900 mb-2">خودروهای در دسترس</h3>
                    <p className="text-2xl font-bold text-blue-700">{availableVehicles.length}</p>
                  </Card>
                  <Card className="p-4 bg-green-50">
                    <h3 className="font-semibold text-green-900 mb-2">الگوهای فعال</h3>
                    <p className="text-2xl font-bold text-green-700">{availableTemplates.length}</p>
                  </Card>
                  <Card className="p-4 bg-purple-50">
                    <h3 className="font-semibold text-purple-900 mb-2">تخصیصات امروز</h3>
                    <p className="text-2xl font-bold text-purple-700">
                      {selectionHistory.filter((h: VehicleSelectionHistory) => 
                        new Date(h.createdAt).toDateString() === new Date().toDateString()
                      ).length}
                    </p>
                  </Card>
                </div>

                <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
                  <DialogTrigger asChild>
                    <Button className="mb-4">
                      <Plus className="w-4 h-4 mr-2" />
                      تخصیص خودرو جدید
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>تخصیص خودرو به سفارش</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="orderId">شماره سفارش</Label>
                        <Input
                          id="orderId"
                          placeholder="مثال: 241"
                          value={assignmentForm.orderId}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, orderId: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="templateId">الگوی خودرو</Label>
                        <Select 
                          value={assignmentForm.vehicleTemplateId.toString()}
                          onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, vehicleTemplateId: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب الگوی خودرو" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTemplates.map((template: VehicleTemplate) => (
                              <SelectItem key={template.id} value={template.id.toString()}>
                                {template.name} - {getVehicleTypeLabel(template.vehicleType)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="vehicleId">خودرو</Label>
                        <Select 
                          value={assignmentForm.readyVehicleId.toString()}
                          onValueChange={(value) => setAssignmentForm(prev => ({ ...prev, readyVehicleId: parseInt(value) }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="انتخاب خودرو" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableVehicles
                              .filter((v: ReadyVehicle) => 
                                assignmentForm.vehicleTemplateId === 0 || 
                                v.vehicleTemplateId === assignmentForm.vehicleTemplateId
                              )
                              .map((vehicle: ReadyVehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                                  {vehicle.licensePlate} - {vehicle.driverName}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button 
                        onClick={handleVehicleAssignment} 
                        className="w-full"
                        disabled={assignVehicleMutation.isPending}
                      >
                        {assignVehicleMutation.isPending ? 'در حال تخصیص...' : 'تخصیص خودرو'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Selection History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  تاریخچه تخصیصات
                </CardTitle>
                <CardDescription>
                  سابقه تخصیص خودروها به سفارشات
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="text-center py-8">در حال بارگذاری...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>شماره سفارش</TableHead>
                        <TableHead>خودرو انتخابی</TableHead>
                        <TableHead>وزن سفارش</TableHead>
                        <TableHead>مسافت</TableHead>
                        <TableHead>هزینه کل</TableHead>
                        <TableHead>تاریخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectionHistory.map((history: VehicleSelectionHistory) => (
                        <TableRow key={history.id}>
                          <TableCell className="font-medium">{history.orderNumber}</TableCell>
                          <TableCell>{history.selectedVehicleName}</TableCell>
                          <TableCell>{parseFloat(history.orderWeightKg).toLocaleString()} کیلوگرم</TableCell>
                          <TableCell>{parseFloat(history.distanceKm).toLocaleString()} کیلومتر</TableCell>
                          <TableCell>{parseFloat(history.totalCost).toLocaleString()} دینار</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(history.createdAt).toLocaleDateString('fa-IR')}
                            </div>
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
      </div>
    </div>
  );
}