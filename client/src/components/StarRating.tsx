import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  reviewCount?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
}

export default function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  showNumber = false,
  reviewCount,
  interactive = false,
  onRatingChange,
  className = ''
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = React.useState(0);
  
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-xs',
    lg: 'text-sm'
  };
  
  const starSize = sizeClasses[size];
  const textSize = textSizeClasses[size];
  
  const getStarColor = (starIndex: number) => {
    const currentRating = interactive ? (hoverRating || rating) : rating;
    if (starIndex <= currentRating) {
      return 'fill-yellow-400 text-yellow-400';
    }
    return 'fill-gray-200 text-gray-200';
  };
  
  const handleStarClick = (starIndex: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starIndex);
    }
  };
  
  const handleStarHover = (starIndex: number) => {
    if (interactive) {
      setHoverRating(starIndex);
    }
  };
  
  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };
  
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div 
        className="flex items-center gap-0.5"
        onMouseLeave={handleMouseLeave}
      >
        {[...Array(maxStars)].map((_, index) => {
          const starIndex = index + 1;
          return (
            <Star
              key={index}
              className={`${starSize} ${getStarColor(starIndex)} ${
                interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''
              }`}
              onClick={() => handleStarClick(starIndex)}
              onMouseEnter={() => handleStarHover(starIndex)}
            />
          );
        })}
      </div>
      
      {showNumber && (
        <span className={`font-medium text-gray-700 ${textSize}`}>
          {rating.toFixed(1)}
        </span>
      )}
      
      {reviewCount !== undefined && (
        <span className={`text-gray-500 ${textSize}`}>
          ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
        </span>
      )}
    </div>
  );
}