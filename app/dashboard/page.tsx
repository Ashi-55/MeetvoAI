'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, MessageSquare, LayoutGrid, Sparkles, Shield, Copy, Clock, Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import type { Deal, Conversation } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function formatINR(n: number) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₹${n}`;
  }
}

function getGreeting() {
  const d = new Date();
  // IST = UTC+5:30
  const ist = new Date(d.getTime() + (5 * 60 + 30) * 60 * 1000);
  const h = ist.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(dateStr?: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, builderProfile, isLoading } = useAuth();
  const { openChat } = useChatStore();

  const [loadingStats, setLoadingStats] = useState(true);
  const [activeDeals, setActiveDeals] = useState<Deal[]>([]);
  const [deployedAgents, setDeployedAgents] = useState<any[]>([]);
  const [totalSpent, setTotalSpent] = useState<number>(0);
  const [buildersMessaged, setBuildersMessaged] = useState<number>(0);

  const [loadingDeals, setLoadingDeals] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [recentConversations, setRecentConversations] = useState<Conversation[]>([]);
  const [loadingConvos, setLoadingConvos] = useState(true);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    // role guard: business
    // This app doesn’t have an explicit role field everywhere; we infer from presence of buyer_profiles.
    // If builder_profile is present and verified, assume builder.
    const isBusiness = !builderProfile; // fallback heuristic
    if (!isBusiness) {
      router.push('/dashboard/builder');
      return;
    }
  }, [builderProfile, isLoading, router, user]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      setLoadingStats(true);
      setLoadingDeals(true);
      setLoadingAgents(true);
      setLoadingConvos(true);

      if (!user) return;

      const [dealsRes, agentsRes, spentRes, convRes] = await Promise.all([
        supabase
          .from('deals')
          .select('*, offer_cards(status), orders(status,order_status), builder_profiles(*), builder:profiles!deals_builder_id_fkey(full_name,avatar_url)')
          .eq('buyer_id', user.id)
          .not('status', 'in', ['completed', 'cancelled'])
          .order('created_at', { ascending: false })
          .limit(10),
        supabase.from('deployed_agents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
        supabase.from('deals').select('deal_value,status').eq('buyer_id', user.id),
        supabase
          .from('conversations')
          .select('id, last_message_at, buyer_id, builder_id, buyer:profiles!conversations_buyer_id_fkey(full_name, avatar_url), builder:profiles!conversations_builder_id_fkey(full_name, avatar_url), unread_count:builder_unread')
          .or(`buyer_id.eq.${user.id},builder_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false })
          .limit(5),
      ]);

      if (dealsRes?.data) setActiveDeals(dealsRes.data as Deal[]);
      if (agentsRes?.data) setDeployedAgents(agentsRes.data as any[]);

      if (spentRes?.data) {
        const rows = spentRes.data as any[];
        const spent = rows
          .filter((r) => r.status === 'completed' || r.status === 'released' || r.status === 'in_progress')
          .reduce((sum, r) => sum + (Number(r.deal_value) || 0), 0);
        setTotalSpent(spent);
      }

      if (convRes?.data) {
        setRecentConversations(convRes.data as any);
        setBuildersMessaged((convRes.data as any[]).length);
      }

      setLoadingDeals(false);
      setLoadingAgents(false);
      setLoadingConvos(false);
      setLoadingStats(false);
    }

    load();
  }, [user]);

  async function handleEscrowRelease(dealId: string) {
    if (!dealId) return;
    try {
      const res = await fetch('/api/escrow/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal_id: dealId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Release failed');
      toast.success('Escrow released');
      router.refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Release failed');
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0F1E] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="text-text3 font-semibold text-sm">Dashboard</div>
            <h1 className="text-3xl font-extrabold mt-1">
              {getGreeting()}, {profile?.full_name || user?.email || 'there'} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-teal-500/10 border border-teal-500/30 text-teal-200">Business</Badge>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-[#0B1225] border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/20 flex items-center justify-center">
                <Sparkles size={18} className="text-brand" />
              </div>
              <div>
                <div className="font-bold">Open AI Studio</div>
                <div className="text-xs text-text3">Generate & deploy agents</div>
              </div>
            </div>
            <div className="mt-3">
              <Button className="w-full bg-brand hover:bg-brand2 text-white" onClick={() => router.push('/studio')}>
                Go
              </Button>
            </div>
          </Card>

          <Card className="bg-[#0B1225] border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <LayoutGrid size={18} className="text-teal-200" />
              </div>
              <div>
                <div className="font-bold">Browse Marketplace</div>
                <div className="text-xs text-text3">Pick verified builders</div>
              </div>
            </div>
            <div className="mt-3">
              <Button className="w-full bg-teal-500 hover:bg-teal-600 text-white" onClick={() => router.push('/marketplace')}>
                Browse
              </Button>
            </div>
          </Card>

          <Card className="bg-[#0B1225] border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface2/30 border border-border flex items-center justify-center">
                <MessageSquare size={18} className="text-text3" />
              </div>
              <div>
                <div className="font-bold">Messages</div>
                <div className="text-xs text-text3">Conversations & offers</div>
              </div>
            </div>
            <div className="mt-3">
              <Button className="w-full bg-transparent border border-border text-white hover:bg-surface2" onClick={() => router.push('/messages')}>
                Open
              </Button>
            </div>
          </Card>
        </div>

        {/* STATS ROW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-[#0B1225] border-border p-4">
                <Skeleton className="h-6 w-32 bg-surface2" />
                <div className="mt-3">
                  <Skeleton className="h-10 w-24 bg-surface2" />
                </div>
              </Card>
            ))
          ) : (
            <>
              <Card className="bg-[#0B1225] border-border p-4">
                <div className="text-xs text-text3">Active Deals</div>
                <div className="text-3xl font-extrabold mt-1">{activeDeals.length}</div>
              </Card>
              <Card className="bg-[#0B1225] border-border p-4">
                <div className="text-xs text-text3">Deployed Agents</div>
                <div className="text-3xl font-extrabold mt-1">{deployedAgents.length}</div>
              </Card>
              <Card className="bg-[#0B1225] border-border p-4">
                <div className="text-xs text-text3">Total Spent</div>
                <div className="text-3xl font-extrabold mt-1">{formatINR(totalSpent)}</div>
              </Card>
              <Card className="bg-[#0B1225] border-border p-4">
                <div className="text-xs text-text3">Builders Messaged</div>
                <div className="text-3xl font-extrabold mt-1">{buildersMessaged}</div>
              </Card>
            </>
          )}
        </div>

        {/* ACTIVE DEALS */}
        <section className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-extrabold">Active Deals</h2>
            <Button className="bg-teal-500 hover:bg-teal-600 text-white" onClick={() => router.push('/marketplace')}>
              Browse
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-[#0B1225]">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="text-sm text-text3">Deals that are currently in progress</div>
              <div className="text-sm text-text3">Escrow protected payments</div>
            </div>

            <div className="p-4">
              {loadingDeals ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-5 w-64" />
                      <Skeleton className="h-8 w-40" />
                    </div>
                  ))}
                </div>
              ) : activeDeals.length ? (
                <div className="space-y-4">
                  {activeDeals.map((d: any) => (
                    <div key={d.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border rounded-xl bg-[#0A0F1E]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface2 border border-border flex items-center justify-center text-text3 font-bold">
                          {(d.builder?.full_name || d.builder_profiles?.full_name || 'B')[0]}
                        </div>
                        <div>
                          <div className="font-bold">{d.builder?.full_name || d.builder_profiles?.full_name || 'Builder'}</div>
                          <div className="text-xs text-text3">{timeAgo(d.created_at)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge
                          className={
                            d.status === 'in_progress'
                              ? 'bg-amber/15 border border-amber/30 text-amber'
                              : d.status === 'submitted'
                              ? 'bg-teal-500/10 border border-teal-500/30 text-teal-200'
                              : 'bg-surface2 text-text3'
                          }
                        >
                          {d.status}
                        </Badge>

                        <div className="text-right">
                          <div className="font-extrabold">{formatINR(Number(d.deal_value) || 0)}</div>
                          <div className="text-xs text-text3">Amount</div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        {d.status === 'in_progress' ? (
                          <Button
                            className="bg-teal-500 hover:bg-teal-600 text-white"
                            onClick={() => {
                              // find conversation and open chat (best-effort)
                              // ConversationId prop name differs across ChatSession type; fallback to conversationId-less chat routing.
                              // openChat requires a ChatSession matching its local type. We route to /chat later if needed.
                              router.push('/messages');
                            }}
                          >
                            Open Chat
                          </Button>
                        ) : null}

                        {d.status === 'submitted' ? (
                          <>
                            <Button
                              className="bg-green/15 border border-green/30 text-green hover:bg-green/20"
                              onClick={() => handleEscrowRelease(d.id)}
                            >
                              Approve & Release {formatINR(Number(d.deal_value) || 0)}
                            </Button>
                            <Button
                              className="bg-transparent border border-red-500/30 text-red-200 hover:bg-red-500/10"
                              onClick={() => router.push(`/orders/${d.id}/dispute`)}
                            >
                              Raise Dispute
                            </Button>
                          </>
                        ) : null}

                        {d.status === 'disputed' ? (
                          <div className="text-sm text-amber">Under review by MeetvoAI team</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-lg font-extrabold">No active deals</div>
                  <div className="text-text3 mt-2">When you accept an offer, your deal appears here.</div>
                  <div className="mt-5">
                    <Button className="bg-teal-500 hover:bg-teal-600 text-white" onClick={() => router.push('/marketplace')}>
                      Browse
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* MY DEPLOYED AGENTS */}
        <section className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-extrabold">My Deployed Agents</h2>
            <Button className="bg-brand hover:bg-brand2 text-white" onClick={() => router.push('/studio')}>
              Studio
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-[#0B1225]">
            <div className="p-4 border-b border-border text-sm text-text3">Your live deployments</div>
            <div className="p-4">
              {loadingAgents ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <Skeleton className="h-6 w-56" />
                      <Skeleton className="h-8 w-64" />
                    </div>
                  ))}
                </div>
              ) : deployedAgents.length ? (
                <div className="space-y-3">
                  {deployedAgents.map((a: any) => (
                    <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border border-border rounded-xl bg-[#0A0F1E]">
                      <div>
                        <div className="font-extrabold">{a.name || a.agent_name || 'Agent'}</div>
                        <div className="text-xs text-text3">{a.agent_type || 'business_agent'}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <a href={`https://${a.subdomain}.meetvoai.in`} target="_blank" rel="noreferrer" className="text-teal-200 font-semibold hover:text-teal-100">
                          🟢 Live
                        </a>
                        <Badge className="bg-teal-500/10 border border-teal-500/30 text-teal-200">requests</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-lg font-extrabold">No agents deployed</div>
                  <div className="text-text3 mt-2">Deploy your first agent from Studio.</div>
                  <div className="mt-5">
                    <Button className="bg-brand hover:bg-brand2 text-white" onClick={() => router.push('/studio')}>
                      Studio
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* RECENT CONVERSATIONS */}
        <section>
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-extrabold">Recent Conversations</h2>
            <Link className="text-teal-200 font-semibold hover:text-teal-100" href="/messages">Open all →</Link>
          </div>

          <div className="rounded-2xl border border-border bg-[#0B1225] p-4">
            {loadingConvos ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-5 w-64" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                ))}
              </div>
            ) : recentConversations.length ? (
              <div className="space-y-3">
                {recentConversations.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between gap-3 p-3 border border-border rounded-xl bg-[#0A0F1E]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface2 border border-border flex items-center justify-center text-text3 font-bold">
                        {(c.builder?.full_name || c.builder_id || 'B')[0]}
                      </div>
                      <div>
                        <div className="font-semibold">{c.builder?.full_name || c.builder_id}</div>
                        <div className="text-xs text-text3">Last message {timeAgo(c.last_message_at)}</div>
                      </div>
                    </div>
                    <Button
                      className="bg-teal-500 hover:bg-teal-600 text-white"
                      onClick={() => {
                        // navigate to messages page (chat selection handled there)
                        router.push(`/messages?conversation=${c.id}`);
                      }}
                    >
                      Open Chat →
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-text3">No conversations yet.</div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

