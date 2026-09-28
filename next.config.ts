import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Keep search engines out until launch on tapaulahh.com (Part 9): flip to true then.
const ALLOW_SEARCH_INDEXING = false;

const nextConfig: NextConfig = {
  async headers() {
    if (ALLOW_SEARCH_INDEXING) return [];
    return [
      {
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
