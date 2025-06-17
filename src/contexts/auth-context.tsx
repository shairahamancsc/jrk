
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
    setIsLoading(true);
    // Get the subscription object correctly
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('[AuthContext] Auth state change event:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
        
        // This logic should only run if isLoading is true to avoid loops on every auth change
        // after initial load.
        if (isLoading) { 
            setIsLoading(false); // Set loading to false once the first auth event is processed
            if (session?.user) {
                if (pathname === '/login' || pathname === '/') {
                    router.replace('/dashboard');
                }
            } else {
                if (pathname !== '/login' && pathname !== '/all-labor') {
                    router.replace('/login');
                }
            }
        } else if (event === 'SIGNED_IN' && (pathname === '/login' || pathname === '/')) {
          // If already loaded and a new sign-in happens, redirect from login/root
          router.replace('/dashboard');
        } else if (event === 'SIGNED_OUT' && pathname !== '/login' && pathname !== '/all-labor') {
          // If signed out and not on an allowed unauthenticated page, redirect to login
          router.replace('/login');
        }
      }
    );

    // Check initial session state only once on mount if subscription hasn't fired yet
    // and isLoading is still true.
    const checkInitialSession = async () => {
      if (isLoading) { // Only check if we haven't received an auth event yet
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        console.log('[AuthContext] Initial session check (if no event yet):', initialSession);
        
        // If onAuthStateChange hasn't set isLoading to false yet, handle initial state.
        if (isLoading) { 
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          setIsAuthenticated(!!initialSession?.user);
          setIsLoading(false); 

          if (initialSession?.user) {
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
      // Call unsubscribe on the subscription object
      subscription?.unsubscribe();
    };
  }, [pathname, router, isLoading]); // isLoading included to manage its state properly


  const login = async (credentials: LoginFormData) => {
    setIsLoading(true);
    const { error, data: loginData } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      console.error('[AuthContext] Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
      });
      setIsLoading(false);
      throw error;
    } else if (loginData.user) {
      // onAuthStateChange will handle setting user, session.
      // setIsLoading(false) will also be handled by onAuthStateChange.
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      // Explicit navigation can be handled by onAuthStateChange or here if preferred.
      // router.replace('/dashboard'); 
    } else {
      // Should not happen if no error, but good to handle
      toast({
        variant: "destructive",
        title: "Login Issue",
        description: "An unexpected issue occurred during login.",
      });
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[AuthContext] Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Could not log out.",
      });
      setIsLoading(false);
    } else {
      // onAuthStateChange will clear user/session.
      // Explicitly set local state immediately for faster UI update.
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      router.push('/login'); 
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
       // setIsLoading(false) will be handled by onAuthStateChange.
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
