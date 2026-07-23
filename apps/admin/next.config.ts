import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@brin/config", "@brin/ui", "@brin/utils", "@brin/database"],
};

export default nextConfig;
