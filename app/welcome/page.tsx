'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Hammer, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function WelcomePage() {
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (profile?.builder_onboarding_complete || profile?.buyer_onboarding_complete) {
      if (profile.current_mode === 'builder' && profile.builder_onboarding_complete) {
        router.replace('/dashboard/builder');
      } else if (profile.current_mode === 'buyer' && profile.buyer_onboarding_complete) {
        router.replace('/dashboard');
      }
    }
  }, [user, profile, isLoading, router]);

  // Show loading state while fetching auth/profile
  if (isLoading || !user) return null;
  
  // Show role selector until a role onboarding flow is completed.
  // Some Supabase projects default current_mode to buyer, so onboarding completion
  // is the reliable signal here.

  return (
    <div className="min-h-screen bg-page text-white overflow-hidden flex flex-col">
      {/* Background gradient */}
      <div className="absolute inset-0 grid grid-cols-1 gap-0 bg-page grid-lines opacity-20" />
      <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_top,_rgba(174, 155, 201, 0.07),_transparent_45%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 border-b border-surface3 bg-page/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
          <div className="text-2xl font-bold text-gradient-teal-blue">MeetvoAI</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl font-extrabold leading-tight tracking-[-0.05em] text-white sm:text-6xl mb-6">
              Welcome to MeetvoAI
            </h1>
            <p className="text-lg text-[#9490B5] sm:text-xl max-w-2xl mx-auto">
              Choose your role to get started. You can always switch between roles later.
            </p>
          </motion.div>

          {/* Role Selection Cards */}
          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Builder Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="group relative"
            >
              <Link href="/onboarding/builder">
                <div className="relative h-full rounded-[20px] border border-surface3 bg-surface p-8 hover:border-teal transition-all duration-300 hover:shadow-[0_8px_32px_rgba(174, 155, 201, 0.15)] overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ae9bc940] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-6 inline-flex rounded-lg bg-surface2 p-4 text-teal">
                      <Hammer size={32} />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-white mb-3">AI Builder</h3>
                    <p className="text-[#9490B5] mb-8">
                      Showcase your AI expertise and connect with businesses that need your skills.
                    </p>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-teal" />
                        </div>
                        <span className="text-sm text-[#9490B5]">Build your professional portfolio</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-teal" />
                        </div>
                        <span className="text-sm text-[#9490B5]">Get direct messages from buyers</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-teal" />
                        </div>
                        <span className="text-sm text-[#9490B5]">Secure escrow payments</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-teal" />
                        </div>
                        <span className="text-sm text-[#9490B5]">Set your own hourly rate</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-teal text-background font-semibold py-3 transition hover:bg-[#6F4EEA] group-hover:translate-x-1 duration-300">
                      Get Started as Builder <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Buyer Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="group relative"
            >
              <Link href="/onboarding/buyer">
                <div className="relative h-full rounded-[20px] border border-surface3 bg-surface p-8 hover:border-teal transition-all duration-300 hover:shadow-[0_8px_32px_rgba(174, 155, 201, 0.15)] overflow-hidden">
                  {/* Gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#ae9bc940] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className="mb-6 inline-flex rounded-lg bg-surface2 p-4 text-teal">
                      <ShoppingBag size={32} />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold text-white mb-3">Business Owner</h3>
                    <p className="text-[#9490B5] mb-8">
                      Build AI agents for your business or hire expert builders from our marketplace.
                    </p>

                    {/* Features */}
                    <div className="space-y-3 mb-8">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-teal" />
                        </div>
                        <span className="text-sm text-[#9490B5]">AI Studio - build with no code</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-teal" />
                        </div>
                        <span className="text-sm text-[#9490B5]">Marketplace of verified builders</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-teal" />
                        </div>
                        <span className="text-sm text-[#9490B5]">Escrow protected payments</span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-teal/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-teal" />
                        </div>
                        <span className="text-sm text-[#9490B5]">Direct communication with builders</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <button className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-teal text-background font-semibold py-3 transition hover:bg-[#6F4EEA] group-hover:translate-x-1 duration-300">
                      Get Started as Business Owner <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              </Link>
            </motion.div>
          </div>

          {/* Footer note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 text-center text-sm text-[#9490B5]"
          >
            <p>You can switch between roles anytime in your settings</p>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
