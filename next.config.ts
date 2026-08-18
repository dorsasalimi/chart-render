import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/chart-render",

  images: {
    unoptimized: true,
  },
};

export default nextConfig;