import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Factory, 
  ArrowLeft, 
  Plus, 
  Settings, 
  Package, 
  ClipboardList, 
  Wrench, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  BarChart3,
  Edit,
  Trash2,
  PlayCircle,
  PauseCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Types for factory management
interface ProductionLine {
  id: number;
  name: string;
  description: string;
  capacityPerHour: number;
  status: 'active' | 'maintenance' | 'inactive';
  location: string;
  supervisorName: string;
  createdAt: string;
  updatedAt: string;
}

interface RawMaterial {
  id: number;
  name: string;
  code: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  unitPrice: number;
  supplier: string;
  storageLocation: string;
  expiryDate?: string;
  qualityGrade: string;
  createdAt: string;
  updatedAt: string;
}

interface ProductionOrder {
  id: number;
  orderNumber: string;
  productName: string;
  quantityPlanned: number;
  quantityProduced: number;
  unit: string;
  productionLineId: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  plannedStartDate: string;
  actualStartDate?: string;
  plannedEndDate: string;
  actualEndDate?: string;
  supervisorNotes?: string;
  qualityCheckStatus: 'pending' | 'passed' | 'failed' | 'in_review';
  createdAt: string;
  updatedAt: string;
}

interface EquipmentMaintenance {
  id: number;
  equipmentName: string;
  equipmentCode: string;
  productionLineId: number;
  maintenanceType: 'preventive' | 'corrective' | 'emergency';
  scheduledDate: string;
  completedDate?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  technicianName: string;
  description: string;
  cost?: number;
  downtimeHours?: number;
  createdAt: string;
  updatedAt: string;
}

// Form schemas
const productionLineSchema = z.object({
  name: z.string().min(3, "نام خط تولید باید حداقل 3 کاراکتر باشد"),
  description: z.string().optional(),
  capacityPerHour: z.number().min(1, "ظرفیت باید حداقل 1 باشد"),
  location: z.string().min(2, "مکان را وارد کنید"),
  supervisorName: z.string().min(2, "نام سرپرست را وارد کنید"),
});

const rawMaterialSchema = z.object({
  name: z.string().min(2, "نام ماده خام را وارد کنید"),
  code: z.string().min(2, "کد ماده خام را وارد کنید"),
  unit: z.string().min(1, "واحد اندازه‌گیری را وارد کنید"),
  currentStock: z.number().min(0, "موجودی نمی‌تواند منفی باشد"),
  minimumStock: z.number().min(0, "حداقل موجودی نمی‌تواند منفی باشد"),
  maximumStock: z.number().min(1, "حداکثر موجودی باید حداقل 1 باشد"),
  unitPrice: z.number().min(0, "قیمت واحد نمی‌تواند منفی باشد"),
  supplier: z.string().min(2, "نام تأمین‌کننده را وارد کنید"),
  storageLocation: z.string().min(2, "محل ذخیره‌سازی را وارد کنید"),
  qualityGrade: z.string().min(1, "درجه کیفیت را وارد کنید"),
});

const productionOrderSchema = z.object({
  productName: z.string().min(2, "نام محصول را وارد کنید"),
  quantityPlanned: z.number().min(1, "مقدار برنامه‌ریزی شده باید حداقل 1 باشد"),
  unit: z.string().min(1, "واحد اندازه‌گیری را وارد کنید"),
  productionLineId: z.string().min(1, "خط تولید را انتخاب کنید"),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  plannedStartDate: z.string().min(1, "تاریخ شروع را وارد کنید"),
  plannedEndDate: z.string().min(1, "تاریخ پایان را وارد کنید"),
});

type ProductionLineForm = z.infer<typeof productionLineSchema>;
type RawMaterialForm = z.infer<typeof rawMaterialSchema>;
type ProductionOrderForm = z.infer<typeof productionOrderSchema>;

