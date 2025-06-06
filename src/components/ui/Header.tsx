// src/components/ui/Header.tsx

interface HeaderProps {
  storeName?: string;
  whatsappNumber?: string;
  storeIcon?: string;
}

export default function Header({ 
  storeName = "Tu Tienda Online", 
  whatsappNumber = "+595 98 123 4567",
  storeIcon
}: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {storeIcon && (
              <img 
                src={storeIcon} 
                alt={`${storeName} logo`}
                className="w-8 h-8 object-contain"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900">{storeName}</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">WhatsApp: {whatsappNumber}</span>
          </div>
        </div>
      </div>
    </header>
  );
}