"use client";

import { useEffect, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import type { Profile } from "@/types";

export function useAuth() {
  const supabase = createSupabaseBrowserClient();
  const { profile, setProfile } = useAuthStore();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setSession(data.session ?? null);
      if (data.session?.user) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.session.user.id)
          .single();
        if (prof) setProfile(prof as Profile);
      }
      setLoading(false);
    })();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession);
        if (newSession?.user) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", newSession.user.id)
            .single();
          if (prof) setProfile(prof as Profile);
        } else {
          setProfile(null);
        }
      }
    );
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setProfile, supabase]);

  return { session, profile, loading, supabase };
}
