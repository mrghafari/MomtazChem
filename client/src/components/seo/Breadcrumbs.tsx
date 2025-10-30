import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const { t, direction } = useLanguage();
  
  // Add home as first item if not already present
  const breadcrumbItems = items[0]?.label === 'Home' ? items : [
    { label: 'Home', href: '/' },
    ...items
  ];

  // Generate structured data for breadcrumbs
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbItems.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": item.href ? `https://momtazchem.com${item.href}` : undefined
    }))
  };

  return (
    <>
      {/* Structured data for SEO */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
      
      {/* Visual breadcrumbs */}
      <nav 
        aria-label="Breadcrumb" 
        className={`flex items-center gap-2 text-sm text-gray-600 mb-4 ${className}`}
        dir={direction}
      >
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          const Icon = index === 0 ? Home : null;
          
          return (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRight 
                  className={`w-4 h-4 text-gray-400 ${direction === 'rtl' ? 'rotate-180' : ''}`} 
                />
              )}
              
              {item.href && !isLast ? (
                <Link href={item.href}>
                  <a className="flex items-center gap-1 hover:text-primary transition-colors">
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{item.label}</span>
                  </a>
                </Link>
              ) : (
                <span 
                  className={`flex items-center gap-1 ${isLast ? 'font-medium text-gray-900' : ''}`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{item.label}</span>
                </span>
              )}
            </div>
          );
        })}
      </nav>
    </>
  );
}
