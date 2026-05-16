'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  verified?: boolean;
  className?: string;
}

const sizeToPx: Record<NonNullable<AvatarProps['size']>, number> = {
  sm: 32,
  md: 40,
  lg: 64,
  xl: 100,
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name, size = 'md', verified = false, className }: AvatarProps) {
  const px = sizeToPx[size];
  const initials = getInitials(name);

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-cyan-600 text-white select-none',
        className
      )}
      style={{ width: px, height: px, fontSize: Math.max(12, Math.round(px * 0.28)) }}
      aria-label={name}
    >
      <span className="font-semibold leading-none">{initials}</span>

      {verified ? (
        <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shadow">
          ✓
        </span>
      ) : null}
    </div>
  );
}

