import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /expo was the first address of the Abidjan page: keep it working.
  async redirects() {
    return [{ source: "/expo", destination: "/abidjan", permanent: false }];
  },
};

export default nextConfig;
