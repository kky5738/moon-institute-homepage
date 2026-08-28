import type { NextConfig } from "next";

const supabaseUrl = process.env.SUPABASE_URL;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "research-files";
const supabaseStorageUrl = supabaseUrl ? new URL(supabaseUrl) : null;

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    maximumRedirects: 0,
    maximumResponseBody: 20 * 1024 * 1024,
    remotePatterns: supabaseStorageUrl
      ? [
          {
            protocol: supabaseStorageUrl.protocol.replace(":", "") as
              | "http"
              | "https",
            hostname: supabaseStorageUrl.hostname,
            port: supabaseStorageUrl.port,
            pathname: `/storage/v1/object/sign/${storageBucket}/**`,
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
