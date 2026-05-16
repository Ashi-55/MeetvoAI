'use client';

import { useState } from 'react';
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
});
const passwordSchema = z.object({
  new_password: z.string().min(8, 'At least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.new_password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, builderProfile } = useAuth();
  const setProfile = useAuthStore((s) => s.setProfile);
  const [tab, setTab] = useState<'profile' | 'security' | 'payments'>('profile');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const pForm = useForm<ProfileData>({ resolver: zodResolver(profileSchema), defaultValues: { full_name: profile?.full_name || '' } });
  const pwForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  async function saveProfile(data: ProfileData) {
    if (!user || !profile) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from('profiles').update({ full_name: data.full_name, updated_at: new Date().toISOString() }).eq('id', user.id);
    setProfile({ ...profile, full_name: data.full_name });
    setMsg('Profile updated');
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
