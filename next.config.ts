// next.config.js - Configuración corregida

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Configuración de imágenes CRÍTICA
  images: {
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      'localhost',
      'annyamodas.com',
      'www.annyamodas.com'
    ],
    // ⭐ IMPORTANTE: Deshabilitar optimización para uploads
    unoptimized: true,
    // Formatos permitidos
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Configuración experimental
  experimental: {
    optimizeCss: true,
  },

  // Headers para imágenes
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, stale-while-revalidate=30'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          }
        ]
      }
    ];
  },

  poweredByHeader: false,
  trailingSlash: false,
  compress: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;