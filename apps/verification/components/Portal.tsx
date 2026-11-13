'use client';

import { CheckCircle2, ListChecks, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { StaffGate, StaffShell } from '@fm/ui';
import { client } from '@/lib/client';

const nav = [
  { href: '/', label: 'Queue', icon: <ListChecks /> },
  { href: '/flagged', label: 'Flagged by checks', icon: <Sparkles /> },
  { href: '/completed', label: 'Completed', icon: <CheckCircle2 /> },
];

/** Sign-in gate plus the portal layout. Verifiers and admins only. */
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
    <StaffGate client={client} portal="Verification" roles={['VERIFIER']}>
      <StaffShell portal="Verification" nav={nav} active={active} title={title} actions={actions}>
        {children}
      </StaffShell>
    </StaffGate>
  );
}
