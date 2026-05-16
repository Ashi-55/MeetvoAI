'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Agent, Profile } from '@/types';

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [builders, setBuilders] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setAgents([]); setBuilders([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const [{ data: a }, { data: b }] = await Promise.all([
        supabase.from('agents').select('id, name, category, tagline').eq('status', 'published').ilike('name', `%${query}%`).limit(4),
        supabase.from('profiles').select('id, full_name, avatar_url').ilike('full_name', `%${query}%`).limit(3),
      ]);
      setAgents((a || []) as Agent[]);
      setBuilders((b || []) as Profile[]);
      setOpen(true);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center bg-surface2 border border-border focus-within:border-brand rounded-lg px-3 gap-2 transition-colors">
        <Search size={16} className="text-text3 shrink-0" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search AI agents, builders..."
          className="flex-1 bg-transparent py-2 text-sm text-text placeholder-text3 outline-none"
        />
      </div>
      {open && (agents.length > 0 || builders.length > 0) && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-surface border border-border rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-50">
          {agents.length > 0 && (
            <div>
              <p className="text-text3 text-xs font-semibold px-4 py-2 border-b border-border">AGENTS</p>
              {agents.map((a) => (
                <button key={a.id} onClick={() => { router.push(`/agent/${a.id}`); setOpen(false); setQuery(''); }}
                  className="w-full text-left px-4 py-3 hover:bg-surface2 transition-colors flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center text-brand text-xs font-bold shrink-0">AI</div>
                  <div>
                    <p className="text-text text-sm font-medium">{a.name}</p>
                    <p className="text-text3 text-xs">{a.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {builders.length > 0 && (
            <div>
              <p className="text-text3 text-xs font-semibold px-4 py-2 border-b border-border">BUILDERS</p>
              {builders.map((b) => (
                <button key={b.id} onClick={() => { router.push(`/builder/${b.id}`); setOpen(false); setQuery(''); }}
                  className="w-full text-left px-4 py-3 hover:bg-surface2 transition-colors flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface3 flex items-center justify-center text-text text-xs font-bold shrink-0">
                    {b.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <p className="text-text text-sm font-medium">{b.full_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
