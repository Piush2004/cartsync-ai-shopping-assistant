import type { NextConfig } from "next";

// STATIC_EXPORT=1 builds plain HTML/JS files into ./out (for Hugging Face
// Static Spaces). Local dev and `next start` stay as before.
const nextConfig: NextConfig = process.env.STATIC_EXPORT
  ? { output: "export", images: { unoptimized: true }, trailingSlash: true }
  : {};

export default nextConfig;
