'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { getFirebase } from '@/lib/firebase';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { auth } = getFirebase();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
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

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
