'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Minus, X, BadgeCheck, Send, TriangleAlert as AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useChatStore } from '@/stores/chatStore';
import { detectExternalPayment, formatTime, formatDate } from '@/lib/utils';
import { OfferCard } from './OfferCard';
import type { ChatSession, Message } from '@/types';

interface Props {
  session: ChatSession;
  offsetIndex: number;
}

const QUICK_CHIPS = [
  'Can I see a demo of this agent?',
  'What is your setup timeline?',
  'Can you customise for my business?',
];

export function ChatPopup({ session, offsetIndex }: Props) {
  const { user, profile } = useAuth();
  const { minimiseChat, closeChat } = useChatStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [paymentWarning, setPaymentWarning] = useState(false);
  const [offerDesc, setOfferDesc] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerDays, setOfferDays] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isBuilder = profile?.current_mode === 'builder';
  const supabase = createClient();

  useEffect(() => {
    loadMessages();
    const channel = supabase
      .channel(`conv:${session.conversationId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${session.conversationId}` },
        (payload: { new: Record<string, unknown> }) => {
          setMessages((prev) => [...prev, payload.new as unknown as Message]);
          if (detectExternalPayment((payload.new as unknown as Message).content || '')) setPaymentWarning(true);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session.conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadMessages() {
    const { data } = await supabase.from('messages').select('*, sender:profiles(full_name, avatar_url)').eq('conversation_id', session.conversationId).order('created_at', { ascending: true }).limit(50);
    setMessages((data || []) as unknown as Message[]);
  }

  async function sendMessage(content: string) {
    if (!content.trim() || !user) return;
    setSending(true);
    if (detectExternalPayment(content)) setPaymentWarning(true);
    await supabase.from('messages').insert({
      conversation_id: session.conversationId,
      sender_id: user.id,
      content: content.trim(),
      message_type: 'text',
      contains_external_payment: detectExternalPayment(content),
    });
    await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', session.conversationId);
    setInput('');
    setSending(false);
  }

  async function sendOffer() {
    if (!user || !offerDesc || !offerPrice || !offerDays) return;
    setSending(true);
    const { calculatePlatformFee } = await import('@/lib/fees');
    const price = parseInt(offerPrice);
    const { platformFee, gst } = calculatePlatformFee(price);
    await supabase.from('messages').insert({
      conversation_id: session.conversationId,
      sender_id: user.id,
      content: null,
      message_type: 'offer_card',
      offer_data: { description: offerDesc, price, delivery_days: parseInt(offerDays), status: 'pending', platformFee, gst },
    });
    setShowOfferForm(false);
    setOfferDesc(''); setOfferPrice(''); setOfferDays('');
    setSending(false);
  }

  const right = 24 + offsetIndex * (364 + 12);

  let prevDate = '';
  const grouped: Array<{ type: 'date'; date: string } | { type: 'msg'; msg: Message }> = [];
  for (const msg of messages) {
    const d = formatDate(msg.created_at);
    if (d !== prevDate) { grouped.push({ type: 'date', date: d }); prevDate = d; }
    grouped.push({ type: 'msg', msg });
  }

  return (
    <motion.div
      initial={{ y: 400, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      style={{ right, bottom: 0, width: 360 }}
      className="fixed z-50 bg-surface border border-border rounded-t-2xl shadow-2xl shadow-black/60 flex flex-col"
    >
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand text-sm font-bold">
            {session.participantName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green border-2 border-surface" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-text font-semibold text-sm truncate">{session.participantName}</span>
            {session.isVerified && <BadgeCheck size={13} className="text-blue shrink-0" />}
          </div>
          <p className="text-text3 text-xs">Replies within {session.responseTimeHours}h</p>
        </div>
        <button onClick={() => minimiseChat(session.conversationId)} className="p-1.5 hover:bg-surface2 rounded-lg transition-colors text-text3 hover:text-text"><Minus size={16} /></button>
        <button onClick={() => closeChat(session.conversationId)} className="p-1.5 hover:bg-surface2 rounded-lg transition-colors text-text3 hover:text-red"><X size={16} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 max-h-80 min-h-48">
        {messages.length === 0 && (
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-text3 text-xs text-center mb-2">Start the conversation</p>
            {QUICK_CHIPS.map((chip) => (
              <button key={chip} onClick={() => sendMessage(chip)}
                className="text-left text-xs bg-surface2 hover:bg-surface3 border border-border text-text2 rounded-xl px-3 py-2 transition-colors">
                {chip}
              </button>
            ))}
          </div>
        )}
        {grouped.map((item, i) => {
          if (item.type === 'date') {
            return <p key={i} className="text-center text-text3 text-xs py-2">{item.date}</p>;
          }
          const msg = item.msg;
          const isMine = msg.sender_id === user?.id;
          if (msg.message_type === 'offer_card' && msg.offer_data) {
            return <OfferCard key={msg.id} message={msg} isMine={isMine} conversationId={session.conversationId} />;
          }
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${isMine ? 'bg-brand text-white rounded-br-sm' : 'bg-surface3 text-text rounded-bl-sm'}`}>
                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                <p className={`text-xs mt-0.5 ${isMine ? 'text-white/60' : 'text-text3'}`}>{formatTime(msg.created_at)}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {paymentWarning && (
        <div className="mx-3 mb-2 bg-red/10 border border-red/30 rounded-lg px-3 py-2 flex items-start gap-2">
          <AlertTriangle size={14} className="text-red shrink-0 mt-0.5" />
          <p className="text-red text-xs leading-tight">Pay inside MeetvoAI only. External payments remove all escrow protection and you cannot raise disputes.</p>
        </div>
      )}

      {showOfferForm && (
        <div className="mx-3 mb-2 bg-surface2 border border-border rounded-xl p-3 space-y-2">
          <p className="text-text text-sm font-semibold">Send an Offer</p>
          <input value={offerDesc} onChange={(e) => setOfferDesc(e.target.value)} placeholder="Service description"
            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-text text-xs placeholder-text3 outline-none focus:border-brand" />
          <div className="flex gap-2">
            <input value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} type="number" placeholder="Price (₹)"
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text text-xs placeholder-text3 outline-none focus:border-brand" />
            <input value={offerDays} onChange={(e) => setOfferDays(e.target.value)} type="number" placeholder="Days"
              className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-text text-xs placeholder-text3 outline-none focus:border-brand" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowOfferForm(false)} className="flex-1 bg-surface border border-border text-text2 rounded-lg py-2 text-xs transition-colors hover:bg-surface3">Cancel</button>
            <button onClick={sendOffer} disabled={sending} className="flex-1 bg-brand hover:bg-brand2 text-white rounded-lg py-2 text-xs font-semibold transition-colors disabled:opacity-50">Send Offer</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 px-3 py-3 border-t border-border">
        {profile?.current_mode === 'builder' && (
          <button onClick={() => setShowOfferForm(!showOfferForm)}
            className="text-xs px-2.5 py-1.5 bg-surface2 border border-border text-text2 rounded-lg hover:bg-surface3 transition-colors whitespace-nowrap">
            Send Offer
          </button>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder="Type a message..."
          className="flex-1 bg-surface2 border border-border focus:border-brand rounded-lg px-3 py-2 text-text text-sm placeholder-text3 outline-none transition-colors"
        />
        <button onClick={() => sendMessage(input)} disabled={!input.trim() || sending}
          className="w-9 h-9 rounded-lg bg-brand hover:bg-brand2 disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors">
          <Send size={15} />
        </button>
      </div>
    </motion.div>
  );
}
