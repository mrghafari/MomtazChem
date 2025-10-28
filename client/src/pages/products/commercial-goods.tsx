import { CheckCircle, ArrowRight, ShoppingBag, Package, Shield, Star, Download, FileText, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ProductInquiryForm } from "@/components/ui/product-inquiry-form";
import { RandomCategoryProducts } from "@/components/RandomCategoryProducts";

import type { ShowcaseProduct } from "@shared/showcase-schema";

const CommercialGoods = () => {
  const [, navigate] = useLocation();
  
  const { data: products, isLoading } = useQuery<ShowcaseProduct[]>({
    queryKey: ["/api/products", "commercial-goods"],
    queryFn: () => fetch("/api/products?category=commercial-goods").then(res => res.json()),
  });

  const { data: productStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/shop/product-stats'],
    queryFn: () => fetch('/api/shop/product-stats').then(res => res.json()).then(data => data.data),
  });

  const benefits = [
    {
      icon: <ShoppingBag className="h-8 w-8 text-white" />,
      title: "Quality Products",
      description: "Carefully selected commercial goods for professional use"
    },
    {
      icon: <Shield className="h-8 w-8 text-white" />,
      title: "Trusted Brands",
      description: "Partnering with reliable manufacturers and suppliers"
    },
    {
      icon: <Star className="h-8 w-8 text-white" />,
      title: "Competitive Pricing",
      description: "Best value for money with flexible payment options"
    },
    {
      icon: <Package className="h-8 w-8 text-white" />,
      title: "Fast Delivery",
      description: "Efficient logistics and timely product delivery"
    }
  ];

  return (
    <div className="pt-20">
      <section 
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(79, 70, 229, 0.8), rgba(79, 70, 229, 0.6)), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Commercial Goods</h1>
            <p className="text-xl mb-8 leading-relaxed">
              Comprehensive range of commercial goods and supplies for businesses, retailers, and industrial operations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-accent-orange hover:bg-accent-orange-dark">
                  Request Quote
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-indigo-600 bg-[#818cf8]">
                View Catalog
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Commercial Goods?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Reliable commercial products backed by excellent customer service.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Random Products from Shop */}
      <RandomCategoryProducts 
        categoryDisplayName="Commercial Goods" 
        category="commercial-goods" 
      />

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Commercial Products</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Browse our selection of quality commercial goods.
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
            <RandomCategoryProducts 
              categoryDisplayName="Commercial Goods" 
              category="commercial-goods" 
            />
          )}
        </div>
      </section>

      <section className="py-20 bg-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Looking for Commercial Supplies?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            Contact us for bulk orders, custom solutions, and competitive pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100">
                Contact Sales Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CommercialGoods;
