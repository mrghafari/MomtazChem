import { CheckCircle, Wheat, Leaf, Sprout, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

const AgriculturalFertilizers = () => {
  const products = [
    {
      name: "NPK Complex Fertilizers",
      description: "Balanced nutrition with nitrogen, phosphorus, and potassium for optimal crop growth",
      features: ["Controlled-release technology", "High nutrient efficiency", "Suitable for all crop types"],
      applications: ["Field crops", "Vegetable production", "Fruit orchards"]
    },
    {
      name: "Micronutrient Solutions",
      description: "Essential trace elements for healthy plant development and disease resistance",
      features: ["Chelated micronutrients", "Enhanced bioavailability", "Prevents nutrient deficiencies"],
      applications: ["Greenhouse cultivation", "Hydroponic systems", "Specialty crops"]
    },
    {
      name: "Organic Amendments",
      description: "Natural soil conditioners that improve soil structure and fertility",
      features: ["Improves soil organic matter", "Enhances water retention", "Supports beneficial microorganisms"],
      applications: ["Organic farming", "Soil rehabilitation", "Sustainable agriculture"]
    },
    {
      name: "Specialty Crop Fertilizers",
      description: "Customized fertilizer blends for specific crops and growing conditions",
      features: ["Crop-specific formulations", "Optimized nutrient ratios", "Enhanced yield potential"],
      applications: ["Cash crops", "Export quality produce", "High-value agriculture"]
    }
  ];

  const benefits = [
    {
      icon: <TrendingUp className="h-8 w-8 text-white" />,
      title: "Increased Yields",
      description: "Maximize crop productivity with scientifically formulated nutrition"
    },
    {
      icon: <Leaf className="h-8 w-8 text-white" />,
      title: "Soil Health",
      description: "Improve long-term soil fertility and sustainable farming practices"
    },
    {
      icon: <Sprout className="h-8 w-8 text-white" />,
      title: "Plant Vigor",
      description: "Enhance plant health, root development, and disease resistance"
    },
    {
      icon: <Wheat className="h-8 w-8 text-white" />,
      title: "Quality Crops",
      description: "Improve crop quality, nutritional content, and market value"
    }
  ];

  const cropTypes = [
    {
      title: "Cereal Crops",
      description: "Specialized nutrition for wheat, rice, corn, and other grains",
      image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      features: ["High nitrogen content", "Grain filling support", "Lodging resistance"]
    },
    {
      title: "Vegetables & Fruits",
      description: "Balanced nutrition for high-value horticultural crops",
      image: "https://images.unsplash.com/photo-1560493676-04071c5f467b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      features: ["Enhanced fruit quality", "Extended shelf life", "Improved taste and nutrition"]
    },
    {
      title: "Cash Crops",
      description: "Premium fertilizers for cotton, sugarcane, and other commercial crops",
      image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      features: ["Maximum economic returns", "Export quality standards", "Stress tolerance"]
    }
  ];

  const nutrients = [
    { name: "Nitrogen (N)", percentage: "15-25%", benefit: "Vegetative growth and protein synthesis" },
    { name: "Phosphorus (P₂O₅)", percentage: "10-20%", benefit: "Root development and flowering" },
    { name: "Potassium (K₂O)", percentage: "10-25%", benefit: "Disease resistance and fruit quality" },
    { name: "Sulfur (S)", percentage: "2-5%", benefit: "Protein formation and oil content" },
    { name: "Calcium (Ca)", percentage: "1-3%", benefit: "Cell wall strength and fruit firmness" },
    { name: "Magnesium (Mg)", percentage: "0.5-2%", benefit: "Chlorophyll formation and photosynthesis" }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section 
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(46, 125, 50, 0.8), rgba(46, 125, 50, 0.6)), url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Agricultural Fertilizers</h1>
            <p className="text-xl mb-8 leading-relaxed">
              Advanced fertilizer solutions designed to maximize crop yields while promoting sustainable farming practices and soil health enhancement.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-accent-orange hover:bg-accent-orange-dark">
                  Get Crop Consultation
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
                Download Crop Guide
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Agricultural Benefits</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our fertilizers deliver proven results that help farmers achieve higher yields and better crop quality.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-green rounded-lg flex items-center justify-center mx-auto mb-4">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Fertilizer Products</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete range of fertilizers designed for modern agricultural needs.
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

      {/* Crop Types Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Crop-Specific Solutions</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tailored fertilizer programs for different crop categories and growing systems.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {cropTypes.map((crop, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div 
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${crop.image})` }}
                />
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{crop.title}</h3>
                  <p className="text-gray-600 mb-4">{crop.description}</p>
                  <ul className="space-y-2">
                    {crop.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-gray-700">
                        <CheckCircle className="h-4 w-4 text-secondary mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Nutrient Analysis */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Nutrient Analysis</h2>
              <p className="text-lg text-gray-600 mb-8">
                Our fertilizers are precisely formulated with optimal nutrient ratios for maximum plant uptake and utilization.
              </p>
              <div className="bg-white rounded-lg p-6 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Typical Nutrient Content</h3>
                <div className="space-y-4">
                  {nutrients.map((nutrient, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-900">{nutrient.name}</span>
                          <span className="text-primary font-semibold">{nutrient.percentage}</span>
                        </div>
                        <p className="text-gray-600 text-sm">{nutrient.benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                alt="Agricultural field with healthy crops"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Application Guidelines */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Guidelines</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Proper application ensures maximum efficiency and optimal crop response.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-green text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Soil Testing</h3>
              <p className="text-gray-600 text-sm">Analyze soil pH, nutrient levels, and organic matter content</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Product Selection</h3>
              <p className="text-gray-600 text-sm">Choose appropriate fertilizer based on crop and soil requirements</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-orange text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Application Timing</h3>
              <p className="text-gray-600 text-sm">Apply at optimal growth stages for maximum nutrient uptake</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-green text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="font-semibold text-gray-900 mb-2">Monitoring</h3>
              <p className="text-gray-600 text-sm">Track crop response and adjust program as needed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Proven Results</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real data from farmers who have achieved exceptional results with our fertilizers.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="text-4xl font-bold primary-green mb-2">+35%</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Yield Increase</div>
              <div className="text-gray-600">Average yield improvement in wheat production</div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="text-4xl font-bold primary-blue mb-2">+28%</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Quality Grade</div>
              <div className="text-gray-600">Improvement in export quality produce</div>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg text-center">
              <div className="text-4xl font-bold accent-orange mb-2">+42%</div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Farm Income</div>
              <div className="text-gray-600">Increase in net farm profitability</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Maximize Your Crop Potential?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Connect with our agricultural experts to develop a customized fertilizer program for your farm.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-primary-green hover:bg-primary-green-dark">
                Contact Agricultural Experts
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-900">
              Download Crop Nutrition Guide
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AgriculturalFertilizers;
