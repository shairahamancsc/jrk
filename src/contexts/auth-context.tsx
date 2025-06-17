
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Session, User, AuthChangeEvent, Subscription } from '@supabase/supabase-js';
import type { LoginFormData } from '@/schemas/auth-schema';
import { useToast } from "@/hooks/use-toast";
import type { UserRole } from '@/types';


interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  userRole: UserRole | null;
  login: (credentials: LoginFormData) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // isLoading for initial auth check
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    console.log('[AuthContext] Setting up auth listener and initial check.');
    setIsLoading(true);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        const currentPath = window.location.pathname;
        console.log('[AuthContext] Auth state change event:', event, 'on path:', currentPath, 'New session:', newSession);
        
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);
        setIsAuthenticated(!!currentUser);

        const roleFromMetadata = currentUser?.user_metadata?.role;
        if (roleFromMetadata === 'admin' || roleFromMetadata === 'supervisor') {
          setUserRole(roleFromMetadata);
        } else {
          setUserRole(null);
        }
        
        // This 'isLoading' check ensures this block only runs for the initial auth state determination.
        if (isLoading) { // Only act on isLoading if it's currently true
          setIsLoading(false); 
          console.log('[AuthContext] Initial auth state determined by listener. isLoading: false');
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
            // If already on login or all-labor, no redirect needed. Otherwise, go to login.
            if (currentPath !== '/login' && currentPath !== '/all-labor') {
              router.replace('/login');
            }
          }
        }
      }
    );

    // Check initial session state more robustly.
    const checkInitialSession = async () => {
      if (isLoading) { // Only run if still in initial loading phase
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

          const roleFromMetadata = initialUser?.user_metadata?.role;
          if (roleFromMetadata === 'admin' || roleFromMetadata === 'supervisor') {
            setUserRole(roleFromMetadata);
          } else {
            setUserRole(null);
          }

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
    // isLoading state in AuthContext is for initial load, not for login button state.
    // Login page will manage its own submission state.
    const { error, data: loginData } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
      options: {
        captchaToken: credentials.captchaToken,
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
        title: "Login Successful",
        description: "Redirecting...",
      });
      // onAuthStateChange will handle setting user, session, role and navigation.
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
      setUserRole(null);
      setIsAuthenticated(false);
      router.push('/login'); 
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, session, userRole, login, logout, isLoading }}>
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
