'use client';

import { useMemo } from 'react';

export type MarketplaceCategory =
  | 'all'
  | 'whatsapp'
  | 'voice'
  | 'lead'
  | 'support'
  | 'booking'
  | 'automation'
  | 'website'
  | 'custom';

const TABS: Array<{ key: MarketplaceCategory; label: string }> = [
  { key: 'all', label: '⚡ All' },
  { key: 'whatsapp', label: '💬 WhatsApp' },
  { key: 'voice', label: '🎙️ Voice' },
  { key: 'lead', label: '🎯 Lead' },
  { key: 'support', label: '🛟 Support' },
  { key: 'booking', label: '📅 Booking' },
  { key: 'automation', label: '⚙️ Automation' },
  { key: 'website', label: '🌐 Website' },
  { key: 'custom', label: '🔧 Custom' },
];

export function CategoryTabs({
  active,
  onCategory,
}: {
  active: MarketplaceCategory;
  onCategory: (category: MarketplaceCategory) => void;
}) {
  const items = useMemo(() => TABS, []);

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex gap-6 min-w-max pb-2">
        {items.map((t) => {
          const isActive = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => onCategory(t.key)}
              className={
                isActive
                  ? 'text-white font-semibold relative pb-3'
                  : 'text-text3 hover:text-text2 font-medium relative pb-3'
              }
              style={{
                borderBottomWidth: isActive ? 2 : 0,
                borderBottomStyle: 'solid',
                borderBottomColor: isActive ? 'rgba(0,201,167,1)' : 'transparent',
              }}
              type="button"
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* hide scrollbar (best effort) */}
      <style jsx>{`
        div::-webkit-scrollbar {
          display: none;
        }
        div {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

