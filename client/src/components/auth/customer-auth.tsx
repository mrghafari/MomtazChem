import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { User, Mail, Lock, Phone, MapPin, Building, AlertCircle, Eye, EyeOff, ChevronDown, ChevronUp, Settings } from "lucide-react";

// Custom Zod error map for translating validation errors
function getZodErrorMap(t: any): z.ZodErrorMap {
  return (issue, ctx) => {
    // Handle custom error messages (like passwords_must_match)
    if (issue.code === z.ZodIssueCode.custom) {
      if (issue.message === "passwords_must_match") {
        return { message: t.auth.validation.passwordsMustMatch };
      }
      return { message: issue.message || ctx.defaultError };
    }
    
    // Handle invalid_type errors (like invalid email)
    if (issue.code === z.ZodIssueCode.invalid_type) {
      if (issue.expected === "string") {
        // Check path to determine which field
        const path = issue.path[0];
        if (path === "email") {
          return { message: t.auth.validation.invalidEmail };
        }
      }
      return { message: ctx.defaultError };
    }
    
    // Handle invalid_string errors (like email format)
    if (issue.code === z.ZodIssueCode.invalid_string) {
      if (issue.validation === "email") {
        return { message: t.auth.validation.invalidEmail };
      }
      return { message: ctx.defaultError };
    }
    
    // Handle too_small errors (min length validations)
    if (issue.code === z.ZodIssueCode.too_small) {
      if (issue.type === "string") {
        const path = issue.path[0];
        const minimum = issue.minimum;
        
        // Map based on field name and minimum value
        if (path === "email") {
          return { message: t.auth.validation.invalidEmail };
        }
        if (path === "password" && minimum === 6) {
          return { message: t.auth.validation.passwordMin6 };
        }
        if (path === "firstName" && minimum === 2) {
          return { message: t.auth.validation.firstNameMin2 };
        }
        if (path === "lastName" && minimum === 2) {
          return { message: t.auth.validation.lastNameMin2 };
        }
        if (path === "phone" && minimum === 10) {
          return { message: t.auth.validation.phoneMin10 };
        }
        if (path === "address" && minimum === 5) {
          return { message: t.auth.validation.addressMin5 };
        }
        if (path === "country" && minimum === 2) {
          return { message: t.auth.validation.countryRequired };
        }
        if (path === "province" && minimum === 1) {
          return { message: t.auth.validation.provinceRequired };
        }
        if (path === "city" && minimum === 1) {
          return { message: t.auth.validation.cityRequired };
        }
      }
      return { message: ctx.defaultError };
    }
    
    // Default error message
    return { message: ctx.defaultError };
  };
}

