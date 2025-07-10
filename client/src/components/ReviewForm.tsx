import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send, User, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [pros, setPros] = useState("");
  const [cons, setCons] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      setCustomerName("");
      setCustomerEmail("");
      setPros("");
      setCons("");
      
      // Refresh reviews data
      queryClient.invalidateQueries({
        queryKey: [`/api/products/${productId}/reviews`]
      });
      
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "خطا در ارسال نظر",
        description: error.message || "لطفاً دوباره تلاش کنید",
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
    
    if (!customerName.trim()) {
      toast({
        title: "لطفاً نام خود را وارد کنید",
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
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      pros: prosArray,
      cons: consArray
    });
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        نظر شما درباره {productName}
      </h3>
      
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

        {/* Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نام شما *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="نام و نام خانوادگی"
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ایمیل (اختیاری)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="example@email.com"
                className="pl-10"
              />
            </div>
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