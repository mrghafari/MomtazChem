import { CheckCircle, ArrowRight, Wheat, Sprout, TreePine, Leaf, Download, Image, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ProductInquiryForm } from "@/components/ui/product-inquiry-form";

import type { ShowcaseProduct } from "@shared/showcase-schema";
import MolecularHoverEffect from "@/components/ui/molecular-hover-effect";
import { useLanguage } from '@/contexts/LanguageContext';

const AgriculturalProductsPage = () => {
  const [, navigate] = useLocation();
  const { language, t, direction } = useLanguage();
  
  const { data: products, isLoading } = useQuery<ShowcaseProduct[]>({
    queryKey: ["/api/products", "agricultural-products"],
    queryFn: () => fetch("/api/products?category=agricultural-products").then(res => res.json()),
  });

  const { data: productStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/shop/product-stats'],
    queryFn: () => fetch('/api/shop/product-stats').then(res => res.json()).then(data => data.data),
  });

  // Define multilingual content
  const getContent = () => {
    switch (language) {
      case 'ar':
        return {
          title: 'المنتجات الزراعية من ممتازكم',
          subtitle: 'حلول شاملة للإنتاج الزراعي المتطور',
          description: 'اكتشف مجموعتنا الواسعة من المنتجات الزراعية المتخصصة التي تشمل الأسمدة، المحسنات، والمواد المغذية المصممة لتحسين جودة وكمية المحاصيل في البيئة العراقية',
          benefitsTitle: 'لماذا تختار المنتجات الزراعية من ممتازكم؟',
          benefitsDescription: 'نقدم حلولاً متكاملة ومتطورة تجمع بين الخبرة العلمية والتقنيات الحديثة لضمان أفضل النتائج للمزارعين العراقيين',
          benefits: [
            {
              icon: <Sprout className="h-8 w-8 text-white" />,
              title: "إنتاجية عالية",
              description: "منتجات مطورة علمياً لزيادة كمية وجودة المحاصيل بشكل ملحوظ",
              bgColor: "bg-green-500"
            },
            {
              icon: <Leaf className="h-8 w-8 text-white" />,
              title: "تحسين التربة", 
              description: "تركيبات متقدمة تعزز خصوبة التربة وتحافظ على صحتها طويلة المدى",
              bgColor: "bg-emerald-600"
            },
            {
              icon: <TreePine className="h-8 w-8 text-white" />,
              title: "مقاوم للظروف القاسية",
              description: "منتجات مصممة خصيصاً لتحمل التحديات المناخية في المنطقة",
              bgColor: "bg-blue-600"
            },
            {
              icon: <CheckCircle className="h-8 w-8 text-white" />,
              title: "جودة مضمونة",
              description: "اختبارات صارمة وضمان جودة عالمي لجميع منتجاتنا الزراعية",
              bgColor: "bg-purple-600"
            }
          ]
        };
      case 'ku':
        return {
          title: 'بەرهەمە کشتوکاڵییەکانی ممتازکەم',
          subtitle: 'چارەسەری تەواو بۆ بەرهەمهێنانی کشتوکاڵی پێشکەوتوو',
          description: 'کۆمەڵە فراوانەکەمان لە بەرهەمە کشتوکاڵییە تایبەتەکان بدۆزەرەوە کە پەین، باشکەرەوەکان، و مادە خۆراکییەکان لەخۆدەگرێت کە دروستکراون بۆ باشترکردنی جۆر و بڕی دانەوێڵە لە ژینگەی عێراق',
          benefitsTitle: 'بۆچی بەرهەمە کشتوکاڵییەکانی ممتازکەم هەڵبژێریت؟',
          benefitsDescription: 'چارەسەری یەکگرتوو و پێشکەوتوو دەخەینەڕوو کە شارەزایی زانستی و تەکنەلۆژیا هاوچەرخەکان تێکەڵ دەکات بۆ دڵنیایی لە باشترین ئەنجامەکان بۆ جوتیارانی عێراق',
          benefits: [
            {
              icon: <Sprout className="h-8 w-8 text-white" />,
              title: "بەرهەمهێنانی بەرز",
              description: "بەرهەمەکانی پەرەپێدراوی زانستی بۆ زیادکردنی بڕ و جۆری دانەوێڵە بە شێوەیەکی بەرچاو",
              bgColor: "bg-green-500"
            },
            {
              icon: <Leaf className="h-8 w-8 text-white" />,
              title: "باشترکردنی خاک", 
              description: "پێکهاتە پێشکەوتووەکان کە بەرەوپێشچوونی خاک بەهێز دەکەن و تەندروستی درێژخایەنی پاراست دەکەن",
              bgColor: "bg-emerald-600"
            },
            {
              icon: <TreePine className="h-8 w-8 text-white" />,
              title: "بەرگری لە بارودۆخی سەخت",
              description: "بەرهەمەکان تایبەت دروستکراون بۆ بەرگرتن لە تەحەدایەتییە کەشوهەواییەکانی هەرێم",
              bgColor: "bg-blue-600"
            },
            {
              icon: <CheckCircle className="h-8 w-8 text-white" />,
              title: "جۆری دڵنیاکراو",
              description: "تاقیکردنەوەی توند و دڵنیایی لە جۆری جیهانی بۆ هەموو بەرهەمە کشتوکاڵییەکانمان",
              bgColor: "bg-purple-600"
            }
          ]
        };
      case 'tr':
        return {
          title: 'Momtazchem Tarımsal Ürünler',
          subtitle: 'Gelişmiş tarımsal üretim için kapsamlı çözümler',
          description: 'Irak ortamında ürün kalitesi ve miktarını artırmak için tasarlanmış gübreler, iyileştiriciler ve besin maddeleri içeren geniş özel tarımsal ürün koleksiyonumuzu keşfedin',
          benefitsTitle: 'Neden Momtazchem Tarımsal Ürünlerini Seçmelisiniz?',
          benefitsDescription: 'Iraklı çiftçiler için en iyi sonuçları garanti etmek üzere bilimsel uzmanlık ve modern teknolojileri birleştiren entegre ve gelişmiş çözümler sunuyoruz',
          benefits: [
            {
              icon: <Sprout className="h-8 w-8 text-white" />,
              title: "Yüksek Verimlilik",
              description: "Ürün miktarını ve kalitesini önemli ölçüde artırmak için bilimsel olarak geliştirilmiş ürünler",
              bgColor: "bg-green-500"
            },
            {
              icon: <Leaf className="h-8 w-8 text-white" />,
              title: "Toprak İyileştirme", 
              description: "Toprak verimliliğini artıran ve uzun vadeli sağlığını koruyan gelişmiş formülasyonlar",
              bgColor: "bg-emerald-600"
            },
            {
              icon: <TreePine className="h-8 w-8 text-white" />,
              title: "Zorlu Koşullara Dayanıklılık",
              description: "Bölgedeki iklim zorluklarına dayanmak için özel olarak tasarlanmış ürünler",
              bgColor: "bg-blue-600"
            },
            {
              icon: <CheckCircle className="h-8 w-8 text-white" />,
              title: "Garantili Kalite",
              description: "Tüm tarımsal ürünlerimiz için sıkı testler ve küresel kalite güvencesi",
              bgColor: "bg-purple-600"
            }
          ]
        };
      default: // English
        return {
          title: 'Momtazchem Agricultural Products',
          subtitle: 'Comprehensive Solutions for Advanced Agricultural Production',
          description: 'Discover our extensive collection of specialized agricultural products including fertilizers, enhancers, and nutrients designed to improve crop quality and quantity in the Iraqi environment',
          benefitsTitle: 'Why Choose Momtazchem Agricultural Products?',
          benefitsDescription: 'We provide integrated and advanced solutions that combine scientific expertise with modern technologies to ensure the best results for Iraqi farmers',
          benefits: [
            {
              icon: <Sprout className="h-8 w-8 text-white" />,
              title: "High Productivity",
              description: "Scientifically developed products to significantly increase crop quantity and quality",
              bgColor: "bg-green-500"
            },
            {
              icon: <Leaf className="h-8 w-8 text-white" />,
              title: "Soil Enhancement", 
              description: "Advanced formulations that boost soil fertility and maintain long-term health",
              bgColor: "bg-emerald-600"
            },
            {
              icon: <TreePine className="h-8 w-8 text-white" />,
              title: "Harsh Conditions Resistance",
              description: "Products specifically designed to withstand regional climate challenges",
              bgColor: "bg-blue-600"
            },
            {
              icon: <CheckCircle className="h-8 w-8 text-white" />,
              title: "Guaranteed Quality",
              description: "Rigorous testing and global quality assurance for all our agricultural products",
              bgColor: "bg-purple-600"
            }
          ]
        };
    }
  };

  const content = getContent();

  const cropTypes = [
    "Cereals & Grains",
    "Vegetables & Legumes", 
    "Fruit Trees",
    "Industrial Crops",
    "Pasture & Forage",
    "Specialty Crops"
  ];

  const nutrients = [
    { name: "Nitrogen (N)", description: "Essential for protein synthesis and chlorophyll production", color: "bg-blue-100 text-blue-800" },
    { name: "Phosphorus (P)", description: "Critical for root development and energy transfer", color: "bg-purple-100 text-purple-800" },
    { name: "Potassium (K)", description: "Improves disease resistance and water regulation", color: "bg-orange-100 text-orange-800" },
    { name: "Micronutrients", description: "Iron, zinc, manganese for optimal plant health", color: "bg-green-100 text-green-800" }
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir={direction}>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 text-white py-20 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80')" 
          }}
        ></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-6">
                <Wheat className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-5xl font-bold mb-6" dir={direction}>
                {content.title}
              </h1>
              <h2 className="text-3xl font-semibold mb-4 text-green-100" dir={direction}>
                {content.subtitle}
              </h2>
              <p className="text-xl text-green-100 mb-8" dir={direction}>
                {content.description}
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  🌾 {language === 'ar' ? 'عملکرد بالا' : language === 'ku' ? 'بەرهەمهێنانی بەرز' : language === 'tr' ? 'Yüksek Verim' : 'High Yield'}
                </Badge>
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  🌱 {language === 'ar' ? 'سلامت خاک' : language === 'ku' ? 'تەندروستی خاک' : language === 'tr' ? 'Toprak Sağlığı' : 'Soil Health'}
                </Badge>
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  ♻️ {language === 'ar' ? 'مستدام' : language === 'ku' ? 'بەردەوام' : language === 'tr' ? 'Sürdürülebilir' : 'Sustainable'}
                </Badge>
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  🔬 {language === 'ar' ? 'علمی' : language === 'ku' ? 'زانستی' : language === 'tr' ? 'Bilimsel' : 'Scientific'}
                </Badge>
              </div>
            </div>
            <div className="lg:text-right">
              <img 
                src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="Agricultural Products - Modern Farming"
                className="w-full h-96 object-cover rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" dir={direction}>
              {content.benefitsTitle}
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto" dir={direction}>
              {content.benefitsDescription}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {content.benefits.map((benefit, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow border-2 hover:border-green-200">
                <CardContent className="p-0">
                  <div className={`w-20 h-20 ${benefit.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3" dir={direction}>{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed" dir={direction}>{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products Grid Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" dir={direction}>
              {language === 'ar' ? 'منتجاتنا الزراعية' : 
               language === 'ku' ? 'بەرهەمە کشتوکاڵییەکانمان' :
               language === 'tr' ? 'Tarımsal Ürünlerimiz' : 'Our Agricultural Products'}
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto" dir={direction}>
              {language === 'ar' ? 'مجموعة شاملة من المنتجات الزراعية عالية الجودة' : 
               language === 'ku' ? 'کۆمەڵەیەکی تەواو لە بەرهەمە کشتوکاڵییە بەرزەکان' :
               language === 'tr' ? 'Yüksek kaliteli tarımsal ürünlerin kapsamlı koleksiyonu' : 
               'Comprehensive collection of high-quality agricultural products'}
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products?.map((product) => {
                const stats = productStatsData?.[product.id];
                return (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-green-200">
                    <div className="relative">
                      <img 
                        src={product.image || "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80"} 
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-green-500 text-white">
                          {language === 'ar' ? 'جديد' : language === 'ku' ? 'نوێ' : language === 'tr' ? 'Yeni' : 'New'}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2" dir={direction}>{product.name}</h3>
                      <p className="text-gray-600 mb-4" dir={direction}>{product.description}</p>
                      
                      {stats && (
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm text-gray-600">
                              {stats.averageRating?.toFixed(1) || '5.0'} ({stats.totalReviews || 0})
                            </span>
                          </div>
                          <span className="text-green-600 font-semibold">
                            {product.price ? `$${product.price}` : language === 'ar' ? 'اتصل للسعر' : language === 'ku' ? 'بۆ نرخ پەیوەندی بکە' : language === 'tr' ? 'Fiyat için iletişime geçin' : 'Contact for Price'}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Link href={`/products/${product.slug}`} className="flex-1">
                          <Button className="w-full bg-green-600 hover:bg-green-700">
                            {language === 'ar' ? 'عرض التفاصيل' : language === 'ku' ? 'وردەکارییەکان ببینە' : language === 'tr' ? 'Detayları Görüntüle' : 'View Details'}
                          </Button>
                        </Link>
                        <Button variant="outline" size="icon" className="border-green-600 text-green-600 hover:bg-green-50">
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4" dir={direction}>
              {language === 'ar' ? 'مميزات منتجاتنا' : 
               language === 'ku' ? 'تایبەتمەندییەکانی بەرهەمەکانمان' :
               language === 'tr' ? 'Ürün Özelliklerimiz' : 'Product Features'}
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">🧪</div>
              <h4 className="font-semibold text-gray-900 mb-2" dir={direction}>
                {language === 'ar' ? 'مختبر علمياً' : language === 'ku' ? 'تاقیکراوەی زانستی' : language === 'tr' ? 'Bilimsel Olarak Test Edilmiş' : 'Laboratory Tested'}
              </h4>
              <p className="text-sm text-gray-600" dir={direction}>
                {language === 'ar' ? 'جودة عالية مضمونة' : language === 'ku' ? 'جۆری بەرزی دڵنیاکراو' : language === 'tr' ? 'Garantili yüksek kalite' : 'Guaranteed high quality'}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">🌍</div>
              <h4 className="font-semibold text-gray-900 mb-2" dir={direction}>
                {language === 'ar' ? 'صديق للبيئة' : language === 'ku' ? 'دۆستی ژینگە' : language === 'tr' ? 'Çevre Dostu' : 'Eco-Friendly'}
              </h4>
              <p className="text-sm text-gray-600" dir={direction}>
                {language === 'ar' ? 'يحافظ على جودة التربة' : language === 'ku' ? 'جۆری خاک پارێزراو دەکات' : language === 'tr' ? 'Toprak kalitesini korur' : 'Preserves soil quality'}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">📈</div>
              <h4 className="font-semibold text-gray-900 mb-2" dir={direction}>
                {language === 'ar' ? 'زيادة الإنتاجية' : language === 'ku' ? 'زیادکردنی بەرهەمهێنان' : language === 'tr' ? 'Verimlilik Artışı' : 'Increased Productivity'}
              </h4>
              <p className="text-sm text-gray-600" dir={direction}>
                {language === 'ar' ? 'تحسن المحصول بنسبة تصل إلى 40%' : language === 'ku' ? 'دانەوێڵە تا 40% باشتر دەکات' : language === 'tr' ? 'Ürünü %40\'a kadar iyileştirir' : 'Improves crop by up to 40%'}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-semibold text-gray-900 mb-2" dir={direction}>
                {language === 'ar' ? 'مناسب للعراق' : language === 'ku' ? 'گونجاو بۆ عێراق' : language === 'tr' ? 'Irak\'a Uygun' : 'Suitable for Iraq'}
              </h4>
              <p className="text-sm text-gray-600" dir={direction}>
                {language === 'ar' ? 'التربة والمناخ الإقليمي' : language === 'ku' ? 'خاک و کەشوهەوای هەرێمی' : language === 'tr' ? 'Bölgesel toprak ve iklim' : 'Regional soil and climate'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-green-600 to-emerald-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4" dir={direction}>
            {language === 'ar' ? 'ابدأ رحلتك الزراعية معنا' : 
             language === 'ku' ? 'گەشتی کشتوکاڵیت لەگەڵمان دەست پێ بکە' :
             language === 'tr' ? 'Bizimle tarımsal yolculuğunuza başlayın' : 'Start Your Agricultural Journey With Us'}
          </h2>
          <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto" dir={direction}>
            {language === 'ar' ? 'اتصل بخبرائنا للحصول على استشارة مجانية حول أفضل المنتجات لمحاصيلك' : 
             language === 'ku' ? 'پەیوەندی بە شارەزایانمانەوە بکە بۆ ڕاوێژکارییەکی خۆڕایی سەبارەت بە باشترین بەرهەمەکان بۆ دانەوێڵەکانت' :
             language === 'tr' ? 'Ürünleriniz için en iyi ürünler hakkında ücretsiz danışmanlık için uzmanlarımızla iletişime geçin' : 
             'Contact our experts for free consultation about the best products for your crops'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <ProductInquiryForm 
              productName={language === 'ar' ? 'المنتجات الزراعية' : language === 'ku' ? 'بەرهەمە کشتوکاڵییەکان' : language === 'tr' ? 'Tarımsal Ürünler' : 'Agricultural Products'}
              triggerText={language === 'ar' ? 'احصل على استشارة مجانية' : language === 'ku' ? 'ڕاوێژکارییەکی خۆڕایی وەربگرە' : language === 'tr' ? 'Ücretsiz Danışmanlık Alın' : 'Get Free Consultation'}
              triggerClassName="bg-white text-green-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
            />
            <Link href="/shop">
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-green-600 px-8 py-3 text-lg font-semibold">
                {language === 'ar' ? 'تصفح المتجر' : language === 'ku' ? 'فرۆشگا بگەڕێ' : language === 'tr' ? 'Mağazaya Gözat' : 'Browse Store'}
                <ArrowRight className={`h-5 w-5 ${direction === 'rtl' ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AgriculturalProductsPage;