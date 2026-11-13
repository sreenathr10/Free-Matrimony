import {
  ArrowRight,
  BadgeCheck,
  EyeOff,
  Globe2,
  HeartHandshake,
  Lock,
  MessageCircleHeart,
  PhoneOff,
  ScanFace,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { Badge, Logo, Reveal, buttonClass } from '@fm/ui';
import { HeroPhone } from '@/components/landing/HeroPhone';

const trust = [
  { icon: ScanFace, label: 'Selfie and ID verified' },
  { icon: PhoneOff, label: 'No sales calls, ever' },
  { icon: Lock, label: 'Private by default' },
];

const places = [
  'Kochi',
  'Thrissur',
  'Thiruvananthapuram',
  'Kozhikode',
  'Dubai',
  'Abu Dhabi',
  'Doha',
  'Riyadh',
  'Muscat',
  'Kuwait City',
  'London',
  'Toronto',
  'New York',
  'Melbourne',
  'Singapore',
  'Dublin',
];

const features = [
  {
    icon: ShieldCheck,
    title: 'Every profile, verified',
    body: 'A live selfie and a government ID check before anyone can see a profile. Inactive profiles disappear automatically.',
    className: 'md:col-span-2',
    accent: true,
  },
  {
    icon: Users,
    title: 'Made for families',
    body: 'Mom, dad and siblings get their own logins, with the access you choose.',
  },
  {
    icon: Sparkles,
    title: 'Matches that make sense',
    body: 'Daily picks that tell you why you match, not just that you do.',
  },
  {
    icon: EyeOff,
    title: 'Photos stay blurred',
    body: 'Until you accept an interest. Location data is stripped from every upload.',
  },
  {
    icon: Star,
    title: 'Star and porutham',
    body: 'Optional horoscope matching for families who want it, ignored by those who don’t.',
  },
  {
    icon: Globe2,
    title: 'Kerala to everywhere',
    body: 'Search by native district or by the city you live in now, across the Gulf, the UK, North America and beyond.',
    className: 'md:col-span-3',
  },
];

const steps = [
  {
    n: '01',
    title: 'Create a profile',
    body: 'For yourself, or for a son, daughter or sibling. It takes about five minutes.',
  },
  {
    n: '02',
    title: 'Get verified',
    body: 'A quick selfie and ID check. The candidate gives consent before anything goes live.',
  },
  {
    n: '03',
    title: 'Meet your matches',
    body: 'Daily picks, smart search and private chat once both sides say yes.',
  },
];

const roles = [
  { who: 'You', perms: ['Everything', 'Privacy settings', 'Who sees what'] },
  { who: 'Mom and Dad', perms: ['Browse and shortlist', 'Send interests', 'Chat in family view'] },
  { who: 'Sister', perms: ['Browse and shortlist', 'Suggest profile edits'] },
];

export default function Home() {
  return (
    <div className="overflow-x-clip">
      {/* Navigation */}
      <header className="glass fixed inset-x-0 top-0 z-50 border-b border-line/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
          <a href="/" aria-label="Free Matrimony home">
            <Logo size={34} />
          </a>
          <nav className="hidden items-center gap-8 text-sm font-semibold text-ink-muted md:flex">
            <a href="#features" className="hover:text-ink">
              Features
            </a>
            <a href="#families" className="hover:text-ink">
              For families
            </a>
            <a href="#how" className="hover:text-ink">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <a href="/login" className={buttonClass('ghost', 'sm', 'hidden sm:inline-flex')}>
              Log in
            </a>
            <a href="/login" className={buttonClass('primary', 'sm')}>
              Join free
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-mesh pt-32 md:pt-40">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 pb-24 md:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <Reveal>
              <Badge tone="verified" icon={<BadgeCheck className="h-3.5 w-3.5" />}>
                Every profile ID-verified
              </Badge>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
                Find your person.
                <br />
                <span className="text-gradient italic">Bring your family along.</span>
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted md:text-xl">
                The modern matrimony app for Malayalis in Kerala, the Gulf and everywhere in
                between. Real people, honest pricing, and a family experience that finally makes
                sense.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="mt-9 flex flex-wrap gap-3">
              <a href="/login" className={buttonClass('primary', 'lg')}>
                Create a free profile <ArrowRight className="h-5 w-5" />
              </a>
              <a href="#how" className={buttonClass('secondary', 'lg')}>
                See how it works
              </a>
            </Reveal>
            <Reveal delay={0.2}>
              <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-ink-muted">
                {trust.map(({ icon: Icon, label }) => (
                  <li key={label} className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-raised text-brand-600 shadow-soft">
                      <Icon className="h-4 w-4" />
                    </span>
                    {label}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal delay={0.1} y={30}>
            <HeroPhone />
          </Reveal>
        </div>

        {/* Places marquee */}
        <div className="relative border-y border-line bg-surface-raised/60 py-5">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-surface to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-surface to-transparent" />
          <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-10 text-sm font-semibold uppercase tracking-[0.2em] text-ink-faint">
            {[...places, ...places].map((p, i) => (
              <span key={i} className="flex items-center gap-10">
                {p} <span className="text-gold-400">✦</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features bento */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
        <Reveal className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">
            Why it’s different
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Built on trust, <span className="text-gradient italic">not on sales calls.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {features.map(({ icon: Icon, title, body, className, accent }, i) => (
            <Reveal
              key={title}
              delay={i * 0.05}
              className={`group relative overflow-hidden rounded-card border p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-lift ${
                accent
                  ? 'border-transparent bg-brand-gradient text-white shadow-glow'
                  : 'border-line bg-surface-raised shadow-soft'
              } ${className ?? ''}`}
            >
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6 ${
                  accent
                    ? 'bg-white/15 text-white'
                    : 'bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300'
                }`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3>
              <p className={`mt-2 leading-relaxed ${accent ? 'text-white/85' : 'text-ink-muted'}`}>
                {body}
              </p>
              {accent && (
                <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-gold-300/30 blur-3xl" />
              )}
            </Reveal>
          ))}
        </div>
      </section>

      {/* Families */}
      <section id="families" className="scroll-mt-24 bg-surface-sunken py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 md:px-8 lg:grid-cols-2">
          <Reveal>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">
              For families
            </p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Everyone helps. You stay in charge.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ink-muted">
              Parents and siblings each get their own login. Every interest and message shows who
              sent it, and only you decide who can do what, including your privacy.
            </p>
            <ul className="mt-8 space-y-3 font-medium">
              {[
                'A profile only goes live with your own consent',
                'Change anyone’s access in one tap',
                'A shared shortlist the whole family can discuss',
              ].map((t) => (
                <li key={t} className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 shrink-0 text-verified" /> {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-brand-200/50 via-transparent to-gold-200/50 blur-2xl dark:from-brand-900/30 dark:to-gold-600/10" />
            <div className="grid gap-4">
              {roles.map((r, i) => (
                <div
                  key={r.who}
                  className="flex items-center gap-5 rounded-card border border-line bg-surface-raised p-5 shadow-soft"
                  style={{ marginLeft: `${i * 1.5}rem` }}
                >
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white ${i === 0 ? 'bg-brand-gradient' : i === 1 ? 'bg-gold-gradient text-brand-950' : 'bg-gradient-to-br from-pink-400 to-rose-600'}`}
                  >
                    <HeartHandshake className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold">{r.who}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.perms.map((p) => (
                        <span
                          key={p}
                          className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-xs font-medium text-ink-muted"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8 md:py-32">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">
            How it works
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight md:text-5xl">
            Three steps to your first match
          </h2>
        </Reveal>
        <div className="relative mt-16 grid gap-6 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent md:block" />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.1} className="relative text-center">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-line bg-surface-raised font-display text-2xl font-semibold text-brand-600 shadow-lift">
                {s.n}
              </div>
              <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs leading-relaxed text-ink-muted">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-24 md:px-8">
        <Reveal className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-brand-gradient px-8 py-16 text-center text-white shadow-glow md:py-24">
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-gold-300/30 blur-3xl" />
          <MessageCircleHeart className="mx-auto h-12 w-12 text-gold-200" />
          <h2 className="mx-auto mt-6 max-w-2xl font-display text-4xl font-semibold tracking-tight md:text-6xl">
            Your story starts with a verified hello.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-white/80">
            Free to join. Free to browse. No one will call you to sell anything.
          </p>
          <a href="/login" className={buttonClass('inverse', 'lg', 'mt-10')}>
            Create your profile <ArrowRight className="h-5 w-5" />
          </a>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-10 md:flex-row md:items-center md:px-8">
          <Logo size={30} />
          <nav className="flex flex-wrap gap-6 text-sm text-ink-muted">
            <a href="#features" className="hover:text-ink">
              Features
            </a>
            <a href="#families" className="hover:text-ink">
              For families
            </a>
            <a href="/login" className="hover:text-ink">
              Log in
            </a>
          </nav>
          <p className="text-sm text-ink-faint">© {new Date().getFullYear()} Free Matrimony</p>
        </div>
      </footer>
    </div>
  );
}
