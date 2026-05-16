'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { MeetvoLogo } from '@/components/ui/HandshakeLogo';
import { createClient } from '@/lib/supabase/client';

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string().min(8, 'Confirm password is required'),
}).refine((data) => data.password === data.confirm_password, {
  message: 'Passwords do not match',
  path: ['confirm_password'],
});
type FormData = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'Unable to create account.');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      router.push('/welcome');
    } catch (error) {
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/welcome` },
    });
  }

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-surface p-12 border-r border-border">
        <div>
          <div className="mb-16">
            <MeetvoLogo size="md" />
          </div>
          <h2 className="text-4xl font-bold text-text mb-4">Join India's AI Revolution</h2>
          <p className="text-text2 text-lg leading-relaxed">Connect businesses with verified AI builders. Automate, grow, and scale.</p>
          <div className="mt-12 space-y-4">
            {['Verified AI Builders', 'Escrow Protection', 'AI Builder Studio', 'WhatsApp Notifications'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-green" />
                </div>
                <span className="text-text2">{f}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface2 rounded-xl p-6 border border-border">
          <p className="text-text italic mb-4">"Built and deployed our customer support agent in 3 days. Incredible platform."</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue flex items-center justify-center text-white font-bold">P</div>
            <div>
              <p className="text-text font-semibold">Priya Menon</p>
              <p className="text-text3 text-sm">Founder, EduTech Startup</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <MeetvoLogo size="md" />
          </div>
          <h1 className="text-3xl font-bold text-text mb-2">Create your account</h1>
          <p className="text-text2 mb-8">Join India's AI automation marketplace</p>

          {error && (
            <div className="bg-red/10 border border-red/30 text-red rounded-lg p-3 mb-6 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text2 mb-1.5">Full Name</label>
              <input {...register('full_name')} placeholder="Rahul Sharma"
                className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors" />
              {errors.full_name && <p className="text-red text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text2 mb-1.5">Email</label>
              <input {...register('email')} type="email" placeholder="you@example.com"
                className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors" />
              {errors.email && <p className="text-red text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text2 mb-1.5">Password</label>
              <div className="relative">
                <input {...register('password')} type={showPw ? 'text' : 'password'} placeholder="Min 8 characters"
                  className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors pr-12" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text3 hover:text-text2">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-red text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-text2 mb-1.5">Confirm Password</label>
              <div className="relative">
                <input {...register('confirm_password')} type={showPw ? 'text' : 'password'} placeholder="Re-enter password"
                  className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors pr-12" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text3 hover:text-text2">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirm_password && <p className="text-red text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-brand hover:bg-brand2 disabled:opacity-50 text-white rounded-lg px-4 py-3 font-semibold transition-colors mt-2">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-text3 text-sm">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button onClick={handleGoogle}
            className="w-full bg-surface2 hover:bg-surface3 border border-border text-text rounded-lg px-4 py-3 font-medium transition-colors flex items-center justify-center gap-3">
            <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-text2 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-brand hover:text-brand2 font-semibold">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
