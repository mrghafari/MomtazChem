import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Package, FileText, Sparkles, Shield, Wrench, Coffee } from 'lucide-react';
import { RandomCategoryProducts } from '@/components/RandomCategoryProducts';

interface ContentItem {
  id: number;
  section: string;
  key: string;
  content: string;
  language: string;
  contentType: string;
}

export default function CommercialGoodsPage() {
  const [, setLocation] = useLocation();

  const { data: contentItems = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/content-management/items'],
    queryFn: async () => {
      const response = await fetch('/api/content-management/items');
      if (!response.ok) throw new Error('Failed to fetch content');
      return response.json();
    }
  });

  const commercialContent = contentItems.filter(item => 
    item.section === 'commercial_goods' && item.language === 'en'
  );

  const getContent = (key: string) => {
    const item = commercialContent.find(item => item.key === key);
    return item?.content || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const commercialCategories = [
    {
      icon: FileText,
      title: getContent('office_supplies_title') || 'Office & Business Supplies',
      description: getContent('office_supplies_desc') || 'Complete range of office essentials including stationery, documentation materials, and workspace organization solutions.',
      color: 'bg-blue-500',
      features: ['Stationery', 'Documentation', 'Organization', 'Professional Quality']
    },
    {
      icon: Package,
      title: getContent('packaging_materials_title') || 'Packaging Materials',
      description: getContent('packaging_materials_desc') || 'Professional packaging solutions including boxes, protective materials, and shipping supplies for secure product transport.',
      color: 'bg-orange-500',
      features: ['Protective Materials', 'Shipping Supplies', 'Secure Transport', 'Various Sizes']
    },
    {
      icon: Sparkles,
      title: getContent('cleaning_supplies_title') || 'Commercial Cleaning Products',
      description: getContent('cleaning_supplies_desc') || 'Industrial-strength cleaning solutions for commercial facilities, offices, and institutional applications.',
      color: 'bg-green-500',
      features: ['Industrial Strength', 'Commercial Grade', 'Multi-Surface', 'Eco-Friendly']
    },
    {
      icon: Shield,
      title: getContent('safety_equipment_title') || 'Safety & Protection Equipment',
      description: getContent('safety_equipment_desc') || 'Personal protective equipment and workplace safety solutions to ensure employee protection and regulatory compliance.',
      color: 'bg-red-500',
      features: ['PPE Equipment', 'Workplace Safety', 'Regulatory Compliance', 'Employee Protection']
    },
    {
      icon: Wrench,
      title: getContent('maintenance_supplies_title') || 'Maintenance & Repair Supplies',
      description: getContent('maintenance_supplies_desc') || 'Essential maintenance products and tools for facility upkeep, equipment service, and operational continuity.',
      color: 'bg-purple-500',
      features: ['Facility Upkeep', 'Equipment Service', 'Operational Continuity', 'Professional Tools']
    },
    {
      icon: Coffee,
      title: getContent('hospitality_products_title') || 'Hospitality Products',
      description: getContent('hospitality_products_desc') || 'Specialized products for hotels, restaurants, and service industries including amenities and operational supplies.',
      color: 'bg-amber-500',
      features: ['Hotel Amenities', 'Restaurant Supplies', 'Service Industry', 'Guest Comfort']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {getContent('hero_title') || 'Commercial Goods & Solutions'}
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 max-w-4xl mx-auto">
              {getContent('hero_subtitle') || 'Comprehensive commercial products and business solutions designed to enhance operational efficiency and drive commercial success.'}
            </p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {getContent('overview_title') || 'Commercial Excellence'}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {getContent('overview_description') || 'Our commercial goods portfolio encompasses essential business products, office supplies, and operational solutions for modern enterprises.'}
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {commercialCategories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Card key={index} className="bg-white hover:shadow-xl transition-shadow duration-300 border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className={`w-16 h-16 ${category.color} rounded-lg flex items-center justify-center mb-4`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base leading-relaxed">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-4" />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                      <div className="flex flex-wrap gap-2">
                        {category.features.map((feature, featureIndex) => (
                          <Badge key={featureIndex} variant="secondary" className="bg-orange-100 text-orange-800">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Random Products from Shop */}
      <RandomCategoryProducts 
        category="paint-thinner" 
        title="محصولات پیشنهادی شیمیایی از فروشگاه"
      />

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Enhance Your Business Operations
          </h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Discover our comprehensive range of commercial goods designed to streamline your business processes and improve operational efficiency.
          </p>
          <div className="space-x-4">
            <Button 
              onClick={() => setLocation('/contact')}
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              Contact Sales
            </Button>
            <Button 
              onClick={() => setLocation('/shop')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
            >
              View Catalog
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}