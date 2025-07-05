import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const CustomerProfile = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { direction } = useLanguage();

  // Get customer information
  const { data: customerData, isLoading: customerLoading, error: customerError } = useQuery<any>({
    queryKey: ["/api/customers/me"],
    queryFn: async () => {
      const response = await fetch('/api/customers/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    retry: 1,
  });

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/customers/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: "خروج موفقیت‌آمیز",
          description: "شما با موفقیت از حساب خود خارج شدید",
        });
        setLocation("/shop");
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در خروج از سیستم",
      });
    }
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  // Check for authentication errors or missing data
  if (customerError || (!customerLoading && (!customerData || !customerData.success))) {
    return (
      <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">خطا</h2>
            <p className="text-gray-500 mb-6">لطفاً برای دسترسی به پروفیل وارد شوید</p>
            <div className="space-y-3">
              <Button onClick={() => setLocation("/customer/login")} className="w-full">
                ورود
              </Button>
              <Button onClick={() => setLocation("/shop")} variant="outline" className="w-full">
                ادامه خرید
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const customer = customerData.customer;
  
  // Create proper customer name display
  let customerName = '';
  if (customer.firstName && customer.lastName) {
    customerName = `${customer.firstName} ${customer.lastName}`;
  } else if (customer.firstName) {
    customerName = customer.firstName;
  } else if (customer.lastName) {
    customerName = customer.lastName;
  } else if (customer.email) {
    // Extract name from email (before @)
    const emailPrefix = customer.email.split('@')[0];
    customerName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
  } else {
    customerName = 'مشتری گرامی';
  }

  return (
    <div className={`min-h-screen bg-gray-50 flex items-center justify-center ${direction === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">خوش آمدید</h2>
          <p className="text-lg text-gray-600 mb-6">{customerName}</p>
          <div className="space-y-3">
            <Button onClick={() => setLocation("/shop")} className="w-full">
              مشاهده فروشگاه
            </Button>
            <Button onClick={handleLogout} variant="outline" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              خروج
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomerProfile;