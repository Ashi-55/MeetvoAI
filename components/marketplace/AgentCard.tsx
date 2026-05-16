'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, BadgeCheck, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Agent } from '@/types';
import { RatingStars } from '@/components/ui/rating-stars';
import { useChatStore } from '@/stores/chatStore';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface Props {
  agent: Agent & { profiles?: { full_name: string; avatar_url: string | null }; builder_profiles?: { verification_status: string; avg_rating: number; response_time_hours: number } };
}

export function AgentCard({ agent }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { openChat } = useChatStore();
  const [videoOpen, setVideoOpen] = useState(false);

  const priceLabel = agent.pricing_model === 'monthly' && agent.price_monthly
    ? `from ₹${agent.price_monthly.toLocaleString('en-IN')}/month`
    : agent.pricing_model === 'yearly' && agent.price_yearly
    ? `₹${agent.price_yearly.toLocaleString('en-IN')}/year`
    : agent.pricing_model === 'one_time' && agent.price_one_time
    ? `₹${agent.price_one_time.toLocaleString('en-IN')} one-time`
    : 'Custom pricing';

  async function handleMessage() {
    if (!user) { router.push('/login'); return; }
    const supabase = createClient();
    const { data: existing } = await supabase.from('conversations').select('id').eq('buyer_id', user.id).eq('builder_id', agent.builder_id).eq('agent_id', agent.id).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data } = await supabase.from('conversations').insert({ buyer_id: user.id, builder_id: agent.builder_id, agent_id: agent.id }).select('id').single();
      convId = data?.id;
    }
    if (convId) {
      openChat({
        conversationId: convId,
        participantId: agent.builder_id,
        participantName: agent.profiles?.full_name || 'Builder',
        participantAvatar: agent.profiles?.avatar_url || null,
        isVerified: agent.builder_profiles?.verification_status === 'verified',
        responseTimeHours: agent.builder_profiles?.response_time_hours || 24,
        agentId: agent.id,
        agentName: agent.name,
        isMinimised: false,
      });
    }
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-border hover:border-border2 rounded-xl overflow-hidden transition-all group">
        <div className="relative aspect-video bg-surface3 cursor-pointer" onClick={() => agent.demo_video_url && setVideoOpen(true)}>
          {agent.demo_video_thumbnail ? (
            <img src={agent.demo_video_thumbnail} alt={agent.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text3">
              <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center">
                <span className="text-brand text-xl font-bold">AI</span>
              </div>
            </div>
          )}
          {agent.demo_video_url && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-black/60 border border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play size={20} className="text-white ml-1" />
              </div>
            </div>
          )}
          {agent.is_featured && (
            <span className="absolute top-2 left-2 bg-amber text-black text-xs font-bold px-2 py-0.5 rounded-full">Featured</span>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-text text-sm leading-snug line-clamp-2 mb-2">{agent.name}</h3>

          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-full bg-surface3 flex items-center justify-center text-xs font-bold text-text3 shrink-0">
              {agent.profiles?.full_name?.[0] || 'B'}
            </div>
            <span className="text-text3 text-xs truncate">{agent.profiles?.full_name}</span>
            {agent.builder_profiles?.verification_status === 'verified' && (
              <BadgeCheck size={14} className="text-blue shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-2 mb-3">
            <RatingStars rating={agent.avg_rating || 0} />
            <span className="text-text3 text-xs">({agent.review_count})</span>
          </div>

          <p className="text-brand text-sm font-semibold mb-4">{priceLabel}</p>

          <div className="flex gap-2">
            <button onClick={handleMessage}
              className="flex-1 bg-surface2 hover:bg-surface3 border border-border text-text rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1">
              <MessageSquare size={13} /> Message
            </button>
            <Link href={`/agent/${agent.id}`}
              className="flex-1 bg-brand hover:bg-brand2 text-white rounded-lg px-3 py-2 text-xs font-medium transition-colors text-center">
              View Details
            </Link>
          </div>
        </div>
      </motion.div>

      {videoOpen && agent.demo_video_url && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setVideoOpen(false)}>
          <div className="w-full max-w-2xl aspect-video bg-black rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <video src={agent.demo_video_url} controls autoPlay className="w-full h-full" />
          </div>
        </div>
      )}
    </>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden animate-pulse">
      <div className="aspect-video bg-surface3" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-surface3 rounded w-3/4" />
        <div className="h-3 bg-surface3 rounded w-1/2" />
        <div className="h-3 bg-surface3 rounded w-1/3" />
        <div className="h-4 bg-surface3 rounded w-1/4" />
        <div className="flex gap-2">
          <div className="h-8 bg-surface3 rounded flex-1" />
          <div className="h-8 bg-surface3 rounded flex-1" />
        </div>
      </div>
    </div>
  );
}
