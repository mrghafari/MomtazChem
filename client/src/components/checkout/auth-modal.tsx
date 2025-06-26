import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
    country: 'ایران',
    city: '',
    address: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/customers/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'خوش آمدید',
          description: 'ورود موفقیت‌آمیز بود'
        });
        onAuthSuccess();
        onClose();
      } else {
        toast({
          title: 'خطا در ورود',
          description: data.message || 'ایمیل یا رمز عبور اشتباه است',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ارتباط با سرور',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: 'خطا',
        description: 'رمز عبور و تکرار آن یکسان نیستند',
        variant: 'destructive'
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: 'خطا',
        description: 'رمز عبور باید حداقل ۶ کاراکتر باشد',
        variant: 'destructive'
      });
      return;
    }

    if (!registerData.phone || !registerData.country || !registerData.city || !registerData.address) {
      toast({
        title: 'خطا',
        description: 'لطفاً تمام فیلدهای ضروری را پر کنید',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/customers/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          firstName: registerData.firstName,
          lastName: registerData.lastName,
          email: registerData.email,
          password: registerData.password,
          phone: registerData.phone,
          company: registerData.company,
          country: registerData.country,
          city: registerData.city,
          address: registerData.address
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'ثبت نام موفق',
          description: 'حساب کاربری شما ایجاد شد و وارد شدید'
        });
        onAuthSuccess();
        onClose();
      } else {
        toast({
          title: 'خطا در ثبت نام',
          description: data.message || 'خطا در ایجاد حساب کاربری',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'خطا',
        description: 'خطا در ارتباط با سرور',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>ورود یا ثبت نام</DialogTitle>
        </DialogHeader>

        <div className="grid w-full grid-cols-2 gap-4 mb-6">
          <Button
            variant={activeTab === 'login' ? 'default' : 'outline'}
            onClick={() => setActiveTab('login')}
            className="w-full"
          >
            ورود
          </Button>
          <Button
            variant={activeTab === 'register' ? 'default' : 'outline'}
            onClick={() => setActiveTab('register')}
            className="w-full"
          >
            ثبت نام
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>ورود به حساب کاربری</CardTitle>
                <CardDescription>
                  برای ادامه خرید، وارد حساب کاربری خود شوید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">ایمیل</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      placeholder="example@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="login-password">رمز عبور</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                        placeholder="رمز عبور خود را وارد کنید"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'در حال ورود...' : 'ورود'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>ایجاد حساب کاربری جدید</CardTitle>
                <CardDescription>
                  برای خرید، حساب کاربری جدید ایجاد کنید
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="register-firstName">نام *</Label>
                      <Input
                        id="register-firstName"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        required
                        placeholder="نام"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-lastName">نام خانوادگی *</Label>
                      <Input
                        id="register-lastName"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        required
                        placeholder="نام خانوادگی"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-email">ایمیل *</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      placeholder="example@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-phone">شماره تلفن *</Label>
                    <Input
                      id="register-phone"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      required
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-company">شرکت (اختیاری)</Label>
                    <Input
                      id="register-company"
                      value={registerData.company}
                      onChange={(e) => setRegisterData({ ...registerData, company: e.target.value })}
                      placeholder="نام شرکت"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="register-country">کشور *</Label>
                      <Input
                        id="register-country"
                        value={registerData.country}
                        onChange={(e) => setRegisterData({ ...registerData, country: e.target.value })}
                        required
                        placeholder="ایران"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-city">شهر *</Label>
                      <Input
                        id="register-city"
                        value={registerData.city}
                        onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })}
                        required
                        placeholder="تهران"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-address">آدرس *</Label>
                    <Input
                      id="register-address"
                      value={registerData.address}
                      onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                      required
                      placeholder="آدرس کامل"
                    />
                  </div>

                  <div>
                    <Label htmlFor="register-password">رمز عبور *</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        placeholder="حداقل ۶ کاراکتر"
                        minLength={6}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute left-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="register-confirmPassword">تکرار رمز عبور *</Label>
                    <Input
                      id="register-confirmPassword"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      placeholder="تکرار رمز عبور"
                      minLength={6}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'در حال ثبت نام...' : 'ثبت نام و ورود'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}