import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, Beaker, Droplet, Package, Wheat, Wallet, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useCustomer } from '@/hooks/useCustomer';
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

// Import company logo
import companyLogoPath from '@assets/company-logo.png';

export default function Header() {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t, direction } = useLanguage();
  const { customer, isAuthenticated, logout } = useCustomer();

  const navigation = [
    { href: '/', label: t.home },
    { href: '/about', label: t.about },
    { href: '/services', label: t.services },
    { href: '/contact', label: t.contact },
    { href: '/shop', label: t.shop },
  ];

  const productCategories = [
    {
      title: t.fuelAdditives,
      href: "/products/fuel-additives",
      description: "High-performance fuel additives for enhanced engine efficiency",
      icon: <Beaker className="h-6 w-6" />,
      color: "blue",
      hoverBg: "hover:bg-blue-50 dark:hover:bg-blue-900/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      titleHover: "group-hover:text-blue-600 dark:group-hover:text-blue-400"
    },
    {
      title: t.waterTreatment,
      href: "/products/water-treatment", 
      description: "Comprehensive water treatment solutions for all applications",
      icon: <Droplet className="h-6 w-6" />,
      color: "cyan",
      hoverBg: "hover:bg-cyan-50 dark:hover:bg-cyan-900/20",
      iconColor: "text-cyan-600 dark:text-cyan-400",
      titleHover: "group-hover:text-cyan-600 dark:group-hover:text-cyan-400"
    },
    {
      title: t.paintThinner,
      href: "/products/paint-thinner",
      description: "Premium paint formulations and specialty thinners",
      icon: <Package className="h-6 w-6" />,
      color: "orange",
      hoverBg: "hover:bg-orange-50 dark:hover:bg-orange-900/20",
      iconColor: "text-orange-600 dark:text-orange-400",
      titleHover: "group-hover:text-orange-600 dark:group-hover:text-orange-400"
    },
    {
      title: t.agriculturalFertilizers, 
      href: "/products/agricultural-fertilizers",
      description: "Advanced fertilizer solutions for sustainable farming",
      icon: <Wheat className="h-6 w-6" />,
      color: "green",
      hoverBg: "hover:bg-green-50 dark:hover:bg-green-900/20",
      iconColor: "text-green-600 dark:text-green-400",
      titleHover: "group-hover:text-green-600 dark:group-hover:text-green-400"
    },
    {
      title: "Other Products",
      href: "/products/other",
      description: "Miscellaneous chemical products and specialty solutions",
      icon: <Package className="h-6 w-6" />,
      color: "purple",
      hoverBg: "hover:bg-purple-50 dark:hover:bg-purple-900/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      titleHover: "group-hover:text-purple-600 dark:group-hover:text-purple-400"
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/95 dark:supports-[backdrop-filter]:bg-gray-900/60">
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
                src={companyLogoPath} 
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
                    "relative px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  )}
                  whileHover={{ y: -1 }}
                  whileTap={{ y: 0 }}
                >
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
            {/* Language Switcher - Desktop */}
            <div className="hidden md:block">
              <LanguageSwitcher />
            </div>

            {/* Customer Menu - Desktop */}
            {isAuthenticated && customer && (
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {customer.firstName} {customer.lastName}
                      </span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/customer/profile" className="flex items-center gap-2 w-full">
                        <User className="h-4 w-4" />
                        <span>پروفایل من</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/customer/wallet" className="flex items-center gap-2 w-full">
                        <Wallet className="h-4 w-4" />
                        <span>کیف پول</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => logout()}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>خروج</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                          "block px-4 py-2 text-sm font-medium rounded-md transition-colors",
                          isActive(item.href)
                            ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                        )}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
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

                {/* Customer Menu - Mobile */}
                {isAuthenticated && customer && (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (navigation.length + productCategories.length + 1) * 0.1 }}
                    className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4"
                  >
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                      {customer.firstName} {customer.lastName}
                    </div>
                    <div className="space-y-1 ml-2">
                      <Link href="/customer/profile">
                        <motion.div
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <User className="h-4 w-4" />
                          <span>پروفایل من</span>
                        </motion.div>
                      </Link>
                      <Link href="/customer/wallet">
                        <motion.div
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <Wallet className="h-4 w-4" />
                          <span>کیف پول</span>
                        </motion.div>
                      </Link>
                      <motion.div
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-900/20 dark:hover:text-red-300 transition-colors cursor-pointer"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          logout();
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>خروج</span>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Language Switcher - Mobile */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (navigation.length + productCategories.length + 2) * 0.1 }}
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