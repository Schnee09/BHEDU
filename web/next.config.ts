import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Provide safe defaults for public envs to avoid build-time crashes when unset in CI
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.com",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "public-anon-key",
  },
  // Silence workspace root warning from multiple lockfiles in monorepo
  // See: https://nextjs.org/docs/app/api-reference/config/next-config-js/turbopack#root-directory
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
