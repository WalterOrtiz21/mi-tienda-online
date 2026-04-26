import Wordmark from './Wordmark';

export default function Footer({
  storeName,
  whatsappNumber,
}: {
  storeName?: string;
  whatsappNumber?: string;
}) {
  const wpHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`
    : '#';

  return (
    <footer className="mt-20 bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <Wordmark size="lg" href={null} className="!text-[color:var(--color-shell)]" />
          <p className="mt-4 text-sm text-[color:var(--color-cream)] max-w-xs">
            {storeName ?? 'Annya Modas'} — prendas y calzados, hechos para que te animes.
          </p>
        </div>

        <div>
          <p className="eyebrow !text-[color:var(--color-tan)] mb-3">Ayuda</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={wpHref} target="_blank" rel="noopener" className="hover:underline">
                WhatsApp
              </a>
            </li>
            <li>Envíos a todo Paraguay</li>
            <li>Cambios y devoluciones</li>
          </ul>
        </div>

        <div>
          <p className="eyebrow !text-[color:var(--color-tan)] mb-3">Contacto</p>
          {whatsappNumber && <p className="text-sm">+{whatsappNumber}</p>}
          <p className="text-sm mt-2 text-[color:var(--color-cream)]">
            © {new Date().getFullYear()} Annya Modas
          </p>
        </div>
      </div>
    </footer>
  );
}
