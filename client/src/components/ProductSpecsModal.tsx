import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Package, Weight, Layers, Tag } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProductSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: number;
    name: string;
    category: string;
    description?: string;
    specifications?: any;
    features?: any;
    applications?: any;
    weight?: number;
    weightUnit?: string;
    priceUnit?: string;
    tags?: any;
  };
}

export function ProductSpecsModal({ isOpen, onClose, product }: ProductSpecsModalProps) {
  const { t, direction } = useLanguage();
  const specifications = (() => {
    try {
      if (product.specifications && typeof product.specifications === 'string') {
        // Try to parse as JSON first
        return JSON.parse(product.specifications);
      }
      return product.specifications || {};
    } catch (error) {
      // If JSON parsing fails, treat as plain text
      return { description: product.specifications };
    }
  })();
    
  const features = (() => {
    try {
      if (product.features && typeof product.features === 'string') {
        return JSON.parse(product.features);
      }
      return product.features || [];
    } catch (error) {
      // If JSON parsing fails, treat as array with single text item
      return [product.features];
    }
  })();
    
  const applications = (() => {
    try {
      if (product.applications && typeof product.applications === 'string') {
        return JSON.parse(product.applications);
      }
      return product.applications || [];
    } catch (error) {
      // If JSON parsing fails, treat as array with single text item
      return [product.applications];
    }
  })();
    
  const tags = (() => {
    try {
      if (product.tags && typeof product.tags === 'string') {
        return JSON.parse(product.tags);
      }
      return product.tags || [];
    } catch (error) {
      // If JSON parsing fails, treat as array with single text item
      return [product.tags];
    }
  })();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[80vh] overflow-y-auto ${direction === 'rtl' ? 'text-right' : 'text-left'}`} dir={direction}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 text-lg font-semibold ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
            <Package className="w-5 h-5 text-blue-600" />
            {t.shop.technicalSpecs} {product.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{t.basicInfo}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">{t.category}:</span>
                <span className={`font-medium ${direction === 'rtl' ? 'mr-2' : 'ml-2'}`}>{product.category}</span>
              </div>
              {product.weight && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">{t.netWeight}:</span>
                  <span className={`font-medium ${direction === 'rtl' ? 'mr-2' : 'ml-2'}`}>
                    {product.weight} {product.weightUnit || 'kg'}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-600 dark:text-gray-400">{t.shop.unit}:</span>
                <span className={`font-medium ${direction === 'rtl' ? 'mr-2' : 'ml-2'}`}>{product.priceUnit || t.shop.unit}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className={`font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <Layers className="w-4 h-4" />
                {t.productDescription}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Technical Specifications */}
          {Object.keys(specifications).length > 0 && (
            <div>
              <h3 className={`font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <Weight className="w-4 h-4" />
                {t.shop.technicalSpecs}
              </h3>
              <div className="bg-white border rounded-lg">
                {Object.entries(specifications).map(([key, value], index) => (
                  <div 
                    key={key} 
                    className={`flex justify-between py-3 px-4 ${
                      index !== Object.keys(specifications).length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <span className="text-gray-600 font-medium">{key}:</span>
                    <span className="text-gray-800">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">{t.productFeatures}</h3>
              <div className="grid gap-2">
                {features.map((feature: string, index: number) => (
                  <div key={index} className={`flex items-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applications */}
          {applications.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">{t.productApplications}</h3>
              <div className="grid gap-2">
                {applications.map((application: string, index: number) => (
                  <div key={index} className={`flex items-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700 dark:text-gray-300">{application}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h3 className={`font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2 ${direction === 'rtl' ? 'flex-row-reverse' : ''}`}>
                <Tag className="w-4 h-4" />
                {t.productTags}
              </h3>
              <div className={`flex flex-wrap gap-2 ${direction === 'rtl' ? 'justify-end' : 'justify-start'}`}>
                {tags.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}