"use client";

import { forwardRef, useEffect, useState, type FormEvent } from "react";
import clsx from "clsx";
import { Flag, Heart, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import { Avatar } from "./ui";
import { timeAgo } from "@/lib/format";
import type { PostComment } from "@/lib/types";

/** Blocks the most common ways personal details leak into public comments. */
export function personalInfoWarning(text: string): string | undefined {
  if (/[^\s@]+@[^\s@]+\.[a-z]{2,}/i.test(text)) return "Please don't share email addresses in comments.";
  if (/(\+?\d[\d\s-]{7,}\d)/.test(text)) return "Please don't share phone numbers in comments.";
  if (/\b(lives? (at|on)|my address|house number|school is)\b/i.test(text)) return "Please don't share addresses or schools — it helps keep children safe.";
  return undefined;
}

type Local = PostComment & { pending?: boolean; liked?: boolean; reported?: boolean };

function CommentItem({ c, depth, onReply }: { c: Local; depth: number; onReply: (id: string, name: string) => void }) {
  const [liked, setLiked] = useState(false);
  const [reported, setReported] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const isTeacher = c.authorRole === "teacher" || c.authorRole === "admin";

  return (
    <li className={clsx(depth > 0 && "ml-6 border-l-2 border-ink/5 pl-4 sm:ml-12")}>
      <div className="flex gap-3">
        <Avatar name={c.author} tone={isTeacher ? "blue" : "ink"} size={36} className={isTeacher ? "" : "!bg-ink/10 !text-ink"} />
        <div className="min-w-0 flex-1">
          <div className={clsx("rounded-2xl rounded-tl-md px-4 py-2.5", c.pending ? "bg-sun-100 ring-1 ring-sun-300" : "bg-paper")}>
            <p className="flex flex-wrap items-center gap-x-2 text-sm">
              <span className="font-bold text-ink">{c.author}</span>
              {isTeacher && <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700"><ShieldCheck className="h-3 w-3" />Teacher</span>}
              <time dateTime={c.createdAt} className="text-ink-mute" suppressHydrationWarning>{c.pending ? "just now" : timeAgo(c.createdAt)}</time>
            </p>
            <p className="mt-0.5 break-words leading-relaxed text-ink-soft">{c.body}</p>
          </div>
          {c.pending ? (
            <p className="mt-1.5 flex items-center gap-1.5 px-2 text-xs font-semibold text-sun-600"><ShieldAlert className="h-3.5 w-3.5" />Sent for review — only you can see this until a teacher approves it.</p>
          ) : (
            <div className="mt-1 flex flex-wrap items-center gap-1 px-1 text-[13px] font-semibold text-ink-mute">
              <button type="button" aria-pressed={liked} onClick={() => setLiked(!liked)} className={clsx("inline-flex min-h-[36px] items-center gap-1 rounded-full px-2 hover:text-ink", liked && "text-coral-600")}>
                <Heart className={clsx("h-3.5 w-3.5", liked && "fill-current")} />{c.likes + (liked ? 1 : 0)}
              </button>
              {depth === 0 && <button type="button" onClick={() => onReply(c.id, c.author)} className="min-h-[36px] rounded-full px-2 hover:text-ink">Reply</button>}
              {!reported ? (
                confirm ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-coral-100 px-2 py-1 text-coral-600">
                    Report this comment?
                    <button type="button" className="rounded-full px-2 font-bold underline" onClick={(ev) => { const pid = ev.currentTarget.closest("article")?.id || "feed"; setReported(true); setConfirm(false); fetch("/api/report", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId: pid, commentId: c.id, reason: "Comment reported: " + c.body.slice(0, 200) }) }).catch(() => {}); }}>Yes</button>
                    <button type="button" className="rounded-full px-2" onClick={() => setConfirm(false)}>Cancel</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirm(true)} className="inline-flex min-h-[36px] items-center gap-1 rounded-full px-2 hover:text-coral-600"><Flag className="h-3.5 w-3.5" />Report</button>
                )
              ) : (
                <span role="status" className="px-2 text-mint-600">Thanks — a moderator will review it.</span>
              )}
            </div>
          )}
          {c.replies && c.replies.length > 0 && <ul className="mt-3 grid gap-3">{c.replies.map((r) => <CommentItem key={r.id} c={r} depth={depth + 1} onReply={onReply} />)}</ul>}
        </div>
      </div>
    </li>
  );
}

