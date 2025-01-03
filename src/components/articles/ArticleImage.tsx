import React from 'react';
import { OptimizedImage } from '../common/OptimizedImage';

interface ArticleImageProps {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}

export const ArticleImage: React.FC<ArticleImageProps> = ({
  src,
  alt,
  priority = false,
  className = ''
}) => {
  return (
    <div className="relative overflow-hidden">
      <OptimizedImage
        src={src}
        alt={alt}
        priority={priority}
        className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${className}`}
      />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-900 to-transparent" />
    </div>
  );
};

export default ArticleImage;