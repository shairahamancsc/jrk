
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
    console.log('[AuthContext] Setting up auth listener and initial check.');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        const currentPath = window.location.pathname; // Get current pathname directly
        console.log('[AuthContext] Auth state change event:', event, 'on path:', currentPath, 'New session:', newSession);
        
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);

        // This 'isLoading' check ensures this block only runs for the initial auth state determination.
        if (isLoading) {
          setIsLoading(false); 
          console.log('[AuthContext] Initial auth state determined. isLoading: false');
          if (currentUser) {
            if (currentPath === '/login' || currentPath === '/') {
              console.log('[AuthContext] User authenticated on login/root, redirecting to /dashboard');
              router.replace('/dashboard');
            }
          } else {
            if (currentPath !== '/login' && currentPath !== '/all-labor') {
              console.log('[AuthContext] User not authenticated, not on login or /all-labor, redirecting to /login');
              router.replace('/login');
            }
          }
        } else {
          // Handle subsequent auth changes (e.g., user logs out from another tab, token refresh, etc.)
          if (event === 'SIGNED_IN') {
            if (currentPath === '/login' || currentPath === '/') {
               router.replace('/dashboard');
            }
          } else if (event === 'SIGNED_OUT') {
            if (currentPath !== '/login' && currentPath !== '/all-labor') {
              router.replace('/login');
            }
          }
        }
      }
    );

    // Check initial session state more robustly.
    const checkInitialSession = async () => {
      if (isLoading) { 
        console.log('[AuthContext] Performing initial session check.');
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        const currentPath = window.location.pathname;

        if (sessionError) {
            console.error('[AuthContext] Error fetching initial session:', sessionError);
        }
        console.log('[AuthContext] Initial session check result:', initialSession, 'on path:', currentPath);
        
        if (isLoading) { // Check isLoading again as onAuthStateChange might have resolved it
          setSession(initialSession);
          const initialUser = initialSession?.user ?? null;
          setUser(initialUser);
          setIsAuthenticated(!!initialUser);
          setIsLoading(false); 
          console.log('[AuthContext] Initial session check complete. isLoading: false');

          if (initialUser) {
            if (currentPath === '/login' || currentPath === '/') {
              console.log('[AuthContext] User authenticated via initial check on login/root, redirecting to /dashboard');
              router.replace('/dashboard');
            }
          } else {
            if (currentPath !== '/login' && currentPath !== '/all-labor') {
              console.log('[AuthContext] User not authenticated via initial check, not on login or /all-labor, redirecting to /login');
              router.replace('/login');
            }
          }
        }
      }
    };

    checkInitialSession();

    return () => {
      console.log('[AuthContext] Unsubscribing from auth listener.');
      subscription?.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount.

  const login = async (credentials: LoginFormData) => {
    const { error, data: loginData } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
      options: {
        captchaToken: credentials.captchaToken, // Pass CAPTCHA token to Supabase
      }
    });

    if (error) {
      console.error('[AuthContext] Login error:', error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials or CAPTCHA issue.",
      });
      throw error; 
    } else if (loginData?.user) {
      toast({
        title: "Login Attempt Successful",
        description: "Checking session and redirecting...",
      });
      // onAuthStateChange will handle setting user, session, and navigation.
    } else if (!loginData?.session && !loginData?.user) {
        console.warn('[AuthContext] Login successful but no session/user data returned immediately. Possible MFA or email confirmation pending.');
        toast({
            variant: "default",
            title: "Login Acknowledged",
            description: "Further steps might be required (e.g., email confirmation or CAPTCHA)."
        });
    }
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('[AuthContext] Logout error:', error);
      toast({
        variant: "destructive",
        title: "Logout Failed",
        description: error.message || "Could not log out.",
      });
    } else {
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      router.push('/login'); 
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