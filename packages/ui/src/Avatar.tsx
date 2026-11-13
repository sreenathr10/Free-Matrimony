import { cn } from './cn';

const gradients = [
  'from-brand-400 to-brand-700',
  'from-gold-300 to-gold-600',
  'from-rose-400 to-fuchsia-600',
  'from-amber-300 to-brand-500',
  'from-pink-400 to-rose-700',
];

/** Photo, or initials on a brand gradient chosen from the name. */
export function Avatar({ name, src, size = 44, className, ring }: { name: string; src?: string | null; size?: number; className?: string; ring?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');
  const g = gradients[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % gradients.length];
  return (
    <span
      className={cn(
        'relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br font-semibold text-white',
        g,
        ring && 'ring-4 ring-surface-raised',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
