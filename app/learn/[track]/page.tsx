import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/learn/LessonPlayer";
import { TRACKS } from "@/content/learn";
import { getQuiz } from "@/lib/content";
import type { QuizTrack } from "@/lib/types";

export const generateStaticParams = () => TRACKS.map((t) => ({ track: t.id }));

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }): Promise<Metadata> {
  const { track } = await params;
  const t = TRACKS.find((x) => x.id === track);
  return { title: t ? `${t.title} · Bible games` : "Bible games", description: t?.blurb, robots: { index: false }, alternates: { canonical: `/learn/${track}/` } };
}

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  if (!TRACKS.some((t) => t.id === track)) notFound();
  const bank = (await getQuiz()).filter((q) => q.track === track);
  return (
    // A focused, full-screen lesson (covers the site header and footer), like a learning app.
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-paper px-4">
      <LessonPlayer bank={bank} track={track as QuizTrack} />
    </div>
  );
}
