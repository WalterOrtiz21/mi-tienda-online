// src/components/ui/Footer.tsx

interface FooterProps {
  storeName?: string;
  whatsappNumber?: string;
}

export default function Footer({ 
  storeName = "Tu Tienda Online", 
  whatsappNumber = "+595 98 123 4567" 
}: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">{storeName}</h3>
            <p className="text-gray-400 mb-4">Perfumes y moda al mejor precio</p>
            <div className="flex space-x-4">
              <span>WhatsApp: {whatsappNumber}</span>
            </div>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Categorías</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Perfumes</li>
              <li>Ropa Mujer</li>
              <li>Ofertas</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Información</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Envíos</li>
              <li>Devoluciones</li>
              <li>Contacto</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 {storeName}. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}