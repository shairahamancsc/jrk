
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Session, User, AuthChangeEvent, Subscription } from '@supabase/supabase-js';
import type { LoginFormData } from '@/schemas/auth-schema';
import { useToast } from "@/hooks/use-toast";


interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  login: (credentials: LoginFormData) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    // Set loading true at the start of the effect when the listener is being set up.
    // This isLoading state is primarily for the initial auth status determination.
    setIsLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        console.log('[AuthContext] Auth state change event:', event, newSession);
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);

        // This logic determines if we are still in the initial loading phase.
        // If isLoading is true, it means this is the first auth event (or result of getSession)
        // that definitively sets the auth state.
        if (isLoading) {
          setIsLoading(false); // Initial auth state determined, set loading to false.
          if (currentUser) {
            if (pathname === '/login' || pathname === '/') {
              router.replace('/dashboard');
            }
          } else {
            if (pathname !== '/login' && pathname !== '/all-labor') {
              router.replace('/login');
            }
          }
        } else {
          // If not initial loading, handle subsequent auth changes (e.g., explicit sign-in/out)
          if (event === 'SIGNED_IN' && (pathname === '/login' || pathname === '/')) {
            router.replace('/dashboard');
          } else if (event === 'SIGNED_OUT' && pathname !== '/login' && pathname !== '/all-labor') {
            router.replace('/login');
          }
        }
      }
    );

    // Check initial session state more robustly if onAuthStateChange hasn't fired quickly
    const checkInitialSession = async () => {
      // Only proceed if isLoading is still true, meaning onAuthStateChange hasn't resolved auth state yet.
      if (isLoading) {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log('[AuthContext] Initial session check:', initialSession);
        
        // If isLoading is still true after getSession (i.e., onAuthStateChange hasn't updated it yet)
        // then this is the point where we establish the initial auth state.
        if (isLoading) {
          setSession(initialSession);
          const initialUser = initialSession?.user ?? null;
          setUser(initialUser);
          setIsAuthenticated(!!initialUser);
          setIsLoading(false); // Initial auth state determined

          if (initialUser) {
            if (pathname === '/login' || pathname === '/') {
              router.replace('/dashboard');
            }
          } else {
            if (pathname !== '/login' && pathname !== '/all-labor') {
              router.replace('/login');
            }
          }
        }
      }
    };

    checkInitialSession();

    return () => {
      // Cleanup: unsubscribe from the auth state listener
      subscription?.unsubscribe();
    };
  }, [pathname, router]); // Dependencies: re-run if pathname or router instance changes.

  const login = async (credentials: LoginFormData) => {
    setIsLoading(true); // Indicate loading during login process
    const { error, data: loginData } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    setIsLoading(false); // Reset loading state after login attempt

    if (error) {
      console.error('[AuthContext] Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
      });
      throw error;
    } else if (loginData.user) {
      // onAuthStateChange will handle setting user, session, and navigation.
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Login Issue",
        description: "An unexpected issue occurred during login.",
      });
    }
  };

  const logout = async () => {
    setIsLoading(true); // Indicate loading during logout process
    const { error } = await supabase.auth.signOut();
    // setIsLoading(false) will be effectively handled by onAuthStateChange setting the new state,
    // or we can set it here if preferred for immediate UI feedback before listener fires.
    // For simplicity, onAuthStateChange will manage isLoading to false after SIGNED_OUT.

    if (error) {
      console.error('[AuthContext] Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Could not log out.",
      });
       setIsLoading(false); // Ensure loading is false on error too
    } else {
      // onAuthStateChange will clear user/session.
      // Setting local state immediately can make UI feel faster.
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      router.push('/login'); 
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      // isLoading will be set to false by onAuthStateChange
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, session, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
