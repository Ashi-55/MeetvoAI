'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Briefcase, Globe, MapPin, MessageSquare, ArrowLeft, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { BuyerProfile, Profile } from '@/types';

export default function BuyerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    async function loadProfile() {
      const supabase = createClient();
      const [{ data: p }, { data: bp }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
        supabase.from('buyer_profiles').select('*').eq('id', id).maybeSingle(),
      ]);

      setProfile(p as Profile | null);
      setBuyerProfile(bp as BuyerProfile | null);
      setLoading(false);
    }

    loadProfile();
  }, [id]);

  function handleMessage() {
    if (!user) {
      router.push('/login');
      return;
    }

    if (id) router.push(`/messages/${id}`);
  }

  if (loading || isLoading) {
    return (
      <main className="min-h-screen bg-[#08080F] px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl space-y-6 animate-pulse">
          <div className="h-20 rounded-[28px] bg-[#100F1C]" />
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="h-[420px] rounded-[28px] bg-[#100F1C]" />
            <div className="space-y-4">
              <div className="h-12 rounded-[20px] bg-[#100F1C]" />
              <div className="h-80 rounded-[20px] bg-[#100F1C]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!profile || !buyerProfile) {
    return (
      <main className="min-h-screen bg-[#08080F] px-4 py-8 text-white">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-[#1E1B3A] bg-[#100F1C] p-10 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">Business Profile</p>
          <h1 className="mt-4 text-3xl font-semibold">Business not found</h1>
          <p className="mt-3 text-sm text-[#9490B5]">This business profile may have been removed or the link is incorrect.</p>
          <div className="mt-8 flex justify-center">
            <Link href="/marketplace" className="rounded-full bg-[#ae9bc9] px-6 py-3 text-sm font-semibold text-[#08080F] transition hover:bg-[#00B4D8]">
              Back to Marketplace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const initials = (buyerProfile.business_name || profile.full_name || 'B').trim().slice(0, 2).toUpperCase();
  const businessName = buyerProfile.business_name || profile.full_name || 'Business';
  const industry = buyerProfile.industry || 'General business';
  const location = buyerProfile.location || 'Remote / India';
  const budget = buyerProfile.budget_range || 'Flexible budget';
  const needs = buyerProfile.needs ?? [];
  const description = buyerProfile.description || 'This business is looking for trusted builders to solve their automation needs.';

  return (
    <main className="min-h-screen bg-[#08080F] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-full border border-[#1E1B3A] bg-[#100F1C] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#ae9bc9] hover:text-[#ae9bc9]"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <Link href="/marketplace" className="text-sm text-[#9490B5] transition hover:text-white">
            Browse more businesses
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="rounded-[28px] border border-[#1E1B3A] bg-[#100F1C] p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#ae9bc9] text-4xl font-bold text-[#08080F]">
                {initials}
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">Business Profile</p>
                <h1 className="mt-2 text-3xl font-semibold text-white">{businessName}</h1>
              </div>
            </div>

            <div className="space-y-4 text-sm text-[#9490B5]">
              <div className="flex items-center gap-2">
                <Briefcase size={16} />
                <span>{industry}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{location}</span>
              </div>
              {buyerProfile.website && (
                <div className="flex items-center gap-2">
                  <Globe size={16} />
                  <Link href={buyerProfile.website} target="_blank" rel="noreferrer" className="text-[#ae9bc9] transition hover:text-[#7ADECD]">
                    {buyerProfile.website}
                    <ExternalLink size={14} className="ml-1 inline-block" />
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-[#9490B5]">Budget range:</span>
                <span className="text-white">{budget}</span>
              </div>
            </div>

            <div className="mt-8 rounded-[24px] bg-[#0B1628] p-6">
              <h2 className="text-lg font-semibold text-white">Need summary</h2>
              <p className="mt-3 text-sm leading-7 text-[#D1D5DB]">{description}</p>
            </div>

            <div className="mt-6 rounded-[24px] border border-[#1E1B3A] bg-[#0B1628] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-[#9490B5]">Approach business</p>
                  <p className="mt-2 text-sm text-[#D1D5DB]">Start a conversation with the buyer and propose your services.</p>
                </div>
                <button
                  type="button"
                  onClick={handleMessage}
                  className="inline-flex items-center gap-2 rounded-full bg-[#ae9bc9] px-5 py-3 text-sm font-semibold text-[#08080F] transition hover:bg-[#6F4EEA]"
                >
                  <MessageSquare size={16} /> Message business
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-[#1E1B3A] bg-[#100F1C] p-8">
              <h2 className="text-xl font-semibold text-white">Business requirements</h2>
              <p className="mt-3 text-sm text-[#9490B5]">These are the key areas the buyer is looking to solve.</p>
              <div className="mt-6 grid gap-3">
                {needs.length > 0 ? (
                  needs.map((need, idx) => (
                    <div key={idx} className="rounded-2xl border border-[#1E1B3A] bg-[#0A172C] px-4 py-3 text-sm text-[#D1D5DB]">
                      {need}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-[#9490B5]">No specific needs listed yet.</p>
                )}
              </div>
            </section>

            {buyerProfile.description && (
              <section className="rounded-[28px] border border-[#1E1B3A] bg-[#100F1C] p-8">
                <h2 className="text-xl font-semibold text-white">About the project</h2>
                <p className="mt-3 text-sm leading-7 text-[#D1D5DB]">{buyerProfile.description}</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
