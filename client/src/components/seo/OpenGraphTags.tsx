import { useEffect } from 'react';

interface OpenGraphTagsProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  siteName?: string;
  locale?: string;
  // For product type
  price?: string;
  currency?: string;
  availability?: 'instock' | 'outofstock' | 'preorder';
  // For article type
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

export default function OpenGraphTags({
  title,
  description,
  image = 'https://momtazchem.com/og-default.jpg',
  url,
  type = 'website',
  siteName = 'Momtazchem Chemical Solutions',
  locale = 'en_US',
  price,
  currency,
  availability,
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = []
}: OpenGraphTagsProps) {
  // Ensure absolute URL for og:url
  const getAbsoluteUrl = (path?: string): string => {
    if (!path) {
      return typeof window !== 'undefined' ? window.location.href : 'https://momtazchem.com';
    }
    // If already absolute, return as is
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // Convert relative to absolute
    const baseUrl = 'https://momtazchem.com';
    return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
  };

  const currentUrl = getAbsoluteUrl(url);
  
  useEffect(() => {
    // Set document title and meta description
    document.title = title;
    
    // Set or update meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('data-og-tag', 'true');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    const metaTags: Array<{ name?: string; property?: string; content: string }> = [
      // Primary Open Graph tags
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: currentUrl },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: siteName },
      { property: 'og:locale', content: locale },
      { property: 'og:locale:alternate', content: 'ar_IQ' },
      
      // Twitter Card tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
    ];

    // Product-specific tags
    if (type === 'product' && price) {
      metaTags.push(
        { property: 'og:price:amount', content: price },
        { property: 'og:price:currency', content: currency || 'IQD' }
      );
    }
    
    if (type === 'product' && availability) {
      metaTags.push({ property: 'og:availability', content: availability });
    }

    // Article-specific tags
    if (type === 'article') {
      if (publishedTime) {
        metaTags.push({ property: 'article:published_time', content: publishedTime });
      }
      if (modifiedTime) {
        metaTags.push({ property: 'article:modified_time', content: modifiedTime });
      }
      if (author) {
        metaTags.push({ property: 'article:author', content: author });
      }
      if (section) {
        metaTags.push({ property: 'article:section', content: section });
      }
      if (tags.length > 0) {
        tags.forEach(tag => {
          metaTags.push({ property: 'article:tag', content: tag });
        });
      }
    }

    // Add meta tags to head
    const addedTags: HTMLMetaElement[] = [];
    metaTags.forEach((tag) => {
      const meta = document.createElement('meta');
      if (tag.name) meta.setAttribute('name', tag.name);
      if (tag.property) meta.setAttribute('property', tag.property);
      meta.setAttribute('content', tag.content);
      meta.setAttribute('data-og-tag', 'true');
      document.head.appendChild(meta);
      addedTags.push(meta);
    });

    // Cleanup
    return () => {
      addedTags.forEach(tag => tag.remove());
    };
  }, [title, description, image, currentUrl, type, siteName, locale, price, currency, availability, publishedTime, modifiedTime, author, section, tags]);

  return null;
}
