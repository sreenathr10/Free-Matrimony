import { BadgeCheck, Heart, Lock, MapPin, Sparkles, X } from 'lucide-react';

/** Illustrative product mock-up for the hero: a daily pick on a phone, with floating notifications. */
export function HeroPhone() {
  return (
    <div className="relative mx-auto w-full max-w-[22rem]">
      <div className="absolute -inset-10 -z-10 rounded-full bg-gradient-to-br from-brand-300/40 via-gold-200/30 to-transparent blur-3xl dark:from-brand-800/40" />

      {/* Phone */}
      <div className="relative rounded-[3rem] border border-white/60 bg-gradient-to-b from-zinc-900 to-zinc-800 p-3 shadow-[0_40px_80px_-20px_rgb(68_5_26/0.45)] dark:border-white/10">
        <div className="absolute left-1/2 top-5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
        <div className="overflow-hidden rounded-[2.4rem] bg-surface">
          <div className="flex items-center justify-between px-6 pb-3 pt-12">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-faint">
                Today’s picks
              </div>
              <div className="font-display text-xl font-semibold">For Anjali</div>
            </div>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>

          {/* Match card */}
          <div className="mx-4 mb-4 overflow-hidden rounded-3xl bg-surface-raised shadow-lift">
            <div className="relative h-64 overflow-hidden bg-gradient-to-br from-brand-300 via-brand-500 to-gold-400">
              <div className="absolute inset-0 opacity-60 [background:radial-gradient(circle_at_30%_35%,rgb(255_255_255/0.7),transparent_35%),radial-gradient(circle_at_70%_80%,rgb(122_18_48/0.6),transparent_45%)] blur-xl" />
              <div className="absolute inset-0 grid place-items-center">
                <div className="glass flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-ink">
                  <Lock className="h-3.5 w-3.5" /> Photo visible after you accept
                </div>
              </div>
              <div className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-brand-700 shadow">
                92% match
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1.5 text-lg font-semibold">
                Arjun, 31 <BadgeCheck className="h-5 w-5 text-verified" />
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-sm text-ink-muted">
                <MapPin className="h-3.5 w-3.5" /> Dubai · from Thrissur
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Architect', 'Nair', 'Rohini'].map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-medium text-ink-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <p className="mt-3 rounded-2xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-800 dark:bg-brand-950/40 dark:text-brand-200">
                <span className="font-bold">Why you match:</span> both in the UAE, families from
                Thrissur, and you both want to stay in the Gulf.
              </p>
              <div className="mt-4 flex gap-3">
                <span className="grid h-12 flex-1 place-items-center rounded-full border border-line-strong text-ink-muted">
                  <X className="h-5 w-5" />
                </span>
                <span className="grid h-12 flex-[2] place-items-center rounded-full bg-brand-gradient text-sm font-semibold text-white shadow-glow">
                  <span className="flex items-center gap-2">
                    <Heart className="h-4 w-4 fill-current" /> Send interest
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="absolute -left-20 top-20 hidden animate-float sm:block">
        <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface-raised p-3 pr-4 shadow-lift">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold-gradient text-sm font-bold text-brand-950">
            M
          </span>
          <div className="text-xs">
            <div className="font-semibold">Mother shortlisted Arjun</div>
            <div className="text-ink-muted">Family view · just now</div>
          </div>
        </div>
      </div>
      <div className="absolute -right-14 top-[15rem] hidden animate-float [animation-delay:-3s] sm:block">
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface-raised px-3.5 py-2.5 text-xs font-semibold shadow-lift">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-verified-soft text-verified">
            <BadgeCheck className="h-4 w-4" />
          </span>
          ID and selfie verified
        </div>
      </div>
    </div>
  );
}
