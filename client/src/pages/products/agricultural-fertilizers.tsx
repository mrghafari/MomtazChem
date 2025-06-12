import { CheckCircle, ArrowRight, Wheat, Sprout, TreePine, Leaf, Download, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { ShowcaseProduct } from "@shared/showcase-schema";

const AgriculturalFertilizersPage = () => {
  const { data: products, isLoading } = useQuery<ShowcaseProduct[]>({
    queryKey: ["/api/products", "agricultural-fertilizers"],
    queryFn: () => fetch("/api/products?category=agricultural-fertilizers").then(res => res.json()),
  });

  const benefits = [
    {
      icon: <Sprout className="h-8 w-8 text-white" />,
      title: "Enhanced Growth",
      description: "Optimized nutrient formulations for maximum crop yield and quality",
      bgColor: "bg-green-500"
    },
    {
      icon: <Leaf className="h-8 w-8 text-white" />,
      title: "Soil Health", 
      description: "Sustainable solutions that improve and maintain soil fertility",
      bgColor: "bg-emerald-600"
    },
    {
      icon: <TreePine className="h-8 w-8 text-white" />,
      title: "Eco-Friendly",
      description: "Environmentally responsible formulations for sustainable agriculture",
      bgColor: "bg-green-700"
    }
  ];

  const cropTypes = [
    "Cereals & Grains",
    "Vegetables & Legumes", 
    "Fruit Trees",
    "Industrial Crops",
    "Pasture & Forage",
    "Specialty Crops"
  ];

  const nutrients = [
    { name: "Nitrogen (N)", description: "Essential for protein synthesis and chlorophyll production", color: "bg-blue-100 text-blue-800" },
    { name: "Phosphorus (P)", description: "Critical for root development and energy transfer", color: "bg-purple-100 text-purple-800" },
    { name: "Potassium (K)", description: "Improves disease resistance and water regulation", color: "bg-orange-100 text-orange-800" },
    { name: "Micronutrients", description: "Iron, zinc, manganese for optimal plant health", color: "bg-green-100 text-green-800" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <Wheat className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Agricultural Fertilizers</h1>
            <p className="text-xl text-green-100 max-w-3xl mx-auto mb-8">
              Advanced fertilizer solutions designed to maximize crop yields while promoting sustainable farming practices and soil health enhancement.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                High Yield
              </Badge>
              <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                Soil Health
              </Badge>
              <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                Sustainable
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Agricultural Fertilizers?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our scientifically formulated fertilizers deliver superior results for modern agriculture
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${benefit.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nutrients Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Essential Nutrients</h2>
            <p className="text-gray-600">Our fertilizers provide balanced nutrition for optimal plant growth</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {nutrients.map((nutrient, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-start">
                  <Badge className={`${nutrient.color} mr-4 mt-1`}>
                    {nutrient.name}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-gray-700">{nutrient.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crop Types Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Suitable for All Crop Types</h2>
            <p className="text-gray-600">Our fertilizers are formulated for diverse agricultural applications</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {cropTypes.map((crop, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200">
                <span className="text-gray-800 font-medium">{crop}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Agricultural Fertilizer Products</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our comprehensive range of fertilizer solutions for modern agriculture
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-white">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products?.map((product) => (
                <Card key={product.id} className="group bg-white hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-green-300 overflow-hidden">
                  {product.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden bg-gray-100">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          product.inventoryStatus === 'in_stock' ? 'bg-green-500' :
                          product.inventoryStatus === 'low_stock' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-gray-500 capitalize">
                          {product.inventoryStatus?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    {product.description && (
                      <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>
                    )}

                    {product.priceRange && (
                      <div className="mb-6">
                        <span className="text-lg font-semibold text-green-600">{product.priceRange}</span>
                      </div>
                    )}
                    
                    {product.features && Array.isArray(product.features) && product.features.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                        <ul className="space-y-2">
                          {(product.features as string[]).map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center text-gray-700">
                              <CheckCircle className="h-4 w-4 text-secondary mr-3 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {product.applications && Array.isArray(product.applications) && product.applications.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Applications:</h4>
                        <div className="flex flex-wrap gap-2">
                          {(product.applications as string[]).map((app, appIndex) => (
                            <span key={appIndex} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                              {app}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-6">
                      {product.imageUrl && (
                        <Badge variant="outline" className="text-xs">
                          <Image className="w-3 h-3 mr-1" />
                          Image Available
                        </Badge>
                      )}
                      {product.pdfCatalogUrl && (
                        <a 
                          href={product.pdfCatalogUrl} 
                          download={`${product.name}_catalog.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Badge variant="outline" className="text-xs hover:bg-green-50 cursor-pointer">
                            <Download className="w-3 h-3 mr-1" />
                            Download PDF
                          </Badge>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && (!products || products.length === 0) && (
            <div className="text-center py-12">
              <Wheat className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Agricultural Fertilizer Products Yet</h3>
              <p className="text-gray-500 mb-6">Our agricultural fertilizer catalog is being updated. Please check back soon.</p>
              <Link href="/contact">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Contact Us for Information
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Boost Your Harvest?</h2>
          <p className="text-xl text-green-100 mb-8">
            Contact our agricultural specialists for customized fertilizer recommendations and expert farming advice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                Get Agricultural Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600 bg-[#836fe5]">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AgriculturalFertilizersPage;