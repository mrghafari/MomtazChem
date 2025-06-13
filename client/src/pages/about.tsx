import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Target,
  Eye,
  Heart,
  Users,
  Award,
  Shield,
  Globe
} from "lucide-react";

export default function AboutPage() {
  const { t, isRTL } = useLanguage();

  const values = [
    {
      icon: Shield,
      title: isRTL ? "الجودة والسلامة" : "Quality & Safety",
      description: isRTL ? "نلتزم بأعلى معايير الجودة والسلامة في جميع منتجاتنا وعملياتنا" : "We commit to the highest standards of quality and safety in all our products and operations"
    },
    {
      icon: Globe,
      title: isRTL ? "الابتكار والتطوير" : "Innovation & Development", 
      description: isRTL ? "نستثمر في البحث والتطوير لتقديم حلول كيميائية متقدمة ومبتكرة" : "We invest in research and development to provide advanced and innovative chemical solutions"
    },
    {
      icon: Users,
      title: isRTL ? "خدمة العملاء" : "Customer Service",
      description: isRTL ? "نضع عملاءنا في المقدمة ونسعى لتقديم أفضل خدمة ودعم تقني" : "We put our customers first and strive to provide the best service and technical support"
    },
    {
      icon: Heart,
      title: isRTL ? "المسؤولية البيئية" : "Environmental Responsibility",
      description: isRTL ? "نحرص على حماية البيئة والالتزام بالممارسات المستدامة" : "We are committed to environmental protection and sustainable practices"
    }
  ];

  const certifications = [
    { name: "ISO 9001:2015", type: isRTL ? "إدارة الجودة" : "Quality Management" },
    { name: "ISO 14001:2015", type: isRTL ? "الإدارة البيئية" : "Environmental Management" },
    { name: "ISO 45001:2018", type: isRTL ? "الصحة والسلامة المهنية" : "Occupational Health & Safety" },
    { name: "REACH", type: isRTL ? "تنظيم المواد الكيميائية الأوروبي" : "European Chemical Regulation" }
  ];

  const stats = [
    { number: "15+", label: isRTL ? "سنوات من الخبرة" : "Years of Experience" },
    { number: "500+", label: isRTL ? "منتج كيميائي" : "Chemical Products" },
    { number: "1000+", label: isRTL ? "عميل راضي" : "Satisfied Clients" },
    { number: "50+", label: isRTL ? "دولة نخدمها" : "Countries Served" }
  ];

  return (
    <div className={`min-h-screen ${isRTL ? 'font-arabic' : ''}`}>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-purple-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('aboutPage.title')}
            </h1>
            <p className="text-xl text-blue-100">
              {t('aboutPage.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Company Overview */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                {t('companyName')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                {isRTL ? 
                  "تأسست شركة الإنتاج الممتاز للتجارة العامة والصناعة الكيميائية المحدودة كشركة رائدة في مجال توفير الحلول الكيميائية المتخصصة للصناعات المختلفة. نحن نفخر بتقديم منتجات عالية الجودة تلبي أعلى المعايير الدولية." :
                  "Al-Intaj Al-Mumtaz for General Trade and Chemical Industry, Limited was established as a leading company in providing specialized chemical solutions for various industries. We pride ourselves on delivering high-quality products that meet the highest international standards."
                }
              </p>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {isRTL ?
                  "مع أكثر من 15 عاماً من الخبرة في السوق، نواصل التطوير والابتكار لنكون الخيار الأول للعملاء الذين يبحثون عن الجودة والموثوقية في المنتجات الكيميائية." :
                  "With over 15 years of experience in the market, we continue to develop and innovate to be the first choice for customers seeking quality and reliability in chemical products."
                }
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <div className="text-3xl font-bold text-blue-600 mb-2">{stat.number}</div>
                    <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-blue-600" />
                  {t('aboutPage.mission')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  {isRTL ?
                    "توفير حلول كيميائية مبتكرة وموثوقة تساهم في نجاح عملائنا وتطوير الصناعات المحلية والإقليمية مع الالتزام بأعلى معايير الجودة والسلامة البيئية." :
                    "To provide innovative and reliable chemical solutions that contribute to our customers' success and the development of local and regional industries while maintaining the highest standards of quality and environmental safety."
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Eye className="w-6 h-6 text-purple-600" />
                  {t('aboutPage.vision')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  {isRTL ?
                    "أن نكون الشركة الرائدة في منطقة الشرق الأوسط في مجال توفير المواد الكيميائية والحلول الصناعية المتطورة، مع التركيز على الابتكار والاستدامة." :
                    "To be the leading company in the Middle East in providing advanced chemical materials and industrial solutions, focusing on innovation and sustainability."
                  }
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-green-600" />
                  {t('aboutPage.values')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  {isRTL ?
                    "نؤمن بأهمية النزاهة والشفافية في جميع تعاملاتنا، والالتزام بالجودة والتميز، واحترام البيئة والمجتمع، والتطوير المستمر لفريق العمل." :
                    "We believe in the importance of integrity and transparency in all our dealings, commitment to quality and excellence, respect for the environment and community, and continuous development of our team."
                  }
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Core Values Grid */}
          <div className="mb-16">
            <h3 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              {isRTL ? "قيمنا الأساسية" : "Our Core Values"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                        <IconComponent className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                        {value.title}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('aboutPage.certifications')}
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {isRTL ?
                "نحن معتمدون من أهم المنظمات الدولية للجودة والسلامة" :
                "We are certified by the most important international quality and safety organizations"
              }
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <Award className="w-12 h-12 mx-auto text-yellow-500 mb-4" />
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {cert.name}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {cert.type}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}