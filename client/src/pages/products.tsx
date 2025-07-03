import { useState, useEffect, useRef } from "react";
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
import { z } from "zod";
import { Plus, Edit, Trash2, Package, DollarSign, Beaker, Droplet, LogOut, User, Upload, Image, FileText, X, AlertTriangle, CheckCircle, AlertCircle, XCircle, TrendingUp, TrendingDown, BarChart3, QrCode, Mail, Search, Database, Factory, BookOpen, ArrowLeft } from "lucide-react";
import JsBarcode from "jsbarcode";
import VisualBarcode from "@/components/ui/visual-barcode";

// Custom form schema that handles string inputs for numeric fields
const formSchema = insertShowcaseProductSchema.extend({
  unitPrice: z.string(),
  stockQuantity: z.coerce.number().min(0),
  minStockLevel: z.coerce.number().min(0),
  maxStockLevel: z.coerce.number().min(0),
  // Variant fields
  isVariant: z.boolean().default(false),
  parentProductId: z.number().optional(),
  variantType: z.string().optional(),
  variantValue: z.string().optional(),
});
import { useToast } from "@/hooks/use-toast";
import { getPersonalizedWelcome, getDashboardMotivation } from "@/utils/greetings";
import { generateEAN13Barcode, validateEAN13 } from "@shared/barcode-utils";

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

