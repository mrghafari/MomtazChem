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
    { key: 'linkedin_url', icon: 'fab fa-linkedin', name: 'LinkedIn' },
    { key: 'twitter_url', icon: 'fab fa-twitter', name: 'Twitter' },
    { key: 'facebook_url', icon: 'fab fa-facebook', name: 'Facebook' },
    { key: 'instagram_url', icon: 'fab fa-instagram', name: 'Instagram' },
    { key: 'youtube_url', icon: 'fab fa-youtube', name: 'YouTube' },
    { key: 'telegram_url', icon: 'fab fa-telegram', name: 'Telegram' },
    { key: 'whatsapp_url', icon: 'fab fa-whatsapp', name: 'WhatsApp' },
    { key: 'wechat_url', icon: 'fab fa-weixin', name: 'WeChat' },
    { key: 'tiktok_url', icon: 'fab fa-tiktok', name: 'TikTok' }
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
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Company Info */}
          {footerSettings?.showCompanyInfo && (
            <div className="lg:col-span-1">
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src={company_logo} 
                  alt={`${footerSettings?.companyName || 'Momtazchem'} Logo`} 
                  className="h-10 w-10 rounded-lg"
                />
                <div className="text-2xl font-bold">
                  <span className="text-green-400">
                    {footerSettings?.companyName?.substring(0, 6) || 'Momtaz'}
                  </span>
                  <span className="text-white">
                    {footerSettings?.companyName?.substring(6) || 'chem'}
                  </span>
                </div>
              </div>
              
              {footerSettings?.companyDescription && (
                <p className="text-gray-400 mb-4 leading-relaxed">
                  {footerSettings.companyDescription}
                </p>
              )}
              
              <div className="text-gray-400 text-sm mb-6">
                {footerSettings?.companyCodal && (
                  <p className="mb-1">Codal pose: {footerSettings.companyCodal}</p>
                )}
                {footerSettings?.companyAddress && (
                  <p className="mb-1">{footerSettings.companyAddress}</p>
                )}
              </div>

              {/* Social Media Icons */}
              {footerSettings?.showSocialMedia && activeSocialMedia.length > 0 && (
                <div className="flex space-x-4 flex-wrap">
                  {activeSocialMedia.map((platform) => (
                    <a
                      key={platform.key}
                      href={getSocialMediaUrl(platform.key)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-200"
                      title={platform.name}
                    >
                      <i className={platform.icon}></i>
                    </a>
                  ))}
                  
                  {/* Special WeChat QR handling */}
                  {footerSettings?.wechatQr && footerSettings?.wechatUrl && (
                    <div className="relative group">
                      <a
                        href={footerSettings.wechatUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary transition-colors duration-200"
                        title="WeChat"
                      >
                        <i className="fab fa-weixin"></i>
                      </a>
                      {/* QR Code Popup on Hover */}
                      <div className="absolute bottom-12 left-0 hidden group-hover:block bg-white p-2 rounded-lg shadow-lg z-10">
                        <img 
                          src={footerSettings.wechatQr} 
                          alt="WeChat QR Code" 
                          className="w-32 h-32"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Products Links */}
          {footerSettings?.showLinks && productLinks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <ul className="space-y-3">
                {productLinks.map((link, index) => (
                  <li key={index}>
                    <Link href={link.href}>
                      <span className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Company Links */}
          {footerSettings?.showLinks && companyLinks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {companyLinks.map((link, index) => (
                  <li key={index}>
                    <Link href={link.href}>
                      <span className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Support Links */}
          {footerSettings?.showLinks && supportLinks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                {supportLinks.map((link, index) => (
                  <li key={index}>
                    <Link href={link.href}>
                      <span className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Info */}
          {footerSettings?.showCompanyInfo && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <div className="space-y-3 text-gray-400 text-sm">
                {footerSettings?.companyEmail && (
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-envelope w-4"></i>
                    <a 
                      href={`mailto:${footerSettings.companyEmail}`}
                      className="hover:text-white transition-colors duration-200"
                    >
                      {footerSettings.companyEmail}
                    </a>
                  </div>
                )}
                
                {footerSettings?.companyPhone && (
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-phone w-4"></i>
                    <a 
                      href={`tel:${footerSettings.companyPhone}`}
                      className="hover:text-white transition-colors duration-200"
                    >
                      {footerSettings.companyPhone}
                    </a>
                  </div>
                )}
                
                {footerSettings?.whatsappUrl && (
                  <div className="flex items-center space-x-2">
                    <i className="fab fa-whatsapp w-4"></i>
                    <a 
                      href={footerSettings.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors duration-200"
                    >
                      WhatsApp
                    </a>
                  </div>
                )}
                
                {footerSettings?.companyAddress && (
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-map-marker-alt w-4"></i>
                    <span>{footerSettings.companyAddress}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Copyright and Legal Section */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center text-center md:text-left">
            
            {/* Copyright */}
            <div className="text-gray-400 text-sm">
              {footerSettings?.copyrightText || '© 2025 Momtazchem. All rights reserved.'}
            </div>
            
            {/* Legal Links */}
            {footerSettings?.showLinks && legalLinks.length > 0 && (
              <div className="text-center">
                <div className="flex justify-center space-x-4 text-sm">
                  {legalLinks.map((link, index) => (
                    <Link key={index} href={link.href}>
                      <span className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer">
                        {link.name}
                      </span>
                    </Link>
                  ))}
                </div>
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