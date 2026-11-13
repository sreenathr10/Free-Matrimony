import { Badge, Card, buttonClass } from '@fm/ui';

const pillars = [
  {
    title: '100% verified',
    body: 'Every profile passes a selfie liveness check and a government ID check before anyone sees it. Inactive profiles are hidden automatically.',
  },
  {
    title: 'Made for families',
    body: 'Mom, dad and siblings get their own logins. You decide exactly what each person can see and do, and every action is labelled with who did it.',
  },
  {
    title: 'Matches that make sense',
    body: 'Daily picks explain why you match. Search by community, star, native district or the country you live in now.',
  },
  {
    title: 'Private by default',
    body: 'Photos stay blurred until you accept an interest. Phone numbers stay masked. Calls happen in the app.',
  },
];

export default function Home() {
  return (
    <div>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <span className="font-display text-xl font-semibold text-brand-600">Free Matrimony</span>
        <nav className="flex items-center gap-2">
          <a href="/login" className={buttonClass('ghost', 'sm')}>
            Log in
          </a>
          <a href="/login" className={buttonClass('primary', 'sm')}>
            Create a profile
          </a>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 md:pt-24">
        <Badge tone="verified">Every profile verified</Badge>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          Find your person. <span className="text-brand-600">Bring your family along.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink-muted">
          A modern matrimony app for Malayalis in Kerala, the Gulf and everywhere else. No fake profiles, no sales
          calls, one honest price.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a href="/login" className={buttonClass('primary', 'lg')}>
            Get started free
          </a>
          <a href="#how" className={buttonClass('secondary', 'lg')}>
            How it works
          </a>
        </div>
      </section>

      <section id="how" className="mx-auto grid max-w-6xl gap-4 px-6 pb-24 sm:grid-cols-2">
        {pillars.map((p) => (
          <Card key={p.title}>
            <h2 className="text-lg font-semibold">{p.title}</h2>
            <p className="mt-2 text-ink-muted">{p.body}</p>
          </Card>
        ))}
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-ink-muted">
        © {new Date().getFullYear()} Free Matrimony
      </footer>
    </div>
  );
}
