import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, Phone, MapPin, Building, AlertCircle, Eye, EyeOff } from "lucide-react";

// Form schemas
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  phone: z.string().min(10, "Phone number is required"),
  company: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  city: z.string().min(2, "City is required"),
  address: z.string().min(5, "Address is required"),
  secondaryAddress: z.string().optional(),
  postalCode: z.string().optional(),
  alternatePhone: z.string().optional(),
  industry: z.string().optional(),
  businessType: z.enum(['manufacturer', 'distributor', 'retailer', 'end_user']).optional(),
  companySize: z.enum(['small', 'medium', 'large', 'enterprise']).optional(),
  communicationPreference: z.enum(['email', 'phone', 'sms', 'whatsapp']).default('email'),
  preferredLanguage: z.enum(['en', 'fa', 'ar']).default('en'),
  marketingConsent: z.boolean().default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password and confirm password must match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

interface CustomerAuthProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: (customer: any) => void;
  onRegisterSuccess?: (customer: any) => void;
  initialMode?: 'login' | 'register';
  existingCustomer?: any; // For pre-filling data during profile completion
}

export default function CustomerAuth({ open, onOpenChange, onLoginSuccess, onRegisterSuccess, initialMode = 'login', existingCustomer }: CustomerAuthProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);
  const [emailExists, setEmailExists] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
      company: "",
      country: "",
      city: "",
      address: "",
    },
  });

  // Update activeTab when initialMode changes
  useEffect(() => {
    setActiveTab(initialMode);
  }, [initialMode]);

  // Pre-fill registration form with existing customer data
  useEffect(() => {
    if (existingCustomer && activeTab === 'register') {
      registerForm.reset({
        firstName: existingCustomer.firstName || "",
        lastName: existingCustomer.lastName || "",
        email: existingCustomer.email || "",
        password: "", // Don't pre-fill password
        confirmPassword: "",
        phone: existingCustomer.phone || "",
        company: existingCustomer.company || "",
        country: existingCustomer.country || "",
        city: existingCustomer.city || "",
        address: existingCustomer.address || "",
        postalCode: existingCustomer.postalCode || "",
        alternatePhone: existingCustomer.alternatePhone || "",
        industry: existingCustomer.industry || "",
        businessType: existingCustomer.businessType || 'retailer',
        companySize: existingCustomer.companySize || 'small',
        communicationPreference: existingCustomer.communicationPreference || 'email',
        preferredLanguage: existingCustomer.preferredLanguage || 'en',
        marketingConsent: existingCustomer.marketingConsent || false,
      });
    }
  }, [existingCustomer, activeTab]);

  const onLogin = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Welcome",
          description: "Successfully logged in",
        });
        onLoginSuccess(result.customer);
        onOpenChange(false);
        loginForm.reset();
      } else {
        toast({
          variant: "destructive",
          title: "Login Error",
          description: result.message || "Invalid email or password",
        });
      }
    } catch (error) {
      // Completely suppress authentication errors - they are handled by response checking
      // Only show actual network connection errors
      if (error && typeof error === 'object' && error.name === 'TypeError' && error.message?.includes('fetch')) {
        toast({
          variant: "destructive",
          title: "Network Error",
          description: "Connection problem. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...registerData } = data;
      
      // Check if this is profile completion mode for existing customer
      if (existingCustomer) {
        // This is profile completion, update existing customer
        const updateResponse = await fetch(`/api/customers/${existingCustomer.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...registerData,
            // Only include password if it's being changed
            ...(registerData.password ? { password: registerData.password } : {}),
          }),
        });

        const updateResult = await updateResponse.json();
        
        if (updateResult.success) {
          toast({
            title: "Profile Updated",
            description: "Your profile has been updated successfully",
          });
          onLoginSuccess({ ...existingCustomer, ...registerData });
          onOpenChange(false);
          registerForm.reset();
          return;
        } else {
          toast({
            variant: "destructive",
            title: "Update Error",
            description: updateResult.message || "Failed to update profile",
          });
          return;
        }
      }
      
      // Regular registration for new customer
      const fullRegistrationData = {
        ...registerData,
        customerType: 'retail',
        customerSource: 'website',
        communicationPreference: registerData.communicationPreference || 'email',
        preferredLanguage: registerData.preferredLanguage || 'en',
        marketingConsent: registerData.marketingConsent || false,
      };
      
      const response = await fetch('/api/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(fullRegistrationData),
      });

      const result = await response.json();

      if (result.success) {
        // Store registration data and show verification form
        setRegistrationData(result.customer);
        setShowVerificationForm(true);
        
        toast({
          title: "Registration Successful",
          description: "A verification code has been sent to your mobile number",
        });
      } else {
        // Check for duplicate email error
        if (result.message?.includes("already exists") || result.message?.includes("duplicate") || result.message?.includes("موجود")) {
          setEmailExists(true);
          setDuplicateEmail(data.email);
          setActiveTab("login");
          loginForm.setValue("email", data.email);
          toast({
            title: "Email Already Registered",
            description: "This email is already registered. Please login instead.",
            variant: "destructive",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Registration Error",
            description: result.message || "An error occurred during registration",
          });
        }
      }
    } catch (error) {
      // Suppress registration errors - they are handled by response checking
      // Only show actual network connection errors
      if (error && typeof error === 'object' && error.name === 'TypeError' && error.message?.includes('fetch')) {
        toast({
          variant: "destructive",
          title: "Network Error",
          description: "Connection problem. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchToLogin = () => {
    setActiveTab("login");
    setEmailExists(false);
    setDuplicateEmail("");
  };

  const onVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 4) {
      setVerificationError("Please enter a 4-digit verification code");
      return;
    }

    setIsLoading(true);
    setVerificationError("");

    try {
      const response = await fetch('/api/customer/verify-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: registrationData.phone,
          verificationCode: verificationCode
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Verification Successful",
          description: "Your account has been verified and you're now logged in",
        });
        
        // Complete registration process
        if (onRegisterSuccess) {
          onRegisterSuccess(result.customer);
        } else {
          onLoginSuccess(result.customer);
        }
        
        onOpenChange(false);
        registerForm.reset();
        setShowVerificationForm(false);
        setVerificationCode("");
        setRegistrationData(null);
        
        // Navigate to customer profile
        window.location.href = '/customer/profile';
      } else {
        setVerificationError(result.message || "Invalid verification code");
      }
    } catch (error) {
      setVerificationError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onResendCode = async () => {
    if (!registrationData?.phone) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/customer/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: registrationData.phone
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Code Resent",
          description: "A new verification code has been sent to your mobile number",
        });
        setVerificationCode("");
        setVerificationError("");
      } else {
        toast({
          variant: "destructive",
          title: "Resend Error",
          description: result.message || "Failed to resend code",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Connection problem. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {showVerificationForm ? "Verify Your Mobile Number" : "Customer Login"}
          </DialogTitle>
          <DialogDescription>
            {showVerificationForm 
              ? "Enter the 4-digit verification code sent to your mobile number"
              : "Sign in to your account or create a new one"
            }
          </DialogDescription>
        </DialogHeader>

        {emailExists && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Email "{duplicateEmail}" is already registered. Please login instead.
              <Button 
                variant="link" 
                size="sm" 
                onClick={switchToLogin}
                className="p-0 h-auto ml-2"
              >
                Switch to Login
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {showVerificationForm && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">SMS Verification</h3>
              <p className="text-sm text-gray-600 mb-4">
                We've sent a 4-digit code to {registrationData?.phone}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Enter Verification Code
                </label>
                <Input
                  type="text"
                  placeholder="Enter 4-digit code"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setVerificationCode(value);
                    if (verificationError) setVerificationError("");
                  }}
                  className="text-center text-lg tracking-widest"
                  maxLength={4}
                />
                {verificationError && (
                  <p className="text-sm text-red-600 mt-1">{verificationError}</p>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={onVerifyCode}
                  disabled={isLoading || verificationCode.length !== 4}
                  className="flex-1"
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>
                <Button
                  variant="outline"
                  onClick={onResendCode}
                  disabled={isLoading}
                >
                  Resend
                </Button>
              </div>
              
              <Button
                variant="ghost"
                onClick={() => {
                  setShowVerificationForm(false);
                  setVerificationCode("");
                  setVerificationError("");
                  setRegistrationData(null);
                }}
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!showVerificationForm && (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showLoginPassword ? "text" : "password"} 
                            placeholder="Enter your password" 
                            className="pr-10"
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                          >
                            {showLoginPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
                
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      window.location.href = "/customer/forgot-password";
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={registerForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          First Name *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="First Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Last Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Password *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showRegisterPassword ? "text" : "password"} 
                              placeholder="Password" 
                              className="pr-10"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                            >
                              {showRegisterPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirm Password" 
                              className="pr-10"
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={registerForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Mobile Number *
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Company
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Company (optional)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={registerForm.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country *</FormLabel>
                        <FormControl>
                          <Input placeholder="Country" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City *</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={registerForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Address *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Full address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="secondaryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Secondary address (optional)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={registerForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}