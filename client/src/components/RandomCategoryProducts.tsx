import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ShoppingCart, ArrowRight } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  imageUrl?: string;
  category: string;
}

interface RandomCategoryProductsProps {
  category: string;
  title?: string;
}

export function RandomCategoryProducts({ category, title }: RandomCategoryProductsProps) {
  const [, navigate] = useLocation();
  
  const { data: productsResponse, isLoading, error } = useQuery({
    queryKey: ['/api/products/random', category],
    queryFn: async () => {
      const response = await fetch(`/api/products/random/${category}?limit=2`);
      if (!response.ok) {
        throw new Error('Failed to fetch random products');
      }
      return response.json();
    },
    enabled: !!category,
    refetchInterval: 5 * 60 * 1000 // Refresh every 5 minutes for new random products
  });

  const products = productsResponse?.data || [];

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-blue-50 to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i} className="bg-white animate-pulse">
                <div className="aspect-video bg-gray-200"></div>
                <CardContent className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !products || products.length === 0) {
    return null; // Don't show anything if no products available
  }

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {title || `محصولات پیشنهادی از دسته ${category}`}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            نمونه‌ای از محصولات موجود در فروشگاه ما - برای مشاهده کامل محصولات و قیمت‌ها کلیک کنید
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {Array.isArray(products) && products.slice(0, 2).map((product) => (
            <Card 
              key={product.id} 
              className="bg-white hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
              onClick={() => navigate('/shop')}
            >
              {product.imageUrl && (
                <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-4 right-4">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      موجود در فروشگاه
                    </div>
                  </div>
                </div>
              )}
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {product.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    کتگوری: <span className="font-medium">{product.category}</span>
                  </div>
                  <div className="flex items-center text-green-600 font-medium">
                    مشاهده در فروشگاه
                    <ArrowRight className="h-4 w-4 mr-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Button 
            size="lg"
            onClick={() => navigate('/shop')}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold"
          >
            <ShoppingCart className="h-5 w-5 ml-2" />
            مشاهده تمام محصولات فروشگاه
          </Button>
        </div>
      </div>
    </section>
  );
}