export default function ProductsPage() {
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
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch categories from API
  const { data: categoriesData = [] } = useQuery({
    queryKey: ["/api/admin/categories"],
    queryFn: async () => {
      const response = await fetch("/api/admin/categories");
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  type CategoryOption = {
    value: string;
    label: string;
    icon: React.ReactNode;
  };

  const categories: CategoryOption[] = [
    { value: "commercial", label: "Commercial", icon: <DollarSign className="w-4 h-4" /> },
    { value: "laboratory", label: "Laboratory", icon: <Beaker className="w-4 h-4" /> },
    { value: "pharmaceutical", label: "Pharmaceutical", icon: <Package className="w-4 h-4" /> },
    { value: "specialty", label: "Specialty", icon: <Droplet className="w-4 h-4" /> },
    { value: "other", label: "Other Products", icon: <Package className="w-4 h-4" /> },
  ];

  const { data: products, isLoading } = useQuery({
    queryKey: ["/api/products"],
  });

  const { mutate: createProduct } = useMutation({
    mutationFn: (data: InsertShowcaseProduct) => apiRequest("/api/products", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      setImagePreview(null);
      setCatalogPreview(null);
      form.reset();
      toast({
        title: "Success",
        description: "Product created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const { mutate: updateProduct } = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertShowcaseProduct> }) =>
      apiRequest(`/api/products/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setDialogOpen(false);
      setEditingProduct(null);
      setImagePreview(null);
      setCatalogPreview(null);
      form.reset();
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteProduct } = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/products/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      shortDescription: "",
      priceRange: "",
      imageUrl: "",
      pdfCatalogUrl: "",
      specifications: "",
      features: "",
      applications: "",
      barcode: "",
      sku: "",
      inventoryStatus: "in_stock",
      stockQuantity: 0,
      minStockLevel: 0,
      maxStockLevel: 0,
      unitPrice: "0",
      currency: "IQD",
      isActive: true,
      // Variant fields
      isVariant: false,
      parentProductId: undefined,
      variantType: undefined,
      variantValue: undefined,
    },
  });

  const onSubmit = (data: InsertShowcaseProduct) => {
    // Convert unitPrice from string to number for API
    const processedData = {
      ...data,
      unitPrice: parseFloat(data.unitPrice as string) || 0,
      stockQuantity: Number(data.stockQuantity) || 0,
      minStockLevel: Number(data.minStockLevel) || 0,
      maxStockLevel: Number(data.maxStockLevel) || 0,
    };
    
    if (editingProduct) {
      updateProduct({ id: editingProduct.id, data: processedData as Partial<InsertShowcaseProduct> });
    } else {
      createProduct(processedData as InsertShowcaseProduct);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      form.setValue('imageUrl', url);
      setImagePreview(url);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCatalogUpload = async (file: File) => {
    if (!file) return;

    setUploadingCatalog(true);
    const formData = new FormData();
    formData.append('catalog', file);

    try {
      const response = await fetch('/api/upload/catalog', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const { url } = await response.json();
      form.setValue('pdfCatalogUrl', url);
      setCatalogPreview(url);
      
      toast({
        title: "Success",
        description: "Catalog uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload catalog",
        variant: "destructive",
      });
    } finally {
      setUploadingCatalog(false);
    }
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setImagePreview(null);
    setCatalogPreview(null);
    form.reset();
    setDialogOpen(true);
  };

  const openEditDialog = (product: ShowcaseProduct) => {
    setEditingProduct(product);
    setImagePreview(product.imageUrl || null);
    setCatalogPreview(product.pdfCatalogUrl || null);
    form.reset({
      name: product.name,
      description: product.description || "",
      category: product.category,
      shortDescription: product.shortDescription || "",
      features: Array.isArray(product.features) ? product.features.join('\n') : (product.features || ""),
      applications: Array.isArray(product.applications) ? product.applications.join('\n') : (product.applications || ""),
      specifications: typeof product.specifications === 'object' ? JSON.stringify(product.specifications, null, 2) : (product.specifications || ""),
      barcode: product.barcode || "",
      sku: product.sku || "",
      inventoryStatus: product.inventoryStatus || "in_stock",
      stockQuantity: product.stockQuantity || 0,
      minStockLevel: product.minStockLevel || 0,
      maxStockLevel: product.maxStockLevel || 0,
      unitPrice: String(product.unitPrice || 0),
      currency: product.currency || "USD",
      priceRange: product.priceRange || "",
      imageUrl: product.imageUrl || "",
      pdfCatalogUrl: product.pdfCatalogUrl || "",
      isActive: product.isActive !== false,
    });
    setDialogOpen(true);
  };

  // Filter products based on category and search
  const filteredProducts = products?.filter((product: ShowcaseProduct) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  }) || [];

  // Auto-generate barcode for new products when name and category are available
  useEffect(() => {
    const productName = form.watch("name");
    const category = form.watch("category");
    const currentBarcode = form.watch("barcode");
    
    // Auto-generate barcode for new products (no existing barcode and not editing)
    if (productName && category && !currentBarcode && !editingProduct) {
      const generatedBarcode = generateEAN13Barcode(productName, category);
      form.setValue("barcode", generatedBarcode);
      
      toast({
        title: "Barcode Auto-Generated",
        description: `Generated EAN-13: ${generatedBarcode}`,
        variant: "default"
      });
    }
  }, [form.watch("name"), form.watch("category"), editingProduct]);

  // Generate barcode image when barcode value changes
  useEffect(() => {
    const currentBarcode = form.watch("barcode");
    console.log('Barcode effect triggered:', currentBarcode, 'Canvas ref:', barcodeCanvasRef.current);
    
    // Wait for next tick to ensure DOM is updated
    const timer = setTimeout(() => {
      if (currentBarcode && currentBarcode.length === 13 && barcodeCanvasRef.current) {
        try {
          // Validate barcode first
          const isValid = validateEAN13(currentBarcode);
          if (!isValid) {
            console.error('Invalid EAN-13 barcode:', currentBarcode, 'but will try to render anyway');
            // Don't return - try to render even if validation fails
          }
          
          console.log('Attempting to generate barcode:', currentBarcode);
          
          // Clear canvas first and set dimensions
          const canvas = barcodeCanvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          
          canvas.width = 200;
          canvas.height = 100;
          
          JsBarcode(canvas, currentBarcode, {
            format: "EAN13",
            width: 2,
            height: 80,
            displayValue: false, // We'll show the number separately
            fontSize: 12,
            textMargin: 5,
            marginTop: 5,
            marginBottom: 5,
            marginLeft: 5,
            marginRight: 5,
          });
          console.log('Barcode generated successfully');
        } catch (error) {
          console.error('Barcode generation error:', error);
        }
      } else if (barcodeCanvasRef.current) {
        // Clear canvas if no valid barcode
        const ctx = barcodeCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, barcodeCanvasRef.current.width, barcodeCanvasRef.current.height);
        }
      }
    }, 100); // Increased timeout for better DOM readiness
    
    return () => clearTimeout(timer);
  }, [form.watch("barcode")]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-8 bg-white dark:bg-gray-900 min-h-screen">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setLocation("/admin")}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Product Management</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage products across five categories</p>
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

        {/* Management Actions */}
        <div className="mb-6">
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 h-12 text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Products</TabsTrigger>
          {categories.map((category: CategoryOption) => (
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
                <Card key={product.id} className="hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      {/* Product Thumbnail */}
                      <div className="flex-shrink-0">
                        {product.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center ${product.imageUrl ? 'hidden' : 'flex'}`}
                        >
                          <Package className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold mb-1 text-gray-900 dark:text-white truncate">
                          {product.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          {categories.find((c: CategoryOption) => c.value === product.category)?.icon}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {categories.find((c: CategoryOption) => c.value === product.category)?.label}
                          </span>
                          {product.isVariant && (
                            <Badge variant="secondary" className="text-xs">
                              Variant: {product.variantValue}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(product)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteProduct(product.id)}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Inventory Status */}
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={`flex items-center gap-1 ${getInventoryStatusColor(product.inventoryStatus || 'in_stock')}`}
                        >
                          {getInventoryStatusIcon(product.inventoryStatus || 'in_stock')}
                          {getInventoryStatusLabel(product.inventoryStatus || 'in_stock')}
                        </Badge>
                        {product.priceRange && (
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {product.priceRange}
                          </span>
                        )}
                      </div>

                      {/* Stock Level Indicator */}
                      {product.stockQuantity !== undefined && product.maxStockLevel && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span>Stock: {product.stockQuantity}</span>
                            <span>Max: {product.maxStockLevel}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                getStockLevelIndicator(
                                  product.stockQuantity, 
                                  product.minStockLevel || 0, 
                                  product.maxStockLevel
                                ).color
                              }`}
                              style={{ 
                                width: `${getStockLevelIndicator(
                                  product.stockQuantity, 
                                  product.minStockLevel || 0, 
                                  product.maxStockLevel
                                ).width}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Product Info */}
                      {product.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      {/* Product Codes */}
                      <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                        {product.sku && (
                          <span className="flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />
                            SKU: {product.sku}
                          </span>
                        )}
                        {product.barcode && (
                          <div className="space-y-2">
                            <span className="flex items-center gap-1">
                              <QrCode className="w-3 h-3" />
                              {product.barcode}
                            </span>
                            {product.barcode && (
                              <div className="flex justify-center">
                                <VisualBarcode 
                                  value={product.barcode}
                                  width={1.2}
                                  height={35}
                                  fontSize={8}
                                  className="bg-white p-1 border rounded"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {product.tags && (
                        <div className="flex flex-wrap gap-1">
                          {product.tags.split(',').slice(0, 3).map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="secondary" 
                              className="text-xs px-2 py-0 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            >
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Product Variants Section */}
                      {products && Array.isArray(products) && 
                        products.filter((p: any) => p.parentProductId === product.id).length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <h4 className="font-semibold text-sm text-blue-800 mb-2">
                            Variants ({products.filter((p: any) => p.parentProductId === product.id).length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {products
                              .filter((p: any) => p.parentProductId === product.id)
                              .map((variant: any) => (
                                <div key={variant.id} className="flex items-center gap-1 bg-white rounded-md px-2 py-1 border text-xs">
                                  <span className="text-gray-600">{variant.variantType}:</span>
                                  <span className="font-medium">{variant.variantValue}</span>
                                  {variant.unitPrice && (
                                    <Badge variant="outline" className="text-xs ml-1">
                                      {variant.unitPrice} {variant.currency || 'IQD'}
                                    </Badge>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? "Update product information" : "Add a new product to your inventory"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product name" {...field} />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category: CategoryOption) => (
                              <SelectItem key={category.value} value={category.value}>
                                <div className="flex items-center gap-2">
                                  {category.icon}
                                  {category.label}
                                </div>
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
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter product description" 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Inventory & Pricing */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Inventory & Pricing</h3>
                  
                  <FormField
                    control={form.control}
                    name="inventoryStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Inventory Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="currentStock"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
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
                      name="minStockLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Level</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
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
                      name="maxStockLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Level</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="IQD">IQD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Product Codes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter SKU" {...field} />
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
                      <FormLabel>Barcode (EAN-13)</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Auto-generated or enter manually" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const currentBarcode = form.getValues("barcode");
                            
                            // Protect existing barcodes - don't allow overwriting
                            if (currentBarcode && currentBarcode.trim() !== "") {
                              toast({
                                title: "Barcode Exists",
                                description: "This product already has a barcode. Clear the field first if you want to generate a new one.",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            const productName = form.getValues("name");
                            const category = form.getValues("category");
                            
                            if (!productName || !category) {
                              toast({
                                title: "Missing Information",
                                description: "Please enter product name and select category first",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            const generatedBarcode = generateEAN13Barcode(productName, category);
                            console.log('Generated barcode details:', {
                              productName,
                              category,
                              generated: generatedBarcode,
                              isValid: validateEAN13(generatedBarcode)
                            });
                            form.setValue("barcode", generatedBarcode);
                            
                            // Generate barcode image immediately
                            setTimeout(() => {
                              if (barcodeCanvasRef.current) {
                                try {
                                  console.log('Generating barcode in button click:', generatedBarcode);
                                  
                                  // Set canvas dimensions first
                                  const canvas = barcodeCanvasRef.current;
                                  canvas.width = 200;
                                  canvas.height = 100;
                                  
                                  JsBarcode(canvas, generatedBarcode, {
                                    format: "EAN13",
                                    width: 2,
                                    height: 80,
                                    displayValue: false, // We'll show the number separately
                                    fontSize: 12,
                                    textMargin: 5,
                                    marginTop: 5,
                                    marginBottom: 5,
                                    marginLeft: 5,
                                    marginRight: 5,
                                  });
                                } catch (error) {
                                  console.error('Immediate barcode generation error:', error);
                                }
                              }
                            }, 100);
                            
                            toast({
                              title: "EAN-13 Generated",
                              description: `Generated barcode: ${generatedBarcode}`,
                              variant: "default"
                            });
                          }}
                          className="whitespace-nowrap"
                        >
                          <QrCode className="w-4 h-4 mr-1" />
                          Generate
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Click "Generate" to create GS1-compliant EAN-13 barcode automatically. 
                        <span className="text-amber-600 font-medium">Note: Existing barcodes are protected from overwriting.</span>
                      </div>
                      
                      {/* Barcode Display - Canvas always rendered for stable ref */}
                      <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="text-sm font-medium text-gray-700 mb-2">Barcode Preview:</div>
                        <div className="flex flex-col items-center">
                          {/* Canvas is always rendered for stable ref */}
                          <canvas 
                            ref={barcodeCanvasRef} 
                            className="border border-gray-300 rounded mb-2"
                            width="200"
                            height="100"
                            style={{ display: form.watch("barcode") ? 'block' : 'none' }}
                          />
                          {form.watch("barcode") && (
                            <div 
                              className="cursor-pointer hover:bg-gray-100 transition-colors rounded p-2"
                              onClick={() => {
                                const barcode = form.watch("barcode");
                                if (barcode) {
                                  navigator.clipboard.writeText(barcode).then(() => {
                                    toast({
                                      title: "کپی شد!",
                                      description: "بارکد در کلیپ‌بورد کپی شد",
                                      variant: "default"
                                    });
                                  }).catch(() => {
                                    toast({
                                      title: "خطا در کپی",
                                      description: "امکان کپی بارکد وجود ندارد",
                                      variant: "destructive"
                                    });
                                  });
                                }
                              }}
                              title="برای کپی کردن کلیک کنید"
                            >
                              <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                                {form.watch("barcode")}
                              </code>
                              <div className="text-xs text-gray-500 mt-1">برای کپی کردن کلیک کنید</div>
                            </div>
                          )}
                          {!form.watch("barcode") && (
                            <div className="text-sm text-gray-500 italic py-4">
                              No barcode generated yet - click "Generate" to create one
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Product Variants Section */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Product Variants</h3>
                
                <FormField
                  control={form.control}
                  name="isVariant"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Is Product Variant
                        </FormLabel>
                        <div className="text-sm text-muted-foreground">
                          This product is a variant of another product (different packaging/quantity)
                        </div>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="w-4 h-4"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("isVariant") && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <FormField
                      control={form.control}
                      name="parentProductId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Parent Product</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select parent product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products && Array.isArray(products) && products
                                .filter((p: any) => !p.isVariant && p.id !== editingProduct?.id)
                                .map((p: any) => (
                                  <SelectItem key={p.id} value={p.id.toString()}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="variantType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Variant Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select variant type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="packaging">Packaging</SelectItem>
                                <SelectItem value="size">Size</SelectItem>
                                <SelectItem value="concentration">Concentration</SelectItem>
                                <SelectItem value="quantity">Quantity</SelectItem>
                                <SelectItem value="weight">Weight</SelectItem>
                                <SelectItem value="volume">Volume</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="variantValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Variant Value</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 1kg, 5L, 25kg bag" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="features"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Features</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter product features" 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specifications</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter technical specifications" 
                          className="min-h-[80px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tags</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter tags separated by commas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* File Uploads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormLabel>Product Image</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {imagePreview ? (
                      <div className="space-y-2">
                        <img 
                          src={imagePreview} 
                          alt="Preview" 
                          className="w-full h-32 object-cover rounded"
                        />
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => setImagePreview(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Image className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-500">
                              {uploadingImage ? 'Uploading...' : 'Upload image'}
                            </span>
                            <input
                              id="image-upload"
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file);
                              }}
                              disabled={uploadingImage}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <FormLabel>Product Catalog</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {catalogPreview ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm truncate">Catalog uploaded</span>
                        </div>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => setCatalogPreview(null)}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="catalog-upload" className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-500">
                              {uploadingCatalog ? 'Uploading...' : 'Upload catalog'}
                            </span>
                            <input
                              id="catalog-upload"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleCatalogUpload(file);
                              }}
                              disabled={uploadingCatalog}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? "Update Product" : "Create Product"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}