import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ProductModel3DViewerProps {
  model3dKey: string;
  productName: string;
  className?: string;
}

// Declare model-viewer as a custom element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        ar?: boolean;
        'auto-rotate'?: boolean;
        'camera-controls'?: boolean;
        'shadow-intensity'?: string;
        'loading'?: string;
        'interaction-prompt'?: string;
        'reveal'?: string;
        style?: React.CSSProperties;
      }, HTMLElement>;
    }
  }
}

export default function ProductModel3DViewer({ model3dKey, productName, className = "" }: ProductModel3DViewerProps) {
  const { t, direction } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Load model-viewer script if not already loaded
    if (!document.querySelector('script[src*="model-viewer"]')) {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js';
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => setError(true);
      document.head.appendChild(script);
    } else {
      setScriptLoaded(true);
    }
  }, []);

  const handleLoad = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (!model3dKey) {
    return null;
  }

  const modelUrl = `/uploads/3d-models/${model3dKey}`;

  return (
    <div className={`relative ${className}`} dir={direction}>
      {/* Loading State */}
      {loading && scriptLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t.productManagement.loading3dModel}
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
          <p className="text-red-600 dark:text-red-400 text-center">
            {t.productManagement.error3dModel}
          </p>
        </div>
      )}

      {/* 3D Model Viewer */}
      {scriptLoaded && !error && (
        <div className="relative w-full h-full">
          <model-viewer
            src={modelUrl}
            alt={productName}
            auto-rotate
            camera-controls
            shadow-intensity="1"
            loading="eager"
            interaction-prompt="auto"
            reveal="auto"
            style={{
              width: '100%',
              height: '100%',
              minHeight: '400px',
              backgroundColor: '#f3f4f6',
              borderRadius: '0.5rem'
            }}
            onLoad={handleLoad}
            onError={handleError}
          />
          
          {/* Controls Hint */}
          <div className={`absolute bottom-4 ${direction === 'rtl' ? 'left-4' : 'right-4'} bg-black/70 text-white text-xs px-3 py-2 rounded-lg backdrop-blur-sm`}>
            <div className="space-y-1">
              <div>{t.productManagement.rotate3dModel}</div>
              <div>{t.productManagement.zoom3dModel}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
