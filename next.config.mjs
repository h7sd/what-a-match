import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Match the Vite alias: @ -> ./src
    config.resolve.alias["@"] = path.resolve(__dirname, "./src");
    return config;
  },
  // Suppress warnings about missing pages directory
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
