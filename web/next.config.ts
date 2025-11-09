import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Silence workspace root warning from multiple lockfiles in monorepo
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
  // Point to this app directory explicitly.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
