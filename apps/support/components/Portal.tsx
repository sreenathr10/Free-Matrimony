'use client';

import { BookText, Flag, Inbox, Ticket, UserSearch } from 'lucide-react';
import type { ReactNode } from 'react';
import { StaffGate, StaffShell } from '@fm/ui';
import { client } from '@/lib/client';

const nav = [
  { href: '/', label: 'Inbox', icon: <Inbox /> },
  { href: '/tickets', label: 'Tickets', icon: <Ticket />, badge: 'M7' },
  { href: '/reports', label: 'Reports and disputes', icon: <Flag />, badge: 'M7' },
  { href: '/members', label: 'Member lookup', icon: <UserSearch />, badge: 'M7' },
  { href: '/replies', label: 'Saved replies', icon: <BookText />, badge: 'M7' },
];

/** Sign-in gate plus the portal layout. Support agents and admins only. */
export function Portal({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <StaffGate client={client} portal="Customer Service" roles={['SUPPORT_AGENT']}>
      <StaffShell portal="Customer Service" nav={nav} active="/" title={title}>
        {children}
      </StaffShell>
    </StaffGate>
  );
}
