import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
  // Fix chunk loading issues
  output: "standalone",

  // Improve chunk loading reliability
  experimental: {
    // Reduce chunk size
    optimizePackageImports: ["react-icons"],
  },

  // Configure webpack for better chunk handling
  webpack: (config, { isServer }) => {
    // Optimize chunks for better loading
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            default: false,
            vendors: false,
            // Main chunk
            vendor: {
              chunks: "all",
              name: "vendor",
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
            },
            // Common chunks
            common: {
              name: "common",
              minChunks: 2,
              priority: 10,
              reuseExistingChunk: true,
              chunks: "all",
            },
          },
        },
      };
    }
    return config;
  },

  // Configure headers for better caching
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
