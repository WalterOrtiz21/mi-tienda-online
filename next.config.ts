/** @type {import('next').NextConfig} */
const nextConfig = {
  // Generar standalone output para Docker
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
  
  // 🎯 CONFIGURACIONES DE IMÁGENES
  images: {
    domains: ['localhost', 'unsplash.com', 'images.unsplash.com'],
    minimumCacheTTL: 300, // 5 minutos
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 🎯 HEADERS PARA SERVIR UPLOADS
  async headers() {
    return [
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, stale-while-revalidate=60',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, HEAD, OPTIONS',
          },
        ],
      },
      {
        source: '/api/upload/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type',
          },
        ],
      },
    ];
  },

  // 🎯 NO USAR REWRITES EN DESARROLLO - CAUSAN PROBLEMAS
  async rewrites() {
    // Solo usar rewrites en producción si es necesario
    if (process.env.NODE_ENV === 'production') {
      return [
        {
          source: '/uploads/:path*',
          destination: '/api/uploads/:path*',
        },
      ];
    }
    return [];
  },

  // Configuración experimental
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // 🎯 CONFIGURACIÓN DE WEBPACK
  webpack: (config: { resolve: { fallback: any; }; watchOptions: any; }, { isServer }: any) => {
    // Optimizaciones para el cliente
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // 🎯 WATCH OPTIONS PARA DESARROLLO
    if (process.env.NODE_ENV === 'development') {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules',
          '**/.git',
          '**/uploads/**', // Ignorar cambios en uploads
          '/home/womx/annyamodas/CONTENT/**', // Ignorar tu directorio específico
        ],
      };
    }

    return config;
  },

  // Configuración del compilador
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Configuración general
  telemetry: false,
  compress: true,
  trailingSlash: false,
  poweredByHeader: false,
  generateEtags: true,
  swcMinify: true,

  // Variables de entorno
  env: {
    UPLOADS_OPTIMIZED: 'true',
    CACHE_STRATEGY: 'balanced',
  },

  // 🎯 CONFIGURACIÓN ESPECÍFICA PARA DESARROLLO
  ...(process.env.NODE_ENV === 'development' && {
    // En desarrollo, configuraciones adicionales
    devIndicators: {
      buildActivity: true,
      buildActivityPosition: 'bottom-right',
    },
  }),
};

module.exports = nextConfig;