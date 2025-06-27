import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { User, UserPlus, ShoppingCart, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface PreCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginChoice: () => void;
  onRegisterChoice: () => void;
  onGuestCheckout: () => void;
  cartItemsCount: number;
}

const PreCheckoutModal = ({
  isOpen,
  onClose,
  onLoginChoice,
  onRegisterChoice,
  onGuestCheckout,
  cartItemsCount
}: PreCheckoutModalProps) => {
  const { t, direction } = useLanguage();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" dir={direction}>
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold flex items-center justify-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {direction === 'rtl' ? 'تسویه حساب' : 'Checkout'}
          </DialogTitle>
          <DialogDescription className="text-center">
            {direction === 'rtl' 
              ? `شما ${cartItemsCount} محصول در سبد خرید دارید. برای ادامه، لطفاً یکی از گزینه‌های زیر را انتخاب کنید:`
              : `You have ${cartItemsCount} items in your cart. Please choose one of the options below to continue:`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Login Option */}
          <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={onLoginChoice}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {direction === 'rtl' ? 'ورود به حساب کاربری' : 'Login to Your Account'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {direction === 'rtl' 
                      ? 'اگر قبلاً حساب کاربری دارید، وارد شوید'
                      : 'If you already have an account, sign in'
                    }
                  </p>
                </div>
                <ArrowRight className={`h-5 w-5 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
              </div>
            </CardContent>
          </Card>

          {/* Register Option */}
          <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={onRegisterChoice}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <UserPlus className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {direction === 'rtl' ? 'ایجاد حساب کاربری جدید' : 'Create New Account'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {direction === 'rtl' 
                      ? 'اگر حساب کاربری ندارید، ثبت نام کنید'
                      : 'If you don\'t have an account, register now'
                    }
                  </p>
                </div>
                <ArrowRight className={`h-5 w-5 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
              </div>
            </CardContent>
          </Card>

          {/* Guest Checkout Option */}
          <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-dashed"
                onClick={onGuestCheckout}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {direction === 'rtl' ? 'خرید به عنوان مهمان' : 'Continue as Guest'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {direction === 'rtl' 
                      ? 'بدون ایجاد حساب کاربری ادامه دهید'
                      : 'Continue without creating an account'
                    }
                  </p>
                </div>
                <ArrowRight className={`h-5 w-5 ${direction === 'rtl' ? 'rotate-180' : ''}`} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onClose}>
            {direction === 'rtl' ? 'بازگشت به فروشگاه' : 'Back to Shop'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PreCheckoutModal;