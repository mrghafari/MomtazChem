import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Search, 
  ChevronDown,
  ChevronRight,
  Beaker,
  Scale,
  Box,
  Tag,
  DollarSign,
  Barcode
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

// Validation schemas
const variantFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  price: z.string().min(1, "Price is required"),
  priceUnit: z.string().min(1, "Price unit is required"),
  variantType: z.string().min(1, "Variant type is required"),
  variantValue: z.string().min(1, "Variant value is required"),
  stockQuantity: z.number().min(0, "Stock quantity must be positive"),
  lowStockThreshold: z.number().min(0, "Low stock threshold must be positive"),
  sku: z.string().min(1, "SKU is required"),
  weight: z.string().optional(),
  weightUnit: z.string().default("kg"),
});

type VariantFormData = z.infer<typeof variantFormSchema>;

interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: string;
  priceUnit: string;
  stockQuantity: number;
  lowStockThreshold: number;
  sku: string;
  barcode?: string;
  weight?: string;
  weightUnit: string;
  isVariant: boolean;
  parentProductId?: number;
  variantType?: string;
  variantValue?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

interface ProductGroup {
  parent: Product;
  variants: Product[];
}

export default function ProductVariantsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedParentProduct, setSelectedParentProduct] = useState<Product | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const queryClient = useQueryClient();

  // Fetch all products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['/api/shop/products'],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/shop/categories'],
  });

  // Create variant mutation
  const createVariantMutation = useMutation({
    mutationFn: async (data: VariantFormData & { parentProductId?: number }) => {
      const response = await fetch('/api/shop/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          price: parseFloat(data.price),
          weight: data.weight ? parseFloat(data.weight) : null,
          isVariant: !!data.parentProductId,
          parentProductId: data.parentProductId || null,
        }),
      });
      if (!response.ok) throw new Error('Failed to create product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      setIsCreateModalOpen(false);
      setSelectedParentProduct(null);
      toast({
        title: "Success",
        description: "Product variant created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create variant",
        variant: "destructive",
      });
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (data: { id: number } & Partial<VariantFormData>) => {
      const { id, ...updateData } = data;
      const response = await fetch(`/api/shop/products/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...updateData,
          price: updateData.price ? parseFloat(updateData.price) : undefined,
          weight: updateData.weight ? parseFloat(updateData.weight) : undefined,
        }),
      });
      if (!response.ok) throw new Error('Failed to update product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      setIsEditModalOpen(false);
      setEditingProduct(null);
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update product",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/shop/products/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products'] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    },
  });

  // Group products by parent
  const productGroups: ProductGroup[] = React.useMemo(() => {
    if (!Array.isArray(products) || !products.length) return [];

    const parentProducts = products.filter((p: any) => !p.isVariant);
    const variantProducts = products.filter((p: any) => p.isVariant);

    return parentProducts.map((parent: any) => ({
      parent,
      variants: variantProducts
        .filter((v: any) => v.parentProductId === parent.id)
        .sort((a: any, b: any) => a.sortOrder - b.sortOrder),
    }));
  }, [products]);

  // Filter and search
  const filteredGroups = productGroups.filter(group => {
    const matchesSearch = group.parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.parent.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.variants.some(v => v.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || group.parent.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleGroupExpansion = (groupId: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleCreateVariant = (parentProduct: Product) => {
    setSelectedParentProduct(parentProduct);
    setIsCreateModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProductMutation.mutate(product.id);
    }
  };

  const getVariantTypeIcon = (type: string) => {
    switch (type) {
      case 'size': return <Scale className="h-4 w-4" />;
      case 'concentration': return <Beaker className="h-4 w-4" />;
      case 'packaging': return <Box className="h-4 w-4" />;
      case 'purity': return <Tag className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStockStatusColor = (product: Product) => {
    if (product.stockQuantity === 0) return 'bg-red-100 text-red-800';
    if (product.stockQuantity <= product.lowStockThreshold) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Variants Management</h1>
          <p className="text-gray-600 mt-2">
            Manage products with same properties but different packaging, sizes, or concentrations
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products by name or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Product Groups */}
      <div className="space-y-4">
        {filteredGroups.map((group) => (
          <Card key={group.parent.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroupExpansion(group.parent.id)}
                    className="p-1 h-8 w-8"
                  >
                    {expandedGroups.has(group.parent.id) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <Package className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-lg">{group.parent.name}</h3>
                    <p className="text-sm text-gray-600">
                      SKU: {group.parent.sku} • Category: {group.parent.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStockStatusColor(group.parent)}>
                    Stock: {group.parent.stockQuantity}
                  </Badge>
                  <Badge variant="outline">
                    ${group.parent.price} / {group.parent.priceUnit}
                  </Badge>
                  <Badge variant="secondary">
                    {group.variants.length} variant{group.variants.length !== 1 ? 's' : ''}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCreateVariant(group.parent)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Variant
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditProduct(group.parent)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProduct(group.parent)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {expandedGroups.has(group.parent.id) && (
              <CardContent className="pt-0">
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-3 text-gray-900">Product Variants:</h4>
                  {group.variants.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No variants created yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateVariant(group.parent)}
                        className="mt-2"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Create First Variant
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {group.variants.map((variant) => (
                        <div
                          key={variant.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getVariantTypeIcon(variant.variantType || 'size')}
                              <span className="font-medium text-sm">
                                {variant.variantValue}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(variant)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(variant)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1 text-xs text-gray-600">
                            <div className="flex justify-between">
                              <span>Price:</span>
                              <span className="font-medium">${variant.price} / {variant.priceUnit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Stock:</span>
                              <Badge className={getStockStatusColor(variant)}>
                                {variant.stockQuantity}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>SKU:</span>
                              <span className="font-mono">{variant.sku}</span>
                            </div>
                            {variant.barcode && (
                              <div className="flex justify-between">
                                <span>Barcode:</span>
                                <span className="font-mono">{variant.barcode}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}

        {filteredGroups.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Products Found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No products match your search criteria'
                  : 'Start by creating your first product'
                }
              </p>
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Product
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Product Modal */}
      <ProductFormModal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedParentProduct(null);
          setEditingProduct(null);
        }}
        parentProduct={selectedParentProduct}
        editingProduct={editingProduct}
        categories={categories}
        onSubmit={(data) => {
          if (editingProduct) {
            updateProductMutation.mutate({ id: editingProduct.id, ...data });
          } else {
            createVariantMutation.mutate({
              ...data,
              parentProductId: selectedParentProduct?.id,
            });
          }
        }}
        isLoading={createVariantMutation.isPending || updateProductMutation.isPending}
      />
    </div>
  );
}

// Product Form Modal Component
interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentProduct?: Product | null;
  editingProduct?: Product | null;
  categories: any[];
  onSubmit: (data: VariantFormData) => void;
  isLoading: boolean;
}

function ProductFormModal({
  isOpen,
  onClose,
  parentProduct,
  editingProduct,
  categories,
  onSubmit,
  isLoading,
}: ProductFormModalProps) {
  const form = useForm<VariantFormData>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: {
      name: '',
      category: '',
      description: '',
      price: '',
      priceUnit: 'kg',
      variantType: 'size',
      variantValue: '',
      stockQuantity: 0,
      lowStockThreshold: 10,
      sku: '',
      weight: '',
      weightUnit: 'kg',
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        // Editing existing product
        form.reset({
          name: editingProduct.name,
          category: editingProduct.category,
          description: editingProduct.description,
          price: editingProduct.price,
          priceUnit: editingProduct.priceUnit,
          variantType: editingProduct.variantType || 'size',
          variantValue: editingProduct.variantValue || '',
          stockQuantity: editingProduct.stockQuantity,
          lowStockThreshold: editingProduct.lowStockThreshold,
          sku: editingProduct.sku,
          weight: editingProduct.weight || '',
          weightUnit: editingProduct.weightUnit,
        });
      } else if (parentProduct) {
        // Creating variant of existing product
        form.reset({
          name: parentProduct.name,
          category: parentProduct.category,
          description: parentProduct.description,
          price: parentProduct.price,
          priceUnit: parentProduct.priceUnit,
          variantType: 'size',
          variantValue: '',
          stockQuantity: 0,
          lowStockThreshold: parentProduct.lowStockThreshold,
          sku: '',
          weight: parentProduct.weight || '',
          weightUnit: parentProduct.weightUnit,
        });
      } else {
        // Creating new parent product
        form.reset({
          name: '',
          category: '',
          description: '',
          price: '',
          priceUnit: 'kg',
          variantType: 'size',
          variantValue: '',
          stockQuantity: 0,
          lowStockThreshold: 10,
          sku: '',
          weight: '',
          weightUnit: 'kg',
        });
      }
    }
  }, [isOpen, editingProduct, parentProduct, form]);

  const isVariant = !!parentProduct;
  const isEditing = !!editingProduct;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing 
              ? `Edit ${editingProduct?.isVariant ? 'Variant' : 'Product'}` 
              : isVariant 
                ? `Create Variant for ${parentProduct?.name}`
                : 'Create New Product'
            }
          </DialogTitle>
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
                      <Input 
                        {...field} 
                        disabled={isVariant && !isEditing}
                        placeholder="e.g., Sodium Hydroxide"
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
                    <FormLabel>Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      disabled={isVariant && !isEditing}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(categories) && categories.map((category: any) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      disabled={isVariant && !isEditing}
                      placeholder="Product description..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Variant Type and Value (only for variants) */}
            {(isVariant || editingProduct?.isVariant) && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="variantType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Variant Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="size">Size/Weight</SelectItem>
                          <SelectItem value="concentration">Concentration</SelectItem>
                          <SelectItem value="packaging">Packaging Type</SelectItem>
                          <SelectItem value="purity">Purity Level</SelectItem>
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
                        <Input 
                          {...field} 
                          placeholder="e.g., 1kg, 95%, Bottle"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priceUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="kg">per kg</SelectItem>
                        <SelectItem value="liter">per liter</SelectItem>
                        <SelectItem value="ton">per ton</SelectItem>
                        <SelectItem value="piece">per piece</SelectItem>
                        <SelectItem value="bottle">per bottle</SelectItem>
                        <SelectItem value="container">per container</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Stock Alert</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number"
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
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="e.g., SOD-HYD-1KG"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number"
                          step="0.01"
                          placeholder="1.0"
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
                      <FormLabel>Unit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="ton">ton</SelectItem>
                          <SelectItem value="liter">liter</SelectItem>
                          <SelectItem value="ml">ml</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    {isEditing ? 'Update' : 'Create'} {isVariant || editingProduct?.isVariant ? 'Variant' : 'Product'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}