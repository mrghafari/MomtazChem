import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import StarRating from './StarRating';
import { User, MessageSquare, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';

interface Review {
  id: number;
  customerName: string;
  rating: number;
  review: string;
  createdAt: string;
}

interface ProductRatingProps {
  productId: number;
  productName: string;
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
  onAddReview?: (review: { rating: number; comment: string }) => void;
}

export default function ProductRating({
  productId,
  productName,
  averageRating,
  totalReviews,
  reviews,
  onAddReview
}: ProductRatingProps) {
  const { toast } = useToast();
  const { t, direction } = useLanguage();
  const [newRating, setNewRating] = React.useState(0);
  const [newComment, setNewComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Check if user is authenticated
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['/api/customers/me'],
    enabled: true
  });

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newRating === 0) {
      toast({
        title: t.error,
        description: t.rating,
        variant: "destructive"
      });
      return;
    }
    
    if (!newComment.trim()) {
      toast({
        title: t.error, 
        description: t.comment,
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (onAddReview) {
        await onAddReview({
          rating: newRating,
          comment: newComment.trim()
        });
      }
      
      // Reset form
      setNewRating(0);
      setNewComment('');
      
      toast({
        title: t.reviewSubmitted,
        description: t.reviewSubmittedDesc
      });
    } catch (error) {
      toast({
        title: t.reviewError,
        description: t.reviewErrorDesc,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Debug logging
  console.log('ProductRating Props:', { productId, productName, averageRating, totalReviews, reviews: reviews.length });

  return (
    <div className="space-y-6" dir={direction}>
      {/* Product Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            نظرات محصول: {productName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {averageRating.toFixed(1)}
              </div>
              <StarRating rating={averageRating} size="lg" />
            </div>
            <div className="text-gray-600">
              <div className="text-lg font-semibold">{totalReviews} نظر کل</div>
              <div className="text-sm">بازخورد مشتریان</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Review */}
      <Card>
        <CardHeader>
          <CardTitle>{t.addYourReview}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCustomer ? (
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ) : !customer ? (
            <div className="text-center py-8">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                برای ثبت نظر ابتدا وارد شوید
              </h3>
              <p className="text-gray-600 mb-4">
                جهت ثبت نظر و امتیاز دادن به محصولات، ابتدا باید وارد حساب کاربری خود شوید
              </p>
              <div className="flex gap-2 justify-center">
                <Button 
                  onClick={() => window.location.href = '/auth/login'}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  ورود
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/auth/register'}
                >
                  ثبت نام
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                ثبت نظر به نام: {customer.firstName} {customer.lastName}
              </p>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <Label>{t.rating}</Label>
                  <div className="mt-2">
                    <StarRating
                      rating={newRating}
                      size="lg"
                      interactive={true}
                      onRatingChange={setNewRating}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="comment">{t.comment}</Label>
                  <Textarea
                    id="comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={t.writeReview}
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? t.loading : t.submitReview}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>{t.customerReviews}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
            DEBUG: تعداد نظرات: {reviews.length} | آیدی محصول: {productId}
          </div>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>هنوز نظری ثبت نشده</p>
              <p className="text-sm">اولین نفری باشید که نظر می‌دهید</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">{review.customerName}</span>
                        <span className="text-sm text-gray-500">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                      <StarRating rating={review.rating} size="sm" />
                      <p className="mt-2 text-gray-700">{review.review}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}