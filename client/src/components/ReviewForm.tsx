import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, User, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ReviewFormProps {
  productId: number;
  productName: string;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, productName, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [review, setReview] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if user is authenticated
  const { data: customer, isLoading: isLoadingCustomer } = useQuery({
    queryKey: ['/api/customers/me'],
    enabled: true
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/products/${productId}/reviews`, {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" }
      });
    },
    onSuccess: () => {
      toast({
        title: "نظر شما ارسال شد",
        description: "نظر شما پس از تایید مدیر نمایش داده می‌شود",
      });
      
      // Reset form
      setRating(0);
      setTitle("");
      setReview("");
      setPros("");
      setCons("");
      
      // Refresh reviews data
      queryClient.invalidateQueries({
        queryKey: [`/api/products/${productId}/reviews`]
      });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      const errorMessage = error.message || "لطفاً دوباره تلاش کنید";
      toast({
        title: "خطا در ارسال نظر",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: "لطفاً امتیاز دهید",
        description: "انتخاب امتیاز الزامی است",
        variant: "destructive",
      });
      return;
    }
    
    const prosArray = pros.split('\n').filter(p => p.trim().length > 0);
    const consArray = cons.split('\n').filter(c => c.trim().length > 0);

    submitReviewMutation.mutate({
      rating,
      title: title.trim(),
      review: review.trim(),
      pros: prosArray,
      cons: consArray
    });
  };

  // If loading customer data, show loading state
  if (isLoadingCustomer) {
    return (
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show login prompt
  if (!customer) {
    return (
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="text-center">
          <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            برای ثبت نظر ابتدا وارد شوید
          </h3>
          <p className="text-gray-600">
            جهت ثبت نظر و امتیاز دادن به محصولات، ابتدا باید وارد حساب کاربری خود شوید
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        نظر شما درباره {productName}
      </h3>
      <p className="text-sm text-gray-600">
        ثبت نظر به نام: {customer.firstName} {customer.lastName}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Stars */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            امتیاز شما *
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1 hover:scale-110 transition-transform"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  size={24}
                  className={`${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="mr-2 text-sm text-gray-600">
                {rating === 1 && "خیلی بد"}
                {rating === 2 && "بد"}
                {rating === 3 && "متوسط"}
                {rating === 4 && "خوب"}
                {rating === 5 && "عالی"}
              </span>
            )}
          </div>
        </div>

        {/* Review Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            عنوان نظر (اختیاری)
          </label>
          <Input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="خلاصه نظر شما..."
            maxLength={100}
          />
        </div>

        {/* Review Text */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            نظر شما (اختیاری)
          </label>
          <Textarea
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="تجربه خود از استفاده از این محصول را بنویسید..."
            rows={4}
            maxLength={1000}
          />
        </div>

        {/* Pros and Cons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نقاط مثبت (اختیاری)
            </label>
            <Textarea
              value={pros}
              onChange={(e) => setPros(e.target.value)}
              placeholder="هر نقطه مثبت را در یک خط بنویسید..."
              rows={3}
              className="text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نقاط منفی (اختیاری)
            </label>
            <Textarea
              value={cons}
              onChange={(e) => setCons(e.target.value)}
              placeholder="هر نقطه منفی را در یک خط بنویسید..."
              rows={3}
              className="text-sm"
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={submitReviewMutation.isPending || rating === 0}
          className="w-full"
        >
          {submitReviewMutation.isPending ? (
            "در حال ارسال..."
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              ارسال نظر
            </>
          )}
        </Button>
      </form>
    </div>
  );
}