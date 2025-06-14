import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShowcaseProductSchema, type ShowcaseProduct, type InsertShowcaseProduct } from "@shared/showcase-schema";
import { Plus, Edit, Trash2, Package, Beaker, Droplet, LogOut, User, Upload, Image, FileText, X, AlertTriangle, CheckCircle, AlertCircle, XCircle, QrCode, Search, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const categories = [
  { value: "fuel-additives", label: "افزودنی‌های سوخت", icon: <Beaker className="w-4 h-4" /> },
  { value: "water-treatment", label: "تصفیه آب", icon: <Droplet className="w-4 h-4" /> },
  { value: "paint-thinner", label: "رنگ و تینر", icon: <Package className="w-4 h-4" /> },
  { value: "agricultural-fertilizers", label: "کودهای کشاورزی", icon: <Package className="w-4 h-4" /> },
];

// Create a simplified form schema
const productFormSchema = z.object({
  name: z.string().min(1, "نام محصول اجباری است"),
  category: z.string().min(1, "انتخاب دسته‌بندی اجباری است"),
  description: z.string().min(1, "توضیحات اجباری است"),
  shortDescription: z.string().default(""),
  priceRange: z.string().default("تماس برای قیمت"),
  imageUrl: z.string().default(""),
  pdfCatalogUrl: z.string().default(""),
  specifications: z.record(z.any()).default({}),
  features: z.array(z.string()).default([]),
  applications: z.array(z.string()).default([]),
  technicalDataSheet: z.string().default(""),
  safetyDataSheet: z.string().default(""),
  certifications: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  displayOrder: z.number().default(0),
  stockQuantity: z.number().default(0),
  minStockLevel: z.number().default(10),
  maxStockLevel: z.number().default(1000),
  stockUnit: z.string().default("عدد"),
  inventoryStatus: z.enum(["in_stock", "low_stock", "out_of_stock", "discontinued"]).default("in_stock"),
  supplier: z.string().default(""),
  warehouseLocation: z.string().default(""),
  batchNumber: z.string().default(""),
});

type ProductFormData = z.infer<typeof productFormSchema>;

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
      return 'موجود در انبار';
    case 'low_stock':
      return 'کمبود موجودی';
    case 'out_of_stock':
      return 'ناموجود';
    case 'discontinued':
      return 'متوقف شده';
    default:
      return 'نامشخص';
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

export default function ProductManager() {
  const [editingProduct, setEditingProduct] = useState<ShowcaseProduct | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [catalogPreview, setCatalogPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCatalog, setUploadingCatalog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      shortDescription: "",
      priceRange: "تماس برای قیمت",
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
      stockUnit: "عدد",
      inventoryStatus: "in_stock",
      supplier: "",
      warehouseLocation: "",
      batchNumber: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const { data: products = [], isLoading, refetch } = useQuery<ShowcaseProduct[]>({
    queryKey: ["/api/products"],
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertShowcaseProduct) => apiRequest("/api/products", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      setImagePreview(null);
      setCatalogPreview(null);
      form.reset();
      toast({
        title: "موفقیت",
        description: "محصول با موفقیت ایجاد شد",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در ایجاد محصول رخ داده است",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: InsertShowcaseProduct }) =>
      apiRequest(`/api/products/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      setEditingProduct(null);
      setImagePreview(null);
      setCatalogPreview(null);
      form.reset();
      toast({
        title: "موفقیت",
        description: "محصول با موفقیت بروزرسانی شد",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در بروزرسانی محصول رخ داده است",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/products/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "موفقیت",
        description: "محصول با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در حذف محصول رخ داده است",
      });
    },
  });

  const syncProductsMutation = useMutation({
    mutationFn: () => apiRequest("/api/sync-to-shop", "POST"),
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "محصولات با موفقیت به فروشگاه همگام‌سازی شدند",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در همگام‌سازی محصولات رخ داده است",
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    const productData = data as InsertShowcaseProduct;
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      
      form.setValue('imageUrl', data.url);
      setImagePreview(data.url);
      toast({ title: "موفقیت", description: "تصویر با موفقیت آپلود شد" });
    } catch (error) {
      toast({ title: "خطا", description: "خطا در آپلود تصویر", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCatalogUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingCatalog(true);
    const formData = new FormData();
    formData.append('catalog', file);

    try {
      const response = await fetch('/api/upload/catalog', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }
      
      form.setValue('pdfCatalogUrl', data.url);
      setCatalogPreview(data.url);
      toast({ title: "موفقیت", description: "کاتالوگ با موفقیت آپلود شد" });
    } catch (error) {
      toast({ title: "خطا", description: "خطا در آپلود کاتالوگ", variant: "destructive" });
    } finally {
      setUploadingCatalog(false);
    }
  };

  const openEditDialog = (product: ShowcaseProduct) => {
    setEditingProduct(product);
    setImagePreview(product.imageUrl || "");
    setCatalogPreview(product.pdfCatalogUrl || "");
    form.reset({
      name: product.name,
      category: product.category,
      description: product.description,
      shortDescription: product.shortDescription || "",
      priceRange: product.priceRange || "تماس برای قیمت",
      imageUrl: product.imageUrl || "",
      pdfCatalogUrl: product.pdfCatalogUrl || "",
      specifications: product.specifications || {},
      features: product.features || [],
      applications: product.applications || [],
      technicalDataSheet: product.technicalDataSheet || "",
      safetyDataSheet: product.safetyDataSheet || "",
      certifications: product.certifications || [],
      isActive: product.isActive !== false,
      displayOrder: product.displayOrder || 0,
      stockQuantity: product.stockQuantity || 0,
      minStockLevel: product.minStockLevel || 10,
      maxStockLevel: product.maxStockLevel || 1000,
      stockUnit: product.stockUnit || "عدد",
      inventoryStatus: product.inventoryStatus || "in_stock",
      supplier: product.supplier || "",
      warehouseLocation: product.warehouseLocation || "",
      batchNumber: product.batchNumber || "",
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setImagePreview(null);
    setCatalogPreview(null);
    form.reset();
    setDialogOpen(true);
  };

  const filteredProducts = products.filter((product) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">در حال بارگذاری...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/admin')}
              >
                <ArrowLeft className="h-4 w-4 ml-2" />
                بازگشت به داشبورد
              </Button>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                مدیریت محصولات
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">مدیریت محصولات</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">مدیریت محصولات در چهار دسته‌بندی اصلی</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="w-4 h-4" />
              <span className="text-sm">{user?.username}</span>
            </div>
            <Button 
              variant="outline" 
              onClick={() => {
                logout();
                setLocation("/admin/login");
              }}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              خروج
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="جستجو بر اساس نام یا دسته‌بندی..."
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
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 h-12 text-sm">
            <Plus className="w-4 h-4 mr-2" />
            افزودن محصول
          </Button>
          
          <Button 
            onClick={() => syncProductsMutation.mutate()}
            disabled={syncProductsMutation.isPending}
            variant="outline"
            className="border-green-300 text-green-600 hover:bg-green-50 h-12 text-sm"
          >
            <Package className="w-4 h-4 mr-2" />
            {syncProductsMutation.isPending ? 'همگام‌سازی...' : 'همگام‌سازی فروشگاه'}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => setLocation("/admin/barcode-inventory")}
            className="border-cyan-300 text-cyan-600 hover:bg-cyan-50 h-12 text-sm"
          >
            <QrCode className="w-4 h-4 mr-2" />
            بارکد اسکنر
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="all">همه محصولات</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category.value} value={category.value}>
              <div className="flex items-center gap-2">
                {category.icon}
                {category.label}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">در حال بارگذاری محصولات...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => {
                const stockLevel = getStockLevelIndicator(
                  product.stockQuantity || 0,
                  product.minStockLevel || 10,
                  product.maxStockLevel || 1000
                );

                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className={getInventoryStatusColor(product.inventoryStatus || 'in_stock')}>
                          {getInventoryStatusIcon(product.inventoryStatus || 'in_stock')}
                          <span className="mr-1">{getInventoryStatusLabel(product.inventoryStatus || 'in_stock')}</span>
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <Badge variant="outline">
                          {categories.find(c => c.value === product.category)?.label}
                        </Badge>
                      </div>
                      {product.shortDescription && (
                        <CardDescription>{product.shortDescription}</CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>موجودی فعلی</span>
                          <span>{product.stockQuantity || 0} {product.stockUnit}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${stockLevel.color}`}
                            style={{ width: `${stockLevel.width}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('آیا از حذف این محصول مطمئن هستید؟')) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                          {product.priceRange || 'تماس برای قیمت'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category.value} value={category.value} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts
                .filter((product) => product.category === category.value)
                .map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge className={getInventoryStatusColor(product.inventoryStatus || 'in_stock')}>
                          {getInventoryStatusIcon(product.inventoryStatus || 'in_stock')}
                          <span className="mr-1">{getInventoryStatusLabel(product.inventoryStatus || 'in_stock')}</span>
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">{product.name}</CardTitle>
                      {product.shortDescription && (
                        <CardDescription>{product.shortDescription}</CardDescription>
                      )}
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center pt-4">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('آیا از حذف این محصول مطمئن هستید؟')) {
                                deleteMutation.mutate(product.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <span className="text-sm font-medium text-blue-600">
                          {product.priceRange || 'تماس برای قیمت'}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">اطلاعات پایه</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>نام محصول</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>دسته‌بندی</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
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

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>توضیحات</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceRange"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>محدوده قیمت</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">اطلاعات موجودی</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>موجودی فعلی</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="stockUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>واحد شمارش</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="inventoryStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>وضعیت موجودی</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="وضعیت را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="in_stock">موجود در انبار</SelectItem>
                            <SelectItem value="low_stock">کمبود موجودی</SelectItem>
                            <SelectItem value="out_of_stock">ناموجود</SelectItem>
                            <SelectItem value="discontinued">متوقف شده</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تامین‌کننده</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">رسانه‌ها</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>تصویر محصول</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {imagePreview ? (
                        <div className="space-y-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-full h-32 object-cover mx-auto rounded"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImagePreview(null);
                              form.setValue('imageUrl', '');
                            }}
                          >
                            حذف تصویر
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Image className="w-12 h-12 mx-auto text-gray-400" />
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={uploadingImage}
                              onClick={() => document.getElementById('image-upload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {uploadingImage ? 'در حال آپلود...' : 'انتخاب تصویر'}
                            </Button>
                            <input
                              id="image-upload"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleImageUpload}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>کاتالوگ PDF</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      {catalogPreview ? (
                        <div className="space-y-2">
                          <FileText className="w-12 h-12 mx-auto text-green-600" />
                          <p className="text-sm text-green-600">کاتالوگ آپلود شده</p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setCatalogPreview(null);
                              form.setValue('pdfCatalogUrl', '');
                            }}
                          >
                            حذف کاتالوگ
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <FileText className="w-12 h-12 mx-auto text-gray-400" />
                          <div>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={uploadingCatalog}
                              onClick={() => document.getElementById('catalog-upload')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {uploadingCatalog ? 'در حال آپلود...' : 'انتخاب کاتالوگ'}
                            </Button>
                            <input
                              id="catalog-upload"
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={handleCatalogUpload}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  انصراف
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingProduct ? 'بروزرسانی' : 'ایجاد'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}