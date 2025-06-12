import { CheckCircle, Palette, Shield, Sparkles, Brush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

const PaintThinner = () => {
  const products = [
    {
      name: "Industrial Coatings",
      description: "High-performance coatings for demanding industrial environments",
      features: ["Superior durability and corrosion resistance", "Wide temperature range compatibility", "Chemical and abrasion resistant"],
      applications: ["Manufacturing equipment", "Storage tanks", "Pipeline systems"]
    },
    {
      name: "Automotive Paints",
      description: "Premium automotive paint systems for professional results",
      features: ["Excellent color retention", "UV resistance", "Easy application and finish"],
      applications: ["Vehicle refinishing", "Original equipment", "Custom automotive"]
    },
    {
      name: "Specialty Thinners",
      description: "Precision thinners for optimal paint application and performance",
      features: ["Controlled evaporation rate", "Excellent solvent power", "Low environmental impact"],
      applications: ["Paint thinning", "Equipment cleaning", "Surface preparation"]
    },
    {
      name: "Protective Coatings",
      description: "Advanced protective coatings for harsh environments",
      features: ["Marine-grade protection", "Fire-resistant formulations", "Anti-graffiti properties"],
      applications: ["Marine structures", "Industrial facilities", "Public infrastructure"]
    }
  ];

  const benefits = [
    {
      icon: <Palette className="h-8 w-8 text-white" />,
      title: "Superior Finish",
      description: "Achieve professional-grade finishes with excellent color and gloss retention"
    },
    {
      icon: <Shield className="h-8 w-8 text-white" />,
      title: "Long-lasting Protection",
      description: "Durable formulations that protect surfaces for years"
    },
    {
      icon: <Sparkles className="h-8 w-8 text-white" />,
      title: "Easy Application",
      description: "User-friendly products that ensure consistent, professional results"
    },
    {
      icon: <Brush className="h-8 w-8 text-white" />,
      title: "Versatile Solutions",
      description: "Complete range of products for every painting and coating need"
    }
  ];

  const colorChart = [
    { name: "Classic White", code: "#FFFFFF", description: "Pure white for clean, modern finishes" },
    { name: "Deep Blue", code: "#1565C0", description: "Professional blue for industrial applications" },
    { name: "Forest Green", code: "#2E7D32", description: "Rich green for outdoor durability" },
    { name: "Safety Orange", code: "#FF6F00", description: "High-visibility orange for safety marking" },
    { name: "Charcoal Gray", code: "#424242", description: "Sophisticated gray for modern aesthetics" },
    { name: "Crimson Red", code: "#C62828", description: "Bold red for attention-grabbing applications" }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section 
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 111, 0, 0.8), rgba(255, 111, 0, 0.6)), url('https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Paint & Thinner Products</h1>
            <p className="text-xl mb-8 leading-relaxed">
              Premium paint formulations and thinners for automotive, architectural, and industrial applications with superior durability and finish quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue-dark">
                  Request Color Samples
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border h-11 rounded-md px-8 border-white text-white hover:bg-white hover:text-primary bg-[#2094f3]">
                Download Color Chart
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Paint Products?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional-grade formulations designed for superior performance and long-lasting results.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-accent-orange rounded-lg flex items-center justify-center mx-auto mb-4">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Paint & Coating Solutions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive range of paints and coatings for every application.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {products.map((product, index) => (
              <Card key={index} className="bg-white hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{product.name}</h3>
                  <p className="text-gray-600 mb-6">{product.description}</p>
                  
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                    <ul className="space-y-2">
                      {product.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-gray-700">
                          <CheckCircle className="h-4 w-4 text-secondary mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Applications:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.applications.map((app, appIndex) => (
                        <span key={appIndex} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                          {app}
                        </span>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Color Chart Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Popular Color Options</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our extensive color palette with hundreds of standard and custom colors available.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {colorChart.map((color, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div 
                  className="h-24"
                  style={{ backgroundColor: color.code }}
                />
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-2">{color.name}</h3>
                  <p className="text-sm text-gray-500 mb-2">{color.code}</p>
                  <p className="text-gray-600 text-sm">{color.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button className="bg-accent-orange hover:bg-accent-orange-dark">
              View Full Color Catalog
            </Button>
          </div>
        </div>
      </section>

      {/* Technical Information */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Technical Excellence</h2>
              <p className="text-lg text-gray-600 mb-6">
                Our paint and coating products are formulated using advanced chemistry and rigorous quality control processes.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-secondary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">VOC Compliant</h4>
                    <p className="text-gray-600 text-sm">Low volatile organic compound formulations for environmental safety</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-secondary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">UV Resistant</h4>
                    <p className="text-gray-600 text-sm">Advanced UV protection prevents fading and degradation</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-secondary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Fast Drying</h4>
                    <p className="text-gray-600 text-sm">Quick cure times for improved productivity</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-secondary mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900">Temperature Stable</h4>
                    <p className="text-gray-600 text-sm">Performs reliably across wide temperature ranges</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Paint manufacturing facility"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Applications Gallery */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Gallery</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See our products in action across various industries and applications.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative group">
              <img
                src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Industrial coating application"
                className="rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold mb-2">Industrial Coatings</h3>
                  <p className="text-sm">Heavy-duty protection for industrial equipment</p>
                </div>
              </div>
            </div>
            <div className="relative group">
              <img
                src="https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Paint formulation laboratory"
                className="rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold mb-2">Automotive Finishes</h3>
                  <p className="text-sm">Professional automotive painting solutions</p>
                </div>
              </div>
            </div>
            <div className="relative group">
              <img
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Architectural coating"
                className="rounded-lg shadow-lg group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="text-white text-center">
                  <h3 className="text-xl font-bold mb-2">Architectural Coatings</h3>
                  <p className="text-sm">Beautiful and durable architectural finishes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Project?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Contact our paint specialists to find the perfect coating solution for your specific application.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-accent-orange hover:bg-accent-orange-dark">
                Consult Paint Specialists
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border h-11 rounded-md px-8 border-white text-white hover:bg-white hover:text-gray-900 bg-[#ffa100]">
              Request Color Samples
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PaintThinner;
