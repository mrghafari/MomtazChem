import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Plus, Minus, Filter, Search, Grid, List, Star, User, LogOut, X, ChevronDown, Eye, Brain, Sparkles, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import type { ShopProduct, ShopCategory } from "@shared/shop-schema";
import Checkout from "./checkout";
import BilingualPurchaseForm from "@/components/bilingual-purchase-form";
import PreCheckoutModal from "@/components/checkout/pre-checkout-modal";

import CustomerAuth from "@/components/auth/customer-auth";
import { useToast } from "@/hooks/use-toast";

const Shop = () => {
  const { toast } = useToast();
  const { t, direction } = useLanguage();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cart, setCart] = useState<{[key: number]: number}>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPreCheckout, setShowPreCheckout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [customer, setCustomer] = useState<any>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Advanced search state
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    priceMin: undefined as number | undefined,
    priceMax: undefined as number | undefined,
    inStock: undefined as boolean | undefined,
    tags: [] as string[],
    sortBy: 'relevance' as 'name' | 'price' | 'created' | 'relevance',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchTerm);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Advanced search query
  const { data: searchResults, isLoading: productsLoading } = useQuery({
    queryKey: ['shopSearch', debouncedQuery, filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedQuery,
        limit: itemsPerPage.toString(),
        offset: (currentPage * itemsPerPage).toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      if (filters.category) params.append('category', filters.category);
      if (filters.priceMin !== undefined) params.append('priceMin', filters.priceMin.toString());
      if (filters.priceMax !== undefined) params.append('priceMax', filters.priceMax.toString());
      if (filters.inStock !== undefined) params.append('inStock', filters.inStock.toString());
      if (filters.tags?.length) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }

      const response = await fetch(`/api/shop/search?${params}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    }
  });

  // Fetch shop products (fallback)
  const { data: products = [] } = useQuery<ShopProduct[]>({
    queryKey: ["/api/shop/products"],
    enabled: !searchResults
  });

  // Get data from search results or fallback to regular products
  const currentProducts = searchResults?.data?.products || products;
  const totalResults = searchResults?.data?.total || products.length;
  const availableFilters = searchResults?.data?.filters;
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  // Update price range when search results change
  useEffect(() => {
    if (availableFilters?.priceRange) {
      const { min, max } = availableFilters.priceRange;
      if (min !== priceRange[0] || max !== priceRange[1]) {
        setPriceRange([min, max]);
        if (!filters.priceMin && !filters.priceMax) {
          setFilters(prev => ({ ...prev, priceMin: min, priceMax: max }));
        }
      }
    }
  }, [availableFilters?.priceRange]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const handlePriceRangeChange = (value: [number, number]) => {
    setPriceRange(value);
    setFilters(prev => ({ ...prev, priceMin: value[0], priceMax: value[1] }));
    setCurrentPage(0);
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    handleFilterChange('tags', newTags.length ? newTags : []);
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      priceMin: undefined,
      priceMax: undefined,
      inStock: undefined,
      tags: [],
      sortBy: 'relevance',
      sortOrder: 'desc'
    });
    setCurrentPage(0);
    if (availableFilters?.priceRange) {
      const { min, max } = availableFilters.priceRange;
      setPriceRange([min, max]);
    }
  };

  // Fetch shop categories
  const { data: categories = [] } = useQuery<ShopCategory[]>({
    queryKey: ["/api/shop/categories"],
  });

  // Load customer info on component mount
  useEffect(() => {
    checkCustomerAuth();
  }, []);

  const checkCustomerAuth = async () => {
    try {
      const response = await fetch('/api/customers/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCustomer(result.customer);
          // Fetch wallet balance
          fetchWalletBalance();
        }
      }
    } catch (error) {
      console.error('Error checking customer auth:', error);
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/customers/wallet/balance', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWalletBalance(result.balance || 0);
        }
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };

  const handleLoginSuccess = (customerData: any) => {
    setCustomer(customerData);
    fetchWalletBalance();
    toast({
      title: "خوش آمدید",
      description: `${customerData.firstName} ${customerData.lastName}`,
    });
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/customers/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setCustomer(null);
        setWalletBalance(0);
        toast({
          title: "خروج موفق",
          description: "با موفقیت از حساب کاربری خارج شدید",
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "خطا",
        description: "خطا در خروج از حساب کاربری",
        variant: "destructive",
      });
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory && product.isActive;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  // Cart functions
  const addToCart = (productId: number) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [productId, qty]) => {
      const product = products.find(p => p.id === parseInt(productId));
      if (!product) return total;
      
      const price = getDiscountedPrice(product, qty);
      return total + (price * qty);
    }, 0);
  };

  // Calculate discounted price based on quantity
  const getDiscountedPrice = (product: any, quantity: number) => {
    const basePrice = parseFloat(product.price);
    
    if (product.quantityDiscounts && Array.isArray(product.quantityDiscounts)) {
      // Sort discounts by minimum quantity (descending)
      const sortedDiscounts = product.quantityDiscounts
        .filter((d: any) => quantity >= d.minQty)
        .sort((a: any, b: any) => b.minQty - a.minQty);
      
      if (sortedDiscounts.length > 0) {
        const discount = sortedDiscounts[0].discount;
        return basePrice * (1 - discount);
      }
    }
    
    return basePrice;
  };

  // Calculate total savings
  const getTotalSavings = () => {
    return Object.entries(cart).reduce((savings, [productId, qty]) => {
      const product = products.find(p => p.id === parseInt(productId));
      if (!product) return savings;
      
      const basePrice = parseFloat(product.price);
      const discountedPrice = getDiscountedPrice(product, qty);
      return savings + ((basePrice - discountedPrice) * qty);
    }, 0);
  };

  // Pre-checkout handlers
  const handleCartClick = () => {
    if (getTotalItems() === 0) return;
    
    // If customer is already logged in, go directly to checkout
    if (customer) {
      setShowCheckout(true);
    } else {
      // Show pre-checkout modal to ask login/register/guest
      setShowPreCheckout(true);
    }
  };

  const handleLoginChoice = () => {
    setShowPreCheckout(false);
    setAuthMode('login');
    setShowAuth(true);
  };

  const handleRegisterChoice = () => {
    setShowPreCheckout(false);
    setAuthMode('register');
    setShowAuth(true);
  };

  const handleGuestCheckout = () => {
    setShowPreCheckout(false);
    setShowCheckout(true);
  };

  const handleAuthSuccess = (customerData: any) => {
    setCustomer(customerData);
    setShowAuth(false);
    
    // Check if customer profile is complete for checkout
    const isProfileComplete = customerData.phone && customerData.country && 
                              customerData.city && customerData.address;
    
    if (isProfileComplete) {
      // Profile is complete, proceed to checkout
      setShowCheckout(true);
      toast({
        title: direction === 'rtl' ? "ورود موفق" : "Login Successful",
        description: direction === 'rtl' ? "خوش آمدید!" : "Welcome back!",
      });
    } else {
      // Profile needs completion, show registration form with pre-filled data
      setAuthMode('register');
      setShowAuth(true);
      toast({
        title: direction === 'rtl' ? "تکمیل اطلاعات" : "Complete Profile",
        description: direction === 'rtl' ? "لطفاً اطلاعات ناقص خود را تکمیل کنید" : "Please complete your profile information",
        variant: "default",
      });
    }
  };

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between relative">
            <h1 className="text-3xl font-bold text-gray-900">{t.shop}</h1>
            
            {/* AI Recommendations Button - Center */}
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600 shadow-lg"
                onClick={() => navigate('/product-recommendations')}
                title="AI Product Recommendations"
              >
                <Sparkles className="w-5 h-5" />
                <span className="hidden sm:inline">AI Recommendations</span>
              </Button>
            </div>
            
            {/* Cart Section */}
            <div className="flex items-center gap-4">
              {/* Cart Summary */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleCartClick}
                  disabled={getTotalItems() === 0}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({getTotalItems()})
                  {getTotalItems() > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        ${getTotalPrice().toFixed(2)}
                      </Badge>
                      {getTotalSavings() > 0 && (
                        <Badge variant="default" className="bg-green-600">
                          Save ${getTotalSavings().toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className="w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Advanced Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search Products</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search products, SKU, specifications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10"
                    />
                  </div>
                </div>

                <Separator />

                {/* Sort Options */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Sort by</label>
                  <div className="space-y-2">
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(value) => handleFilterChange('sortBy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="created">Newest</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select 
                      value={filters.sortOrder} 
                      onValueChange={(value) => handleFilterChange('sortOrder', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">A-Z / Low-High</SelectItem>
                        <SelectItem value="desc">Z-A / High-Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Categories */}
                {availableFilters?.categories && availableFilters.categories.length > 0 && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Categories</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {availableFilters.categories.map((cat: any) => (
                          <div key={cat.name} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cat-${cat.name}`}
                              checked={filters.category === cat.name}
                              onCheckedChange={(checked) => 
                                handleFilterChange('category', checked ? cat.name : "")
                              }
                            />
                            <label 
                              htmlFor={`cat-${cat.name}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {cat.name} ({cat.count})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Price Range */}
                {availableFilters?.priceRange && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Price Range: ${priceRange[0]} - ${priceRange[1]}
                      </label>
                      <div className="mt-2">
                        <Slider
                          value={priceRange}
                          onValueChange={handlePriceRangeChange}
                          max={availableFilters.priceRange.max}
                          min={availableFilters.priceRange.min}
                          step={10}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Stock Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Availability</label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="in-stock"
                      checked={filters.inStock === true}
                      onCheckedChange={(checked) => 
                        handleFilterChange('inStock', checked ? true : undefined)
                      }
                    />
                    <label htmlFor="in-stock" className="text-sm cursor-pointer">
                      In Stock Only
                    </label>
                  </div>
                </div>

                {/* Tags */}
                {availableFilters?.availableTags && availableFilters.availableTags.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Tags</label>
                      <div className="flex flex-wrap gap-1">
                        {availableFilters.availableTags.slice(0, 12).map((tag: any) => (
                          <Badge
                            key={tag}
                            variant={filters.tags?.includes(tag) ? "default" : "outline"}
                            className="cursor-pointer text-xs"
                            onClick={() => handleTagToggle(tag)}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Clear Filters */}
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearFilters}
                  disabled={!Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true))}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* View Toggle */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                Showing {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            <div className={`${
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "flex flex-col gap-4"
            }`}>
              {productsLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <ProductCardSkeleton key={index} viewMode={viewMode} />
                ))
              ) : filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="mb-4">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No products found matching your criteria</p>
                    <p className="text-gray-400 text-sm">Try adjusting your search terms or clearing filters</p>
                  </div>
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear all filters
                  </Button>
                </div>
              ) : (
                currentProducts.map((product: any) => (
                  <Card key={product.id} className={viewMode === "list" ? "flex" : ""}>
                    {viewMode === "grid" ? (
                      <>
                        <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                          {product.thumbnailUrl ? (
                            <img 
                              src={product.thumbnailUrl} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {product.shortDescription || product.description}
                          </p>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="text-2xl font-bold text-green-600">
                                ${parseFloat(product.price).toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-500 ml-1">
                                / {product.priceUnit}
                              </span>
                            </div>
                            <Badge variant={product.inStock ? "secondary" : "destructive"}>
                              {product.inStock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </div>

                          {/* Quantity Discounts Display */}
                          {product.quantityDiscounts && Array.isArray(product.quantityDiscounts) && product.quantityDiscounts.length > 0 && (
                            <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                              <h4 className="text-xs font-semibold text-blue-800 mb-1">📦 Bulk Discounts</h4>
                              <div className="space-y-1">
                                {product.quantityDiscounts.map((discount: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center text-xs">
                                    <span className="text-blue-700">
                                      {discount.minQty}+ items:
                                    </span>
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs py-0 px-1">
                                      {(discount.discount * 100).toFixed(0)}% OFF
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                              {cart[product.id] && cart[product.id] > 0 && (
                                <div className="text-xs text-blue-600 font-semibold mt-1">
                                  {(() => {
                                    const currentQty = cart[product.id];
                                    const applicableDiscount = product.quantityDiscounts
                                      .filter((d: any) => currentQty >= d.minQty)
                                      .sort((a: any, b: any) => b.minQty - a.minQty)[0];
                                    
                                    if (applicableDiscount) {
                                      const savings = parseFloat(product.price) * applicableDiscount.discount * currentQty;
                                      return `💰 You're saving $${savings.toFixed(2)}!`;
                                    }
                                    
                                    const nextDiscount = product.quantityDiscounts
                                      .filter((d: any) => currentQty < d.minQty)
                                      .sort((a: any, b: any) => a.minQty - b.minQty)[0];
                                    
                                    if (nextDiscount) {
                                      const needed = nextDiscount.minQty - currentQty;
                                      return `Add ${needed} more for ${(nextDiscount.discount * 100).toFixed(0)}% discount`;
                                    }
                                    
                                    return "";
                                  })()}
                                </div>
                              )}
                            </div>
                          )}

                          {product.inStock && (
                            <div className="flex items-center gap-2">
                              {cart[product.id] && cart[product.id] > 0 ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromCart(product.id)}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <span className="w-8 text-center">{cart[product.id]}</span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addToCart(product.id)}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  className="w-full"
                                  onClick={() => addToCart(product.id)}
                                >
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  Add to Cart
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </>
                    ) : (
                      <div className="flex">
                        <div className="w-48 h-48 bg-gray-100 flex-shrink-0">
                          {product.thumbnailUrl ? (
                            <img 
                              src={product.thumbnailUrl} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                        </div>
                        <CardContent className="p-6 flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-xl mb-2">{product.name}</h3>
                              <p className="text-gray-600 mb-4">
                                {product.description}
                              </p>
                              
                              <div className="flex items-center gap-4 mb-4">
                                <div>
                                  <span className="text-2xl font-bold text-green-600">
                                    ${parseFloat(product.price).toFixed(2)}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-1">
                                    / {product.priceUnit}
                                  </span>
                                </div>
                                <Badge variant={product.inStock ? "secondary" : "destructive"}>
                                  {product.inStock ? "In Stock" : "Out of Stock"}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="ml-6">
                              {product.inStock && (
                                <div className="flex items-center gap-2">
                                  {cart[product.id] && cart[product.id] > 0 ? (
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => removeFromCart(product.id)}
                                      >
                                        <Minus className="w-4 h-4" />
                                      </Button>
                                      <span className="w-8 text-center">{cart[product.id]}</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addToCart(product.id)}
                                      >
                                        <Plus className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button onClick={() => addToCart(product.id)}>
                                      <ShoppingCart className="w-4 h-4 mr-2" />
                                      Add to Cart
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => {
                    // Show first page, last page, current page and 2 pages around current
                    const pageNum = i;
                    const shouldShow = 
                      pageNum === 0 || // First page
                      pageNum === totalPages - 1 || // Last page
                      Math.abs(pageNum - currentPage) <= 1; // Current page +/- 1
                    
                    if (!shouldShow && totalPages > 7) {
                      // Show ellipsis for gaps
                      if (pageNum === 1 && currentPage > 3) {
                        return <span key={`ellipsis-start`} className="px-2 py-1 text-gray-500">...</span>;
                      }
                      if (pageNum === totalPages - 2 && currentPage < totalPages - 4) {
                        return <span key={`ellipsis-end`} className="px-2 py-1 text-gray-500">...</span>;
                      }
                      return null;
                    }
                    
                    return (
                      <Button
                        key={`pagination-page-${pageNum}`}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  }).filter(Boolean)}
                </div>
                
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages - 1}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bilingual Purchase Form */}
      {showCheckout && (
        <BilingualPurchaseForm
          cart={cart}
          products={currentProducts}
          onOrderComplete={() => {
            setCart({});
            setShowCheckout(false);
          }}
          onClose={() => setShowCheckout(false)}
        />
      )}

      {/* Pre-checkout Modal */}
      <PreCheckoutModal
        isOpen={showPreCheckout}
        onClose={() => setShowPreCheckout(false)}
        onLoginChoice={handleLoginChoice}
        onRegisterChoice={handleRegisterChoice}
        onGuestCheckout={handleGuestCheckout}
        cartItemsCount={getTotalItems()}
      />

      {/* Auth Dialog */}
      <CustomerAuth 
        open={showAuth}
        onOpenChange={setShowAuth}
        onLoginSuccess={handleAuthSuccess}
        initialMode={authMode}
        existingCustomer={authMode === 'register' ? customer : undefined}
      />
    </div>
  );
};

// Helper components for skeleton loading
const ProductCardSkeleton = ({ viewMode }: { viewMode: "grid" | "list" }) => (
  <Card className={`animate-pulse ${viewMode === "list" ? "flex" : ""}`}>
    <div className={`bg-gray-200 ${viewMode === "list" ? "w-32 h-32" : "aspect-square"} rounded-t-lg`}></div>
    <CardContent className="p-4">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 bg-gray-200 rounded mb-2"></div>
      <div className="h-6 bg-gray-200 rounded"></div>
    </CardContent>
  </Card>
);

export default Shop;