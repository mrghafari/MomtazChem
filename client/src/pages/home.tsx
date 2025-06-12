import HeroSection from "@/components/ui/hero-section";
import StatsSection from "@/components/ui/stats-section";
import ProductCard from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Award, Leaf, FlaskRound, Truck, Headphones, FuelIcon as Fuel, Droplets, PaintBucket, Wheat, Download, FileText, Image } from "lucide-react";
import type { ShowcaseProduct } from "@shared/showcase-schema";

const Home = () => {
  // Fetch all products from database
  const { data: allProducts, isLoading } = useQuery<ShowcaseProduct[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetch("/api/products").then(res => res.json()),
  });

  const categoryInfo = [
    {
      title: "Fuel Additives",
      description: "High-performance fuel additives designed to enhance combustion efficiency, reduce emissions, and extend engine life across automotive and industrial applications.",
      href: "/products/fuel-additives",
      icon: <Fuel className="text-white text-xl" />,
      iconBg: "bg-primary-blue",
      category: "fuel-additives",
      imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    {
      title: "Water Treatment",
      description: "Comprehensive water treatment solutions for municipal, industrial, and residential applications, ensuring clean and safe water for all uses.",
      href: "/products/water-treatment",
      icon: <Droplets className="text-white text-xl" />,
      iconBg: "bg-primary-green",
      category: "water-treatment",
      imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    {
      title: "Paint & Thinner",
      description: "Premium paint formulations and thinners for automotive, architectural, and industrial applications with superior durability and finish quality.",
      href: "/products/paint-thinner",
      icon: <PaintBucket className="text-white text-xl" />,
      iconBg: "bg-accent-orange",
      category: "paint-thinner",
      imageUrl: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
    {
      title: "Agricultural Fertilizers",
      description: "Advanced fertilizer solutions designed to maximize crop yields while promoting sustainable farming practices and soil health enhancement.",
      href: "/products/agricultural-fertilizers",
      icon: <Wheat className="text-white text-xl" />,
      iconBg: "bg-primary-green",
      category: "agricultural-fertilizers",
      imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80",
    },
  ];

  // Group products by category
  const productsByCategory = allProducts?.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {} as Record<string, ShowcaseProduct[]>) || {};

  const services = [
    {
      title: "R&D Services",
      description: "Custom formulation development and product optimization to meet specific industry requirements.",
      features: ["Custom Formulations", "Product Testing", "Performance Analysis"],
      icon: <FlaskRound className="text-white text-2xl" />,
      iconBg: "bg-primary-blue",
    },
    {
      title: "Global Distribution",
      description: "Reliable supply chain and logistics network ensuring timely delivery worldwide.",
      features: ["40+ Countries", "Express Shipping", "Bulk Orders"],
      icon: <Truck className="text-white text-2xl" />,
      iconBg: "bg-primary-green",
    },
    {
      title: "Technical Support",
      description: "Expert technical assistance and consultation for optimal product application and performance.",
      features: ["24/7 Support", "Application Training", "Documentation"],
      icon: <Headphones className="text-white text-2xl" />,
      iconBg: "bg-accent-orange",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <HeroSection />

      {/* Stats Section */}
      <StatsSection />

      {/* Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Product Portfolio</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive chemical solutions across four key industries, engineered for performance and reliability.
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
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {categoryInfo.map((category) => {
                const categoryProducts = productsByCategory[category.category] || [];
                const productCount = categoryProducts.length;
                
                return (
                  <Card key={category.category} className="group bg-white hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-blue-200">
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden rounded-t-lg">
                        {/* Use first product image if available, otherwise fallback to category image */}
                        <img
                          src={categoryProducts.length > 0 && categoryProducts[0].imageUrl ? 
                            categoryProducts[0].imageUrl : category.imageUrl}
                          alt={category.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                        <div className={`absolute top-4 left-4 w-12 h-12 ${category.iconBg} rounded-lg flex items-center justify-center`}>
                          {category.icon}
                        </div>
                        <Badge className="absolute top-4 right-4 bg-white/90 text-gray-800 border-0">
                          {productCount} Products
                        </Badge>
                      </div>
                      
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                          {category.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {category.description}
                        </p>
                        
                        {categoryProducts.length > 0 && (
                          <div className="mb-6">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Available Products:</h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {categoryProducts.slice(0, 3).map((product) => (
                                <div key={product.id} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700 truncate flex-1">{product.name}</span>
                                  <div className="flex items-center gap-1 ml-2">
                                    {product.inventoryStatus === 'in_stock' && (
                                      <Badge variant="outline" className="text-xs border-green-200 text-green-800 bg-green-50">
                                        In Stock
                                      </Badge>
                                    )}
                                    {product.pdfCatalogUrl && (
                                      <a 
                                        href={product.pdfCatalogUrl} 
                                        download={`${product.name}_catalog.pdf`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <FileText className="w-3 h-3" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                              {categoryProducts.length > 3 && (
                                <div className="text-xs text-gray-500 pt-1">
                                  +{categoryProducts.length - 3} more products
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <Link href={category.href}>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            View All {category.title}
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">About Momtazchem</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                With over 25 years of excellence in chemical manufacturing, Momtazchem has established itself as a trusted partner for industries worldwide. Our commitment to innovation, quality, and sustainability drives everything we do.
              </p>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                From our state-of-the-art facilities, we develop and produce high-quality chemical solutions that meet the evolving needs of fuel, water treatment, paint, and agricultural industries.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Award className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Quality Excellence</h4>
                    <p className="text-gray-600 text-sm">ISO certified processes ensuring consistent high-quality products.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-12 h-12 bg-primary-green rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Leaf className="text-white h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Sustainability</h4>
                    <p className="text-gray-600 text-sm">Environmentally responsible manufacturing and products.</p>
                  </div>
                </div>
              </div>

              <Link href="/about">
                <Button className="bg-primary-blue hover:bg-primary-blue-dark text-white">
                  Learn More About Us
                </Button>
              </Link>
            </div>

            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1582719471384-894fbb16e074?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
                alt="Chemical research laboratory"
                className="rounded-2xl shadow-lg w-full h-auto"
              />
              
              {/* Floating stats card */}
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                <div className="text-3xl font-bold primary-blue mb-2">99.8%</div>
                <div className="text-gray-600 font-medium">Customer Satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Services & Capabilities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive support from research and development to delivery and technical assistance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow duration-300">
                <div className={`w-16 h-16 ${service.iconBg} rounded-lg flex items-center justify-center mb-6 mx-auto`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{service.title}</h3>
                <p className="text-gray-600 text-center mb-6">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-600">
                      <div className="w-2 h-2 bg-secondary rounded-full mr-2"></div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
