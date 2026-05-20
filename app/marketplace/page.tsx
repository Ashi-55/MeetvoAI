'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DashboardActions } from '@/components/dashboard/DashboardActions';
import type { BuyerProfile, BuilderProfile, Profile } from '@/types';

type MarketplaceProfile = {
  profile: Profile;
  builderProfile?: BuilderProfile;
  buyerProfile?: BuyerProfile & {
    needs?: string[];
    description?: string | null;
    budget_range?: string | null;
    location?: string | null;
  };
};

const filterChips = ['All', 'WhatsApp', 'Customer Support', 'Lead Gen', 'Booking', 'E-commerce'];

function BuilderCard({ item, onMessage }: { item: MarketplaceProfile; onMessage: () => void }) {
  const initials = (item.profile.full_name ?? 'A').trim().charAt(0).toUpperCase();
  const specialties = item.builderProfile?.specialties ?? [];
  const builderTitle =
    item.builderProfile?.title ||
    item.builderProfile?.headline ||
    item.builderProfile?.bio ||
    'AI Builder';

  return (
    <div className="bg-[#100F1C] border border-[#1E1B3A] rounded-[14px] overflow-hidden transition-all duration-300 hover:border-[#ae9bc9] hover:shadow-[0_8px_28px_rgba(174,155,201,0.13)] hover:-translate-y-0.5 flex flex-col">
      <div className="h-14 bg-gradient-to-br from-[#0D2137] to-[#1E1B3A]" />
      <div className="px-4 pb-4 pt-0 flex-1 flex flex-col">
        <div className="-mt-7 flex items-start gap-3">
          <div className="relative">
            {item.profile.avatar_url ? (
              <img
                src={item.profile.avatar_url as string}
                alt={item.profile.full_name || 'Builder avatar'}
                className="w-14 h-14 rounded-full border-4 border-[#100F1C] object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#c084fc] to-[#8B5CF6] border-4 border-[#100F1C] flex items-center justify-center text-[23px] font-black text-white shadow-[0_0_22px_rgba(139,92,246,0.42)]">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-white text-[17px] font-extrabold truncate">{item.profile.full_name || 'AI Builder'}</h3>
            <p className="text-[#9490B5] text-[13px] mt-1">{builderTitle}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {specialties.slice(0, 4).map((skill, idx) => (
            <span key={idx} className="bg-[#1E1B3A] text-[#ae9bc9] rounded px-2 py-0.5 text-[11px]">
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[#9490B5] text-[12px]">
          <span>⭐ {item.builderProfile?.avg_rating?.toFixed(1) ?? '0.0'}</span>
          <span>💼 {item.builderProfile?.total_deals ?? 0} deals</span>
          <span>⚡ Replies in {item.builderProfile?.response_time_hours ?? 24}h</span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div className="text-[11px] text-[#9490B5]">Starting from</div>
            <div className="text-[20px] font-bold text-white">{item.builderProfile?.hourly_rate ? `₹${item.builderProfile.hourly_rate}/hr` : '₹2,999'}</div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onMessage}
              className="flex-1 min-w-[92px] rounded-lg border border-[#1E1B3A] bg-transparent px-3 py-1.5 text-[13px] font-semibold text-white transition hover:border-[#ae9bc9] hover:text-[#ae9bc9]"
            >
              Message
            </button>
            <Link
              href={`/builder/${item.profile.id}`}
              className="flex-1 min-w-[92px] whitespace-nowrap rounded-lg bg-[#8B5CF6] px-3 py-1.5 text-center text-[13px] font-bold text-white transition hover:bg-[#7C3AED]"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function BuyerCard({ item, onMessage }: { item: MarketplaceProfile; onMessage: () => void }) {
  const initials = (item.buyerProfile?.business_name || item.profile.full_name || 'B').trim().charAt(0).toUpperCase();
  const needs = item.buyerProfile?.needs ?? [];
  const description = item.buyerProfile?.description || 'Business requires AI automation support.';
  const industry = item.buyerProfile?.industry || 'General business';

  return (
    <div className="bg-[#100F1C] border border-[#1E1B3A] rounded-[14px] overflow-hidden transition-all duration-300 hover:border-[#ae9bc9] hover:shadow-[0_8px_28px_rgba(174,155,201,0.13)] hover:-translate-y-0.5 flex flex-col">
      <div className="h-14 bg-gradient-to-br from-[#0D2137] to-[#1E1B3A]" />
      <div className="px-4 pb-4 pt-0 flex-1 flex flex-col">
        <div className="-mt-7 flex items-start gap-3">
          <div className="relative">
            {item.profile.avatar_url ? (
              <img
                src={item.profile.avatar_url as string}
                alt={item.profile.full_name || 'Business avatar'}
                className="w-14 h-14 rounded-full border-4 border-[#100F1C] object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#c084fc] to-[#8B5CF6] border-4 border-[#100F1C] flex items-center justify-center text-[23px] font-black text-white shadow-[0_0_22px_rgba(139,92,246,0.42)]">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="text-white text-[17px] font-extrabold truncate">{item.buyerProfile?.business_name || item.profile.full_name || 'Business Owner'}</h3>
            <p className="text-[#9490B5] text-[13px] mt-1">{industry}</p>
          </div>
        </div>

        <p className="mt-3 text-sm text-[#9490B5] line-clamp-2">{description}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {needs.slice(0, 4).map((need, idx) => (
            <span key={idx} className="bg-[#1E1B3A] text-[#ae9bc9] rounded px-2 py-0.5 text-[11px]">
              {need}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[#9490B5] text-[12px]">
          <span>📍 {item.buyerProfile?.location || 'Remote / India'}</span>
          <span>💼 {needs.length} needs</span>
          <span>💰 {item.buyerProfile?.budget_range || 'Budget not set'}</span>
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="text-[11px] text-[#9490B5]">Contact business</div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onMessage}
              className="flex-1 min-w-[92px] rounded-lg border border-[#1E1B3A] bg-transparent px-3 py-1.5 text-[13px] font-semibold text-white transition hover:border-[#ae9bc9] hover:text-[#ae9bc9]"
            >
              Message
            </button>
            <Link
              href={`/buyer/${item.profile.id}`}
              className="flex-1 min-w-[92px] whitespace-nowrap rounded-lg bg-[#8B5CF6] px-3 py-1.5 text-center text-[13px] font-bold text-white transition hover:bg-[#7C3AED]"
            >
              View Business
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const router = useRouter();
  const { profile, user, isLoading } = useAuth();
  const [builders, setBuilders] = useState<MarketplaceProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeChip, setActiveChip] = useState('All');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [isLoading, user, router]);
  const pageSize = 6;

  const isBuilder = profile?.current_mode === 'builder';

  async function handleMessage(item: MarketplaceProfile) {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!item.profile.id) {
      console.error('Cannot message user: missing profile id');
      return;
    }

    const supabase = createClient();
    const buyerId = isBuilder ? item.profile.id : user.id;
    const builderId = isBuilder ? user.id : item.profile.id;

    const { data: existing, error: existingError } = await supabase
      .from('conversations')
      .select('id')
      .eq('buyer_id', buyerId)
      .eq('builder_id', builderId)
      .is('agent_id', null)
      .maybeSingle();

    let conversationId = existing?.id as string | undefined;
    if (!conversationId && existingError?.message?.includes('buyer_id')) {
      const { data: legacyExisting } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', buyerId)
        .eq('builder_id', builderId)
        .is('agent_id', null)
        .maybeSingle();
      conversationId = legacyExisting?.id as string | undefined;
    }

    if (!conversationId) {
      const lastMessageAt = new Date().toISOString();
      const attempts = [
        { buyer_id: buyerId, business_id: buyerId, builder_id: builderId, last_message_at: lastMessageAt },
        { buyer_id: buyerId, builder_id: builderId, last_message_at: lastMessageAt },
        { business_id: buyerId, builder_id: builderId, last_message_at: lastMessageAt },
      ];

      let lastError = '';
      for (const payload of attempts) {
        const { data, error } = await supabase
          .from('conversations')
          .insert(payload)
          .select('id')
          .single();

        if (data?.id) {
          conversationId = data.id as string;
          break;
        }
        lastError = error?.message || lastError;
      }

      if (!conversationId) {
        console.error('Failed to create conversation:', lastError);
        toast.error('Could not open chat. Please try again.');
        return;
      }
    }

    if (conversationId) router.push(`/messages?conversation=${encodeURIComponent(conversationId)}`);
  }

  useEffect(() => {
    if (!profile) return;

    async function fetchMarketplace() {
      setLoading(true);
      const supabase = createClient();
      const query = supabase.from('profiles').select(
        isBuilder
          ? 'id, full_name, avatar_url, buyer_profiles(*)'
          : 'id, full_name, avatar_url, builder_profiles(*)'
      );
      const { data, error } = await query.eq('current_mode', isBuilder ? 'buyer' : 'builder').order('full_name', { ascending: true });

      if (error) {
        console.error('Marketplace load failed:', error.message);
        setBuilders([]);
        setLoading(false);
        return;
      }

      setBuilders(
        (data ?? []).map((item: any) => ({
          profile: {
            id: item.id,
            full_name: item.full_name,
            avatar_url: item.avatar_url,
          },
          builderProfile: item.builder_profiles?.[0] ?? undefined,
          buyerProfile: item.buyer_profiles?.[0] ?? undefined,
        }))
      );
      setLoading(false);
    }

    fetchMarketplace();
  }, [profile, isBuilder]);

  useEffect(() => {
    setPage(1);
  }, [search, activeChip]);

  const filteredBuilders = useMemo(() => {
    return builders.filter((item) => {
      const query = search.trim().toLowerCase();
      const title = isBuilder
        ? (item.buyerProfile?.business_name || item.profile.full_name || '').toLowerCase()
        : (item.profile.full_name || '').toLowerCase();
      const tags = isBuilder
        ? (item.buyerProfile?.needs ?? []).join(' ').toLowerCase()
        : (item.builderProfile?.specialties ?? []).join(' ').toLowerCase();
      const name = (item.profile.full_name ?? '').toLowerCase();

      if (query && !name.includes(query) && !title.includes(query) && !tags.includes(query)) return false;
      if (activeChip !== 'All' && !tags.includes(activeChip.toLowerCase())) return false;
      return true;
    });
  }, [builders, search, activeChip, isBuilder]);

  const pageCount = Math.max(1, Math.ceil(filteredBuilders.length / pageSize));
  const paginatedBuilders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBuilders.slice(start, start + pageSize);
  }, [filteredBuilders, page]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <header className="sticky top-0 z-50 border-b border-[#1E1B3A] bg-[#08080F]/95 backdrop-blur-xl">
        <div className="relative mx-auto flex h-16 max-w-7xl items-center gap-5 px-4 lg:px-8">
          <Link href="/" className="text-lg font-black tracking-[-0.03em] text-white">
            Meetvo<span className="text-[#ae9bc9]">AI</span>
          </Link>
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border border-[#1E1B3A] bg-[#100F1C] p-1 md:flex">
            {[
              ['Dashboard', '/dashboard'],
              ['Marketplace', '/marketplace'],
              ['Studio', '/studio'],
              ['Pricing', '/pricing'],
            ].map(([label, href]) => (
              <Link
                key={href}
                href={href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${href === '/marketplace' ? 'bg-[#ae9bc9] text-[#08080F]' : 'text-[#9490B5] hover:bg-[#1E1B3A] hover:text-white'} ${href === '/studio' ? 'ai-studio-nav-link' : ''}`}
              >
                <span>{label}</span>
                {href === '/studio' && <span className="studio-new-badge">NEW</span>}
              </Link>
            ))}
          </nav>
          <div className="ml-auto">
            <DashboardActions />
          </div>
        </div>
      </header>

      <main className="px-4 py-8 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#1E1B3A] bg-[#100F1C] px-4 py-2 text-sm font-semibold text-[#9490B5] transition hover:border-[#ae9bc9] hover:text-white"
            >
              <ArrowLeft size={16} />
              Back
            </button>
            <p className="text-xs uppercase tracking-[0.28em] text-[#9490B5]">Marketplace</p>
            <h1 className="mt-3 text-[30px] font-extrabold text-white">
              {isBuilder ? 'Browse Business Requirements' : 'Find Trusted AI Builders'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-[#9490B5]">
              {isBuilder
                ? 'Browse business owners with AI requirements and start chatting with their team.'
                : 'Connect with expert AI builders. Escrow protected payments.'}
            </p>

          <div className="mt-6 flex flex-col gap-4">
            <div className="relative max-w-[600px] w-full">
              <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[#9490B5]">
                <Search size={18} />
              </div>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={isBuilder ? 'Search businesses, needs, industries...' : 'Search builders, skills, agents...'}
                className="w-full rounded-full border border-[#1E1B3A] bg-[#100F1C] py-3 pl-12 pr-6 text-sm text-white outline-none placeholder:text-[#9490B5]"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {filterChips.map((chip) => {
                const isActive = chip === activeChip;
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setActiveChip(chip)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-[#ae9bc9] text-white' : 'bg-[#100F1C] border border-[#1E1B3A] text-[#9490B5]'}`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#1E1B3A] bg-[#0B0A13] p-4 sm:p-5">
          {loading ? (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-64 rounded-[16px] bg-[#08080F] animate-pulse" />
              ))}
            </div>
          ) : filteredBuilders.length === 0 ? (
            <div className="py-20 text-center text-[#4B5563]">
              <div className="mb-4 flex items-center justify-center">
                <Users size={48} />
              </div>
              <h3 className="text-xl font-semibold text-white">
                {isBuilder ? 'No business requirements found' : 'No builders found'}
              </h3>
              <p className="mt-2">Try a different filter</p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
                {paginatedBuilders.map((item) => (
                  isBuilder ? <BuyerCard key={item.profile.id} item={item} onMessage={() => handleMessage(item)} /> : <BuilderCard key={item.profile.id} item={item} onMessage={() => handleMessage(item)} />
                ))}
              </div>
              <div className="mt-6 flex flex-col gap-3 border-t border-[#1E1B3A] pt-6 text-sm text-[#9490B5] sm:flex-row sm:items-center sm:justify-between">
                <div>
                  Showing {paginatedBuilders.length} of {filteredBuilders.length} {isBuilder ? 'business listings' : 'builders'}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="rounded-full border border-[#1E1B3A] bg-[#100F1C] px-4 py-2 text-sm font-medium text-white transition hover:border-[#ae9bc9] hover:text-[#ae9bc9] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Back
                  </button>
                  <span>
                    Page {page} of {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                    disabled={page === pageCount}
                    className="rounded-full border border-[#1E1B3A] bg-[#100F1C] px-4 py-2 text-sm font-medium text-white transition hover:border-[#ae9bc9] hover:text-[#ae9bc9] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </main>
    </div>
  );
}

