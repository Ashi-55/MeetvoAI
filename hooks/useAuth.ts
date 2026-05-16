'use client';

import { useEffect } from 'react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Profile, BuyerProfile, BuilderProfile } from '@/types';

export function useAuth() {
  const { user, profile, buyerProfile, builderProfile, isLoading, setUser, setProfile, setBuyerProfile, setBuilderProfile, setLoading, signOut } = useAuthStore();

  useEffect(() => {
    const supabase = createClient();

    async function loadProfile(userId: string) {
      const [{ data: p }, { data: bp }, { data: blp }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('buyer_profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('builder_profiles').select('*').eq('id', userId).maybeSingle(),
      ]);
      if (p) setProfile(p as Profile);
      if (bp) setBuyerProfile(bp as BuyerProfile);
      if (blp) setBuilderProfile(blp as BuilderProfile);
    }

    supabase.auth.getSession().then((result: { data: { session: Session | null } }) => {
      const sessionUser = result.data.session?.user ?? null;
      setUser(sessionUser);
      if (sessionUser) {
        loadProfile(sessionUser.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        (async () => {
          await loadProfile(session.user.id);
          setLoading(false);
        })();
      } else {
        setProfile(null);
        setBuyerProfile(null);
        setBuilderProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, buyerProfile, builderProfile, isLoading, signOut };
}
