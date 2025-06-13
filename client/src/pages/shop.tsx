import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Plus, Minus, Filter, Search, Grid, List, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { ShopProduct, ShopCategory } from "@shared/shop-schema";

const Shop = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cart, setCart] = useState<{[key: number]: number}>({});

  // Fetch shop products
  const { data: products = [], isLoading: productsLoading } = useQuery<ShopProduct[]>({
    queryKey: ["/api/shop/products"],
  });

  // Fetch shop categories
  const { data: categories = [] } = useQuery<ShopCategory[]>({
    queryKey: ["/api/shop/categories"],
  });

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
      return total + (product ? parseFloat(product.price) * qty : 0);
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
            
            {/* Cart Summary */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Button variant="outline" className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({getTotalItems()})
                  {getTotalItems() > 0 && (
                    <Badge variant="secondary">
                      ${getTotalPrice().toFixed(2)}
                    </Badge>
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

                          {product.inStock && (
                            <div className="flex items-center gap-2">
                              {cart[product.id] ? (
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
                                  {cart[product.id] ? (
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
    </div>
  );
};

export default Shop;