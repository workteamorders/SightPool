import type { MetadataRoute } from "next";
import { config } from "@config/env";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app/", "/styleguide/", "/api/"] }],
    ...(config.siteUrl ? { sitemap: `${config.siteUrl}/sitemap.xml` } : {}),
  };
}
