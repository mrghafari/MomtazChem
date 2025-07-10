import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Package, Weight, Layers, Tag } from "lucide-react";

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
  const specifications = product.specifications && typeof product.specifications === 'string' 
    ? JSON.parse(product.specifications) 
    : product.specifications || {};
    
  const features = product.features && typeof product.features === 'string'
    ? JSON.parse(product.features)
    : product.features || [];
    
  const applications = product.applications && typeof product.applications === 'string'
    ? JSON.parse(product.applications)
    : product.applications || [];
    
  const tags = product.tags && typeof product.tags === 'string'
    ? JSON.parse(product.tags)
    : product.tags || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Package className="w-5 h-5 text-blue-600" />
            مشخصات فنی {product.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">اطلاعات پایه</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">دسته‌بندی:</span>
                <span className="font-medium mr-2">{product.category}</span>
              </div>
              {product.weight && (
                <div>
                  <span className="text-gray-600">وزن:</span>
                  <span className="font-medium mr-2">
                    {product.weight} {product.weightUnit || 'کیلوگرم'}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-600">واحد فروش:</span>
                <span className="font-medium mr-2">{product.priceUnit || 'واحد'}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                توضیحات محصول
              </h3>
              <p className="text-gray-700 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Technical Specifications */}
          {Object.keys(specifications).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Weight className="w-4 h-4" />
                مشخصات فنی
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
              <h3 className="font-semibold text-gray-800 mb-3">ویژگی‌های محصول</h3>
              <div className="grid gap-2">
                {features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applications */}
          {applications.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">کاربردهای محصول</h3>
              <div className="grid gap-2">
                {applications.map((application: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-700">{application}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                برچسب‌ها
              </h3>
              <div className="flex flex-wrap gap-2">
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