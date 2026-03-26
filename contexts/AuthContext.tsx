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
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('creator');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebase();
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const tokenResult = await u.getIdTokenResult();
        setRole((tokenResult.claims.role as UserRole) || 'creator');
      } else {
        setRole('creator');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    const { auth, googleProvider } = getFirebase();
    await signInWithPopup(auth, googleProvider);
  }

  async function signOut() {
    const { auth } = getFirebase();
    await firebaseSignOut(auth);
  }

  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider value={{ user, role, loading, isAdmin, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