// Form schemas - simplified without hardcoded messages
// Error messages will be handled by the custom error map
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  confirmPassword: z.string(),
  phone: z.string().min(10),
  whatsappNumber: z.string().optional(),
  company: z.string().optional(),
  country: z.string().min(2),
  province: z.string().min(1),
  city: z.string().min(1),
  address: z.string().min(5),
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
  message: "passwords_must_match", // Will be translated in FormMessage
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
  const { t } = useLanguage();
  
  // Apply custom error map for translated validation messages
  useEffect(() => {
    z.setErrorMap(getZodErrorMap(t));
  }, [t]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialMode);
  const [emailExists, setEmailExists] = useState(false);
  const [duplicateEmail, setDuplicateEmail] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState("");
  
  // OTP verification states
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  
  // Collapsible sections state
  const [basicInfoOpen, setBasicInfoOpen] = useState(true);
  const [contactInfoOpen, setContactInfoOpen] = useState(true);
  const [addressInfoOpen, setAddressInfoOpen] = useState(true);
  const [additionalInfoOpen, setAdditionalInfoOpen] = useState(true);

  // Fetch provinces
  const { data: provincesResponse } = useQuery({
    queryKey: ["/api/logistics/provinces"],
    enabled: true,
  });
  
  const provinces = (provincesResponse as any)?.data || [];

  // No need for verification settings anymore - OTP is always used

  // Find selected province ID 
  const selectedProvinceData = Array.isArray(provinces) ? provinces.find((p: any) => p.nameEnglish === selectedProvince) : null;
  
  // Fetch cities based on selected province
  const { data: citiesResponse } = useQuery({
    queryKey: ["/api/logistics/cities", selectedProvinceData?.id],
    queryFn: () => fetch(`/api/logistics/cities?provinceId=${selectedProvinceData?.id}`).then(res => res.json()),
    enabled: !!selectedProvinceData?.id,
  });
  
  const cities = (citiesResponse as any)?.data || [];

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
      whatsappNumber: "",
      company: "",
      country: "",
      province: "",
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
        whatsappNumber: existingCustomer.whatsappNumber || "",
        company: existingCustomer.company || "",
        country: existingCustomer.country || "",
        province: existingCustomer.province || "",
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
    setLoginError(null); // Clear previous error
    
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
          title: t.auth.welcome,
          description: t.auth.loginSuccess,
        });
        onLoginSuccess(result.customer);
        onOpenChange(false);
        loginForm.reset();
      } else {
        // Set error message to display under form
        const errorMessage = result.message || t.auth.invalidCredentials;
        setLoginError(errorMessage);
        
        toast({
          variant: "destructive",
          title: t.auth.loginError,
          description: errorMessage,
        });
      }
    } catch (error) {
      // Set generic error message for network issues
      setLoginError(t.auth.serverError);
      
      // Completely suppress authentication errors - they are handled by response checking
      // Only show actual network connection errors
      if (error && typeof error === 'object' && (error as any).name === 'TypeError' && (error as any).message?.includes('fetch')) {
        toast({
          variant: "destructive",
          title: t.auth.networkError,
          description: t.auth.networkErrorDesc,
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
      
      // If WhatsApp number is not provided, use mobile phone number as default
      if (!registerData.whatsappNumber || registerData.whatsappNumber.trim() === '') {
        registerData.whatsappNumber = registerData.phone;
      }
      
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
            title: t.auth.profileUpdated,
            description: t.auth.profileUpdatedDesc,
          });
          onLoginSuccess({ ...existingCustomer, ...registerData });
          onOpenChange(false);
          registerForm.reset();
          return;
        } else {
          toast({
            variant: "destructive",
            title: t.auth.updateError,
            description: updateResult.message || t.auth.updateFailed,
          });
          return;
        }
      }
      
      // Send OTP for verification
      const fullRegistrationData = {
        ...registerData,
        customerType: 'retail',
        customerSource: 'website',
        passwordHash: registerData.password,
        whatsappNumber: registerData.whatsappNumber || registerData.phone,
      };
      
      setRegistrationData(fullRegistrationData);
      
      const otpResponse = await fetch('/api/customers/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: registerData.email,
          phone: registerData.phone,
          registrationData: fullRegistrationData,
        }),
      });

      const otpResult = await otpResponse.json();

      if (otpResult.success) {
        setShowOtpVerification(true);
        
        const channels = [];
        if (otpResult.sentVia?.email) channels.push("Email");
        if (otpResult.sentVia?.whatsapp) channels.push("WhatsApp");
        if (otpResult.sentVia?.sms) channels.push("SMS");
        
        toast({
          title: t.auth.verificationCodesSent || "Verification Code Sent",
          description: `${t.auth.codeSentTo || "Code sent to"}: ${channels.join(", ")}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: t.auth.verificationCodesError || "Error",
          description: otpResult.message || "Failed to send verification code",
        });
      }
      
      // Skip old code
      if (false) {
        // Regular registration without dual verification
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
            title: t.auth.registrationVerificationSent,
            description: t.auth.verificationSentDesc,
          });
        } else {
          // Check for duplicate email error
          if (result.message?.includes("already exists") || result.message?.includes("duplicate") || result.message?.includes("موجود")) {
            setEmailExists(true);
            setDuplicateEmail(data.email);
            setActiveTab("login");
            loginForm.setValue("email", data.email);
            toast({
              title: t.auth.emailAlreadyRegistered,
              description: t.auth.emailAlreadyRegisteredDesc,
              variant: "destructive",
            });
          } else {
            toast({
              variant: "destructive",
              title: t.auth.registrationError,
              description: result.message || t.auth.registrationError,
            });
          }
        }
      }
    } catch (error) {
      // Suppress registration errors - they are handled by response checking
      // Only show actual network connection errors
      if (error && typeof error === 'object' && (error as any).name === 'TypeError' && (error as any).message?.includes('fetch')) {
        toast({
          variant: "destructive",
          title: t.auth.networkError,
          description: t.auth.networkErrorDesc,
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

  // Handle dual verification
  const onDualVerification = async () => {
    setIsLoading(true);
    setDualVerificationError("");
    
    try {
      const response = await fetch('/api/customer/verify-dual-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: registrationData?.email,
          phone: registrationData?.phone,
          smsCode: smsCode,
          emailCode: emailCode,
        }),
      });

      const result = await response.json();

      if (result.success && result.verified.complete) {
        // Complete customer registration after verification
        const fullRegistrationData = {
          ...registrationData,
          customerType: 'retail',
          customerSource: 'website',
          communicationPreference: registrationData.communicationPreference || 'email',
          preferredLanguage: registrationData.preferredLanguage || 'en',
          marketingConsent: registrationData.marketingConsent || false,
        };
        
        const registerResponse = await fetch('/api/customers/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(fullRegistrationData),
        });

        const registerResult = await registerResponse.json();

        if (registerResult.success) {
          toast({
            title: t.auth.registrationSuccessful,
            description: t.auth.accountCreated,
          });
          
          // Auto-login after successful registration
          onLoginSuccess(registerResult.customer);
          onOpenChange(false);
          
          // Reset all forms
          registerForm.reset();
          setShowDualVerification(false);
          setSmsCode("");
          setEmailCode("");
          setRegistrationData(null);
        } else {
          setDualVerificationError(registerResult.message || t.auth.registrationError);
        }
      } else {
        setDualVerificationError(result.message || t.auth.invalidCodes);
      }
    } catch (error) {
      console.error("Dual verification error:", error);
      setDualVerificationError(t.auth.verificationError);
    } finally {
      setIsLoading(false);
    }
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showVerificationForm ? t.auth.verifyMobileNumber : t.auth.customerLogin}
          </DialogTitle>
          <DialogDescription>
            {showVerificationForm 
              ? t.auth.verificationCodeDescription
              : t.auth.signInOrRegister
            }
          </DialogDescription>
        </DialogHeader>

        {emailExists && (
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {t.auth.emailAlreadyRegisteredMessage.replace('{email}', duplicateEmail)}
              <Button 
                variant="link" 
                size="sm" 
                onClick={switchToLogin}
                className="p-0 h-auto ml-2"
              >
                {t.auth.switchToLogin}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {showVerificationForm && (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t.auth.smsVerification}</h3>
              <p className="text-sm text-gray-600 mb-4">
                {t.auth.codeSentTo} {registrationData?.phone}
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  {t.auth.enterVerificationCode}
                </label>
                <Input
                  type="text"
                  placeholder={t.auth.enter4DigitCode}
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
                  {isLoading ? t.auth.verifying : t.auth.verifyCode}
                </Button>
                <Button
                  variant="outline"
                  onClick={onResendCode}
                  disabled={isLoading}
                >
                  {t.auth.resend}
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
                {t.cancel}
              </Button>
            </div>
          </div>
        )}

        {!showVerificationForm && (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'register')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">{t.auth.login}</TabsTrigger>
            <TabsTrigger value="register">{t.auth.register}</TabsTrigger>
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
                        {t.email}
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t.auth.enterEmail} {...field} />
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
                        {t.auth.password}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showLoginPassword ? "text" : "password"} 
                            placeholder={t.auth.enterPassword} 
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
                  {isLoading ? t.auth.loggingIn : t.auth.login}
                </Button>
                
                {/* Display login error under form */}
                {loginError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600 text-center font-medium">
                      {loginError}
                    </p>
                  </div>
                )}
                
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      window.location.href = "/customer/forgot-password";
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {t.auth.forgotPassword}
                  </button>
                </div>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                
                {/* Basic Information Section */}
                <Collapsible open={basicInfoOpen} onOpenChange={setBasicInfoOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-blue-50 hover:bg-blue-100 border-blue-200 py-3 text-base font-semibold text-blue-800">
                      <span className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        {t.auth.basicInformation}
                      </span>
                      {basicInfoOpen ? <ChevronUp className="h-5 w-5 text-blue-600" /> : <ChevronDown className="h-5 w-5 text-blue-600" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.firstName} *</FormLabel>
                            <FormControl>
                              <Input placeholder={t.firstName} {...field} />
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
                            <FormLabel>{t.lastName} *</FormLabel>
                            <FormControl>
                              <Input placeholder={t.lastName} {...field} />
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
                            {t.email} *
                          </FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={t.email} {...field} />
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
                              {t.auth.password} *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showRegisterPassword ? "text" : "password"} 
                                  placeholder={t.auth.password} 
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
                            <FormLabel>{t.auth.confirmPassword} *</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type={showConfirmPassword ? "text" : "password"} 
                                  placeholder={t.auth.confirmPassword} 
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
                  </CollapsibleContent>
                </Collapsible>

                {/* Contact Information Section */}
                <Collapsible open={contactInfoOpen} onOpenChange={setContactInfoOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-green-50 hover:bg-green-100 border-green-200 py-3 text-base font-semibold text-green-800">
                      <span className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-green-600" />
                        {t.auth.contactInformation}
                      </span>
                      {contactInfoOpen ? <ChevronUp className="h-5 w-5 text-green-600" /> : <ChevronDown className="h-5 w-5 text-green-600" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.auth.mobileNumber} *</FormLabel>
                            <FormControl>
                              <Input placeholder={t.phone} {...field} />
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
                              {t.company}
                            </FormLabel>
                            <FormControl>
                              <Input placeholder={t.auth.companyOptional} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={registerForm.control}
                      name="whatsappNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.whatsappNumber}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.auth.whatsappOptional} {...field} />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            {t.auth.leaveEmptyIfSame}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Address Information Section */}
                <Collapsible open={addressInfoOpen} onOpenChange={setAddressInfoOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-orange-50 hover:bg-orange-100 border-orange-200 py-3 text-base font-semibold text-orange-800">
                      <span className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-orange-600" />
                        {t.auth.addressInformation}
                      </span>
                      {addressInfoOpen ? <ChevronUp className="h-5 w-5 text-orange-600" /> : <ChevronDown className="h-5 w-5 text-orange-600" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <FormField
                      control={registerForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.country} *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t.auth.selectCountry} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Iraq">Iraq</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={registerForm.control}
                        name="province"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.auth.province} *</FormLabel>
                            <Select 
                              value={field.value} 
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedProvince(value);
                                // Clear city when province changes
                                registerForm.setValue("city", "");
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t.auth.selectProvince} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.isArray(provinces) && provinces.map((province: any) => (
                                  <SelectItem key={province.id} value={province.nameEnglish}>
                                    {province.nameEnglish} - {province.nameArabic}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t.city} *</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={t.auth.selectCity} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Array.isArray(cities) && cities.map((city: any) => (
                                  <SelectItem key={city.id} value={city.nameEnglish}>
                                    {city.nameEnglish} - {city.nameArabic}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                          <FormLabel>{t.address} *</FormLabel>
                          <FormControl>
                            <Input placeholder={t.auth.fullAddress} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>

                {/* Additional Information Section */}
                <Collapsible open={additionalInfoOpen} onOpenChange={setAdditionalInfoOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between bg-purple-50 hover:bg-purple-100 border-purple-200 py-3 text-base font-semibold text-purple-800">
                      <span className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-purple-600" />
                        {t.auth.additionalInformation}
                      </span>
                      {additionalInfoOpen ? <ChevronUp className="h-5 w-5 text-purple-600" /> : <ChevronDown className="h-5 w-5 text-purple-600" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 mt-4">
                    <FormField
                      control={registerForm.control}
                      name="secondaryAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t.auth.secondaryAddress}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.auth.secondaryAddressOptional} {...field} />
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
                          <FormLabel>{t.auth.postalCode}</FormLabel>
                          <FormControl>
                            <Input placeholder={t.auth.postalCode} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CollapsibleContent>
                </Collapsible>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? t.auth.creatingAccount : t.auth.createAccount}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        )}

        {/* Dual Verification Form */}
        {showDualVerification && (
          <div className="p-6 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                {t.auth.dualVerification}
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                {t.auth.verificationCodesSentTo} {verificationMethods?.sms ? t.auth.mobileNumber : ''} 
                {verificationMethods?.sms && verificationMethods?.email ? t.auth.and : ''}
                {verificationMethods?.email ? t.email : ''}
              </p>
            </div>

            {dualVerificationError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600 text-center">
                  {dualVerificationError}
                </p>
              </div>
            )}

            <div className="space-y-4">
              {verificationMethods?.sms && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.auth.smsVerificationCode}
                  </label>
                  <Input
                    type="text"
                    maxLength={4}
                    placeholder={t.auth.fourDigitCode}
                    value={smsCode}
                    onChange={(e) => setSmsCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
              )}

              {verificationMethods?.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.auth.emailVerificationCode}
                  </label>
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder={t.auth.sixDigitCode}
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-lg tracking-widest"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Button 
                onClick={onDualVerification} 
                className="w-full"
                disabled={isLoading || 
                  (verificationMethods?.sms && (!smsCode || smsCode.length !== 4)) ||
                  (verificationMethods?.email && (!emailCode || emailCode.length !== 6))
                }
              >
                {isLoading ? t.auth.verifying : t.auth.verifyCodes}
              </Button>

              <Button 
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowDualVerification(false);
                  setSmsCode("");
                  setEmailCode("");
                  setDualVerificationError("");
                }}
              >
                {t.auth.back}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}