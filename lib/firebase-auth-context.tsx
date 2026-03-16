import React, { createContext, useEffect, useState, ReactNode } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

export const FirebaseAuthContext = createContext<AuthContextType | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Monitorar estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function loginWithGoogle() {
    try {
      setError(null);
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao fazer login com Google';
      setError(errorMessage);
      throw err;
    }
  }

  async function loginWithApple() {
    try {
      setError(null);
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao fazer login com Apple';
      setError(errorMessage);
      throw err;
    }
  }

  async function logout() {
    try {
      setError(null);
      await signOut(auth);
    } catch (err: any) {
      const errorMessage = err?.message || 'Erro ao fazer logout';
      setError(errorMessage);
      throw err;
    }
  }

  return (
    <FirebaseAuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithApple, logout, error }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = React.useContext(FirebaseAuthContext);
  if (!context) {
    throw new Error('useFirebaseAuth deve ser usado dentro de FirebaseAuthProvider');
  }
  return context;
}
