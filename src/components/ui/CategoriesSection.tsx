import Link from 'next/link';

const CATEGORY_IMAGES: Record<string, string> = {
  prendas: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&q=80',
  calzados: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&q=80',
};

export default function CategoriesSection() {
  return (
    <section className="py-16 bg-[color:var(--color-cream)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="eyebrow">Explorar</p>
        <h2 className="font-display text-3xl sm:text-4xl mb-8">Por categoría</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <CategoryCard label="Prendas" href="#catalogo" image={CATEGORY_IMAGES.prendas} />
          <CategoryCard label="Calzado" href="#catalogo" image={CATEGORY_IMAGES.calzados} />
        </div>
      </div>
    </section>
  );
}

function CategoryCard({
  label,
  href,
  image,
}: {
  label: string;
  href: string;
  image: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block aspect-[4/3] overflow-hidden rounded-lg"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(74,55,41,.4), rgba(74,55,41,.2)), url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 flex flex-col justify-end p-6 text-[color:var(--color-shell)]">
        <h3 className="font-display text-3xl sm:text-4xl">{label}</h3>
        <span className="mt-2 text-xs uppercase tracking-[.2em] opacity-90">Ver →</span>
      </div>
    </Link>
  );
}
