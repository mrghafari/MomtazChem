import { CheckCircle, ArrowRight, Beaker, Gauge, Leaf, Shield, Download, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import type { ShowcaseProduct } from "@shared/showcase-schema";

const FuelAdditives = () => {
  // Fetch fuel additives products from database
  const { data: products, isLoading } = useQuery<ShowcaseProduct[]>({
    queryKey: ["/api/products", "fuel-additives"],
    queryFn: () => fetch("/api/products?category=fuel-additives").then(res => res.json()),
  });

  const benefits = [
    {
      icon: <Gauge className="h-8 w-8 text-white" />,
      title: "Enhanced Performance",
      description: "Improve fuel efficiency and engine performance across all operating conditions"
    },
    {
      icon: <Shield className="h-8 w-8 text-white" />,
      title: "Engine Protection",
      description: "Reduce wear and extend engine life through advanced protection formulas"
    },
    {
      icon: <Leaf className="h-8 w-8 text-white" />,
      title: "Emission Reduction",
      description: "Lower harmful emissions and support environmental compliance"
    },
    {
      icon: <Beaker className="h-8 w-8 text-white" />,
      title: "Advanced Chemistry",
      description: "Cutting-edge formulations backed by extensive research and testing"
    }
  ];

  const specifications = [
    { property: "Flash Point", value: "> 60°C", standard: "ASTM D93" },
    { property: "Density", value: "0.85-0.95 g/cm³", standard: "ASTM D4052" },
    { property: "Viscosity", value: "2-10 cSt @ 40°C", standard: "ASTM D445" },
    { property: "Pour Point", value: "< -30°C", standard: "ASTM D97" }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section 
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(21, 101, 192, 0.8), rgba(21, 101, 192, 0.6)), url('https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Fuel Additives</h1>
            <p className="text-xl mb-8 leading-relaxed">
              High-performance fuel additives designed to enhance combustion efficiency, reduce emissions, and extend engine life across automotive and industrial applications.
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Fuel Additives?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Advanced chemical solutions that deliver measurable improvements in fuel performance and efficiency.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-blue rounded-lg flex items-center justify-center mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Fuel Additive Portfolio</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive range of specialized additives for every fuel application.
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
                <Card key={product.id} className="bg-white hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-2xl font-bold text-gray-900">{product.name}</h3>
                      {product.inventoryStatus && (
                        <Badge 
                          variant="outline" 
                          className={`
                            ${product.inventoryStatus === 'in_stock' ? 'border-green-200 text-green-800 bg-green-50' : ''}
                            ${product.inventoryStatus === 'low_stock' ? 'border-yellow-200 text-yellow-800 bg-yellow-50' : ''}
                            ${product.inventoryStatus === 'out_of_stock' ? 'border-red-200 text-red-800 bg-red-50' : ''}
                          `}
                        >
                          {product.inventoryStatus === 'in_stock' ? 'In Stock' : 
                           product.inventoryStatus === 'low_stock' ? 'Low Stock' : 
                           'Out of Stock'}
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-6">{product.description}</p>
                    
                    {product.priceRange && (
                      <div className="mb-6">
                        <span className="text-lg font-semibold text-blue-600">{product.priceRange}</span>
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
                          className="inline-flex"
                        >
                          <Badge variant="outline" className="text-xs hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors">
                            <Download className="w-3 h-3 mr-1" />
                            Download Catalog
                          </Badge>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white">
              <CardContent className="p-8 text-center">
                <Beaker className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Fuel Additives Available</h3>
                <p className="text-gray-500">No fuel additive products have been added yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Technical Specifications */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Technical Specifications</h2>
              <p className="text-lg text-gray-600 mb-8">
                Our fuel additives meet or exceed international standards for quality and performance.
              </p>
              <div className="bg-gray-50 rounded-lg p-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-semibold">Property</th>
                      <th className="text-left py-2 font-semibold">Value</th>
                      <th className="text-left py-2 font-semibold">Standard</th>
                    </tr>
                  </thead>
                  <tbody>
                    {specifications.map((spec, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 text-gray-700">{spec.property}</td>
                        <td className="py-2 text-gray-700">{spec.value}</td>
                        <td className="py-2 text-gray-500 text-sm">{spec.standard}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1581092162384-8987c1d64718?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Fuel testing laboratory"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Applications & Industries */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Industries We Serve</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our fuel additives are trusted by leading companies across multiple industries.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <i className="fas fa-plane text-primary text-3xl mb-4"></i>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Aviation</h3>
              <p className="text-gray-600">Anti-icing additives and performance enhancers for commercial and military aviation fuel.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <i className="fas fa-car text-primary text-3xl mb-4"></i>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Automotive</h3>
              <p className="text-gray-600">Octane boosters and emission reducers for gasoline and diesel fuel applications.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <i className="fas fa-ship text-primary text-3xl mb-4"></i>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Marine</h3>
              <p className="text-gray-600">Biocides and stabilizers for marine fuel systems and offshore applications.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Enhance Your Fuel Performance?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Contact our technical team to discuss your specific fuel additive requirements and find the perfect solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-primary-blue hover:bg-primary-blue-dark">
                Contact Technical Team
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-900">
              Download Product Catalog
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FuelAdditives;
