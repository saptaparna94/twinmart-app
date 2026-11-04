import type { NextConfig } from "next";

const isAndroidBuild =
  process.env.TWINMART_BUILD_TARGET === "android";

const nextConfig: NextConfig = {
  ...(isAndroidBuild ? { output: "export" as const } : {}),

  trailingSlash: true,

  images: {
    unoptimized: true,
  },

  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",

    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  },
};

export default nextConfig;