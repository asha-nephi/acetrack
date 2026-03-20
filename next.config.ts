import { NextConfig } from 'next';
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  devIndicators: false,
  // Silence turbopack/webpack warnings from next-pwa
  turbopack: {}
};

export default withPWA(nextConfig);
