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
    ],
  },
  allowedDevOrigins: [
    'local-origin.dev',
    '*.local-origin.dev',
    '172.18.208.1:3000',
    '172.18.208.1',
    '10.214.120.209:3000',
    '10.214.120.209'
  ],
};

export default nextConfig;
