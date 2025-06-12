import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown, Menu, Phone } from "lucide-react";

const Header = () => {
  const [location] = useLocation();
  const [isProductsOpen, setIsProductsOpen] = useState(false);

  const navigation = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
  ];

  const productCategories = [
    { name: "Fuel Additives", href: "/products/fuel-additives" },
    { name: "Water Treatment", href: "/products/water-treatment" },
    { name: "Paint & Thinner", href: "/products/paint-thinner" },
    { name: "Agricultural Fertilizers", href: "/products/agricultural-fertilizers" },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 header-transition">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/">
            <div className="text-2xl font-bold cursor-pointer">
              <span className="primary-green">Momtaz</span>
              <span className="primary-blue">chem</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <span className={`text-gray-700 hover:text-primary transition-colors duration-200 font-medium cursor-pointer ${
                  location === item.href ? 'text-primary' : ''
                }`}>
                  {item.name}
                </span>
              </Link>
            ))}
            
            {/* Products Dropdown */}
            <div className="relative group">
              <button
                className="text-gray-700 hover:text-primary transition-colors duration-200 font-medium flex items-center"
                onMouseEnter={() => setIsProductsOpen(true)}
                onMouseLeave={() => setIsProductsOpen(false)}
              >
                Products <ChevronDown className="ml-1 h-3 w-3" />
              </button>
              <div
                className={`absolute top-full left-0 mt-2 w-64 bg-white shadow-lg rounded-lg transition-all duration-200 ${
                  isProductsOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
                }`}
                onMouseEnter={() => setIsProductsOpen(true)}
                onMouseLeave={() => setIsProductsOpen(false)}
              >
                <div className="py-2">
                  {productCategories.map((product) => (
                    <Link key={product.name} href={product.href}>
                      <span className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-primary cursor-pointer">
                        {product.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* Desktop Contact Info & CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="text-sm text-gray-600 flex items-center">
              <Phone className="h-4 w-4 text-primary mr-2" />
              <span>+967 709 996 771</span>
            </div>
            <Link href="/shop">
              <Button variant="outline" className="border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white">
                Shop
              </Button>
            </Link>
            <Link href="/contact">
              <Button className="bg-primary-blue hover:bg-primary-blue-dark text-white">
                Get Quote
              </Button>
            </Link>
          </div>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col space-y-4 mt-6">
                {navigation.map((item) => (
                  <Link key={item.name} href={item.href}>
                    <span className="text-gray-700 hover:text-primary text-lg cursor-pointer">
                      {item.name}
                    </span>
                  </Link>
                ))}
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Products</h3>
                  {productCategories.map((product) => (
                    <Link key={product.name} href={product.href}>
                      <span className="block text-gray-700 hover:text-primary py-1 cursor-pointer">
                        {product.name}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <Link href="/shop">
                    <span className="block text-gray-700 hover:text-primary text-lg cursor-pointer">
                      Shop
                    </span>
                  </Link>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
