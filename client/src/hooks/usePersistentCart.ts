import { useState, useEffect } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useCustomerAuth } from './useCustomerAuth';

interface CartItem {
  productId: number;
  quantity: number;
  unitPrice?: string;
}

export function usePersistentCart() {
  const { isAuthenticated, user } = useCustomerAuth();
  const [localCart, setLocalCart] = useState<{[key: number]: number}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [previousAuth, setPreviousAuth] = useState<boolean>(false);

  // Clear cart when user logs out
  useEffect(() => {
    // If user was authenticated but now isn't (logout detected)
    if (previousAuth && !isAuthenticated) {
      console.log('🔐 User logged out, clearing cart');
      setLocalCart({});
      localStorage.removeItem('cart');
    }
    
    // If user is not authenticated, load from localStorage (guest cart)
    if (!isAuthenticated && !previousAuth) {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          console.log('🛒 Loading guest cart from localStorage:', parsedCart);
          setLocalCart(parsedCart);
        } catch (error) {
          console.error('Error loading local cart:', error);
          setLocalCart({});
        }
      }
    }
    
    setPreviousAuth(isAuthenticated);
  }, [isAuthenticated, previousAuth]);

  // Load persistent cart from database when user logs in
  useEffect(() => {
    const loadPersistentCart = async () => {
      if (isAuthenticated && user && user.id) {
        setIsLoading(true);
        try {
          console.log('🛒 Loading persistent cart for customer:', user.id);
          
          // First sync any local cart items to database
          if (Object.keys(localCart).length > 0) {
            console.log('🔄 Syncing local cart to database:', localCart);
            await apiRequest('/api/customers/persistent-cart/sync', {
              method: 'POST',
              body: JSON.stringify({ cartData: localCart }),
            });
          }
          
          // Then load the updated cart from database
          const response = await apiRequest('/api/customers/persistent-cart', {
            method: 'GET'
          });
          
          if (response.success) {
            // Handle different response formats
            const cartData = response.data?.cartData || response.cart || {};
            console.log('🛒 Loaded cart from database:', cartData);
            setLocalCart(cartData);
            // Clear localStorage after successful sync
            localStorage.removeItem('cart');
          } else {
            console.log('⚠️ Failed to load persistent cart, using local cart');
          }
        } catch (error) {
          console.error('❌ Error loading persistent cart:', error);
          // Keep local cart if database load fails
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Only load if user just authenticated (not on every render)
    if (isAuthenticated && user && !previousAuth) {
      loadPersistentCart();
    }
  }, [isAuthenticated, user, previousAuth]);

  // ذخیره سبد محلی در localStorage
  const saveLocalCart = (cart: {[key: number]: number}) => {
    if (!isAuthenticated) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
    setLocalCart(cart);
  };

  // Add product to cart
  const addToCart = async (productId: number, quantity: number = 1, unitPrice?: string) => {
    const newCart = { ...localCart };
    const currentQuantity = newCart[productId] || 0;
    newCart[productId] = currentQuantity + quantity;

    if (isAuthenticated && user) {
      try {
        console.log(`🛒 Saving product ${productId} to database for customer ${user.id}`);
        await apiRequest('/api/customers/persistent-cart/save', {
          method: 'POST',
          body: JSON.stringify({ productId, quantity: newCart[productId], unitPrice }),
        });
        console.log(`✅ Product ${productId} saved to database`);
      } catch (error) {
        console.error('❌ Error saving to database, falling back to localStorage:', error);
        saveLocalCart(newCart);
        return;
      }
    }

    saveLocalCart(newCart);
  };

  // Update product quantity
  const updateQuantity = async (productId: number, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    const newCart = { ...localCart };
    newCart[productId] = quantity;

    if (isAuthenticated && user) {
      try {
        console.log(`🛒 Updating quantity for product ${productId} to ${quantity} for customer ${user.id}`);
        await apiRequest('/api/customers/persistent-cart/update', {
          method: 'PUT',
          body: JSON.stringify({ productId, quantity }),
        });
        console.log(`✅ Product ${productId} quantity updated`);
      } catch (error) {
        console.error('❌ Error updating quantity in database:', error);
        saveLocalCart(newCart);
        return;
      }
    }

    saveLocalCart(newCart);
  };

  // Remove product from cart
  const removeFromCart = async (productId: number) => {
    const newCart = { ...localCart };
    delete newCart[productId];

    if (isAuthenticated && user) {
      try {
        console.log(`🛒 Removing product ${productId} from database for customer ${user.id}`);
        await apiRequest('/api/customers/persistent-cart/remove', {
          method: 'DELETE',
          body: JSON.stringify({ productId }),
        });
        console.log(`✅ Product ${productId} removed from database`);
      } catch (error) {
        console.error('❌ Error removing from database:', error);
        saveLocalCart(newCart);
        return;
      }
    }

    saveLocalCart(newCart);
  };

  // Clear entire cart
  const clearCart = async () => {
    console.log('🗑️ Clearing cart..., authenticated:', isAuthenticated);
    
    if (isAuthenticated && user) {
      try {
        console.log(`🛒 Clearing cart in database for customer ${user.id}`);
        await apiRequest('/api/customers/persistent-cart/clear', {
          method: 'DELETE',
        });
        console.log('✅ Cart cleared from database');
      } catch (error) {
        console.error('❌ Error clearing cart from database:', error);
      }
    } else {
      console.log('🔄 User not authenticated, clearing only localStorage');
    }

    setLocalCart({});
    localStorage.removeItem('cart');
    console.log('✅ Local cart cleared');
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