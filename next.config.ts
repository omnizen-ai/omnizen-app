import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
  },
  devIndicators: false,
  serverExternalPackages: ['pdf-parse', 'sharp', 'tesseract.js', 'mammoth'],
  images: {
    remotePatterns: [
      {
        hostname: 'avatar.vercel.sh',
      },
    ],
  },
};

export default nextConfig;
