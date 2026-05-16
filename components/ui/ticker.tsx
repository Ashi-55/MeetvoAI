'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

export interface TickerProps {
  items: string[];
  className?: string;
}

export function Ticker({ items, className }: TickerProps) {
  const duplicated = React.useMemo(() => {
    const safe = items ?? [];
    return [...safe, ...safe];
  }, [items]);

  return (
    <div
      className={cn('w-full overflow-hidden rounded-lg bg-[#0A0F1E]', className)}
      aria-label="ticker"
    >
      <div
        className="flex items-center gap-4 px-4 py-3"
      >
        <span className="text-xs font-medium text-white/60 mr-2">Verified</span>

        <div className="relative flex-1">
          <div
            className="flex items-center gap-5 whitespace-nowrap"
            style={{ animation: 'ticker 40s linear infinite' }}
          >
            {duplicated.map((item, idx) => (
              <div key={`${item}-${idx}`} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <span className="text-sm font-medium text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}

