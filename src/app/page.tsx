
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // If authenticated and on the root page, redirect to dashboard
        if (pathname === '/') {
          router.replace('/dashboard');
        }
        // If authenticated and on login page, redirect to dashboard
        else if (pathname === '/login') {
           router.replace('/dashboard');
        }
        // Otherwise, stay on the current authenticated page
      } else {
        // If not authenticated, and not already on login or /all-labor, redirect to login
        if (pathname !== '/login' && pathname !== '/all-labor') {
          router.replace('/login');
        }
        // If on root and not authenticated, redirect to login
        else if (pathname === '/') {
          router.replace('/login');
        }
      }
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
