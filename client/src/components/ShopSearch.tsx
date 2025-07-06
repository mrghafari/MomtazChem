import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Filter, X, ChevronDown, Star, ShoppingCart, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ShopProduct {
  id: number;
  name: string;
  category: string;
  description: string;
  shortDescription?: string;
  price: string;
  compareAtPrice?: string;
  priceUnit: string;
  inStock: boolean;
  stockQuantity: number;
  sku: string;
  imageUrls?: string[];
  thumbnailUrl?: string;
  tags?: string[];
  isFeatured: boolean;
  specifications?: any;
  features?: any;
  applications?: any;
  quantityDiscounts?: Array<{
    minQty: number;
    discount: number;
  }>;
}

interface SearchFilters {
  category?: string;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  tags?: string[];
  sortBy?: 'name' | 'price' | 'created' | 'relevance';
  sortOrder?: 'asc' | 'desc';
}

interface SearchResults {
  products: ShopProduct[];
  total: number;
  filters: {
    categories: { name: string; count: number }[];
    priceRange: { min: number; max: number };
    availableTags: string[];
  };
}

export default function ShopSearch() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'relevance',
    sortOrder: 'desc'
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const itemsPerPage = 12;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Search products query
  const { data: searchResults, isLoading, error } = useQuery<{
    success: boolean;
    data: SearchResults;
    query: any;
  }>({
    queryKey: ['shopSearch', debouncedQuery, filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedQuery,
        limit: itemsPerPage.toString(),
        offset: (currentPage * itemsPerPage).toString(),
        sortBy: filters.sortBy || 'relevance',
        sortOrder: filters.sortOrder || 'desc'
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

  // Update price range when search results change
  useEffect(() => {
    if (searchResults?.data?.filters?.priceRange) {
      const { min, max } = searchResults.data.filters.priceRange;
      if (min !== priceRange[0] || max !== priceRange[1]) {
        setPriceRange([min, max]);
        if (!filters.priceMin && !filters.priceMax) {
          setFilters(prev => ({ ...prev, priceMin: min, priceMax: max }));
        }
      }
    }
  }, [searchResults?.data?.filters?.priceRange]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
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
    handleFilterChange('tags', newTags.length ? newTags : undefined);
  };

  const clearFilters = () => {
    setFilters({ sortBy: 'relevance', sortOrder: 'desc' });
    setCurrentPage(0);
    if (searchResults?.data?.filters?.priceRange) {
      const { min, max } = searchResults.data.filters.priceRange;
      setPriceRange([min, max]);
    }
  };

  const formatPrice = (price: string, unit: string) => {
    return `$${parseFloat(price).toLocaleString()} / ${unit}`;
  };

  const products = searchResults?.data?.products || [];
  const totalPages = Math.ceil((searchResults?.data?.total || 0) / itemsPerPage);
  const availableFilters = searchResults?.data?.filters;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Advanced Product Search</h1>
        <p className="text-gray-600 mb-4">Search through our comprehensive chemical product catalog with advanced filters</p>
        
        {/* Search Bar */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search products, categories, specifications, SKU, features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-lg py-3"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
            {Object.keys(filters).length > 2 && (
              <Badge variant="secondary" className="ml-1">
                {Object.keys(filters).length - 2}
              </Badge>
            )}
          </Button>
        </div>

        {/* Active Filters */}
        {(filters.category || filters.tags?.length || filters.inStock !== undefined) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.category && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Category: {filters.category}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleFilterChange('category', undefined)}
                />
              </Badge>
            )}
            {filters.tags?.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleTagToggle(tag)}
                />
              </Badge>
            ))}
            {filters.inStock !== undefined && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.inStock ? 'In Stock' : 'All Stock'}
                <X 
                  className="w-3 h-3 cursor-pointer" 
                  onClick={() => handleFilterChange('inStock', undefined)}
                />
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="w-80">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Filters
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Sort */}
                <div>
                  <Label className="text-sm font-medium">Sort by</Label>
                  <div className="flex gap-2 mt-2">
                    <Select 
                      value={filters.sortBy || 'relevance'} 
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
                      value={filters.sortOrder || 'desc'} 
                      onValueChange={(value) => handleFilterChange('sortOrder', value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">A-Z</SelectItem>
                        <SelectItem value="desc">Z-A</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Categories */}
                {availableFilters?.categories && availableFilters.categories.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Categories</Label>
                    <div className="mt-2 space-y-2">
                      {availableFilters.categories.map(cat => (
                        <div key={cat.name} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cat-${cat.name}`}
                            checked={filters.category === cat.name}
                            onCheckedChange={(checked) => 
                              handleFilterChange('category', checked ? cat.name : undefined)
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
                )}

                {/* Price Range */}
                {availableFilters?.priceRange && (
                  <div>
                    <Label className="text-sm font-medium">
                      Price Range: ${priceRange[0]} - ${priceRange[1]}
                    </Label>
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
                )}

                {/* Stock Status */}
                <div>
                  <Label className="text-sm font-medium">Availability</Label>
                  <div className="mt-2 space-y-2">
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
                </div>

                {/* Tags */}
                {availableFilters?.availableTags && availableFilters.availableTags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {availableFilters.availableTags.slice(0, 10).map(tag => (
                        <Badge
                          key={tag}
                          variant={filters.tags?.includes(tag) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleTagToggle(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Results */}
        <div className="flex-1">
          {/* Results Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-600">
              {isLoading ? (
                'Searching...'
              ) : (
                `${searchResults?.data?.total || 0} products found`
              )}
              {debouncedQuery && ` for "${debouncedQuery}"`}
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">Error searching products. Please try again.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No products found matching your criteria.</p>
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search terms or clearing filters</p>
              </div>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {products.map((product) => (
                  <Card key={product.id} className="group hover:shadow-lg transition-shadow">
                    <div className="relative">
                      {product.thumbnailUrl ? (
                        <img
                          src={product.thumbnailUrl}
                          alt={product.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded-t-lg flex items-center justify-center">
                          <div className="text-gray-400">No image</div>
                        </div>
                      )}
                      {product.isFeatured && (
                        <Badge className="absolute top-2 left-2">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      {!product.inStock && (
                        <Badge variant="destructive" className="absolute top-2 right-2">
                          Out of Stock
                        </Badge>
                      )}
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">{product.category}</p>
                      {product.shortDescription && (
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                          {product.shortDescription}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-bold text-lg">
                            {formatPrice(product.price, product.priceUnit)}
                          </div>
                          {product.compareAtPrice && (
                            <div className="text-xs text-gray-500 line-through">
                              ${parseFloat(product.compareAtPrice).toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          SKU: {product.sku}
                        </div>
                      </div>

                      {/* Discount Information */}
                      {product.quantityDiscounts && product.quantityDiscounts.length > 0 && (
                        <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="text-xs font-semibold text-orange-800 mb-1">
                            💰 پیشنهاد ویژه
                          </div>
                          {product.quantityDiscounts.map((discount, index) => (
                            <div key={index} className="text-xs text-orange-700">
                              خرید {discount.minQty}+ عدد → {Math.round(discount.discount * 100)}% تخفیف
                            </div>
                          ))}
                        </div>
                      )}

                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {product.tags.slice(0, 3).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1" 
                          disabled={!product.inStock}
                          onClick={() => {
                            toast({
                              title: "Added to Cart",
                              description: `${product.name} has been added to your cart.`,
                            });
                          }}
                        >
                          <ShoppingCart className="w-3 h-3 mr-1" />
                          Add to Cart
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const pageNum = Math.max(0, Math.min(currentPage - 2 + i, totalPages - 1));
                      return (
                        <Button
                          key={`page-${pageNum}`}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum + 1}
                        </Button>
                      );
                    })}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}