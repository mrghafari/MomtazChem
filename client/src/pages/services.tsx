import { FlaskRound, Truck, Headphones, Users, CheckCircle } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Services = () => {
  const { t, isRTL } = useLanguage();

  const services = [
    {
      icon: <FlaskRound className="h-8 w-8 text-white" />,
      titleKey: "servicesPage.service1.title",
      descriptionKey: "servicesPage.service1.description",
      featuresKey: "servicesPage.service1.features",
      bgColor: "bg-blue-600"
    },
    {
      icon: <Truck className="h-8 w-8 text-white" />,
      titleKey: "servicesPage.service2.title",
      descriptionKey: "servicesPage.service2.description",
      featuresKey: "servicesPage.service2.features",
      bgColor: "bg-green-600"
    },
    {
      icon: <Headphones className="h-8 w-8 text-white" />,
      titleKey: "servicesPage.service3.title",
      descriptionKey: "servicesPage.service3.description",
      featuresKey: "servicesPage.service3.features",
      bgColor: "bg-orange-600"
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      titleKey: "servicesPage.service4.title",
      descriptionKey: "servicesPage.service4.description",
      featuresKey: "servicesPage.service4.features",
      bgColor: "bg-purple-600"
    }
  ];

  return (
    <div className={`min-h-screen ${isRTL ? 'font-arabic' : ''}`}>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-purple-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('servicesPage.title')}
            </h1>
            <p className="text-xl text-blue-100">
              {t('servicesPage.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {services.map((service, index) => {
              const features = t(service.featuresKey);
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${service.bgColor}`}>
                        {service.icon}
                      </div>
                      <CardTitle className="text-2xl">
                        {t(service.titleKey)}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {t(service.descriptionKey)}
                    </p>
                    <ul className="space-y-3">
                      {Array.isArray(features) ? features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </li>
                      )) : null}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Company Commitment Section */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              {isRTL ? "التزامنا بالتميز" : "Our Commitment to Excellence"}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-12">
              {isRTL ? 
                "نحن ملتزمون بتقديم أعلى مستويات الخدمة والجودة في جميع جوانب عملنا. فريقنا من الخبراء يعمل على مدار الساعة لضمان رضا عملائنا وتحقيق توقعاتهم." :
                "We are committed to delivering the highest levels of service and quality in all aspects of our work. Our team of experts works around the clock to ensure customer satisfaction and meet expectations."
              }
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {isRTL ? "دعم تقني" : "Technical Support"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">15+</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {isRTL ? "سنوات خبرة" : "Years Experience"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">1000+</div>
                <div className="text-gray-600 dark:text-gray-400">
                  {isRTL ? "عميل راضي" : "Satisfied Clients"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;