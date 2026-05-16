'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BadgeCheck, Clock, MessageSquare, Star, Play, Package } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import { RatingStars } from '@/components/ui/rating-stars';
import type { Agent, Review, BuilderProfile, Profile } from '@/types';

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { openChat } = useChatStore();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [builder, setBuilder] = useState<Profile | null>(null);
  const [builderProfile, setBuilderProfile] = useState<BuilderProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: a }, { data: r }] = await Promise.all([
        supabase.from('agents').select('*').eq('id', id).maybeSingle(),
        supabase.from('reviews').select('*, reviewer:profiles(full_name, avatar_url)').eq('agent_id', id).order('created_at', { ascending: false }),
      ]);
      if (!a) { router.push('/'); return; }
      setAgent(a as Agent);
      setReviews((r || []) as unknown as Review[]);

      const [{ data: bp }, { data: bl }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', a.builder_id).maybeSingle(),
        supabase.from('builder_profiles').select('*').eq('id', a.builder_id).maybeSingle(),
      ]);
      setBuilder(bp as Profile);
      setBuilderProfile(bl as BuilderProfile);
      setLoading(false);

      await supabase.from('agents').update({ views: a.views + 1 }).eq('id', id);
    }
    load();
  }, [id]);

  async function handleMessage() {
    if (!user) { router.push('/login'); return; }
    if (!agent) return;
    const supabase = createClient();
    const { data: existing } = await supabase.from('conversations').select('id').eq('buyer_id', user.id).eq('builder_id', agent.builder_id).eq('agent_id', id).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data } = await supabase.from('conversations').insert({ buyer_id: user.id, builder_id: agent.builder_id, agent_id: id }).select('id').single();
      convId = data?.id;
    }
    if (convId && builder) {
      openChat({ conversationId: convId, participantId: agent.builder_id, participantName: builder.full_name, participantAvatar: builder.avatar_url, isVerified: builderProfile?.verification_status === 'verified', responseTimeHours: builderProfile?.response_time_hours || 24, agentId: id, agentName: agent.name, isMinimised: false } as any);
    }
  }

  async function handleBuyNow() {
    if (!user) { router.push('/login'); return; }
    if (!agent || !agent.price_monthly && !agent.price_one_time && !agent.price_yearly) return;
    const price = agent.price_monthly || agent.price_one_time || agent.price_yearly || 0;
    const { calculatePlatformFee } = await import('@/lib/fees');
    const { platformFee, gst, total } = calculatePlatformFee(price);
    const supabase = createClient();
    const { data: order } = await supabase.from('orders').insert({
      buyer_id: user.id,
      builder_id: agent.builder_id,
      agent_id: agent.id,
      title: agent.name,
      description: agent.description,
      deal_value: price,
      platform_fee: platformFee,
      gst_amount: gst,
      total_amount: total,
      delivery_days: agent.setup_time_days,
      order_status: 'pending_payment',
    }).select('id').single();
    if (order) router.push(`/checkout/${order.id}`);
  }

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video bg-surface rounded-xl" />
          <div className="h-8 bg-surface rounded w-3/4" />
          <div className="h-4 bg-surface rounded w-full" />
        </div>
        <div className="h-64 bg-surface rounded-xl" />
      </div>
    </div>
  );

  if (!agent) return null;

  const priceLabel = agent.pricing_model === 'monthly' && agent.price_monthly
    ? `₹${agent.price_monthly.toLocaleString('en-IN')}/month`
    : agent.pricing_model === 'yearly' && agent.price_yearly
    ? `₹${agent.price_yearly.toLocaleString('en-IN')}/year`
    : agent.pricing_model === 'one_time' && agent.price_one_time
    ? `₹${agent.price_one_time.toLocaleString('en-IN')} one-time`
    : 'Custom pricing';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {agent.demo_video_url ? (
            <div className="relative aspect-video bg-surface3 rounded-xl overflow-hidden cursor-pointer group" onClick={() => setVideoOpen(true)}>
              {agent.demo_video_thumbnail && <img src={agent.demo_video_thumbnail} alt={agent.name} className="w-full h-full object-cover" />}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/60 border-2 border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play size={28} className="text-white ml-1" />
                </div>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-surface rounded-xl border border-border flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-xl bg-brand/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-brand text-2xl font-bold">AI</span>
                </div>
                <p className="text-text3 text-sm">No demo video</p>
              </div>
            </div>
          )}

          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="bg-brand/20 text-brand px-3 py-1 rounded-full text-sm">{agent.category}</span>
              {agent.integrations?.slice(0, 3).map((i) => <span key={i} className="bg-surface2 text-text3 px-3 py-1 rounded-full text-sm">{i}</span>)}
            </div>
            <h1 className="text-3xl font-bold text-text mb-3">{agent.name}</h1>
            <div className="flex items-center gap-4 mb-4">
              <RatingStars rating={agent.avg_rating || 0} size="md" showValue />
              <span className="text-text3 text-sm">({agent.review_count} reviews)</span>
              <span className="text-text3 text-sm">{agent.orders} orders</span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-text mb-3">About this agent</h2>
            <p className="text-text2 leading-relaxed">{agent.description}</p>
          </div>

          {agent.use_cases && agent.use_cases.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-text mb-3">What it does</h2>
              <ol className="space-y-2">
                {agent.use_cases.map((uc, i) => (
                  <li key={i} className="flex gap-3 text-text2">
                    <span className="text-brand font-bold shrink-0">{i + 1}.</span>
                    <span>{uc}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {agent.features && agent.features.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-text mb-3">Features</h2>
              <div className="flex flex-wrap gap-2">
                {agent.features.map((f) => (
                  <span key={f} className="bg-surface2 border border-border text-text2 px-3 py-1.5 rounded-lg text-sm">{f}</span>
                ))}
              </div>
            </div>
          )}

          {agent.integrations && agent.integrations.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-text mb-3">Integrations</h2>
              <div className="flex flex-wrap gap-2">
                {agent.integrations.map((i) => (
                  <span key={i} className="bg-surface2 border border-border text-text2 px-3 py-1.5 rounded-lg text-sm">{i}</span>
                ))}
              </div>
            </div>
          )}

          {agent.languages_supported && agent.languages_supported.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-text mb-3">Languages Supported</h2>
              <div className="flex flex-wrap gap-2">
                {(agent.languages_supported || []).map((l) => (
                  <span key={l} className="bg-surface2 border border-border text-text2 px-3 py-1.5 rounded-lg text-sm">{l}</span>
                ))}
              </div>
            </div>
          )}

          {reviews.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-text mb-4">Reviews</h2>
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="bg-surface border border-border rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-surface3 flex items-center justify-center text-text3 text-sm font-bold">
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

          {builder && builderProfile && (
            <div>
              <h2 className="text-lg font-bold text-text mb-4">About the builder</h2>
              <div className="bg-surface border border-border rounded-xl p-5 flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-brand/20 flex items-center justify-center text-brand text-xl font-bold shrink-0">
                  {((builder.full_name ?? '').split(' ').map((n) => n[0]).join('') || '').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-text">{builder.full_name ?? 'Builder'}</h3>
                    {builderProfile.verification_status === 'verified' && <BadgeCheck size={16} className="text-blue" />}
                  </div>
                  <p className="text-text3 text-sm mb-2">{builderProfile.title}</p>
                  <RatingStars rating={builderProfile.avg_rating || 0} showValue />
                </div>
                <Link href={`/builder/${agent.builder_id}`} className="bg-surface2 hover:bg-surface3 border border-border text-text text-sm px-4 py-2 rounded-lg font-medium transition-colors">
                  View Profile
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20">
            <div className="bg-surface border border-border rounded-xl p-5 space-y-4">
              <div>
                <p className="text-3xl font-bold text-text">{priceLabel}</p>
                <p className="text-text3 text-sm">Setup time: {agent.setup_time_days} days</p>
              </div>

              <div className="space-y-2">
                <button onClick={handleBuyNow}
                  className="w-full bg-brand hover:bg-brand2 text-white rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2">
                  <Package size={18} /> Buy Now
                </button>
                <button onClick={handleMessage}
                  className="w-full bg-surface2 hover:bg-surface3 border border-border text-text rounded-xl py-3 font-semibold transition-colors flex items-center justify-center gap-2">
                  <MessageSquare size={18} /> Message Builder
                </button>
              </div>

              {builder && (
                <div className="pt-2 border-t border-border flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand text-sm font-bold">
                    {((builder.full_name ?? '').split(' ').map((n) => n[0]).join('') || '').slice(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-text text-sm font-semibold">{builder.full_name ?? 'Builder'}</p>
                      {builderProfile?.verification_status === 'verified' && <BadgeCheck size={13} className="text-blue" />}
                    </div>
                    {builderProfile && (
                      <div className="flex items-center gap-1 text-text3 text-xs">
                        <Clock size={10} />
                        <span>Replies in {builderProfile.response_time_hours}h</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {videoOpen && agent.demo_video_url && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setVideoOpen(false)}>
          <div className="w-full max-w-3xl aspect-video bg-black rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <video src={agent.demo_video_url} controls autoPlay className="w-full h-full" />
          </div>
        </div>
      )}
    </div>
  );
}
