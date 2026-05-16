'use client';

import { create } from 'zustand';
import type { User } from '@supabase/supabase-js';
import type { Profile, BuyerProfile, BuilderProfile } from '@/types';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  buyerProfile: BuyerProfile | null;
  builderProfile: BuilderProfile | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setBuyerProfile: (bp: BuyerProfile | null) => void;
  setBuilderProfile: (bp: BuilderProfile | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  buyerProfile: null,
  builderProfile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setBuyerProfile: (buyerProfile) => set({ buyerProfile }),
  setBuilderProfile: (builderProfile) => set({ builderProfile }),
  setLoading: (isLoading) => set({ isLoading }),
  signOut: () => set({ user: null, profile: null, buyerProfile: null, builderProfile: null }),
}));
