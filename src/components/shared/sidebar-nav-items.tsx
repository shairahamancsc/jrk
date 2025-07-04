"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  LogOut,
  UserPlus, 
  Banknote,
  Wrench,
} from 'lucide-react';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';

const navItemsBase = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/labor', label: 'Labor Profiles', icon: Users },
  { href: '/attendance', label: 'Daily Attendance', icon: CalendarCheck },
  { href: '/payment-reports', label: 'Payment Reports', icon: Banknote },
  { href: '/tools', label: 'Tools', icon: Wrench },
];

const adminNavItems = [
  { href: '/admin/add-supervisor', label: 'Add Supervisor', icon: UserPlus },
];

export function SidebarNavItems() {
  const pathname = usePathname();
  const { logout, userRole } = useAuth();

  const currentNavItems = [
    ...navItemsBase,
    ...(userRole === 'admin' ? adminNavItems : []),
  ];

  return (
    <>
      <SidebarMenu>
        {currentNavItems.map((item) => (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              tooltip={{ children: item.label, className: "bg-primary text-primary-foreground" }}
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
      <div className="mt-auto p-2">
         <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2"
            onClick={logout}
          >
            <LogOut className="size-4 shrink-0" />
            <span className="group-data-[collapsible=icon]: