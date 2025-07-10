import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, ArrowLeft, UserPlus, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode }: AuthModalProps) {
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<'choice' | 'login' | 'register'>(initialMode || 'choice');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Update currentView when initialMode changes
  useEffect(() => {
    if (initialMode) {
      setCurrentView(initialMode);
    }
  }, [initialMode]);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    company: '',
    country: 'Iran',
    city: '',
    address: ''
  });

  const resetModal = () => {
    setCurrentView('choice');
    setLoginData({ email: '', password: '' });
    setRegisterData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      company: '',
      country: 'Iran',
      city: '',
      address: ''
    });
    setShowPassword(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

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

      if (response.ok && data.success) {
        toast({
          title: 'Welcome Back',
          description: 'Successfully logged in'
        });
        resetModal();
        onAuthSuccess();
      } else {
        toast({
          title: 'Login Failed',
          description: data.message || 'Invalid email or password',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Login error details:', error);
      toast({
        title: 'Login Error',
        description: 'Connection error. Please try again.',
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
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }

    if (!registerData.phone || !registerData.country || !registerData.city || !registerData.address) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Registration Successful',
          description: 'Account created and logged in successfully'
        });
        resetModal();
        onAuthSuccess();
      } else {
        toast({
          title: 'Registration Failed',
          description: data.message || 'Failed to create account',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Register error:', error);
      toast({
        title: 'Registration Error',
        description: 'Connection error. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {currentView !== 'choice' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('choice')}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {currentView === 'choice' && 'Authentication Required'}
            {currentView === 'login' && 'Login to Your Account'}
            {currentView === 'register' && 'Create New Account'}
          </DialogTitle>
        </DialogHeader>

        {currentView === 'choice' && (
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground text-center">
              Please login or create an account to complete your purchase
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => setCurrentView('login')}
                className="w-full h-12 text-base"
                variant="default"
              >
                <LogIn className="mr-2 h-5 w-5" />
                Login to Existing Account
              </Button>
              
              <Button
                onClick={() => setCurrentView('register')}
                className="w-full h-12 text-base"
                variant="outline"
              >
                <UserPlus className="mr-2 h-5 w-5" />
                Create New Account
              </Button>
            </div>
          </div>
        )}

        {currentView === 'login' && (
          <Card>
            <CardHeader>
              <CardTitle>Welcome Back</CardTitle>
              <CardDescription>
                Enter your credentials to continue with your purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email Address</Label>
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
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      placeholder="Enter your password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {currentView === 'register' && (
          <Card>
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>
                Fill in your information to create a new account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="register-firstName">First Name *</Label>
                    <Input
                      id="register-firstName"
                      value={registerData.firstName}
                      onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                      required
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-lastName">Last Name *</Label>
                    <Input
                      id="register-lastName"
                      value={registerData.lastName}
                      onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                      required
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="register-email">Email Address *</Label>
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
                  <Label htmlFor="register-phone">Phone Number *</Label>
                  <Input
                    id="register-phone"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    required
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="register-company">Company (Optional)</Label>
                  <Input
                    id="register-company"
                    value={registerData.company}
                    onChange={(e) => setRegisterData({ ...registerData, company: e.target.value })}
                    placeholder="Company Name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="register-country">Country *</Label>
                    <Input
                      id="register-country"
                      value={registerData.country}
                      onChange={(e) => setRegisterData({ ...registerData, country: e.target.value })}
                      required
                      placeholder="Iran"
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-city">City *</Label>
                    <Input
                      id="register-city"
                      value={registerData.city}
                      onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })}
                      required
                      placeholder="Tehran"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="register-address">Address *</Label>
                  <Input
                    id="register-address"
                    value={registerData.address}
                    onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                    required
                    placeholder="Complete address"
                  />
                </div>

                <div>
                  <Label htmlFor="register-password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      placeholder="At least 6 characters"
                      minLength={6}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="register-confirmPassword">Confirm Password *</Label>
                  <Input
                    id="register-confirmPassword"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                    required
                    placeholder="Confirm your password"
                    minLength={6}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account & Login'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
}