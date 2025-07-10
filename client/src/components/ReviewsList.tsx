import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductRating } from "./ProductRating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, CheckCircle, Calendar, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

interface ReviewsListProps {
  productId: number;
}

interface Review {
  id: number;
  productId: number;
  customerId?: number;
  customerName: string;
  rating: number;
  title?: string;
  review?: string;
  pros?: string[];
  cons?: string[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  notHelpfulVotes: number;
  adminResponse?: string;
  adminResponseDate?: string;
  createdAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: { [key: string]: number };
}

export function ReviewsList({ productId }: ReviewsListProps) {
  const { data: reviewsData, isLoading } = useQuery({
    queryKey: [`/api/products/${productId}/reviews`],
    enabled: !!productId
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!reviewsData?.success || !reviewsData?.data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">هنوز نظری برای این محصول ثبت نشده است</p>
      </div>
    );
  }

  const { reviews, stats }: { reviews: Review[]; stats: ReviewStats } = reviewsData.data;

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ar 
      });
    } catch {
      return "تاریخ نامشخص";
    }
  };

  const RatingDistribution = ({ stats }: { stats: ReviewStats }) => (
    <div className="bg-gray-50 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">خلاصه امتیازات</h3>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800">
            {stats.averageRating.toFixed(1)}
          </div>
          <ProductRating rating={stats.averageRating} showText={false} size="sm" />
          <div className="text-sm text-gray-600 mt-1">
            {stats.totalReviews} نظر
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = stats.ratingDistribution[rating.toString()] || 0;
          const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
          
          return (
            <div key={rating} className="flex items-center gap-2">
              <span className="text-sm w-8">{rating} ستاره</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <span className="text-sm text-gray-600 w-8">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {stats.totalReviews > 0 && <RatingDistribution stats={stats} />}
      
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <User className="w-5 h-5" />
          نظرات کاربران ({reviews.length})
        </h3>
        
        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>هنوز نظری تایید نشده است</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {review.customerName}
                        </span>
                        {review.isVerifiedPurchase && (
                          <Badge variant="secondary" className="text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            خرید تایید شده
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <ProductRating rating={review.rating} showText={false} size="sm" />
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(review.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {review.title && (
                  <h4 className="font-medium text-gray-800 mb-2">{review.title}</h4>
                )}

                {review.review && (
                  <p className="text-gray-700 leading-relaxed mb-3">{review.review}</p>
                )}

                {/* Pros and Cons */}
                {((review.pros && review.pros.length > 0) || (review.cons && review.cons.length > 0)) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    {review.pros && review.pros.length > 0 && (
                      <div>
                        <h5 className="font-medium text-green-700 mb-2 text-sm">نقاط مثبت:</h5>
                        <ul className="space-y-1">
                          {review.pros.map((pro, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {review.cons && review.cons.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-700 mb-2 text-sm">نقاط منفی:</h5>
                        <ul className="space-y-1">
                          {review.cons.map((con, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Response */}
                {review.adminResponse && (
                  <div className="bg-blue-50 border-r-4 border-blue-400 p-3 mt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-blue-800 text-sm">پاسخ مدیریت:</span>
                      {review.adminResponseDate && (
                        <span className="text-xs text-blue-600">
                          {formatDate(review.adminResponseDate)}
                        </span>
                      )}
                    </div>
                    <p className="text-blue-700 text-sm">{review.adminResponse}</p>
                  </div>
                )}

                {/* Helpful votes */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                  <span className="text-sm text-gray-600">آیا این نظر مفید بود؟</span>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8">
                      <ThumbsUp className="w-3 h-3 mr-1" />
                      بله ({review.helpfulVotes})
                    </Button>
                    <Button variant="outline" size="sm" className="h-8">
                      <ThumbsDown className="w-3 h-3 mr-1" />
                      خیر ({review.notHelpfulVotes})
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}