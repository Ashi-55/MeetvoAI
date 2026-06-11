'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BadgeCheck, Send, TriangleAlert as AlertTriangle, MessageSquare } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { detectExternalPayment, formatDate, formatTime, timeAgo } from '@/lib/utils';
import { OfferCard } from '@/components/chat/OfferCard';
import type { Conversation, Message } from '@/types';

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [paymentWarning, setPaymentWarning] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerDesc, setOfferDesc] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDays, setOfferDays] = useState('');
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!user) return;
    loadConversations();
    const channel = supabase
      .channel('conversations-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadConversations())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!user || conversations.length === 0) return;
    const conversationId = searchParams.get('conversation');
    if (!conversationId) return;
    const match = conversations.find((conv) => conv.id === conversationId);
    if (match) setSelected(match);
  }, [conversations, searchParams, user]);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);

    const channel = supabase
      .channel(`messages-${selected.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selected.id}` },
        (payload: { new: Record<string, unknown> }) => {
          const incoming = payload.new as unknown as Message;
          setMessages((prev) => prev.some((msg) => msg.id === incoming.id) ? prev : [...prev, incoming]);
          if (detectExternalPayment(incoming.content || '')) {
            setPaymentWarning(true);
          }
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selected.id}` },
        (payload: { new: Record<string, unknown> }) => {
          const updated = payload.new as unknown as Message;
          setMessages((prev) => prev.map((msg) => msg.id === updated.id ? updated : msg));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selected, supabase]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadConversations() {
    const { data, error } = await supabase
      .from('conversations')
      .select('*, buyer:profiles!conversations_buyer_id_fkey(full_name, avatar_url), builder:profiles!conversations_builder_id_fkey(full_name, avatar_url), builder_profile:builder_profiles(*), agent:agents(name)')
      .or(`buyer_id.eq.${user!.id},builder_id.eq.${user!.id}`)
      .order('last_message_at', { ascending: false });

    if (!error) {
      setConversations((data || []) as unknown as Conversation[]);
      return;
    }

    const { data: legacyData, error: legacyError } = await supabase
      .from('conversations')
      .select('*, business:profiles!conversations_business_id_fkey(full_name, avatar_url), builder:profiles!conversations_builder_id_fkey(full_name, avatar_url), builder_profile:builder_profiles(*), agent:agents(name)')
      .or(`business_id.eq.${user!.id},builder_id.eq.${user!.id}`)
      .order('last_message_at', { ascending: false });

    if (legacyError) {
      console.error('Failed to load conversations:', error.message, legacyError.message);
      setConversations([]);
      return;
    }

    setConversations((legacyData || []).map((conv: any) => ({
      ...conv,
      buyer_id: conv.buyer_id || conv.business_id,
      buyer: conv.buyer || conv.business,
    })) as unknown as Conversation[]);
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:profiles(full_name, avatar_url)')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
      .limit(200);

    setMessages((data || []) as unknown as Message[]);
    await supabase.from('messages').update({ is_read: true }).eq('conversation_id', convId).neq('sender_id', user!.id);
  }

  async function sendMessage(content: string) {
    if (!content.trim() || !selected || !user) return;
    setSending(true);
    if (detectExternalPayment(content)) setPaymentWarning(true);

    const { data, error } = await supabase.from('messages').insert({
      conversation_id: selected.id,
      sender_id: user.id,
      content: content.trim(),
      message_type: 'text',
      contains_external_payment: detectExternalPayment(content),
    }).select('*').single();

    if (error) {
      console.error('Failed to send message:', error.message);
      setSending(false);
      return;
    }

    if (data) {
      setMessages((prev) => prev.some((msg) => msg.id === data.id) ? prev : [...prev, data as Message]);
    }

    const { error: convError } = await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', selected.id);
    if (convError) {
      console.error('Failed to update conversation timestamp:', convError.message);
    }

    setInput('');
    setSending(false);
  }

  async function sendOffer() {
    if (!user || !selected || !offerDesc.trim() || !offerPrice.trim() || !offerDays.trim()) return;
    setSending(true);
    const price = parseInt(offerPrice, 10);
    const { data, error } = await supabase.from('messages').insert({
      conversation_id: selected.id,
      sender_id: user.id,
      content: null,
      message_type: 'offer_card',
      offer_data: {
        description: offerDesc,
        price,
        delivery_days: parseInt(offerDays, 10),
        status: 'pending',
      },
    }).select('*').single();

    if (error) {
      console.error('Failed to send offer message:', error.message);
      setSending(false);
      return;
    }

    if (data) {
      setMessages((prev) => prev.some((msg) => msg.id === data.id) ? prev : [...prev, data as Message]);
    }

    setShowOfferForm(false);
    setOfferDesc('');
    setOfferPrice('');
    setOfferDays('');
    setSending(false);
  }

  const filteredConversations = conversations.filter((conv) => {
    const other = conv.buyer_id === user?.id ? (conv as any).builder : (conv as any).buyer;
    return !search || other?.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  let prevDate = '';

  if (!user) {
    return (
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-page px-4">
        <div className="w-full max-w-md rounded-3xl border border-[#1B2540] bg-[#131A2A] p-10 text-center">
          <p className="text-5xl"><MessageSquare size={48} color="#1B2540" /></p>
          <h2 className="mt-6 text-2xl font-semibold text-white">No conversations yet</h2>
          <p className="mt-3 text-sm text-[#A8B3CF]">Browse the marketplace to message a builder and start your AI journey.</p>
          <Link href="/marketplace" className="mt-8 inline-flex rounded-full bg-[#00C2A8] px-6 py-3 text-sm font-semibold text-[#0B1020] transition hover:bg-[#4B4EE8]">Browse Marketplace ?</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-page text-white">
      <aside className="w-full max-w-[280px] shrink-0 border-r border-[#1B2540] bg-[#131A2A]">
        <div className="border-b border-[#1B2540] px-4 py-4">
          <h2 className="text-lg font-semibold text-white">Messages</h2>
          <p className="mt-1 text-sm text-[#A8B3CF]">Recent conversations</p>
        </div>
        <div className="border-b border-[#1B2540] px-4 py-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations"
            className="w-full rounded-2xl border border-[#1B2540] bg-[#0B1020] px-3 py-2 text-sm text-white outline-none focus:border-[#00C2A8]"
          />
        </div>
        <div className="max-h-[calc(100vh-64px-116px)] overflow-y-auto px-2 py-2">
          {filteredConversations.length > 0 ? filteredConversations.map((conv) => {
            const isBuyer = conv.buyer_id === user.id;
            const other = isBuyer ? (conv as any).builder : (conv as any).buyer;
            const unread = isBuyer ? (conv as any).buyer_unread ?? 0 : (conv as any).builder_unread ?? 0;
            return (
              <button
                key={conv.id}
                onClick={() => { setSelected(conv); setPaymentWarning(false); }}
                className={`w-full rounded-3xl px-3 py-3 text-left transition ${selected?.id === conv.id ? 'bg-[#111827] border-l-4 border-[#00C2A8]' : 'hover:bg-[#1B2540]'}`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#111827] text-base font-bold text-[#00C2A8]">
                    {other?.full_name?.[0] || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">{other?.full_name || 'Unknown'}</p>
                      <span className="text-xs text-[#A8B3CF]">{timeAgo(conv.last_message_at ?? '')}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-[#A8B3CF]">{(conv as any).agent?.name || (conv as any).last_message || 'No messages yet'}</p>
                  </div>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red text-[10px] font-semibold text-white">{unread > 9 ? '9+' : unread}</span>
                  )}
                </div>
              </button>
            );
          }) : (
            <div className="py-8 text-center text-sm text-[#A8B3CF]">No conversations yet</div>
          )}
        </div>
      </aside>

      <div className="flex flex-1 flex-col bg-page">
        {selected ? (
          <>
            <div className="flex h-20 items-center justify-between border-b border-[#1B2540] bg-[#131A2A] px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#111827] text-xl font-bold text-[#00C2A8]">{((selected.buyer_id === user.id ? (selected as any).builder : (selected as any).buyer)?.full_name || 'B')[0]}</div>
                <div>
                  <p className="text-sm font-semibold text-white">{(selected.buyer_id === user.id ? (selected as any).builder : (selected as any).buyer)?.full_name || 'Builder'}</p>
                  <p className="text-xs text-[#A8B3CF]">{((selected as any).builder_profile as any)?.city || 'Online'}</p>
                </div>
              </div>
              <button className="rounded-2xl border border-[#1B2540] bg-transparent px-4 py-2 text-sm text-[#A8B3CF] transition hover:border-[#00C2A8] hover:text-white">
                View Profile
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center text-center text-[#A8B3CF]">
                  <div>
                    <p className="text-xl"><MessageSquare size={48} color="#1B2540" /></p>
                    <p className="mt-3 text-lg font-medium text-white">Say hello to {(selected.buyer_id === user.id ? (selected as any).builder : (selected as any).buyer)?.full_name}</p>
                  </div>
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.sender_id === user.id;
                const createdAt = msg.created_at ?? '';
                if (msg.message_type === 'offer_card' && msg.offer_data) {
                  return <OfferCard key={msg.id} message={msg} isMine={isMine} conversationId={selected.id} />;
                }
                return (
                  <div key={msg.id} className={`mb-4 flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[65%] rounded-3xl px-4 py-3 ${isMine ? 'bg-[#00C2A8] text-[#0B1020] rounded-br-[6px]' : 'bg-[#131A2A] text-white border border-[#1B2540] rounded-bl-[6px]'}`}>
                      <p className="text-sm leading-6 whitespace-pre-wrap break-words">{msg.content}</p>
                      <p className={`mt-2 text-[11px] ${isMine ? 'text-[#0B1020]' : 'text-[#A8B3CF]'}`}>{formatTime(createdAt)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {paymentWarning && (
              <div className="mx-6 mb-2 rounded-3xl border border-red bg-red/10 px-4 py-3 text-sm text-red">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={18} />
                  <span>Pay inside the platform only. External payments remove escrow protection.</span>
                </div>
              </div>
            )}

            {showOfferForm && (
              <div className="mx-6 mb-2 rounded-3xl border border-[#1B2540] bg-[#131A2A] p-4">
                <p className="text-sm font-semibold text-white">Send an Offer</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input
                    value={offerDesc}
                    onChange={(e) => setOfferDesc(e.target.value)}
                    placeholder="Service description"
                    className="w-full rounded-2xl border border-[#1B2540] bg-[#0B1020] px-3 py-3 text-sm text-white outline-none focus:border-[#00C2A8]"
                  />
                  <input
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    type="number"
                    placeholder="Price (?)"
                    className="w-full rounded-2xl border border-[#1B2540] bg-[#0B1020] px-3 py-3 text-sm text-white outline-none focus:border-[#00C2A8]"
                  />
                  <input
                    value={offerDays}
                    onChange={(e) => setOfferDays(e.target.value)}
                    type="number"
                    placeholder="Delivery days"
                    className="w-full rounded-2xl border border-[#1B2540] bg-[#0B1020] px-3 py-3 text-sm text-white outline-none focus:border-[#00C2A8]"
                  />
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowOfferForm(false)} className="flex-1 rounded-2xl border border-[#1B2540] bg-[#0B1020] px-4 py-3 text-sm text-[#A8B3CF] transition hover:border-[#00C2A8] hover:text-white">Cancel</button>
                    <button onClick={sendOffer} disabled={sending} className="flex-1 rounded-2xl bg-[#00C2A8] px-4 py-3 text-sm font-semibold text-[#0B1020] transition disabled:opacity-50 hover:bg-[#4B4EE8]">Send Offer</button>
                  </div>
                </div>
              </div>
            )}

            <div className="sticky bottom-0 z-10 border-t border-[#1B2540] bg-[#131A2A] px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {profile?.current_mode === 'builder' && (
                  <button onClick={() => setShowOfferForm((prev) => !prev)}
                    className="rounded-2xl border border-[#1B2540] bg-[#0B1020] px-4 py-3 text-sm text-[#A8B3CF] transition hover:border-[#00C2A8] hover:text-white">
                    Send Offer
                  </button>
                )}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  rows={1}
                  placeholder="Type a message..."
                  className="min-h-[56px] flex-1 resize-none rounded-3xl border border-[#1B2540] bg-[#0B1020] px-4 py-3 text-sm text-white outline-none transition focus:border-[#00C2A8]"
                />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || sending}
                  className="inline-flex h-14 items-center justify-center rounded-3xl bg-[#00C2A8] px-5 text-sm font-semibold text-[#0B1020] transition hover:bg-[#4B4EE8] disabled:opacity-50">
                  {sending ? '...' : <Send size={16} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center border-l border-[#1B2540] bg-page text-[#A8B3CF]">
            <div className="text-center">
              <p className="text-4xl"><MessageSquare size={48} color="#1B2540" /></p>
              <p className="mt-4 text-xl font-semibold text-white">Select a conversation to start chatting</p>
              <p className="mt-2 text-sm">Your chats and offers will appear here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


