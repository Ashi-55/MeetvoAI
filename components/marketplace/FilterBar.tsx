 'use client';

import { useEffect, useMemo, useState } from 'react';

import type { MarketplaceCategory } from './CategoryTabs';

export type MarketplaceFilters = {
  categories: MarketplaceCategory[];
  priceMin?: number;
  priceMax?: number;
  rating4Plus: boolean;
  verifiedOnly: boolean;
  availableNow: boolean;
  location?: string;
};

const ALL_CATEGORIES: MarketplaceCategory[] = [
  'whatsapp',
  'voice',
  'lead',
  'support',
  'booking',
  'automation',
  'website',
  'custom',
];

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'px-3 py-1.5 rounded-full border border-teal-500/60 bg-teal-500/10 text-teal-200 text-sm font-semibold'
          : 'px-3 py-1.5 rounded-full border border-border bg-surface2 text-text3 hover:text-text2 text-sm font-medium transition-colors'
      }
    >
      {label}
    </button>
  );
}

function parseNum(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function FilterBar({
  value,
  onChange,
  className,
}: {
  value: MarketplaceFilters;
  onChange: (next: MarketplaceFilters) => void;
  className?: string;
}) {
  const [draft, setDraft] = useState<MarketplaceFilters>(value);
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => setDraft(value), [value]);

  const activeCount = useMemo(() => {
    let c = 0;
    if (draft.categories.length > 0 && draft.categories.length !== ALL_CATEGORIES.length) c++;
    if (typeof draft.priceMin === 'number') c++;
    if (typeof draft.priceMax === 'number') c++;
    if (draft.rating4Plus) c++;
    if (draft.verifiedOnly) c++;
    if (draft.availableNow) c++;
    if (draft.location) c++;
    return c;
  }, [draft]);

  useEffect(() => {
    setHasActive(activeCount > 0);
  }, [activeCount]);

  // Desktop behavior: apply immediately, but debounce 300ms.
  useEffect(() => {
    const t = window.setTimeout(() => onChange(draft), 300);
    return () => window.clearTimeout(t);
  }, [draft, onChange]);

  const toggleCategory = (cat: MarketplaceCategory) => {
    setDraft((d) => {
      const exists = d.categories.includes(cat);
      const nextCats = exists ? d.categories.filter((x) => x !== cat) : [...d.categories, cat];
      return { ...d, categories: nextCats };
    });
  };

  const clear = () => {
    setDraft({
      categories: [],
      priceMin: undefined,
      priceMax: undefined,
      rating4Plus: false,
      verifiedOnly: false,
      availableNow: false,
      location: undefined,
    });
  };

  const chips = [
    { label: 'Under ₹5K', min: undefined, max: 5000 },
    { label: '₹5K-₹10K', min: 5000, max: 10000 },
    { label: '₹10K+', min: 10000, max: undefined },
  ];

  const chipActive = (min?: number, max?: number) => {
    const aMin = typeof draft.priceMin === 'number' ? draft.priceMin : undefined;
    const aMax = typeof draft.priceMax === 'number' ? draft.priceMax : undefined;
    return aMin === min && aMax === max;
  };

  return (
    <aside className={className ?? ''}>
      <div className="w-[260px] max-w-full">
        <div className="rounded-2xl border border-border bg-surface2/40 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold text-text">Filters</div>
            {hasActive ? (
              <button type="button" onClick={clear} className="text-sm text-teal-200 hover:text-teal-100 font-semibold">
                Clear Filters
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="space-y-5">
            <div>
              <div className="text-sm font-semibold text-text mb-2">Categories</div>
              <div className="space-y-2">
                {ALL_CATEGORIES.map((cat) => {
                  const checked = draft.categories.includes(cat);
                  return (
                    <label key={cat} className="flex items-center gap-2 text-sm text-text2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCategory(cat)}
                        className="accent-teal-400"
                      />
                      <span className="truncate">{cat[0].toUpperCase() + cat.slice(1)}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-text mb-2">Price range</div>
              <div className="flex flex-col gap-2">
                <input
                  inputMode="numeric"
                  value={draft.priceMin ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, priceMin: parseNum(e.target.value) }))}
                  placeholder="Min"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none text-text"
                />
                <input
                  inputMode="numeric"
                  value={draft.priceMax ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, priceMax: parseNum(e.target.value) }))}
                  placeholder="Max"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none text-text"
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {chips.map((c) => (
                  <Chip
                    key={c.label}
                    label={c.label}
                    active={chipActive(c.min, c.max)}
                    onClick={() => setDraft((d) => ({ ...d, priceMin: c.min, priceMax: c.max }))}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-text mb-2">Rating</div>
              <label className="flex items-center gap-2 text-sm text-text2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={draft.rating4Plus}
                  onChange={(e) => setDraft((d) => ({ ...d, rating4Plus: e.target.checked }))}
                  className="accent-teal-400"
                />
                <span>4+ Stars</span>
              </label>
            </div>

            <div>
              <div className="text-sm font-semibold text-text mb-2">Availability</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-text2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={draft.verifiedOnly}
                    onChange={(e) => setDraft((d) => ({ ...d, verifiedOnly: e.target.checked }))}
                    className="accent-teal-400"
                  />
                  <span>Verified Only</span>
                </label>

                <label className="flex items-center gap-2 text-sm text-text2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={draft.availableNow}
                    onChange={(e) => setDraft((d) => ({ ...d, availableNow: e.target.checked }))}
                    className="accent-teal-400"
                  />
                  <span>Available Now</span>
                </label>
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold text-text mb-2">Location</div>
              <select
                value={draft.location ?? ''}
                onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value || undefined }))}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none text-text"
              >
                <option value="">Any location</option>
                {['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Kolkata', 'Chennai', 'Pune', 'Chandigarh'].map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

