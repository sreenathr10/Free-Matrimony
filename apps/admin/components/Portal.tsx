'use client';

import {
  CreditCard,
  LayoutDashboard,
  Megaphone,
  ShieldAlert,
  Users,
  UsersRound,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { StaffGate, StaffShell } from '@fm/ui';
import { client } from '@/lib/client';

const nav = [
  { href: '/', label: 'Overview', icon: <LayoutDashboard /> },
  { href: '/staff', label: 'Staff and roles', icon: <UsersRound /> },
  { href: '/members', label: 'Members', icon: <Users />, badge: 'M7' },
  { href: '/moderation', label: 'Moderation', icon: <ShieldAlert />, badge: 'M7' },
  { href: '/plans', label: 'Plans and pricing', icon: <CreditCard />, badge: 'M6' },
  { href: '/campaigns', label: 'Campaigns', icon: <Megaphone />, badge: 'M7' },
];

/** Sign-in gate plus the portal layout. Admins only. */
export function Portal({
  title,
  actions,
  children,
}: {
  title?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const path = usePathname();
  const active = nav.find((n) => n.href !== '/' && path.startsWith(n.href))?.href ?? '/';
  return (
    <StaffGate client={client} portal="Admin" roles={['ADMIN']}>
      <StaffShell portal="Admin" nav={nav} active={active} title={title} actions={actions}>
        {children}
      </StaffShell>
    </StaffGate>
  );
}
