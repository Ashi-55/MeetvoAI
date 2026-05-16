'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { MeetvoLogo } from '@/components/ui/HandshakeLogo';
import { createClient } from '@/lib/supabase/client';

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<'buyer' | 'builder' | null>(null);

  async function selectMode(mode: 'buyer' | 'builder') {
    setLoading(mode);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ current_mode: mode }).eq('id', user.id);
    }
    router.push(mode === 'buyer' ? '/onboarding/buyer' : '/onboarding/builder');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <div className="flex justify-center mb-8">
          <MeetvoLogo size="lg" />
        </div>
        <h1 className="text-4xl font-bold text-text mb-4">What brings you to MeetvoAI?</h1>
        <p className="text-text2 text-lg">Choose how you'd like to use the platform</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        <motion.button
          initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          onClick={() => selectMode('buyer')}
          disabled={loading !== null}
          className="bg-surface hover:bg-surface2 border-2 border-border hover:border-brand rounded-2xl p-8 text-left transition-all group disabled:opacity-60"
        >
          <div className="text-4xl mb-4">🏢</div>
          <h2 className="text-xl font-bold text-text mb-2 group-hover:text-brand transition-colors">I want AI for my business</h2>
          <p className="text-text2 text-sm leading-relaxed">Browse verified AI agents and builders. Get automation set up for your business.</p>
          {loading === 'buyer' && <p className="text-brand text-sm mt-3 font-medium">Setting up...</p>}
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          onClick={() => selectMode('builder')}
          disabled={loading !== null}
          className="bg-surface hover:bg-surface2 border-2 border-border hover:border-brand rounded-2xl p-8 text-left transition-all group disabled:opacity-60"
        >
          <div className="text-4xl mb-4">⚡</div>
          <h2 className="text-xl font-bold text-text mb-2 group-hover:text-brand transition-colors">I build AI agents</h2>
          <p className="text-text2 text-sm leading-relaxed">List your AI agents, find clients, and earn. Build using our AI Studio.</p>
          {loading === 'builder' && <p className="text-brand text-sm mt-3 font-medium">Setting up...</p>}
        </motion.button>
      </div>
    </div>
  );
}
