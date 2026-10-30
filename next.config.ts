import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pam's recordings change rarely: let tablets keep them instead of asking
  // the server again before every sound.
  async headers() {
    return [
      {
        source: '/voix/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ];
  },
};

export default nextConfig;
