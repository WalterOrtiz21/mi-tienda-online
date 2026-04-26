import { Truck, MessageCircle } from 'lucide-react';

export default function ServiceBar({ whatsappNumber }: { whatsappNumber?: string }) {
  return (
    <div className="bg-[color:var(--color-cocoa)] text-[color:var(--color-shell)] text-xs sm:text-sm py-2.5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-8 text-center">
        <span className="inline-flex items-center gap-2">
          <Truck className="w-4 h-4" /> Envíos a todo Paraguay
        </span>
        {whatsappNumber && (
          <span className="inline-flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> WhatsApp +{whatsappNumber}
          </span>
        )}
      </div>
    </div>
  );
}
