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

  // Get product details from shop products
  const { data: products, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['/api/shop/products'],
    enabled: !!id,
  });

  // Find the specific product
  const product = products?.find((p: any) => p.id === parseInt(id || '0'));

  // Get product reviews data - using proper shop products endpoint
  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery({
    queryKey: [`/api/products/${id}/reviews`],
    enabled: !!id,
  });

  // Extract reviews and stats from the response data
  const reviews = reviewsData?.data?.reviews || [];
  const productStats = reviewsData?.data?.stats || { averageRating: 0, totalReviews: 0 };

  // Debug logging
  console.log('🔍 DEBUGGING REVIEWS ISSUE:');
  console.log('Product ID:', id);
  console.log('Reviews Data Full:', JSON.stringify(reviewsData, null, 2));
  console.log('Reviews Array Length:', reviews.length);
  console.log('Reviews Array:', reviews);
  console.log('Product Stats:', productStats);
  console.log('Product:', product);
  
  // Check if reviewsData structure is correct
  if (reviewsData) {
    console.log('ReviewsData type:', typeof reviewsData);
    console.log('ReviewsData keys:', Object.keys(reviewsData));
    if (reviewsData.data) {
      console.log('ReviewsData.data keys:', Object.keys(reviewsData.data));
      console.log('ReviewsData.data.reviews:', reviewsData.data.reviews);
    }
  }

  // Add review mutation
  const addReviewMutation = useMutation({
    mutationFn: async (reviewData: { rating: number; comment: string }) => {
      const payload = {
        rating: reviewData.rating,
        review: reviewData.comment, // Map comment to review field
        title: '', // Optional field
        pros: [], // Optional field
        cons: [] // Optional field
      };
      return await apiRequest(`/api/products/${id}/reviews`, 'POST', payload);
    },
    onSuccess: () => {
      // Invalidate and refetch product reviews (which includes stats)
      queryClient.invalidateQueries({ queryKey: [`/api/products/${id}/reviews`] });
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

  const handleAddReview = async (reviewData: { rating: number; comment: string }) => {
    console.log('🔥 [HANDLE ADD REVIEW] Starting...');
    console.log('🔥 [HANDLE ADD REVIEW] Review data:', reviewData);
    console.log('🔥 [HANDLE ADD REVIEW] Product ID:', id);
    try {
      const result = await addReviewMutation.mutateAsync(reviewData);
      console.log('✅ [HANDLE ADD REVIEW] Success:', result);
      return result;
    } catch (error) {
      console.error('❌ [HANDLE ADD REVIEW] Error:', error);
      throw error;
    }
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
        {product && (
          <ProductRating
            productId={parseInt(id || '0')}
            productName={product.name}
            averageRating={productStats?.averageRating || 0}
            totalReviews={productStats?.totalReviews || 0}
            reviews={reviews}
            onAddReview={handleAddReview}
          />
        )}
      </div>
    </div>
  );
}