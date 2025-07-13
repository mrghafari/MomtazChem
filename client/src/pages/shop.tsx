import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, Plus, Minus, Filter, Search, Grid, List, Star, User, LogOut, X, ChevronDown, Eye, Brain, Sparkles, Wallet, FileText, Download, AlertTriangle, Package, MessageSquare } from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RangeSlider } from "@/components/ui/range-slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import type { ShopProduct, ShopCategory } from "@shared/shop-schema";
import Checkout from "./checkout";
import BilingualPurchaseForm from "@/components/bilingual-purchase-form";
import PreCheckoutModal from "@/components/checkout/pre-checkout-modal";


import CustomerAuth from "@/components/auth/customer-auth";
import { useMultilingualToast } from "@/hooks/use-multilingual-toast";
import VisualBarcode from "@/components/ui/visual-barcode";
import { ProductRating } from "@/components/ProductRating";
import StarRating from "@/components/StarRating";
import { ProductSpecsModal } from "@/components/ProductSpecsModal";

const Shop = () => {
  const { toast } = useMultilingualToast();
  const { t, direction } = useLanguage();


  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  // Initialize cart from localStorage or sessionStorage based on auth status
  const [cart, setCart] = useState<{[key: number]: number}>(() => {
    // For guests, use sessionStorage (cleared on tab close/refresh if not logged in)
    // For logged-in users, use localStorage (persistent)
    const guestCart = sessionStorage.getItem('momtazchem_guest_cart');
    const userCart = localStorage.getItem('momtazchem_user_cart');
    
    // Start with guest cart if available, will be migrated to user cart on login
    return guestCart ? JSON.parse(guestCart) : (userCart ? JSON.parse(userCart) : {});
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [showPreCheckout, setShowPreCheckout] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [selectedProductForSpecs, setSelectedProductForSpecs] = useState<any>(null);
  const [showSpecsModal, setShowSpecsModal] = useState(false);

  const [productQuantities, setProductQuantities] = useState<{[key: number]: number}>({});
  const [displayStock, setDisplayStock] = useState<{[key: number]: number}>({});
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [customer, setCustomer] = useState<any>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Advanced search state
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    priceMin: undefined as number | undefined,
    priceMax: undefined as number | undefined,
    inStock: undefined as boolean | undefined,

    sortBy: 'relevance' as 'name' | 'price' | 'created' | 'relevance',
    sortOrder: 'desc' as 'asc' | 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 12;

  // Debounce search term - only search with 3+ characters
  useEffect(() => {
    const timer = setTimeout(() => {
      // Only set debounced query if searchTerm has 3+ characters or is empty
      if (searchTerm.length >= 3 || searchTerm.length === 0) {
        setDebouncedQuery(searchTerm);
        setCurrentPage(0);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Advanced search query
  const { data: searchResults, isLoading: productsLoading } = useQuery({
    queryKey: ['shopSearch', debouncedQuery, filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        q: debouncedQuery || '', // Always include query parameter, even if empty
        limit: itemsPerPage.toString(),
        offset: (currentPage * itemsPerPage).toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });
      
      // Always perform search - removed character limit restriction
      // This ensures we always get proper total count from search API

      if (filters.category) params.append('category', filters.category);
      if (filters.priceMin !== undefined) params.append('priceMin', filters.priceMin.toString());
      if (filters.priceMax !== undefined) params.append('priceMax', filters.priceMax.toString());
      if (filters.inStock !== undefined) params.append('inStock', filters.inStock.toString());
      if (filters.tags?.length) {
        filters.tags.forEach(tag => params.append('tags', tag));
      }

      const response = await fetch(`/api/shop/search?${params}`);
      if (!response.ok) throw new Error('Search failed');
      return response.json();
    }
  });

  // Fetch all shop products for total count
  const { data: products = [] } = useQuery<ShopProduct[]>({
    queryKey: ["/api/shop/products"],
  });

  // Get data from search results or fallback to regular products
  const currentProducts = searchResults?.data?.products || products;
  
  // Shop products are all visible by default (no visibleInShop field needed)
  const filteredProducts = currentProducts;
  
  const totalResults = searchResults?.data?.total || products.length;
  const availableFilters = searchResults?.data?.filters;
  const totalPages = Math.ceil(totalResults / itemsPerPage);



  // Fetch product stats for ratings
  const { data: productStats } = useQuery({
    queryKey: ["/api/shop/product-stats"],
    retry: false,
  });

  // Initialize price range only once when first loaded
  useEffect(() => {
    if (availableFilters?.priceRange && priceRange[0] === 0 && priceRange[1] === 0) {
      const { min, max } = availableFilters.priceRange;
      // Convert string values to numbers for the slider
      const minNum = typeof min === 'string' ? parseFloat(min) : min;
      const maxNum = typeof max === 'string' ? parseFloat(max) : max;
      
      setPriceRange([minNum, maxNum]);
      // Only set initial filter values if they're not already set
      if (filters.priceMin === undefined && filters.priceMax === undefined) {
        setFilters(prev => ({ ...prev, priceMin: minNum, priceMax: maxNum }));
      }
    }
  }, [availableFilters?.priceRange]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const handlePriceRangeChange = (value: [number, number]) => {
    // Ensure proper range handling with immediate display update
    if (Array.isArray(value) && value.length === 2 && !isNaN(value[0]) && !isNaN(value[1])) {
      // Update display immediately
      setPriceRange(value);
      // Update filters and trigger API call
      setFilters(prev => ({ ...prev, priceMin: value[0], priceMax: value[1] }));
      setCurrentPage(0);
    }
  };



  const clearFilters = () => {
    setFilters({
      category: "",
      priceMin: undefined,
      priceMax: undefined,
      inStock: undefined,

      sortBy: 'relevance',
      sortOrder: 'desc'
    });
    setCurrentPage(0);
    if (availableFilters?.priceRange) {
      const { min, max } = availableFilters.priceRange;
      // Convert string values to numbers for the slider
      const minNum = typeof min === 'string' ? parseFloat(min) : min;
      const maxNum = typeof max === 'string' ? parseFloat(max) : max;
      setPriceRange([minNum, maxNum]);
    }
  };

  const handleShowSpecs = (product: any) => {
    setSelectedProductForSpecs(product);
    setShowSpecsModal(true);
  };

  // Fetch shop categories
  const { data: categories = [] } = useQuery<ShopCategory[]>({
    queryKey: ["/api/shop/categories"],
  });

  // Sync cart changes with appropriate storage
  useEffect(() => {
    if (Object.keys(cart).length > 0 || customer !== null) {
      saveCartToStorage(cart);
    }
  }, [cart, customer]);

  // Load customer info on component mount
  useEffect(() => {
    checkCustomerAuth();
  }, []);

  // Initialize display stock from actual database values (not affected by cart)
  useEffect(() => {
    if (currentProducts?.length > 0) {
      const initialDisplayStock: {[key: number]: number} = {};
      currentProducts.forEach(product => {
        // Show actual stock quantity from database, not reduced by cart items
        initialDisplayStock[product.id] = product.stockQuantity || 0;
      });
      setDisplayStock(initialDisplayStock);
    }
  }, [currentProducts]); // Removed cart dependency to prevent UI stock reduction

  // Force recalculation of display stock after order completion
  useEffect(() => {
    if (Object.keys(displayStock).length === 0 && currentProducts?.length > 0) {
      const refreshedDisplayStock: {[key: number]: number} = {};
      currentProducts.forEach(product => {
        const productInCart = cart[product.id] || 0;
        const availableStock = (product.stockQuantity || 0) - productInCart;
        refreshedDisplayStock[product.id] = Math.max(0, availableStock);
      });
      setDisplayStock(refreshedDisplayStock);
    }
  }, [currentProducts, displayStock, cart]);

  // Handle cart based on authentication status after customer state is known
  useEffect(() => {
    if (customer) {
      // Authenticated user - load from localStorage
      const userCart = localStorage.getItem('momtazchem_user_cart');
      if (userCart) {
        setCart(JSON.parse(userCart));
      }
    } else if (customer === null && !isLoadingCustomer) {
      // Guest user confirmed - load guest cart if available
      const guestCart = sessionStorage.getItem('momtazchem_guest_cart');
      if (guestCart) {
        setCart(JSON.parse(guestCart));
      } else {
        setCart({});
      }
    }
  }, [customer, isLoadingCustomer]);

  // Force cart refresh on page load/navigation
  useEffect(() => {
    const refreshCart = () => {
      if (customer) {
        const userCart = localStorage.getItem('momtazchem_user_cart');
        if (userCart) {
          const cartData = JSON.parse(userCart);
          setCart(cartData);
        }
      } else if (!isLoadingCustomer) {
        const guestCart = sessionStorage.getItem('momtazchem_guest_cart');
        if (guestCart) {
          const cartData = JSON.parse(guestCart);
          setCart(cartData);
        }
      }
    };

    // Refresh cart on window focus (navigation between tabs/pages)
    window.addEventListener('focus', refreshCart);
    
    return () => {
      window.removeEventListener('focus', refreshCart);
    };
  }, [customer, isLoadingCustomer]);

  const checkCustomerAuth = async () => {
    try {
      const response = await fetch('/api/customers/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCustomer(result.customer);
          // Fetch wallet balance
          fetchWalletBalance();
          
          // Handle cart migration from guest to authenticated user
          migrateGuestCartToUser();
        } else {
          // User is not authenticated, handle guest cart
          handleGuestCart();
        }
      } else {
        // User is not authenticated, handle guest cart
        handleGuestCart();
      }
    } catch (error) {
      // Suppress auth errors as they're expected for guest users
      if (!error.message?.includes('401') && !error.message?.includes('احراز هویت نشده')) {
        console.error('Error checking customer auth:', error);
      }
      // Handle as guest
      handleGuestCart();
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await fetch('/api/customers/wallet/balance', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWalletBalance(result.balance || 0);
        }
      }
    } catch (error) {
      // Suppress wallet errors for guest users
      if (!error.message?.includes('401') && !error.message?.includes('احراز هویت نشده')) {
        console.error('Error fetching wallet balance:', error);
      }
    }
  };

  const migrateGuestCartToUser = () => {
    // Since guest cart is only in memory, get current cart state
    const currentCart = cart;
    
    if (Object.keys(currentCart).length > 0) {
      // Merge current guest cart with existing user cart if any
      const userCart = localStorage.getItem('momtazchem_user_cart');
      const userCartData = userCart ? JSON.parse(userCart) : {};
      
      const mergedCart = { ...userCartData, ...currentCart };
      localStorage.setItem('momtazchem_user_cart', JSON.stringify(mergedCart));
      
      setCart(mergedCart);
    } else {
      // Load existing user cart
      const userCart = localStorage.getItem('momtazchem_user_cart');
      if (userCart) {
        setCart(JSON.parse(userCart));
      }
    }
  };

  const handleGuestCart = () => {
    // Clear user cart data and use session cart only for guests
    const guestCart = sessionStorage.getItem('momtazchem_guest_cart');
    if (guestCart) {
      setCart(JSON.parse(guestCart));
    } else {
      // Check if we have any cart data from user cart that needs to be cleared
      setCart({});
      localStorage.removeItem('momtazchem_user_cart');
    }
  };

  const handleLoginSuccess = (customerData: any) => {
    setCustomer(customerData);
    fetchWalletBalance();
    
    // Invalidate cache to refresh header
    queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
    queryClient.invalidateQueries({ queryKey: ["/api/customer/wallet"] });
    
    // Check if user has items in cart before migration
    const hasCartItems = Object.keys(cart).length > 0;
    
    // Migrate guest cart to user cart
    migrateGuestCartToUser();
    
    toast({
      title: "خوش آمدید",
      description: `${customerData.firstName} ${customerData.lastName}`,
    });
    
    // If user had items in cart, show checkout modal, otherwise to profile
    setTimeout(() => {
      if (hasCartItems) {
        setShowCheckout(true);
        toast({
          title: "آماده پرداخت",
          description: "کالاهای شما در سبد خرید منتظر پرداخت هستند",
        });
      } else {
        navigate("/customer/profile");
      }
    }, 1000);
  };

  const handleRegisterSuccess = (customerData: any) => {
    setCustomer(customerData);
    fetchWalletBalance();
    
    // Invalidate cache to refresh header
    queryClient.invalidateQueries({ queryKey: ["/api/customers/me"] });
    queryClient.invalidateQueries({ queryKey: ["/api/customer/wallet"] });
    
    // Check if user has items in cart before migration
    const hasCartItems = Object.keys(cart).length > 0;
    
    // Migrate guest cart to user cart
    migrateGuestCartToUser();
    
    toast({
      title: "ثبت‌نام موفق",
      description: `خوش آمدید ${customerData.firstName} ${customerData.lastName}`,
    });
    
    // If user had items in cart, show checkout modal, otherwise to profile
    setTimeout(() => {
      if (hasCartItems) {
        setShowCheckout(true);
        toast({
          title: "آماده پرداخت",
          description: "کالاهای انتخابی شما آماده پرداخت است",
        });
      } else {
        navigate("/customer/profile");
      }
    }, 1000);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/customers/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        setCustomer(null);
        setWalletBalance(0);
        toast({
          title: "خروج موفق",
          description: "با موفقیت از حساب کاربری خارج شدید",
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "خطا",
        description: "خطا در خروج از حساب کاربری",
        variant: "destructive",
      });
    }
  };

  // Legacy filter and sort products
  const legacyFilteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      return matchesSearch && matchesCategory && product.isActive;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price-high":
          return parseFloat(b.price) - parseFloat(a.price);
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  // Save cart to appropriate storage based on authentication
  const saveCartToStorage = (cartData: {[key: number]: number}) => {
    if (customer) {
      // Authenticated user - use localStorage (persists through refresh)
      localStorage.setItem('momtazchem_user_cart', JSON.stringify(cartData));
    } else {
      // Guest user - don't save to any persistent storage
      // Cart will be lost on refresh as requested
      // Only keep in memory during current session
    }
  };

  // Cart functions
  const getProductQuantity = (productId: number) => {
    return productQuantities[productId] || 1;
  };

  const setProductQuantity = (productId: number, quantity: number) => {
    // Find the product to get actual stock and inStock status
    const product = currentProducts.find(p => p.id === productId);
    if (!product) return;
    
    // Check if product is in stock
    if (!product.inStock || (product.stockQuantity || 0) <= 0) {
      toast({
        title: "موجودی ناکافی",
        description: "این محصول در حال حاضر موجود نیست",
        variant: "destructive",
      });
      return;
    }
    
    const actualStock = product.stockQuantity || 0;
    const currentInCart = cart[productId] || 0;
    const availableForQuantityInput = actualStock - currentInCart;
    
    // Check if there's any stock available after considering cart items
    if (availableForQuantityInput <= 0) {
      toast({
        title: "موجودی ناکافی",
        description: "حداکثر موجودی این محصول در سبد خرید قرار دارد",
        variant: "destructive",
      });
      return;
    }
    
    const validQuantity = Math.max(1, Math.min(quantity, availableForQuantityInput));
    
    setProductQuantities(prev => ({
      ...prev,
      [productId]: validQuantity
    }));
  };

  const addToCart = (productId: number) => {
    const targetQuantity = getProductQuantity(productId);
    
    // Find the product to get actual stock quantity
    const product = currentProducts.find(p => p.id === productId);
    if (!product) {
      toast({
        title: "خطا",
        description: "محصول یافت نشد",
        variant: "destructive",
      });
      return;
    }

    const currentQuantityInCart = cart[productId] || 0;
    const newQuantityInCart = currentQuantityInCart + targetQuantity;
    const actualStock = product.stockQuantity || 0;
    
    // First check: ensure product is in stock and has available quantity
    if (!product.inStock || actualStock <= 0) {
      toast({
        title: "موجودی ناکافی",
        description: "این محصول موجود نیست",
        variant: "destructive",
      });
      return;
    }
    
    // Second check: ensure target quantity is valid
    if (targetQuantity <= 0) {
      toast({
        title: "خطا",
        description: "تعداد محصول باید بیشتر از صفر باشد",
        variant: "destructive",
      });
      return;
    }
    
    // Third check: ensure total cart quantity doesn't exceed stock
    if (newQuantityInCart > actualStock) {
      toast({
        title: "موجودی ناکافی",
        description: `حداکثر ${actualStock} عدد از این محصول موجود است. شما قبلاً ${currentQuantityInCart} عدد در سبد خرید دارید.`,
        variant: "destructive",
      });
      return;
    }
    
    const newCart = {
      ...cart,
      [productId]: newQuantityInCart
    };
    setCart(newCart);
    saveCartToStorage(newCart);

    // DO NOT update displayStock here - it should only reflect actual database values
    // Display stock will be updated only after successful order submission

    // Reset quantity for this product and show success message
    setProductQuantity(productId, 1);
    toast({
      title: "success",
      description: "addedToCart",
    });
  };

  const removeFromCart = (productId: number) => {
    const currentQuantityInCart = cart[productId] || 0;
    
    const newCart = { ...cart };
    if (newCart[productId] > 1) {
      newCart[productId]--;
    } else {
      delete newCart[productId];
    }
    setCart(newCart);
    saveCartToStorage(newCart);

    // DO NOT update displayStock - it should only reflect actual database values
    // Display stock will be updated only after successful order submission
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [productId, qty]) => {
      const product = products.find(p => p.id === parseInt(productId));
      if (!product) return total;
      
      const price = getDiscountedPrice(product, qty);
      return total + (price * qty);
    }, 0);
  };

  // Calculate discounted price based on quantity
  const getDiscountedPrice = (product: any, quantity: number) => {
    const basePrice = parseFloat(product.price || '0');
    
    // Check if product has quantity discounts
    let discounts = product.quantityDiscounts;
    
    // If quantityDiscounts is a string, try to parse it
    if (typeof discounts === 'string') {
      try {
        discounts = JSON.parse(discounts);
      } catch (e) {
        console.log('Failed to parse quantityDiscounts:', discounts);
        return basePrice;
      }
    }
    
    if (discounts && Array.isArray(discounts) && discounts.length > 0) {
      // Sort discounts by minimum quantity (descending) to get highest applicable discount
      const sortedDiscounts = discounts
        .filter((d: any) => quantity >= parseInt(d.minQty || d.min_qty || 0))
        .sort((a: any, b: any) => parseInt(b.minQty || b.min_qty || 0) - parseInt(a.minQty || a.min_qty || 0));
      
      if (sortedDiscounts.length > 0) {
        const discount = sortedDiscounts[0];
        // Handle both discount formats: decimal (0.1) and percentage (10)
        const discountValue = discount.discount || (parseFloat(discount.discountPercent || discount.discount_percent || 0) / 100);
        const discountedPrice = basePrice * (1 - discountValue);
        console.log(`Shop Product ${product.name}: quantity=${quantity}, basePrice=${basePrice}, discount=${discountValue}, discountedPrice=${discountedPrice}`);
        return discountedPrice;
      }
    }
    
    return basePrice;
  };

  // Helper function to get next discount info
  const getNextDiscountInfo = (product: any, currentQuantity: number = 0) => {
    if (!product.quantityDiscounts || !Array.isArray(product.quantityDiscounts)) {
      return null;
    }

    // Sort discounts by minQty
    const sortedDiscounts = [...product.quantityDiscounts].sort((a, b) => a.minQty - b.minQty);
    
    // Find the next applicable discount
    for (const discount of sortedDiscounts) {
      if (currentQuantity < discount.minQty) {
        const remaining = discount.minQty - currentQuantity;
        return {
          remaining,
          minQty: discount.minQty,
          discount: discount.discount
        };
      }
    }

    return null;
  };

  // Helper function to get current discount info
  const getCurrentDiscountInfo = (product: any, quantity: number = 1) => {
    if (!product.quantityDiscounts || !Array.isArray(product.quantityDiscounts)) {
      return null;
    }

    // Find the highest applicable discount
    let applicableDiscount = null;
    for (const discount of product.quantityDiscounts) {
      if (quantity >= discount.minQty) {
        if (!applicableDiscount || discount.discount > applicableDiscount.discount) {
          applicableDiscount = discount;
        }
      }
    }

    return applicableDiscount;
  };

  // Calculate total savings
  const getTotalSavings = () => {
    return Object.entries(cart).reduce((savings, [productId, qty]) => {
      const product = products.find(p => p.id === parseInt(productId));
      if (!product) return savings;
      
      const basePrice = parseFloat(product.price);
      const discountedPrice = getDiscountedPrice(product, qty);
      return savings + ((basePrice - discountedPrice) * qty);
    }, 0);
  };

  // Pre-checkout handlers
  const handleCartClick = () => {
    if (getTotalItems() === 0) return;
    
    // Direct checkout without cart modal
    if (customer && customer.id) {
      // User is logged in, proceed directly to checkout
      setShowCheckout(true);
    } else {
      // User not logged in, show pre-checkout modal
      setShowPreCheckout(true);
    }
  };

  const handleLoginChoice = () => {
    setShowPreCheckout(false);
    setAuthMode('login');
    setShowAuth(true);
  };

  const handleRegisterChoice = () => {
    setShowPreCheckout(false);
    setAuthMode('register');
    setShowAuth(true);
  };

  const handleGuestCheckout = () => {
    setShowPreCheckout(false);
    setShowCheckout(true);
  };

  const handleAuthSuccess = (customerData: any) => {
    setCustomer(customerData);
    setShowAuth(false);
    
    // Check if customer profile is complete for checkout
    const isProfileComplete = customerData.phone && customerData.country && 
                              customerData.city && customerData.address;
    
    // Only proceed to checkout if cart has items AND profile is complete
    if (getTotalItems() > 0 && isProfileComplete) {
      // Profile is complete and cart has items, proceed to checkout
      setShowCheckout(true);
      toast({
        title: direction === 'rtl' ? "ورود موفق" : "Login Successful",
        description: direction === 'rtl' ? "خوش آمدید! حالا می‌توانید خرید کنید" : "Welcome back! You can now checkout",
      });
    } else if (getTotalItems() > 0 && !isProfileComplete) {
      // Profile needs completion for checkout, show registration form with pre-filled data
      setAuthMode('register');
      setShowAuth(true);
      toast({
        title: direction === 'rtl' ? "تکمیل اطلاعات" : "Complete Profile",
        description: direction === 'rtl' ? "لطفاً اطلاعات ناقص خود را تکمیل کنید" : "Please complete your profile information",
        variant: "default",
      });
    } else {
      // Just a regular login, no checkout needed
      toast({
        title: direction === 'rtl' ? "ورود موفق" : "Login Successful",
        description: direction === 'rtl' ? "خوش آمدید!" : "Welcome back!",
      });
    }
  };

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between relative">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold text-gray-900">{t.shop.title}</h1>
              
              {/* AI Recommendations Button - Left */}
              <Button 
                variant="outline" 
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none hover:from-purple-600 hover:to-pink-600 shadow-lg"
                onClick={() => navigate('/product-recommendations')}

              >
                <Sparkles className="w-5 h-5" />
                <span className="hidden sm:inline">AI Recommendations</span>
              </Button>
            </div>
            
            {/* User & Cart Section */}
            <div className="flex items-center gap-4">
              {/* User Account */}
              {!isLoadingCustomer && !customer && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAuth(true)}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm">Login</span>
                  </Button>
                </div>
              )}

              {/* Logged in Customer */}
              {!isLoadingCustomer && customer && (
                <div className="flex items-center gap-2">
                  {/* Profile Button */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/customer/profile')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {customer.firstName} {customer.lastName}
                    </span>
                  </Button>
                  
                  {/* Wallet Button */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/customer/wallet')}
                    className="flex items-center gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm">
                      {walletBalance.toLocaleString()} IQD
                    </span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Cart Summary */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleCartClick}
                  disabled={getTotalItems() === 0}
                >
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({getTotalItems()})
                  {getTotalItems() > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {getTotalPrice().toFixed(2)}
                      </Badge>
                      {getTotalSavings() > 0 && (
                        <Badge variant="default" className="bg-green-600">
                          Save {getTotalSavings().toFixed(2)}
                        </Badge>
                      )}
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          <div className="w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Advanced Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Search Products</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search products... (minimum 3 characters)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10"
                    />
                    {/* Search hint */}
                    {searchTerm.length > 0 && searchTerm.length < 3 && (
                      <div className="absolute top-full left-0 right-0 bg-yellow-50 border border-yellow-200 rounded-b-lg px-3 py-2 text-xs text-yellow-700 z-10">
                        Type at least 3 characters to search
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Sort Options */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Sort by</label>
                  <div className="space-y-2">
                    <Select 
                      value={filters.sortBy} 
                      onValueChange={(value) => handleFilterChange('sortBy', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevance</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="price">Price</SelectItem>
                        <SelectItem value="created">Newest</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select 
                      value={filters.sortOrder} 
                      onValueChange={(value) => handleFilterChange('sortOrder', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">A-Z / Low-High</SelectItem>
                        <SelectItem value="desc">Z-A / High-Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Categories */}
                {availableFilters?.categories && availableFilters.categories.length > 0 && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Categories</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {availableFilters.categories.map((cat: any) => (
                          <div key={cat.name} className="flex items-center space-x-2">
                            <Checkbox
                              id={`cat-${cat.name}`}
                              checked={filters.category === cat.name}
                              onCheckedChange={(checked) => 
                                handleFilterChange('category', checked ? cat.name : "")
                              }
                            />
                            <label 
                              htmlFor={`cat-${cat.name}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {cat.name} ({cat.count})
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Price Range */}
                {availableFilters?.priceRange && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Price Range: {priceRange[0]} - {priceRange[1]} IQD
                      </label>
                      <div className="mt-2">
                        <RangeSlider
                          value={priceRange}
                          onValueChange={handlePriceRangeChange}
                          max={typeof availableFilters.priceRange.max === 'string' ? parseFloat(availableFilters.priceRange.max) : availableFilters.priceRange.max}
                          min={typeof availableFilters.priceRange.min === 'string' ? parseFloat(availableFilters.priceRange.min) : availableFilters.priceRange.min}
                          step={5}
                          className="w-full"
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{typeof availableFilters.priceRange.min === 'string' ? parseFloat(availableFilters.priceRange.min) : availableFilters.priceRange.min} IQD</span>
                        <span>{typeof availableFilters.priceRange.max === 'string' ? parseFloat(availableFilters.priceRange.max) : availableFilters.priceRange.max} IQD</span>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Stock Status */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Availability</label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="in-stock"
                      checked={filters.inStock === true}
                      onCheckedChange={(checked) => 
                        handleFilterChange('inStock', checked ? true : undefined)
                      }
                    />
                    <label htmlFor="in-stock" className="text-sm cursor-pointer">
                      In Stock Only
                    </label>
                  </div>
                </div>



                <Separator />

                {/* Clear Filters */}
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearFilters}
                  disabled={!Object.values(filters).some(v => v && (Array.isArray(v) ? v.length > 0 : true))}
                >
                  Clear All Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {/* View Toggle */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                نمایش {totalResults} محصول{totalResults !== 1 ? ' ' : ''} {currentPage > 0 ? `(صفحه ${currentPage + 1} از ${totalPages})` : ''}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            <div className={`${
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "flex flex-col gap-4"
            }`}>
              {productsLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <ProductCardSkeleton key={index} viewMode={viewMode} />
                ))
              ) : (filteredProducts.length === 0) ? (
                <div className="col-span-full text-center py-12">
                  <div className="mb-4">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg mb-2">No products found matching your criteria</p>
                    <p className="text-gray-400 text-sm">Try adjusting your search terms or clearing filters</p>
                  </div>
                  <Button variant="outline" onClick={clearFilters} className="mt-4">
                    Clear all filters
                  </Button>
                </div>
              ) : (
                filteredProducts.map((product: any) => (
                  <Card key={product.id} className={viewMode === "list" ? "flex" : ""}>
                    {viewMode === "grid" ? (
                      <>
                        <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                          
                          {/* Star Rating - More to the left */}
                          {productStats?.[product.id] && (
                            <div className="absolute bottom-2 left-8 flex items-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-7 w-7 hover:bg-yellow-50/80 bg-transparent"
                                onClick={() => navigate(`/product-reviews/${product.id}`)}
                              >
                                <StarRating
                                  rating={productStats[product.id].averageRating}
                                  size="sm"
                                  showNumber={false}
                                />
                              </Button>
                            </div>
                          )}
                          


                          {/* Reviews and Specs - Right side */}
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg">
                            {/* Reviews Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-7 w-7 hover:bg-green-50"
                              onClick={() => navigate(`/product-reviews/${product.id}`)}
                            >
                              <MessageSquare className="w-3 h-3 text-green-600" />
                            </Button>
                            
                            {/* Product Specifications */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-7 w-7 hover:bg-blue-50"
                              onClick={() => handleShowSpecs(product)}
                            >
                              <Package className="w-3 h-3 text-blue-600" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-4">
                          <div className="mb-2">
                            <h3 className="font-semibold text-lg">{product.name}</h3>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {product.shortDescription || product.description}
                          </p>
                          
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="text-2xl font-bold text-green-600">
                                {product.price && !isNaN(parseFloat(product.price)) ? parseFloat(product.price).toFixed(2) : '0.00'}
                              </span>
                              <span className="text-sm text-gray-500 ml-1">
                                / {product.priceUnit || 'unit'}
                              </span>
                            </div>
                            <div className="flex flex-col gap-1">
                              <Badge variant={product.inStock ? "secondary" : "destructive"}>
                                {product.inStock ? "In Stock" : "Out of Stock"}
                              </Badge>
                              

                            </div>
                          </div>
                          


                          {/* Low Stock Warning - Multilingual */}
                          {product.inStock && displayStock[product.id] && product.lowStockThreshold && 
                            displayStock[product.id] <= product.lowStockThreshold && (
                            <div className="mb-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
                              <div className="flex items-center gap-2" dir={direction}>
                                <AlertTriangle className="w-4 h-4 text-orange-500 animate-pulse" />
                                <span className="text-sm font-semibold text-orange-800">
                                  {t.shop?.lowStockWarning?.replace('{count}', (displayStock[product.id] || 0).toString()) || 
                                   `Only ${displayStock[product.id] || 0} items left!`}
                                </span>
                              </div>
                            </div>
                          )}



                          {/* Modern Discount Card */}
                          <div className="mb-3 h-24 overflow-hidden">
                            {product.quantityDiscounts && Array.isArray(product.quantityDiscounts) && product.quantityDiscounts.length > 0 ? (
                              <div className="relative h-full bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl overflow-hidden shadow-md border border-purple-200">
                                {/* Animated Background */}
                                <div className="absolute inset-0">
                                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-purple-100/30 rounded-full animate-pulse"></div>
                                  <div className="absolute -bottom-2 -left-2 w-12 h-12 bg-yellow-100/40 rounded-full animate-bounce"></div>
                                  <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-pink-100/30 rounded-full animate-ping"></div>
                                </div>
                                
                                {/* Glassmorphism Overlay */}
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>
                                
                                <div className="relative z-20 p-3 h-full flex flex-col justify-between text-gray-700">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-lg animate-pulse"></div>
                                      <span className="text-xs font-semibold uppercase tracking-wider">Volume Deals</span>
                                    </div>
                                    <div className="bg-white/60 backdrop-blur-sm rounded-full px-2 py-1">
                                      <span className="text-xs font-medium">
                                        {product.quantityDiscounts.length} Tiers
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {(() => {
                                    const currentQty = getProductQuantity(product.id);
                                    const currentDiscount = getCurrentDiscountInfo(product, currentQty);
                                    const nextDiscount = getNextDiscountInfo(product, currentQty);
                                    
                                    return (
                                      <div className="space-y-1">
                                        {/* Discount Levels Bar */}
                                        <div className="flex gap-1 mb-2">
                                          {product.quantityDiscounts.map((d: any, i: number) => {
                                            const isActive = currentDiscount && currentDiscount.discount === d.discount;
                                            return (
                                              <div
                                                key={i}
                                                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                                                  isActive 
                                                    ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' 
                                                    : currentQty >= d.minQty 
                                                      ? 'bg-green-400' 
                                                      : 'bg-white/40'
                                                }`}
                                              />
                                            );
                                          })}
                                        </div>
                                        
                                        {/* Status Display */}
                                        {currentDiscount ? (
                                          <div className="bg-green-50 backdrop-blur-sm rounded-lg p-2 border border-green-100">
                                            <div className="flex items-center justify-between text-xs">
                                              <div className="flex items-center gap-1">
                                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                <span className="font-semibold text-green-700">{(currentDiscount.discount * 100).toFixed(0)}% ACTIVE</span>
                                              </div>
                                              <span className="font-semibold text-green-700">
                                                ${(parseFloat(product.price || "0") * currentDiscount.discount * currentQty).toFixed(1)} OFF
                                              </span>
                                            </div>
                                          </div>
                                        ) : nextDiscount ? (
                                          <div className="bg-orange-50 backdrop-blur-sm rounded-lg p-2 border border-orange-100">
                                            <div className="flex items-center gap-1 text-xs">
                                              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                                              <span className="font-semibold text-orange-700">
                                                +{nextDiscount.remaining} more → {(nextDiscount.discount * 100).toFixed(0)}% OFF
                                              </span>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 border border-white/30">
                                            <div className="flex items-center gap-1 text-xs">
                                              <div className="w-2 h-2 bg-white/70 rounded-full"></div>
                                              <span className="font-bold text-white/90">
                                                {product.quantityDiscounts[0].minQty}+ items: {(product.quantityDiscounts[0].discount * 100).toFixed(0)}% OFF
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            ) : (
                              <div className="h-full"></div>
                            )}
                          </div>



                          <div className="space-y-2">
                            {/* Quantity Controls - Always show */}
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setProductQuantity(product.id, getProductQuantity(product.id) - 1)}
                                disabled={getProductQuantity(product.id) <= 1}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <input
                                type="number"
                                min="1"
                                max={Math.max(1, (product.stockQuantity || 0) - (cart[product.id] || 0))}
                                value={getProductQuantity(product.id)}
                                onChange={(e) => setProductQuantity(product.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-center border rounded px-2 py-1 font-medium"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setProductQuantity(product.id, getProductQuantity(product.id) + 1)}
                                disabled={!product.inStock || product.stockQuantity <= 0 || getProductQuantity(product.id) >= product.stockQuantity || (cart[product.id] || 0) + getProductQuantity(product.id) >= product.stockQuantity}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                              {/* Product Catalog Button */}
                              {product.showCatalogToCustomers && product.pdfCatalogUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mb-2 text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() => window.open(product.pdfCatalogUrl, '_blank')}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  مشاهده کاتالوگ
                                </Button>
                              )}

                              {/* MSDS Download Button */}
                              {product.showMsdsToCustomers && product.msdsUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mb-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                                  onClick={() => window.open(product.msdsUrl, '_blank')}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  دانلود MSDS
                                </Button>
                              )}
                              
                            {/* Add to Cart Button - Always show */}
                            <Button
                              className="w-full"
                              onClick={() => addToCart(product.id)}
                              disabled={!product.inStock || product.stockQuantity <= 0 || getProductQuantity(product.id) >= product.stockQuantity}
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              {!product.inStock || product.stockQuantity <= 0 ? 'موجود نیست' : cart[product.id] && cart[product.id] > 0 ? 'افزودن بیشتر' : 'افزودن به سبد'}
                            </Button>
                          </div>
                        </CardContent>
                      </>
                    ) : (
                      <div className="flex">
                        <div className="w-48 h-48 bg-gray-100 flex-shrink-0 relative">
                          {product.imageUrl ? (
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                          
                          {/* Star Rating - More to the left - List View */}
                          {productStats?.[product.id] && (
                            <div className="absolute bottom-2 left-8 flex items-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="p-1 h-7 w-7 hover:bg-yellow-50/80 bg-transparent"
                                onClick={() => navigate(`/product-reviews/${product.id}`)}
                              >
                                <StarRating
                                  rating={productStats[product.id].averageRating}
                                  size="sm"
                                  showNumber={false}
                                />
                              </Button>
                            </div>
                          )}
                          


                          {/* Reviews and Specs - Right side - List View */}
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg">
                            {/* Reviews Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-7 w-7 hover:bg-green-50"
                              onClick={() => navigate(`/product-reviews/${product.id}`)}
                            >
                              <MessageSquare className="w-3 h-3 text-green-600" />
                            </Button>
                            
                            {/* Product Specifications */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-7 w-7 hover:bg-blue-50"
                              onClick={() => handleShowSpecs(product)}
                            >
                              <Package className="w-3 h-3 text-blue-600" />
                            </Button>
                          </div>
                        </div>
                        <CardContent className="p-6 flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="mb-2">
                                <h3 className="font-semibold text-xl">{product.name}</h3>
                              </div>
                              <p className="text-gray-600 mb-4">
                                {product.description}
                              </p>
                              
                              <div className="flex items-center gap-4 mb-4">
                                <div>
                                  <span className="text-2xl font-bold text-green-600">
                                    {product.price && !isNaN(parseFloat(product.price)) ? parseFloat(product.price).toFixed(2) : '0.00'}
                                  </span>
                                  <span className="text-sm text-gray-500 ml-1">
                                    / {product.priceUnit || 'unit'}
                                  </span>
                                </div>

                                <div className="flex flex-col gap-1">
                                  <Badge variant={product.inStock ? "secondary" : "destructive"}>
                                    {product.inStock ? "In Stock" : "Out of Stock"}
                                  </Badge>
                                  

                                </div>
                              </div>
                              
                              {/* Modern Discount Card - List View */}
                              <div className="mb-4 h-20">
                                {product.quantityDiscounts && Array.isArray(product.quantityDiscounts) && product.quantityDiscounts.length > 0 ? (
                                  <div className="relative h-full bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 rounded-2xl overflow-hidden shadow-md border border-purple-200">
                                    {/* Animated Background */}
                                    <div className="absolute inset-0">
                                      <div className="absolute -top-2 -right-2 w-12 h-12 bg-purple-100/30 rounded-full animate-pulse"></div>
                                      <div className="absolute -bottom-1 -left-1 w-8 h-8 bg-yellow-100/40 rounded-full animate-bounce"></div>
                                      <div className="absolute top-1/3 left-1/4 w-6 h-6 bg-pink-100/30 rounded-full animate-ping"></div>
                                    </div>
                                    
                                    {/* Glassmorphism Overlay */}
                                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm"></div>
                                    
                                    <div className="relative z-20 p-3 h-full text-gray-700">
                                      <div className="flex items-center justify-between h-full">
                                        <div className="flex items-center gap-3">
                                          <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-lg animate-pulse"></div>
                                            <span className="text-sm font-semibold uppercase tracking-wider">Volume Deals</span>
                                          </div>
                                          
                                          {/* Progress Bar */}
                                          <div className="flex gap-1">
                                            {product.quantityDiscounts.map((d: any, i: number) => {
                                              const currentQty = getProductQuantity(product.id);
                                              const currentDiscount = getCurrentDiscountInfo(product, currentQty);
                                              const isActive = currentDiscount && currentDiscount.discount === d.discount;
                                              return (
                                                <div
                                                  key={i}
                                                  className={`w-8 h-2 rounded-full transition-all duration-300 ${
                                                    isActive 
                                                      ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' 
                                                      : currentQty >= d.minQty 
                                                        ? 'bg-green-400' 
                                                        : 'bg-white/40'
                                                  }`}
                                                />
                                              );
                                            })}
                                          </div>
                                        </div>
                                        
                                        {(() => {
                                          const currentQty = getProductQuantity(product.id);
                                          const currentDiscount = getCurrentDiscountInfo(product, currentQty);
                                          const nextDiscount = getNextDiscountInfo(product, currentQty);
                                          
                                          return (
                                            <div className="flex-1 ml-4">
                                              {/* Status Display */}
                                              {currentDiscount ? (
                                                <div className="bg-green-50 backdrop-blur-sm rounded-lg p-2 border border-green-100">
                                                  <div className="flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-1">
                                                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                                                      <span className="font-semibold text-green-700">{(currentDiscount.discount * 100).toFixed(0)}% ACTIVE</span>
                                                    </div>
                                                    <span className="font-semibold text-green-700">
                                                      ${(parseFloat(product.price || "0") * currentDiscount.discount * currentQty).toFixed(1)} OFF
                                                    </span>
                                                  </div>
                                                </div>
                                              ) : nextDiscount ? (
                                                <div className="bg-orange-50 backdrop-blur-sm rounded-lg p-2 border border-orange-100">
                                                  <div className="flex items-center gap-1 text-sm">
                                                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                                                    <span className="font-semibold text-orange-700">
                                                      +{nextDiscount.remaining} more → {(nextDiscount.discount * 100).toFixed(0)}% OFF
                                                    </span>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 border border-white/30">
                                                  <div className="flex items-center gap-1 text-sm">
                                                    <div className="w-2 h-2 bg-white/70 rounded-full"></div>
                                                    <span className="font-bold text-white/90">
                                                      {product.quantityDiscounts[0].minQty}+ items: {(product.quantityDiscounts[0].discount * 100).toFixed(0)}% OFF
                                                    </span>
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-full"></div>
                                )}
                              </div>

                              {/* Low Stock Warning - List View */}
                              {product.inStock && displayStock[product.id] && product.lowStockThreshold && 
                                displayStock[product.id] <= product.lowStockThreshold && (
                                <div className="mb-4 p-2 bg-orange-50 rounded-lg border border-orange-200">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-semibold text-orange-800">
                                      تنها {displayStock[product.id] || 0} عدد باقی مانده!
                                    </span>
                                  </div>
                                </div>
                              )}


                            </div>
                            
                            <div className="ml-6">
                              <div className="space-y-2">
                                {/* Quantity Controls - Always show */}
                                <div className="flex items-center justify-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setProductQuantity(product.id, getProductQuantity(product.id) - 1)}
                                    disabled={getProductQuantity(product.id) <= 1}
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                  <input
                                    type="number"
                                    min="1"
                                    max={Math.max(1, (product.stockQuantity || 0) - (cart[product.id] || 0))}
                                    value={getProductQuantity(product.id)}
                                    onChange={(e) => setProductQuantity(product.id, parseInt(e.target.value) || 1)}
                                    className="w-16 text-center border rounded px-2 py-1 font-medium"
                                  />
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setProductQuantity(product.id, getProductQuantity(product.id) + 1)}
                                    disabled={!product.inStock || product.stockQuantity <= 0 || getProductQuantity(product.id) >= product.stockQuantity || (cart[product.id] || 0) + getProductQuantity(product.id) >= product.stockQuantity}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                                  {/* Product Catalog Button */}
                                  {product.showCatalogToCustomers && product.pdfCatalogUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full mb-2 text-green-600 border-green-600 hover:bg-green-50"
                                      onClick={() => window.open(product.pdfCatalogUrl, '_blank')}
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      مشاهده کاتالوگ
                                    </Button>
                                  )}

                                  {/* MSDS Download Button */}
                                  {product.showMsdsToCustomers && product.msdsUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full mb-2 text-blue-600 border-blue-600 hover:bg-blue-50"
                                      onClick={() => window.open(product.msdsUrl, '_blank')}
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      دانلود MSDS
                                    </Button>
                                  )}
                                  
                                {/* Add to Cart Button - Always show */}
                                <Button
                                  className="w-full"
                                  onClick={() => addToCart(product.id)}
                                  disabled={!product.inStock || product.stockQuantity <= 0 || getProductQuantity(product.id) >= product.stockQuantity}
                                >
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  {!product.inStock || product.stockQuantity <= 0 ? 'موجود نیست' : cart[product.id] && cart[product.id] > 0 ? 'افزودن بیشتر' : 'افزودن به سبد'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <Button
                  variant="outline"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => {
                    // Show first page, last page, current page and 2 pages around current
                    const pageNum = i;
                    const shouldShow = 
                      pageNum === 0 || // First page
                      pageNum === totalPages - 1 || // Last page
                      Math.abs(pageNum - currentPage) <= 1; // Current page +/- 1
                    
                    if (!shouldShow && totalPages > 7) {
                      // Show ellipsis for gaps
                      if (pageNum === 1 && currentPage > 3) {
                        return <span key={`ellipsis-start`} className="px-2 py-1 text-gray-500">...</span>;
                      }
                      if (pageNum === totalPages - 2 && currentPage < totalPages - 4) {
                        return <span key={`ellipsis-end`} className="px-2 py-1 text-gray-500">...</span>;
                      }
                      return null;
                    }
                    
                    return (
                      <Button
                        key={`pagination-page-${pageNum}`}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  }).filter(Boolean)}
                </div>
                
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages - 1}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bilingual Purchase Form */}
      {showCheckout && (
        <BilingualPurchaseForm
          cart={cart}
          products={currentProducts}
          existingCustomer={customer}
          onOrderComplete={async () => {
            setCart({});
            setShowCheckout(false);
            // Force refresh of products data from server
            await queryClient.invalidateQueries({ queryKey: ['/api/products'] });
            await queryClient.refetchQueries({ queryKey: ['/api/products'] });
            // Reset display stock completely to force recalculation
            setDisplayStock({});
            // Show success message
            toast({
              title: "success",
              description: "orderCreated",
            });
          }}
          onClose={() => setShowCheckout(false)}
          onUpdateQuantity={(productId, newQuantity) => {
            if (newQuantity <= 0) {
              const { [productId]: removed, ...newCart } = cart;
              setCart(newCart);
              localStorage.setItem('momtazchem_cart', JSON.stringify(newCart));
            } else {
              const newCart = { ...cart, [productId]: newQuantity };
              setCart(newCart);
              localStorage.setItem('momtazchem_cart', JSON.stringify(newCart));
            }
          }}
          onRemoveItem={(productId) => {
            const { [productId]: removed, ...newCart } = cart;
            setCart(newCart);
            localStorage.setItem('momtazchem_cart', JSON.stringify(newCart));
          }}
        />
      )}

      {/* Pre-checkout Modal */}
      <PreCheckoutModal
        isOpen={showPreCheckout}
        onClose={() => setShowPreCheckout(false)}
        onLoginChoice={handleLoginChoice}
        onRegisterChoice={handleRegisterChoice}
        onGuestCheckout={handleGuestCheckout}
        cartItemsCount={getTotalItems()}
      />





      {/* Product Specifications Modal */}
      {selectedProductForSpecs && (
        <ProductSpecsModal
          isOpen={showSpecsModal}
          onClose={() => {
            setShowSpecsModal(false);
            setSelectedProductForSpecs(null);
          }}
          product={selectedProductForSpecs}
        />
      )}

      {/* Auth Dialog */}
      <CustomerAuth 
        open={showAuth}
        onOpenChange={setShowAuth}
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
        initialMode={authMode}
        existingCustomer={authMode === 'register' ? customer : undefined}
      />
    </div>
  );
};

// Helper components for skeleton loading
const ProductCardSkeleton = ({ viewMode }: { viewMode: "grid" | "list" }) => (
  <Card className={`animate-pulse ${viewMode === "list" ? "flex" : ""}`}>
    <div className={`bg-gray-200 ${viewMode === "list" ? "w-32 h-32" : "aspect-square"} rounded-t-lg`}></div>
    <CardContent className="p-4">
      <div className="h-4 bg-gray-200 rounded mb-2"></div>
      <div className="h-3 bg-gray-200 rounded mb-2"></div>
      <div className="h-6 bg-gray-200 rounded"></div>
    </CardContent>
  </Card>
);

export default Shop;