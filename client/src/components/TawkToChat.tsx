import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

interface TawkSettings {
  is_enabled: boolean;
  script_code: string;
}

export default function TawkToChat() {
  const { data: tawkSettings } = useQuery<{ success: boolean; data: TawkSettings }>({
    queryKey: ['/api/tawk-support'],
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (tawkSettings?.success && tawkSettings.data.is_enabled && tawkSettings.data.script_code) {
      const scriptCode = tawkSettings.data.script_code;
      
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
        
        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
          
          script.onload = () => {
            console.log('Tawk.to Live Chat loaded successfully');
          };
          
          script.onerror = () => {
            console.error('Failed to load Tawk.to script');
          };
        }
      }
    }
  }, [tawkSettings]);

  return null;
}
