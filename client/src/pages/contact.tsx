import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertContactSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useMultilingualToast } from "@/hooks/use-multilingual-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Phone, Mail, Clock, IdCard, Briefcase } from "lucide-react";
import OpenGraphTags from "@/components/seo/OpenGraphTags";
import CanonicalUrl from "@/components/seo/CanonicalUrl";

interface ContentItem {
  id: number;
  section: string;
  key: string;
  content: string;
  language: string;
  contentType: string;
}

const Contact = () => {
  const { toast } = useMultilingualToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { language, t, direction } = useLanguage();

  // Map language codes to content management language codes
  const getLanguageCode = () => {
    switch(language) {
      case 'ar': return 'ar';
      case 'ku': return 'ku';
      default: return 'en';
    }
  };

  // Fetch content from Content Management
  const { data: contentResponse, isLoading } = useQuery<{success: boolean, data: ContentItem[]}>({
    queryKey: ['/api/content-management/items'],
    queryFn: async () => {
      const response = await fetch('/api/content-management/items');
      if (!response.ok) throw new Error('Failed to fetch content');
      return response.json();
    }
  });

  const contentItems = contentResponse?.data || [];

  // Filter content for contact section
  const contactContent = contentItems.filter(item => 
    item.section === 'contact' && item.language === getLanguageCode()
  );

  const getContent = (key: string, fallback: string = '') => {
    const item = contactContent.find(item => item.key === key);
    return item?.content || fallback;
  };

  const form = useForm({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      productInterest: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/contact", { method: "POST", body: data });
    },
    onSuccess: () => {
      toast({
        title: 'contactPage.messageSent' as any,
        description: 'contactPage.messageSentDesc' as any,
      });
      form.reset();
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: 'contactPage.errorTitle' as any,
        description: 'contactPage.errorDesc' as any,
        variant: 'destructive',
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    contactMutation.mutate(data);
  };

  const contactInfo = [
    {
      icon: <MapPin className="h-6 w-6 text-white" />,
      title: getContent('address_title', 'Headquarters'),
      content: [
        getContent('address_line1', 'Momtazchem Company'),
        getContent('address_line2', 'Erbil'),
        getContent('address_line3', 'Chemical Manufacturing Facility')
      ],
      bgColor: "bg-primary-blue",
      link: getContent('address_map_link', 'https://maps.app.goo.gl/umCmoKpmaovSkTJ96')
    },
    {
      icon: <Phone className="h-6 w-6 text-white" />,
      title: getContent('phone_title', 'Phone & WhatsApp'),
      content: [
        getContent('phone_number', '+9647709996771'),
        getContent('phone_availability', 'Available on WhatsApp')
      ],
      bgColor: "bg-primary-green"
    },
    {
      icon: <Mail className="h-6 w-6 text-white" />,
      title: getContent('email_title', 'Email'),
      content: [
        getContent('email_info', 'info@momtazchem.com'),
        getContent('email_sales', 'sales@momtazchem.com'),
        getContent('email_support', 'support@momtazchem.com')
      ],
      bgColor: "bg-accent-orange"
    },
    {
      icon: <Clock className="h-6 w-6 text-white" />,
      title: getContent('hours_title', 'Business Hours'),
      content: [
        getContent('hours_weekdays', 'Monday - Friday: 8:00 AM - 6:00 PM'),
        getContent('hours_saturday', 'Saturday: 9:00 AM - 1:00 PM')
      ],
      bgColor: "bg-primary-blue"
    },
    {
      icon: <Briefcase className="h-6 w-6 text-white" />,
      title: getContent('career_title', 'Career Opportunities'),
      content: [
        getContent('career_line1', 'Join our growing team'),
        getContent('career_line2', 'Chemical Engineers, Lab Technicians'),
        getContent('career_line3', 'Sales Representatives, Quality Control')
      ],
      bgColor: "bg-green-600",
      link: getContent('career_email', 'mailto:careers@momtazchem.com')
    }
  ];

  return (
    <div className="pt-20" dir={direction}>
      <OpenGraphTags
        title="Contact Momtazchem - Get Expert Chemical Solutions Support"
        description="Reach out to Momtazchem for chemical product inquiries, technical support, quotes, and consultations. Available 24/7. Email, phone, and office locations in Iraq and worldwide."
        type="website"
        image="https://momtazchem.com/og-contact.jpg"
        locale="en_US"
      />
      <CanonicalUrl path="/contact" />
      
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {getContent('hero_title', 'Get In Touch')}
            </h1>
            <p className="text-xl max-w-3xl mx-auto">
              {getContent('hero_subtitle', 'Ready to discuss your chemical solution needs? Our team of experts is here to help you find the perfect solution for your industry.')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-gray-50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {getContent('form_title', 'Send Us a Message')}
              </h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.contactPage.firstName}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.contactPage.firstNamePlaceholder} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.contactPage.lastName}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.contactPage.lastNamePlaceholder} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.contactPage.emailAddress}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder={t.contactPage.emailPlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.contactPage.company}</FormLabel>
                        <FormControl>
                          <Input placeholder={t.contactPage.companyPlaceholder} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="productInterest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.contactPage.productInterest}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t.contactPage.productInterestPlaceholder} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="water-treatment">{t.contactPage.waterTreatment}</SelectItem>
                            <SelectItem value="fuel-additives">{t.contactPage.fuelAdditives}</SelectItem>
                            <SelectItem value="paint-thinner">{t.contactPage.paintThinner}</SelectItem>
                            <SelectItem value="agricultural-fertilizers">{t.contactPage.agriculturalFertilizers}</SelectItem>
                            <SelectItem value="industrial-chemicals">{t.contactPage.industrialChemicals}</SelectItem>
                            <SelectItem value="technical-equipment">{t.contactPage.technicalEquipment}</SelectItem>
                            <SelectItem value="commercial-goods">{t.contactPage.commercialGoods}</SelectItem>
                            <SelectItem value="custom-solutions">{t.contactPage.customSolutions}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t.contactPage.message}</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={4} 
                            placeholder={t.contactPage.messagePlaceholder} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary-blue hover:bg-primary-blue-dark" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t.contactPage.sending : t.contactPage.sendMessage}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.contactPage.contactInformation}</h2>
                
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start">
                      <div className={`w-12 h-12 ${info.bgColor} rounded-lg flex items-center justify-center mr-4 flex-shrink-0`}>
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                        {info.content.map((line, lineIndex) => (
                          <div key={lineIndex} className="text-gray-600">
                            {info.title === "Phone & WhatsApp" ? (
                              line.includes("+9647709996771") ? (
                                <div className="flex items-center gap-2">
                                  <a 
                                    href={`tel:${line.replace(/\s+/g, '')}`}
                                    className="hover:text-primary transition-colors duration-200 cursor-pointer"
                                  >
                                    {line}
                                  </a>
                                  <a
                                    href="https://wa.me/9647709996771"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors duration-200"
                                  >
                                    <i className="fab fa-whatsapp mr-1"></i>
                                    WhatsApp
                                  </a>
                                </div>
                              ) : (
                                <span>{line}</span>
                              )
                            ) : info.title === "Email" ? (
                              <a 
                                href={`mailto:${line}`}
                                className="hover:text-primary transition-colors duration-200 cursor-pointer"
                              >
                                {line}
                              </a>
                            ) : info.title === "Career Opportunities" && info.link ? (
                              <a 
                                href={info.link}
                                className="hover:text-primary transition-colors duration-200 cursor-pointer"
                              >
                                {line}
                              </a>
                            ) : info.title === "Headquarters" && info.link ? (
                              <a 
                                href={info.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary transition-colors duration-200 cursor-pointer"
                              >
                                {line}
                              </a>
                            ) : (
                              line
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <IdCard className={`h-5 w-5 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
                  {t.contactPage.ourCertifications}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg">
                    <i className="fas fa-certificate text-primary text-2xl mb-2"></i>
                    <div className="text-sm font-medium">ISO 9001:2015</div>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg">
                    <i className="fas fa-shield-alt text-secondary text-2xl mb-2"></i>
                    <div className="text-sm font-medium">ISO 14001</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.contactPage.findUs}</h2>
            <p className="text-xl text-gray-600">{t.contactPage.visitHeadquarters}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative">
              <div className="h-96 rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d12885.5!2d43.882198296180086!3d36.15782506411755!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzbCsDA5JzI4LjEiTiA0M8KwNTInNTUuOSJF!5e0!3m2!1sen!2s!4v1649123456789"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Momtazchem Location - Erbil"
                ></iframe>

                
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-6 w-6 text-red-500" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Momtazchem Company</h3>
                      <p className="text-sm text-gray-600">Chemical Manufacturing Facility</p>
                      <p className="text-xs text-gray-500">36.1578°N, 43.8822°E</p>
                      <p className="text-xs text-gray-400">Erbil, Kurdistan Region, Iraq</p>
                      <a
                        href="https://maps.app.goo.gl/umCmoKpmaovSkTJ96"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-blue hover:text-primary-blue-dark text-sm font-medium"
                      >
                        {t.contactPage.viewInMaps} {direction === 'rtl' ? '←' : '→'}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Momtazchem Headquarters</h3>
                  <p className="text-gray-600">Erbil</p>
                </div>
                <a
                  href="https://maps.app.goo.gl/ngapesxcH4XiT4L26"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary-blue hover:bg-primary-blue-dark text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {t.contactPage.getDirections}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
