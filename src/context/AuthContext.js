// Context Autentikasi KasirKu - Cek Sesi Awal & Listener Real-Time (onAuthStateChange)

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({
  session: null,
  user: null,
  cashierProfile: null,
  loading: true,
  signOut: async () => {},
});

/**
 * Mengubah object user Supabase menjadi format profil kasir yang dipakai UI KasirKu
 */
export const formatCashierProfile = (user) => {
  if (!user) return null;
  const fullName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Kasir';

  return {
    id: user.id,
    name: fullName,
    username: user.email || '',
    email: user.email || '',
    role: user.user_metadata?.role || 'Kasir',
  };
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Cek sesi awal saat aplikasi pertama kali dibuka
    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('[AuthContext] Error getSession:', error.message);
        }
        if (isMounted) {
          setSession(data?.session ?? null);
        }
      } catch (e) {
        console.warn('[AuthContext] Gagal cek sesi awal:', e?.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initSession();

    // 2. Dengarkan perubahan status login/logout secara real-time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (isMounted) {
        setSession(nextSession ?? null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  };

  const user = session?.user ?? null;
  const cashierProfile = formatCashierProfile(user);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        cashierProfile,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
