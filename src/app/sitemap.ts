import type { MetadataRoute } from "next";
import { config } from "@config/env";

export const dynamic = "force-static";

const ROUTES = ["/", "/legal/disclosures/", "/legal/terms/", "/legal/privacy/"];

/* App routes are noindex. Until SITE_URL is configured, URLs use a placeholder origin (see README). */
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = config.siteUrl ?? "https://example.invalid";
  return ROUTES.map((r) => ({ url: `${origin}${r}`, changeFrequency: "monthly", priority: r === "/" ? 1 : 0.5 }));
}
