'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { getFirebase } from '@/lib/firebase';

export type UserRole = 'admin' | 'creator';

interface AuthContextValue {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  isAdmin: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const { auth } = getFirebase();
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setRole(null);
        setAuthError(null);
        setLoading(false);
        return;
      }

      try {
        const token = await u.getIdToken();
        const res = await fetch(`${API_URL}/api/admin/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          await firebaseSignOut(auth);
          setUser(null);
          setRole(null);
          setAuthError('Sua conta não foi convidada para o sunOS. Fale com um administrador.');
          setLoading(false);
          return;
        }

        const profile = await res.json();
        setUser(u);
        setRole(profile.role as UserRole);
        setAuthError(null);
      } catch {
        await firebaseSignOut(auth);
        setUser(null);
        setRole(null);
        setAuthError('Não foi possível verificar seu acesso. Tente novamente.');
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    const { auth, googleProvider } = getFirebase();
    setAuthError(null);
    await signInWithPopup(auth, googleProvider);
  }

  async function signOut() {
    const { auth } = getFirebase();
    await firebaseSignOut(auth);
  }

  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider value={{ user, role, loading, isAdmin, authError, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
