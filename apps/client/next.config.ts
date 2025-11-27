import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [{
      protocol: 'https',
      hostname: 'github.com',
      port: '',
      pathname: '/lichess-org/lila/blob/master/public/piece/pirouetti/**',
    }]
  }
};

export default nextConfig;
