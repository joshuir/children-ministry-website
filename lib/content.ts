/**
 * Content access layer. Pages never import seed files directly — they call
 * these functions, which read the CMS document (Vercel Blob in production,
 * `.data/` locally) and fall back to the seed content in /content.
 */
import "server-only";
import { getContent } from "@/lib/cms/data";
import { cleanBank } from "@/lib/learn";
import type { BibleLesson, MotionSettings, Post } from "@/lib/types";

export const getSite = async () => (await getContent()).site;
export const getHome = async () => (await getContent()).home;
export const getAbout = async () => (await getContent()).about;

export const getTeachers = async () => (await getContent()).teachers;
export const getTeacher = async (id: string) => (await getTeachers()).find((t) => t.id === id);
export const getTeachersFor = async (ids: string[]) => (await getTeachers()).filter((t) => ids.includes(t.id));

export const getGroups = async () => (await getContent()).groups;
export const getClasses = async () => (await getContent()).classes;
export const getClass = async (id: string) => (await getClasses()).find((c) => c.id === id);

const byDateDesc = (a: { date: string }, b: { date: string }) => b.date.localeCompare(a.date);

export async function getLessonsFor(classId: string): Promise<BibleLesson[]> {
  return (await getContent()).lessons.filter((l) => l.classId === classId).sort(byDateDesc);
}
export const getAllLessons = async () => (await getContent()).lessons;
export const getCurrentLesson = async (classId: string) => (await getLessonsFor(classId))[0];
export const getLesson = async (classId: string, id: string) => (await getLessonsFor(classId)).find((l) => l.id === id);

export const getEvents = async () => [...(await getContent()).events].sort((a, b) => a.date.localeCompare(b.date));

export const sortPosts = (list: Post[]) =>
  [...list].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || b.createdAt.localeCompare(a.createdAt));

export const getPosts = async (): Promise<Post[]> =>
  sortPosts((await getContent()).posts.filter((p) => (p.status ?? "published") === "published" && p.createdAt <= new Date(Date.now() + 60_000).toISOString()));

export const getSocialEmbeds = async () => [...(await getContent()).socialEmbeds].sort((a, b) => b.date.localeCompare(a.date));

/** Published FAQs, optionally limited to some categories. */
export const getFaqs = async (cats?: string[]) => (await getContent()).faqs.filter((f) => !f.hidden && f.question.trim() && (!cats || !f.category || cats.includes(f.category)));

/** Bible games: hidden, incomplete and duplicate questions are removed so children never see repeats. */
export const getQuiz = async () => cleanBank((await getContent()).quiz);

export const getGallery = async () => (await getContent()).gallery;
export const getGalleryCategories = async () => (await getContent()).galleryCategories;

export const getPages = async () => (await getContent()).pages;
export const getTypography = async () => (await getContent()).typography;
/** Falls back to defaults if cached content predates the Animations setting. */
export const getMotion = async (): Promise<MotionSettings> => ({ mode: "auto", ...(((await getContent()).motion as Partial<MotionSettings> | undefined) ?? {}) });
/** Hero text for a page. */
export const getHeroText = async (k: import("@/lib/types").PageKey) => (await getContent()).pages.heroes[k];
/** Section heading text, e.g. sec("home.events"). */
export async function getSections() {
  const s = (await getContent()).pages.sections;
  return (key: string) => s[key] || {};
}
