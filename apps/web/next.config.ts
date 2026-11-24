import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hosted (one container): the browser calls /api/v1 on its own origin and
  // Next forwards it to the FastAPI process. Only active when API_PROXY_TARGET
  // is set at build time, so local dev is unchanged.
  async rewrites() {
    const target = process.env.API_PROXY_TARGET;
    if (!target) return [];
    return [{ source: "/api/v1/:path*", destination: `${target}/api/v1/:path*` }];
  },
};

export default nextConfig;
