import { useEffect } from 'react';

interface CanonicalUrlProps {
  path?: string;
}

export default function CanonicalUrl({ path }: CanonicalUrlProps) {
  useEffect(() => {
    const getCanonicalUrl = () => {
      if (typeof window === 'undefined') {
        return 'https://momtazchem.com';
      }
      
      // Use provided path or current path
      const currentPath = path || window.location.pathname;
      
      // Remove trailing slash for consistency (except for root)
      const cleanPath = currentPath === '/' ? currentPath : currentPath.replace(/\/$/, '');
      
      // Build canonical URL
      return `https://momtazchem.com${cleanPath}`;
    };

    // Remove existing canonical link if any
    const existingCanonical = document.querySelector('link[rel="canonical"]');
    if (existingCanonical) {
      existingCanonical.remove();
    }

    // Add new canonical link
    const canonical = document.createElement('link');
    canonical.rel = 'canonical';
    canonical.href = getCanonicalUrl();
    document.head.appendChild(canonical);

    // Cleanup
    return () => {
      canonical.remove();
    };
  }, [path]);

  return null;
}
