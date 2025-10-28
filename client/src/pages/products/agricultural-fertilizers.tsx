import { CheckCircle, ArrowRight, Wheat, Sprout, TreePine, Leaf, Download, Image, Star, Package, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ProductInquiryForm } from "@/components/ui/product-inquiry-form";
import { RandomCategoryProducts } from "@/components/RandomCategoryProducts";

import type { ShowcaseProduct } from "@shared/showcase-schema";

const AgriculturalFertilizersPage = () => {
  const [, navigate] = useLocation();
  
  const { data: products, isLoading } = useQuery<ShowcaseProduct[]>({
    queryKey: ["/api/products", "agricultural-fertilizers"],
    queryFn: () => fetch("/api/products?category=agricultural-fertilizers").then(res => res.json()),
  });

  const { data: productStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/shop/product-stats'],
    queryFn: () => fetch('/api/shop/product-stats').then(res => res.json()).then(data => data.data),
  });

  const benefits = [
    {
      icon: <Sprout className="h-8 w-8 text-white" />,
      title: "Enhanced Growth",
      description: "Optimized nutrient formulations for maximum crop yield and quality"
    },
    {
      icon: <Leaf className="h-8 w-8 text-white" />,
      title: "Soil Health",
      description: "Sustainable solutions that improve and maintain soil fertility"
    },
    {
      icon: <TreePine className="h-8 w-8 text-white" />,
      title: "Eco-Friendly",
      description: "Environmentally responsible formulations for sustainable agriculture"
    },
    {
      icon: <Wheat className="h-8 w-8 text-white" />,
      title: "Proven Results",
      description: "Field-tested solutions delivering consistent agricultural success"
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section 
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(34, 139, 34, 0.8), rgba(34, 139, 34, 0.6)), url('https://images.unsplash.com/photo-1574943320219-553eb213f72d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Agricultural Fertilizers</h1>
            <p className="text-xl mb-8 leading-relaxed">
              Premium agricultural fertilizers designed to enhance crop productivity and soil health in Iraq's diverse agricultural landscape.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-accent-orange hover:bg-accent-orange-dark">
                  Request Quote
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
                Download Datasheet
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Agricultural Solutions?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced formulations that deliver superior results for modern farming and help improve crop performance in Iraqi climate conditions.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Agricultural Products</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive range of fertilizers for every agricultural application.
            </p>
          </div>
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-white">
                  <CardContent className="p-8">
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-20 bg-gray-200 rounded mb-6"></div>
                      <div className="space-y-2 mb-6">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {products.map((product) => (
                <Card key={product.id} className="bg-white hover:shadow-lg transition-shadow duration-300 overflow-hidden">
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
                      
                      {/* Star Rating Display */}
                      <div className="absolute bottom-2 left-2">
                        <div 
                          className="bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 shadow-sm border border-yellow-200/50 cursor-pointer hover:bg-yellow-50/80 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/product-reviews/${product.id}`);
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {[1,2,3,4,5].map((starNum) => {
                                if (statsLoading) {
                                  return (
                                    <Star
                                      key={starNum}
                                      className="h-3 w-3 text-gray-300 animate-pulse"
                                      fill="currentColor"
                                    />
                                  );
                                }

                                const stats = productStatsData?.[product.id];
                                const avgRating = stats?.averageRating || 0;
                                const isFullStar = starNum <= Math.floor(avgRating);
                                const isHalfStar = starNum === Math.ceil(avgRating) && avgRating % 1 >= 0.5;

                                return (
                                  <Star
                                    key={starNum}
                                    className={`h-3 w-3 ${
                                      isFullStar
                                        ? 'text-yellow-500'
                                        : isHalfStar
                                        ? 'text-yellow-500'
                                        : 'text-gray-300'
                                    }`}
                                    fill={isFullStar || isHalfStar ? 'currentColor' : 'none'}
                                  />
                                );
                              })}
                            </div>
                            <span className="text-xs font-medium text-gray-700">
                              {statsLoading ? '...' : (productStatsData?.[product.id]?.averageRating?.toFixed(1) || '0.0')}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({statsLoading ? '...' : (productStatsData?.[product.id]?.totalReviews || 0)})
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{product.name}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">{product.shortDescription}</p>
                    
                    {product.features && product.features.length > 0 && (
                      <ul className="space-y-3 mb-6">
                        {product.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    
                    <div className="flex gap-3">
                      <Button 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => navigate('/shop')}
                      >
                        View in Shop
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <RandomCategoryProducts 
              categoryDisplayName="کودهای کشاورزی" 
              category="agricultural-fertilizers"
              hideTitle={true}
            />
          )}
        </div>
      </section>

      {/* Applications Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Agricultural Applications</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our fertilizers serve diverse farming needs across Iraq.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-8">
                <Wheat className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Field Crops</h3>
                <p className="text-gray-600">
                  Specialized formulations for wheat, barley, and other grain crops.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-lime-50 to-green-50">
              <CardContent className="p-8">
                <Leaf className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Vegetables</h3>
                <p className="text-gray-600">
                  Nutrient-rich solutions for optimal vegetable production.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-8">
                <TreePine className="h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">Orchards</h3>
                <p className="text-gray-600">
                  Tailored fertilizers for fruit trees and date palms.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Improve Your Harvest?</h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
            Contact our agricultural specialists for personalized fertilizer recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                Contact Agricultural Team
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                Browse Products
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AgriculturalFertilizersPage;
