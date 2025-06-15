import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Plus, Minus, Filter, Search, Grid, List, Star, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import type { ShopProduct, ShopCategory } from "@shared/shop-schema";
import Checkout from "./checkout";
import AuthCheckout from "@/components/auth-checkout";
import LiveChat from "@/components/ui/live-chat";
import CustomerAuth from "@/components/auth/customer-auth";
import { useToast } from "@/hooks/use-toast";

const Shop = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cart, setCart] = useState<{[key: number]: number}>({});
  const [showCheckout, setShowCheckout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);

  // Fetch shop products
  const { data: products = [], isLoading: productsLoading } = useQuery<ShopProduct[]>({
    queryKey: ["/api/shop/products"],
  });

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
        }
      }
    } catch (error) {
      console.error('Error checking customer auth:', error);
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const handleLoginSuccess = (customerData: any) => {
    setCustomer(customerData);
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
        toast({
          title: "خروج موفق",
          description: "از حساب کاربری خود خارج شدید",
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "مشکلی در خروج رخ داده است",
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

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Chemical Products Shop</h1>
            
            {/* User Account & Cart */}
            <div className="flex items-center gap-4">
              {/* User Account */}
              {!isLoadingCustomer && (
                <div className="flex items-center gap-2">
                  {customer ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.href = "/customer/profile"}
                        className="flex items-center gap-1"
                      >
                        <User className="w-4 h-4" />
                        {customer.firstName}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleLogout}
                        className="flex items-center gap-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowAuth(true)}
                      className="flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Login / Register
                    </Button>
                  )}
                </div>
              )}

              {/* Cart Summary */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setShowCheckout(true)}
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
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search</label>
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                <Separator />

                {/* Categories */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.slug}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Sort */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name A-Z</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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

            {/* Products */}
            {filteredProducts.length > 0 ? (
              <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                {filteredProducts.map(product => (
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
                              {cart[product.id] && cart[product.id] > 0 ? (
                                <div>
                                  <span className="text-2xl font-bold text-green-600">
                                    ${getDiscountedPrice(product, cart[product.id] || 1).toFixed(2)}
                                  </span>
                                  {getDiscountedPrice(product, cart[product.id] || 1) < parseFloat(product.price) && (
                                    <span className="text-sm line-through text-gray-400 ml-2">
                                      ${product.price}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-2xl font-bold text-green-600">
                                  ${product.price}
                                </span>
                              )}
                              <span className="text-sm text-gray-500 ml-1">
                                / {product.priceUnit}
                              </span>
                            </div>
                            <Badge variant={product.inStock ? "secondary" : "destructive"}>
                              {product.inStock ? "In Stock" : "Out of Stock"}
                            </Badge>
                          </div>

                          {/* Quantity Discounts */}
                          {product.quantityDiscounts && Array.isArray(product.quantityDiscounts) && product.quantityDiscounts.length > 0 ? (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-700 mb-1">Quantity Discounts:</p>
                              <div className="space-y-1">
                                {product.quantityDiscounts.map((discount: any, index: number) => (
                                  <div key={index} className="text-xs text-gray-600">
                                    {discount.minQty}+ units: {(discount.discount * 100).toFixed(0)}% off
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}

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
                                    ${product.price}
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
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
                  <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Complete your order and provide shipping information</DialogDescription>
          </DialogHeader>
          {customer ? (
            <Checkout 
              cart={cart} 
              products={products}
              onOrderComplete={() => {
                setCart({});
                setShowCheckout(false);
              }}
            />
          ) : (
            <div className="p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
                <p className="text-gray-600">Please login or register to complete your order. Your cart will be preserved.</p>
              </div>
              <div className="max-w-md mx-auto">
                <CustomerAuth 
                  open={true}
                  onOpenChange={() => {}}
                  onLoginSuccess={(customerData) => {
                    setCustomer(customerData);
                    // Cart is automatically preserved
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Customer Authentication Modal */}
      <CustomerAuth 
        open={showAuth}
        onOpenChange={setShowAuth}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Live Chat Support */}
      <LiveChat />
    </div>
  );
};

export default Shop;