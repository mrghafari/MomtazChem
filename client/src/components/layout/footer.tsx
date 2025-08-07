import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import company_logo from "@assets/company-logo.png";

interface FooterSetting {
  id: number;
  language: string;
  companyName: string;
  companyDescription?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyCodal?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  telegramUrl?: string;
  whatsappUrl?: string;
  wechatUrl?: string;
  wechatQr?: string;
  productLinks?: string;
  companyLinks?: string;
  supportLinks?: string;
  legalLinks?: string;
  copyrightText?: string;
  additionalInfo?: string;
  showSocialMedia: boolean;
  showCompanyInfo: boolean;
  showLinks: boolean;
}

interface LinkItem {
  name: string;
  href: string;
}

const Footer = () => {
  const { t, language } = useLanguage();

  // Fetch footer settings from the new footer management system
  const { data: footerResponse } = useQuery({
    queryKey: ['/api/footer-settings', language],
    queryFn: () => 
      fetch(`/api/footer-settings?language=${language}`)
        .then(res => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes,
  });

  // Fetch social media links from content management system
  const { data: socialMediaResponse } = useQuery({
    queryKey: ['/api/public/content-settings', language, 'social_media'],
    queryFn: () => 
      fetch(`/api/public/content-settings?language=${language}&section=social_media`)
        .then(res => res.json()),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes,
  });

  const footerSettings: FooterSetting | undefined = footerResponse?.data;
  const socialMediaItems = socialMediaResponse?.data || [];

  // Parse JSON links
  const parseLinks = (linksJson?: string): LinkItem[] => {
    if (!linksJson) return [];
    try {
      return JSON.parse(linksJson);
    } catch {
      return [];
    }
  };

  // Get parsed links
  const productLinks = parseLinks(footerSettings?.productLinks);
  const companyLinks = parseLinks(footerSettings?.companyLinks);
  const supportLinks = parseLinks(footerSettings?.supportLinks);
  const legalLinks = parseLinks(footerSettings?.legalLinks);

  // Social media configuration
  const socialMediaPlatforms = [
    { key: 'facebook_url', icon: 'fab fa-facebook', name: 'Facebook' },
    { key: 'twitter_url', icon: 'fab fa-twitter', name: 'Twitter' },
    { key: 'linkedin_url', icon: 'fab fa-linkedin', name: 'LinkedIn' },
    { key: 'instagram_url', icon: 'fab fa-instagram', name: 'Instagram' },
    { key: 'youtube_url', icon: 'fab fa-youtube', name: 'YouTube' },
    { key: 'telegram_url', icon: 'fab fa-telegram', name: 'Telegram' },
    { key: 'whatsapp_url', icon: 'fab fa-whatsapp', name: 'WhatsApp' },
    { key: 'wechat_url', icon: 'fab fa-weixin', name: 'WeChat' },
    { key: 'tiktok_url', icon: 'fab fa-brands fa-tiktok', name: 'TikTok' }
  ];

  // Get social media URL from content items
  const getSocialMediaUrl = (key: string): string => {
    const socialItem = socialMediaItems.find((item: any) => item.key === key && item.isActive);
    return socialItem?.content || '';
  };

  // Filter active social media platforms
  const activeSocialMedia = socialMediaPlatforms.filter(platform => {
    const url = getSocialMediaUrl(platform.key);
    return url && url !== '' && url !== '#';
  });

  return (
    <footer className="bg-gray-900 text-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          
          {/* Company Info - More Compact */}
          {footerSettings?.showCompanyInfo && (
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-3">
                <img 
                  src={company_logo} 
                  alt={`${footerSettings?.companyName || 'Momtazchem'} Logo`} 
                  className="h-8 w-8 rounded-lg"
                />
                <div className="text-xl font-bold">
                  <span className="text-green-400">
                    {footerSettings?.companyName?.substring(0, 6) || 'Momtaz'}
                  </span>
                  <span className="text-white">
                    {footerSettings?.companyName?.substring(6) || 'chem'}
                  </span>
                </div>
              </div>
              
              {footerSettings?.companyDescription && (
                <p className="text-gray-400 mb-3 text-sm leading-relaxed line-clamp-2">
                  {footerSettings.companyDescription}
                </p>
              )}
              
              {/* Contact Info - Inline */}
              <div className="text-gray-400 text-xs mb-3 space-y-1">
                {footerSettings?.companyEmail && (
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-envelope text-xs"></i>
                    <a href={`mailto:${footerSettings.companyEmail}`} className="hover:text-white">
                      {footerSettings.companyEmail}
                    </a>
                  </div>
                )}
                {footerSettings?.companyPhone && (
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-phone text-xs"></i>
                    <a href={`tel:${footerSettings.companyPhone}`} className="hover:text-white">
                      {footerSettings.companyPhone}
                    </a>
                  </div>
                )}
              </div>

              {/* Social Media Icons - Compact */}
              {footerSettings?.showSocialMedia && activeSocialMedia.length > 0 && (
                <div className="flex space-x-2 flex-wrap">
                  {activeSocialMedia.slice(0, 6).map((platform) => {
                    const platformUrl = getSocialMediaUrl(platform.key);
                    
                    // Special handling for WeChat with QR Code
                    if (platform.key === 'wechat_url' && getSocialMediaUrl('wechat_qr')) {
                      return (
                        <div key={platform.key} className="relative group">
                          <a
                            href={platformUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 bg-gray-800 rounded-md flex items-center justify-center hover:bg-primary transition-colors duration-200"
                            title={platform.name}
                          >
                            <i className={`${platform.icon} text-sm`}></i>
                          </a>
                          {/* QR Code Popup on Hover */}
                          <div className="absolute bottom-10 left-0 hidden group-hover:block bg-white p-2 rounded-lg shadow-lg z-10">
                            <img 
                              src={getSocialMediaUrl('wechat_qr')} 
                              alt="WeChat QR Code" 
                              className="w-24 h-24"
                            />
                            <p className="text-xs text-gray-600 text-center mt-1">Scan for WeChat</p>
                          </div>
                        </div>
                      );
                    }
                    
                    // Regular social media icons
                    return (
                      <a
                        key={platform.key}
                        href={platformUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-8 h-8 bg-gray-800 rounded-md flex items-center justify-center hover:bg-primary transition-colors duration-200"
                        title={platform.name}
                      >
                        <i className={`${platform.icon} text-sm`}></i>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Products Links - Compact */}
          {footerSettings?.showLinks && productLinks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Products</h3>
              <ul className="space-y-2">
                {productLinks.slice(0, 4).map((link, index) => (
                  <li key={index}>
                    <Link href={link.href}>
                      <span className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer text-sm">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Company Links - Compact */}
          {footerSettings?.showLinks && companyLinks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Company</h3>
              <ul className="space-y-2">
                {companyLinks.slice(0, 4).map((link, index) => (
                  <li key={index}>
                    <Link href={link.href}>
                      <span className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer text-sm">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Support Links - Compact */}
          {footerSettings?.showLinks && supportLinks.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">Support</h3>
              <ul className="space-y-2">
                {supportLinks.slice(0, 4).map((link, index) => (
                  <li key={index}>
                    <Link href={link.href}>
                      <span className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer text-sm">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Compact Bottom Section */}
        <div className="border-t border-gray-800 mt-6 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-4">
            
            {/* Copyright */}
            <div className="text-gray-400 text-xs">
              {footerSettings?.copyrightText || '© 2025 Momtazchem. All rights reserved.'}
            </div>
            
            {/* Legal Links */}
            {footerSettings?.showLinks && legalLinks.length > 0 && (
              <div className="flex space-x-4 text-xs">
                {legalLinks.slice(0, 3).map((link, index) => (
                  <Link key={index} href={link.href}>
                    <span className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer">
                      {link.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
            
            {/* Additional Info / Designer Credit */}
            <div className="text-gray-400 text-sm text-center md:text-right">
              {footerSettings?.additionalInfo || (
                <>
                  Design by{" "}
                  <a 
                    href="https://wa.me/358411546489"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:text-green-300 transition-colors duration-200 font-medium"
                  >
                    Aras Mohsin
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;