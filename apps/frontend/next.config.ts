import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
        pathname: '/lichess-org/lila/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
        pathname: '/lichess-org/lila/**',
      },
      {
        protocol: 'https',
        hostname: 'static.vecteezy.com',
        pathname: '/system/resources/thumbnails/068/599/133/large/editorial-one-piece-symbol-waving-flag-green-screen-background-free-video.jpg',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
        pathname: '/hampusborgos/country-flags/tree/main/svg/**',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
        pathname: '/w320/**',
      },
    ],
  },
  allowedDevOrigins: [
    'local-origin.dev',
    '*.local-origin.dev',
    '172.18.208.1:3000',
    '172.18.208.1',
    '10.214.120.209:3000',
    '10.214.120.209',
    '*.ngrok-free.dev'
  ],
};

export default nextConfig;
