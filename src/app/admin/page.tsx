// src/app/admin/page.tsx

'use client';

import { Package, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react';
import { useProducts } from '@/contexts/ProductsContext';
import { formatPrice } from '@/lib/products';

export default function AdminDashboard() {
  const { products, settings, isLoading } = useProducts();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const totalProducts = products.length;
  const inStockProducts = products.filter(p => p.inStock).length;
  const outOfStockProducts = totalProducts - inStockProducts;
  const totalValue = products.reduce((sum, p) => sum + p.price, 0);
  const averagePrice = totalProducts > 0 ? totalValue / totalProducts : 0;

  // Productos por categoría
  const perfumesCount = products.filter(p => p.category === 'perfumes').length;
  const ropaCount = products.filter(p => p.category === 'ropa').length;

  // Productos con descuento
  const productsWithDiscount = products.filter(p => 
    p.originalPrice && p.originalPrice > p.price
  ).length;

  const stats = [
    {
      name: 'Total Productos',
      value: totalProducts,
      icon: Package,
      color: 'bg-blue-500',
      description: `${perfumesCount} perfumes, ${ropaCount} ropa`
    },
    {
      name: 'En Stock',
      value: inStockProducts,
      icon: ShoppingBag,
      color: 'bg-green-500',
      description: `${outOfStockProducts} agotados`
    },
    {
      name: 'Con Descuento',
      value: productsWithDiscount,
      icon: TrendingUp,
      color: 'bg-orange-500',
      description: `${Math.round((productsWithDiscount/totalProducts)*100) || 0}% del total`
    },
    {
      name: 'Precio Promedio',
      value: formatPrice(averagePrice),
      icon: DollarSign,
      color: 'bg-purple-500',
      description: `Valor total: ${formatPrice(totalValue)}`
    }
  ];

  const recentProducts = products
    .sort((a, b) => b.id - a.id) // Ordenar por ID descendente (más recientes primero)
    .slice(0, 5);

  const topRatedProducts = products
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Resumen de {settings.storeName} - WhatsApp: {settings.whatsappNumber}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Productos Recientes</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentProducts.length > 0 ? (
              recentProducts.map((product) => (
                <div key={product.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="ml-4">
                      <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">
                        {product.category} • ID: {product.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900">
                      {formatPrice(product.price)}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      product.inStock 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.inStock ? 'En Stock' : 'Agotado'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay productos aún. ¡Agrega tu primer producto!
              </div>
            )}
          </div>
        </div>

        {/* Top Rated Products */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Mejor Valorados</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {topRatedProducts.length > 0 ? (
              topRatedProducts.map((product, index) => (
                <div key={product.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                    }`}>
                      {index + 1}
                    </div>
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover ml-3"
                    />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-900">{product.name}</h3>
                      <p className="text-sm text-gray-500">⭐ {product.rating}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {formatPrice(product.price)}
                  </span>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No hay productos para mostrar
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Category Distribution */}
      {totalProducts > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Categoría</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                <span className="text-sm font-medium">Perfumes</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{perfumesCount}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(perfumesCount / totalProducts) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {Math.round((perfumesCount / totalProducts) * 100)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-pink-500 rounded mr-3"></div>
                <span className="text-sm font-medium">Ropa</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{ropaCount}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-pink-500 h-2 rounded-full" 
                    style={{ width: `${(ropaCount / totalProducts) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500 w-12 text-right">
                  {Math.round((ropaCount / totalProducts) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}