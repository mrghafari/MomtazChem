import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher, LanguageSwitcherCompact } from '@/components/ui/language-switcher';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, Beaker, Droplet, Package, Wheat } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  const { t, isRTL } = useLanguage();

  const navigation = [
    { href: '/', label: t('nav.home') },
    { href: '/about', label: t('nav.about') },
    { href: '/services', label: t('nav.services') },
    { href: '/contact', label: t('nav.contact') },
    { href: '/shop', label: t('nav.shop') },
  ];

  const productCategories = [
    {
      title: "Fuel Additives",
      href: "/products/fuel-additives",
      description: "High-performance fuel additives for enhanced engine efficiency",
      icon: <Beaker className="h-6 w-6" />
    },
    {
      title: "Water Treatment",
      href: "/products/water-treatment", 
      description: "Comprehensive water treatment solutions for all applications",
      icon: <Droplet className="h-6 w-6" />
    },
    {
      title: "Paint & Thinner",
      href: "/products/paint-thinner",
      description: "Premium paint formulations and specialty thinners",
      icon: <Package className="h-6 w-6" />
    },
    {
      title: "Agricultural Fertilizers", 
      href: "/products/agricultural-fertilizers",
      description: "Advanced fertilizer solutions for sustainable farming",
      icon: <Wheat className="h-6 w-6" />
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
              className="flex items-center space-x-2 rtl:space-x-reverse"
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
          <nav className="hidden md:flex items-center space-x-6 rtl:space-x-reverse">
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
                    {t('nav.products')}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {productCategories.map((category) => (
                        <Link key={category.href} href={category.href}>
                          <NavigationMenuLink asChild>
                            <motion.div
                              className="group block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <div className="text-blue-600 dark:text-blue-400">
                                  {category.icon}
                                </div>
                                <div className="text-sm font-medium leading-none group-hover:text-blue-600">
                                  {category.title}
                                </div>
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
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
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {/* Language Switcher - Desktop */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* Language Switcher - Mobile */}
            <div className="sm:hidden">
              <LanguageSwitcherCompact />
            </div>

            {/* Admin Link */}
            <Link href="/admin">
              <Button 
                variant="outline" 
                size="sm"
                className="hidden sm:inline-flex"
              >
                {t('nav.admin')}
              </Button>
            </Link>

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
                    initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
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
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
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
                      {t('nav.products')}
                    </div>
                    <div className="ml-4 space-y-1">
                      {productCategories.map((category, categoryIndex) => (
                        <motion.div
                          key={category.href}
                          initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (navigation.length + categoryIndex + 1) * 0.1 }}
                        >
                          <Link href={category.href}>
                            <motion.div
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors",
                                isActive(category.href)
                                  ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                              )}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <div className="text-blue-600 dark:text-blue-400">
                                {category.icon}
                              </div>
                              <span>{category.title}</span>
                            </motion.div>
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
                
                {/* Mobile Admin Link */}
                <motion.div
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: navigation.length * 0.1 }}
                  className="pt-2 border-t border-gray-200 dark:border-gray-700"
                >
                  <Link href="/admin">
                    <motion.span
                      className="block px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {t('nav.admin')}
                    </motion.span>
                  </Link>
                </motion.div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}