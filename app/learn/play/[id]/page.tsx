import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/learn/LessonPlayer";
import { getLearn } from "@/lib/content";

export const dynamicParams = true;

export async function generateStaticParams() {
  const { lessons } = await getLearn();
  return [{ id: "daily" }, { id: "practice" }, ...lessons.map((l) => ({ id: l.id }))];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { lessons } = await getLearn();
  const title = id === "daily" ? "Daily quiz" : id === "practice" ? "Practice" : lessons.find((l) => l.id === id)?.title ?? "Lesson";
  return { title: `${title} · Bible games`, robots: { index: false }, alternates: { canonical: `/learn/play/${id}/` } };
}

export default async function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { bank, lessons, categories, challenges } = await getLearn();
  if (id !== "daily" && id !== "practice" && !lessons.some((l) => l.id === id)) notFound();
  return (
    // A focused, full-screen lesson (covers the site header and footer), like a learning app.
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-paper px-4">
      <LessonPlayer id={id} bank={bank} lessons={lessons} categories={categories} challenges={challenges} />
    </div>
  );
}
