'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Clock, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Profile, BuilderProfile } from '@/types';
import { RatingStars } from '@/components/ui/rating-stars';
import { useChatStore } from '@/stores/chatStore';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';

interface Props {
  profile: Profile;
  builderProfile: BuilderProfile;
}

export function BuilderCard({ profile, builderProfile }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { openChat } = useChatStore();

  async function handleMessage() {
    if (!user) { router.push('/login'); return; }
    const supabase = createClient();
    const { data: existing } = await supabase.from('conversations').select('id').eq('buyer_id', user.id).eq('builder_id', profile.id).is('agent_id', null).maybeSingle();
    let convId = existing?.id;
    if (!convId) {
      const { data } = await supabase.from('conversations').insert({ buyer_id: user.id, builder_id: profile.id }).select('id').single();
      convId = data?.id;
    }
    if (convId) {
      openChat({
        conversationId: convId,
        participantId: profile.id,
        participantName: profile.full_name,
        participantAvatar: profile.avatar_url,
        isVerified: builderProfile.verification_status === 'verified',
        responseTimeHours: builderProfile.response_time_hours,
        isMinimised: false,
      });
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border hover:border-border2 rounded-xl p-5 transition-all">
      <div className="flex items-start gap-4 mb-4">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full bg-brand/20 flex items-center justify-center text-brand text-xl font-bold">
            {profile.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          {builderProfile.verification_status === 'verified' && (
            <div className="absolute -bottom-1 -right-1 bg-surface rounded-full">
              <BadgeCheck size={16} className="text-blue" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text truncate">{profile.full_name}</h3>
          <p className="text-text3 text-xs line-clamp-2 mt-0.5">{builderProfile.title}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {builderProfile.specialties.slice(0, 3).map((s) => (
          <span key={s} className="bg-surface2 text-text3 px-2 py-0.5 rounded text-xs">{s}</span>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <RatingStars rating={builderProfile.avg_rating || 0} />
        <span className="text-text3 text-xs">{builderProfile.total_deals} deals</span>
      </div>

      <div className="flex items-center justify-between mb-4">
        <span className="text-brand text-sm font-semibold">
          {builderProfile.hourly_rate ? `₹${builderProfile.hourly_rate.toLocaleString('en-IN')}/hr` : 'Project-based'}
        </span>
        <div className="flex items-center gap-1 text-text3 text-xs">
          <Clock size={11} />
          <span>Replies in {builderProfile.response_time_hours}h</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleMessage}
          className="flex-1 bg-surface2 hover:bg-surface3 border border-border text-text rounded-lg px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1">
          <MessageSquare size={13} /> Message
        </button>
        <Link href={`/builder/${profile.id}`}
          className="flex-1 bg-brand hover:bg-brand2 text-white rounded-lg px-3 py-2 text-xs font-medium transition-colors text-center">
          View Profile
        </Link>
      </div>
    </motion.div>
  );
}

export function BuilderCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 animate-pulse space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-surface3 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface3 rounded w-3/4" />
          <div className="h-3 bg-surface3 rounded w-full" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-6 bg-surface3 rounded w-20" />
        <div className="h-6 bg-surface3 rounded w-24" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-surface3 rounded flex-1" />
        <div className="h-8 bg-surface3 rounded flex-1" />
      </div>
    </div>
  );
}
