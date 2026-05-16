'use client';

import { useEffect, useState } from 'react';
import type { Profile } from '@/types';
import { supabase } from '@/lib/supabase';

export function useUser() {
  const [user, setUser] = useState<
    Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] | null
  >(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;

      if (!mounted) return;
      setUser(sessionUser);

      if (sessionUser) {
        const { data: p } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .maybeSingle();

        if (mounted) setProfile((p as Profile) ?? null);
      } else {
        if (mounted) setProfile(null);
      }

      if (mounted) setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (!sessionUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionUser.id)
        .maybeSingle();

      setProfile((p as Profile) ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}

