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
import { 
  Factory, 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  TrendingUp,
  Users,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface ProductionBatch {
  id: number;
  batchNumber: string;
  productName: string;
  productId: number;
  plannedQuantity: number;
  actualQuantity: number;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  startDate: string;
  endDate?: string;
  completionDate?: string;
  qualityScore?: number;
  operatorName?: string;
  notes?: string;
  createdAt: string;
}

interface ProductionLine {
  id: number;
  name: string;
  description: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'inactive';
  currentBatch?: string;
  efficiency: number;
  createdAt: string;
}

interface QualityCheck {
  id: number;
  batchId: number;
  batchNumber: string;
  productName: string;
  checkDate: string;
  inspector: string;
  score: number;
  passed: boolean;
  notes?: string;
  createdAt: string;
}

const productionBatchSchema = z.object({
  batchNumber: z.string().min(3, "شماره دسته باید حداقل 3 کاراکتر باشد"),
  productId: z.string().min(1, "محصول را انتخاب کنید"),
  plannedQuantity: z.string().min(1, "مقدار برنامه‌ریزی شده را وارد کنید"),
  startDate: z.string().min(1, "تاریخ شروع را وارد کنید"),
  operatorName: z.string().optional(),
  notes: z.string().optional(),
});

const productionLineSchema = z.object({
  name: z.string().min(3, "نام خط تولید باید حداقل 3 کاراکتر باشد"),
  description: z.string().optional(),
  capacity: z.string().min(1, "ظرفیت را وارد کنید"),
  status: z.string().min(1, "وضعیت را انتخاب کنید"),
});

const qualityCheckSchema = z.object({
  batchId: z.string().min(1, "دسته تولید را انتخاب کنید"),
  inspector: z.string().min(2, "نام بازرس را وارد کنید"),
  score: z.string().min(1, "امتیاز کیفیت را وارد کنید"),
  notes: z.string().optional(),
});

type ProductionBatchForm = z.infer<typeof productionBatchSchema>;
type ProductionLineForm = z.infer<typeof productionLineSchema>;
type QualityCheckForm = z.infer<typeof qualityCheckSchema>;

export default function FactoryManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState("production");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'batch' | 'line' | 'quality'>('batch');
  const [editingItem, setEditingItem] = useState<any>(null);

  const batchForm = useForm<ProductionBatchForm>({
    resolver: zodResolver(productionBatchSchema),
    defaultValues: {
      batchNumber: "",
      productId: "",
      plannedQuantity: "",
      startDate: "",
      operatorName: "",
      notes: "",
    },
  });

  const lineForm = useForm<ProductionLineForm>({
    resolver: zodResolver(productionLineSchema),
    defaultValues: {
      name: "",
      description: "",
      capacity: "",
      status: "",
    },
  });

  const qualityForm = useForm<QualityCheckForm>({
    resolver: zodResolver(qualityCheckSchema),
    defaultValues: {
      batchId: "",
      inspector: "",
      score: "",
      notes: "",
    },
  });

  // Fetch production batches
  const { data: batches = [], isLoading: batchesLoading, refetch: refetchBatches } = useQuery<ProductionBatch[]>({
    queryKey: ["/api/admin/factory/batches"],
  });

  // Fetch production lines
  const { data: lines = [], isLoading: linesLoading, refetch: refetchLines } = useQuery<ProductionLine[]>({
    queryKey: ["/api/admin/factory/lines"],
  });

  // Fetch quality checks
  const { data: qualityChecks = [], isLoading: qualityLoading, refetch: refetchQuality } = useQuery<QualityCheck[]>({
    queryKey: ["/api/admin/factory/quality"],
  });

  // Fetch products for dropdown
  const { data: products = [] } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'planned':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'planned':
        return <Calendar className="w-4 h-4" />;
      case 'maintenance':
        return <Settings className="w-4 h-4" />;
      case 'cancelled':
      case 'inactive':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned':
        return 'برنامه‌ریزی شده';
      case 'in_progress':
        return 'در حال تولید';
      case 'completed':
        return 'تکمیل شده';
      case 'cancelled':
        return 'لغو شده';
      case 'active':
        return 'فعال';
      case 'maintenance':
        return 'تعمیرات';
      case 'inactive':
        return 'غیرفعال';
      default:
        return status;
    }
  };

  const openCreateDialog = (type: 'batch' | 'line' | 'quality') => {
    setDialogType(type);
    setEditingItem(null);
    batchForm.reset();
    lineForm.reset();
    qualityForm.reset();
    setDialogOpen(true);
  };

  const getCurrentForm = (): any => {
    switch (dialogType) {
      case 'batch':
        return batchForm;
      case 'line':
        return lineForm;
      case 'quality':
        return qualityForm;
      default:
        return batchForm;
    }
  };

  // Mutations for creating new items
  const createBatchMutation = useMutation({
    mutationFn: (data: ProductionBatchForm) => apiRequest("/api/admin/factory/batches", "POST", data),
    onSuccess: () => {
      toast({
        title: "موفق",
        description: "دسته تولید با موفقیت ایجاد شد",
      });
      setDialogOpen(false);
      refetchBatches();
      batchForm.reset();
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ایجاد دسته تولید",
        variant: "destructive",
      });
    },
  });

  const createLineMutation = useMutation({
    mutationFn: (data: ProductionLineForm) => apiRequest("/api/admin/factory/lines", "POST", data),
    onSuccess: () => {
      toast({
        title: "موفق",
        description: "خط تولید با موفقیت ایجاد شد",
      });
      setDialogOpen(false);
      refetchLines();
      lineForm.reset();
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ایجاد خط تولید",
        variant: "destructive",
      });
    },
  });

  const createQualityMutation = useMutation({
    mutationFn: (data: QualityCheckForm) => apiRequest("/api/admin/factory/quality", "POST", data),
    onSuccess: () => {
      toast({
        title: "موفق",
        description: "بازرسی کیفیت با موفقیت ایجاد شد",
      });
      setDialogOpen(false);
      refetchQuality();
      qualityForm.reset();
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ایجاد بازرسی کیفیت",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    switch (dialogType) {
      case 'batch':
        createBatchMutation.mutate(data);
        break;
      case 'line':
        createLineMutation.mutate(data);
        break;
      case 'quality':
        createQualityMutation.mutate(data);
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation('/admin')}
        >
          <ArrowLeft className="h-4 w-4 ml-2" />
          بازگشت به داشبورد
        </Button>
        <h1 className="text-2xl font-bold">Factory Management - مدیریت کارخانه</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">دسته‌های در حال تولید</p>
                <p className="text-2xl font-bold">
                  {batches.filter(b => b.status === 'in_progress').length}
                </p>
              </div>
              <Factory className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">خطوط تولید فعال</p>
                <p className="text-2xl font-bold">
                  {lines.filter(l => l.status === 'active').length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">تولید امروز</p>
                <p className="text-2xl font-bold">
                  {batches.filter(b => 
                    new Date(b.startDate).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">میانگین کیفیت</p>
                <p className="text-2xl font-bold">
                  {qualityChecks.length > 0 
                    ? Math.round(qualityChecks.reduce((acc, q) => acc + q.score, 0) / qualityChecks.length)
                    : 0
                  }%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="production">تولیدات</TabsTrigger>
          <TabsTrigger value="lines">خطوط تولید</TabsTrigger>
          <TabsTrigger value="quality">کنترل کیفیت</TabsTrigger>
        </TabsList>

        {/* Production Batches Tab */}
        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  دسته‌های تولید
                </CardTitle>
                <Button onClick={() => openCreateDialog('batch')}>
                  <Plus className="h-4 w-4 mr-2" />
                  دسته جدید
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>شماره دسته</TableHead>
                      <TableHead>محصول</TableHead>
                      <TableHead>مقدار برنامه‌ریزی</TableHead>
                      <TableHead>مقدار تولید</TableHead>
                      <TableHead>وضعیت</TableHead>
                      <TableHead>تاریخ شروع</TableHead>
                      <TableHead>اپراتور</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.map((batch) => (
                      <TableRow key={batch.id}>
                        <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                        <TableCell>{batch.productName}</TableCell>
                        <TableCell>{batch.plannedQuantity}</TableCell>
                        <TableCell>{batch.actualQuantity || '-'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(batch.status)}>
                            {getStatusIcon(batch.status)}
                            <span className="mr-1">{getStatusLabel(batch.status)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(batch.startDate).toLocaleDateString('fa-IR')}
                        </TableCell>
                        <TableCell>{batch.operatorName || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Production Lines Tab */}
        <TabsContent value="lines" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-5 w-5" />
                  خطوط تولید
                </CardTitle>
                <Button onClick={() => openCreateDialog('line')}>
                  <Plus className="h-4 w-4 mr-2" />
                  خط جدید
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {linesLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lines.map((line) => (
                    <Card key={line.id} className="border-2">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{line.name}</h3>
                          <Badge className={getStatusColor(line.status)}>
                            {getStatusIcon(line.status)}
                            <span className="mr-1">{getStatusLabel(line.status)}</span>
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">{line.description}</p>
                          <div className="flex justify-between text-sm">
                            <span>ظرفیت:</span>
                            <span>{line.capacity}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>بازدهی:</span>
                            <span>{line.efficiency}%</span>
                          </div>
                          {line.currentBatch && (
                            <div className="flex justify-between text-sm">
                              <span>دسته فعلی:</span>
                              <span>{line.currentBatch}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quality Control Tab */}
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  کنترل کیفیت
                </CardTitle>
                <Button onClick={() => openCreateDialog('quality')}>
                  <Plus className="h-4 w-4 mr-2" />
                  بازرسی جدید
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {qualityLoading ? (
                <div className="text-center py-8">در حال بارگذاری...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>شماره دسته</TableHead>
                      <TableHead>محصول</TableHead>
                      <TableHead>بازرس</TableHead>
                      <TableHead>امتیاز</TableHead>
                      <TableHead>نتیجه</TableHead>
                      <TableHead>تاریخ بازرسی</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {qualityChecks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell className="font-medium">{check.batchNumber}</TableCell>
                        <TableCell>{check.productName}</TableCell>
                        <TableCell>{check.inspector}</TableCell>
                        <TableCell>{check.score}%</TableCell>
                        <TableCell>
                          <Badge className={check.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {check.passed ? 'قبول' : 'رد'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(check.checkDate).toLocaleDateString('fa-IR')}
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'batch' && 'افزودن دسته تولید'}
              {dialogType === 'line' && 'افزودن خط تولید'}
              {dialogType === 'quality' && 'افزودن بازرسی کیفیت'}
            </DialogTitle>
          </DialogHeader>
          {dialogType === 'batch' && (
            <Form {...batchForm}>
              <form onSubmit={batchForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={batchForm.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شماره دسته</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={batchForm.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>محصول</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="محصول را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product: any) => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={batchForm.control}
                  name="plannedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>مقدار برنامه‌ریزی شده</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={batchForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>تاریخ شروع</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={batchForm.control}
                  name="operatorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام اپراتور</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={batchForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>یادداشت</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    انصراف
                  </Button>
                  <Button type="submit">
                    ذخیره
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {dialogType === 'line' && (
            <Form {...lineForm}>
              <form onSubmit={lineForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={lineForm.control}
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
                  control={lineForm.control}
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
                <FormField
                  control={lineForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ظرفیت</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={lineForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>وضعیت</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="وضعیت را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">فعال</SelectItem>
                          <SelectItem value="maintenance">تعمیرات</SelectItem>
                          <SelectItem value="inactive">غیرفعال</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    انصراف
                  </Button>
                  <Button type="submit">
                    ذخیره
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {dialogType === 'quality' && (
            <Form {...qualityForm}>
              <form onSubmit={qualityForm.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={qualityForm.control}
                  name="batchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>دسته تولید</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="دسته تولید را انتخاب کنید" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id.toString()}>
                              {batch.batchNumber} - {batch.productName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={qualityForm.control}
                  name="inspector"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام بازرس</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={qualityForm.control}
                  name="score"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>امتیاز کیفیت (0-100)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={qualityForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>یادداشت</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    انصراف
                  </Button>
                  <Button type="submit">
                    ذخیره
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