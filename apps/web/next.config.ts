import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Serve the SVG favicon for every common icon path browsers auto-request
    const iconPaths = [
      '/favicon.ico',
      '/apple-touch-icon.png',
      '/apple-touch-icon-precomposed.png',
      '/apple-touch-icon-57x57.png',
      '/apple-touch-icon-60x60.png',
      '/apple-touch-icon-72x72.png',
      '/apple-touch-icon-76x76.png',
      '/apple-touch-icon-114x114.png',
      '/apple-touch-icon-120x120.png',
      '/apple-touch-icon-144x144.png',
      '/apple-touch-icon-152x152.png',
      '/apple-touch-icon-180x180.png',
      '/browserconfig.xml',
      '/site.webmanifest',
    ];
    return iconPaths.map(source => ({ source, destination: '/favicon.svg' }));
  },
};

export default nextConfig;
