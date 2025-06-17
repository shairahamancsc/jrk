
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
  const [isLoading, setIsLoading] = useState(true); //isLoading is for initial auth state determination
  const router = useRouter();
  // usePathname hook to get current pathname within the AuthProvider scope if needed by callbacks
  // but be careful with how it's used if the main effect has an empty dependency array.
  // For simple redirection based on auth state, router is usually enough.

  useEffect(() => {
    // This effect runs once on mount to set up the auth listener and check initial session.
    setIsLoading(true); 

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        const currentPathname = window.location.pathname; // Get current pathname directly
        console.log('[AuthContext] Auth state change event:', event, 'on path:', currentPathname, 'New session:', newSession);
        
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);

        // This 'isLoading' check ensures this block only runs for the initial auth state determination.
        // Subsequent calls to onAuthStateChange will fall into the 'else' block.
        if (isLoading) {
          setIsLoading(false); // Auth state determined, set loading to false.
          if (currentUser) {
            if (currentPathname === '/login' || currentPathname === '/') {
              router.replace('/dashboard');
            }
          } else {
            if (currentPathname !== '/login' && currentPathname !== '/all-labor') {
              router.replace('/login');
            }
          }
        } else {
          // Handle subsequent auth changes (e.g., user logs out from another tab, token refresh, etc.)
          // This logic might need refinement based on desired behavior for background changes.
          if (event === 'SIGNED_IN') {
            if (currentPathname === '/login' || currentPathname === '/') {
               router.replace('/dashboard');
            }
          } else if (event === 'SIGNED_OUT') {
            if (currentPathname !== '/login' && currentPathname !== '/all-labor') {
              router.replace('/login');
            }
          }
        }
      }
    );

    // Check initial session state more robustly.
    const checkInitialSession = async () => {
      // Only proceed if isLoading is still true (i.e., onAuthStateChange hasn't resolved it yet).
      if (isLoading) { 
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        const currentPathname = window.location.pathname;
        console.log('[AuthContext] Initial session check:', initialSession, 'on path:', currentPathname);
        
        // If isLoading is still true after getSession (onAuthStateChange might have fired in parallel)
        // then this is the point where we establish the initial auth state if not already done.
        if (isLoading) {
          setSession(initialSession);
          const initialUser = initialSession?.user ?? null;
          setUser(initialUser);
          setIsAuthenticated(!!initialUser);
          setIsLoading(false); // Initial auth state determined

          if (initialUser) {
            if (currentPathname === '/login' || currentPathname === '/') {
              router.replace('/dashboard');
            }
          } else {
            if (currentPathname !== '/login' && currentPathname !== '/all-labor') {
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
  }, []); // Empty dependency array: run this effect only once on mount.

  const login = async (credentials: LoginFormData) => {
    // setIsLoading(true); // REMOVED: AuthContext.isLoading is for initial load. Login page handles its own button state.
    const { error, data: loginData } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });
    // setIsLoading(false); // REMOVED

    if (error) {
      console.error('[AuthContext] Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid email or password.",
      });
      throw error; // Re-throw for the form to handle if needed
    } else if (loginData?.user) {
      // onAuthStateChange will handle setting user, session, and navigation.
      // A success toast here can be good feedback before onAuthStateChange triggers redirect.
      toast({
        title: "Login Attempt Successful",
        description: "Checking session and redirecting...",
      });
    } else if (!loginData?.session && !loginData?.user) {
        // This case might indicate issues like email not confirmed if that setting is on.
        console.warn('[AuthContext] Login successful but no session/user data returned immediately. Possible MFA or email confirmation pending.');
        toast({
            variant: "default", // Not necessarily destructive
            title: "Login Acknowledged",
            description: "Further steps might be required (e.g., email confirmation)."
        });
    }
  };

  const logout = async () => {
    // setIsLoading(true); // REMOVED
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[AuthContext] Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Could not log out.",
      });
      // setIsLoading(false); // REMOVED (only if error previously set it true)
    } else {
      // onAuthStateChange will clear user/session and trigger navigation.
      // To make UI feel faster for logout:
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      router.push('/login'); // Explicitly navigate on logout
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
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

    