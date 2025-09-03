import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { Factory, Beaker, Shield, Cog, Zap, Cpu } from 'lucide-react';
import { RandomCategoryProducts } from '@/components/RandomCategoryProducts';

interface ContentItem {
  id: number;
  section: string;
  key: string;
  content: string;
  language: string;
  contentType: string;
}

export default function IndustrialChemicalsPage() {
  const [, setLocation] = useLocation();

  const { data: contentResponse, isLoading } = useQuery({
    queryKey: ['/api/content-management/items'],
    queryFn: async () => {
      const response = await fetch('/api/content-management/items');
      if (!response.ok) throw new Error('Failed to fetch content');
      return response.json();
    }
  });

  const contentItems = contentResponse?.data || [];
  const industrialContent = Array.isArray(contentItems) ? contentItems.filter((item: ContentItem) => 
    item.section === 'industrial_chemicals' && item.language === 'en'
  ) : [];

  const getContent = (key: string) => {
    const item = industrialContent.find(item => item.key === key);
    return item?.content || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 p-8">
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

  const chemicalCategories = [
    {
      icon: Beaker,
      title: getContent('process_chemicals_title') || 'Process Chemicals',
      description: getContent('process_chemicals_desc') || 'Specialized chemicals for manufacturing processes including catalysts, intermediates, and reaction media.',
      color: 'bg-emerald-500',
      features: ['Catalysts', 'Intermediates', 'Reaction Media', 'High Efficiency']
    },
    {
      icon: Shield,
      title: getContent('cleaning_agents_title') || 'Industrial Cleaning Agents',
      description: getContent('cleaning_agents_desc') || 'Heavy-duty industrial cleaners and degreasers formulated for equipment maintenance and facility cleaning.',
      color: 'bg-blue-500',
      features: ['Heavy Duty', 'Equipment Safe', 'Facility Grade', 'Biodegradable']
    },
    {
      icon: Cog,
      title: getContent('metal_treatment_title') || 'Metal Treatment Chemicals',
      description: getContent('metal_treatment_desc') || 'Corrosion inhibitors, rust converters, and surface treatment chemicals for metal protection.',
      color: 'bg-orange-500',
      features: ['Corrosion Protection', 'Rust Prevention', 'Surface Treatment', 'Long Lasting']
    },
    {
      icon: Factory,
      title: getContent('textile_chemicals_title') || 'Textile Processing Chemicals',
      description: getContent('textile_chemicals_desc') || 'Dyeing auxiliaries, finishing agents, and fabric treatment chemicals for textile manufacturing.',
      color: 'bg-purple-500',
      features: ['Dyeing Auxiliaries', 'Finishing Agents', 'Fabric Treatment', 'Color Fast']
    },
    {
      icon: Zap,
      title: getContent('polymer_additives_title') || 'Polymer Additives',
      description: getContent('polymer_additives_desc') || 'Stabilizers, plasticizers, and performance enhancers for plastic and rubber manufacturing.',
      color: 'bg-red-500',
      features: ['Stabilizers', 'Plasticizers', 'Performance Enhancers', 'Quality Assured']
    },
    {
      icon: Cpu,
      title: getContent('electronic_chemicals_title') || 'Electronic Grade Chemicals',
      description: getContent('electronic_chemicals_desc') || 'Ultra-pure chemicals for semiconductor manufacturing and electronic component production.',
      color: 'bg-indigo-500',
      features: ['Ultra Pure', 'Semiconductor Grade', 'Electronic Components', 'High Precision']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {getContent('hero_title') || 'Industrial Chemical Solutions'}
            </h1>
            <p className="text-xl md:text-2xl text-emerald-100 max-w-4xl mx-auto">
              {getContent('hero_subtitle') || 'Advanced chemical formulations for manufacturing, processing, and industrial applications with superior purity and performance standards.'}
            </p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {getContent('overview_title') || 'Industrial Chemistry Excellence'}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {getContent('overview_description') || 'Our industrial chemical portfolio supports diverse manufacturing processes with reliable quality, consistent supply, and technical expertise.'}
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {chemicalCategories.map((category, index) => {
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
                          <Badge key={featureIndex} variant="secondary" className="bg-emerald-100 text-emerald-800">
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
        category="agricultural-fertilizers" 
        title="محصولات پیشنهادی شیمیایی از فروشگاه"
      />

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-emerald-600 to-blue-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Need Industrial Chemical Solutions?
          </h2>
          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Our chemical engineers are ready to provide specialized solutions for your industrial processes and manufacturing requirements.
          </p>
          <div className="space-x-4">
            <Button 
              onClick={() => setLocation('/contact')}
              className="bg-white text-emerald-600 px-8 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors"
            >
              Consult Engineers
            </Button>
            <Button 
              onClick={() => setLocation('/shop')}
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-colors"
            >
              Browse Chemicals
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}