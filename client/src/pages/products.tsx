import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Package,
  Eye,
  ShoppingCart,
  Filter
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price?: number;
  features?: string[];
  specifications?: any;
  image?: string;
  inStock?: boolean;
}

const Products = () => {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // Extract category from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [location]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetch("/api/products").then(res => res.json()),
  });

  // Filter products based on search term and selected category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || 
                           product.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                           selectedCategory.toLowerCase().includes(product.category.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  // Get unique categories for filter
  const categories = Array.from(new Set(products.map(p => p.category)));

  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      'fuel-additives': 'Fuel Additives',
      'water-treatment': 'Water Treatment',
      'paint-thinner': 'Paint Thinner',
      'agricultural-fertilizers': 'Agricultural Fertilizers',
      'fuel_additives': 'Fuel Additives',
      'water_treatment': 'Water Treatment',
      'paint_thinner': 'Paint Thinner',
      'agricultural_fertilizers': 'Agricultural Fertilizers'
    };
    return categoryMap[category] || category.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const handleProductClick = (product: Product) => {
    // Navigate to specific product category page
    const categorySlug = product.category.toLowerCase().replace(/[_\s]/g, '-');
    window.location.href = `/products/${categorySlug}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Our Products
            {selectedCategory && (
              <span className="text-lg font-normal text-gray-600 ml-4">
                - {getCategoryDisplayName(selectedCategory)}
              </span>
            )}
          </h1>
          <p className="text-gray-600">
            Discover our comprehensive range of high-quality chemical products for various industries.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant={!selectedCategory ? "default" : "outline"}
                onClick={() => setSelectedCategory("")}
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                All Categories
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                >
                  {getCategoryDisplayName(category)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge variant="outline">
                      {getCategoryDisplayName(product.category)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm line-clamp-3">
                    {product.description}
                  </p>

                  {product.features && product.features.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-2">Key Features:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {product.features.slice(0, 3).map((feature, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {product.price && (
                    <div className="pt-2 border-t">
                      <span className="text-lg font-bold text-green-600">
                        ${product.price}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleProductClick(product)}
                      className="flex-1"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = '/contact'}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Request Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
            <p className="text-gray-600">
              {selectedCategory 
                ? `No products found in the "${getCategoryDisplayName(selectedCategory)}" category.`
                : searchTerm 
                  ? `No products match your search for "${searchTerm}".`
                  : "No products available at the moment."
              }
            </p>
            {(selectedCategory || searchTerm) && (
              <Button
                onClick={() => {
                  setSelectedCategory("");
                  setSearchTerm("");
                }}
                className="mt-4"
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Need Custom Solutions?</h2>
          <p className="mb-6 text-blue-100">
            Our team of experts can help you find the perfect chemical solutions for your specific needs.
          </p>
          <Button
            onClick={() => window.location.href = '/contact'}
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-gray-100"
          >
            Contact Our Experts
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Products;