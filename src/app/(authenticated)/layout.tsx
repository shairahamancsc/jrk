
"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation'; 
import { useAuth } from '@/contexts/auth-context';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { SidebarNavItems } from '@/components/shared/sidebar-nav-items';
import { ThemeToggle } from '@/components/shared/theme-toggle'; // Import ThemeToggle
import { Building2, Loader2 } from 'lucide-react';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, user, userRole } = useAuth(); 
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This effect should ONLY run on mount to set up listener & initial check
    // It should NOT depend on `pathname` or `router` for its core logic
    // to avoid re-triggering `setIsLoading(true)` on navigation.
    if (!isLoading && !isAuthenticated && pathname !== '/all-labor') {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router, pathname]); // Dependencies reviewed - this is fine as long as isLoading logic is robust

  if (isLoading) { 
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated && pathname !== '/all-labor') { 
     return ( 
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated && pathname === '/all-labor') {
    return <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fadeInPage">{children}</main>;
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r border-sidebar-border">
        <SidebarHeader className="items-center p-4">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-primary group-data-[collapsible=icon]:hidden font-headline">JRKE</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarNavItems />
        </SidebarContent>
        <SidebarFooter className="p-2 group-data-[collapsible=icon]:items-center">
           <p className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">© 2024 JRKE Attendance</p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          <div className="flex flex-1 items-center justify-end gap-4">
            <div className="text-sm text-muted-foreground">
              Logged in as: <span className="font-semibold text-primary">{user?.email || user?.id}</span>
              {userRole && (
                <span className="ml-2 capitalize text-xs font-medium bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                  {userRole}
                </span>
              )}
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fadeInPage">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
