
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { userRole, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login'); // Should be handled by main authenticated layout, but good failsafe
      } else if (userRole !== 'admin') {
        router.replace('/dashboard'); // Or show an unauthorized page
      }
    }
  }, [userRole, isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-theme(spacing.14)-2*theme(spacing.4))] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (userRole !== 'admin') {
    // This content will be briefly shown before redirect kicks in, or if redirect fails.
    return (
      <div className="flex flex-col h-[calc(100vh-theme(spacing.14)-2*theme(spacing.4))] items-center justify-center space-y-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
        <p className="text-muted-foreground">You do not have permission to view this page.</p>
        <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
      </div>
    );
  }

  return <>{children}</>;
}
