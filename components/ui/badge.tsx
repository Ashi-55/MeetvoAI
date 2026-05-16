'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border',
  {
    variants: {
      tone: {
        whatsapp: 'bg-green-50 border-green-600 text-green-700',
        voice: 'bg-blue-50 border-blue-600 text-blue-700',
        lead: 'bg-orange-50 border-orange-600 text-orange-700',
        support: 'bg-indigo-50 border-indigo-600 text-indigo-700',
        booking: 'bg-teal-50 border-teal-600 text-teal-700',
        active: 'bg-teal-50 border-teal-600 text-teal-700',
        pending: 'bg-amber-50 border-amber-600 text-amber-700',
        completed: 'bg-green-50 border-green-600 text-green-700',
        disputed: 'bg-red-50 border-red-600 text-red-700',
      },
      size: {
        sm: 'h-6',
        md: 'h-7 px-3',
      },
    },
    defaultVariants: {
      tone: 'active',
      size: 'md',
    },
  }
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Convenience alias: use either `tone` or `type`. */
  type?: BadgeTone;
  loading?: boolean;
}

export function Badge({ className, tone, size, type, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ tone: type ?? tone, size }), className)}
      {...props}
    />
  );
}

