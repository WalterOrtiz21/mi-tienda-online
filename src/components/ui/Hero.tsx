import Link from 'next/link';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1600&q=80';

export default function Hero({
  eyebrow = 'Otoño / Invierno 2026',
  title = 'Vestite con\nintención.',
  ctaLabel = 'Ver colección',
  ctaHref = '#catalogo',
  image = DEFAULT_IMAGE,
}: {
  eyebrow?: string;
  title?: string;
  ctaLabel?: string;
  ctaHref?: string;
  image?: string;
}) {
  return (
    <section
      className="relative h-[60vh] sm:h-[75vh] -mt-16 flex items-end"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(74,55,41,.35), rgba(139,125,107,.35)), url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 text-[color:var(--color-shell)] w-full">
        <p className="eyebrow !text-[color:var(--color-shell)] opacity-90">{eyebrow}</p>
        <h1 className="font-display text-4xl sm:text-6xl mt-3 max-w-2xl whitespace-pre-line">
          {title}
        </h1>
        <Link
          href={ctaHref}
          className="inline-block mt-6 text-xs uppercase tracking-[.2em] border-b border-[color:var(--color-shell)] pb-1"
        >
          {ctaLabel} →
        </Link>
      </div>
    </section>
  );
}
