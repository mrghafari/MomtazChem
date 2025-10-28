import { CheckCircle, ArrowRight, PaintBucket, Palette, Shield, Zap, Download, Image, Star, Package, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ProductInquiryForm } from "@/components/ui/product-inquiry-form";
import { RandomCategoryProducts } from "@/components/RandomCategoryProducts";

import type { ShowcaseProduct } from "@shared/showcase-schema";

const PaintThinnerPage = () => {
  const { data: products, isLoading } = useQuery<ShowcaseProduct[]>({
    queryKey: ["/api/products", "paint-thinner"],
    queryFn: () => fetch("/api/products?category=paint-thinner").then(res => res.json()),
  });


  const benefits = [
    {
      icon: <Palette className="h-8 w-8 text-white" />,
      title: "Superior Quality",
      description: "Premium formulations for exceptional finish quality and durability",
      bgColor: "bg-orange-500"
    },
    {
      icon: <Shield className="h-8 w-8 text-white" />,
      title: "Industrial Grade", 
      description: "Heavy-duty solutions for demanding industrial applications",
      bgColor: "bg-red-500"
    },
    {
      icon: <Zap className="h-8 w-8 text-white" />,
      title: "Fast Drying",
      description: "Quick-drying formulas to increase productivity and efficiency",
      bgColor: "bg-yellow-500"
    }
  ];

  const applications = [
    "Automotive Refinishing",
    "Industrial Coatings", 
    "Architectural Painting",
    "Marine Applications",
    "Aerospace Coatings",
    "Decorative Finishes"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-600 via-red-600 to-pink-700 text-white py-20">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
              <PaintBucket className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-5xl font-bold mb-6">Paint & Solvents</h1>
            <p className="text-xl text-orange-100 max-w-3xl mx-auto mb-8">
              Premium paint formulations, specialty solvents, and thinners for automotive, architectural, and industrial applications with superior durability and finish quality.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                Industrial Grade
              </Badge>
              <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                Fast Drying
              </Badge>
              <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                Superior Finish
              </Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Paint & Thinner Products?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our premium formulations deliver exceptional performance across all applications
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

      {/* Applications Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Applications</h2>
            <p className="text-gray-600">Our paint and thinner solutions serve diverse industries</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            {applications.map((application, index) => (
              <div key={index} className="bg-white rounded-lg p-4 text-center border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all duration-200">
                <span className="text-gray-800 font-medium">{application}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Random Products from Shop */}
      <RandomCategoryProducts 
        categoryDisplayName="Paint & Solvents" 
        category="paint-thinner" 
      />

      {/* Products Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Paint & Thinner Products</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our comprehensive range of premium paint and thinner solutions
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
                <Card key={product.id} className="group bg-white hover:shadow-xl transition-all duration-300 border border-gray-200 hover:border-orange-300 overflow-hidden">
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
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          product.stockQuantity && product.stockQuantity > 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-gray-500 capitalize">
                          {product.stockQuantity && product.stockQuantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>
                    
                    {product.description && (
                      <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>
                    )}
                    
                    {product.features && Array.isArray(product.features) && product.features.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                        <ul className="space-y-2">
                          {(product.features as string[]).map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center text-gray-700">
                              <CheckCircle className="h-4 w-4 text-secondary mr-3 flex-shrink-0" />
                              {String(feature)}
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
                              {String(app)}
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
                          <Badge variant="outline" className="text-xs hover:bg-orange-50 cursor-pointer">
                            <Download className="w-3 h-3 mr-1" />
                            Download PDF
                          </Badge>
                        </a>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <ProductInquiryForm 
                        product={product}
                        triggerText="Get Quote"
                        triggerVariant="default"
                        triggerSize="sm"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && (!products || products.length === 0) && (
            <div className="text-center py-12">
              <PaintBucket className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Paint & Thinner Products Yet</h3>
              <p className="text-gray-500 mb-6">Our paint and thinner product catalog is being updated. Please check back soon.</p>
              <Link href="/contact">
                <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                  Contact Us for Information
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>



      {/* Random Products from Shop */}
      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Enhance Your Projects?</h2>
          <p className="text-xl text-orange-100 mb-8">
            Contact our paint and coating specialists for personalized recommendations and technical support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-gray-100">
                Get Expert Consultation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-orange-600 bg-[#3c445c]">
                View All Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Live Chat Support */}

    </div>
  );
};

export default PaintThinnerPage;
