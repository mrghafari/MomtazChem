import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShowcaseProductSchema, type ShowcaseProduct, type InsertShowcaseProduct } from "@shared/showcase-schema";
import { Plus, Edit, Trash2, Package, DollarSign, Beaker, Droplet, LogOut, User, Upload, Image, FileText, X, AlertTriangle, CheckCircle, AlertCircle, XCircle, TrendingUp, TrendingDown, BarChart3, QrCode, Mail, Search, Database, Factory, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getPersonalizedWelcome, getDashboardMotivation } from "@/utils/greetings";

// Categories will be fetched from API

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

export default function AdminPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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

  // Fetch categories from API
  const { data: categoriesData = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch categories');
      }
      return data;
    },
    enabled: isAuthenticated,
  });

  // Transform categories data for use in form
  const categories = categoriesData.map((cat: any) => ({
    value: cat.slug,
    label: cat.name,
    icon: <Package className="w-4 h-4" />
  }));

  // Define category type for TypeScript
  type CategoryOption = {
    value: string;
    label: string;
    icon: React.ReactNode;
  };

  // All hooks must be called before any conditional returns
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: selectedCategory === "all" ? ["/api/products"] : ["/api/products", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory === "all" 
        ? "/api/products" 
        : `/api/products?category=${selectedCategory}`;
      const res = await fetch(url);
      const data = await res.json();
      
      // Handle API error response
      if (!res.ok || data.success === false) {
        throw new Error(data.message || 'Failed to fetch products');
      }
      
      // Ensure we return an array
      return Array.isArray(data) ? data : [];
    },
    enabled: isAuthenticated, // Only run query if authenticated
    retry: false,
  });

  const form = useForm<InsertShowcaseProduct>({
    resolver: zodResolver(insertShowcaseProductSchema),
    defaultValues: {
      name: "",
      category: "",
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

  const createProductMutation = useMutation({
    mutationFn: (data: InsertShowcaseProduct) => apiRequest("/api/products", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      form.reset();
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
      setDialogOpen(false);
      setEditingProduct(null);
      form.reset();
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



  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const onSubmit = (data: InsertShowcaseProduct) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  // File upload handlers
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please select an image file", variant: "destructive" });
      return;
    }
    
    // Validate file size (max 5MB)
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
      
      form.setValue('imageUrl', data.url);
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
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({ title: "Error", description: "Please select a PDF file", variant: "destructive" });
      return;
    }
    
    // Validate file size (max 10MB)
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
      
      form.setValue('pdfCatalogUrl', data.url);
      setCatalogPreview(data.url);
      toast({ title: "Success", description: "Catalog uploaded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload catalog", variant: "destructive" });
    } finally {
      setUploadingCatalog(false);
    }
  };

  const openEditDialog = (product: ShowcaseProduct) => {
    setEditingProduct(product);
    setImagePreview(product.imageUrl);
    setCatalogPreview(product.pdfCatalogUrl);
    form.reset({
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
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setImagePreview(null);
    setCatalogPreview(null);
    form.reset();
    setDialogOpen(true);
  };

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.barcode?.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {getPersonalizedWelcome(user?.username || 'Admin', 'admin', 'en')}
              </h1>
              <p className="text-lg text-blue-600 dark:text-blue-400 mt-1">
                {getDashboardMotivation('admin', 'en')}
              </p>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Product Management</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage products across four categories</p>
            </div>
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
              Logout
            </Button>
          </div>
        </div>

        {/* Search Section */}
        <div className="mb-6">
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
        </div>

        {/* Management Actions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 h-12 text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
          
          



          

          

          





          

          

          

          

          


          <Button 
            variant="outline"
            onClick={() => setLocation("/admin/site-management")}
            className="border-teal-300 text-teal-600 hover:bg-teal-50 h-12 text-sm"
          >
            <Package className="w-4 h-4 mr-2" />
            Site Management
          </Button>


        </div>
      </div>

      {/* Inventory Dashboard Summary */}
      {products && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">In Stock</p>
                  <p className="text-2xl font-bold text-green-800">
                    {products.filter(p => p.inventoryStatus === 'in_stock').length}
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
                    {products.filter(p => p.inventoryStatus === 'low_stock').length}
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
                    {products.filter(p => p.inventoryStatus === 'out_of_stock').length}
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
                  <p className="text-2xl font-bold text-blue-800">{products.length}</p>
                </div>
                <Package className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Products</TabsTrigger>
          {categories.slice(0, 4).map((category: CategoryOption) => (
            <TabsTrigger key={category.value} value={category.value}>
              <span className="flex items-center gap-2">
                {category.icon}
                {category.label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCategory}>
          {isLoading ? (
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
              <Button onClick={openCreateDialog}>
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
                          console.log('Image failed to load:', product.imageUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', product.imageUrl);
                        }}
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          {categories.find((c: CategoryOption) => c.value === product.category)?.icon}
                          {categories.find((c: CategoryOption) => c.value === product.category)?.label}
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
                      {/* Inventory Status Badge */}
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
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(product)}>
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
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update product information and inventory details" : "Create a new chemical product for your catalog"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
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
                  control={form.control}
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
                          {categories.map((category: CategoryOption) => (
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
                control={form.control}
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
                control={form.control}
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
                  control={form.control}
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
                  control={form.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="Enter product barcode" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="Enter product SKU" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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

              {/* Image Upload Section */}
              <div className="space-y-4">
                <FormLabel>Product Image</FormLabel>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {imagePreview ? (
                    <div className="relative">
                      <img 
                        src={imagePreview} 
                        alt="Product preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImagePreview(null);
                          form.setValue('imageUrl', '');
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Image className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label className="cursor-pointer">
                          <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            {uploadingImage ? "Uploading..." : "Upload product image"}
                          </span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            disabled={uploadingImage}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file);
                            }}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                      </div>
                      {uploadingImage && (
                        <div className="mt-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Catalog Upload Section */}
              <div className="space-y-4">
                <FormLabel>Product Catalog (PDF)</FormLabel>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {catalogPreview ? (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Catalog uploaded</p>
                          <p className="text-xs text-gray-500">PDF document</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(catalogPreview, '_blank')}
                        >
                          View
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setCatalogPreview(null);
                            form.setValue('pdfCatalogUrl', '');
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <label className="cursor-pointer">
                          <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                            {uploadingCatalog ? "Uploading..." : "Upload product catalog"}
                          </span>
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf"
                            disabled={uploadingCatalog}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCatalogUpload(file);
                            }}
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PDF files up to 10MB</p>
                      </div>
                      {uploadingCatalog && (
                        <div className="mt-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Inventory Management Section */}
              <div className="space-y-4 border-t pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Inventory Management</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="stockQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Stock</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0" 
                            value={field.value ?? 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minStockLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Level</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="0" 
                            value={field.value ?? 10}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxStockLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Level</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1" 
                            value={field.value ?? 1000}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1000)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stockUnit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stock Unit</FormLabel>
                        <FormControl>
                          <Select value={field.value ?? "units"} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="units">Units</SelectItem>
                              <SelectItem value="kg">Kilograms</SelectItem>
                              <SelectItem value="liters">Liters</SelectItem>
                              <SelectItem value="tons">Tons</SelectItem>
                              <SelectItem value="boxes">Boxes</SelectItem>
                              <SelectItem value="pallets">Pallets</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="inventoryStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inventory Status</FormLabel>
                        <FormControl>
                          <Select value={field.value ?? "in_stock"} onValueChange={field.onChange}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_stock">In Stock</SelectItem>
                              <SelectItem value="low_stock">Low Stock</SelectItem>
                              <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                              <SelectItem value="discontinued">Discontinued</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
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
                    control={form.control}
                    name="warehouseLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warehouse Location</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value ?? ""} placeholder="Storage location" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="batchNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batch Number</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} placeholder="Batch/Lot number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                >
                  {editingProduct ? "Update" : "Create"} Product
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}