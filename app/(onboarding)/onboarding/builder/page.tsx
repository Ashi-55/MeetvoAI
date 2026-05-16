'use client';

import { useState } from 'react';
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
  full_name: z.string().min(2),
  title: z.string().min(5, 'Add your professional title'),
  linkedin_url: z.string().url('Enter valid LinkedIn URL').optional().or(z.literal('')),
  experience_years: z.coerce.number().min(0),
});

const step2Schema = z.object({
  bio: z.string().min(100, 'Bio must be at least 100 characters'),
  whatsapp_number: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

const SPECIALTIES = ['WhatsApp Automation', 'Lead Generation Bots', 'Customer Support Agents', 'Appointment Booking', 'E-commerce Automation', 'Voice Agents', 'CRM Integration', 'Social Media Automation', 'Custom LLM Development', 'RAG Systems', 'n8n/Make Workflows', 'Zapier Automation'];
const LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali', 'Other'];

export default function BuilderOnboardingPage() {
  const router = useRouter();
  const setProfile = useAuthStore((state) => state.setProfile);
  const profile = useAuthStore((state) => state.profile);
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });

  function addSkill() {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills((prev) => [...prev, s]);
    setSkillInput('');
  }

  async function onStep1(data: Step1Data) { setStep1Data(data); setStep(2); }
  async function onStep2(data: Step2Data) { setStep2Data(data); setStep(3); }

  async function onStep3() {
    if (selectedSpecialties.length === 0) return;
    setStep(4);
  }

  async function finish() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !step1Data || !step2Data) return;

    await supabase.from('builder_profiles').upsert({
      id: user.id,
      title: step1Data.title,
      bio: step2Data.bio,
      linkedin_url: step1Data.linkedin_url || null,
      experience_years: step1Data.experience_years,
      specialties: selectedSpecialties,
      skills,
      languages: selectedLanguages,
      whatsapp_number: step2Data.whatsapp_number || null,
      verification_status: 'pending_verification',
    });

    await supabase.from('profiles').update({ builder_onboarding_complete: true, current_mode: 'builder' }).eq('id', user.id);
    setProfile(profile ? { ...profile, builder_onboarding_complete: true, current_mode: 'builder' } : profile);
    setStep(5);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <MeetvoLogo size="sm" />
        </div>

        <div className="flex items-center gap-1 mb-8">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${s <= step ? 'bg-brand text-white' : 'bg-surface3 text-text3'}`}>
                {s < step ? <Check size={12} /> : s}
              </div>
              {s < 5 && <div className={`h-0.5 w-10 transition-colors ${s < step ? 'bg-brand' : 'bg-surface3'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-2xl font-bold text-text mb-2">Your professional profile</h1>
              <p className="text-text2 mb-6">Step 1 of 5</p>
              <form onSubmit={form1.handleSubmit(onStep1)} className="space-y-4">
                {([['full_name', 'Full Name', 'Arjun Kumar', 'text'],
                  ['title', 'Professional Title', 'AI Agent Developer | WhatsApp Automation Expert', 'text'],
                  ['linkedin_url', 'LinkedIn URL (optional)', 'https://linkedin.com/in/yourprofile', 'url'],
                ] as [keyof Step1Data, string, string, string][]).map(([key, label, placeholder, type]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-text2 mb-1.5">{label}</label>
                    <input {...form1.register(key)} type={type} placeholder={placeholder}
                      className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors" />
                    {form1.formState.errors[key] && <p className="text-red text-xs mt-1">{form1.formState.errors[key]?.message as string}</p>}
                  </div>
                ))}
                <div>
                  <label className="block text-sm font-medium text-text2 mb-1.5">Years of Experience</label>
                  <input {...form1.register('experience_years')} type="number" min="0" placeholder="3"
                    className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors" />
                </div>
                <button type="submit" className="w-full bg-brand hover:bg-brand2 text-white rounded-lg px-4 py-3 font-semibold transition-colors flex items-center justify-center gap-2">
                  Continue <ChevronRight size={18} />
                </button>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-2xl font-bold text-text mb-2">Tell businesses about you</h1>
              <p className="text-text2 mb-6">Step 2 of 5</p>
              <form onSubmit={form2.handleSubmit(onStep2)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text2 mb-1.5">Bio (min 100 chars)</label>
                  <textarea {...form2.register('bio')} rows={5} placeholder="Tell businesses what you do and why you're great..."
                    className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors resize-none" />
                  {form2.formState.errors.bio && <p className="text-red text-xs mt-1">{form2.formState.errors.bio.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text2 mb-3">Languages Spoken</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((lang) => (
                      <button key={lang} type="button"
                        onClick={() => setSelectedLanguages((prev) => prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang])}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedLanguages.includes(lang) ? 'bg-brand border-brand text-white' : 'bg-surface2 border-border text-text2 hover:border-brand2'}`}>
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text2 mb-1.5">WhatsApp Number</label>
                  <input {...form2.register('whatsapp_number')} placeholder="+91 9876543210"
                    className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors" />
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
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-2xl font-bold text-text mb-2">Your specialties</h1>
              <p className="text-text2 mb-6">Step 3 of 5 — Select all that apply</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-text2 mb-3">Specialties</label>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map((s) => (
                      <button key={s} type="button"
                        onClick={() => setSelectedSpecialties((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${selectedSpecialties.includes(s) ? 'bg-brand border-brand text-white' : 'bg-surface2 border-border text-text2 hover:border-brand2'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  {selectedSpecialties.length === 0 && <p className="text-text3 text-xs mt-2">Select at least one specialty</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-text2 mb-1.5">Skills (press Enter to add)</label>
                  <div className="flex gap-2">
                    <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                      placeholder="e.g. Python, LangChain, n8n..."
                      className="flex-1 bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors" />
                    <button type="button" onClick={addSkill} className="bg-surface2 hover:bg-surface3 border border-border text-text rounded-lg px-4 py-3 transition-colors">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skills.map((s) => (
                      <span key={s} className="bg-surface3 text-text2 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                        {s}
                        <button type="button" onClick={() => setSkills((prev) => prev.filter((x) => x !== s))} className="text-text3 hover:text-red ml-1">×</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(2)} className="flex-1 bg-surface2 hover:bg-surface3 border border-border text-text rounded-lg px-4 py-3 font-semibold transition-colors flex items-center justify-center gap-2">
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button type="button" onClick={onStep3} disabled={selectedSpecialties.length === 0}
                    className="flex-1 bg-brand hover:bg-brand2 disabled:opacity-50 text-white rounded-lg px-4 py-3 font-semibold transition-colors flex items-center justify-center gap-2">
                    Continue <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 className="text-2xl font-bold text-text mb-2">Almost done!</h1>
              <p className="text-text2 mb-6">Step 4 of 5</p>
              <div className="bg-surface rounded-xl border border-border p-6 space-y-4 mb-6">
                <h3 className="font-semibold text-text">Profile Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-text3">Name</span><span className="text-text">{step1Data?.full_name}</span></div>
                  <div className="flex justify-between"><span className="text-text3">Title</span><span className="text-text text-right text-xs">{step1Data?.title}</span></div>
                  <div className="flex justify-between"><span className="text-text3">Experience</span><span className="text-text">{step1Data?.experience_years} years</span></div>
                  <div className="flex justify-between"><span className="text-text3">Languages</span><span className="text-text">{selectedLanguages.join(', ')}</span></div>
                  <div><span className="text-text3">Specialties: </span><span className="text-text text-xs">{selectedSpecialties.slice(0, 3).join(', ')}{selectedSpecialties.length > 3 ? '...' : ''}</span></div>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)} className="flex-1 bg-surface2 hover:bg-surface3 border border-border text-text rounded-lg px-4 py-3 font-semibold transition-colors flex items-center justify-center gap-2">
                  <ChevronLeft size={18} /> Back
                </button>
                <button type="button" onClick={finish} disabled={loading}
                  className="flex-1 bg-brand hover:bg-brand2 disabled:opacity-50 text-white rounded-lg px-4 py-3 font-semibold transition-colors">
                  {loading ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="w-20 h-20 rounded-full bg-amber/20 flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">⏳</span>
              </div>
              <h1 className="text-2xl font-bold text-text mb-2">Profile submitted for verification</h1>
              <p className="text-text2 mb-2">Our team will review your profile within 24 hours.</p>
              <p className="text-text3 text-sm mb-8">You'll be notified via email and WhatsApp.</p>
              <div className="bg-amber/10 border border-amber/30 rounded-xl p-4 mb-8">
                <p className="text-amber text-sm font-medium">Verification Status: Pending Review</p>
              </div>
              <button onClick={() => router.push('/studio')}
                className="w-full bg-brand hover:bg-brand2 text-white rounded-lg px-4 py-3 font-semibold transition-colors">
                Meanwhile, explore the AI Studio
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
