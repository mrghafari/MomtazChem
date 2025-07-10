import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, MessageSquare, User, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useMultilingualToast } from '@/hooks/use-multilingual-toast';
import { apiRequest } from '@/lib/queryClient';
import ProductRating from '@/components/ProductRating';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProductReviews() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useMultilingualToast();
  const queryClient = useQueryClient();
  const { t, direction } = useLanguage();

  // Get product details
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['/api/products', id],
    enabled: !!id,
  });

  // Get product stats
  const { data: productStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/products', id, 'stats'],
    enabled: !!id,
  });

  // Get product reviews
  const { data: reviews = [], isLoading: isLoadingReviews } = useQuery({
    queryKey: ['/api/products', id, 'reviews'],
    enabled: !!id,
  });

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string; customerName: string }) => {
      return await apiRequest(`/api/products/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });
    },
    onSuccess: () => {
      // Invalidate and refetch product stats and reviews
      queryClient.invalidateQueries({ queryKey: ['/api/products', id, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products', id, 'reviews'] });
      toast({
        title: t.reviewSubmitted,
        description: t.reviewSubmittedDesc,
      });
    },
    onError: (error) => {
      toast({
        title: t.reviewError,
        description: t.reviewErrorDesc,
        variant: 'destructive',
      });
    },
  });

  const handleAddReview = async (reviewData: { rating: number; comment: string; customerName: string }) => {
    await addReviewMutation.mutateAsync(reviewData);
  };

  if (isLoadingProduct || isLoadingStats || isLoadingReviews) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8" dir={direction}>
        <div className="max-w-4xl mx-auto text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.productNotFound}</h1>
          <p className="text-gray-600 mb-4">{t.noReviewsDesc}</p>
          <Button onClick={() => navigate('/shop')} variant="outline">
            <ArrowLeft className={`w-4 h-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
            {t.backToShop}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir={direction}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/shop')}
            className="mb-4"
          >
            <ArrowLeft className={`w-4 h-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
            {t.backToShop}
          </Button>
        </div>

        {/* Product Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                {product.imageUrl ? (
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <p className="text-gray-600 mb-3">{product.description}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold text-green-600">
                      {product.price && !isNaN(parseFloat(product.price)) ? parseFloat(product.price).toFixed(2) : '0.00'}
                    </span>
                    <span className="text-sm text-gray-500">
                      / {product.priceUnit || 'unit'}
                    </span>
                  </div>
                  <Badge variant={product.inStock ? "secondary" : "destructive"}>
                    {product.inStock ? t.inStock : t.outOfStock}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rating Component */}
        <ProductRating
          productId={parseInt(id || '0')}
          productName={product.name}
          averageRating={productStats?.averageRating || 0}
          totalReviews={productStats?.totalReviews || 0}
          reviews={reviews}
          onAddReview={handleAddReview}
        />
      </div>
    </div>
  );
}