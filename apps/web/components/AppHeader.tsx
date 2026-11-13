'use client';

import { LogOut, Plus, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Logo, buttonClass } from '@fm/ui';
import { session } from '@/lib/api';

/** Top bar for logged-in member screens. */
export function AppHeader() {
  const router = useRouter();
  return (
    <header className="glass sticky top-0 z-40 border-b border-line/70">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <a href="/family" aria-label="Your family">
          <Logo size={30} />
        </a>
        <nav className="flex items-center gap-1">
          <a href="/family" aria-label="Family" className={buttonClass('ghost', 'sm')}>
            <Users className="h-4 w-4" /> <span className="hidden sm:inline">Family</span>
          </a>
          <a href="/profiles/new" aria-label="New profile" className={buttonClass('ghost', 'sm')}>
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New profile</span>
          </a>
          <button
            aria-label="Log out"
            className={buttonClass('ghost', 'sm')}
            onClick={() => {
              session.clear();
              router.push('/');
            }}
          >
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Log out</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
