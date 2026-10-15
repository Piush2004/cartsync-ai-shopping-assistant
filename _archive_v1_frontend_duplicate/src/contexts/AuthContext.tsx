'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

export interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string | null;
  credits: number;
  createdAt: string;
  preferences?: {
    style?: string[];
    sizes?: Record<string, string>;
    gender?: string;
  };
}

export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  credits: number;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  credits: 0,
  loading: true,
  signInWithGoogle: async () => {},
  signInWithEmail: async () => {},
  signUpWithEmail: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setCredits(0);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen for real-time user profile / credits updates
  useEffect(() => {
    if (!user) return;

    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserProfile;
          setUserProfile(data);
          setCredits(data.credits ?? 0);
        }
      },
      (error) => {
        console.error('Error listening to user profile:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
  };

  const handleSignOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
    setCredits(0);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        credits,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
