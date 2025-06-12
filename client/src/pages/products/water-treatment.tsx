import { CheckCircle, Droplets, Filter, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

const WaterTreatment = () => {
  const products = [
    {
      name: "Coagulants & Flocculants",
      description: "Advanced chemicals for effective water clarification and solid separation",
      features: ["Rapid settling of suspended particles", "High efficiency at low dosage", "Wide pH range compatibility"],
      applications: ["Municipal water treatment", "Industrial wastewater", "Mining operations"]
    },
    {
      name: "Disinfectants",
      description: "Powerful antimicrobial solutions for water purification and safety",
      features: ["Broad spectrum pathogen control", "Long-lasting residual protection", "Safe for potable water"],
      applications: ["Drinking water", "Swimming pools", "Cooling towers"]
    },
    {
      name: "pH Adjusters",
      description: "Precise pH control chemicals for optimal water treatment processes",
      features: ["Stable pH control", "Minimal impact on water quality", "Cost-effective formulations"],
      applications: ["Process water", "Boiler water", "Wastewater treatment"]
    },
    {
      name: "Corrosion Inhibitors",
      description: "Protective chemicals that prevent metal corrosion in water systems",
      features: ["Extends equipment life", "Reduces maintenance costs", "Environmentally friendly"],
      applications: ["Cooling systems", "Boilers", "Distribution networks"]
    }
  ];

  const benefits = [
    {
      icon: <Droplets className="h-8 w-8 text-white" />,
      title: "Water Quality",
      description: "Achieve superior water quality standards for all applications"
    },
    {
      icon: <Filter className="h-8 w-8 text-white" />,
      title: "Efficient Treatment",
      description: "Optimize treatment processes with advanced chemical solutions"
    },
    {
      icon: <Shield className="h-8 w-8 text-white" />,
      title: "System Protection",
      description: "Protect equipment and infrastructure from corrosion and scaling"
    },
    {
      icon: <Zap className="h-8 w-8 text-white" />,
      title: "Energy Efficiency",
      description: "Reduce energy consumption through optimized treatment processes"
    }
  ];

  const applications = [
    {
      title: "Municipal Water Treatment",
      description: "Complete solutions for city water supply systems",
      image: "https://images.unsplash.com/photo-1581093804475-577d72e38aa0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      features: ["Drinking water purification", "Wastewater treatment", "Distribution system protection"]
    },
    {
      title: "Industrial Applications",
      description: "Specialized chemicals for industrial water systems",
      image: "https://images.unsplash.com/photo-1581092162384-8987c1d64718?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      features: ["Process water treatment", "Cooling tower maintenance", "Boiler water conditioning"]
    },
    {
      title: "Residential Solutions",
      description: "Home water treatment products for families",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      features: ["Pool and spa chemicals", "Well water treatment", "Home filtration systems"]
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section 
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(46, 125, 50, 0.8), rgba(46, 125, 50, 0.6)), url('https://images.unsplash.com/photo-1581093804475-577d72e38aa0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Water Treatment Solutions</h1>
            <p className="text-xl mb-8 leading-relaxed">
              Comprehensive water treatment solutions for municipal, industrial, and residential applications, ensuring clean and safe water for all uses.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-accent-orange hover:bg-accent-orange-dark">
                  Get Custom Solution
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary">
                View Product Guide
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Advanced Water Treatment Benefits</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our water treatment chemicals deliver superior performance and reliability for all your water quality needs.
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Water Treatment Products</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Complete range of chemicals for every water treatment challenge.
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

      {/* Applications Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Areas</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Serving diverse markets with specialized water treatment solutions.
            </p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {applications.map((app, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div 
                  className="h-48 bg-cover bg-center"
                  style={{ backgroundImage: `url(${app.image})` }}
                />
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{app.title}</h3>
                  <p className="text-gray-600 mb-4">{app.description}</p>
                  <ul className="space-y-2">
                    {app.features.map((feature, featureIndex) => (
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

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Water Treatment Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our systematic approach ensures optimal water quality at every stage.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-green text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Analysis</h3>
              <p className="text-gray-600 text-sm">Comprehensive water quality assessment and testing</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Treatment Design</h3>
              <p className="text-gray-600 text-sm">Custom treatment plan and chemical selection</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-orange text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Implementation</h3>
              <p className="text-gray-600 text-sm">System installation and chemical dosing</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-green text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="font-semibold text-gray-900 mb-2">Monitoring</h3>
              <p className="text-gray-600 text-sm">Continuous monitoring and optimization</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Need a Custom Water Treatment Solution?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Our water treatment experts are ready to help you design the perfect system for your specific needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-primary-green hover:bg-primary-green-dark">
                Contact Water Experts
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-900">
              Download Technical Guide
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WaterTreatment;
