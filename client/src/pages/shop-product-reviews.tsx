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

export default function ShopProductReviews() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useMultilingualToast();
  const queryClient = useQueryClient();
  const { t, direction } = useLanguage();

  // Get shop product details
  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['/api/shop/products', id],
    enabled: !!id,
  });

  // Get shop product reviews
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: ['/api/shop/products', id, 'reviews'],
    enabled: !!id,
  });

  // Extract reviews and stats from the response data
  const reviews = reviewsData?.data?.reviews || [];
  const productStats = reviewsData?.data?.stats || { averageRating: 0, totalReviews: 0 };

  // Add shop review mutation
  const addReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string; customerName: string }) => {
      const payload = {
        rating: reviewData.rating,
        review: reviewData.comment, // Map comment to review field
        customerName: reviewData.customerName,
        title: '', // Optional field
        customerEmail: '', // Optional field
        pros: [], // Optional field
        cons: [] // Optional field
      };
      console.log('Shop review payload:', payload);
      return await apiRequest(`/api/shop/products/${id}/reviews`, 'POST', payload);
    },
    onSuccess: () => {
      // Invalidate and refetch shop product reviews and stats
      queryClient.invalidateQueries({ queryKey: ['/api/shop/products', id, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop/product-stats'] });
      toast({
        title: t.reviewSubmitted,
        description: t.reviewSubmittedDesc,
      });
    },
    onError: (error) => {
      console.error('Shop review error:', error);
      toast({
        title: t.reviewError,
        description: t.reviewErrorDesc,
        variant: 'destructive',
      });
    },
  });

  const handleAddReview = async (reviewData: { rating: number; comment: string; customerName: string }) => {
    console.log('Adding shop review:', reviewData);
    await addReviewMutation.mutateAsync(reviewData);
  };

  if (isLoadingProduct || isLoadingReviews) {
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

  // Map reviews to the format expected by ProductRating component
  const formattedReviews = reviews.map((review: any) => ({
    id: review.id,
    customerName: review.customerName,
    rating: review.rating,
    comment: review.review || review.comment || '',
    createdAt: review.createdAt
  }));

  return (
    <div className="container mx-auto px-4 py-8" dir={direction}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            onClick={() => navigate('/shop')} 
            variant="outline" 
            size="sm"
          >
            <ArrowLeft className={`w-4 h-4 ${direction === 'rtl' ? 'ml-2' : 'mr-2'}`} />
            {t.backToShop}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.productReviews}</h1>
            <p className="text-gray-600">{product.name}</p>
          </div>
        </div>

        {/* Product Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              {product.imageUrl && (
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={product.imageUrl} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                <p className="text-gray-600 mb-2">{product.description}</p>
                <div className="flex items-center gap-4">
                  <Badge variant={product.inStock ? "secondary" : "destructive"}>
                    {product.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                  {product.price && (
                    <span className="text-lg font-bold text-green-600">
                      {parseFloat(product.price).toFixed(2)} {product.priceUnit || 'IQD'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Rating Component */}
        <ProductRating
          productId={parseInt(id!)}
          productName={product.name}
          averageRating={productStats.averageRating}
          totalReviews={productStats.totalReviews}
          reviews={formattedReviews}
          onAddReview={handleAddReview}
          isShopProduct={true}
        />
      </div>
    </div>
  );
}