import { Plus, Minus, Trash2, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

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


  const cartItems = Object.entries(cart).map(([productId, quantity]) => {
    const product = products.find(p => p.id === parseInt(productId));
    return { product, quantity };
  }).filter(item => item.product && item.quantity > 0);

  const totalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalWeight = cartItems.reduce((sum, item) => {
    const weight = parseFloat(item.product.weight || '1');
    return sum + (weight * item.quantity);
  }, 0);



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
          
          <Separator />
          
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>${getTotalPrice().toFixed(2)}</span>
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