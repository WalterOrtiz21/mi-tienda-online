import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Deshabilitar ESLint durante builds
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
