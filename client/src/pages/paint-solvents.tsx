import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Palette, Droplets, Car, Building, Shield, Brush } from 'lucide-react';
import { RandomCategoryProducts } from '@/components/RandomCategoryProducts';

interface ContentItem {
  id: number;
  section: string;
  key: string;
  content: string;
  language: string;
  contentType: string;
}

export default function PaintSolventsPage() {
  const [, setLocation] = useLocation();

  const { data: contentItems = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/content-management/items'],
    queryFn: async () => {
      const response = await fetch('/api/content-management/items');
      if (!response.ok) throw new Error('Failed to fetch content');
      const result = await response.json();
      return result.success ? result.data : [];
    }
  });

  // Filter content for paint_solvents section
  const paintSolventsContent = contentItems.filter(item => 
    item.section === 'paint_solvents' && item.language === 'en'
  );

  const getContent = (key: string) => {
    const item = paintSolventsContent.find(item => item.key === key);
    return item?.content || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
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

  const productCategories = [
    {
      icon: Car,
      title: getContent('automotive_paints_title') || 'Automotive Paint Systems',
      description: getContent('automotive_paints_desc') || 'Advanced automotive coatings featuring excellent color retention, chip resistance, and UV protection.',
      color: 'bg-red-500',
      features: ['Color Retention', 'Chip Resistance', 'UV Protection', 'Professional Grade']
    },
    {
      icon: Building,
      title: getContent('architectural_coatings_title') || 'Architectural Coatings',
      description: getContent('architectural_coatings_desc') || 'Premium architectural paints offering exceptional coverage, weather resistance, and long-lasting aesthetic appeal.',
      color: 'bg-blue-500',
      features: ['Weather Resistant', 'High Coverage', 'Long Lasting', 'Interior/Exterior']
    },
    {
      icon: Droplets,
      title: getContent('industrial_solvents_title') || 'Industrial Solvents',
      description: getContent('industrial_solvents_desc') || 'High-purity industrial solvents for cleaning, degreasing, and processing applications.',
      color: 'bg-green-500',
      features: ['High Purity', 'Cleaning', 'Degreasing', 'Safe Formula']
    },
    {
      icon: Brush,
      title: getContent('specialty_thinners_title') || 'Specialty Thinners',
      description: getContent('specialty_thinners_desc') || 'Precision-formulated paint thinners designed to optimize flow, leveling, and application properties.',
      color: 'bg-purple-500',
      features: ['Precision Formula', 'Flow Optimization', 'Professional Results', 'Easy Application']
    },
    {
      icon: Shield,
      title: getContent('marine_coatings_title') || 'Marine Coatings',
      description: getContent('marine_coatings_desc') || 'Corrosion-resistant marine paints engineered to withstand harsh saltwater environments.',
      color: 'bg-cyan-500',
      features: ['Corrosion Resistant', 'Saltwater Proof', 'Marine Grade', 'Structural Integrity']
    },
    {
      icon: Palette,
      title: getContent('powder_coatings_title') || 'Powder Coating Systems',
      description: getContent('powder_coatings_desc') || 'Environmentally-friendly powder coating solutions providing durable, uniform finishes.',
      color: 'bg-orange-500',
      features: ['Eco-Friendly', 'Zero VOC', 'Uniform Finish', 'Durable']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {getContent('hero_title') || 'Paint & Solvents Solutions'}
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto">
              {getContent('hero_subtitle') || 'Professional-grade paint formulations and high-performance solvents for automotive, architectural, and industrial applications.'}
            </p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {getContent('overview_title') || 'Paint & Solvent Technologies'}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {getContent('overview_description') || 'Our comprehensive range of paint systems and solvents delivers superior performance, durability, and finish quality across diverse application requirements.'}
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productCategories.map((category, index) => {
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
                          <Badge key={featureIndex} variant="secondary" className="bg-blue-100 text-blue-800">
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
        category="paint-solvents" 
        title="محصولات پیشنهادی رنگ و حلال از فروشگاه"
      />

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Enhance Your Projects?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Contact our technical experts for personalized paint and solvent recommendations tailored to your specific requirements.
          </p>
          <div className="space-x-4">
            <Button 
              onClick={() => setLocation('/contact')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Contact Experts
            </Button>
            <Button 
              onClick={() => setLocation('/shop')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              View Products
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}