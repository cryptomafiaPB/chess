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
  allowedDevOrigins: ['http://localhost:3000', 'http://172.18.208.1:3000'],
};

export default nextConfig;
