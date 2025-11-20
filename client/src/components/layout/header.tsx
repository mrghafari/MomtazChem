import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, Beaker, Droplet, Package, Wheat, Wallet, User, LogOut, ShoppingBag, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useCustomer } from '@/hooks/useCustomer';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

// Company logo via proxy route (supports both local and S3)
const COMPANY_LOGO_URL = "/uploads/company-logos/Momtazchem-Logo.png";

export default function Header() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, direction } = useLanguage();
  const { customer, isAuthenticated, logout } = useCustomer();
  
  // Only check admin auth when in admin routes
  const isInAdminRoute = location.startsWith('/admin');
  const { isAuthenticated: isAdminAuthenticated, logout: adminLogout, user: adminUser } = useAuth();

  // Fetch wallet balance for authenticated customers
  const { data: walletData, isError, error } = useQuery({
    queryKey: ['/api/customers/wallet/balance'],
    enabled: isAuthenticated && !!customer,
    retry: false,
    staleTime: 10000, // 10 seconds
    refetchOnWindowFocus: true,
  });

  // Use admin user from useAuth hook instead of duplicate query

  const rawBalance = walletData?.balance || walletData?.data?.wallet?.balance || walletData?.wallet?.balance || "0";
  const walletBalance = typeof rawBalance === 'string' ? parseFloat(rawBalance) : rawBalance;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'IQD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Function to get admin role display name
  const getAdminRoleDisplay = () => {
    if (!isAdminAuthenticated || !adminUser) {
      return direction === 'rtl' ? 'مدیر' : 'Admin';
    }
    
    const username = adminUser.username;
    if (direction === 'rtl') {
      return username; // Return Persian username directly
    } else {
      // Convert Persian roles to English
      const roleMap: { [key: string]: string } = {
        'سوپر ادمین': 'Super Admin',
        'مدیر مالی': 'Financial Manager',
        'مدیر انبار': 'Warehouse Manager',
        'مدیر لجستیک': 'Logistics Manager'
      };
      return roleMap[username] || username;
    }
  };

  const navigation = [
    { href: '/', label: t.home },
    { href: '/about', label: t.about },
    { href: '/services', label: t.services },
    { href: '/blog', label: direction === 'rtl' ? 'بلاگ' : 'Blog' },
    { href: '/contact', label: t.contact },
    { href: '/shop', label: t.shop.title },
  ];

  const productCategories = [
    {
      title: t.fuelAdditives,
      href: "/products/fuel-additives",
      description: t.fuelAdditivesDesc,
      icon: <Beaker className="h-6 w-6" />,
      color: "blue",
      hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      titleHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400"
    },
    {
      title: t.waterTreatment,
      href: "/products/water-treatment", 
      description: t.waterTreatmentDesc,
      icon: <Droplet className="h-6 w-6" />,
      color: "cyan",
      hoverBg: "hover:bg-cyan-50 dark:hover:bg-cyan-900/20",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      titleHover: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
    },
    {
      title: t.paintSolvents,
      href: "/products/paint-solvents",
      description: t.paintSolventsDesc,
      icon: <Package className="h-6 w-6" />,
      color: "orange",
      hoverBg: "hover:bg-orange-50 dark:hover:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
      titleHover: "group-hover:text-orange-600 dark:group-hover:text-orange-400"
    },

    {
      title: t.agriculturalFertilizers, 
      href: "/products/agricultural-fertilizers",
      description: t.agriculturalFertilizersDesc,
      icon: <Wheat className="h-6 w-6" />,
      color: "emerald",
      hoverBg: "hover:bg-emerald-50 dark:hover:bg-emerald-900/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      titleHover: "group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
    },
    {
      title: t.industrialChemicals,
      href: "/products/industrial-chemicals",
      description: t.industrialChemicalsDesc,
      icon: <Package className="h-6 w-6" />,
      color: "purple",
      hoverBg: "hover:bg-purple-50 dark:hover:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      titleHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400"
    },
    {
      title: t.technicalEquipment,
      href: "/products/technical-equipment",
      description: t.technicalEquipmentDesc,
      icon: <Package className="h-6 w-6" />,
      color: "indigo",
      hoverBg: "hover:bg-indigo-50 dark:hover:bg-indigo-900/20",
      iconColor: "text-indigo-600 dark:text-indigo-400",
      titleHover: "group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
    },
    {
      title: t.commercialGoods,
      href: "/products/commercial-goods",
      description: t.commercialGoodsDesc,
      icon: <Package className="h-6 w-6" />,
      color: "slate",
      hoverBg: "hover:bg-slate-50 dark:hover:bg-slate-900/20",
      iconColor: "text-slate-600 dark:text-slate-400",
      titleHover: "group-hover:text-slate-600 dark:group-hover:text-slate-400"
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60",
      isAdminAuthenticated 
        ? "bg-red-50/95 border-red-200 dark:bg-red-900/95 dark:border-red-800" 
        : "bg-white/95 dark:bg-gray-900/95"
    )}>
      {/* Admin Status Indicator */}
      {isAdminAuthenticated && (
        <div className="text-white text-center py-1 text-sm font-medium bg-[#28c70e]">
          🔐 Admin Mode Active
        </div>
      )}
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2"
            >
              <img 
                src={COMPANY_LOGO_URL} 
                alt="Momtazchem" 
                className="h-8 w-auto"
              />
              <span className="hidden sm:block text-xl font-bold text-gray-900 dark:text-white">
                Momtazchem
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                <motion.span
                  className={cn(
                    "relative px-3 py-2 text-sm font-medium transition-colors flex items-center gap-2",
                    isActive(item.href)
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  )}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                >
                  {item.icon && item.icon}
                  {item.label}
                  {isActive(item.href) && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"
                      layoutId="activeTab"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2 }}
                    />
                  )}
                </motion.span>
              </Link>
            ))}

            {/* Products Dropdown */}
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors",
                    location.startsWith('/products')
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  )}>
                    {t.products}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="!left-auto !right-0 !origin-top-right">
                    <div className="grid w-[400px] gap-3 p-4 md:w-[600px] md:grid-cols-2 lg:w-[750px] lg:grid-cols-3">
                      {productCategories.map((category) => (
                        <Link key={category.href} href={category.href}>
                          <NavigationMenuLink asChild>
                            <motion.div
                              className={`group block select-none space-y-1 rounded-lg p-4 leading-none no-underline outline-none transition-all duration-300 ${category.hoverBg} focus:bg-accent focus:text-accent-foreground border border-transparent hover:shadow-lg`}
                              whileHover={{ 
                                scale: 1.03, 
                                y: -4,
                                transition: { duration: 0.2 }
                              }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className={`transition-colors duration-200 ${category.iconColor}`}>
                                  {category.icon}
                                </div>
                                <div className={`text-sm font-medium leading-none transition-colors duration-200 ${category.titleHover}`}>
                                  {category.title}
                                </div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-200">
                                {category.description}
                              </p>
                            </motion.div>
                          </NavigationMenuLink>
                        </Link>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Admin Status Badge with Logout */}
            {isAdminAuthenticated && (
              <div className="hidden md:flex items-center gap-2">
                <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full border border-red-200 dark:border-red-800">
                  <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    {getAdminRoleDisplay()}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => adminLogout()}
                  className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-2 py-1 rounded-md border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium transition-colors"
                  title={direction === 'rtl' ? 'خروج مدیر' : 'Admin Logout'}
                >
                  <LogOut className="h-3 w-3" />
                  <span className="hidden lg:inline">
                    {direction === 'rtl' ? 'خروج' : 'Logout'}
                  </span>
                </Button>
              </div>
            )}
            
            {/* Language Switcher - Desktop */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Customer Authentication - Desktop */}
            {isAuthenticated && customer && (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/customer/profile">
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {customer.firstName} {customer.lastName}
                    </span>
                  </Button>
                </Link>
                <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
                <Link href="/customer/wallet">
                  <Button variant="ghost" className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800">
                    <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <div className="flex flex-col items-start">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t.wallet}</span>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {new Intl.NumberFormat('en-US').format(walletBalance)} IQD
                      </span>
                    </div>
                  </Button>
                </Link>
                <Button 
                  variant="ghost" 
                  onClick={logout} 
                  className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">{t.logout}</span>
                </Button>
              </div>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <motion.div
                animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </motion.div>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-700"
            >
              <nav className="py-4 space-y-1">
                {/* Admin Status Badge - Mobile */}
                {isAdminAuthenticated && (
                  <div className="mx-4 mb-4">
                    <div className="flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-full border border-red-200 dark:border-red-800 mb-2">
                      <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-700 dark:text-red-300">
                        {direction === 'rtl' ? `وضعیت ${getAdminRoleDisplay()} فعال` : `${getAdminRoleDisplay()} Mode Active`}
                      </span>
                    </div>
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        onClick={() => adminLogout()}
                        className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-2 rounded-md border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm font-medium transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>
                          {direction === 'rtl' ? 'خروج مدیر' : 'Admin Logout'}
                        </span>
                      </Button>
                    </div>
                  </div>
                )}
                
                {navigation.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={item.href}>
                      <motion.span
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                          isActive(item.href)
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                        )}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.icon && item.icon}
                        {item.label}
                      </motion.span>
                    </Link>
                  </motion.div>
                ))}

                {/* Mobile Products Menu */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navigation.length * 0.1 }}
                >
                  <div className="px-4 py-2">
                    <div className={cn(
                      "text-sm font-medium rounded-md transition-colors mb-2",
                      location.startsWith('/products')
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-600 dark:text-gray-300"
                    )}>
                      {t.products}
                    </div>
                    <div className="ml-4 space-y-1">
                      {productCategories.map((category, categoryIndex) => (
                        <motion.div
                          key={category.href}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (navigation.length + categoryIndex + 1) * 0.1 }}
                        >
                          <Link href={category.href}>
                            <motion.div
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all duration-200",
                                isActive(category.href)
                                  ? `${category.hoverBg.replace('hover:', '')} ${category.titleHover.replace('group-hover:', '')}`
                                  : `text-gray-600 ${category.hoverBg} dark:text-gray-300 dark:hover:text-white`
                              )}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <div className={cn(
                                "transition-colors duration-200",
                                isActive(category.href) ? category.iconColor : `text-gray-500 ${category.iconColor.replace('text-', 'hover:text-')}`
                              )}>
                                {category.icon}
                              </div>
                              <span className="transition-colors duration-200">{category.title}</span>
                            </motion.div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>



                {/* Customer Authentication - Mobile */}
                {isAuthenticated && customer && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (navigation.length + productCategories.length + 2) * 0.1 }}
                    className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4"
                  >
                    <div className="space-y-2">
                      <Link href="/customer/wallet">
                        <motion.div
                          className="flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-500 dark:text-gray-400">{t.wallet}</span>
                            <span className="text-sm font-medium text-green-600 dark:text-green-400">
                              {new Intl.NumberFormat('en-US').format(walletBalance)} IQD
                            </span>
                          </div>
                        </motion.div>
                      </Link>
                      <motion.div
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{t.logout}</span>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Language Switcher - Mobile */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navigation.length + productCategories.length + 3) * 0.1 }}
                  className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4"
                >
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Language
                  </div>
                  <LanguageSwitcher />
                </motion.div>

              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}