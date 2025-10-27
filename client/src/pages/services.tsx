import { FlaskRound, Truck, Headphones, Users, Globe, Award, CheckCircle, Settings, Mail, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

const Services = () => {
  const { t, direction } = useLanguage();
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isQuoteDialogOpen, setIsQuoteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    message: ""
  });

  const [quoteForm, setQuoteForm] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
    productCategory: "",
    quantity: "",
    specifications: "",
    timeline: "",
    message: ""
  });

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("/api/contact/sales", "POST", {
        ...contactForm,
        type: "sales_inquiry",
        to: "sales@momtazchem.com"
      });

      toast({
        title: t.servicesPage.messageSent,
        description: t.servicesPage.messageSentDesc,
      });

      setContactForm({
        name: "",
        email: "",
        company: "",
        phone: "",
        message: ""
      });
      setIsContactDialogOpen(false);
    } catch (error) {
      toast({
        title: t.servicesPage.errorTitle,
        description: t.servicesPage.messageFailed,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("/api/contact/quote", "POST", {
        ...quoteForm,
        type: "quote_request",
        to: "sales@momtazchem.com"
      });

      toast({
        title: t.servicesPage.quoteSubmitted,
        description: t.servicesPage.quoteSubmittedDesc,
      });

      setQuoteForm({
        name: "",
        email: "",
        company: "",
        phone: "",
        productCategory: "",
        quantity: "",
        specifications: "",
        timeline: "",
        message: ""
      });
      setIsQuoteDialogOpen(false);
    } catch (error) {
      toast({
        title: t.servicesPage.errorTitle,
        description: t.servicesPage.quoteFailed,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    {
      icon: <FlaskRound className="h-8 w-8 text-white" />,
      title: t.servicesPage.rdTitle,
      description: t.servicesPage.rdDesc,
      features: [
        t.servicesPage.rdFeature1,
        t.servicesPage.rdFeature2,
        t.servicesPage.rdFeature3,
        t.servicesPage.rdFeature4,
        t.servicesPage.rdFeature5,
        t.servicesPage.rdFeature6
      ],
      bgColor: "bg-primary-blue"
    },
    {
      icon: <Truck className="h-8 w-8 text-white" />,
      title: t.servicesPage.distributionTitle,
      description: t.servicesPage.distributionDesc,
      features: [
        t.servicesPage.distFeature1,
        t.servicesPage.distFeature2,
        t.servicesPage.distFeature3,
        t.servicesPage.distFeature4,
        t.servicesPage.distFeature5,
        t.servicesPage.distFeature6
      ],
      bgColor: "bg-primary-green"
    },
    {
      icon: <Headphones className="h-8 w-8 text-white" />,
      title: t.servicesPage.techSupportTitle,
      description: t.servicesPage.techSupportDesc,
      features: [
        t.servicesPage.techFeature1,
        t.servicesPage.techFeature2,
        t.servicesPage.techFeature3,
        t.servicesPage.techFeature4,
        t.servicesPage.techFeature5,
        t.servicesPage.techFeature6
      ],
      bgColor: "bg-accent-orange"
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: t.servicesPage.consultingTitle,
      description: t.servicesPage.consultingDesc,
      features: [
        t.servicesPage.consultFeature1,
        t.servicesPage.consultFeature2,
        t.servicesPage.consultFeature3,
        t.servicesPage.consultFeature4,
        t.servicesPage.consultFeature5,
        t.servicesPage.consultFeature6
      ],
      bgColor: "bg-primary-blue"
    },
    {
      icon: <Award className="h-8 w-8 text-white" />,
      title: t.servicesPage.qaTitle,
      description: t.servicesPage.qaDesc,
      features: [
        t.servicesPage.qaFeature1,
        t.servicesPage.qaFeature2,
        t.servicesPage.qaFeature3,
        t.servicesPage.qaFeature4,
        t.servicesPage.qaFeature5,
        t.servicesPage.qaFeature6
      ],
      bgColor: "bg-primary-green"
    },
    {
      icon: <Settings className="h-8 w-8 text-white" />,
      title: t.servicesPage.customMfgTitle,
      description: t.servicesPage.customMfgDesc,
      features: [
        t.servicesPage.customFeature1,
        t.servicesPage.customFeature2,
        t.servicesPage.customFeature3,
        t.servicesPage.customFeature4,
        t.servicesPage.customFeature5,
        t.servicesPage.customFeature6
      ],
      bgColor: "bg-accent-orange"
    }
  ];

  const capabilities = [
    {
      title: t.servicesPage.advManufacturing,
      description: t.servicesPage.advManufacturingDesc,
      icon: <Settings className="h-6 w-6 text-primary" />
    },
    {
      title: t.servicesPage.qualityControl,
      description: t.servicesPage.qualityControlDesc,
      icon: <CheckCircle className="h-6 w-6 text-primary" />
    },
    {
      title: t.servicesPage.globalReachCap,
      description: t.servicesPage.globalReachCapDesc,
      icon: <Globe className="h-6 w-6 text-primary" />
    },
    {
      title: t.servicesPage.expertTeam,
      description: t.servicesPage.expertTeamDesc,
      icon: <Users className="h-6 w-6 text-primary" />
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-primary to-secondary text-white" dir={direction}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{t.servicesPage.title}</h1>
            <p className="text-xl max-w-3xl mx-auto">
              {t.servicesPage.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white" dir={direction}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-8 hover:shadow-lg transition-shadow duration-300">
                <div className={`w-16 h-16 ${service.bgColor} rounded-lg flex items-center justify-center mb-6`}>
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{service.title}</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-700">
                      <CheckCircle className={`h-4 w-4 text-secondary ${direction === 'rtl' ? 'ml-3' : 'mr-3'} flex-shrink-0`} />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities Overview */}
      <section className="py-20 bg-gray-50" dir={direction}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.servicesPage.coreCapabilities}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.servicesPage.coreCapabilitiesDesc}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {capabilities.map((capability, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-lg text-center">
                <div className="flex justify-center mb-4">
                  {capability.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{capability.title}</h3>
                <p className="text-gray-600 text-sm">{capability.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-white" dir={direction}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t.servicesPage.serviceProcess}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.servicesPage.serviceProcessDesc}
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.servicesPage.consultation}</h3>
              <p className="text-gray-600 text-sm">{t.servicesPage.consultationDesc}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-green text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.servicesPage.development}</h3>
              <p className="text-gray-600 text-sm">{t.servicesPage.developmentDesc}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-orange text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.servicesPage.testing}</h3>
              <p className="text-gray-600 text-sm">{t.servicesPage.testingDesc}</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="font-semibold text-gray-900 mb-2">{t.servicesPage.delivery}</h3>
              <p className="text-gray-600 text-sm">{t.servicesPage.deliveryDesc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white" dir={direction}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">{t.servicesPage.readyToStart}</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            {t.servicesPage.contactExpertsDesc}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setIsContactDialogOpen(true)}
              className="bg-[#f4cc19] hover:bg-primary-blue-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              <Mail className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
              {t.servicesPage.contactSales}
            </Button>
            <Button 
              onClick={() => setIsQuoteDialogOpen(true)}
              variant="outline"
              className="h-10 border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 rounded-lg font-semibold transition-all duration-200 bg-[#a0c514]"
            >
              <FileText className={`h-4 w-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
              {t.servicesPage.requestQuote}
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Sales Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-md" dir={direction}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {t.servicesPage.contactSalesTitle}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <Label htmlFor="contact-name">{t.servicesPage.fullName} *</Label>
              <Input
                id="contact-name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact-email">{t.servicesPage.emailAddress} *</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact-company">{t.servicesPage.companyName}</Label>
              <Input
                id="contact-company"
                value={contactForm.company}
                onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">{t.servicesPage.phoneNumber}</Label>
              <Input
                id="contact-phone"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact-message">{t.servicesPage.message} *</Label>
              <Textarea
                id="contact-message"
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder={t.servicesPage.messagePlaceholder}
                rows={4}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                {t.servicesPage.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? t.servicesPage.sending : t.servicesPage.sendMessage}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quote Request Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir={direction}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t.servicesPage.requestQuoteTitle}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quote-name">{t.servicesPage.fullName} *</Label>
                <Input
                  id="quote-name"
                  value={quoteForm.name}
                  onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quote-email">{t.servicesPage.emailAddress} *</Label>
                <Input
                  id="quote-email"
                  type="email"
                  value={quoteForm.email}
                  onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quote-company">{t.servicesPage.companyName} *</Label>
                <Input
                  id="quote-company"
                  value={quoteForm.company}
                  onChange={(e) => setQuoteForm({ ...quoteForm, company: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quote-phone">{t.servicesPage.phoneNumber}</Label>
                <Input
                  id="quote-phone"
                  value={quoteForm.phone}
                  onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="quote-category">{t.servicesPage.productCategory} *</Label>
              <Input
                id="quote-category"
                value={quoteForm.productCategory}
                onChange={(e) => setQuoteForm({ ...quoteForm, productCategory: e.target.value })}
                placeholder={t.servicesPage.productCategoryPlaceholder}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quote-quantity">{t.servicesPage.requiredQuantity} *</Label>
                <Input
                  id="quote-quantity"
                  value={quoteForm.quantity}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })}
                  placeholder={t.servicesPage.quantityPlaceholder}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quote-timeline">{t.servicesPage.requiredTimeline}</Label>
                <Input
                  id="quote-timeline"
                  value={quoteForm.timeline}
                  onChange={(e) => setQuoteForm({ ...quoteForm, timeline: e.target.value })}
                  placeholder={t.servicesPage.timelinePlaceholder}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="quote-specifications">{t.servicesPage.productSpecs} *</Label>
              <Textarea
                id="quote-specifications"
                value={quoteForm.specifications}
                onChange={(e) => setQuoteForm({ ...quoteForm, specifications: e.target.value })}
                placeholder={t.servicesPage.specsPlaceholder}
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="quote-message">{t.servicesPage.additionalReqs}</Label>
              <Textarea
                id="quote-message"
                value={quoteForm.message}
                onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                placeholder={t.servicesPage.additionalPlaceholder}
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
                {t.servicesPage.cancel}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? t.servicesPage.submitting : t.servicesPage.submitQuote}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
