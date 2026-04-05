import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ['@recipe-app/shared'],
};

export default nextConfig;