export const CommentSection = forwardRef<HTMLTextAreaElement, { postId: string; comments: PostComment[]; open: boolean }>(
  function CommentSection({ postId, comments, open }, ref) {
    const [mineList, setMineList] = useState<Local[]>([]);
    const [text, setText] = useState("");
    const [name, setName] = useState("");
    const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
    const [error, setError] = useState<string>();
    const [sending, setSending] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const store = `pending-comments:${postId}`;

    // This browser's comments that are still awaiting approval survive reloads.
    useEffect(() => {
      try {
        setName(localStorage.getItem("comment-name") || "");
        const saved: Local[] = JSON.parse(localStorage.getItem(store) || "[]");
        setMineList(saved);
      } catch { /* ignore */ }
    }, [store]);

    // Once a moderator approves one, it arrives from the server — drop our local copy.
    const allIds = new Set(comments.flatMap((c) => [c.id, ...(c.replies || []).map((r) => r.id)]));
    useEffect(() => {
      setMineList((m) => {
        const left = m.filter((c) => !allIds.has(c.id) && Date.now() - new Date(c.createdAt).getTime() < 7 * 864e5);
        if (left.length !== m.length) try { localStorage.setItem(store, JSON.stringify(left)); } catch { /* ignore */ }
        return left.length === m.length ? m : left;
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [comments]);

    const list: Local[] = [...comments, ...mineList];
    const visible = expanded ? list : list.slice(-2);

    async function submit(e: FormEvent) {
      e.preventDefault();
      const body = text.trim();
      if (!name.trim()) return setError("Please add your first name.");
      if (!body) return setError("Write something first.");
      if (body.length > 500) return setError("Please keep comments under 500 characters.");
      const warn = personalInfoWarning(body) || personalInfoWarning(name);
      if (warn) return setError(warn);
      setError(undefined);
      setSending(true);
      try {
        const res = await fetch("/api/comment", { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, parentId: replyTo?.id, author: name.trim(), body: replyTo ? `@${replyTo.name.split(" ")[0]} ${body}` : body }) });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) { setError(j.error || "Couldn't send your comment. Please try again."); return; }
        const c: Local = { id: j.id, author: `${name.trim()} (you)`, body: replyTo ? `@${replyTo.name.split(" ")[0]} ${body}` : body, createdAt: j.createdAt || new Date().toISOString(), likes: 0, pending: true };
        const next = [...mineList, c];
        setMineList(next);
        try { localStorage.setItem(store, JSON.stringify(next)); localStorage.setItem("comment-name", name.trim()); } catch { /* ignore */ }
        setExpanded(true);
        setText(""); setReplyTo(null);
      } catch {
        setError("You seem to be offline. Please try again.");
      } finally {
        setSending(false);
      }
    }

    if (!open && list.length === 0) return null;

    return (
      <div className="mt-2 border-t border-ink/5 pt-4">
        {list.length > 0 && (
          <ul className="grid gap-4">{visible.map((c) => <CommentItem key={c.id} c={c} depth={0} onReply={(id, n) => { setReplyTo({ id, name: n }); (ref as React.RefObject<HTMLTextAreaElement>)?.current?.focus(); }} />)}</ul>
        )}
        {list.length > 2 && !expanded && (
          <button type="button" onClick={() => setExpanded(true)} className="mt-3 min-h-[40px] px-1 text-sm font-bold text-brand-600 hover:underline">View all {list.length} comments</button>
        )}
        {open && (
          <form onSubmit={submit} className="mt-4" aria-label="Add a comment">
            {replyTo && (
              <p className="mb-2 flex items-center gap-2 px-2 text-sm text-ink-mute">Replying to <b className="text-ink">{replyTo.name}</b><button type="button" className="font-semibold text-brand-600" onClick={() => setReplyTo(null)}>Cancel</button></p>
            )}
            <label htmlFor={`comment-name-${postId}`} className="sr-only">Your first name</label>
            <input id={`comment-name-${postId}`} value={name} onChange={(e) => { setName(e.target.value); setError(undefined); }} maxLength={40} autoComplete="given-name" placeholder="Your first name (e.g. Ama)"
              className="mb-2 h-11 w-full rounded-full bg-paper px-5 text-[15px] outline-none ring-2 ring-transparent transition-shadow duration-150 placeholder:text-ink-mute focus:bg-white focus:ring-brand-500 sm:w-64" />
            <div className="flex items-end gap-2">
              <label htmlFor={`comment-${postId}`} className="sr-only">Write a comment</label>
              <textarea
                ref={ref}
                id={`comment-${postId}`}
                rows={1}
                maxLength={500}
                value={text}
                onChange={(e) => { setText(e.target.value); setError(undefined); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); (e.currentTarget.form as HTMLFormElement).requestSubmit(); } }}
                placeholder="Write a kind comment…"
                aria-invalid={!!error}
                aria-describedby={`comment-help-${postId}`}
                className="max-h-40 min-h-[48px] flex-1 resize-none rounded-3xl bg-paper px-5 py-3 text-[15px] outline-none ring-2 ring-transparent transition-shadow placeholder:text-ink-mute focus:bg-white focus:ring-brand-500"
              />
              <button type="submit" disabled={sending || !text.trim()} className="inline-flex h-12 shrink-0 items-center rounded-full bg-brand-500 px-5 font-display font-semibold text-white transition-colors duration-100 hover:bg-brand-600 disabled:opacity-40">
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Post"}
              </button>
            </div>
            <p id={`comment-help-${postId}`} className={clsx("mt-2 px-2 text-xs", error ? "font-semibold text-coral-600" : "text-ink-mute")} role={error ? "alert" : undefined}>
              {error ?? "Comments are reviewed by a teacher before they appear. Please don't share children's names, photos, phone numbers or addresses."}
            </p>
          </form>
        )}
      </div>
    );
  },
);
