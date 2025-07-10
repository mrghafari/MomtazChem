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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertShowcaseProductSchema, type ShowcaseProduct, type InsertShowcaseProduct } from "@shared/showcase-schema";
import { z } from "zod";
import { Plus, Edit, Trash2, Package, DollarSign, Beaker, Droplet, LogOut, User, Upload, Image, FileText, X, AlertTriangle, CheckCircle, AlertCircle, XCircle, TrendingUp, TrendingDown, BarChart3, QrCode, Mail, Search, Database, Factory, BookOpen, ArrowLeft, Wheat } from "lucide-react";
import JsBarcode from "jsbarcode";
import VisualBarcode from "@/components/ui/visual-barcode";

// Custom form schema that handles numeric inputs properly
const formSchema = insertShowcaseProductSchema.extend({
  unitPrice: z.coerce.number().min(0),
  stockQuantity: z.coerce.number().min(0),
  minStockLevel: z.coerce.number().min(0),
  maxStockLevel: z.coerce.number().min(0),
  // Weight fields
  weight: z.string().optional(),
  weightUnit: z.string().default("kg"),
  // Text fields for array handling
  features: z.string().optional(),
  applications: z.string().optional(),
  // Variant fields
  isVariant: z.boolean().default(false),
  parentProductId: z.number().optional(),
  variantType: z.string().optional(),
  variantValue: z.string().optional(),
  // MSDS fields
  msdsUrl: z.string().optional(),
  msdsFileName: z.string().optional(),
  showMsdsToCustomers: z.boolean().optional(),
  // Catalog fields
  pdfCatalogUrl: z.string().optional(),
  catalogFileName: z.string().optional(),
  showCatalogToCustomers: z.boolean().optional(),
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

// Smart inventory status detection based on actual stock quantities
const getActualInventoryStatus = (stockQuantity: number | null | undefined, minStockLevel: number | null | undefined): string => {
  const stock = stockQuantity || 0;
  const minLevel = minStockLevel || 0;

  if (stock <= 0) return 'out_of_stock';
  if (stock <= minLevel) return 'low_stock';
  return 'in_stock';
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
  const [selectedInventoryStatus, setSelectedInventoryStatus] = useState<string>("all");
  const [editingProduct, setEditingProduct] = useState<ShowcaseProduct | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [catalogPreview, setCatalogPreview] = useState<string | null>(null);
  const [msdsPreview, setMsdsPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCatalog, setUploadingCatalog] = useState(false);
  const [uploadingMsds, setUploadingMsds] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [deletingProduct, setDeletingProduct] = useState<ShowcaseProduct | null>(null);
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
    { value: "water-treatment", label: "Water Treatment", icon: <Droplet className="w-4 h-4" /> },
    { value: "fuel-additives", label: "Fuel Additives", icon: <Beaker className="w-4 h-4" /> },
    { value: "paint-solvents", label: "Paint & Solvents", icon: <Package className="w-4 h-4" /> },
    { value: "agricultural-products", label: "Agricultural Products", icon: <Package className="w-4 h-4" /> },
    { value: "agricultural-fertilizers", label: "Agricultural Fertilizers", icon: <Package className="w-4 h-4" /> },
    { value: "industrial-chemicals", label: "Industrial Chemicals", icon: <Package className="w-4 h-4" /> },
    { value: "paint-thinner", label: "Paint Thinner", icon: <Droplet className="w-4 h-4" /> },
    { value: "technical-equipment", label: "Technical Equipment", icon: <Package className="w-4 h-4" /> },
    { value: "commercial-goods", label: "Commercial Goods", icon: <Package className="w-4 h-4" /> },
  ];

  const { data: products, isLoading } = useQuery<ShowcaseProduct[]>({
    queryKey: ["/api/products"],
  });

  const { mutate: createProduct } = useMutation({
    mutationFn: (data: InsertShowcaseProduct) => apiRequest("/api/products", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setRefreshKey(prev => prev + 1); // Force component re-render
      setDialogOpen(false);
      setImagePreview(null);
      setCatalogPreview(null);
      setMsdsPreview(null);
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
      // Clear and refresh data completely
      queryClient.removeQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.refetchQueries({ queryKey: ["/api/products"] });
      setRefreshKey(prev => prev + 1); // Force component re-render
      
      // Keep the form values to show updated data
      // Don't reset form or close dialog immediately
      
      setTimeout(() => {
        setDialogOpen(false);
        setEditingProduct(null);
        setImagePreview(null);
        setCatalogPreview(null);
        setMsdsPreview(null);
      }, 1000); // Allow user to see the updated values for 1 second
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
      setRefreshKey(prev => prev + 1); // Force component re-render
      setDeletingProduct(null); // Close the confirmation dialog
      toast({
        title: "موفقیت",
        description: "محصول با موفقیت حذف شد",
      });
    },
    onError: (error: any) => {
      setDeletingProduct(null); // Close the confirmation dialog
      toast({
        title: "خطا",
        description: error.message || "حذف محصول ناموفق بود",
        variant: "destructive",
      });
    },
  });

  // Handle delete product with confirmation
  const handleDeleteProduct = (product: ShowcaseProduct) => {
    setDeletingProduct(product);
  };

  // Confirm delete product
  const confirmDeleteProduct = () => {
    if (deletingProduct) {
      deleteProduct(deletingProduct.id);
    }
  };

  // AI SKU Generation Mutation
  const generateSKUMutation = useMutation({
    mutationFn: (productData: any) => apiRequest("/api/products/generate-sku", "POST", productData),
    onSuccess: (result) => {
      form.setValue("sku", result.data.sku);
      toast({
        title: "SKU تولید شد",
        description: `SKU هوشمند تولید شد: ${result.data.sku}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا در تولید SKU",
        description: error.message || "امکان تولید SKU هوشمند وجود ندارد",
        variant: "destructive",
      });
    },
  });

  const generateSmartSKU = () => {
    const formValues = form.getValues();
    const productData = {
      name: formValues.name,
      category: formValues.category,
      description: formValues.description,
      specifications: formValues.specifications,
      features: formValues.features,
      applications: formValues.applications,
      unitPrice: formValues.unitPrice,
      stockUnit: formValues.stockUnit,
      supplier: formValues.supplier,
      variantType: formValues.variantType,
      variantValue: formValues.variantValue
    };

    if (!productData.name || !productData.category) {
      toast({
        title: "اطلاعات ناکافی",
        description: "لطفاً نام و دسته‌بندی محصول را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    generateSKUMutation.mutate(productData);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      shortDescription: "",
      priceRange: "",
      imageUrl: "",
      specifications: "",
      features: "",
      applications: "",
      barcode: "",
      sku: "",
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
      // MSDS fields
      msdsUrl: "",
      msdsFileName: "",
      showMsdsToCustomers: false,
      // Catalog fields
      pdfCatalogUrl: "",
      catalogFileName: "",
      showCatalogToCustomers: false,
    },
  });

  const onSubmit = (data: InsertShowcaseProduct) => {
    // Convert numeric fields to strings for API compatibility
    const processedData = {
      ...data,
      unitPrice: data.unitPrice ? data.unitPrice.toString() : "0",
      stockQuantity: Number(data.stockQuantity) || 0,
      minStockLevel: Number(data.minStockLevel) || 0,
      maxStockLevel: Number(data.maxStockLevel) || 0,
      // Convert string fields to arrays for backend compatibility
      features: typeof data.features === 'string' && data.features.trim() 
        ? data.features.split('\n').map(f => f.trim()).filter(f => f.length > 0)
        : [],
      applications: typeof data.applications === 'string' && data.applications.trim()
        ? data.applications.split('\n').map(a => a.trim()).filter(a => a.length > 0)
        : [],
      // Handle specifications - try to parse as JSON if possible, otherwise keep as string
      specifications: (() => {
        if (!data.specifications || typeof data.specifications !== 'string') return {};
        const trimmed = data.specifications.trim();
        if (!trimmed) return {};
        
        try {
          return JSON.parse(trimmed);
        } catch {
          // If not valid JSON, return as string
          return trimmed;
        }
      })(),
    };
    
    if (editingProduct) {
      updateProduct({ id: editingProduct.id, data: processedData });
    } else {
      createProduct(processedData);
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 2MB. Please compress or resize the image.",
        variant: "destructive",
      });
      return;
    }

    // Validate file format
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid Format",
        description: "Only JPEG, PNG, and WebP images are allowed for optimal customer display.",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }

      const { url } = await response.json();
      form.setValue('imageUrl', url);
      setImagePreview(url);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully - optimized for customer display",
      });
    } catch (error) {
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
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

      const { url, originalName } = await response.json();
      form.setValue('pdfCatalogUrl', url);
      form.setValue('catalogFileName', originalName);
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

  const handleMsdsUpload = async (file: File) => {
    if (!file) return;

    setUploadingMsds(true);
    const formData = new FormData();
    formData.append('msds', file);

    try {
      const response = await fetch('/api/upload/msds', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('MSDS upload failed');
      }

      const { url, originalName } = await response.json();
      form.setValue('msdsUrl', url);
      form.setValue('msdsFileName', originalName);
      setMsdsPreview(url);
      
      toast({
        title: "Success",
        description: "MSDS file uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload MSDS file",
        variant: "destructive",
      });
    } finally {
      setUploadingMsds(false);
    }
  };



  const openCreateDialog = () => {
    setEditingProduct(null);
    setImagePreview(null);
    setCatalogPreview(null);
    setMsdsPreview(null);
    form.reset();
    setDialogOpen(true);
  };

  const openEditDialog = (product: ShowcaseProduct) => {
    setEditingProduct(product);
    setImagePreview(product.imageUrl || null);
    setCatalogPreview(product.pdfCatalogUrl || null);
    setMsdsPreview(product.msdsUrl || null);
    form.reset({
      name: product.name,
      description: product.description || "",
      category: product.category,
      shortDescription: product.shortDescription || "",
      features: Array.isArray(product.features) ? product.features.join('\n') : (product.features || ""),
      applications: Array.isArray(product.applications) ? product.applications.join('\n') : (product.applications || ""),
      specifications: typeof product.specifications === 'object' && product.specifications !== null ? JSON.stringify(product.specifications, null, 2) : (product.specifications || ""),
      barcode: product.barcode || "",
      sku: product.sku || "",
      stockQuantity: Number(product.stockQuantity) ?? 0,
      minStockLevel: Number(product.minStockLevel) ?? 0,
      maxStockLevel: Number(product.maxStockLevel) ?? 0,
      unitPrice: Number(product.unitPrice || 0),
      currency: product.currency || "IQD",
      priceRange: product.priceRange || "",
      weight: product.weight || "",
      weightUnit: product.weightUnit || "kg",
      imageUrl: product.imageUrl || "",
      pdfCatalogUrl: product.pdfCatalogUrl || "",
      msdsUrl: product.msdsUrl || "",
      msdsFileName: product.msdsFileName || "",
      showMsdsToCustomers: product.showMsdsToCustomers || false,
      catalogFileName: product.catalogFileName || "",
      showCatalogToCustomers: product.showCatalogToCustomers || false,
      isActive: product.isActive !== false,
    });
    setDialogOpen(true);
  };

  // Filter products based on category, inventory status, and search
  const filteredProducts = (products || []).filter((product: ShowcaseProduct) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check inventory status
    const inventoryStatus = getActualInventoryStatus(product.stockQuantity, product.minStockLevel);
    const matchesInventoryStatus = selectedInventoryStatus === "all" || inventoryStatus === selectedInventoryStatus;
    
    return matchesCategory && matchesSearch && matchesInventoryStatus;
  });

  // Auto-generate barcode for new products when name and category are available
  useEffect(() => {
    const productName = form.watch("name");
    const category = form.watch("category");
    const currentBarcode = form.watch("barcode");
    
    // Auto-generate barcode for new products (no existing barcode and not editing)
    if (productName && category && !currentBarcode && !editingProduct) {
      const autoGenerateBarcode = async () => {
        try {
          const generatedBarcode = await generateEAN13Barcode(productName, category);
          form.setValue("barcode", generatedBarcode);
          
          toast({
            title: "Barcode Auto-Generated",
            description: `Generated EAN-13: ${generatedBarcode}`,
            variant: "default"
          });
        } catch (error) {
          console.error('Auto-generate barcode error:', error);
        }
      };
      
      autoGenerateBarcode();
    }
  }, [form.watch("name"), form.watch("category"), editingProduct]);

  // Generate barcode image when barcode value changes or dialog opens
  useEffect(() => {
    const currentBarcode = form.watch("barcode");
    console.log('Barcode effect triggered:', currentBarcode, 'Canvas ref:', barcodeCanvasRef.current);
    
    // Wait for next tick to ensure DOM is updated
    const timer = setTimeout(() => {
      if (currentBarcode && currentBarcode.length === 13 && barcodeCanvasRef.current) {
        try {
          console.log('Attempting to generate barcode:', currentBarcode);
          
          // Clear canvas first and set dimensions
          const canvas = barcodeCanvasRef.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          
          canvas.width = 200;
          canvas.height = 100;
          
          // Only generate EAN-13 format barcodes
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
          console.log('EAN-13 barcode generated successfully');
        } catch (error) {
          console.error('EAN-13 barcode generation error:', error);
        }
      } else if (barcodeCanvasRef.current) {
        // Clear canvas if no valid barcode
        const ctx = barcodeCanvasRef.current.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, barcodeCanvasRef.current.width, barcodeCanvasRef.current.height);
        }
      }
    }, 200); // Increased timeout for better DOM readiness
    
    return () => clearTimeout(timer);
  }, [form.watch("barcode"), dialogOpen]); // Added dialogOpen dependency

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

        {/* Active Filters */}
        {(selectedInventoryStatus !== "all" || selectedCategory !== "all" || searchQuery) && (
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700">Active Filters:</span>
            {selectedInventoryStatus !== "all" && (
              <Badge variant="secondary" className="cursor-pointer hover:bg-gray-300" onClick={() => setSelectedInventoryStatus("all")}>
                Status: {getInventoryStatusLabel(selectedInventoryStatus)}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="cursor-pointer hover:bg-gray-300" onClick={() => setSelectedCategory("all")}>
                Category: {categories.find(c => c.value === selectedCategory)?.label || selectedCategory}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="cursor-pointer hover:bg-gray-300" onClick={() => setSearchQuery("")}>
                Search: {searchQuery}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedInventoryStatus("all");
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="h-6 text-xs"
            >
              Clear All
            </Button>
          </div>
        )}

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
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedInventoryStatus('in_stock')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">In Stock</p>
                  <p className="text-2xl font-bold text-green-800">
                    {products.filter(p => getActualInventoryStatus(p.stockQuantity, p.minStockLevel) === 'in_stock').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedInventoryStatus('low_stock')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-800">
                    {products.filter(p => getActualInventoryStatus(p.stockQuantity, p.minStockLevel) === 'low_stock').length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedInventoryStatus('out_of_stock')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-800">
                    {products.filter(p => getActualInventoryStatus(p.stockQuantity, p.minStockLevel) === 'out_of_stock').length}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedInventoryStatus('all')}>
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
        <TabsList className="flex flex-wrap w-full gap-1 h-auto min-h-[40px] p-1 bg-muted">
          <TabsTrigger value="all" className="flex-shrink-0 whitespace-nowrap">All Products</TabsTrigger>
          {categories.map((category: CategoryOption) => (
            <TabsTrigger key={category.value} value={category.value} className="flex-shrink-0 whitespace-nowrap">
              <span className="flex items-center gap-1 text-xs sm:text-sm">
                <span className="w-3 h-3 sm:w-4 sm:h-4">{category.icon}</span>
                <span className="hidden sm:inline">{category.label}</span>
                <span className="sm:hidden">{category.label.split(' ')[0]}</span>
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
                <Card key={`${product.id}-${refreshKey}`} className="hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700">
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
                          onClick={() => handleDeleteProduct(product)}
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
                          className={`flex items-center gap-1 cursor-pointer hover:shadow-md transition-shadow ${getInventoryStatusColor(getActualInventoryStatus(product.stockQuantity, product.minStockLevel))}`}
                          onClick={() => setSelectedInventoryStatus(getActualInventoryStatus(product.stockQuantity, product.minStockLevel))}
                        >
                          {getInventoryStatusIcon(getActualInventoryStatus(product.stockQuantity, product.minStockLevel))}
                          {getInventoryStatusLabel(getActualInventoryStatus(product.stockQuantity, product.minStockLevel))}
                        </Badge>
                        <div className="flex flex-col items-end">
                          {product.priceRange && (
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {product.priceRange}
                            </span>
                          )}
                          {product.unitPrice && (
                            <span className="text-sm font-bold text-green-600">
                              {product.unitPrice} {product.currency || 'IQD'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stock Level Indicator */}
                      {product.stockQuantity !== undefined && product.stockQuantity !== null && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                            <span>Stock: {product.stockQuantity}</span>
                            {product.maxStockLevel && <span>Max: {product.maxStockLevel}</span>}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                getStockLevelIndicator(
                                  product.stockQuantity, 
                                  product.minStockLevel || 0, 
                                  product.maxStockLevel || 1000
                                ).color
                              }`}
                              style={{ 
                                width: `${getStockLevelIndicator(
                                  product.stockQuantity, 
                                  product.minStockLevel || 0, 
                                  product.maxStockLevel || 1000
                                ).width}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Product Weight */}
                      {product.weight && parseFloat(product.weight) > 0 && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">وزن:</span>
                          <span>
                            {parseFloat(product.weight).toFixed(1)} {product.weightUnit || 'kg'}
                          </span>
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
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {(Array.isArray(product.tags) ? product.tags : String(product.tags).split(',')).slice(0, 3).map((tag, index) => (
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
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Stock</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
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
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
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
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : '')}
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
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
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
                              <SelectItem value="IQD">IQD</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Weight Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weightUnit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weight Unit</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "kg"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select weight unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="g">g</SelectItem>
                              <SelectItem value="lb">lb</SelectItem>
                              <SelectItem value="oz">oz</SelectItem>
                              <SelectItem value="t">Ton</SelectItem>
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
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Enter SKU" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={generateSmartSKU}
                          disabled={generateSKUMutation.isPending}
                          className="whitespace-nowrap"
                        >
                          {generateSKUMutation.isPending ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            "🤖 AI SKU"
                          )}
                        </Button>
                      </div>
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
                          <Input 
                            placeholder="Auto-generated or enter manually" 
                            {...field}
                            onChange={async (e) => {
                              const newBarcode = e.target.value;
                              field.onChange(e);
                              
                              // Check for duplicate barcode if barcode is entered
                              if (newBarcode && newBarcode.length >= 8) {
                                try {
                                  const excludeId = editingProduct?.id;
                                  const response = await fetch(`/api/barcode/check-duplicate/${newBarcode}${excludeId ? `?excludeProductId=${excludeId}` : ''}`, {
                                    credentials: 'include'
                                  });
                                  
                                  if (response.ok) {
                                    const result = await response.json();
                                    if (result.data.isDuplicate) {
                                      toast({
                                        title: "Duplicate Barcode!",
                                        description: `This barcode is already used by: ${result.data.duplicateProduct.name}`,
                                        variant: "destructive"
                                      });
                                      form.setError("barcode", {
                                        type: "manual",
                                        message: "This barcode is already in use"
                                      });
                                    } else {
                                      form.clearErrors("barcode");
                                    }
                                  }
                                } catch (error) {
                                  console.error('Error checking barcode duplicate:', error);
                                }
                              }
                            }}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={async () => {
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
                            
                            // Generate unique barcode with duplicate checking
                            try {
                              const { generateUniqueEAN13Barcode } = await import('@shared/barcode-utils');
                              const excludeId = editingProduct?.id;
                              const generatedBarcode = await generateUniqueEAN13Barcode(productName, category, excludeId);
                              
                              console.log('Generated unique barcode:', {
                                productName,
                                category,
                                generated: generatedBarcode,
                                isValid: validateEAN13(generatedBarcode)
                              });
                              
                              form.setValue("barcode", generatedBarcode);
                              
                              toast({
                                title: "Barcode Generated",
                                description: "Unique EAN-13 barcode created successfully",
                                variant: "default"
                              });
                            } catch (error) {
                              console.error('Error generating unique barcode:', error);
                              toast({
                                title: "Generation Failed",
                                description: "Failed to generate unique barcode",
                                variant: "destructive"
                              });
                              return;
                            }
                            
                            // Generate barcode image immediately
                            setTimeout(() => {
                              if (barcodeCanvasRef.current) {
                                try {
                                  const currentBarcode = form.getValues("barcode");
                                  console.log('Generating barcode in button click:', currentBarcode);
                                  
                                  // Set canvas dimensions first
                                  const canvas = barcodeCanvasRef.current;
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
                                } catch (error) {
                                  console.error('Immediate barcode generation error:', error);
                                }
                              }
                            }, 100);
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
                          placeholder="Enter product features (one per line)" 
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
                  name="applications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Applications</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter product applications (one per line)" 
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
                              accept="image/jpeg,image/jpg,image/png,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file);
                              }}
                              disabled={uploadingImage}
                            />
                          </label>
                          <div className="mt-2 text-xs text-gray-500">
                            <p>Optimal sizes: 350x350px (cards), 600x600px (details)</p>
                            <p>Formats: JPEG, PNG, WebP | Max: 2MB</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>



                {/* MSDS Upload Section */}
                <div className="space-y-2">
                  <FormLabel>MSDS (Material Safety Data Sheet)</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {msdsPreview ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm truncate">
                            {form.getValues('msdsFileName') || 'MSDS uploaded'}
                          </span>
                        </div>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setMsdsPreview(null);
                            form.setValue('msdsUrl', '');
                            form.setValue('msdsFileName', '');
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="msds-upload" className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-500">
                              {uploadingMsds ? 'Uploading...' : 'Upload MSDS'}
                            </span>
                            <input
                              id="msds-upload"
                              type="file"
                              className="sr-only"
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleMsdsUpload(file);
                              }}
                              disabled={uploadingMsds}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* MSDS Visibility Control */}
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="showMsdsToCustomers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Show MSDS to customers
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Catalog Upload Section */}
                <div className="space-y-2">
                  <FormLabel>Product Catalog PDF</FormLabel>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {catalogPreview ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          <FileText className="w-4 h-4" />
                          <span className="text-sm truncate">
                            {form.getValues('catalogFileName') || 'Catalog uploaded'}
                          </span>
                        </div>
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setCatalogPreview(null);
                            form.setValue('pdfCatalogUrl', '');
                            form.setValue('catalogFileName', '');
                          }}
                        >
                          Remove Catalog
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-2">
                          <label htmlFor="catalog-upload" className="cursor-pointer">
                            <span className="text-sm text-blue-600 hover:text-blue-500">
                              {uploadingCatalog ? 'Uploading...' : 'Upload Catalog'}
                            </span>
                            <input
                              id="catalog-upload"
                              type="file"
                              className="sr-only"
                              accept=".pdf"
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
                  
                  {/* Catalog Visibility Control */}
                  <div className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="showCatalogToCustomers"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal">
                            Show Catalog to customers
                          </FormLabel>
                        </FormItem>
                      )}
                    />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأیید حذف محصول</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف محصول "{deletingProduct?.name}" مطمئن هستید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>لغو</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
            >
              حذف محصول
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}