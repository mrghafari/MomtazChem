import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Microscope, Settings, Gauge, Zap, GitMerge, Filter, Thermometer, Shield } from 'lucide-react';

interface ContentItem {
  id: number;
  section: string;
  key: string;
  content: string;
  language: string;
  contentType: string;
}

export default function TechnicalEquipmentPage() {
  const { data: contentItems = [], isLoading } = useQuery<ContentItem[]>({
    queryKey: ['/api/content-management/items'],
    queryFn: async () => {
      const response = await fetch('/api/content-management/items');
      if (!response.ok) throw new Error('Failed to fetch content');
      return response.json();
    }
  });

  const technicalContent = contentItems.filter(item => 
    item.section === 'technical_equipment' && item.language === 'en'
  );

  const getContent = (key: string) => {
    const item = technicalContent.find(item => item.key === key);
    return item?.content || '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-2/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-300 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const equipmentCategories = [
    {
      icon: Microscope,
      title: getContent('laboratory_instruments_title') || 'Laboratory Instrumentation',
      description: getContent('laboratory_instruments_desc') || 'Precision analytical instruments including spectrophotometers, chromatography systems, and microscopy equipment.',
      color: 'bg-blue-500',
      features: ['Spectrophotometers', 'Chromatography', 'Microscopy', 'Precision Analysis']
    },
    {
      icon: Settings,
      title: getContent('process_control_title') || 'Process Control Systems',
      description: getContent('process_control_desc') || 'Advanced automation and control systems for industrial processes including sensors, controllers, and monitoring equipment.',
      color: 'bg-indigo-500',
      features: ['Automation', 'Sensors', 'Controllers', 'Monitoring']
    },
    {
      icon: Gauge,
      title: getContent('measurement_tools_title') || 'Measurement & Testing Tools',
      description: getContent('measurement_tools_desc') || 'Professional measurement instruments including calibrators, meters, and testing equipment for quality control.',
      color: 'bg-emerald-500',
      features: ['Calibrators', 'Meters', 'Quality Control', 'Precision Testing']
    },
    {
      icon: Zap,
      title: getContent('pumps_systems_title') || 'Pumps & Fluid Systems',
      description: getContent('pumps_systems_desc') || 'Industrial pumps, valves, and fluid handling systems designed for chemical processing and material transfer.',
      color: 'bg-purple-500',
      features: ['Industrial Pumps', 'Valves', 'Fluid Handling', 'Material Transfer']
    },
    {
      icon: GitMerge,
      title: getContent('mixing_equipment_title') || 'Mixing & Blending Equipment',
      description: getContent('mixing_equipment_desc') || 'Professional mixing solutions including agitators, blenders, and homogenizers for chemical processing.',
      color: 'bg-orange-500',
      features: ['Agitators', 'Blenders', 'Homogenizers', 'Chemical Processing']
    },
    {
      icon: Filter,
      title: getContent('filtration_systems_title') || 'Filtration & Separation Systems',
      description: getContent('filtration_systems_desc') || 'Advanced filtration equipment for liquid and gas purification including membrane systems.',
      color: 'bg-cyan-500',
      features: ['Membrane Systems', 'Liquid Purification', 'Gas Filtration', 'Separation Technology']
    },
    {
      icon: Thermometer,
      title: getContent('heating_cooling_title') || 'Heating & Cooling Equipment',
      description: getContent('heating_cooling_desc') || 'Temperature control systems including heaters, chillers, and thermal management solutions.',
      color: 'bg-red-500',
      features: ['Temperature Control', 'Heaters', 'Chillers', 'Thermal Management']
    },
    {
      icon: Shield,
      title: getContent('safety_monitoring_title') || 'Safety & Monitoring Systems',
      description: getContent('safety_monitoring_desc') || 'Gas detection systems, emergency shutdown equipment, and environmental monitoring solutions.',
      color: 'bg-slate-500',
      features: ['Gas Detection', 'Emergency Shutdown', 'Environmental Monitoring', 'Workplace Safety']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-700 to-blue-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {getContent('hero_title') || 'Technical Equipment & Instrumentation'}
            </h1>
            <p className="text-xl md:text-2xl text-slate-100 max-w-4xl mx-auto">
              {getContent('hero_subtitle') || 'Professional-grade technical equipment and precision instrumentation for industrial, laboratory, and research applications.'}
            </p>
          </div>
        </div>
      </div>

      {/* Overview Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {getContent('overview_title') || 'Advanced Technical Solutions'}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              {getContent('overview_description') || 'Our technical equipment portfolio delivers cutting-edge technology and precision instrumentation to support your most demanding applications.'}
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {equipmentCategories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Card key={index} className="bg-white hover:shadow-xl transition-shadow duration-300 border-0 shadow-lg h-full">
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mb-3`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 leading-tight">
                      {category.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-sm leading-relaxed">
                      {category.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Separator className="mb-3" />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-900 mb-2 text-sm">Key Features:</h4>
                      <div className="flex flex-wrap gap-1">
                        {category.features.map((feature, featureIndex) => (
                          <Badge key={featureIndex} variant="secondary" className="bg-slate-100 text-slate-700 text-xs">
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

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-slate-700 to-blue-700 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Advanced Technical Solutions Await
          </h2>
          <p className="text-xl text-slate-100 mb-8 max-w-2xl mx-auto">
            Connect with our technical specialists to find the perfect instrumentation and equipment solutions for your specific requirements.
          </p>
          <div className="space-x-4">
            <button className="bg-white text-slate-700 px-8 py-3 rounded-lg font-semibold hover:bg-slate-50 transition-colors">
              Technical Consultation
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-slate-700 transition-colors">
              Equipment Catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}