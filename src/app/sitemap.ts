import type { MetadataRoute } from "next";

const SITE = "https://crewcanvas.site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE}/app`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE}/app/projects/hpm`, changeFrequency: "weekly", priority: 0.5 },
  ];
}
