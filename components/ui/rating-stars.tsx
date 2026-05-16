'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function RatingStars({ rating, max = 5, size = 'sm', showValue, className }: RatingStarsProps) {
  const sizes = { sm: 12, md: 16, lg: 20 };
  const px = sizes[size];

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={px}
          className={i < Math.floor(rating) ? 'fill-amber text-amber' : 'fill-surface3 text-surface3'}
        />
      ))}
      {showValue && <span className="text-text2 text-sm ml-1">{rating.toFixed(1)}</span>}
    </div>
  );
}
