'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name required'),
  title: z.string().optional(),
  bio: z.string().optional(),
  linkedin_url: z.string().optional(),
  experience_years: z.coerce.number().min(0).optional(),
  whatsapp_number: z.string().optional(),
  specialties: z.string().optional(),
  skills: z.string().optional(),
  languages: z.string().optional(),
  business_name: z.string().optional(),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  needs: z.string().optional(),
  budget_range: z.string().optional(),
  description: z.string().optional(),
});
const passwordSchema = z.object({
  new_password: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.new_password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, buyerProfile, builderProfile } = useAuth();
  const setProfile = useAuthStore((s) => s.setProfile);
  const setBuyerProfile = useAuthStore((s) => s.setBuyerProfile);
  const setBuilderProfile = useAuthStore((s) => s.setBuilderProfile);
  const [tab, setTab] = useState<'profile' | 'security' | 'payments'>('profile');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const pForm = useForm<ProfileData>({ resolver: zodResolver(profileSchema), defaultValues: { full_name: '' } });
  const pwForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });
  const isBuilder = profile?.current_mode === 'builder';

  useEffect(() => {
    if (!profile) return;
    pForm.reset({
      full_name: profile.full_name || '',
      title: builderProfile?.title || '',
      bio: builderProfile?.bio || '',
      linkedin_url: builderProfile?.linkedin_url || '',
      experience_years: builderProfile?.experience_years || 0,
      whatsapp_number: (isBuilder ? (builderProfile as any)?.whatsapp_number : (buyerProfile as any)?.whatsapp_number) || '',
      specialties: builderProfile?.specialties?.join(', ') || '',
      skills: builderProfile?.skills?.join(', ') || '',
      languages: builderProfile?.languages?.join(', ') || '',
      business_name: buyerProfile?.business_name || '',
      industry: buyerProfile?.industry || '',
      company_size: (buyerProfile as any)?.company_size || '',
      location: buyerProfile?.location || '',
      website: buyerProfile?.website || '',
      needs: buyerProfile?.needs?.join(', ') || '',
      budget_range: buyerProfile?.budget_range || '',
      description: buyerProfile?.description || '',
    });
  }, [profile, buyerProfile, builderProfile, isBuilder, pForm]);

  function list(value?: string) {
    return (value || '').split(',').map((item) => item.trim()).filter(Boolean);
  }

  async function saveProfile(data: ProfileData) {
    if (!user || !profile) return;
    setSaving(true);
    const supabase = createClient();
    const { error: profileError } = await supabase.from('profiles').update({ full_name: data.full_name, updated_at: new Date().toISOString() }).eq('id', user.id);

    let detailError = null;
    if (isBuilder) {
      const languages = list(data.languages);
      const result = await supabase.from('builder_profiles').upsert({
        id: user.id,
        title: data.title || null,
        bio: data.bio || null,
        linkedin_url: data.linkedin_url || null,
        experience_years: Number(data.experience_years || 0),
        whatsapp_number: data.whatsapp_number || null,
        specialties: list(data.specialties),
        skills: list(data.skills),
        languages: languages.length ? languages : ['English'],
      }).select('*').maybeSingle();
      detailError = result.error;
      if (result.data) setBuilderProfile(result.data);
    } else {
      const result = await supabase.from('buyer_profiles').upsert({
        id: user.id,
        business_name: data.business_name || null,
        industry: data.industry || null,
        company_size: data.company_size || null,
        location: data.location || null,
        website: data.website || null,
        whatsapp_number: data.whatsapp_number || null,
        needs: list(data.needs),
        budget_range: data.budget_range || null,
        description: data.description || null,
      }).select('*').maybeSingle();
      detailError = result.error;
      if (result.data) setBuyerProfile(result.data);
    }

    if (profileError || detailError) {
      setMsg(`Error: ${profileError?.message || detailError?.message || 'Unable to update profile'}`);
    } else {
      setProfile({ ...profile, full_name: data.full_name });
      setMsg('Profile updated');
    }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function changePassword(data: PasswordData) {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.new_password });
    if (error) setMsg('Error: ' + error.message);
    else { setMsg('Password updated'); pwForm.reset(); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function cancelSubscription() {
    if (!confirm('Cancel your subscription?')) return;
    const supabase = createClient();
    await supabase.from('builder_profiles').update({ subscription_status: 'cancelled' }).eq('id', user!.id);
    setMsg('Subscription cancelled');
    setTimeout(() => setMsg(''), 3000);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button type="button" onClick={() => router.back()}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-surface2 p-2 text-text2 hover:bg-surface hover:text-text transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h1 className="text-2xl font-bold text-text">Settings</h1>
      </div>

      <div className="flex gap-1 p-1 bg-surface rounded-xl border border-border w-fit mb-8">
        {(['profile', 'security', 'payments'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${tab === t ? 'bg-brand text-white' : 'text-text2 hover:text-text'}`}>
            {t}
          </button>
        ))}
      </div>

      {msg && <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${msg.startsWith('Error') ? 'bg-red/10 border-red/30 text-red' : 'bg-green/10 border-green/30 text-green'}`}>{msg}</div>}

      {tab === 'profile' && (
        <div className="bg-surface border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-text">Profile Information</h2>
          <form onSubmit={pForm.handleSubmit(saveProfile)} className="space-y-4">
            <div>
              <label className="block text-sm text-text2 mb-1.5">Full Name</label>
              <input {...pForm.register('full_name')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
              {pForm.formState.errors.full_name && <p className="text-red text-xs mt-1">{pForm.formState.errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-text2 mb-1.5">Email</label>
              <input value={profile?.email || ''} disabled className="w-full bg-surface3 border border-border rounded-lg px-4 py-3 text-text3 cursor-not-allowed" />
            </div>

            {isBuilder ? (
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm text-text2 mb-1.5">Professional Title</label>
                  <input {...pForm.register('title')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-text2 mb-1.5">Bio</label>
                  <textarea {...pForm.register('bio')} rows={4} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors resize-none" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm text-text2 mb-1.5">LinkedIn URL</label>
                    <input {...pForm.register('linkedin_url')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-text2 mb-1.5">Experience Years</label>
                    <input {...pForm.register('experience_years')} type="number" min="0" className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-text2 mb-1.5">WhatsApp Number</label>
                  <input {...pForm.register('whatsapp_number')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-text2 mb-1.5">Specialties</label>
                  <input {...pForm.register('specialties')} placeholder="WhatsApp Automation, Lead Generation Bots" className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm text-text2 mb-1.5">Skills</label>
                    <input {...pForm.register('skills')} placeholder="Python, n8n, LangChain" className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-text2 mb-1.5">Languages</label>
                    <input {...pForm.register('languages')} placeholder="English, Hindi" className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm text-text2 mb-1.5">Business Name</label>
                  <input {...pForm.register('business_name')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm text-text2 mb-1.5">Industry</label>
                    <input {...pForm.register('industry')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-text2 mb-1.5">Company Size</label>
                    <input {...pForm.register('company_size')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm text-text2 mb-1.5">Location</label>
                    <input {...pForm.register('location')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="block text-sm text-text2 mb-1.5">Website</label>
                    <input {...pForm.register('website')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-text2 mb-1.5">WhatsApp Number</label>
                  <input {...pForm.register('whatsapp_number')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-text2 mb-1.5">AI Needs</label>
                  <input {...pForm.register('needs')} placeholder="Lead qualification, WhatsApp automation" className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-text2 mb-1.5">Budget Range</label>
                  <input {...pForm.register('budget_range')} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-sm text-text2 mb-1.5">Main Challenge</label>
                  <textarea {...pForm.register('description')} rows={3} className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text outline-none transition-colors resize-none" />
                </div>
              </div>
            )}

            <button type="submit" disabled={saving}
              className="bg-brand hover:bg-brand2 disabled:opacity-50 text-white rounded-lg px-6 py-2.5 font-semibold transition-colors">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {tab === 'security' && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="font-semibold text-text mb-5">Change Password</h2>
          <form onSubmit={pwForm.handleSubmit(changePassword)} className="space-y-4">
            {(['new_password', 'confirm'] as const).map((field) => (
              <div key={field}>
                <label className="block text-sm text-text2 mb-1.5">{field === 'new_password' ? 'New Password' : 'Confirm Password'}</label>
                <input {...pwForm.register(field)} type="password" placeholder="••••••••"
                  className="w-full bg-surface2 border border-border focus:border-brand rounded-lg px-4 py-3 text-text placeholder-text3 outline-none transition-colors" />
                {pwForm.formState.errors[field] && <p className="text-red text-xs mt-1">{pwForm.formState.errors[field]?.message}</p>}
              </div>
            ))}
            <button type="submit" disabled={saving}
              className="bg-brand hover:bg-brand2 disabled:opacity-50 text-white rounded-lg px-6 py-2.5 font-semibold transition-colors">
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      )}

      {tab === 'payments' && (
        <div className="bg-surface border border-border rounded-xl p-6">
          <h2 className="font-semibold text-text mb-5">Subscription</h2>
          {builderProfile ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface2 rounded-xl">
                <div>
                  <p className="font-semibold text-text capitalize">{builderProfile.subscription_plan || 'No Plan'}</p>
                  <p className={`text-sm mt-0.5 ${builderProfile.subscription_status === 'active' ? 'text-green' : 'text-text3'}`}>
                    {builderProfile.subscription_status?.charAt(0).toUpperCase() + (builderProfile.subscription_status?.slice(1) || '')}
                  </p>
                </div>
                {builderProfile.subscription_status === 'active' && (
                  <button onClick={cancelSubscription} className="text-red text-sm hover:underline">Cancel</button>
                )}
              </div>
              {builderProfile.subscription_ends_at && (
                <p className="text-text3 text-sm">Renews on {new Date(builderProfile.subscription_ends_at).toLocaleDateString('en-IN')}</p>
              )}
              {builderProfile.subscription_plan === 'starter' && (
                <p className="text-text3 text-sm">AI Studio builds this month: {builderProfile.studio_builds_used}/10</p>
              )}
            </div>
          ) : (
            <p className="text-text3">No subscription. Subscribe from the AI Studio.</p>
          )}
        </div>
      )}
    </div>
  );
}
