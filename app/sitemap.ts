import type { MetadataRoute } from "next";
import { getClasses, getLessonsFor, getSite } from "@/lib/content";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  const base = site.url.replace(/\/$/, "");
  const pages = ["", "/about/", "/classes/", "/blog/", "/events/", "/gallery/", "/contact/", "/safeguarding/", "/privacy/", "/terms/", "/accessibility/"];
  const classes = await getClasses();
  const lessons = (await Promise.all(classes.map(async (c) => (await getLessonsFor(c.id)).map((l) => `/classes/${c.id}/lessons/${l.id}/`)))).flat();
  return [
    ...pages.map((p) => ({ url: `${base}${p || "/"}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.8 })),
    ...classes.map((c) => ({ url: `${base}/classes/${c.id}/`, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...lessons.map((u) => ({ url: `${base}${u}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
