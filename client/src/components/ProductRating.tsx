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
import { useCustomer } from '@/hooks/useCustomer';

interface Review {
  id: number;
  customerId: number;
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
  const [isEditing, setIsEditing] = React.useState(false);

  // Check if user is authenticated
  const { customer, isLoading: isLoadingCustomer } = useCustomer();

  // Find existing review by current customer 
  const existingReview = React.useMemo(() => {
    if (!customer) return null;
    
    // Debug logging for customer matching
    console.log('🔍 CUSTOMER MATCHING DEBUG:');
    console.log('Current customer:', customer);
    console.log('Customer ID:', customer.id);
    console.log('Available reviews:', reviews);
    reviews.forEach((review, index) => {
      console.log(`Review ${index}: customerID ${review.customerId} === ${customer.id}?`, review.customerId === customer.id);
    });
    
    const found = reviews.find(review => 
      review.customerId === customer.id
    );
    console.log('Found existing review:', found);
    return found;
  }, [reviews, customer]);

  // Initialize form with existing review data if editing
  React.useEffect(() => {
    if (isEditing && existingReview) {
      setNewRating(existingReview.rating);
      setNewComment(existingReview.comment);
    } else if (!isEditing) {
      setNewRating(0);
      setNewComment('');
    }
  }, [isEditing, existingReview]);

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
      
      // Reset form after successful submission
      setNewRating(0);
      setNewComment('');
      setIsEditing(false);
      
      toast({
        title: isEditing ? "نظر با موفقیت به‌روزرسانی شد" : t.reviewSubmitted,
        description: isEditing ? "تغییرات شما ذخیره شد" : t.reviewSubmittedDesc
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

  const handleCancelEdit = () => {
    setIsEditing(false);
    setNewRating(0);
    setNewComment('');
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Debug logging
  console.log('ProductRating Props:', { productId, productName, averageRating, totalReviews, reviews: reviews });

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
              <p className="text-gray-600">
                جهت ثبت نظر و امتیاز دادن به محصولات، ابتدا باید وارد حساب کاربری خود شوید
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                ثبت نظر به نام: {customer.firstName} {customer.lastName}
              </p>
              
              {/* Show existing review and edit button if user has already reviewed */}
              {existingReview && !isEditing && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-blue-800">نظر قبلی شما:</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleStartEdit}
                      className="text-blue-600 border-blue-300 hover:bg-blue-100"
                    >
                      ویرایش نظر
                    </Button>
                  </div>
                  <div className="mb-2">
                    <StarRating rating={existingReview.rating} size="sm" />
                  </div>
                  <p className="text-gray-700">{existingReview.comment}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    ثبت شده در: {formatDate(existingReview.createdAt)}
                  </p>
                </div>
              )}

              {/* Show form only when adding new review or editing existing one */}
              {(!existingReview || isEditing) && (
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
                      placeholder={isEditing ? "نظر خود را ویرایش کنید..." : t.writeReview}
                      className="mt-1"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      {isSubmitting ? t.loading : (isEditing ? "به‌روزرسانی نظر" : t.submitReview)}
                    </Button>
                    
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                      >
                        لغو
                      </Button>
                    )}
                  </div>
                </form>
              )}
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
              {reviews.map((review) => {
                const isOwnReview = customer && review.customerName === `${customer.firstName} ${customer.lastName}`;
                
                return (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isOwnReview ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <User className={`w-5 h-5 ${isOwnReview ? 'text-blue-600' : 'text-gray-600'}`} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isOwnReview ? 'text-blue-700' : ''}`}>
                              {review.customerName}
                              {isOwnReview && <span className="text-xs text-blue-600">(شما)</span>}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          {isOwnReview && !isEditing && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleStartEdit}
                              className="text-blue-600 border-blue-300 hover:bg-blue-100"
                            >
                              ویرایش
                            </Button>
                          )}
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                        <p className="mt-2 text-gray-700">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}