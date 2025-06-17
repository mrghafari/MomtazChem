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

const Services = () => {
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
        title: "Message Sent Successfully",
        description: "Our sales team will contact you within 24 hours.",
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
        title: "Error",
        description: "Failed to send message. Please try again.",
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
        title: "Quote Request Submitted",
        description: "Our team will prepare your quote and respond within 24 hours.",
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
        title: "Error",
        description: "Failed to submit quote request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const services = [
    {
      icon: <FlaskRound className="h-8 w-8 text-white" />,
      title: "Research & Development",
      description: "Custom formulation development and product optimization to meet your specific requirements.",
      features: [
        "Custom Chemical Formulations",
        "Product Performance Testing",
        "Regulatory Compliance Support",
        "Scale-up from Lab to Production",
        "Quality Optimization",
        "Application Development"
      ],
      bgColor: "bg-primary-blue"
    },
    {
      icon: <Truck className="h-8 w-8 text-white" />,
      title: "Global Distribution",
      description: "Reliable supply chain and logistics network ensuring timely delivery worldwide.",
      features: [
        "40+ Countries Coverage",
        "Express Shipping Options",
        "Bulk Order Handling",
        "Cold Chain Management",
        "Real-time Tracking",
        "Local Warehousing"
      ],
      bgColor: "bg-primary-green"
    },
    {
      icon: <Headphones className="h-8 w-8 text-white" />,
      title: "Technical Support",
      description: "Expert technical assistance and consultation for optimal product application.",
      features: [
        "24/7 Technical Helpline",
        "Application Training",
        "Troubleshooting Support",
        "Performance Optimization",
        "Safety Guidelines",
        "Documentation Support"
      ],
      bgColor: "bg-accent-orange"
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: "Consulting Services",
      description: "Strategic consulting to help optimize your chemical processes and operations.",
      features: [
        "Process Optimization",
        "Cost Reduction Analysis",
        "Sustainability Assessment",
        "Regulatory Guidance",
        "Market Analysis",
        "Strategic Planning"
      ],
      bgColor: "bg-primary-blue"
    },
    {
      icon: <Award className="h-8 w-8 text-white" />,
      title: "Quality Assurance",
      description: "Comprehensive quality control and assurance programs for all our products.",
      features: [
        "ISO Certified Processes",
        "Batch Testing & Analysis",
        "Certificate of Analysis",
        "Quality Documentation",
        "Regulatory Compliance",
        "Continuous Monitoring"
      ],
      bgColor: "bg-primary-green"
    },
    {
      icon: <Settings className="h-8 w-8 text-white" />,
      title: "Custom Manufacturing",
      description: "Tailored manufacturing solutions for specialized chemical requirements.",
      features: [
        "Contract Manufacturing",
        "Private Labeling",
        "Flexible Batch Sizes",
        "Specialty Formulations",
        "Packaging Solutions",
        "Supply Chain Integration"
      ],
      bgColor: "bg-accent-orange"
    }
  ];

  const capabilities = [
    {
      title: "Advanced Manufacturing",
      description: "State-of-the-art facilities with modern equipment and automation",
      icon: <Settings className="h-6 w-6 text-primary" />
    },
    {
      title: "Quality Control",
      description: "Rigorous testing and quality assurance at every stage",
      icon: <CheckCircle className="h-6 w-6 text-primary" />
    },
    {
      title: "Global Reach",
      description: "Serving customers in over 40 countries worldwide",
      icon: <Globe className="h-6 w-6 text-primary" />
    },
    {
      title: "Expert Team",
      description: "50+ R&D scientists and chemical engineering experts",
      icon: <Users className="h-6 w-6 text-primary" />
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Services & Capabilities</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Comprehensive support from research and development to delivery and technical assistance, ensuring your success every step of the way.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
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
                      <CheckCircle className="h-4 w-4 text-secondary mr-3 flex-shrink-0" />
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
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Capabilities</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Backed by decades of experience and cutting-edge technology
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
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Service Process</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From initial consultation to ongoing support, we're with you every step of the way
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
              <h3 className="font-semibold text-gray-900 mb-2">Consultation</h3>
              <p className="text-gray-600 text-sm">Understanding your specific requirements and challenges</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-green text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
              <h3 className="font-semibold text-gray-900 mb-2">Development</h3>
              <p className="text-gray-600 text-sm">Custom formulation and solution development</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-accent-orange text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
              <h3 className="font-semibold text-gray-900 mb-2">Testing</h3>
              <p className="text-gray-600 text-sm">Rigorous testing and quality validation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-blue text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
              <h3 className="font-semibold text-gray-900 mb-2">Delivery</h3>
              <p className="text-gray-600 text-sm">Production, delivery, and ongoing support</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Contact our team of experts to discuss your chemical solution needs and discover how we can help your business succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => setIsContactDialogOpen(true)}
              className="bg-[#f4cc19] hover:bg-primary-blue-dark text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact Sales Team
            </Button>
            <Button 
              onClick={() => setIsQuoteDialogOpen(true)}
              variant="outline"
              className="h-10 border-2 border-white text-white hover:bg-white hover:text-gray-900 px-8 py-3 rounded-lg font-semibold transition-all duration-200 bg-[#a0c514]"
            >
              <FileText className="h-4 w-4 mr-2" />
              Request Quote
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Sales Dialog */}
      <Dialog open={isContactDialogOpen} onOpenChange={setIsContactDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact Sales Team
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div>
              <Label htmlFor="contact-name">Full Name *</Label>
              <Input
                id="contact-name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact-email">Email Address *</Label>
              <Input
                id="contact-email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="contact-company">Company</Label>
              <Input
                id="contact-company"
                value={contactForm.company}
                onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact-phone">Phone Number</Label>
              <Input
                id="contact-phone"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact-message">Message *</Label>
              <Textarea
                id="contact-message"
                value={contactForm.message}
                onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                placeholder="Tell us about your requirements..."
                rows={4}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsContactDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quote Request Dialog */}
      <Dialog open={isQuoteDialogOpen} onOpenChange={setIsQuoteDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Request Quote
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quote-name">Full Name *</Label>
                <Input
                  id="quote-name"
                  value={quoteForm.name}
                  onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quote-email">Email Address *</Label>
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
                <Label htmlFor="quote-company">Company *</Label>
                <Input
                  id="quote-company"
                  value={quoteForm.company}
                  onChange={(e) => setQuoteForm({ ...quoteForm, company: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="quote-phone">Phone Number</Label>
                <Input
                  id="quote-phone"
                  value={quoteForm.phone}
                  onChange={(e) => setQuoteForm({ ...quoteForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="quote-category">Product Category *</Label>
              <Input
                id="quote-category"
                value={quoteForm.productCategory}
                onChange={(e) => setQuoteForm({ ...quoteForm, productCategory: e.target.value })}
                placeholder="e.g., Agricultural Fertilizers, Water Treatment, etc."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quote-quantity">Required Quantity *</Label>
                <Input
                  id="quote-quantity"
                  value={quoteForm.quantity}
                  onChange={(e) => setQuoteForm({ ...quoteForm, quantity: e.target.value })}
                  placeholder="e.g., 500 kg, 10 tons"
                  required
                />
              </div>
              <div>
                <Label htmlFor="quote-timeline">Required Timeline</Label>
                <Input
                  id="quote-timeline"
                  value={quoteForm.timeline}
                  onChange={(e) => setQuoteForm({ ...quoteForm, timeline: e.target.value })}
                  placeholder="e.g., Within 2 weeks"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="quote-specifications">Product Specifications *</Label>
              <Textarea
                id="quote-specifications"
                value={quoteForm.specifications}
                onChange={(e) => setQuoteForm({ ...quoteForm, specifications: e.target.value })}
                placeholder="Please provide detailed specifications, purity requirements, packaging preferences, etc."
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="quote-message">Additional Requirements</Label>
              <Textarea
                id="quote-message"
                value={quoteForm.message}
                onChange={(e) => setQuoteForm({ ...quoteForm, message: e.target.value })}
                placeholder="Any additional information or special requirements..."
                rows={3}
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsQuoteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Submitting..." : "Submit Quote Request"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
