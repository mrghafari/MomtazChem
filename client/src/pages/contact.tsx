import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { insertContactSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { MapPin, Phone, Mail, Clock, IdCard } from "lucide-react";

const Contact = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      return await apiRequest("POST", "/api/contact", data);
    },
    onSuccess: () => {
      toast({
        title: "Message Sent Successfully",
        description: "Thank you for your inquiry. We will get back to you within 24 hours.",
      });
      form.reset();
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
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
      title: "Headquarters",
      content: [
        "Momtazchem Company",
        "Erbil",
        "Chemical Manufacturing Facility"
      ],
      bgColor: "bg-primary-blue"
    },
    {
      icon: <Phone className="h-6 w-6 text-white" />,
      title: "Phone",
      content: [
        "+967 709 996 771",
        "+967 509 996 771"
      ],
      bgColor: "bg-primary-green"
    },
    {
      icon: <Mail className="h-6 w-6 text-white" />,
      title: "Email",
      content: [
        "info@momtazchem.com",
        "sales@momtazchem.com",
        "support@momtazchem.com"
      ],
      bgColor: "bg-accent-orange"
    },
    {
      icon: <Clock className="h-6 w-6 text-white" />,
      title: "Business Hours",
      content: [
        "Monday - Friday: 8:00 AM - 6:00 PM",
        "Saturday: 9:00 AM - 1:00 PM"
      ],
      bgColor: "bg-primary-blue"
    }
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">Get In Touch</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Ready to discuss your chemical solution needs? Our team of experts is here to help you find the perfect solution for your industry.
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
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
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@company.com" {...field} />
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
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Company" {...field} />
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
                        <FormLabel>Product Interest</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a product category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fuel-additives">Fuel Additives</SelectItem>
                            <SelectItem value="water-treatment">Water Treatment</SelectItem>
                            <SelectItem value="paint-thinner">Paint & Thinner</SelectItem>
                            <SelectItem value="agricultural-fertilizers">Agricultural Fertilizers</SelectItem>
                            <SelectItem value="custom-solutions">Custom Solutions</SelectItem>
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
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={4} 
                            placeholder="Tell us about your requirements..." 
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
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  {contactInfo.map((info, index) => (
                    <div key={index} className="flex items-start">
                      <div className={`w-12 h-12 ${info.bgColor} rounded-lg flex items-center justify-center mr-4 flex-shrink-0`}>
                        {info.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{info.title}</h3>
                        {info.content.map((line, lineIndex) => (
                          <p key={lineIndex} className="text-gray-600">{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <IdCard className="h-5 w-5 mr-2" />
                  Our Certifications
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Find Us</h2>
            <p className="text-xl text-gray-600">Visit our headquarters and manufacturing facilities</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="relative">
              <div className="h-96 rounded-lg overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d51436.12345678!2d44.0092162!3d36.1911473!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40076b2e8c7e7c7b%3A0x7c8b4c8b4c8b4c8b!2sErbil%2C%20Iraq!5e0!3m2!1sen!2s!4v1649123456789"
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
                    <MapPin className="h-6 w-6 text-primary-blue" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Momtazchem</h3>
                      <p className="text-sm text-gray-600">Erbil, Kurdistan Region</p>
                      <a
                        href="https://maps.app.goo.gl/ngapesxcH4XiT4L26"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-blue hover:text-primary-blue-dark text-sm font-medium"
                      >
                        View in Google Maps →
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
                  Get Directions
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
