import { CheckCircle, ArrowRight, Wheat, Sprout, TreePine, Leaf, Download, Image, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ProductInquiryForm } from "@/components/ui/product-inquiry-form";

import type { ShowcaseProduct } from "@shared/showcase-schema";
import MolecularHoverEffect from "@/components/ui/molecular-hover-effect";
// import ProductInquiryForm from "@/components/product-inquiry-form";

const AgriculturalFertilizersPage = () => {
  const [, navigate] = useLocation();
  
  const { data: products, isLoading } = useQuery<ShowcaseProduct[]>({
    queryKey: ["/api/products", "agricultural-fertilizers"],
    queryFn: () => fetch("/api/products?category=agricultural-fertilizers").then(res => res.json()),
  });

  const { data: productStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/shop/product-stats'],
    queryFn: () => fetch('/api/shop/product-stats').then(res => res.json()).then(data => data.data),
  });

  const benefits = [
    {
      icon: <Sprout className="h-8 w-8 text-white" />,
      title: "Enhanced Growth",
      description: "Optimized nutrient formulations for maximum crop yield and quality",
      bgColor: "bg-green-500"
    },
    {
      icon: <Leaf className="h-8 w-8 text-white" />,
      title: "Soil Health", 
      description: "Sustainable solutions that improve and maintain soil fertility",
      bgColor: "bg-emerald-600"
    },
    {
      icon: <TreePine className="h-8 w-8 text-white" />,
      title: "Eco-Friendly",
      description: "Environmentally responsible formulations for sustainable agriculture",
      bgColor: "bg-green-700"
    }
  ];

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
    <div className="min-h-screen bg-gray-50">
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
              <h1 className="text-5xl font-bold mb-6">محصولات کشاورزی پیشرفته</h1>
              <h2 className="text-3xl font-semibold mb-4 text-green-100">Advanced Agricultural Solutions</h2>
              <p className="text-xl text-green-100 mb-8">
                راه‌حل‌های پیشرفته کود شیمیایی برای بهبود عملکرد محصولات کشاورزی، ترویج شیوه‌های کشاورزی پایدار و تقویت سلامت خاک در عراق و خاورمیانه
              </p>
              <div className="flex flex-wrap gap-4 mb-6">
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  🌾 عملکرد بالا
                </Badge>
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  🌱 سلامت خاک
                </Badge>
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  ♻️ پایدار
                </Badge>
                <Badge className="bg-white/20 text-white border-0 px-4 py-2">
                  🔬 علمی
                </Badge>
              </div>
            </div>
            <div className="lg:text-right">
              <img 
                src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80" 
                alt="Agricultural Fertilizers - Modern Farming"
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">چرا محصولات کشاورزی ممتازکم؟</h2>
            <p className="text-xl text-green-600 font-semibold mb-2">Why Choose Momtazchem Agricultural Solutions?</p>
            <p className="text-gray-600 max-w-3xl mx-auto">
              فرمولاسیون علمی پیشرفته ما نتایج برتری برای کشاورزی مدرن ارائه می‌دهد و به بهبود عملکرد محصولات در شرایط آب و هوایی عراق کمک می‌کند
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow border-2 hover:border-green-200">
                <CardContent className="p-0">
                  <div className={`w-20 h-20 ${benefit.bgColor} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Additional Benefits Grid */}
          <div className="mt-16 grid md:grid-cols-4 gap-6">
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">🧪</div>
              <h4 className="font-semibold text-gray-900 mb-2">تست شده در آزمایشگاه</h4>
              <p className="text-sm text-gray-600">کیفیت بالا تضمین شده</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">🌍</div>
              <h4 className="font-semibold text-gray-900 mb-2">سازگار با محیط زیست</h4>
              <p className="text-sm text-gray-600">حفظ کیفیت خاک</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">📈</div>
              <h4 className="font-semibold text-gray-900 mb-2">افزایش عملکرد</h4>
              <p className="text-sm text-gray-600">تا 40% بهبود محصول</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">🎯</div>
              <h4 className="font-semibold text-gray-900 mb-2">مناسب برای عراق</h4>
              <p className="text-sm text-gray-600">خاک و آب و هوای منطقه</p>
            </div>
          </div>
        </div>
      </section>

      {/* Nutrients Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Essential Nutrients</h2>
            <p className="text-gray-600">Our fertilizers provide balanced nutrition for optimal plant growth</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {nutrients.map((nutrient, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-all duration-200">
                <div className="flex items-start">
                  <Badge className={`${nutrient.color} mr-4 mt-1`}>
                    {nutrient.name}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-gray-700">{nutrient.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Crop Types Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">انواع محصولات کشاورزی قابل پشتیبانی</h2>
            <p className="text-xl text-green-600 font-semibold mb-2">Suitable for All Iraqi Crop Types</p>
            <p className="text-gray-600 max-w-3xl mx-auto">
              محصولات ما برای انواع مختلف کشت در مناطق مختلف عراق طراحی شده‌اند و در شرایط آب و هوایی این منطقه بهترین نتایج را ارائه می‌دهند
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 hover:border-green-200">
              <div className="text-4xl mb-4 text-center">🌾</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">غلات و دانه‌ها</h3>
              <p className="text-sm text-gray-600 text-center mb-4">Cereals & Grains</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• گندم عراقی و بین‌المللی</li>
                <li>• جو و برنج</li>
                <li>• ذرت و سورگوم</li>
                <li>• فستق و آفتابگردان</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 hover:border-green-200">
              <div className="text-4xl mb-4 text-center">🥬</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">سبزیجات و حبوبات</h3>
              <p className="text-sm text-gray-600 text-center mb-4">Vegetables & Legumes</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• گوجه فرنگی و خیار</li>
                <li>• لوبیا و لپه</li>
                <li>• سیب‌زمینی و پیاز</li>
                <li>• سبزیجات برگی</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 hover:border-green-200">
              <div className="text-4xl mb-4 text-center">🌳</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">درختان میوه</h3>
              <p className="text-sm text-gray-600 text-center mb-4">Fruit Trees</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• خرما و انجیر</li>
                <li>• مرکبات و انار</li>
                <li>• انگور و بادام</li>
                <li>• زیتون و سیب</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 hover:border-green-200">
              <div className="text-4xl mb-4 text-center">🏭</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">محصولات صنعتی</h3>
              <p className="text-sm text-gray-600 text-center mb-4">Industrial Crops</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• پنبه و کتان</li>
                <li>• نیشکر و چغندرقند</li>
                <li>• کلزا و کنجد</li>
                <li>• گیاهان دارویی</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 hover:border-green-200">
              <div className="text-4xl mb-4 text-center">🌿</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">مراتع و علوفه</h3>
              <p className="text-sm text-gray-600 text-center mb-4">Pasture & Forage</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• یونجه و شبدر</li>
                <li>• علف‌های مرتعی</li>
                <li>• ذرت علوفه‌ای</li>
                <li>• چمن و فضای سبز</li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-2 hover:border-green-200">
              <div className="text-4xl mb-4 text-center">⭐</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">محصولات ویژه</h3>
              <p className="text-sm text-gray-600 text-center mb-4">Specialty Crops</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• زعفران و گل محمدی</li>
                <li>• گیاهان گلخانه‌ای</li>
                <li>• کشت بدون خاک</li>
                <li>• کشت ارگانیک</li>
              </ul>
            </div>
          </div>
          
          {/* Climate Suitability */}
          <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">سازگاری با شرایط آب و هوایی عراق</h3>
              <p className="text-green-600 font-semibold">Climate Adaptability for Iraqi Conditions</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl mb-3">🌡️</div>
                <h4 className="font-semibold text-gray-900 mb-2">تحمل گرمای بالا</h4>
                <p className="text-sm text-gray-600">مناسب برای تابستان‌های گرم عراق تا 50 درجه سانتیگراد</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">💧</div>
                <h4 className="font-semibold text-gray-900 mb-2">بهینه‌سازی مصرف آب</h4>
                <p className="text-sm text-gray-600">کاهش نیاز آبی تا 30% در شرایط خشکسالی</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🧂</div>
                <h4 className="font-semibold text-gray-900 mb-2">مقاومت به شوری</h4>
                <p className="text-sm text-gray-600">مناسب برای خاک‌های شور مناطق جنوبی عراق</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Agricultural Fertilizer Products</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover our comprehensive range of fertilizer solutions for modern agriculture
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-white">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="space-y-2">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products?.map((product) => (
                <MolecularHoverEffect key={product.id} moleculeType="ammonia" className="h-full">
                  <Card className="group bg-white hover:shadow-xl hover:shadow-glow-green transition-all duration-500 border border-gray-200 hover:border-green-300 overflow-hidden h-full">
                    {product.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      
                      {/* Star Rating Display - Bottom Left Corner - Always Show */}
                      <div className="absolute bottom-2 left-2">
                        <div 
                          className="bg-white/90 backdrop-blur-sm rounded-md px-2 py-1 shadow-sm border border-yellow-200/50 cursor-pointer hover:bg-yellow-50/80 transition-colors"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/product-reviews/${product.id}`);
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <div className="flex">
                              {[1,2,3,4,5].map((starNum) => {
                                // Show loading state with pulse animation
                                if (statsLoading) {
                                  return (
                                    <Star 
                                      key={starNum}
                                      className="w-3 h-3 fill-gray-300 text-gray-300 animate-pulse"
                                    />
                                  );
                                }
                                
                                const stats = productStatsData?.[product.id];
                                const hasReviews = stats && stats.totalReviews > 0;
                                const rating = hasReviews ? stats.averageRating : 0;
                                
                                return (
                                  <Star 
                                    key={starNum}
                                    className={`w-3 h-3 ${
                                      hasReviews 
                                        ? (starNum <= Math.floor(rating) 
                                            ? 'fill-yellow-400 text-yellow-400' 
                                            : starNum <= Math.ceil(rating)
                                            ? 'fill-yellow-200 text-yellow-200'
                                            : 'fill-gray-200 text-gray-200')
                                        : 'fill-gray-200 text-gray-200 hover:fill-yellow-300'
                                    }`}
                                  />
                                );
                              })}
                            </div>
                            <span className="text-xs text-gray-600">
                              {statsLoading ? '...' : (productStatsData?.[product.id]?.totalReviews > 0 
                                ? productStatsData[product.id].averageRating.toFixed(1)
                                : 'نظر')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${
                          product.inventoryStatus === 'in_stock' ? 'bg-green-500' :
                          product.inventoryStatus === 'low_stock' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-xs text-gray-500 capitalize">
                          {product.inventoryStatus?.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    
                    {product.description && (
                      <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>
                    )}
                    
                    {product.features && Array.isArray(product.features) && product.features.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                        <ul className="space-y-2">
                          {(product.features as any[]).map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center text-gray-700">
                              <CheckCircle className="h-4 w-4 text-secondary mr-3 flex-shrink-0" />
                              {String(feature)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {product.applications && Array.isArray(product.applications) && product.applications.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Applications:</h4>
                        <div className="flex flex-wrap gap-2">
                          {(product.applications as any[]).map((app, appIndex) => (
                            <span key={appIndex} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                              {String(app)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3 mt-6">
                      {product.imageUrl && (
                        <Badge variant="outline" className="text-xs">
                          <Image className="w-3 h-3 mr-1" />
                          Image Available
                        </Badge>
                      )}
                      {product.pdfCatalogUrl && (
                        <a 
                          href={product.pdfCatalogUrl} 
                          download={`${product.name}_catalog.pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex"
                        >
                          <Badge variant="outline" className="text-xs hover:bg-green-50 hover:text-green-600 cursor-pointer transition-colors">
                            <Download className="w-3 h-3 mr-1" />
                            Download Catalog
                          </Badge>
                        </a>
                      )}
                    </div>
                    
                    <div className="mt-6">
                      <ProductInquiryForm 
                        product={product}
                        triggerText="Get Quote"
                        triggerVariant="default"
                        triggerSize="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      />
                    </div>
                  </CardContent>
                </Card>
                </MolecularHoverEffect>
              ))}
            </div>
          )}

          {!isLoading && (!products || products.length === 0) && (
            <div className="text-center py-12">
              <Wheat className="h-24 w-24 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Agricultural Fertilizer Products Yet</h3>
              <p className="text-gray-500 mb-6">Our agricultural fertilizer catalog is being updated. Please check back soon.</p>
              <Link href="/contact">
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Contact Us for Information
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Technical Information Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">اطلاعات فنی و کاربردی</h2>
            <p className="text-xl text-blue-600 font-semibold mb-2">Technical Information & Application Guide</p>
            <p className="text-gray-600 max-w-3xl mx-auto">
              راهنمای کامل استفاده از محصولات کشاورزی ممتازکم برای بهترین نتایج در شرایط کشاورزی عراق
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">🧪</span>
                </div>
                ترکیبات شیمیایی اصلی
              </h3>
              <div className="space-y-4">
                <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="font-semibold text-gray-800">نیتروژن (N): 15-20%</span>
                  <span className="text-sm text-gray-600 mr-2">- رشد برگ و ساقه</span>
                </div>
                <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="font-semibold text-gray-800">فسفر (P): 8-12%</span>
                  <span className="text-sm text-gray-600 mr-2">- تقویت ریشه</span>
                </div>
                <div className="flex items-center p-3 bg-orange-50 rounded-lg">
                  <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                  <span className="font-semibold text-gray-800">پتاسیم (K): 10-15%</span>
                  <span className="text-sm text-gray-600 mr-2">- مقاومت به بیماری</span>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="font-semibold text-gray-800">ریزمغذی‌ها: 2-5%</span>
                  <span className="text-sm text-gray-600 mr-2">- آهن، منگنز، روی</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold">📋</span>
                </div>
                دستورالعمل مصرف
              </h3>
              <div className="space-y-4">
                <div className="border-r-4 border-green-500 pr-4">
                  <h4 className="font-semibold text-gray-900 mb-2">💧 آبیاری قبل از کود</h4>
                  <p className="text-sm text-gray-600">خاک را 24 ساعت قبل از کودپاشی مرطوب کنید</p>
                </div>
                <div className="border-r-4 border-blue-500 pr-4">
                  <h4 className="font-semibold text-gray-900 mb-2">⚖️ مقدار مصرف</h4>
                  <p className="text-sm text-gray-600">25-50 کیلوگرم در هکتار بسته به نوع خاک</p>
                </div>
                <div className="border-r-4 border-yellow-500 pr-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🕐 زمان بهینه</h4>
                  <p className="text-sm text-gray-600">صبح زود یا عصر برای جلوگیری از تبخیر</p>
                </div>
                <div className="border-r-4 border-purple-500 pr-4">
                  <h4 className="font-semibold text-gray-900 mb-2">🔄 تکرار مصرف</h4>
                  <p className="text-sm text-gray-600">هر 3-4 هفته در فصل رشد</p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Guide */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">راهنمای کاربرد بر اساس نوع خاک عراق</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-yellow-50 rounded-xl">
                <div className="text-4xl mb-4">🏜️</div>
                <h4 className="font-bold text-gray-900 mb-3">خاک‌های شنی (صحرا)</h4>
                <ul className="text-sm text-gray-600 space-y-2 text-right">
                  <li>• مصرف بیشتر: 40-50 کیلوگرم/هکتار</li>
                  <li>• آبیاری مکرر پس از کود</li>
                  <li>• استفاده از کود کند رهش</li>
                  <li>• مناطق: الانبار، نجف، کربلا</li>
                </ul>
              </div>
              
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="text-4xl mb-4">🌱</div>
                <h4 className="font-bold text-gray-900 mb-3">خاک‌های رسی (حاصلخیز)</h4>
                <ul className="text-sm text-gray-600 space-y-2 text-right">
                  <li>• مصرف متوسط: 25-35 کیلوگرم/هکتار</li>
                  <li>• آبیاری معتدل</li>
                  <li>• کود مایع در کنار جامد</li>
                  <li>• مناطق: بغداد، دیاله، میسان</li>
                </ul>
              </div>
              
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="text-4xl mb-4">💧</div>
                <h4 className="font-bold text-gray-900 mb-3">خاک‌های شور (جنوب)</h4>
                <ul className="text-sm text-gray-600 space-y-2 text-right">
                  <li>• کود مقاوم به شوری</li>
                  <li>• شستشوی خاک قبل از کود</li>
                  <li>• افزودن مواد اصلاح‌کننده</li>
                  <li>• مناطق: بصره، ذی‌قار، واسط</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Success Stories */}
          <div className="mt-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">نتایج موثق کشاورزان عراق</h3>
              <p className="text-green-100">Real Results from Iraqi Farmers</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-2">+42%</div>
                <p className="text-sm">افزایش محصول گندم در استان نینوا</p>
              </div>
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-2">-30%</div>
                <p className="text-sm">کاهش مصرف آب در مزارع خرما</p>
              </div>
              <div className="bg-white/10 rounded-lg p-6 text-center">
                <div className="text-3xl font-bold mb-2">+65%</div>
                <p className="text-sm">بهبود کیفیت محصولات سبزیجات</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1592982124091-833c0e19487f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2000&q=80" 
            alt="Agricultural Success - Iraqi Farmland"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-4">آماده‌اید محصولتان را افزایش دهید؟</h2>
            <p className="text-2xl text-green-100 font-semibold mb-2">Ready to Boost Your Iraqi Harvest?</p>
            <p className="text-xl text-green-100 max-w-3xl mx-auto">
              با متخصصان کشاورزی ممتازکم تماس بگیرید و بهترین توصیه‌های کودی و مشاوره تخصصی کشاورزی را برای شرایط عراق دریافت کنید
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">🌾</div>
              <h3 className="text-lg font-semibold mb-2">مشاوره رایگان</h3>
              <p className="text-sm text-green-100">تماس با کارشناسان کشاورزی</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">📞</div>
              <h3 className="text-lg font-semibold mb-2">پشتیبانی 24/7</h3>
              <p className="text-sm text-green-100">همه روزه در خدمت شما</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl mb-3">🚚</div>
              <h3 className="text-lg font-semibold mb-2">تحویل سریع</h3>
              <p className="text-sm text-green-100">ارسال به سراسر عراق</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/contact">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 font-bold px-8 py-4 text-lg">
                مشاوره کشاورزی رایگان
                <ArrowRight className="mr-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/shop">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-green-600 font-bold px-8 py-4 text-lg">
                مشاهده فروشگاه آنلاین
                <Wheat className="mr-3 h-6 w-6" />
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-4">تماس مستقیم با تیم فنی</h3>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <div className="text-center">
                <p className="text-green-100">شماره تماس:</p>
                <p className="text-xl font-bold">+964 770 123 4567</p>
              </div>
              <div className="text-center">
                <p className="text-green-100">ایمیل:</p>
                <p className="text-xl font-bold">agriculture@momtazchem.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Chat Support */}

    </div>
  );
};

export default AgriculturalFertilizersPage;