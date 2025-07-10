import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import StarRating from './StarRating';
import { User, MessageSquare } from 'lucide-react';

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
  const [newRating, setNewRating] = React.useState(0);
  const [newComment, setNewComment] = React.useState('');
  const [customerName, setCustomerName] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newRating === 0) {
      toast({
        title: "خطا",
        description: "لطفاً امتیاز محصول را انتخاب کنید",
        variant: "destructive"
      });
      return;
    }
    
    if (!newComment.trim()) {
      toast({
        title: "خطا", 
        description: "لطفاً نظر خود را بنویسید",
        variant: "destructive"
      });
      return;
    }
    
    if (!customerName.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً نام خود را وارد کنید",
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
        title: "موفق",
        description: "نظر شما با موفقیت ثبت شد"
      });
    } catch (error) {
      toast({
        title: "خطا",
        description: "خطا در ثبت نظر",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="space-y-6">
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
              <div className="text-lg font-semibold">{totalReviews} نظر</div>
              <div className="text-sm">از کاربران</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Review */}
      <Card>
        <CardHeader>
          <CardTitle>نظر جدید</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitReview} className="space-y-4">
            <div>
              <Label htmlFor="customerName">نام شما</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="نام خود را وارد کنید"
                className="mt-1"
              />
            </div>

            <div>
              <Label>امتیاز محصول</Label>
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
              <Label htmlFor="comment">نظر شما</Label>
              <Textarea
                id="comment"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="نظر خود را در مورد این محصول بنویسید..."
                className="mt-1"
                rows={4}
              />
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'در حال ثبت...' : 'ثبت نظر'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle>نظرات کاربران</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>هنوز نظری ثبت نشده است</p>
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
                      <p className="mt-2 text-gray-700">{review.comment}</p>
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