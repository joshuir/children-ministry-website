import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const isStatic = process.env.STATIC_EXPORT === "1";
// Optional sub-path for previews, e.g. PREVIEW_BASE=/site
const basePath = process.env.PREVIEW_BASE || "";

const nextConfig = {
  reactStrictMode: true,
  ...(basePath ? { basePath } : {}),
  webpack(config) {
    config.resolve.alias["@"] = root;
    return config;
  },
  // `npm run build:static` produces a fully static site (used for previews).
  // A normal `npm run build` keeps server features and image optimisation on.
  ...(isStatic ? { output: "export", trailingSlash: true, images: { unoptimized: true } } : {}),
  images: isStatic
    ? { unoptimized: true }
    : {
        remotePatterns: [
          { protocol: "https", hostname: "*.supabase.co" },
          { protocol: "https", hostname: "images.unsplash.com" },
          { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
        ],
      },
  ...(isStatic ? {} : { async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // The content manager and its API: never cached, never indexed.
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/admin", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/api/cms/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  } }),
};

export default nextConfig;
