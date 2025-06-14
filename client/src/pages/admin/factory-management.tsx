import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { insertShowcaseProductSchema, type ShowcaseProduct, type InsertShowcaseProduct } from "@shared/showcase-schema";
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
  Target,
  MessageSquare,
  ShoppingCart,
  DollarSign,
  Beaker,
  Droplet,
  Upload,
  Image,
  FileText,
  X,
  Search,
  QrCode,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const categories = [
  { value: "fuel-additives", label: "Fuel Additives", icon: <Beaker className="w-4 h-4" /> },
  { value: "water-treatment", label: "Water Treatment", icon: <Droplet className="w-4 h-4" /> },
  { value: "paint-thinner", label: "Paint & Thinner", icon: <Package className="w-4 h-4" /> },
  { value: "agricultural-fertilizers", label: "Agricultural Fertilizers", icon: <Package className="w-4 h-4" /> },
];

// Inventory status helper functions
const getInventoryStatusColor = (status: string) => {
  switch (status) {
    case 'in_stock':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'low_stock':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'out_of_stock':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'discontinued':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getInventoryStatusIcon = (status: string) => {
  switch (status) {
    case 'in_stock':
      return <CheckCircle className="w-4 h-4" />;
    case 'low_stock':
      return <AlertTriangle className="w-4 h-4" />;
    case 'out_of_stock':
      return <XCircle className="w-4 h-4" />;
    case 'discontinued':
      return <AlertCircle className="w-4 h-4" />;
    default:
      return <Package className="w-4 h-4" />;
  }
};

const getInventoryStatusLabel = (status: string) => {
  switch (status) {
    case 'in_stock':
      return 'In Stock';
    case 'low_stock':
      return 'Low Stock';
    case 'out_of_stock':
      return 'Out of Stock';
    case 'discontinued':
      return 'Discontinued';
    default:
      return 'Unknown';
  }
};

const getStockLevelIndicator = (current: number, min: number, max: number) => {
  const percentage = (current / max) * 100;
  
  if (current === 0) {
    return { color: 'bg-red-500', width: 0, status: 'empty' };
  } else if (current <= min) {
    return { color: 'bg-yellow-500', width: Math.max(percentage, 10), status: 'low' };
  } else if (percentage >= 80) {
    return { color: 'bg-green-500', width: percentage, status: 'high' };
  } else {
    return { color: 'bg-blue-500', width: percentage, status: 'normal' };
  }
};

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
  batchNumber: z.string().min(3, "Batch number must be at least 3 characters"),
  productId: z.string().min(1, "Please select a product"),
  plannedQuantity: z.string().min(1, "Please enter planned quantity"),
  startDate: z.string().min(1, "Please enter start date"),
  operatorName: z.string().optional(),
  notes: z.string().optional(),
});

const productionLineSchema = z.object({
  name: z.string().min(3, "Production line name must be at least 3 characters"),
  description: z.string().optional(),
  capacity: z.string().min(1, "Please enter capacity"),
  status: z.string().min(1, "Please select status"),
});

