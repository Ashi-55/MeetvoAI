'use client';

import { useState, useEffect, useRef } from 'react';
import { BadgeCheck, Send, TriangleAlert as AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { detectExternalPayment, formatTime, formatDate, timeAgo } from '@/lib/utils';
import { OfferCard } from '@/components/chat/OfferCard';
import type { Conversation, Message } from '@/types';

export default function MessagesPage() {
  const { user, profile } = useAuth();
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
  const supabase = createClient();

  useEffect(() => {
    if (!user) return;
    loadConversations();
    const channel = supabase.channel('convs').on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => loadConversations()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    if (!selected) return;
    loadMessages(selected.id);
    const channel = supabase.channel(`msgs:${selected.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${selected.id}` },
        (payload: { new: Record<string, unknown> }) => {
          setMessages((prev) => [...prev, payload.new as unknown as Message]);
          if (detectExternalPayment((payload.new as unknown as Message).content || '')) setPaymentWarning(true);
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function loadConversations() {
    const { data } = await supabase.from('conversations').select('*, buyer:profiles!conversations_buyer_id_fkey(full_name, avatar_url), builder:profiles!conversations_builder_id_fkey(full_name, avatar_url), builder_profile:builder_profiles(verification_status, response_time_hours), agent:agents(name)').or(`buyer_id.eq.${user!.id},builder_id.eq.${user!.id}`).order('last_message_at', { ascending: false });
    setConversations((data || []) as unknown as Conversation[]);
  }

  async function loadMessages(convId: string) {
    const { data } = await supabase.from('messages').select('*, sender:profiles(full_name, avatar_url)').eq('conversation_id', convId).order('created_at', { ascending: true }).limit(100);
    setMessages((data || []) as unknown as Message[]);
    await supabase.from('messages').update({ is_read: true }).eq('conversation_id', convId).neq('sender_id', user!.id);
  }

  async function sendMessage(content: string) {
    if (!content.trim() || !selected || !user) return;
    setSending(true);
    if (detectExternalPayment(content)) setPaymentWarning(true);
    await supabase.from('messages').insert({ conversation_id: selected.id, sender_id: user.id, content: content.trim(), message_type: 'text', contains_external_payment: detectExternalPayment(content) });
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', selected.id);
    setInput('');
    setSending(false);
  }

  async function sendOffer() {
    if (!user || !selected || !offerDesc || !offerPrice || !offerDays) return;
    setSending(true);
    const { calculatePlatformFee } = await import('@/lib/fees');
    const price = parseInt(offerPrice);
    const { platformFee, gst } = calculatePlatformFee(price);
    await supabase.from('messages').insert({ conversation_id: selected.id, sender_id: user.id, content: null, message_type: 'offer_card', offer_data: { description: offerDesc, price, delivery_days: parseInt(offerDays), status: 'pending', platformFee, gst } });
    setShowOfferForm(false);
    setOfferDesc(''); setOfferPrice(''); setOfferDays('');
    setSending(false);
  }

  const filteredConvs = conversations.filter((c) => {
    const other = c.buyer_id === user?.id ? (c as unknown as Record<string, Record<string, string>>).builder : (c as unknown as Record<string, Record<string, string>>).buyer;
    return !search || other?.full_name?.toLowerCase().includes(search.toLowerCase());
  });

  let prevDate = '';

  return (
    <div className="flex h-[calc(100vh-56px)]">
      <div className="w-80 shrink-0 bg-surface border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..."
            className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-2.5 text-text text-sm placeholder-text3 outline-none transition-colors" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.map((conv) => {
            const isBuyer = conv.buyer_id === user?.id;
            const other = isBuyer ? (conv as unknown as Record<string, Record<string, string>>).builder : (conv as unknown as Record<string, Record<string, string>>).buyer;
            const unread = isBuyer ? (conv.buyer_unread ?? 0) : (conv.builder_unread ?? 0);
            return (
              <button key={conv.id} onClick={() => { setSelected(conv); setPaymentWarning(false); }}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-surface2 transition-colors border-b border-border ${selected?.id === conv.id ? 'bg-surface2' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand text-sm font-bold shrink-0">
                  {other?.full_name?.[0] || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <span className="text-text text-sm font-semibold truncate">{other?.full_name}</span>
                    <span className="text-text3 text-xs">{timeAgo(conv.last_message_at ?? '')}</span>
                  </div>
                  {(conv as unknown as Record<string, Record<string, string>>).agent?.name && (
                    <p className="text-text3 text-xs truncate">{(conv as unknown as Record<string, Record<string, string>>).agent?.name}</p>
                  )}
                </div>
                {unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red text-white text-xs flex items-center justify-center font-bold shrink-0">{unread}</span>
                )}
              </button>
            );
          })}
          {filteredConvs.length === 0 && <p className="text-center text-text3 text-sm py-8">No conversations yet</p>}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selected ? (() => {
          const isBuyer = selected.buyer_id === user?.id;
          const other = isBuyer ? (selected as unknown as Record<string, Record<string, string>>).builder : (selected as unknown as Record<string, Record<string, string>>).buyer;
          const builderProfile = (selected as unknown as Record<string, Record<string, unknown>>).builder_profile;
          return (
            <>
              <div className="h-14 flex items-center gap-3 px-6 bg-surface border-b border-border">
                <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-brand text-sm font-bold">{other?.full_name?.[0]}</div>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="text-text font-semibold text-sm">{other?.full_name}</span>
                    {(builderProfile as Record<string, string>)?.verification_status === 'verified' && <BadgeCheck size={13} className="text-blue" />}
                  </div>
                  {(builderProfile as Record<string, number>)?.response_time_hours && (
                    <p className="text-text3 text-xs">Replies in {(builderProfile as Record<string, number>).response_time_hours}h</p>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-1">
                {(() => {
                  const items: React.ReactNode[] = [];
                  for (const msg of messages) {
                    const d = formatDate(msg.created_at ?? '');
                    if (d !== prevDate) {
                      items.push(<p key={`d-${msg.id}`} className="text-center text-text3 text-xs py-3">{d}</p>);
                      prevDate = d;
                    }
                    const isMine = msg.sender_id === user?.id;
                    if (msg.message_type === 'offer_card' && msg.offer_data) {
                      items.push(<OfferCard key={msg.id} message={msg} isMine={isMine} conversationId={selected.id} />);
                    } else {
                      items.push(
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-lg rounded-2xl px-4 py-2.5 ${isMine ? 'bg-brand text-white rounded-br-sm' : 'bg-surface3 text-text rounded-bl-sm'}`}>
                            <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                            <p className={`text-xs mt-0.5 ${isMine ? 'text-white/60' : 'text-text3'}`}>{formatTime(msg.created_at ?? '')}</p>
                          </div>
                        </div>
                      );
                    }
                  }
                  return items;
                })()}
                <div ref={messagesEndRef} />
              </div>

              {paymentWarning && (
                <div className="mx-6 mb-2 bg-red/10 border border-red/30 rounded-lg px-4 py-2.5 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-red shrink-0 mt-0.5" />
                  <p className="text-red text-sm">Pay inside MeetvoAI only. External payments remove all escrow protection.</p>
                </div>
              )}

              {showOfferForm && (
                <div className="mx-6 mb-2 bg-surface2 border border-border rounded-xl p-4 space-y-3">
                  <p className="text-text font-semibold">Send an Offer</p>
                  <input value={offerDesc} onChange={(e) => setOfferDesc(e.target.value)} placeholder="Service description"
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm placeholder-text3 outline-none focus:border-brand" />
                  <div className="flex gap-3">
                    <input value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} type="number" placeholder="Price (₹)"
                      className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm placeholder-text3 outline-none focus:border-brand" />
                    <input value={offerDays} onChange={(e) => setOfferDays(e.target.value)} type="number" placeholder="Days"
                      className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text text-sm placeholder-text3 outline-none focus:border-brand" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowOfferForm(false)} className="flex-1 bg-surface border border-border text-text2 rounded-lg py-2 text-sm transition-colors hover:bg-surface3">Cancel</button>
                    <button onClick={sendOffer} disabled={sending} className="flex-1 bg-brand hover:bg-brand2 text-white rounded-lg py-2 text-sm font-semibold transition-colors disabled:opacity-50">Send Offer</button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 px-6 py-4 border-t border-border">
                {profile?.current_mode === 'builder' && (
                  <button onClick={() => setShowOfferForm(!showOfferForm)}
                    className="text-sm px-3 py-2.5 bg-surface2 border border-border text-text2 rounded-lg hover:bg-surface3 transition-colors whitespace-nowrap">
                    Send Offer
                  </button>
                )}
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
                  className="flex-1 bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-2.5 text-text text-sm placeholder-text3 outline-none transition-colors"
                />
                <button onClick={() => sendMessage(input)} disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-lg bg-brand hover:bg-brand2 disabled:opacity-40 text-white flex items-center justify-center transition-colors">
                  <Send size={16} />
                </button>
              </div>
            </>
          );
        })() : (
          <div className="flex-1 flex items-center justify-center text-text3">
            <div className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