export default function FactoryManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'production-line' | 'raw-material' | 'production-order' | null>(null);

  // Form hooks
  const productionLineForm = useForm<ProductionLineForm>({
    resolver: zodResolver(productionLineSchema),
    defaultValues: {
      name: "",
      description: "",
      capacityPerHour: 100,
      location: "",
      supervisorName: "",
    },
  });

  const rawMaterialForm = useForm<RawMaterialForm>({
    resolver: zodResolver(rawMaterialSchema),
    defaultValues: {
      name: "",
      code: "",
      unit: "kg",
      currentStock: 0,
      minimumStock: 0,
      maximumStock: 1000,
      unitPrice: 0,
      supplier: "",
      storageLocation: "",
      qualityGrade: "A",
    },
  });

  const productionOrderForm = useForm<ProductionOrderForm>({
    resolver: zodResolver(productionOrderSchema),
    defaultValues: {
      productName: "",
      quantityPlanned: 0,
      unit: "kg",
      productionLineId: "",
      priority: "normal",
      plannedStartDate: "",
      plannedEndDate: "",
    },
  });

  // Data fetching
  const { data: productionLines = [], isLoading: productionLinesLoading, refetch: refetchProductionLines } = useQuery<ProductionLine[]>({
    queryKey: ["/api/factory/production-lines"],
  });

  const { data: rawMaterials = [], isLoading: rawMaterialsLoading, refetch: refetchRawMaterials } = useQuery<RawMaterial[]>({
    queryKey: ["/api/factory/raw-materials"],
  });

  const { data: productionOrders = [], isLoading: productionOrdersLoading, refetch: refetchProductionOrders } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/factory/production-orders"],
  });

  const { data: equipmentMaintenance = [], isLoading: equipmentMaintenanceLoading } = useQuery<EquipmentMaintenance[]>({
    queryKey: ["/api/factory/equipment-maintenance"],
  });

  // Get products from showcase for production orders
  const { data: showcaseProducts = [], isLoading: showcaseProductsLoading } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
      case 'in_review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
      case 'pending':
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
      case 'cancelled':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'on_hold':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'passed':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4" />;
      case 'maintenance':
      case 'pending':
      case 'scheduled':
        return <Clock className="w-4 h-4" />;
      case 'inactive':
      case 'cancelled':
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'on_hold':
        return <PauseCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStockLevel = (current: number, min: number, max: number) => {
    const percentage = (current / max) * 100;
    let status = 'normal';
    let color = 'bg-green-500';
    
    if (current <= min) {
      status = 'low';
      color = 'bg-red-500';
    } else if (current <= min * 1.5) {
      status = 'warning';
      color = 'bg-yellow-500';
    }
    
    return { percentage, status, color };
  };

  // Dialog handlers
  const openCreateDialog = (type: 'production-line' | 'raw-material' | 'production-order') => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDialogType(null);
    productionLineForm.reset();
    rawMaterialForm.reset();
    productionOrderForm.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {user?.id === 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation('/admin')}
          >
            <ArrowLeft className="h-4 w-4 ml-2" />
            بازگشت به داشبورد
          </Button>
        )}
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Factory className="h-6 w-6" />
          مدیریت کارخانه
        </h1>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">کلی</TabsTrigger>
          <TabsTrigger value="production-lines">خطوط تولید</TabsTrigger>
          <TabsTrigger value="raw-materials">مواد خام</TabsTrigger>
          <TabsTrigger value="production-orders">سفارشات تولید</TabsTrigger>
          <TabsTrigger value="maintenance">نگهداری</TabsTrigger>
          <TabsTrigger value="analytics">گزارش‌ها</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">خطوط تولید فعال</CardTitle>
                <Factory className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productionLines?.filter(line => line.status === 'active').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  از مجموع {productionLines?.length || 0} خط
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">سفارشات در حال تولید</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {productionOrders?.filter(order => order.status === 'in_progress').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  از مجموع {productionOrders?.length || 0} سفارش
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">مواد خام کم‌موجود</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rawMaterials?.filter(material => material.currentStock <= material.minimumStock).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  نیاز به تأمین
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تعمیرات امروز</CardTitle>
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {equipmentMaintenance?.filter(maintenance => 
                    new Date(maintenance.scheduledDate).toDateString() === new Date().toDateString()
                  ).length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  برنامه‌ریزی شده
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Production Orders */}
          <Card>
            <CardHeader>
              <CardTitle>سفارشات تولید اخیر</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productionOrders?.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4 space-x-reverse">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {getStatusIcon(order.status)}
                        <div>
                          <p className="text-sm font-medium">{order.productName}</p>
                          <p className="text-xs text-muted-foreground">سفارش: {order.orderNumber}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority === 'urgent' ? 'فوری' :
                         order.priority === 'high' ? 'بالا' :
                         order.priority === 'normal' ? 'عادی' : 'پایین'}
                      </Badge>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status === 'pending' ? 'در انتظار' :
                         order.status === 'in_progress' ? 'در حال انجام' :
                         order.status === 'completed' ? 'تکمیل شده' :
                         order.status === 'cancelled' ? 'لغو شده' : 'نگه‌داشته'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Lines Tab */}
        <TabsContent value="production-lines" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>خطوط تولید</CardTitle>
                <Button onClick={() => openCreateDialog('production-line')}>
                  <Plus className="h-4 w-4 mr-2" />
                  افزودن خط تولید
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {productionLinesLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productionLines?.map((line) => (
                    <Card key={line.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{line.name}</h3>
                          <Badge className={getStatusColor(line.status)}>
                            {line.status === 'active' ? 'فعال' :
                             line.status === 'maintenance' ? 'تعمیر' : 'غیرفعال'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{line.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>ظرفیت/ساعت:</span>
                            <span>{line.capacityPerHour} واحد</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>مکان:</span>
                            <span>{line.location}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>سرپرست:</span>
                            <span>{line.supervisorName}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Raw Materials Tab */}
        <TabsContent value="raw-materials" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>مواد خام</CardTitle>
                <Button onClick={() => openCreateDialog('raw-material')}>
                  <Plus className="h-4 w-4 mr-2" />
                  افزودن ماده خام
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {rawMaterialsLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام ماده</TableHead>
                      <TableHead>کد</TableHead>
                      <TableHead>موجودی فعلی</TableHead>
                      <TableHead>وضعیت موجودی</TableHead>
                      <TableHead>تأمین‌کننده</TableHead>
                      <TableHead>درجه کیفیت</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rawMaterials?.map((material) => {
                      const stockInfo = getStockLevel(material.currentStock, material.minimumStock, material.maximumStock);
                      return (
                        <TableRow key={material.id}>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell>{material.code}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span>{material.currentStock} {material.unit}</span>
                              </div>
                              <Progress value={stockInfo.percentage} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              stockInfo.status === 'low' ? 'bg-red-100 text-red-800' :
                              stockInfo.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {stockInfo.status === 'low' ? 'کم‌موجود' :
                               stockInfo.status === 'warning' ? 'هشدار' : 'مناسب'}
                            </Badge>
                          </TableCell>
                          <TableCell>{material.supplier}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{material.qualityGrade}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Orders Tab */}
        <TabsContent value="production-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>سفارشات تولید</CardTitle>
                <Button onClick={() => openCreateDialog('production-order')}>
                  <Plus className="h-4 w-4 mr-2" />
                  افزودن سفارش تولید
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {productionOrdersLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>شماره سفارش</TableHead>
                      <TableHead>محصول</TableHead>
                      <TableHead>پیشرفت</TableHead>
                      <TableHead>اولویت</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>تاریخ تحویل</TableHead>
                      <TableHead>عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productionOrders?.map((order) => {
                      const progress = (order.quantityProduced / order.quantityPlanned) * 100;
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{order.productName}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{order.quantityProduced} / {order.quantityPlanned} {order.unit}</span>
                                <span>{progress.toFixed(0)}%</span>
                              </div>
                              <Progress value={progress} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityColor(order.priority)}>
                              {order.priority === 'urgent' ? 'فوری' :
                               order.priority === 'high' ? 'بالا' :
                               order.priority === 'normal' ? 'عادی' : 'پایین'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status === 'pending' ? 'در انتظار' :
                               order.status === 'in_progress' ? 'در حال انجام' :
                               order.status === 'completed' ? 'تکمیل شده' :
                               order.status === 'cancelled' ? 'لغو شده' : 'نگه‌داشته'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(order.plannedEndDate).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>برنامه نگهداری تجهیزات</CardTitle>
            </CardHeader>
            <CardContent>
              {equipmentMaintenanceLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>نام تجهیز</TableHead>
                      <TableHead>کد تجهیز</TableHead>
                      <TableHead>نوع تعمیر</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>تاریخ برنامه‌ریزی</TableHead>
                      <TableHead>تکنیسین</TableHead>
                      <TableHead>توضیحات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentMaintenance?.map((maintenance) => (
                      <TableRow key={maintenance.id}>
                        <TableCell className="font-medium">{maintenance.equipmentName}</TableCell>
                        <TableCell>{maintenance.equipmentCode}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {maintenance.maintenanceType === 'preventive' ? 'پیشگیرانه' :
                             maintenance.maintenanceType === 'corrective' ? 'اصلاحی' : 'اضطراری'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(maintenance.status)}>
                            {maintenance.status === 'scheduled' ? 'برنامه‌ریزی شده' :
                             maintenance.status === 'in_progress' ? 'در حال انجام' :
                             maintenance.status === 'completed' ? 'تکمیل شده' : 'لغو شده'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(maintenance.scheduledDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </TableCell>
                        <TableCell>{maintenance.technicianName}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {maintenance.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  آمار تولید امروز
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>تولید برنامه‌ریزی شده:</span>
                    <span className="font-semibold">1,800 واحد</span>
                  </div>
                  <div className="flex justify-between">
                    <span>تولید واقعی:</span>
                    <span className="font-semibold">1,650 واحد</span>
                  </div>
                  <div className="flex justify-between">
                    <span>راندمان:</span>
                    <span className="font-semibold text-green-600">91.7%</span>
                  </div>
                  <Progress value={91.7} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  وضعیت کیفیت
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>تست‌های قبولی:</span>
                    <span className="font-semibold text-green-600">95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>تست‌های رد شده:</span>
                    <span className="font-semibold text-red-600">3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>در حال بررسی:</span>
                    <span className="font-semibold text-yellow-600">2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'production-line' ? 'افزودن خط تولید جدید' :
               dialogType === 'raw-material' ? 'افزودن ماده خام جدید' :
               dialogType === 'production-order' ? 'ایجاد سفارش تولید جدید' : ''}
            </DialogTitle>
          </DialogHeader>

          {dialogType === 'production-line' && (
            <Form {...productionLineForm}>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={productionLineForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام خط تولید</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={productionLineForm.control}
                    name="capacityPerHour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ظرفیت در ساعت</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={productionLineForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>توضیحات</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={productionLineForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مکان</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={productionLineForm.control}
                    name="supervisorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام سرپرست</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    انصراف
                  </Button>
                  <Button type="submit">
                    ایجاد خط تولید
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {dialogType === 'raw-material' && (
            <Form {...rawMaterialForm}>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={rawMaterialForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام ماده خام</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={rawMaterialForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>کد ماده</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={rawMaterialForm.control}
                    name="currentStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>موجودی فعلی</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={rawMaterialForm.control}
                    name="minimumStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>حداقل موجودی</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={rawMaterialForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>واحد</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="kg">کیلوگرم</SelectItem>
                            <SelectItem value="liter">لیتر</SelectItem>
                            <SelectItem value="ton">تن</SelectItem>
                            <SelectItem value="gram">گرم</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={rawMaterialForm.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تأمین‌کننده</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={rawMaterialForm.control}
                    name="storageLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>محل ذخیره</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    انصراف
                  </Button>
                  <Button type="submit">
                    افزودن ماده خام
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {dialogType === 'production-order' && (
            <Form {...productionOrderForm}>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={productionOrderForm.control}
                    name="productName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام محصول</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب محصول از کاردکس" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {showcaseProducts?.map((product) => (
                              <SelectItem key={product.id} value={product.name}>
                                {product.name} ({product.category})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={productionOrderForm.control}
                    name="quantityPlanned"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>مقدار تولید</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} onChange={e => field.onChange(+e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={productionOrderForm.control}
                    name="productionLineId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>خط تولید</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="انتخاب خط تولید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {productionLines?.map((line) => (
                              <SelectItem key={line.id} value={line.id.toString()}>
                                {line.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={productionOrderForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اولویت</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">پایین</SelectItem>
                            <SelectItem value="normal">عادی</SelectItem>
                            <SelectItem value="high">بالا</SelectItem>
                            <SelectItem value="urgent">فوری</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={productionOrderForm.control}
                    name="plannedStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاریخ شروع</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={productionOrderForm.control}
                    name="plannedEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تاریخ پایان</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>
                    انصراف
                  </Button>
                  <Button type="submit">
                    ایجاد سفارش
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}