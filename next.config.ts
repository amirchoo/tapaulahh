import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Keep search engines out until launch on tapaulahh.com (Part 9): flip to true then.
const ALLOW_SEARCH_INDEXING = false;

const nextConfig: NextConfig = {
  images: {
    // Pasar and stall photos from Supabase Storage (public buckets only).
    remotePatterns: [
      new URL(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/**`,
      ),
    ],
  },
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
