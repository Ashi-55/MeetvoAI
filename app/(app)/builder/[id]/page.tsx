'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BadgeCheck, Clock, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import { AgentCard } from '@/components/marketplace/AgentCard';
import { RatingStars } from '@/components/ui/rating-stars';
import type { Profile, BuilderProfile, Agent, Review } from '@/types';

export default function BuilderProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { openChat } = useChatStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [builderProfile, setBuilderProfile] = useState<BuilderProfile | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: p }, { data: bp }, { data: a }, { data: r }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
        supabase.from('builder_profiles').select('*').eq('id', id).maybeSingle(),
        supabase.from('agents').select('*, profiles(full_name, avatar_url), builder_profiles(verification_status, avg_rating, response_time_hours)').eq('builder_id', id).eq('status', 'published'),
        supabase.from('reviews').select('*, reviewer:profiles(full_name)').eq('builder_id', id).order('created_at', { ascending: false }),
      ]);
      setProfile(p as Profile);
      setBuilderProfile(bp as BuilderProfile);
      setAgents((a || []) as unknown as Agent[]);
      setReviews((r || []) as unknown as Review[]);
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleMessage() {
    if (!user) { router.push('/login'); return; }
    const supabase = createClient();
    const { data: existing } = await supabase.from('conversations').select('id').eq('buyer_id', user.id).eq('builder_id', id).is('agent_id', null).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data } = await supabase.from('conversations').insert({ buyer_id: user.id, builder_id: id }).select('id').single();
      convId = data?.id;
    }
    if (convId && profile) {
      openChat({ id: convId, participantId: id, participantName: profile.full_name ?? '', participantAvatar: profile.avatar_url ?? null, isVerified: builderProfile?.verification_status === 'verified', responseTimeHours: builderProfile?.response_time_hours || 24, isMinimised: false });
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-pulse space-y-6">
      <div className="h-40 bg-surface rounded-xl" />
      <div className="h-32 bg-surface rounded-xl" />
    </div>
  );

  if (!profile || !builderProfile) return <div className="text-center py-20 text-text3">Builder not found</div>;

  const initials = ((profile.full_name ?? '').split(' ').map((n) => n[0]).join('') || '').slice(0, 2);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="bg-surface border border-border rounded-2xl p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-brand/20 flex items-center justify-center text-brand text-2xl font-bold">{initials}</div>
            {builderProfile.verification_status === 'verified' && (
              <div className="absolute -bottom-1 -right-1 bg-surface rounded-full p-0.5">
                <BadgeCheck size={18} className="text-blue" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-text">{profile.full_name}</h1>
            <p className="text-text2 mt-1">{builderProfile.title}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <RatingStars rating={builderProfile.avg_rating || 0} size="md" showValue />
              <span className="text-text3 text-sm">{builderProfile.total_deals} deals completed</span>
              <div className="flex items-center gap-1 text-text3 text-sm">
                <Clock size={13} />
                <span>Replies in {builderProfile.response_time_hours}h</span>
              </div>
            </div>
          </div>
          <button onClick={handleMessage}
            className="bg-brand hover:bg-brand2 text-white rounded-xl px-6 py-3 font-semibold flex items-center gap-2 transition-colors whitespace-nowrap">
            <MessageSquare size={18} /> Message
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-5">
          {(builderProfile.specialties || []).slice(0, 4).map((s) => (
            <span key={s} className="bg-brand/10 text-brand border border-brand/20 px-3 py-1 rounded-full text-sm">{s}</span>
          ))}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-text mb-3">About</h2>
        <p className="text-text2 leading-relaxed">{builderProfile.bio}</p>
      </div>

      {(builderProfile.skills || []).length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-text mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {(builderProfile.skills || []).map((s) => <span key={s} className="bg-surface2 border border-border text-text2 px-3 py-1.5 rounded-lg text-sm">{s}</span>)}
          </div>
        </div>
      )}

      {(builderProfile.languages || []).length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="text-lg font-bold text-text mb-4">Languages</h2>
          <div className="flex flex-wrap gap-2">
            {(builderProfile.languages || []).map((l) => <span key={l} className="bg-surface2 border border-border text-text2 px-3 py-1.5 rounded-lg text-sm">{l}</span>)}
          </div>
        </div>
      )}

      {agents.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-text mb-5">My Agents</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((a) => <AgentCard key={a.id} agent={a as Parameters<typeof AgentCard>[0]['agent']} />)}
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-text mb-5">Reviews</h2>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-surface border border-border rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-surface3 flex items-center justify-center text-xs font-bold text-text3">
                    {(r as unknown as Record<string, Record<string, string>>).reviewer?.full_name?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="text-text font-medium text-sm">{(r as unknown as Record<string, Record<string, string>>).reviewer?.full_name}</p>
                    <RatingStars rating={r.rating} />
                  </div>
                </div>
                {r.title && <p className="text-text font-semibold text-sm mb-1">{r.title}</p>}
                {r.content && <p className="text-text2 text-sm">{r.content}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
