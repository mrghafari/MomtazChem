import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertCustomerSchema } from "@shared/customer-schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link, useLocation } from "wouter";
import { z } from "zod";

// Enhanced registration schema with mandatory fields
const customerRegistrationSchema = z.object({
  email: z.string().email("Please enter a valid email address").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  company: z.string().optional(),
  phone: z.string().min(1, "Phone number is required"),
  country: z.string().min(1, "Country is required"),
  province: z.string().min(1, "Province is required"),
  cityRegion: z.string().min(1, "City/Region is required"),
  address: z.string().min(1, "Address is required"),
  postalCode: z.string().optional(),
  communicationPreference: z.string().default("email"),
  preferredLanguage: z.string().default("en"),
  marketingConsent: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type CustomerRegistrationData = z.infer<typeof customerRegistrationSchema>;

const CustomerRegister = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState("");

  // Fetch provinces data
  const { data: provinces = [] } = useQuery({
    queryKey: ["/api/logistics/provinces"],
    enabled: true,
  });

  // Find selected province ID 
  const selectedProvinceData = Array.isArray(provinces) ? provinces.find((p: any) => p.nameArabic === selectedProvince) : null;
  
  // Fetch cities based on selected province
  const { data: cities = [] } = useQuery({
    queryKey: ["/api/logistics/cities", selectedProvinceData?.id],
    queryFn: () => 
      fetch(`/api/logistics/cities?provinceId=${selectedProvinceData?.id}`)
        .then(res => res.json())
        .then(data => data.data),
    enabled: !!selectedProvinceData?.id,
  });

  const form = useForm<CustomerRegistrationData>({
    resolver: zodResolver(customerRegistrationSchema),
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
      company: "",
      phone: "",
      country: "",
      province: "",
      cityRegion: "",
      address: "",
      postalCode: "",
      password: "",
      confirmPassword: "",
      communicationPreference: "email",
      preferredLanguage: "en",
      marketingConsent: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: CustomerRegistrationData) => {
      const { confirmPassword, ...registerData } = data;
      return await apiRequest("/api/customers/register", {
        method: "POST",
        body: {
          ...registerData,
          passwordHash: registerData.password,
          customerSource: "website",
          customerType: "retail",
          whatsappNumber: registerData.phone, // Use phone as WhatsApp number
        }
      });
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "Your account has been created. You can now log in.",
      });
      setLocation("/customer/profile");
      setIsSubmitting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create account. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: CustomerRegistrationData) => {
    setIsSubmitting(true);
    registerMutation.mutate(data);
  };

  return (
    <div className="pt-20 min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
            <p className="text-gray-600">
              Join Momtazchem to access exclusive products and services
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your first name" {...field} />
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
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your last name" {...field} />
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
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
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
                        <Input placeholder="Enter your company name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Contact Information
                </h2>

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+964 XXX XXX XXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


                {/* Iraqi Geographical Format Section */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-medium text-blue-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    العنوان الجغرافي العراقي (Iraqi Geographical Address)
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            🌍 البلد / Country *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر البلد / Select country" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Iraq">🇮🇶 العراق / Iraq</SelectItem>
                              <SelectItem value="Iran">🇮🇷 إيران / Iran</SelectItem>
                              <SelectItem value="Turkey">🇹🇷 تركيا / Turkey</SelectItem>
                              <SelectItem value="Syria">🇸🇾 سوريا / Syria</SelectItem>
                              <SelectItem value="Jordan">🇯🇴 الأردن / Jordan</SelectItem>
                              <SelectItem value="Lebanon">🇱🇧 لبنان / Lebanon</SelectItem>
                              <SelectItem value="Kuwait">🇰🇼 الكويت / Kuwait</SelectItem>
                              <SelectItem value="Saudi Arabia">🇸🇦 السعودية / Saudi Arabia</SelectItem>
                              <SelectItem value="UAE">🇦🇪 الإمارات / UAE</SelectItem>
                              <SelectItem value="Other">🌐 دولة أخرى / Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            🏛️ الاستان / Province *
                          </FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedProvince(value);
                              form.setValue("cityRegion", ""); // Reset city when province changes
                            }} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الاستان / Select province" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(provinces) && provinces.map((province: any) => (
                                <SelectItem key={province.id} value={province.nameArabic}>
                                  {province.nameArabic} ({province.nameEnglish})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cityRegion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            🏙️ شهر/منطقه / City/Region *
                          </FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedProvince}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={selectedProvince ? "اختر شهر/منطقه" : "اختر الاستان أولاً"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.isArray(cities) && cities.map((city: any) => (
                                <SelectItem key={city.id} value={city.nameArabic}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{city.nameArabic}</span>
                                    <span className="text-xs text-gray-500">
                                      {city.nameEnglish} • فاصله از اربیل: {city.distanceFromErbilKm || 0} کیلومتر
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Distance Information Display */}
                  {selectedProvince && cities.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium">معلومات المسافة للخدمات اللوجستية</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        المسافات محسوبة من أربيل لتحسين التوصيل وحساب تكاليف الشحن
                      </p>
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full address" {...field} required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter postal code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Account Security */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Account Security
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Create a password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Confirm your password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">
                  Communication Preferences
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="communicationPreference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Communication</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="preferredLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="fa">Persian</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <Button 
                  type="submit" 
                  className="w-full bg-primary-blue hover:bg-primary-blue-dark text-white py-3"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating Account..." : "Create Account"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link href="/customer-login" className="text-primary-blue hover:underline font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default CustomerRegister;