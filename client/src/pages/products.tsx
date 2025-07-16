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
import { Plus, Edit, Trash2, Package, DollarSign, Beaker, Droplet, LogOut, User, Upload, Image, FileText, X, AlertTriangle, CheckCircle, AlertCircle, XCircle, TrendingUp, TrendingDown, BarChart3, QrCode, Mail, Search, Database, Factory, BookOpen, ArrowLeft, Wheat, Eye, EyeOff, HelpCircle, Info, Tag, Lock, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import JsBarcode from "jsbarcode";
import VisualBarcode from "@/components/ui/visual-barcode";

// Custom form schema that handles numeric inputs properly
const formSchema = insertShowcaseProductSchema.extend({
  unitPrice: z.coerce.number().min(0),
  stockQuantity: z.coerce.number().min(0),
  minStockLevel: z.coerce.number().min(0),
  maxStockLevel: z.coerce.number().min(0),
  // Weight fields - Enhanced with net and gross weights
  netWeight: z.coerce.number().min(0).optional(),
  grossWeight: z.coerce.number().min(0).optional(),
  weightUnit: z.string().default("kg"),
  // Legacy weight field for backward compatibility
  weight: z.string().optional(),
  // Batch tracking
  batchNumber: z.string().optional(),
  // Text fields for array handling
  features: z.string().optional(),
  applications: z.string().optional(),
  tags: z.string().optional(), // Tags as comma-separated string
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
  // Shop sync control
  syncWithShop: z.boolean().default(true),
  // Out of stock display control
  showWhenOutOfStock: z.boolean().default(false),
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
  const [selectedVisibilityFilter, setSelectedVisibilityFilter] = useState<string>("all");
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

  const { data: products, isLoading, refetch } = useQuery<ShowcaseProduct[]>({
    queryKey: ["/api/products"],
    staleTime: 0, // Always refetch for real-time updates
    cacheTime: 0, // Don't cache data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Force refresh every time component mounts
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["/api/products"] });
    refetch();
  }, [refetch]);

  const { mutate: createProduct } = useMutation({
    mutationFn: (data: InsertShowcaseProduct) => apiRequest("/api/products", { method: "POST", body: data }),
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
      // Immediate refresh to show changes
      window.location.reload();
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
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertShowcaseProduct> }) => {

      return apiRequest(`/api/products/${id}`, { method: "PUT", body: data });
    },
    onSuccess: (result) => {
      console.log('✅ [DEBUG] Update mutation successful, result:', result);
      
      // Close dialog and reset form
      setDialogOpen(false);
      setEditingProduct(null);
      form.reset();
      
      // Refresh products list to ensure UI is in sync
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      
      toast({
        title: "موفقیت",
        description: "محصول با موفقیت بروزرسانی شد",
      });
      // Immediate refresh to show changes
      window.location.reload();
    },
    onError: (error: any) => {
      console.error('❌ [DEBUG] Update mutation failed:', error);
      
      // Show user-friendly error message
      let errorMessage = "بروزرسانی محصول ناموفق بود";
      if (error.message?.includes("already exists")) {
        errorMessage = "کد SKU تکراری است، لطفاً کد جدید وارد کنید";
      } else if (error.message?.includes("authentication") || error.message?.includes("احراز هویت")) {
        errorMessage = "لطفاً مجدداً وارد شوید";
      }
      
      toast({
        title: "خطا",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteProduct } = useMutation({
    mutationFn: (id: number) => {
      console.log(`🗑️ [DELETE] Starting delete for product ID: ${id}`);
      return apiRequest(`/api/products/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      console.log(`✅ [DELETE] Product deleted successfully`);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setRefreshKey(prev => prev + 1); // Force component re-render
      setDeletingProduct(null); // Close the confirmation dialog
      toast({
        title: "موفقیت",
        description: "محصول با موفقیت حذف شد و از فروشگاه نیز حذف شد",
      });
      // Immediate refresh to show changes
      window.location.reload();
    },
    onError: (error: any) => {
      console.error(`❌ [DELETE] Delete failed:`, error);
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
    console.log(`🗑️ [DELETE] Opening delete confirmation for product:`, product.name);
    setDeletingProduct(product);
  };

  // Confirm delete product
  const confirmDeleteProduct = () => {
    if (deletingProduct) {
      console.log(`🗑️ [DELETE] Confirming delete for product:`, deletingProduct.name, `ID: ${deletingProduct.id}`);
      deleteProduct(deletingProduct.id);
    } else {
      console.warn(`⚠️ [DELETE] No product selected for deletion`);
    }
  };

  // Quick sync toggle mutation
  const { mutate: toggleSync } = useMutation({
    mutationFn: ({ id, syncWithShop }: { id: number; syncWithShop: boolean }) => {
      console.log(`🔄 [DEBUG] Toggling syncWithShop for product ${id} to:`, syncWithShop);
      return apiRequest(`/api/products/${id}`, { method: "PUT", body: { syncWithShop } });
    },
    onSuccess: (result) => {
      console.log('✅ [DEBUG] Toggle sync successful:', result);
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setRefreshKey(prev => prev + 1);
      toast({
        title: "به‌روزرسانی موفقیت‌آمیز",
        description: "وضعیت نمایش در فروشگاه به‌روزرسانی شد",
      });
      // Immediate refresh to show changes
      window.location.reload();
    },
    onError: (error: any) => {
      console.error('❌ [DEBUG] Toggle sync failed:', error);
      toast({
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی وضعیت نمایش",
        variant: "destructive",
      });
    },
  });

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
      // Shop visibility control
      syncWithShop: true,
      showWhenOutOfStock: false,
      // Weight fields
      netWeight: 0,
      grossWeight: 0,
      // Batch tracking
      batchNumber: "",
    },
  });

  const onSubmit = (data: InsertShowcaseProduct) => {
    console.log('🔍 [DEBUG] Form submission - Raw form data:', data);
    console.log('🔍 [DEBUG] Tags in form data:', data.tags, 'Type:', typeof data.tags);
    console.log('🔍 [DEBUG] Description in form data:', data.description);
    console.log('🔍 [DEBUG] editingProduct state:', editingProduct?.id);
    
    // Convert numeric fields to strings for API compatibility
    const processedData = {
      ...data,
      unitPrice: data.unitPrice ? data.unitPrice.toString() : "0",
      stockQuantity: Number(data.stockQuantity) || 0,
      minStockLevel: Number(data.minStockLevel) || 0,
      maxStockLevel: Number(data.maxStockLevel) || 0,
      // Process weight fields - use gross weight for calculations
      netWeight: data.netWeight ? data.netWeight.toString() : null,
      grossWeight: data.grossWeight ? data.grossWeight.toString() : null,
      batchNumber: data.batchNumber?.trim() || null,
      // Convert string fields to arrays for backend compatibility
      features: typeof data.features === 'string' && data.features.trim() 
        ? data.features.split('\n').map(f => f.trim()).filter(f => f.length > 0)
        : [],
      applications: typeof data.applications === 'string' && data.applications.trim()
        ? data.applications.split('\n').map(a => a.trim()).filter(a => a.length > 0)
        : [],
      tags: typeof data.tags === 'string' && data.tags.trim()
        ? data.tags.split(',').map(t => t.trim()).filter(t => t.length > 0)
        : ["شیمیایی"],
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
    
    console.log('🚀 [DEBUG] Final processed data being sent to API:', JSON.stringify(processedData, null, 2));
    
    if (editingProduct) {
      console.log('📝 [DEBUG] Calling updateProduct with ID:', editingProduct.id);
      console.log('📝 [DEBUG] updateProduct function exists:', typeof updateProduct);
      updateProduct({ id: editingProduct.id, data: processedData });
    } else {
      console.log('➕ [DEBUG] Calling createProduct');
      console.log('➕ [DEBUG] createProduct function exists:', typeof createProduct);
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
      tags: Array.isArray(product.tags) ? product.tags.join(', ') : (product.tags || ""),
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
      netWeight: Number(product.netWeight) || 0,
      grossWeight: Number(product.grossWeight) || 0,
      batchNumber: product.batchNumber || "",
      imageUrl: product.imageUrl || "",
      pdfCatalogUrl: product.pdfCatalogUrl || "",
      msdsUrl: product.msdsUrl || "",
      msdsFileName: product.msdsFileName || "",
      showMsdsToCustomers: product.showMsdsToCustomers || false,
      catalogFileName: product.catalogFileName || "",
      showCatalogToCustomers: product.showCatalogToCustomers || false,
      syncWithShop: product.syncWithShop !== undefined ? product.syncWithShop : true,
      showWhenOutOfStock: product.showWhenOutOfStock ?? false,
      isActive: product.isActive !== false,
    });
    setDialogOpen(true);
  };

  // Filter products based on category, inventory status, visibility, and search
  const filteredProducts = (products || []).filter((product: ShowcaseProduct) => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check inventory status
    const inventoryStatus = getActualInventoryStatus(product.stockQuantity, product.minStockLevel);
    const matchesInventoryStatus = selectedInventoryStatus === "all" || inventoryStatus === selectedInventoryStatus;
    
    // Check visibility status
    const matchesVisibility = selectedVisibilityFilter === "all" || 
      (selectedVisibilityFilter === "hidden" && !product.syncWithShop) ||
      (selectedVisibilityFilter === "visible" && product.syncWithShop);
    
    return matchesCategory && matchesSearch && matchesInventoryStatus && matchesVisibility;
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
            {user?.id === 1 && (
              <Button
                variant="outline"
                onClick={() => setLocation("/admin")}
                className="border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            )}
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
        {(selectedInventoryStatus !== "all" || selectedCategory !== "all" || selectedVisibilityFilter !== "all" || searchQuery) && (
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
            {selectedVisibilityFilter !== "all" && (
              <Badge variant="secondary" className="cursor-pointer hover:bg-gray-300" onClick={() => setSelectedVisibilityFilter("all")}>
                Visibility: {selectedVisibilityFilter === "hidden" ? "Hidden Products" : "Visible Products"}
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
                setSelectedVisibilityFilter("all");
                setSearchQuery("");
              }}
              className="h-6 text-xs"
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Management Actions */}
        <div className="mb-6 flex gap-3">
          <Button onClick={openCreateDialog} className="bg-blue-600 hover:bg-blue-700 h-12 text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
          
          <Button 
            onClick={() => {
              queryClient.clear();
              queryClient.removeQueries({ queryKey: ["/api/products"] });
              refetch();
              setRefreshKey(prev => prev + 1);
              toast({
                title: "Cache Cleared",
                description: "Data refreshed successfully",
              });
            }}
            variant="outline" 
            className="h-12 text-sm"
          >
            <Database className="w-4 h-4 mr-2" />
            Force Refresh
          </Button>
        </div>
      </div>

      {/* Inventory Dashboard Summary */}
      {products && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
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

          <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedVisibilityFilter('hidden')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hidden Products</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {products.filter(p => !p.syncWithShop).length}
                  </p>
                </div>
                <EyeOff className="w-8 h-8 text-gray-600" />
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
                          onClick={() => toggleSync({ id: product.id, syncWithShop: !product.syncWithShop })}
                          className={`h-8 w-16 p-0 text-xs font-medium ${product.syncWithShop ? 'hover:bg-red-50 hover:text-red-600 bg-green-50 text-green-700' : 'hover:bg-green-50 hover:text-green-600 bg-gray-50 text-gray-700'}`}
                          title={product.syncWithShop ? 'مخفی کردن از فروشگاه' : 'نمایش در فروشگاه'}
                        >
                          {product.syncWithShop ? 'مخفی کردن' : 'نمایش'}
                        </Button>
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
                        <div className="space-y-1 w-full">
                          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 min-w-0">
                            <span className="break-words truncate">Stock: {product.stockQuantity.toLocaleString()}</span>
                            {product.maxStockLevel && <span className="break-words truncate ml-2">Max: {product.maxStockLevel.toLocaleString()}</span>}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                getStockLevelIndicator(
                                  product.stockQuantity, 
                                  product.minStockLevel || 0, 
                                  product.maxStockLevel || 1000
                                ).color
                              }`}
                              style={{ 
                                width: `${Math.min(100, getStockLevelIndicator(
                                  product.stockQuantity, 
                                  product.minStockLevel || 0, 
                                  product.maxStockLevel || 1000
                                ).width)}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Product Weight Information */}
                      {(product.netWeight || product.grossWeight || (product.weight && parseFloat(product.weight) > 0)) && (
                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                          {product.netWeight && product.netWeight > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">وزن خالص:</span>
                              <span>{Number(product.netWeight).toFixed(1)} {product.weightUnit || 'kg'}</span>
                            </div>
                          )}
                          {product.grossWeight && product.grossWeight > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">وزن ناخالص:</span>
                              <span>{Number(product.grossWeight).toFixed(1)} {product.weightUnit || 'kg'}</span>
                            </div>
                          )}
                          {!product.netWeight && !product.grossWeight && product.weight && parseFloat(product.weight) > 0 && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">وزن:</span>
                              <span>{parseFloat(product.weight).toFixed(1)} {product.weightUnit || 'kg'}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Batch Number */}
                      {product.batchNumber && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">شماره بچ:</span>
                          <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                            {product.batchNumber}
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
                      
                      {/* Document Availability Indicators - Bottom Right */}
                      <div className="flex justify-end mt-3">
                        <div className="flex gap-2">
                          {/* Catalog Indicator */}
                          {product.showCatalogToCustomers && product.pdfCatalogUrl && (
                            <div 
                              className="bg-green-500 rounded-full p-1.5 shadow-lg border-2 border-white cursor-pointer hover:bg-green-600 transition-colors" 
                              title="کلیک برای باز کردن کاتالوگ"
                              onClick={() => window.open(product.pdfCatalogUrl, '_blank')}
                            >
                              <Eye className="w-3 h-3 text-white" />
                            </div>
                          )}
                          
                          {/* MSDS Indicator */}
                          {product.showMsdsToCustomers && product.msdsUrl && (
                            <div 
                              className="bg-blue-500 rounded-full p-1.5 shadow-lg border-2 border-white cursor-pointer hover:bg-blue-600 transition-colors" 
                              title="کلیک برای باز کردن MSDS"
                              onClick={() => window.open(product.msdsUrl, '_blank')}
                            >
                              <FileText className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
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
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-2xl font-bold text-center text-blue-700 flex items-center justify-center gap-2">
              <Package className="h-6 w-6" />
              {editingProduct ? "ویرایش محصول" : "افزودن محصول جدید"}
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              {editingProduct ? "ویرایش اطلاعات محصول موجود" : "افزودن محصول جدید به کاردکس"}
            </DialogDescription>
          </DialogHeader>
          
          <TooltipProvider>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, (errors) => {
                console.log('❌ [DEBUG] Form validation failed:', errors);
              })} className="space-y-4">
                
                {/* اطلاعات پایه محصول */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    اطلاعات پایه محصول
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            نام محصول *
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>نام کامل محصول را وارد کنید. این نام در کاردکس و فروشگاه نمایش داده می‌شود</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="نام محصول را وارد کنید" 
                              className="h-9"
                              {...field} 
                            />
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
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            دسته‌بندی *
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>دسته‌بندی محصول برای طبقه‌بندی و جستجوی بهتر</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="دسته‌بندی را انتخاب کنید" />
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
                  </div>

                  <div className="mt-3">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            توضیحات محصول
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>توضیحات کامل درباره محصول، کاربرد و ویژگی‌های آن</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="توضیحات محصول..." 
                              className="min-h-[80px] resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* شناسایی و قیمت‌گذاری */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    شناسایی و قیمت‌گذاری
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2 text-sm font-medium">
                            کد محصول (SKU)
                            {editingProduct && <Lock className="h-3 w-3 text-gray-400" />}
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>کد یکتای محصول برای شناسایی در سیستم. بعد از ایجاد قابل تغییر نیست</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="کد محصول" 
                              className={`h-9 ${editingProduct ? "bg-gray-50 text-gray-500" : ""}`}
                              {...field}
                              readOnly={!!editingProduct}
                            />
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
                          <FormLabel className="flex items-center gap-2 text-sm font-medium">
                            بارکد (EAN-13)
                            {editingProduct && <Lock className="h-3 w-3 text-gray-400" />}
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>بارکد استاندارد 13 رقمی محصول. بعد از ایجاد قابل تغییر نیست</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="بارکد 13 رقمی" 
                              className={`h-9 ${editingProduct ? "bg-gray-50 text-gray-500" : ""}`}
                              {...field}
                              readOnly={!!editingProduct}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="batchNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            شماره بچ
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>شماره دسته تولید برای ردیابی محصولات</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="BATCH-2025-001" 
                              className="h-9"
                              {...field}
                              value={field.value || ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <FormField
                      control={form.control}
                      name="unitPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            قیمت واحد
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>قیمت هر واحد محصول به واحد پولی انتخابی</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              className="h-9"
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
                          <FormLabel className="text-sm font-medium">واحد پول</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "IQD"}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="IQD">دینار عراقی (IQD)</SelectItem>
                              <SelectItem value="USD">دلار آمریکا (USD)</SelectItem>
                              <SelectItem value="EUR">یورو (EUR)</SelectItem>
                              <SelectItem value="TRY">لیر ترکیه (TRY)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* مدیریت موجودی و وزن */}
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                  <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    مدیریت موجودی و وزن
                  </h3>
                  
                  {/* ردیف موجودی */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <FormField
                      control={form.control}
                      name="stockQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            موجودی فعلی
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>تعداد موجودی فعلی محصول در انبار</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="h-9"
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
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            حداقل موجودی
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>حداقل موجودی برای هشدار کمبود</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="h-9"
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
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            حداکثر موجودی
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>حداکثر ظرفیت نگهداری محصول در انبار</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0" 
                              className="h-9"
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

                  {/* ردیف وزن */}
                  <div className="grid grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="netWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            وزن خالص
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>وزن خالص محصول بدون بسته‌بندی</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              className="h-9"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : '')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="grossWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium flex items-center gap-2">
                            وزن ناخالص
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-3 w-3 text-gray-400" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>وزن کل محصول همراه با بسته‌بندی (برای حمل و نقل)</p>
                              </TooltipContent>
                            </Tooltip>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00" 
                              className="h-9"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : '')}
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
                          <FormLabel className="text-sm font-medium">واحد وزن</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value || "kg"}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="انتخاب واحد" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="kg">کیلوگرم (kg)</SelectItem>
                              <SelectItem value="g">گرم (g)</SelectItem>
                              <SelectItem value="lb">پوند (lb)</SelectItem>
                              <SelectItem value="oz">اونس (oz)</SelectItem>
                              <SelectItem value="t">تن (t)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* برچسب‌ها و تنظیمات اضافی */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    برچسب‌ها و تنظیمات
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium flex items-center gap-2">
                          برچسب‌ها
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="h-3 w-3 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>برچسب‌ها را با کاما از هم جدا کنید. این برچسب‌ها در فروشگاه نمایش داده می‌شوند</p>
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="مثال: شیمیایی, صنعتی, پاک‌کننده" 
                            className="h-9"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => {
                              console.log('Tags input changed:', e.target.value);
                              field.onChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <FormField
                      control={form.control}
                      name="syncWithShop"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">نمایش در فروشگاه</FormLabel>
                            <div className="text-xs text-gray-500">محصول در فروشگاه آنلاین نمایش داده شود</div>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="showWhenOutOfStock"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium">نمایش در زمان اتمام</FormLabel>
                            <div className="text-xs text-gray-500">حتی در صورت تمام شدن موجودی نمایش داده شود</div>
                          </div>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* دکمه‌های عمل */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingProduct(null);
                      form.reset();
                    }}
                    className="px-6"
                  >
                    انصراف
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-6 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    {editingProduct ? "به‌روزرسانی محصول" : "افزودن محصول"}
                  </Button>
                </div>
              </form>
            </Form>
          </TooltipProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
}
