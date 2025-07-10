import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import StarRating from './StarRating';
import { User, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Review {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProductRatingProps {
  productId: number;
  productName: string;
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
  onAddReview?: (review: { rating: number; comment: string; customerName: string }) => void;
  isShopProduct?: boolean; // Flag to determine if this is a shop product
}

export default function ProductRating({
  productId,
  productName,
  averageRating,
  totalReviews,
  reviews,
  onAddReview,
  isShopProduct = false
}: ProductRatingProps) {
  const { toast } = useToast();
  const { t, direction } = useLanguage();
  const [newRating, setNewRating] = React.useState(0);
  const [newComment, setNewComment] = React.useState('');
  const [customerName, setCustomerName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
    
    if (!customerName.trim()) {
      toast({
        title: t.error,
        description: t.customerName,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (onAddReview) {
        await onAddReview({
          rating: newRating,
          comment: newComment.trim(),
          customerName: customerName.trim()
        });
      }
      
      // Reset form
      setNewRating(0);
      setNewComment('');
      setCustomerName('');
      
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

  return (
    <div className="space-y-6" dir={direction}>
      {/* Product Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            {t.productReviews}: {productName}
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
              <div className="text-lg font-semibold">{totalReviews} {t.totalReviews}</div>
              <div className="text-sm">{t.customerFeedback}</div>
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
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <Label htmlFor="customerName">{t.customerName}</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t.customerName}
                className="mt-1"
              />
            </div>

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
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>{t.customerReviews}</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{t.noReviewsYet}</p>
              <p className="text-sm">{t.noReviewsDesc}</p>
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
                      <p className="mt-2 text-gray-700">{review.review || review.comment}</p>
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