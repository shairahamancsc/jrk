
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';
import type { LoginFormData } from '@/schemas/auth-schema'; // For login function signature
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
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthContext] Auth state change event:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session?.user);
        
        if (isLoading) { // Only run this logic during initial load check
            setIsLoading(false);
            if (session?.user) {
                if (pathname === '/login' || pathname === '/') {
                    router.replace('/dashboard');
                }
            } else {
                if (pathname !== '/login' && pathname !== '/all-labor') { // Allow access to /all-labor unauthenticated
                    router.replace('/login');
                }
            }
        }
      }
    );

    // Check initial session
    const checkInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      console.log('[AuthContext] Initial session check:', initialSession);
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsAuthenticated(!!initialSession?.user);
      setIsLoading(false); // Initial check complete

      if (initialSession?.user) {
        if (pathname === '/login' || pathname === '/') {
          router.replace('/dashboard');
        }
      } else {
        if (pathname !== '/login' && pathname !== '/all-labor') {
          router.replace('/login');
        }
      }
    };

    checkInitialSession();


    return () => {
      authListener?.unsubscribe();
    };
  }, [pathname, router]); // Add pathname and router to dependency array


  const login = async (credentials: LoginFormData) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
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
      throw error; // Re-throw to be caught by form
    } else {
      // onAuthStateChange will handle setting user, session, and redirecting
      // No need to manually push, but can show a toast here if desired for immediate feedback
      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });
      // router.push('/dashboard') is handled by onAuthStateChange effect
    }
    // setIsLoading(false); // onAuthStateChange will set loading to false
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
    } else {
      // onAuthStateChange will handle clearing user/session and redirecting
      setUser(null);
      setSession(null);
      setIsAuthenticated(false);
      router.push('/login'); // Explicit push to login after sign out
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    }
    setIsLoading(false);
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