const qualityCheckSchema = z.object({
  batchId: z.string().min(1, "Please select production batch"),
  inspector: z.string().min(2, "Please enter inspector name"),
  score: z.string().min(1, "Please enter quality score"),
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
  const [dialogType, setDialogType] = useState<'batch' | 'line' | 'quality' | 'product'>('batch');
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Product management state
  const [editingProduct, setEditingProduct] = useState<ShowcaseProduct | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [catalogPreview, setCatalogPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCatalog, setUploadingCatalog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  // Fetch products for dropdown and product management
  const { data: products = [], isLoading: productsLoading, refetch: refetchProducts } = useQuery<any[]>({
    queryKey: ["/api/products"],
  });

  // Fetch inquiries
  const { data: inquiries = [], isLoading: inquiriesLoading, refetch: refetchInquiries } = useQuery<any[]>({
    queryKey: ["/api/inquiries"],
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
        return 'Planned';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'active':
        return 'Active';
      case 'maintenance':
        return 'Maintenance';
      case 'inactive':
        return 'Inactive';
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
                <p className="text-sm text-muted-foreground">Production Batches</p>
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
                <p className="text-sm text-muted-foreground">Active Lines</p>
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
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold">
                  {products.length}
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
                <p className="text-sm text-muted-foreground">Quality Average</p>
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="production">Production Batches</TabsTrigger>
          <TabsTrigger value="lines">Production Lines</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
          <TabsTrigger value="products">Product Management</TabsTrigger>
          <TabsTrigger value="inquiries">Inquiry Management</TabsTrigger>
        </TabsList>

        {/* Production Batches Tab */}
        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Production Batches
                </CardTitle>
                <Button onClick={() => openCreateDialog('batch')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Batch
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Planned Quantity</TableHead>
                      <TableHead>Actual Quantity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Operator</TableHead>
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
                          {new Date(batch.startDate).toLocaleDateString('en-US')}
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
                  Production Lines
                </CardTitle>
                <Button onClick={() => openCreateDialog('line')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Line
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {linesLoading ? (
                <div className="text-center py-8">Loading...</div>
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
                            <span>Capacity:</span>
                            <span>{line.capacity}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Efficiency:</span>
                            <span>{line.efficiency}%</span>
                          </div>
                          {line.currentBatch && (
                            <div className="flex justify-between text-sm">
                              <span>Current Batch:</span>
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
                  Quality Control
                </CardTitle>
                <Button onClick={() => openCreateDialog('quality')}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Inspection
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {qualityLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Number</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Inspector</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Inspection Date</TableHead>
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
                            {check.passed ? 'Pass' : 'Fail'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(check.checkDate).toLocaleDateString('en-US')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Management Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Product Management
                </CardTitle>
                <Button onClick={() => setLocation('/admin')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>${product.price}</TableCell>
                        <TableCell>{product.stock || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600">
                              <Trash2 className="h-4 w-4" />
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
        </TabsContent>

        {/* Inquiry Management Tab */}
        <TabsContent value="inquiries" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Inquiry Management
                </CardTitle>
                <Button onClick={() => setLocation('/admin/inquiries')}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  View All Inquiries
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {inquiriesLoading ? (
                <div className="text-center py-8">Loading...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Inquiry #</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inquiries.slice(0, 10).map((inquiry: any) => (
                      <TableRow key={inquiry.id}>
                        <TableCell className="font-medium">{inquiry.inquiryNumber}</TableCell>
                        <TableCell>{inquiry.companyName}</TableCell>
                        <TableCell>{inquiry.contactName}</TableCell>
                        <TableCell className="max-w-xs truncate">{inquiry.subject}</TableCell>
                        <TableCell>
                          <Badge className={
                            inquiry.status === 'open' ? 'bg-blue-100 text-blue-800' :
                            inquiry.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }>
                            {inquiry.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(inquiry.createdAt).toLocaleDateString('en-US')}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setLocation(`/admin/inquiries/${inquiry.id}`)}
                          >
                            View
                          </Button>
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
              {dialogType === 'batch' && 'Add Production Batch'}
              {dialogType === 'line' && 'Add Production Line'}
              {dialogType === 'quality' && 'Add Quality Inspection'}
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
                      <FormLabel>Batch Number</FormLabel>
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
                      <FormLabel>Product</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a product" />
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
                      <FormLabel>Planned Quantity</FormLabel>
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
                      <FormLabel>Start Date</FormLabel>
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
                      <FormLabel>Operator Name</FormLabel>
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
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save
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
                      <FormLabel>Production Line Name</FormLabel>
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
                      <FormLabel>Description</FormLabel>
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
                      <FormLabel>Capacity</FormLabel>
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
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save
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
                      <FormLabel>Production Batch</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select production batch" />
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
                      <FormLabel>Inspector Name</FormLabel>
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
                      <FormLabel>Quality Score (0-100)</FormLabel>
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
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save
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