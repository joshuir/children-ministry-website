import type { Metadata } from "next";
import { CmsHero } from "@/components/ui";
import { EventCarousel, GalleryMarquee } from "@/components/GalleryMarquee";
import { getGallery, getGalleryCategories, getHeroText } from "@/lib/content";

export const metadata: Metadata = {
  title: "Gallery",
  description: "Photos and videos from Children's Harvest, Parents Day, graduation, Palm Sunday, outreach, excursions and camp.",
  alternates: { canonical: "/gallery/" },
};

export default async function GalleryPage() {
  const [items, categories, hero] = await Promise.all([getGallery(), getGalleryCategories(), getHeroText("gallery")]);
  return (
    <>
      <CmsHero hero={hero} tone="sun" />
      <GalleryMarquee items={items} categories={categories} />
      <section className="overflow-hidden py-14 md:py-20" aria-label="Photo and video gallery">
        <EventCarousel items={items} categories={categories} />
      </section>
    </>
  );
}
