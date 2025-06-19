
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import SplashScreen from '@/components/shared/splash-screen'; // Import the SplashScreen

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

  // Show SplashScreen while initial authentication check is in progress
  if (isLoading) {
    return <SplashScreen />;
  }

  // Fallback content or null if navigation handles everything before render
  // This part is typically reached only briefly or if redirects haven't completed.
  // A splash screen is a good default here too if isLoading is false but redirects are pending.
  // However, the primary loading state is handled by `if (isLoading)` above.
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      {/* This content is shown if isLoading is false but redirection hasn't happened yet.
          For a cleaner experience, often this can be null or another generic loader,
          but SplashScreen is fine too if preferred. */}
      <SplashScreen />
    </div>
  );
}
