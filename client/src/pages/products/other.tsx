import { motion } from "framer-motion";
import { ArrowRight, Download, FileText, Package, Beaker, Shield, Star, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function OtherProducts() {
  const products = [
    {
      id: 1,
      name: "Industrial Degreasers",
      category: "Cleaning Agents",
      description: "High-performance industrial degreasers for heavy-duty cleaning applications in manufacturing environments.",
      applications: ["Metal fabrication", "Automotive industry", "Heavy machinery maintenance", "Industrial equipment cleaning"],
      features: ["Biodegradable formula", "Non-toxic", "Fast-acting", "Multi-surface compatible"],
      specifications: {
        "pH Level": "8.5 - 9.2",
        "Density": "0.95 g/ml",
        "Flash Point": ">100°C",
        "Biodegradability": "98% in 28 days"
      },
      certifications: ["ISO 14001", "REACH Compliant", "NSF Certified"],
      packaging: ["1L bottles", "5L containers", "20L drums", "200L barrels"],
      price: "$15-45/L",
      image: "/api/placeholder/400/300"
    },
    {
      id: 2,
      name: "Corrosion Inhibitors",
      category: "Protective Coatings",
      description: "Advanced corrosion inhibitors designed to protect metal surfaces from oxidation and environmental damage.",
      applications: ["Pipeline protection", "Marine equipment", "Storage tanks", "Infrastructure maintenance"],
      features: ["Long-lasting protection", "Temperature resistant", "Water-based formula", "Easy application"],
      specifications: {
        "Active Content": "25-30%",
        "Operating Temperature": "-20°C to +80°C", 
        "Coverage": "8-12 m²/L",
        "Drying Time": "2-4 hours"
      },
      certifications: ["NACE Approved", "ISO 9001", "ASTM Standards"],
      packaging: ["500ml bottles", "2L containers", "10L drums", "50L barrels"],
      price: "$25-65/L",
      image: "/api/placeholder/400/300"
    },
    {
      id: 3,
      name: "Laboratory Reagents",
      category: "Analytical Chemistry",
      description: "High-purity laboratory reagents for analytical testing, research, and quality control applications.",
      applications: ["Chemical analysis", "Research laboratories", "Quality control testing", "Educational institutions"],
      features: ["Analytical grade purity", "Certified quality", "Consistent results", "Long shelf life"],
      specifications: {
        "Purity": "≥99.5%",
        "Water Content": "<0.1%",
        "Heavy Metals": "<10 ppm",
        "Shelf Life": "2-3 years"
      },
      certifications: ["ACS Grade", "ISO/IEC 17025", "GMP Certified"],
      packaging: ["100g bottles", "500g containers", "1kg packages", "5kg drums"],
      price: "$35-120/kg",
      image: "/api/placeholder/400/300"
    },
    {
      id: 4,
      name: "Specialty Solvents",
      category: "Industrial Solvents",
      description: "Premium specialty solvents for specific industrial applications requiring high performance and purity.",
      applications: ["Electronics manufacturing", "Pharmaceutical production", "Precision cleaning", "Chemical synthesis"],
      features: ["Ultra-high purity", "Low residue", "Fast evaporation", "Non-conductive"],
      specifications: {
        "Purity": "≥99.8%",
        "Boiling Point": "78-82°C",
        "Vapor Pressure": "5.95 kPa at 20°C",
        "Resistivity": ">18 MΩ·cm"
      },
      certifications: ["Electronic Grade", "USP Grade", "SEMI Standards"],
      packaging: ["1L bottles", "4L containers", "25L drums", "200L barrels"],
      price: "$45-180/L",
      image: "/api/placeholder/400/300"
    },
    {
      id: 5,
      name: "Concrete Additives",
      category: "Construction Chemicals",
      description: "Specialized concrete additives to enhance performance, durability, and workability of concrete mixtures.",
      applications: ["Commercial construction", "Infrastructure projects", "Precast concrete", "Ready-mix concrete"],
      features: ["Improved workability", "Enhanced strength", "Reduced water content", "Accelerated curing"],
      specifications: {
        "Solid Content": "40-45%",
        "Chloride Content": "<0.1%",
        "Setting Time": "Adjustable 30min-6hrs",
        "Compressive Strength": "+15-25%"
      },
      certifications: ["ASTM C494", "EN 934-2", "BS 5075"],
      packaging: ["20L containers", "200L drums", "1000L IBCs", "Bulk delivery"],
      price: "$8-25/L",
      image: "/api/placeholder/400/300"
    },
    {
      id: 6,
      name: "Textile Processing Chemicals",
      category: "Textile Industry",
      description: "Comprehensive range of chemicals for textile processing, dyeing, and finishing operations.",
      applications: ["Fabric dyeing", "Textile finishing", "Fiber treatment", "Garment processing"],
      features: ["Color fastness", "Eco-friendly options", "Process efficiency", "Quality enhancement"],
      specifications: {
        "pH Range": "6.0-8.0",
        "Concentration": "10-50%",
        "Temperature Stability": "Up to 120°C",
        "Biodegradability": "Readily biodegradable"
      },
      certifications: ["OEKO-TEX", "GOTS Approved", "ZDHC Compliant"],
      packaging: ["25L drums", "125L barrels", "1000L IBCs", "Bulk tanks"],
      price: "$12-40/L",
      image: "/api/placeholder/400/300"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-purple-600 to-blue-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Package className="h-8 w-8" />
              <h1 className="text-4xl md:text-6xl font-bold">
                Other Products
              </h1>
            </div>
            <p className="text-xl md:text-2xl mb-8 text-purple-100">
              Specialized chemical solutions for diverse industrial applications
            </p>
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Beaker className="h-4 w-4 mr-2" />
                Specialty Chemicals
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Shield className="h-4 w-4 mr-2" />
                Quality Assured
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Star className="h-4 w-4 mr-2" />
                Premium Grade
              </Badge>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {products.map((product) => (
              <motion.div
                key={product.id}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50">
                        {product.category}
                      </Badge>
                      <Package className="h-5 w-5 text-purple-600" />
                    </div>
                    <CardTitle className="text-xl group-hover:text-purple-600 transition-colors">
                      {product.name}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Applications */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">Applications</h4>
                      <div className="grid grid-cols-1 gap-1">
                        {product.applications.slice(0, 3).map((app, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <CheckCircle className="h-3 w-3 mr-2 text-green-500 flex-shrink-0" />
                            {app}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Key Features */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">Key Features</h4>
                      <div className="flex flex-wrap gap-1">
                        {product.features.slice(0, 3).map((feature, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Specifications Preview */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">Specifications</h4>
                      <div className="space-y-1">
                        {Object.entries(product.specifications).slice(0, 2).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="border-t pt-4">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 hover:bg-purple-50 hover:border-purple-200"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Datasheet
                        </Button>
                        <Link href="/contact">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                          >
                            Inquire
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-white"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Need Custom Chemical Solutions?
            </h2>
            <p className="text-xl mb-8 text-purple-100">
              Our expert team can develop tailored chemical products to meet your specific requirements.
              Contact us to discuss your unique application needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-purple-600 hover:bg-gray-100"
                >
                  Request Quote
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                <Download className="h-5 w-5 mr-2" />
                Product Catalog
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default OtherProducts;