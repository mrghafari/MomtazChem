import { useState, useEffect } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from './useAuth';

interface CartItem {
  productId: number;
  quantity: number;
  unitPrice?: string;
}

export function usePersistentCart() {
  const { isAuthenticated, user } = useAuth();
  const [localCart, setLocalCart] = useState<{[key: number]: number}>({});
  const [isLoading, setIsLoading] = useState(false);

  // بارگذاری سبد خرید از localStorage برای کاربران غیر وارد شده
  useEffect(() => {
    if (!isAuthenticated) {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          setLocalCart(JSON.parse(savedCart));
        } catch (error) {
          console.error('خطا در بارگذاری سبد محلی:', error);
          setLocalCart({});
        }
      }
    }
  }, [isAuthenticated]);

  // بارگذاری سبد خرید از دیتابیس هنگام ورود
  useEffect(() => {
    const loadPersistentCart = async () => {
      if (isAuthenticated && user) {
        setIsLoading(true);
        try {
          console.log('🛒 بارگذاری سبد ماندگار برای مشتری:', user.id);
          
          // ابتدا سبد محلی را همگام کنیم
          if (Object.keys(localCart).length > 0) {
            await apiRequest('/api/customers/persistent-cart/sync', {
              method: 'POST',
              body: JSON.stringify({ cartData: localCart }),
            });
          }
          
          // سپس سبد بروزرسانی شده را بارگذاری کنیم
          const response = await apiRequest('/api/customers/persistent-cart');
          if (response.success) {
            setLocalCart(response.cart);
            // پاک کردن localStorage پس از همگام‌سازی موفق
            localStorage.removeItem('cart');
          }
        } catch (error) {
          console.error('خطا در بارگذاری سبد ماندگار:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadPersistentCart();
  }, [isAuthenticated, user]);

  // ذخیره سبد محلی در localStorage
  const saveLocalCart = (cart: {[key: number]: number}) => {
    if (!isAuthenticated) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
    setLocalCart(cart);
  };

  // اضافه کردن محصول به سبد
  const addToCart = async (productId: number, quantity: number = 1, unitPrice?: string) => {
    const newCart = { ...localCart };
    const currentQuantity = newCart[productId] || 0;
    newCart[productId] = currentQuantity + quantity;

    if (isAuthenticated) {
      try {
        await apiRequest('/api/customers/persistent-cart/save', {
          method: 'POST',
          body: JSON.stringify({ productId, quantity: newCart[productId], unitPrice }),
        });
        console.log(`✅ محصول ${productId} در دیتابیس ذخیره شد`);
      } catch (error) {
        console.error('خطا در ذخیره محصول در دیتابیس:', error);
        // در صورت خطا، محصول را در localStorage ذخیره کنیم
        saveLocalCart(newCart);
        return;
      }
    }

    saveLocalCart(newCart);
  };

  // بروزرسانی کمیت محصول
  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const newCart = { ...localCart };
    newCart[productId] = quantity;

    if (isAuthenticated) {
      try {
        await apiRequest('/api/customers/persistent-cart/update', {
          method: 'PUT',
          body: JSON.stringify({ productId, quantity }),
        });
        console.log(`✅ کمیت محصول ${productId} بروزرسانی شد`);
      } catch (error) {
        console.error('خطا در بروزرسانی کمیت در دیتابیس:', error);
        saveLocalCart(newCart);
        return;
      }
    }

    saveLocalCart(newCart);
  };

  // حذف محصول از سبد
  const removeFromCart = async (productId: number) => {
    const newCart = { ...localCart };
    delete newCart[productId];

    if (isAuthenticated) {
      try {
        await apiRequest('/api/customers/persistent-cart/remove', {
          method: 'DELETE',
          body: JSON.stringify({ productId }),
        });
        console.log(`✅ محصول ${productId} از دیتابیس حذف شد`);
      } catch (error) {
        console.error('خطا در حذف محصول از دیتابیس:', error);
        saveLocalCart(newCart);
        return;
      }
    }

    saveLocalCart(newCart);
  };

  // پاک کردن کامل سبد
  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await apiRequest('/api/customers/persistent-cart/clear', {
          method: 'DELETE',
        });
        console.log('✅ سبد خرید از دیتابیس پاک شد');
      } catch (error) {
        console.error('خطا در پاک کردن سبد از دیتابیس:', error);
      }
    }

    setLocalCart({});
    localStorage.removeItem('cart');
  };

  // دریافت تعداد کل آیتم‌ها در سبد
  const getTotalItems = () => {
    return Object.values(localCart).reduce((total, quantity) => total + quantity, 0);
  };

  // دریافت آیتم‌های سبد
  const getCartItems = () => {
    return Object.entries(localCart).map(([productId, quantity]) => ({
      productId: parseInt(productId),
      quantity
    }));
  };

  return {
    cart: localCart,
    isLoading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalItems,
    getCartItems,
    isEmpty: Object.keys(localCart).length === 0
  };
}