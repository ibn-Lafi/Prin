import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@brin/config", "@brin/ui", "@brin/utils", "@brin/database"],
};

export default nextConfig;
