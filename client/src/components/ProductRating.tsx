import { Star, StarHalf } from "lucide-react";

interface ProductRatingProps {
  rating: number;
  totalReviews?: number;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function ProductRating({ rating, totalReviews, size = "md", showText = true }: ProductRatingProps) {
  const starSize = size === "sm" ? 16 : size === "md" ? 20 : 24;
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {/* Full stars */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star 
            key={`full-${i}`} 
            size={starSize} 
            className="fill-yellow-400 text-yellow-400" 
          />
        ))}
        
        {/* Half star */}
        {hasHalfStar && (
          <div className="relative">
            <Star size={starSize} className="text-gray-300" />
            <StarHalf 
              size={starSize} 
              className="absolute top-0 left-0 fill-yellow-400 text-yellow-400" 
            />
          </div>
        )}
        
        {/* Empty stars */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star 
            key={`empty-${i}`} 
            size={starSize} 
            className="text-gray-300" 
          />
        ))}
      </div>
      
      {showText && (
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <span className="font-medium">{rating.toFixed(1)}</span>
          {totalReviews !== undefined && (
            <span>({totalReviews} {totalReviews === 1 ? 'نظر' : 'نظر'})</span>
          )}
        </div>
      )}
    </div>
  );
}