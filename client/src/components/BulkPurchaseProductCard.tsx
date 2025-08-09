import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Save, Edit3, Package, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface BulkPurchaseProductCardProps {
  product: any;
  onUpdate: () => void;
}

export default function BulkPurchaseProductCard({ product, onUpdate }: BulkPurchaseProductCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [bulkEnabled, setBulkEnabled] = useState(product.bulk_purchase_enabled || false);
  const [minimumQuantity, setMinimumQuantity] = useState(product.bulk_purchase_minimum_quantity || "");
  const [description, setDescription] = useState(product.bulk_purchase_description || "");
  const { toast } = useToast();

  const updateBulkPurchaseMutation = useMutation({
    mutationFn: async (data: {
      productId: number;
      bulk_purchase_enabled: boolean;
      bulk_purchase_minimum_quantity: number | null;
      bulk_purchase_description: string;
    }) => {
      return await apiRequest(`/api/shop/products/${data.productId}/bulk-purchase`, {
        method: 'PUT',
        body: JSON.stringify({
          bulk_purchase_enabled: data.bulk_purchase_enabled,
          bulk_purchase_minimum_quantity: data.bulk_purchase_minimum_quantity,
          bulk_purchase_description: data.bulk_purchase_description,
        }),
      });
    },
    onSuccess: () => {
      setIsEditing(false);
      onUpdate();
      toast({
        title: "Success",
        description: "Bulk purchase settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update bulk purchase settings",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    const quantity = minimumQuantity ? parseInt(minimumQuantity) : null;
    
    if (bulkEnabled && (!quantity || quantity < 1)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid minimum quantity for bulk purchases",
        variant: "destructive",
      });
      return;
    }

    updateBulkPurchaseMutation.mutate({
      productId: product.id,
      bulk_purchase_enabled: bulkEnabled,
      bulk_purchase_minimum_quantity: quantity,
      bulk_purchase_description: description,
    });
  };

  const handleCancel = () => {
    setBulkEnabled(product.bulk_purchase_enabled || false);
    setMinimumQuantity(product.bulk_purchase_minimum_quantity || "");
    setDescription(product.bulk_purchase_description || "");
    setIsEditing(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="text-lg font-semibold">{product.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={bulkEnabled ? "default" : "secondary"}>
              {bulkEnabled ? "Bulk Enabled" : "Bulk Disabled"}
            </Badge>
            {!isEditing && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
          <div>
            <Label className="text-xs text-gray-500">SKU</Label>
            <p className="text-sm font-medium">{product.sku}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Unit Price</Label>
            <p className="text-sm font-medium flex items-center">
              <DollarSign className="w-3 h-3 mr-1" />
              {product.unitPrice}
            </p>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Stock</Label>
            <p className="text-sm font-medium">{product.stockQuantity}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-500">Category</Label>
            <p className="text-sm font-medium">{product.category || "N/A"}</p>
          </div>
        </div>

        {/* Bulk Purchase Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor={`bulk-enabled-${product.id}`} className="text-sm font-medium">
                Enable Bulk Purchases
              </Label>
              <p className="text-xs text-gray-500">
                Allow customers to purchase this product in bulk quantities
              </p>
            </div>
            <Switch
              id={`bulk-enabled-${product.id}`}
              checked={bulkEnabled}
              onCheckedChange={setBulkEnabled}
              disabled={!isEditing}
            />
          </div>

          {bulkEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`min-quantity-${product.id}`} className="text-sm font-medium">
                    Minimum Quantity *
                  </Label>
                  <Input
                    id={`min-quantity-${product.id}`}
                    type="number"
                    min="1"
                    placeholder="e.g., 10"
                    value={minimumQuantity}
                    onChange={(e) => setMinimumQuantity(e.target.value)}
                    disabled={!isEditing}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum quantity required for bulk purchases
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Settings</Label>
                  <div className="mt-1 p-2 bg-blue-50 rounded text-xs">
                    <p><strong>Status:</strong> {product.bulk_purchase_enabled ? "Enabled" : "Disabled"}</p>
                    <p><strong>Min Qty:</strong> {product.bulk_purchase_minimum_quantity || "Not set"}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor={`description-${product.id}`} className="text-sm font-medium">
                  Bulk Purchase Description
                </Label>
                <Textarea
                  id={`description-${product.id}`}
                  placeholder="Describe bulk purchase benefits, discounts, or special terms..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isEditing}
                  className="mt-1"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This description will be shown to customers on the product page
                </p>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={updateBulkPurchaseMutation.isPending}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {updateBulkPurchaseMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={updateBulkPurchaseMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Current Status Display */}
        {!isEditing && product.bulk_purchase_enabled && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-800">
              Bulk purchases enabled with minimum quantity: {product.bulk_purchase_minimum_quantity}
            </p>
            {product.bulk_purchase_description && (
              <p className="text-xs text-green-600 mt-1">
                {product.bulk_purchase_description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}