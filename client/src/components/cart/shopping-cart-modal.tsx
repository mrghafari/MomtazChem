import { useState, useEffect } from "react";
import { Plus, Minus, Trash2, ShoppingCart, X, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface ShippingRate {
  id: number;
  deliveryMethod: string;
  transportationType?: string;
  description?: string;
  estimatedDays?: number;
  trackingAvailable: boolean;
  insuranceAvailable: boolean;
  shippingCost: number;
  basePrice: string;
  pricePerKg?: string;
  freeShippingThreshold?: string;
}

interface ShoppingCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: {[key: number]: number};
  products: any[];
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  getTotalPrice: () => number;
  getTotalSavings: () => number;
}

export default function ShoppingCartModal({
  isOpen,
  onClose,
  cart,
  products,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  getTotalPrice,
  getTotalSavings
}: ShoppingCartModalProps) {
  const [selectedShippingMethod, setSelectedShippingMethod] = useState<string>("");
  const [shippingCost, setShippingCost] = useState<number>(0);

  const cartItems = Object.entries(cart).map(([productId, quantity]) => {
    const product = products.find(p => p.id === parseInt(productId));
    return { product, quantity };
  }).filter(item => item.product && item.quantity > 0);

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalWeight = cartItems.reduce((sum, item) => {
    const weight = parseFloat(item.product.weight || '1');
    return sum + (weight * item.quantity);
  }, 0);

  // Fetch shipping rates from API
  const { data: shippingRatesData, isLoading: shippingRatesLoading } = useQuery({
    queryKey: ["/api/logistics/shipping-rates"],
    enabled: isOpen, // Only fetch when modal is open
  });

  const shippingRates = shippingRatesData?.data || [];

  // Calculate shipping cost when method changes
  useEffect(() => {
    if (selectedShippingMethod && selectedShippingMethod !== 'none' && selectedShippingMethod !== 'loading' && shippingRates.length > 0) {
      const rate = shippingRates.find(r => r.deliveryMethod === selectedShippingMethod);
      if (rate) {
        let cost = parseFloat(rate.basePrice);
        if (rate.pricePerKg && totalWeight > 0) {
          cost += totalWeight * parseFloat(rate.pricePerKg);
        }
        
        // Check for free shipping threshold
        const orderTotal = getTotalPrice();
        if (rate.freeShippingThreshold && orderTotal >= parseFloat(rate.freeShippingThreshold)) {
          cost = 0;
        }
        
        setShippingCost(cost);
      }
    } else {
      setShippingCost(0);
    }
  }, [selectedShippingMethod, totalWeight, shippingRates, getTotalPrice]);

  if (cartItems.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Button onClick={onClose} variant="outline">
              Continue Shopping
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart ({totalItems} items)
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCart}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear All
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {cartItems.map(({ product, quantity }) => {
              const basePrice = parseFloat(product.price);
              const itemTotal = basePrice * quantity;
              
              // Calculate bulk discount if applicable
              let discountedPrice = basePrice;
              let applicableDiscount = null;
              
              if (product.quantityDiscounts && Array.isArray(product.quantityDiscounts) && product.quantityDiscounts.length > 0) {
                applicableDiscount = product.quantityDiscounts
                  .filter((d: any) => quantity >= d.minQty)
                  .sort((a: any, b: any) => b.minQty - a.minQty)[0];
                
                if (applicableDiscount) {
                  discountedPrice = basePrice * (1 - applicableDiscount.discount);
                }
              }
              
              const finalItemTotal = discountedPrice * quantity;
              const savings = itemTotal - finalItemTotal;

              return (
                <Card key={product.id} className="relative">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ShoppingCart className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-medium text-sm mb-1">{product.name}</h3>
                        <p className="text-xs text-gray-600 mb-2">{product.category}</p>
                        
                        {/* Price Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              ${discountedPrice.toFixed(2)} each
                            </span>
                            {applicableDiscount && (
                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 text-xs">
                                {(applicableDiscount.discount * 100).toFixed(0)}% OFF
                              </Badge>
                            )}
                          </div>
                          
                          {savings > 0 && (
                            <div className="text-xs text-green-600">
                              💰 Saving ${savings.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveItem(product.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onUpdateQuantity(product.id, quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-medium text-sm">
                            ${finalItemTotal.toFixed(2)}
                          </div>
                          {savings > 0 && basePrice !== discountedPrice && (
                            <div className="text-xs text-gray-500 line-through">
                              ${itemTotal.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>

        <Separator />

        {/* Shipping Method Selection */}
        <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium">روش ارسال</span>
            <span className="text-xs text-gray-500">(وزن کل: {totalWeight.toFixed(1)} کیلوگرم)</span>
          </div>
          
          <Select value={selectedShippingMethod} onValueChange={setSelectedShippingMethod}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="انتخاب روش ارسال..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون انتخاب روش ارسال</SelectItem>
              {shippingRatesLoading ? (
                <SelectItem value="loading" disabled>در حال بارگذاری...</SelectItem>
              ) : (
                shippingRates.map((rate) => (
                  <SelectItem key={rate.id} value={rate.deliveryMethod}>
                    <div className="flex flex-col">
                      <span>{rate.description || rate.deliveryMethod}</span>
                      <span className="text-xs text-gray-500">
                        {parseFloat(rate.basePrice).toLocaleString()} د.ع
                        {rate.pricePerKg && ` + ${parseFloat(rate.pricePerKg).toLocaleString()} د.ع/کیلو`}
                        {rate.estimatedDays && ` - ${rate.estimatedDays} روز`}
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Cart Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Subtotal ({totalItems} items)</span>
            <span className="font-medium">${(getTotalPrice() + getTotalSavings()).toFixed(2)}</span>
          </div>
          
          {getTotalSavings() > 0 && (
            <div className="flex items-center justify-between text-green-600">
              <span className="text-sm">Total Savings</span>
              <span className="font-medium">-${getTotalSavings().toFixed(2)}</span>
            </div>
          )}
          
          {/* Shipping Cost */}
          {selectedShippingMethod && shippingCost > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <Truck className="w-3 h-3" />
                هزینه ارسال
              </span>
              <span className="font-medium">{shippingCost.toLocaleString()} د.ع</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>${getTotalPrice().toFixed(2)} {shippingCost > 0 && `+ ${shippingCost.toLocaleString()} د.ع`}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Continue Shopping
          </Button>
          <Button onClick={onCheckout} className="flex-1">
            <ShoppingCart className="w-4 h-4 mr-2" />
            Proceed to Checkout
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}