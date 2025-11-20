import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

interface TawkSettings {
  isEnabled: boolean;
  scriptCode: string;
}

declare global {
  interface Window {
    Tawk_API?: any;
    Tawk_LoadStart?: any;
  }
}

export default function TawkToChat() {
  const scriptLoadedRef = useRef(false);
  
  const { data: tawkSettings } = useQuery<{ success: boolean; data: TawkSettings }>({
    queryKey: ['/api/tawk-support'],
    refetchInterval: 30000, // Check every 30 seconds
  });

  useEffect(() => {
    const isEnabled = tawkSettings?.success && tawkSettings.data?.isEnabled;
    const scriptCode = tawkSettings?.data?.scriptCode;

    const removeTawkWidget = () => {
      // Remove all Tawk.to scripts
      const tawkScripts = document.querySelectorAll('script[src*="tawk.to"], script[data-tawk-script="true"]');
      tawkScripts.forEach(script => {
        script.remove();
        console.log('🗑️ Removed Tawk.to script:', script.getAttribute('src'));
      });
      
      // Remove all Tawk.to widget containers and iframes
      const tawkContainers = document.querySelectorAll(
        '[id^="tawk"], [class*="tawk"], div[style*="tawk"]'
      );
      tawkContainers.forEach(container => {
        container.remove();
        console.log('🗑️ Removed Tawk.to container');
      });
      
      // Clear Tawk API objects
      if (window.Tawk_API) {
        try {
          if (typeof window.Tawk_API.hideWidget === 'function') {
            window.Tawk_API.hideWidget();
          }
        } catch (e) {
          console.log('Could not hide widget:', e);
        }
        delete window.Tawk_API;
        delete window.Tawk_LoadStart;
      }
      
      scriptLoadedRef.current = false;
      console.log('🚫 Tawk.to Live Chat disabled and removed');
    };
    
    if (isEnabled && scriptCode) {
      // Only load if not already loaded
      if (scriptLoadedRef.current) {
        console.log('ℹ️ Tawk.to already loaded, skipping');
        return;
      }

      const scriptMatch = scriptCode.match(/src=['"]([^'"]+)['"]/);
      if (scriptMatch && scriptMatch[1]) {
        const scriptSrc = scriptMatch[1];
        
        // Check if script already exists
        const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
        if (existingScript) {
          scriptLoadedRef.current = true;
          console.log('ℹ️ Tawk.to script already in DOM');
          return;
        }
        
        const script = document.createElement('script');
        script.src = scriptSrc;
        script.async = true;
        script.charset = 'UTF-8';
        script.setAttribute('crossorigin', '*');
        script.setAttribute('data-tawk-script', 'true');
        
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
          
          script.onload = () => {
            scriptLoadedRef.current = true;
            console.log('✅ Tawk.to Live Chat loaded successfully');
          };
          
          script.onerror = () => {
            scriptLoadedRef.current = false;
            console.error('❌ Failed to load Tawk.to script');
          };
        }
      }
    } else if (tawkSettings?.success && !isEnabled) {
      // Settings exist but chat is disabled - remove everything
      removeTawkWidget();
    }

    // Cleanup function when component unmounts or settings change
    return () => {
      if (!isEnabled && scriptLoadedRef.current) {
        removeTawkWidget();
      }
    };
  }, [tawkSettings]);

  return null;
}
