import React, { useState, useMemo } from "react";
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

  // Product form
  const productForm = useForm<InsertShowcaseProduct>({
    resolver: zodResolver(insertShowcaseProductSchema),
    defaultValues: {
      name: "",
      category: "fuel-additives",
      description: "",
      shortDescription: "",
      priceRange: "Contact for pricing",
      imageUrl: "",
      pdfCatalogUrl: "",
      specifications: {},
      features: [],
      applications: [],
      technicalDataSheet: "",
      safetyDataSheet: "",
      certifications: [],
      isActive: true,
      displayOrder: 0,
      stockQuantity: 0,
      minStockLevel: 10,
      maxStockLevel: 1000,
      stockUnit: "units",
      inventoryStatus: "in_stock",
      supplier: "",
      warehouseLocation: "",
      batchNumber: "",
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

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: (data: InsertShowcaseProduct) => apiRequest("/api/products", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setProductDialogOpen(false);
      productForm.reset();
      toast({ title: "Success", description: "Product created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create product", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertShowcaseProduct> }) =>
      apiRequest(`/api/products/${id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setProductDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
      toast({ title: "Success", description: "Product updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update product", variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/products/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Success", description: "Product deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete product", variant: "destructive" });
    },
  });

  const syncProductsMutation = useMutation({
    mutationFn: () => apiRequest("/api/sync-products", "POST"),
    onSuccess: () => {
      toast({ title: "Success", description: "All products synchronized with shop successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to sync products", variant: "destructive" });
    },
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

  // Product handler functions
  const openCreateProductDialog = () => {
    setEditingProduct(null);
    setImagePreview(null);
    setCatalogPreview(null);
    productForm.reset();
    setProductDialogOpen(true);
  };

  const openEditProductDialog = (product: ShowcaseProduct) => {
    setEditingProduct(product);
    setImagePreview(product.imageUrl);
    setCatalogPreview(product.pdfCatalogUrl);
    productForm.reset({
      name: product.name,
      category: product.category,
      description: product.description,
      shortDescription: product.shortDescription ?? "",
      priceRange: product.priceRange ?? "Contact for pricing",
      imageUrl: product.imageUrl ?? "",
      pdfCatalogUrl: product.pdfCatalogUrl ?? "",
      specifications: product.specifications ?? {},
      features: product.features ?? [],
      applications: product.applications ?? [],
      technicalDataSheet: product.technicalDataSheet ?? "",
      safetyDataSheet: product.safetyDataSheet ?? "",
      certifications: product.certifications ?? [],
      isActive: product.isActive !== false,
      displayOrder: product.displayOrder ?? 0,
      stockQuantity: product.stockQuantity ?? 0,
      minStockLevel: product.minStockLevel ?? 10,
      maxStockLevel: product.maxStockLevel ?? 1000,
      stockUnit: product.stockUnit ?? "units",
      inventoryStatus: product.inventoryStatus ?? "in_stock",
      supplier: product.supplier ?? "",
      warehouseLocation: product.warehouseLocation ?? "",
      batchNumber: product.batchNumber ?? "",
    });
    setProductDialogOpen(true);
  };

  // File upload handlers
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "Image file must be less than 5MB", variant: "destructive" });
      return;
    }
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      
      productForm.setValue('imageUrl', data.url);
      setImagePreview(data.url);
      toast({ title: "Success", description: "Image uploaded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCatalogUpload = async (file: File) => {
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast({ title: "Error", description: "Please select a PDF file", variant: "destructive" });
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "PDF file must be less than 10MB", variant: "destructive" });
      return;
    }
    
    setUploadingCatalog(true);
    try {
      const formData = new FormData();
      formData.append('catalog', file);
      
      const response = await fetch('/api/upload/catalog', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      
      productForm.setValue('pdfCatalogUrl', data.url);
      setCatalogPreview(data.url);
      toast({ title: "Success", description: "Catalog uploaded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload catalog", variant: "destructive" });
    } finally {
      setUploadingCatalog(false);
    }
  };

  // Filter products based on search query - handle null/undefined safely
  const filteredProducts = useMemo(() => {
    if (!products || !Array.isArray(products)) return [];
    
    return products.filter((product) => {
      if (!searchQuery?.trim()) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        product?.name?.toLowerCase()?.includes(query) ||
        product?.barcode?.toLowerCase()?.includes(query) ||
        product?.sku?.toLowerCase()?.includes(query) ||
        product?.category?.toLowerCase()?.includes(query)
      );
    });
  }, [products, searchQuery]);

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
        <h1 className="text-2xl font-bold">Site Management</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Production Batches</p>
                <p className="text-2xl font-bold">
                  {(batches || []).filter(b => b.status === 'in_progress').length}
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
                  {(lines || []).filter(l => l.status === 'active').length}
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
                  {(products || []).length}
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
                  {(qualityChecks || []).length > 0 
                    ? Math.round((qualityChecks || []).reduce((acc, q) => acc + q.score, 0) / (qualityChecks || []).length)
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="production">Production Batches</TabsTrigger>
          <TabsTrigger value="lines">Production Lines</TabsTrigger>
          <TabsTrigger value="quality">Quality Control</TabsTrigger>
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
                    {(batches || []).map((batch) => (
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
                  {(lines || []).map((line) => (
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
                    {(qualityChecks || []).map((check) => (
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
          {/* Product Management Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Product Management
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={openCreateProductDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                  <Button 
                    onClick={() => syncProductsMutation.mutate()}
                    disabled={syncProductsMutation.isPending}
                    variant="outline"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    {syncProductsMutation.isPending ? 'Syncing...' : 'Sync Shop'}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Search Section */}
          <Card>
            <CardContent className="p-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, barcode, or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                    onClick={() => setSearchQuery("")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Inventory Summary */}
          {(products && products.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">In Stock</p>
                      <p className="text-2xl font-bold text-green-800">
                        {(products || []).filter(p => p.inventoryStatus === 'in_stock').length}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600">Low Stock</p>
                      <p className="text-2xl font-bold text-yellow-800">
                        {(products || []).filter(p => p.inventoryStatus === 'low_stock').length}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600">Out of Stock</p>
                      <p className="text-2xl font-bold text-red-800">
                        {(products || []).filter(p => p.inventoryStatus === 'out_of_stock').length}
                      </p>
                    </div>
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Products</p>
                      <p className="text-2xl font-bold text-blue-800">{(products || []).length}</p>
                    </div>
                    <Package className="w-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Products Grid */}
          <Card>
            <CardContent className="p-6">
              {productsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardHeader>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-20 bg-gray-200 rounded"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery ? 'No products found' : 'No products available'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchQuery 
                      ? `No products match "${searchQuery}". Try searching by name, barcode, or SKU.`
                      : 'Add your first product to get started.'
                    }
                  </p>
                  {searchQuery && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchQuery("")}
                      className="mr-2"
                    >
                      Clear Search
                    </Button>
                  )}
                  <Button onClick={openCreateProductDialog}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product: ShowcaseProduct) => (
                    <Card key={product.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                      {product.imageUrl && (
                        <div className="aspect-video w-full overflow-hidden bg-gray-100">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{product.name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                              {categories?.find(c => c.value === product.category)?.icon}
                              {categories?.find(c => c.value === product.category)?.label}
                            </CardDescription>
                          </div>
                          <Badge variant={product.isActive ? "default" : "secondary"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                          {product.shortDescription || product.description}
                        </p>
                        <div className="flex items-center justify-between mb-4">
                          {product.priceRange && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-semibold">{product.priceRange}</span>
                            </div>
                          )}
                          <Badge variant="default">
                            Display Order: {product.displayOrder || 0}
                          </Badge>
                        </div>
                        
                        {/* Inventory Status Section */}
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${getInventoryStatusColor(product.inventoryStatus || 'in_stock')}`}>
                              {getInventoryStatusIcon(product.inventoryStatus || 'in_stock')}
                              {getInventoryStatusLabel(product.inventoryStatus || 'in_stock')}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.stockQuantity || 0} {product.stockUnit || 'units'}
                            </div>
                          </div>

                          {/* Stock Level Progress Bar */}
                          {(product.stockQuantity !== undefined && product.maxStockLevel) && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-600">
                                <span>Stock Level</span>
                                <span>{Math.round(((product.stockQuantity || 0) / (product.maxStockLevel || 1)) * 100)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${getStockLevelIndicator(
                                    product.stockQuantity || 0, 
                                    product.minStockLevel || 10, 
                                    product.maxStockLevel || 100
                                  ).color}`}
                                  style={{ 
                                    width: `${getStockLevelIndicator(
                                      product.stockQuantity || 0, 
                                      product.minStockLevel || 10, 
                                      product.maxStockLevel || 100
                                    ).width}%` 
                                  }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Min: {product.minStockLevel || 0}</span>
                                <span>Max: {product.maxStockLevel || 0}</span>
                              </div>
                            </div>
                          )}

                          {/* Product Identification */}
                          {(product.barcode || product.sku) && (
                            <div className="text-xs text-gray-500 space-y-1 mb-2">
                              {product.barcode && (
                                <div className="flex items-center gap-1">
                                  <QrCode className="w-3 h-3" />
                                  <span>Barcode: {product.barcode}</span>
                                </div>
                              )}
                              {product.sku && (
                                <div className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  <span>SKU: {product.sku}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Additional inventory info */}
                          {(product.supplier || product.warehouseLocation) && (
                            <div className="text-xs text-gray-500 space-y-1">
                              {product.supplier && (
                                <div className="flex items-center gap-1">
                                  <Package className="w-3 h-3" />
                                  <span>Supplier: {product.supplier}</span>
                                </div>
                              )}
                              {product.warehouseLocation && (
                                <div className="flex items-center gap-1">
                                  <BarChart3 className="w-3 h-3" />
                                  <span>Location: {product.warehouseLocation}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* File attachments indicator */}
                        <div className="flex items-center gap-2 mb-4">
                          {product.imageUrl && (
                            <a 
                              href={product.imageUrl} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex"
                            >
                              <Badge variant="outline" className="text-xs hover:bg-green-50 hover:text-green-600 cursor-pointer transition-colors">
                                <Image className="w-3 h-3 mr-1" />
                                View Image
                              </Badge>
                            </a>
                          )}
                          {product.pdfCatalogUrl && (
                            <a 
                              href={product.pdfCatalogUrl} 
                              download={`${product.name}_catalog.pdf`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex"
                            >
                              <Badge variant="outline" className="text-xs hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors">
                                <FileText className="w-3 h-3 mr-1" />
                                Download Catalog
                              </Badge>
                            </a>
                          )}
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditProductDialog(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => deleteProductMutation.mutate(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
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

      {/* Product Add/Edit Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
          </DialogHeader>
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit((data) => {
              if (editingProduct) {
                updateProductMutation.mutate({ id: editingProduct.id, data });
              } else {
                createProductMutation.mutate(data);
              }
            })} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(categories || []).map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={productForm.control}
                name="shortDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Description</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="priceRange"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price Range</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="Contact for pricing" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="displayOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? 0} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Inventory Management Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Inventory Management</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={productForm.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Stock</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? 0} type="number" min="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={productForm.control}
                    name="minStockLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Stock Level</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? 10} type="number" min="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={productForm.control}
                    name="maxStockLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Stock Level</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? 1000} type="number" min="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={productForm.control}
                    name="stockUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="units">Units</SelectItem>
                            <SelectItem value="kg">Kilograms</SelectItem>
                            <SelectItem value="liters">Liters</SelectItem>
                            <SelectItem value="boxes">Boxes</SelectItem>
                            <SelectItem value="pallets">Pallets</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={productForm.control}
                    name="inventoryStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inventory Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in_stock">In Stock</SelectItem>
                            <SelectItem value="low_stock">Low Stock</SelectItem>
                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                            <SelectItem value="discontinued">Discontinued</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={productForm.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="Supplier name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={productForm.control}
                    name="warehouseLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warehouse Location</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="e.g., A1-B2" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold">Media & Documents</h3>
                
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Product Image</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file);
                        }}
                        disabled={uploadingImage}
                      />
                    </div>
                    {uploadingImage && (
                      <div className="text-sm text-gray-500">Uploading...</div>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="relative w-32 h-32 border rounded overflow-hidden">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 p-1 h-6 w-6"
                        onClick={() => {
                          setImagePreview(null);
                          productForm.setValue('imageUrl', '');
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Catalog Upload */}
                <div className="space-y-2">
                  <Label>Product Catalog (PDF)</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleCatalogUpload(file);
                        }}
                        disabled={uploadingCatalog}
                      />
                    </div>
                    {uploadingCatalog && (
                      <div className="text-sm text-gray-500">Uploading...</div>
                    )}
                  </div>
                  {catalogPreview && (
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">Catalog uploaded</span>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="ml-auto p-1 h-6 w-6"
                        onClick={() => {
                          setCatalogPreview(null);
                          productForm.setValue('pdfCatalogUrl', '');
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createProductMutation.isPending || updateProductMutation.isPending}>
                  {createProductMutation.isPending || updateProductMutation.isPending ? "Saving..." : "Save Product"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}