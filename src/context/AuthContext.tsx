'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInAnonymously, 
  onAuthStateChanged,
  linkWithCredential,
  EmailAuthProvider,
  signOut as fbSignOut
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  isAnonymous: boolean;
  credits: number;
  createdAt?: any;
  updatedAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInGuest: () => Promise<void>;
  upgradeAccount: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isMockEnvironment = auth.app.options.apiKey === "mock-api-key-for-local-development";

  // Auto-login guest if no user is authenticated
  const signInGuest = async () => {
    try {
      setLoading(true);
      if (isMockEnvironment) {
        setUser({ uid: 'mock-user-123', isAnonymous: true } as unknown as User);
        setProfile({ uid: 'mock-user-123', isAnonymous: true, credits: 99 });
      } else {
        await signInAnonymously(auth);
      }
    } catch (err) {
      console.error("Error signing in anonymously:", err);
    } finally {
      setLoading(false);
    }
  };

  const upgradeAccount = async (email: string, password: string) => {
    if (isMockEnvironment) return;
    if (!auth.currentUser) throw new Error("No guest session active.");
    
    // Create credential for linking
    const credential = EmailAuthProvider.credential(email, password);
    
    // Link anonymous user with permanent email/password credential
    const userCredential = await linkWithCredential(auth.currentUser, credential);
    setUser(userCredential.user);
  };

  const signOut = async () => {
    if (!isMockEnvironment) {
      await fbSignOut(auth);
    }
    setProfile(null);
    setUser(null);
  };

  useEffect(() => {
    if (isMockEnvironment) {
      signInGuest();
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Listen to Firestore profile updates for real-time credit tracking
        const profileRef = doc(db, 'users', currentUser.uid);
        const unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
          } else {
            // Profile doc might not be created by trigger immediately, so mock it locally
            setProfile({
              uid: currentUser.uid,
              isAnonymous: currentUser.isAnonymous,
              credits: 30
            });
          }
          setLoading(false);
        }, (err) => {
          console.error("Profile sync error:", err);
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        // Automatically start anonymous login if not logged in
        signInGuest();
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInGuest, upgradeAccount, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
