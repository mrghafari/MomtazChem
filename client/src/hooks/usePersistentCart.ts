import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// Type definitions for persistent cart
export interface PersistentCartItem {
  id: number;
  customerId: number;
  productId: number;
  quantity: number;
  unitPrice: string | null;
  addedAt: string;
  updatedAt: string;
  sessionId: string | null;
  isActive: boolean;
  notes: string | null;
  // Product details (joined from products table)
  productName?: string;
  productTechnicalName?: string;
  productImage?: string;
  productCategory?: string;
  productBarcode?: string;
  productStockQuantity?: number;
}

export interface PersistentCartData {
  success: boolean;
  cart: { [productId: number]: number };
  items: PersistentCartItem[];
  itemCount: number;
  totalValue: number;
}

// Hook for managing persistent shopping cart
export function usePersistentCart() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [localCart, setLocalCart] = useState<{ [productId: number]: number }>({});

  // Fetch persistent cart from server
  const { data: persistentCartData, isLoading, refetch } = useQuery<PersistentCartData>({
    queryKey: ["/api/customers/persistent-cart"],
    enabled: isAuthenticated,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Sync cart to server
  const syncCartMutation = useMutation({
    mutationFn: async (cartData: { [productId: number]: number }) => {
      return await apiRequest("/api/customers/persistent-cart/sync", {
        method: "POST",
        body: { cart: cartData },
      });
    },
    onSuccess: () => {
      console.log("🛒 [PERSISTENT CART] Cart synced successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/customers/persistent-cart"] });
    },
    onError: (error) => {
      console.error("❌ [PERSISTENT CART] Error syncing cart:", error);
      toast({
        title: "خطا در همگام‌سازی سبد خرید",
        description: "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    },
  });

  // Add item to persistent cart
  const addItemMutation = useMutation({
    mutationFn: async ({ productId, quantity, unitPrice }: { 
      productId: number; 
      quantity: number; 
      unitPrice?: number; 
    }) => {
      return await apiRequest("/api/customers/persistent-cart/save", {
        method: "POST",
        body: { productId, quantity, unitPrice },
      });
    },
    onSuccess: (data, variables) => {
      console.log(`🛒 [PERSISTENT CART] Added product ${variables.productId} successfully`);
      queryClient.invalidateQueries({ queryKey: ["/api/customers/persistent-cart"] });
      toast({
        title: "محصول به سبد خرید اضافه شد",
        description: "محصول با موفقیت در سبد خرید ذخیره شد",
      });
    },
    onError: (error) => {
      console.error("❌ [PERSISTENT CART] Error adding item:", error);
      toast({
        title: "خطا در اضافه کردن محصول",
        description: error.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    },
  });

  // Update item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      return await apiRequest("/api/customers/persistent-cart/update", {
        method: "PUT",
        body: { productId, quantity },
      });
    },
    onSuccess: (data, variables) => {
      console.log(`🛒 [PERSISTENT CART] Updated quantity for product ${variables.productId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/customers/persistent-cart"] });
    },
    onError: (error) => {
      console.error("❌ [PERSISTENT CART] Error updating quantity:", error);
      toast({
        title: "خطا در بروزرسانی کمیت",
        description: error.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    },
  });

  // Remove item from cart
  const removeItemMutation = useMutation({
    mutationFn: async ({ productId }: { productId: number }) => {
      return await apiRequest("/api/customers/persistent-cart/remove", {
        method: "DELETE",
        body: { productId },
      });
    },
    onSuccess: (data, variables) => {
      console.log(`🛒 [PERSISTENT CART] Removed product ${variables.productId}`);
      queryClient.invalidateQueries({ queryKey: ["/api/customers/persistent-cart"] });
      toast({
        title: "محصول حذف شد",
        description: "محصول از سبد خرید حذف شد",
      });
    },
    onError: (error) => {
      console.error("❌ [PERSISTENT CART] Error removing item:", error);
      toast({
        title: "خطا در حذف محصول",
        description: error.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    },
  });

  // Clear entire cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("شناسه مشتری یافت نشد");
      return await apiRequest(`/api/customers/persistent-cart/clear/${user.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      console.log("🛒 [PERSISTENT CART] Cart cleared successfully");
      queryClient.invalidateQueries({ queryKey: ["/api/customers/persistent-cart"] });
      toast({
        title: "سبد خرید پاک شد",
        description: "تمام محصولات از سبد خرید حذف شدند",
      });
    },
    onError: (error) => {
      console.error("❌ [PERSISTENT CART] Error clearing cart:", error);
      toast({
        title: "خطا در پاک کردن سبد خرید",
        description: error.message || "لطفاً دوباره تلاش کنید",
        variant: "destructive",
      });
    },
  });

  // Load cart from localStorage for non-authenticated users
  useEffect(() => {
    if (!isAuthenticated) {
      const savedCart = localStorage.getItem("shoppingCart");
      if (savedCart) {
        try {
          setLocalCart(JSON.parse(savedCart));
        } catch (error) {
          console.error("Error loading cart from localStorage:", error);
          setLocalCart({});
        }
      }
    }
  }, [isAuthenticated]);

  // Save local cart to localStorage
  const saveToLocalStorage = (cart: { [productId: number]: number }) => {
    if (!isAuthenticated) {
      localStorage.setItem("shoppingCart", JSON.stringify(cart));
      setLocalCart(cart);
    }
  };

  // Get current cart (either from server or localStorage)
  const getCurrentCart = () => {
    if (isAuthenticated && persistentCartData) {
      return persistentCartData.cart || {};
    }
    return localCart;
  };

  // Get cart items with full details
  const getCartItems = () => {
    if (isAuthenticated && persistentCartData) {
      return persistentCartData.items || [];
    }
    return [];
  };

  // Get total item count
  const getItemCount = () => {
    const cart = getCurrentCart();
    return Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  };

  // Get total cart value
  const getTotalValue = () => {
    if (isAuthenticated && persistentCartData) {
      return persistentCartData.totalValue || 0;
    }
    // For local cart, we'd need product prices to calculate
    return 0;
  };

  // Add item to cart (local or persistent)
  const addToCart = (productId: number, quantity: number = 1, unitPrice?: number) => {
    if (isAuthenticated) {
      addItemMutation.mutate({ productId, quantity, unitPrice });
    } else {
      const newCart = { ...localCart };
      newCart[productId] = (newCart[productId] || 0) + quantity;
      saveToLocalStorage(newCart);
    }
  };

  // Update item quantity
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    if (isAuthenticated) {
      updateQuantityMutation.mutate({ productId, quantity });
    } else {
      const newCart = { ...localCart };
      newCart[productId] = quantity;
      saveToLocalStorage(newCart);
    }
  };

  // Remove item from cart
  const removeFromCart = (productId: number) => {
    if (isAuthenticated) {
      removeItemMutation.mutate({ productId });
    } else {
      const newCart = { ...localCart };
      delete newCart[productId];
      saveToLocalStorage(newCart);
    }
  };

  // Clear entire cart
  const clearCart = () => {
    if (isAuthenticated) {
      clearCartMutation.mutate();
    } else {
      localStorage.removeItem("shoppingCart");
      setLocalCart({});
    }
  };

  // Sync local cart with server when user logs in
  const syncCartWithServer = () => {
    if (isAuthenticated && Object.keys(localCart).length > 0) {
      syncCartMutation.mutate(localCart);
      // Clear local cart after successful sync
      localStorage.removeItem("shoppingCart");
      setLocalCart({});
    }
  };

  return {
    // Data
    cart: getCurrentCart(),
    cartItems: getCartItems(),
    itemCount: getItemCount(),
    totalValue: getTotalValue(),
    isLoading: isAuthenticated ? isLoading : false,
    
    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    syncCartWithServer,
    refetchCart: refetch,
    
    // Mutation states
    isAdding: addItemMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
    isRemoving: removeItemMutation.isPending,
    isClearing: clearCartMutation.isPending,
    isSyncing: syncCartMutation.isPending,
  };
}