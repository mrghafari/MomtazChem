import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Shield,
  Award,
  Truck,
  Users,
  ChevronRight,
  Beaker,
  Droplets,
  Factory,
  Leaf
} from "lucide-react";

export default function HomePage() {
  const { t, isRTL } = useLanguage();

  const features = [
    {
      icon: Award,
      titleKey: "homepage.feature1Title",
      descriptionKey: "homepage.feature1Description"
    },
    {
      icon: Users,
      titleKey: "homepage.feature2Title", 
      descriptionKey: "homepage.feature2Description"
    },
    {
      icon: Truck,
      titleKey: "homepage.feature3Title",
      descriptionKey: "homepage.feature3Description"
    },
    {
      icon: Shield,
      titleKey: "homepage.feature4Title",
      descriptionKey: "homepage.feature4Description"
    }
  ];

  const productCategories = [
    {
      icon: Beaker,
      nameKey: "categories.industrialChemicals",
      color: "bg-blue-500"
    },
    {
      icon: Droplets,
      nameKey: "categories.waterTreatment",
      color: "bg-cyan-500"
    },
    {
      icon: Factory,
      nameKey: "categories.chemicals",
      color: "bg-purple-500"
    },
    {
      icon: Leaf,
      nameKey: "categories.fertilizers",
      color: "bg-green-500"
    }
  ];

  return (
    <div className={`min-h-screen ${isRTL ? 'font-arabic' : ''}`}>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {t('homepage.heroTitle')}
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              {t('homepage.heroSubtitle')}
            </p>
            <p className="text-lg mb-12 text-blue-200 max-w-3xl mx-auto">
              {t('homepage.heroDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
                {t('homepage.getQuote')}
                <ChevronRight className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900">
                {t('homepage.learnMore')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('homepage.featuresTitle')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <IconComponent className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                      {t(feature.titleKey)}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t(feature.descriptionKey)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Product Categories Preview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('homepage.productsPreviewTitle')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {productCategories.map((category, index) => {
              const IconComponent = category.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto ${category.color} rounded-full flex items-center justify-center mb-4`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t(category.nameKey)}
                    </h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="text-center">
            <Link href="/shop">
              <Button size="lg">
                {t('homepage.viewAllProducts')}
                <ChevronRight className={`w-5 h-5 ${isRTL ? 'mr-2' : 'ml-2'}`} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="py-20 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">15+</div>
              <div className="text-blue-200">{isRTL ? 'سنوات من الخبرة' : 'Years of Experience'}</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-200">{isRTL ? 'منتج كيميائي' : 'Chemical Products'}</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1000+</div>
              <div className="text-blue-200">{isRTL ? 'عميل راضي' : 'Satisfied Clients'}</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-200">{isRTL ? 'دعم تقني' : 'Technical Support'}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}