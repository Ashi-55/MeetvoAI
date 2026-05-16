'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { MeetvoLogo } from '@/components/ui/HandshakeLogo';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

const step1Schema = z.object({
  business_name: z.string().min(2, 'Business name required'),
  industry: z.string().min(1, 'Select industry'),
  company_size: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url('Enter valid URL').optional().or(z.literal('')),
  whatsapp_number: z.string().optional(),
});

const step2Schema = z.object({
  needs: z.array(z.string()).min(1, 'Select at least one need'),
  budget_range: z.string().min(1, 'Select budget range'),
  description: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

const NEEDS = ['Lead qualification', 'Customer support', 'Appointment booking', 'WhatsApp automation', 'Social media', 'Email automation', 'Data analysis', 'Custom development', 'Other'];
const BUDGETS = ['Under ₹2,000', '₹2,000–₹5,000', '₹5,000–₹15,000', '₹15,000–₹50,000', 'Above ₹50,000'];
const INDUSTRIES = ['E-commerce', 'Healthcare', 'Real Estate', 'Education', 'Restaurant', 'Retail', 'Finance', 'Other'];

export default function BuyerOnboardingPage() {
  const router = useRouter();
  const setProfile = useAuthStore((state) => state.setProfile);
  const profile = useAuthStore((state) => state.profile);
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: { needs: [] } });

  async function onStep1(data: Step1Data) {
    setStep1Data(data);
    setStep(2);
  }

  async function onStep2(data: Step2Data) {
    if (selectedNeeds.length === 0) {
      form2.setError('needs', { message: 'Select at least one need' });
      return;
    }
    setStep2Data({ ...data, needs: selectedNeeds });
    setStep(3);
  }

  async function finish() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !step1Data || !step2Data) return;

    await supabase.from('buyer_profiles').upsert({
      id: user.id,
      business_name: step1Data.business_name,
      industry: step1Data.industry,
      company_size: step1Data.company_size || null,
      location: step1Data.location || null,
      website: step1Data.website || null,
      whatsapp_number: step1Data.whatsapp_number || null,
      needs: selectedNeeds,
      budget_range: step2Data.budget_range,
      description: step2Data.description || null,
    });

    await supabase.from('profiles').update({ buyer_onboarding_complete: true }).eq('id', user.id);
    const { data: updatedProfile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (updatedProfile) setProfile(updatedProfile as typeof profile);
    router.replace('/');
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center justify-between gap-4">
          <button type="button" onClick={handleBack}
            className="text-sm text-text3 hover:text-text transition-colors flex items-center gap-2">
            <ChevronLeft size={16} /> Back
          </button>
          <Link href="/" className="text-sm text-brand font-semibold hover:text-brand2 transition-colors">
            Explore Marketplace
          </Link>
        </div>
        <div className="mb-8">
          <MeetvoLogo size="sm" />
        </div>

        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${s <= step ? 'bg-brand text-white' : 'bg-surface3 text-text3'}`}>
                {s < step ? <Check size={14} /> : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 w-16 transition-colors ${s < step ? 'bg-brand' : 'bg-surface3'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-2xl font-bold text-text mb-2">Tell us about your business</h1>
              <p className="text-text2 mb-6">Step 1 of 3</p>
              <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
                {([['business_name', 'Business Name', 'Acme Technologies', 'text'],
                  ['location', 'Location (City)', 'Mumbai, India', 'text'],
                  ['website', 'Website (optional)', 'https://example.com', 'url'],
                  ['whatsapp_number', 'WhatsApp Number', '+91 9876543210', 'tel']
                ] as [keyof Step1Data, string, string, string][]).map(([key, label, placeholder, type]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-text2 mb-1.5">{label}</label>
                    <input {...form1.register(key)} type={type} placeholder={placeholder}
                      className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors" />
                    {form1.formState.errors[key] && <p className="text-red text-xs mt-1">{form1.formState.errors[key]?.message as string}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-text2 mb-1.5">Industry</label>
                  <select {...form1.register('industry')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors">
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
                  </select>
                  {form1.formState.errors.industry && <p className="text-red text-xs mt-1">{form1.formState.errors.industry.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text2 mb-1.5">Company Size</label>
                  <select {...form1.register('company_size')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors">
                    <option value="">Select size</option>
                    {['1-10', '11-50', '51-200', '200+'].map((s) => <option key={s} value={s}>{s} employees</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-brand hover:bg-brand2 text-white rounded-lg px-4 py-3 font-semibold transition-colors flex items-center justify-center gap-2">
                  Continue <ChevronRight size={18} />
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-2xl font-bold text-text mb-2">What do you need AI for?</h1>
              <p className="text-text2 mb-6">Step 2 of 3 — Select all that apply</p>
              <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text2 mb-3">Your Needs</label>
                  <div className="flex flex-wrap gap-2">
                    {NEEDS.map((need) => (
                      <button key={need} type="button"
                        onClick={() => {
                          setSelectedNeeds((prev) => {
                            const next = prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need];
                            form2.setValue('needs', next);
                            if (next.length > 0) form2.clearErrors('needs');
                            return next;
                          });
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedNeeds.includes(need) ? 'bg-brand border-brand text-white' : 'bg-surface2 border-border text-text2 hover:border-brand2'}`}>
                        {need}
                      </button>
                    ))}
                  </div>
                  {form2.formState.errors.needs && <p className="text-red text-xs mt-2">{form2.formState.errors.needs.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text2 mb-1.5">Monthly Budget</label>
                  <select {...form2.register('budget_range')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors">
                    <option value="">Select budget range</option>
                    {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {form2.formState.errors.budget_range && <p className="text-red text-xs mt-1">{form2.formState.errors.budget_range.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text2 mb-1.5">Describe your main challenge (optional)</label>
                  <textarea {...form2.register('description')} rows={3} placeholder="Tell us what problem you're trying to solve..."
                    className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors resize-none" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 bg-surface2 hover:bg-surface3 border border-border text-text rounded-lg px-4 py-3 font-semibold transition-colors flex items-center justify-center gap-2">
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button type="submit" className="flex-1 bg-brand hover:bg-brand2 text-white rounded-lg px-4 py-3 font-semibold transition-colors flex items-center justify-center gap-2">
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="text-center">
              <div className="w-20 h-20 rounded-full bg-green/20 flex items-center justify-center mx-auto mb-6">
                <Check size={32} className="text-green" />
              </div>
              <h1 className="text-2xl font-bold text-text mb-2">You're all set!</h1>
              <p className="text-text2 mb-8">Here's your profile summary</p>
              <div className="bg-surface rounded-xl border border-border p-6 text-left space-y-3 mb-8">
                <div className="flex justify-between"><span className="text-text3">Business</span><span className="text-text font-medium">{step1Data?.business_name}</span></div>
                <div className="flex justify-between"><span className="text-text3">Industry</span><span className="text-text font-medium">{step1Data?.industry}</span></div>
                <div className="flex justify-between"><span className="text-text3">Budget</span><span className="text-text font-medium">{step2Data?.budget_range}</span></div>
                <div className="flex justify-between"><span className="text-text3">Needs</span><span className="text-text font-medium text-right text-sm">{selectedNeeds.slice(0, 3).join(', ')}{selectedNeeds.length > 3 ? '...' : ''}</span></div>
              </div>
              <button onClick={finish} disabled={loading}
                className="w-full bg-brand hover:bg-brand2 disabled:opacity-50 text-white rounded-lg px-4 py-3 font-semibold transition-colors">
                {loading ? 'Setting up your account...' : 'Explore Marketplace'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
