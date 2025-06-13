import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Building2,
  Users,
  MessageSquare
} from "lucide-react";

export default function ContactPage() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    productInterest: "",
    message: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: t('contactPage.form.success'),
          description: isRTL ? "سنتواصل معك قريباً" : "We'll get back to you soon",
        });
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          company: "",
          productInterest: "",
          message: ""
        });
      } else {
        throw new Error("Failed to send message");
      }
    } catch (error) {
      toast({
        title: t('contactPage.form.error'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: MapPin,
      title: t('contactPage.address'),
      content: isRTL ? "بغداد، العراق" : "Baghdad, Iraq",
      subContent: isRTL ? "المنطقة الصناعية - الطريق السريع" : "Industrial Zone - Highway Road"
    },
    {
      icon: Phone,
      title: t('contactPage.phone'),
      content: "+964 770 123 4567",
      subContent: "+964 750 987 6543"
    },
    {
      icon: Mail,
      title: t('contactPage.email'),
      content: "info@al-intaj.com",
      subContent: "sales@al-intaj.com"
    },
    {
      icon: Clock,
      title: t('contactPage.hours'),
      content: isRTL ? "الأحد - الخميس: 8:00 ص - 6:00 م" : "Sunday - Thursday: 8:00 AM - 6:00 PM",
      subContent: isRTL ? "الجمعة: 8:00 ص - 1:00 م" : "Friday: 8:00 AM - 1:00 PM"
    }
  ];

  const productCategories = [
    { value: "industrial-chemicals", label: isRTL ? "المواد الكيميائية الصناعية" : "Industrial Chemicals" },
    { value: "water-treatment", label: isRTL ? "معالجة المياه" : "Water Treatment" },
    { value: "fertilizers", label: isRTL ? "الأسمدة" : "Fertilizers" },
    { value: "additives", label: isRTL ? "المضافات" : "Additives" },
    { value: "pool-chemicals", label: isRTL ? "كيماويات المسابح" : "Pool Chemicals" },
    { value: "other", label: isRTL ? "أخرى" : "Other" }
  ];

  return (
    <div className={`min-h-screen ${isRTL ? 'font-arabic' : ''}`}>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-900 to-purple-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {t('contactPage.title')}
            </h1>
            <p className="text-xl text-blue-100">
              {t('contactPage.subtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactInfo.map((info, index) => {
              const IconComponent = info.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                      <IconComponent className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      {info.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      {info.content}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      {info.subContent}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Contact Form and Company Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                  {t('contactPage.form.title')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">{t('contactPage.form.firstName')}</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">{t('contactPage.form.lastName')}</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">{t('contactPage.form.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="company">{t('contactPage.form.company')}</Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="productInterest">{t('contactPage.form.productInterest')}</Label>
                    <Select onValueChange={(value) => handleInputChange('productInterest', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={isRTL ? "اختر فئة المنتج" : "Select product category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {productCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="message">{t('contactPage.form.message')}</Label>
                    <Textarea
                      id="message"
                      rows={5}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? (
                      t('contactPage.form.sending')
                    ) : (
                      <>
                        <Send className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('contactPage.form.send')}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Company Information */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-green-600" />
                    {isRTL ? "معلومات الشركة" : "Company Information"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {t('companyName')}
                      </h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        {isRTL ? 
                          "شركة رائدة في مجال توفير المواد الكيميائية والحلول الصناعية المتخصصة للعديد من القطاعات الصناعية في العراق والمنطقة." :
                          "A leading company in providing chemical materials and specialized industrial solutions for various industrial sectors in Iraq and the region."
                        }
                      </p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                        {isRTL ? "خدماتنا الرئيسية:" : "Our Main Services:"}
                      </h5>
                      <ul className="text-gray-600 dark:text-gray-400 space-y-1">
                        <li>• {isRTL ? "توريد المواد الكيميائية الصناعية" : "Industrial chemical supply"}</li>
                        <li>• {isRTL ? "حلول معالجة المياه" : "Water treatment solutions"}</li>
                        <li>• {isRTL ? "الاستشارات التقنية" : "Technical consulting"}</li>
                        <li>• {isRTL ? "الدعم الفني المتخصص" : "Specialized technical support"}</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-purple-600" />
                    {isRTL ? "لماذا تختارنا؟" : "Why Choose Us?"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{isRTL ? "خبرة أكثر من 15 عاماً في السوق العراقي" : "Over 15 years of experience in the Iraqi market"}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{isRTL ? "منتجات عالية الجودة معتمدة دولياً" : "High-quality internationally certified products"}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{isRTL ? "فريق تقني متخصص ومدرب" : "Specialized and trained technical team"}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>{isRTL ? "أسعار تنافسية وشروط دفع مرنة" : "Competitive prices and flexible payment terms"}</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}