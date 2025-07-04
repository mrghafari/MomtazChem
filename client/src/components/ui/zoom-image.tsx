import { useState } from "react";

interface ZoomImageProps {
  src: string;
  alt: string;
  className?: string;
  zoomScale?: number;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const ZoomImage = ({ 
  src, 
  alt, 
  className = "", 
  zoomScale = 1.2,
  onError 
}: ZoomImageProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative overflow-hidden cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img 
        src={src} 
        alt={alt}
        className={`transition-transform duration-300 ease-in-out ${className} ${
          isHovered ? `scale-${Math.round(zoomScale * 100)}` : 'scale-100'
        }`}
        style={{
          transform: isHovered ? `scale(${zoomScale})` : 'scale(1)'
        }}
        onError={onError}
      />
      {isHovered && (
        <div className="absolute inset-0 bg-black bg-opacity-10 pointer-events-none" />
      )}
    </div>
  );
};