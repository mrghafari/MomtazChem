import { CheckCircle, ArrowRight, Wrench, Settings, Shield, Zap, Download, FileText, Image, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ProductInquiryForm } from "@/components/ui/product-inquiry-form";
import { RandomCategoryProducts } from "@/components/RandomCategoryProducts";

import type { ShowcaseProduct } from "@shared/showcase-schema";

const TechnicalEquipment = () => {
  const [, navigate] = useLocation();
  
  const { data: products, isLoading } = useQuery<ShowcaseProduct[]>({
    queryKey: ["/api/products", "technical-equipment"],
    queryFn: () => fetch("/api/products?category=technical-equipment").then(res => res.json()),
  });

  const { data: productStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/shop/product-stats'],
    queryFn: () => fetch('/api/shop/product-stats').then(res => res.json()).then(data => data.data),
  });

  const benefits = [
    {
      icon: <Wrench className="h-8 w-8 text-white" />,
      title: "Professional Grade",
      description: "Industrial-quality equipment built for demanding applications"
    },
    {
      icon: <Shield className="h-8 w-8 text-white" />,
      title: "Reliable & Durable",
      description: "Long-lasting equipment designed for continuous operation"
    },
    {
      icon: <Zap className="h-8 w-8 text-white" />,
      title: "High Performance",
      description: "Optimized for maximum efficiency and productivity"
    },
    {
      icon: <Settings className="h-8 w-8 text-white" />,
      title: "Easy Maintenance",
      description: "Simple servicing and readily available spare parts"
    }
  ];

  return (
    <div className="pt-20">
      <section 
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(rgba(31, 41, 55, 0.8), rgba(31, 41, 55, 0.6)), url('https://images.unsplash.com/photo-1581092160562-40aa08e78837?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-white">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Technical Equipment</h1>
            <p className="text-xl mb-8 leading-relaxed">
              Professional-grade technical equipment and tools for industrial, commercial, and specialized applications.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/contact">
                <Button size="lg" className="bg-accent-orange hover:bg-accent-orange-dark">
                  Request Quote
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-gray-900 bg-[#6b7280]">
                Download Catalog
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Equipment?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              High-quality technical equipment backed by expert support and reliable service.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {benefit.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Technical Equipment</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional tools and equipment for every application.
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
              categoryDisplayName="Technical Equipment" 
              category="technical-equipment"
              hideTitle={true}
            />
          )}
        </div>
      </section>

      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Technical Equipment?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Contact our technical team for equipment recommendations and quotations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Contact Technical Team
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TechnicalEquipment;
