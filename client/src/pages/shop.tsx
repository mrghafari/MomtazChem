import { ShoppingCart, Package, Filter, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const Shop = () => {
  const categories = [
    { name: "Fuel Additives", count: 24, href: "/products/fuel-additives" },
    { name: "Water Treatment", count: 18, href: "/products/water-treatment" },
    { name: "Paint & Thinner", count: 32, href: "/products/paint-thinner" },
    { name: "Agricultural Fertilizers", count: 16, href: "/products/agricultural-fertilizers" }
  ];

  const featuredProducts = [
    {
      id: 1,
      name: "Premium Octane Booster",
      category: "Fuel Additives",
      price: "Contact for pricing",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.8,
      inStock: true
    },
    {
      id: 2,
      name: "Industrial Water Coagulant",
      category: "Water Treatment",
      price: "Contact for pricing",
      image: "https://images.unsplash.com/photo-1581093804475-577d72e38aa0?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.9,
      inStock: true
    },
    {
      id: 3,
      name: "Automotive Paint System",
      category: "Paint & Thinner",
      price: "Contact for pricing",
      image: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.7,
      inStock: true
    },
    {
      id: 4,
      name: "NPK Complex Fertilizer",
      category: "Agricultural Fertilizers",
      price: "Contact for pricing",
      image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80",
      rating: 4.8,
      inStock: true
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Momtazchem Shop</h1>
            <p className="text-xl max-w-3xl mx-auto mb-8">
              Browse our comprehensive catalog of premium chemical solutions for industrial and commercial applications.
            </p>
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input 
                placeholder="Search products..." 
                className="pl-10 bg-white text-gray-900 border-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Notice */}
      <section className="py-16 bg-yellow-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <Package className="h-16 w-16 text-accent-orange mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">E-Commerce Platform Coming Soon</h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              We're currently developing our online shopping platform to make ordering our chemical products even easier. 
              In the meantime, please contact our sales team for product availability and pricing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button size="lg" className="bg-primary-blue hover:bg-primary-blue-dark">
                  Contact Sales Team
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white">
                Request Product Catalog
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Categories</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore our four main product categories with detailed specifications and applications.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Link key={index} href={category.href}>
                <Card className="hover:shadow-lg transition-shadow duration-300 cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 ${
                      index === 0 ? 'bg-primary-blue' : 
                      index === 1 ? 'bg-primary-green' :
                      index === 2 ? 'bg-accent-orange' : 'bg-primary-green'
                    } rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                    <Badge variant="secondary" className="text-sm">
                      {category.count} Products
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our most popular and innovative chemical solutions trusted by industries worldwide.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="bg-white hover:shadow-lg transition-shadow duration-300">
                <div 
                  className="h-48 bg-cover bg-center rounded-t-lg"
                  style={{ backgroundImage: `url(${product.image})` }}
                />
                <CardContent className="p-6">
                  <Badge variant="outline" className="mb-2 text-xs">
                    {product.category}
                  </Badge>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                  <div className="flex items-center mb-3">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600 ml-2">({product.rating})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-primary">{product.price}</span>
                    <Badge variant={product.inStock ? "default" : "secondary"}>
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </Badge>
                  </div>
                  <Button className="w-full mt-4 bg-primary-blue hover:bg-primary-blue-dark">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Request Quote
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Shop with Momtazchem?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue rounded-lg flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Quality Assured</h3>
              <p className="text-gray-600">All products meet international quality standards with full documentation.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-green rounded-lg flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Global Shipping</h3>
              <p className="text-gray-600">Reliable delivery to over 40 countries with express shipping options.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-orange rounded-lg flex items-center justify-center mx-auto mb-4">
                <Filter className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Technical Support</h3>
              <p className="text-gray-600">Expert guidance on product selection and application methods.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Be the first to know when our online store launches and get exclusive product updates.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <Input 
              placeholder="Enter your email" 
              className="bg-white text-gray-900 border-0"
            />
            <Button className="bg-primary-blue hover:bg-primary-blue-dark">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Shop;