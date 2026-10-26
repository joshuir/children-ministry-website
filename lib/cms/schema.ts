import { site, home } from "@/content/site";
import { teachers, history, vision, mission } from "@/content/people";
import { groups, classes, lessons } from "@/content/classes";
import { events, gallery, galleryCategories, posts } from "@/content/community";
import { pages, typography } from "@/content/pages";
import { faqs } from "@/content/faqs";
import { quiz } from "@/content/learn";
import type {
  AboutContent, BibleLesson, ClassInfo, EventItem, GalleryCategory, GalleryItem, GroupInfo,
  Faq, HomeContent, PagesContent, Post, QuizQuestion, SiteSettings, SocialEmbed, Teacher, Typography,
} from "@/lib/types";

/** Everything editable in the CMS lives in one versioned JSON document. */
export interface CmsContent {
  version: 1;
  updatedAt: string;
  updatedBy?: string;
  site: SiteSettings;
  home: HomeContent;
  about: AboutContent;
  teachers: Teacher[];
  groups: GroupInfo[];
  classes: ClassInfo[];
  lessons: BibleLesson[];
  events: EventItem[];
  galleryCategories: { id: GalleryCategory; label: string }[];
  gallery: GalleryItem[];
  posts: Post[];
  socialEmbeds: SocialEmbed[];
  faqs: Faq[];
  /** Bible learning games question bank. */
  quiz: QuizQuestion[];
  pages: PagesContent;
  typography: Typography;
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export function seedContent(): CmsContent {
  return clone({
    version: 1 as const,
    updatedAt: "2026-10-07T00:00:00Z",
    site: { ...site, url: process.env.NEXT_PUBLIC_SITE_URL || site.url },
    home,
    about: { history, vision, mission, historyDoc: { label: "Download our full history", note: "PDF · the story since 2006", url: "/docs/childrens-ministry-history.pdf" } },
    teachers,
    groups,
    classes,
    lessons,
    events: events.map((e) => ({ ...e, category: e.id.includes("harvest") ? "special" : e.id.includes("parents") ? "family" : "special" })) as EventItem[],
    galleryCategories,
    gallery,
    posts: posts.map((p) => ({ ...p, status: "published" as const })),
    faqs,
    quiz,
    pages,
    typography,
    socialEmbeds: [
      { id: "se1", platform: "youtube", url: "https://www.youtube.com/watch?v=ysz5S6PUM-U", caption: "Memory verse song — Luke 10:27 (replace with your channel's video)", date: "2026-10-06" },
      { id: "se2", platform: "link", url: "https://instagram.com/", caption: "Follow @pcm.kids on Instagram for Sunday highlights", date: "2026-10-04" },
    ],
  });
}

/** Fill in any top-level keys missing from stored content (e.g. after adding a new section). */
export function normalize(raw: Partial<CmsContent> | null | undefined): CmsContent {
  const seed = seedContent();
  if (!raw || typeof raw !== "object") return seed;
  const out = { ...seed, ...raw } as CmsContent;
  for (const k of Object.keys(seed) as (keyof CmsContent)[]) {
    if (out[k] === undefined || out[k] === null) (out as any)[k] = (seed as any)[k];
  }
  out.site = { ...seed.site, ...out.site, contact: { ...seed.site.contact, ...out.site.contact }, app: { ...seed.site.app, ...out.site.app } };
  const p = (out.pages || {}) as Partial<PagesContent>;
  out.pages = {
    heroes: { ...seed.pages.heroes, ...(p.heroes || {}) },
    sections: { ...seed.pages.sections, ...(p.sections || {}) },
    loader: { ...seed.pages.loader, ...(p.loader || {}) },
    newsletter: { ...seed.pages.newsletter, ...(p.newsletter || {}) },
  };
  out.typography = { ...seed.typography, ...(out.typography || {}) };
  if (out.home?.hero && out.home.hero.rotate === undefined) out.home = { ...out.home, hero: { ...out.home.hero, rotate: seed.home.hero.rotate } };
  if (out.about && out.about.historyDoc === undefined) out.about = { ...out.about, historyDoc: seed.about.historyDoc };
  return out;
}

/** Light structural check so a bad import can't break the public site. */
export function validate(c: any): string | null {
  if (!c || typeof c !== "object") return "Content must be an object.";
  const arrays = ["teachers", "groups", "classes", "lessons", "events", "galleryCategories", "gallery", "posts", "socialEmbeds", "faqs", "quiz"];
  for (const k of arrays) if (c[k] !== undefined && !Array.isArray(c[k])) return `“${k}” must be a list.`;
  for (const k of ["site", "home", "about", "pages", "typography"]) if (c[k] !== undefined && (typeof c[k] !== "object" || Array.isArray(c[k]))) return `“${k}” must be an object.`;
  const size = JSON.stringify(c).length;
  if (size > 4_000_000) return "Content is too large (over 4 MB). Upload big files to the media library instead of pasting them.";
  return null;
}
