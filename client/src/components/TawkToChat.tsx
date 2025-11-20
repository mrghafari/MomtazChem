import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface TawkSettings {
  isEnabled: boolean;
  scriptCode: string;
}

export default function TawkToChat() {
  const { data: tawkSettings } = useQuery<{ success: boolean; data: TawkSettings }>({
    queryKey: ['/api/tawk-support'],
    refetchInterval: 60000,
  });

  useEffect(() => {
    const isEnabled = tawkSettings?.success && tawkSettings.data.isEnabled;
    const scriptCode = tawkSettings?.data?.scriptCode;
    
    if (isEnabled && scriptCode) {
      const scriptMatch = scriptCode.match(/src=['"]([^'"]+)['"]/);
      if (scriptMatch && scriptMatch[1]) {
        const scriptSrc = scriptMatch[1];
        
        const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
        if (existingScript) {
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
            console.log('✅ Tawk.to Live Chat loaded successfully');
          };
          
          script.onerror = () => {
            console.error('❌ Failed to load Tawk.to script');
          };
        }
      }
    } else if (!isEnabled) {
      // Remove Tawk.to script and widget when disabled
      const tawkScripts = document.querySelectorAll('script[data-tawk-script="true"], script[src*="tawk.to"]');
      tawkScripts.forEach(script => script.remove());
      
      // Remove Tawk.to widget iframe
      const tawkWidget = document.getElementById('tawkchat-container');
      if (tawkWidget) {
        tawkWidget.remove();
      }
      
      // Clear Tawk API objects
      if (typeof window !== 'undefined') {
        (window as any).Tawk_API = undefined;
        (window as any).Tawk_LoadStart = undefined;
      }
      
      console.log('🚫 Tawk.to Live Chat disabled and removed');
    }
  }, [tawkSettings]);

  return null;
}
