import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import company_logo from "@assets/company-logo.png";

const Footer = () => {
  const { t, language } = useLanguage();

  // Fetch social media links from content management (public endpoint)
  const { data: socialMediaLinks } = useQuery({
    queryKey: ['/api/content', language, 'social_media'],
    queryFn: () => 
      fetch(`/api/content?language=${language}&section=social_media`)
        .then(res => res.json())
        .then(data => data.success ? data.data : []),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  // Helper function to get social media URL
  const getSocialMediaUrl = (platform: string): string => {
    const link = socialMediaLinks?.find((item: any) => item.key === `${platform}_url`);
    return link?.content || '#';
  };
  
  const productLinks = [
    { name: t.fuelAdditives, href: "/products/fuel-additives" },
    { name: t.waterTreatment, href: "/products/water-treatment" },
    { name: t.paintThinner, href: "/products/paint-thinner" },
    { name: t.agriculturalFertilizers, href: "/products/agricultural-fertilizers" },
  ];

  const companyLinks = [
    { name: t.about, href: "/about" },
    { name: t.services, href: "/services" },
    { name: t.shop.title, href: "/shop" },
    { name: "Careers", href: "#careers" },
  ];

  const supportLinks = [
    { name: t.contact, href: "/contact" },
    { name: "Technical Support", href: "#technical-support" },
    { name: "Documentation", href: "#documentation" },
    { name: "Safety Data Sheets", href: "#safety-data" },
  ];

  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src={company_logo} 
                alt="Momtazchem Logo" 
                className="h-10 w-10 rounded-lg"
              />
              <div className="text-2xl font-bold">
                <span className="text-green-400">Momtaz</span>
                <span className="text-white">chem</span>
              </div>
            </div>
            <p className="text-gray-400 mb-4 leading-relaxed">
              Leading provider of advanced chemical solutions for fuel, water treatment, paint, and agricultural industries worldwide.
            </p>
            <div className="text-gray-400 text-sm mb-6">
              <p className="mb-1">Codal pose: 44001</p>
              <p className="mb-1">Gwer Road, Qaryataq Village</p>
              <p>Erbil, Iraq</p>
            </div>
            <div className="flex space-x-4">
              <a
                href={getSocialMediaUrl('linkedin')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-200"
              >
                <i className="fab fa-linkedin"></i>
              </a>
              <a
                href={getSocialMediaUrl('twitter')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-200"
              >
                <i className="fab fa-twitter"></i>
              </a>
              <a
                href={getSocialMediaUrl('facebook')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-200"
              >
                <i className="fab fa-facebook"></i>
              </a>
              <a
                href={getSocialMediaUrl('instagram')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-200"
              >
                <i className="fab fa-instagram"></i>
              </a>
              <a
                href={getSocialMediaUrl('tiktok')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-200"
              >
                <i className="fab fa-tiktok"></i>
              </a>
              <a
                href={getSocialMediaUrl('whatsapp')}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-200"
              >
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Products</h3>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href}>
                    <span className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href}>
                    <span className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href}>
                    <span className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer">
                      {link.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <div className="space-y-3 text-gray-400 text-sm">
              <div className="flex items-center space-x-2">
                <i className="fas fa-envelope w-4"></i>
                <a 
                  href="mailto:admin@momtazchem.com"
                  className="hover:text-white transition-colors duration-200"
                >
                  admin@momtazchem.com
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-phone w-4"></i>
                <a 
                  href="tel:+9647709996771"
                  className="hover:text-white transition-colors duration-200"
                >
                  +9647709996771
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fab fa-whatsapp w-4"></i>
                <a 
                  href="https://wa.me/9647709996771"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-200"
                >
                  WhatsApp
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-map-marker-alt w-4"></i>
                <span>Erbil, Iraq</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center md:text-left">
            <div className="text-gray-400 text-sm">
              © 2025 Momtazchem. All rights reserved.
            </div>
            
            <div className="text-gray-400 text-sm text-center">
              Design by{" "}
              <a 
                href="https://wa.me/358411546489"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition-colors duration-200 font-medium"
              >
                MRG
              </a>
            </div>
            
            <div className="flex justify-center md:justify-end space-x-6 text-sm">
              <a href="#privacy" className="text-gray-400 hover:text-white transition-colors duration-200">
                Privacy Policy
              </a>
              <a href="#terms" className="text-gray-400 hover:text-white transition-colors duration-200">
                Terms of Service
              </a>
              <a href="#cookies" className="text-gray-400 hover:text-white transition-colors duration-200">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
