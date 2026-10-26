import { dayMonth } from "@/lib/format";
import Link from "next/link";
import { ArrowUpRight, BadgeCheck, MessageCircle, Play } from "lucide-react";
import { Avatar, MediaFrame } from "./ui";
import { reactionMetaStatic } from "./reactions";
import type { Post, Teacher } from "@/lib/types";

/** Compact, static post card for the homepage — links into the full feed. */
export function PostPreview({ post, author }: { post: Post; author?: Teacher }) {
  const total = Object.values(post.reactions).reduce((a, b) => a + b, 0);
  const top = (Object.keys(post.reactions) as (keyof Post["reactions"])[]).filter((r) => post.reactions[r] > 0).sort((a, b) => post.reactions[b] - post.reactions[a]).slice(0, 3);
  return (
    <Link href={`/blog/#${post.id}`} data-reveal data-card data-cursor="Read" className="group flex h-full flex-col rounded-[1.75rem] bg-white p-5 shadow-card ring-1 ring-ink/[0.07]">
      <div className="flex items-center gap-3">
        <Avatar name={author?.name ?? "Children's Ministry"} tone={author?.tone} size={40} />
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate text-[15px] font-bold text-ink">{author?.name}<BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" /></p>
          <p className="text-xs text-ink-mute">{author?.role}</p>
        </div>
        <span data-card-arrow aria-hidden className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] text-ink transition-colors duration-300 group-hover:bg-ink group-hover:text-white"><ArrowUpRight className="h-4 w-4" /></span>
      </div>
      {post.verse ? (
        <div className="mt-4 rounded-3xl bg-ink p-6 text-center text-white">
          <p className="font-display text-xl font-semibold leading-snug">“{post.verse.text}”</p>
          <p className="mt-3 inline-flex rounded-full bg-sun-400 px-3 py-0.5 text-xs font-bold text-ink">{post.verse.reference}</p>
        </div>
      ) : post.event ? (
        <div className="mt-4 flex items-center gap-4 rounded-3xl bg-sun-100 p-5">
          <span className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-white shadow-card"><b className="font-display text-2xl leading-none">{new Date(post.event.date + "T12:00:00Z").getUTCDate()}</b><span className="text-xs font-bold uppercase text-brand-600">{dayMonth(post.event.date).month}</span></span>
          <span><b className="block font-display text-lg leading-tight">{post.event.title}</b><span className="text-sm text-ink-mute">{post.event.time} · {post.event.location}</span></span>
        </div>
      ) : post.media ? (
        <div data-card-media className="relative mt-4 aspect-[4/3] rounded-3xl">
          <div className="h-full w-full"><MediaFrame media={post.media} /></div>
          {post.kind === "video" && <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-lift"><Play className="ml-0.5 h-6 w-6 fill-ink" /></span>}
        </div>
      ) : null}
      <p className="mt-4 line-clamp-3 flex-1 leading-relaxed text-ink-soft">{post.body}</p>
      <div className="mt-4 flex items-center justify-between border-t border-ink/[0.07] pt-3 text-sm font-semibold text-ink-mute">
        <span className="flex items-center gap-1.5"><span className="flex -space-x-1">{top.map((r) => <span key={r} className="text-base">{reactionMetaStatic[r]}</span>)}</span>{total}</span>
        <span className="flex items-center gap-1.5"><MessageCircle className="h-4 w-4" />{post.comments.length}</span>
      </div>
    </Link>
  );
}
