'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatTime } from '@/lib/utils';
import { OfferCard } from '@/components/chat/OfferCard';
import type { Message } from '@/types';

const timelineOptions = [
  { label: '1 day', value: '1' },
  { label: '3 days', value: '3' },
  { label: '1 week', value: '7' },
  { label: '2 weeks', value: '14' },
  { label: '1 month', value: '30' },
];

export default function MessagesChatPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [targetName, setTargetName] = useState('Chat');
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalTimeline, setProposalTimeline] = useState('7');
  const [proposalScope, setProposalScope] = useState('');
  const [proposalSending, setProposalSending] = useState(false);
  const [releaseLoading, setReleaseLoading] = useState(false);
  const [issueReported, setIssueReported] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const targetId = params?.id;
  const isBuilder = profile?.current_mode === 'builder';
  const latestOfferMessage = [...messages].reverse().find((message) => message.message_type === 'offer_card' && message.offer_data);
  const latestOffer = latestOfferMessage?.offer_data;

  const dealStatus = latestOffer?.status === 'accepted' ? 'in_escrow' : latestOffer?.status === 'declined' ? 'declined' : 'negotiating';
  const statusLabel = latestOffer?.status === 'accepted' ? '🔒 In Escrow' : latestOffer?.status === 'declined' ? 'Declined' : 'Negotiating';

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (!targetId) return;

    async function initConversation() {
      setLoading(true);
      const supabase = createClient();
      const query = supabase.from('conversations').select('id').is('agent_id', null);
      if (!user?.id) {
        setLoading(false);
        return;
      }
      const filteredQuery = isBuilder
        ? query.eq('builder_id', user.id).eq('buyer_id', targetId)
        : query.eq('buyer_id', user.id).eq('builder_id', targetId);

      const { data: existing, error: existingError } = await filteredQuery.maybeSingle();
      if (existingError) {
        console.error('Conversation lookup error:', existingError.message);
      }

      let convId = existing?.id;
      if (!convId) {
        const payload = isBuilder
          ? { builder_id: user.id, buyer_id: targetId }
          : { buyer_id: user.id, builder_id: targetId };

        const { data: insertData, error: insertError } = await supabase
          .from('conversations')
          .insert(payload)
          .select('id')
          .single();

        if (insertError) {
          console.error('Failed to create conversation:', insertError.message);
          setLoading(false);
          return;
        }
        convId = insertData?.id || null;
      }

      if (convId) {
        setConversationId(convId);
        loadMessages(convId, supabase);
      }

      const { data: targetProfile } = await supabase.from('profiles').select('full_name').eq('id', targetId).maybeSingle();
      setTargetName(targetProfile?.full_name ?? 'Chat');
      setLoading(false);
    }

    async function loadMessages(convId: string, client: ReturnType<typeof createClient>) {
      const { data } = await client
        .from('messages')
        .select('*, sender:profiles(full_name)')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      setMessages((data || []) as Message[]);
    }

    initConversation();
  }, [user, profile, isLoading, router, targetId, isBuilder]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || sending || !user || !conversationId) return;
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: input.trim(),
        message_type: 'text',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Failed to send message:', error.message);
      setSending(false);
      return;
    }

    if (data) {
      setMessages((prev) => [...prev, data as Message]);
    }

    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);
    setInput('');
    setSending(false);
  }

  async function handleSendProposal() {
    if (!proposalTitle.trim() || !proposalPrice.trim() || !proposalScope.trim() || !proposalTimeline || !user || !conversationId) return;
    const price = parseInt(proposalPrice, 10);
    const deliveryDays = parseInt(proposalTimeline, 10);
    if (!price || deliveryDays <= 0) return;

    setProposalSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: null,
        message_type: 'offer_card',
        offer_data: {
          title: proposalTitle.trim(),
          description: proposalScope.trim(),
          price,
          delivery_days: deliveryDays,
          status: 'pending',
        },
      })
      .select('*')
      .single();

    if (error) {
      console.error('Failed to send proposal:', error.message);
      setProposalSending(false);
      return;
    }

    if (data) {
      setMessages((prev) => [...prev, data as Message]);
    }

    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);
    setProposalTitle('');
    setProposalPrice('');
    setProposalTimeline('7');
    setProposalScope('');
    setProposalSending(false);
  }

  async function handleAcceptProposal() {
    if (!latestOfferMessage || !conversationId || !user || isBuilder) return;

    const offer = latestOfferMessage.offer_data;
    if (!offer || !offer.price) return;

    setProposalSending(true);
    const supabase = createClient();
    const { data: conv } = await supabase.from('conversations').select('buyer_id,builder_id').eq('id', conversationId).single();
    if (!conv) {
      setProposalSending(false);
      return;
    }

    const price = offer.price;
    const platformFee = Math.max(Math.round(price * 0.05), 199);
    const gst = Math.round(platformFee * 0.18);
    const total = price + platformFee + gst;

    const { data: order, error: orderError } = await supabase.from('orders').insert({
      buyer_id: conv.buyer_id,
      builder_id: conv.builder_id,
      conversation_id: conversationId,
      title: offer.title || 'Project Proposal',
      description: offer.description,
      deal_value: price,
      platform_fee: platformFee,
      gst_amount: gst,
      total_amount: total,
      delivery_days: offer.delivery_days,
      order_status: 'pending_payment',
      escrow_status: 'payment_pending',
    }).select('id').single();

    if (orderError || !order) {
      console.error('Failed to create escrow order:', orderError?.message);
      setProposalSending(false);
      return;
    }

    const { data: updatedMessage } = await supabase
      .from('messages')
      .update({ offer_data: { ...offer, status: 'accepted', order_id: order.id } })
      .eq('id', latestOfferMessage.id)
      .select('*')
      .single();

    if (updatedMessage) {
      setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? (updatedMessage as Message) : msg)));
    }

    setProposalSending(false);
    router.push(`/checkout/${order.id}`);
  }

  async function handleDeclineProposal() {
    if (!latestOfferMessage || !conversationId || !user || isBuilder) return;
    const offer = latestOfferMessage.offer_data;
    if (!offer) return;

    const supabase = createClient();
    const { data: updatedMessage } = await supabase
      .from('messages')
      .update({ offer_data: { ...offer, status: 'declined' } })
      .eq('id', latestOfferMessage.id)
      .select('*')
      .single();

    if (updatedMessage) {
      setMessages((prev) => prev.map((msg) => (msg.id === updatedMessage.id ? (updatedMessage as Message) : msg)));
    }
  }

  async function handleReleasePayment() {
    if (!latestOffer?.order_id || !conversationId || !user || isBuilder) return;
    setReleaseLoading(true);
    try {
      const res = await fetch(`/api/orders/${latestOffer.order_id}/approve`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Release failed');
      }
      window.alert('Payment released successfully.');
    } catch (error: any) {
      console.error('Failed to release payment:', error?.message);
      window.alert(`Release failed: ${error?.message || 'Please try again.'}`);
    }
    setReleaseLoading(false);
  }

  async function handleReportIssue() {
    if (!conversationId || !user) return;
    const supabase = createClient();
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: user.id,
      content: 'Issue reported for the current escrow proposal. Support will review and follow up.',
      message_type: 'system',
    });
    setIssueReported(true);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#08080F] px-4 py-6 text-white">
        <div className="max-w-3xl mx-auto rounded-3xl border border-[#1E1B3A] bg-[#100F1C] p-6">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080F] text-white">
      <div className="mx-auto max-w-[1500px] px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex flex-col rounded-3xl border border-[#1E1B3A] bg-[#100F1C] overflow-hidden">
            <div className="border-b border-[#1E1B3A] px-6 py-5">
              <p className="text-sm text-[#9490B5]">Chat with</p>
              <h1 className="text-2xl font-semibold text-white">{targetName}</h1>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {messages.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#1E1B3A] p-10 text-center text-sm text-[#9490B5]">
                  No messages yet. Use the deal panel to create a proposal or send a quick message.
                </div>
              ) : (
                messages.map((message) => {
                  const isMine = message.sender_id === user?.id;
                  if (message.message_type === 'offer_card' && message.offer_data) {
                    return (
                      <OfferCard
                        key={message.id}
                        message={message}
                        isMine={isMine}
                        conversationId={conversationId || ''}
                      />
                    );
                  }

                  return (
                    <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-3xl px-4 py-3 ${isMine ? 'bg-[#ae9bc9] text-[#08080F]' : 'bg-[#100F1C] border border-[#1E1B3A] text-white'}`}>
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        <p className="mt-2 text-[11px] text-[#9490B5]">{formatTime(message.created_at ?? '')}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-[#1E1B3A] bg-[#0A172C] px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="Type a message..."
                  className="min-h-[56px] flex-1 resize-none rounded-3xl border border-[#1E1B3A] bg-[#08080F] px-4 py-3 text-sm text-white outline-none focus:border-[#ae9bc9]"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="inline-flex h-14 items-center justify-center rounded-3xl bg-[#ae9bc9] px-5 text-sm font-semibold text-[#08080F] transition hover:bg-[#6F4EEA] disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-[#1E1B3A] bg-[#100F1C] p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">Project Deal</h2>
                <p className="mt-1 text-sm text-[#9490B5]">Escrow workflow and proposal details</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${dealStatus === 'in_escrow' ? 'bg-[rgba(174, 155, 201, 0.15)] text-[#ae9bc9]' : 'bg-[#1E1B3A] text-[#9490B5]'}`}>
                {statusLabel}
              </span>
            </div>

            {isBuilder ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-white">Project Title</label>
                  <input
                    value={proposalTitle}
                    onChange={(event) => setProposalTitle(event.target.value)}
                    placeholder="Project title"
                    className="mt-2 w-full rounded-2xl border border-[#1E1B3A] bg-[#08080F] px-4 py-3 text-sm text-white outline-none focus:border-[#ae9bc9]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">Price (₹)</label>
                  <input
                    value={proposalPrice}
                    onChange={(event) => setProposalPrice(event.target.value)}
                    type="number"
                    placeholder="Enter amount"
                    className="mt-2 w-full rounded-2xl border border-[#1E1B3A] bg-[#08080F] px-4 py-3 text-sm text-white outline-none focus:border-[#ae9bc9]"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">Timeline</label>
                  <select
                    value={proposalTimeline}
                    onChange={(event) => setProposalTimeline(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#1E1B3A] bg-[#08080F] px-4 py-3 text-sm text-white outline-none focus:border-[#ae9bc9]"
                  >
                    {timelineOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-white">Scope of Work</label>
                  <textarea
                    value={proposalScope}
                    onChange={(event) => setProposalScope(event.target.value)}
                    rows={4}
                    placeholder="What will be delivered"
                    className="mt-2 w-full resize-none rounded-2xl border border-[#1E1B3A] bg-[#08080F] px-4 py-3 text-sm text-white outline-none focus:border-[#ae9bc9]"
                  />
                </div>
                <button
                  onClick={handleSendProposal}
                  disabled={proposalSending}
                  className="w-full rounded-3xl bg-[#A855F7] px-4 py-4 text-sm font-semibold text-white transition disabled:opacity-50"
                >
                  {proposalSending ? 'Sending proposal...' : 'Send Proposal'}
                </button>
              </div>
            ) : latestOffer ? (
              <div className="space-y-4">
                <div className="rounded-3xl border border-[#1E1B3A] bg-[#08080F] p-4">
                  <p className="text-sm font-semibold text-white">Project</p>
                  <p className="mt-2 text-base font-semibold text-white">{latestOffer.title || 'Custom project'}</p>
                  <div className="mt-4 space-y-3 text-sm text-[#9490B5]">
                    <div className="flex justify-between">
                      <span>Price</span>
                      <span className="font-semibold text-white">₹{latestOffer.price?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timeline</span>
                      <span className="font-semibold text-white">{latestOffer.delivery_days} days</span>
                    </div>
                    <div>
                      <span className="font-semibold text-white">Scope</span>
                      <p className="mt-1 text-sm leading-6 text-[#D1D5DB]">{latestOffer.description}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-[rgba(174, 155, 201, 0.15)] border border-[#ae9bc9] p-3 text-[#ae9bc9] text-sm">
                  <p className="font-semibold">🔒 Escrow Protected</p>
                  <p className="mt-2 text-[#9490B5] text-xs">Payment will be held securely. Released to builder only after you approve the delivered work.</p>
                </div>

                {latestOffer.status === 'pending' ? (
                  <div className="space-y-3">
                    <button
                      onClick={handleAcceptProposal}
                      disabled={proposalSending}
                      className="w-full rounded-3xl bg-[#ae9bc9] px-4 py-3 text-sm font-semibold text-[#08080F] transition disabled:opacity-50"
                    >
                      {proposalSending ? 'Processing...' : '✓ Accept & Pay to Escrow'}
                    </button>
                    <button
                      onClick={handleDeclineProposal}
                      className="w-full rounded-3xl border border-[#1E1B3A] bg-transparent px-4 py-3 text-sm font-semibold text-[#9490B5] transition hover:border-[#ae9bc9] hover:text-white"
                    >
                      ✗ Decline
                    </button>
                  </div>
                ) : latestOffer.status === 'accepted' ? (
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-[#1E1B3A] bg-[#08080F] p-4 text-sm text-[#9490B5]">
                      <p className="font-semibold text-[#ae9bc9]">🔒 In Escrow</p>
                      <p className="mt-3 text-base font-semibold text-white">₹{latestOffer.price?.toLocaleString('en-IN')} is held securely</p>
                      <p className="mt-2 text-[#9490B5] text-xs">Release payment when work is delivered and approved.</p>
                    </div>
                    <button
                      onClick={handleReleasePayment}
                      disabled={releaseLoading}
                      className="w-full rounded-3xl bg-[#ae9bc9] px-4 py-3 text-sm font-semibold text-[#08080F] transition disabled:opacity-50"
                    >
                      {releaseLoading ? 'Releasing...' : '✓ Approve & Release Payment'}
                    </button>
                    <button
                      onClick={handleReportIssue}
                      className="w-full rounded-3xl border border-[#EF4444] bg-transparent px-4 py-3 text-sm font-semibold text-[#EF4444] transition hover:bg-[#1F1F28]"
                    >
                      Report Issue
                    </button>
                    {issueReported && <p className="text-xs text-[#9490B5]">Issue reported. Support will follow up shortly.</p>}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-[#1E1B3A] bg-[#08080F] p-4 text-sm text-[#9490B5]">
                    This proposal was declined. Ask the builder to submit a new offer or continue the chat.
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-3xl border border-[#1E1B3A] bg-[#08080F] p-4 text-sm text-[#9490B5]">
                Waiting for a proposal from the builder. Send a quick message to get negotiations started.
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
