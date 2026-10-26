"use client";

import { isReduced } from "@/lib/motion-pref";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import clsx from "clsx";
import { Bookmark, Check, MessageCircle, Share2 } from "lucide-react";
import { compact } from "@/lib/format";
import { floatEmojis } from "./emojiFx";
import type { Reaction } from "@/lib/types";

export const reactionMeta: Record<Reaction, { emoji: string; label: string; color: string }> = {
  love: { emoji: "❤️", label: "Love", color: "text-coral-600" },
  like: { emoji: "👍", label: "Like", color: "text-brand-600" },
  laugh: { emoji: "😂", label: "Haha", color: "text-sun-600" },
  wow: { emoji: "😍", label: "Adore", color: "text-coral-600" },
  pray: { emoji: "🙏", label: "Amen", color: "text-lilac-400" },
};
const order: Reaction[] = ["love", "like", "laugh", "wow", "pray"];

export function ReactionBar({
  postId, reactions, commentCount, onComment,
}: { postId: string; reactions: Record<Reaction, number>; commentCount: number; onComment: () => void }) {
  const [mine, setMine] = useState<Reaction | null>(null);
  const [counts, setCounts] = useState(reactions);
  const [saved, setSaved] = useState(false);
  const [picker, setPicker] = useState(false);
  const [shared, setShared] = useState(false);
  const [burst, setBurst] = useState(0);
  const hold = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrap = useRef<HTMLDivElement>(null);
  const likeBtn = useRef<HTMLButtonElement>(null);
  const totalRef = useRef<HTMLSpanElement>(null);
  const pending = useRef(0);

  // Remember this browser's reaction and saved state.
  useEffect(() => {
    try {
      setMine((localStorage.getItem(`rx:${postId}`) as Reaction) || null);
      setSaved(localStorage.getItem(`saved:${postId}`) === "1");
    } catch { /* storage unavailable */ }
  }, [postId]);

  // Live counts from the server (skipped while our own request is in flight).
  useEffect(() => { if (!pending.current) setCounts(reactions); }, [reactions]);

  useEffect(() => {
    if (!picker) return;
    const close = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setPicker(false); };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [picker]);

  const total = order.reduce((s, r) => s + (counts[r] || 0), 0);
  const top = [...order].filter((r) => counts[r] > 0).sort((a, b) => counts[b] - counts[a]).slice(0, 3);

  // Bump the total whenever it changes (someone else reacting shows up live).
  const lastTotal = useRef(total);
  useGSAP(() => {
    if (lastTotal.current !== total && totalRef.current && !isReduced()) {
      gsap.fromTo(totalRef.current, { scale: 1.35, color: "#2563EB" }, { scale: 1, color: "inherit", duration: 0.5, ease: "back.out(3)" });
    }
    lastTotal.current = total;
  }, { dependencies: [total] });

  function fly(emoji: string) {
    const host = likeBtn.current;
    if (!host || isReduced()) return;
    for (let i = 0; i < 7; i++) {
      const el = document.createElement("span");
      el.textContent = emoji;
      el.setAttribute("aria-hidden", "true");
      el.style.cssText = "position:absolute;left:50%;top:40%;pointer-events:none;font-size:20px;z-index:40";
      host.appendChild(el);
      gsap.fromTo(el, { x: 0, y: 0, scale: 0.4, opacity: 1 }, {
        x: gsap.utils.random(-70, 70), y: gsap.utils.random(-110, -60), rotation: gsap.utils.random(-40, 40), scale: gsap.utils.random(0.8, 1.4),
        opacity: 0, duration: gsap.utils.random(0.7, 1.1), ease: "power2.out", onComplete: () => el.remove(),
      });
    }
    gsap.fromTo(host, { scale: 0.92 }, { scale: 1, duration: 0.45, ease: "elastic.out(1.2,0.4)" });
    // …and a little Instagram-Live stream rising from the button
    floatEmojis(host, emoji === "❤️" ? ["❤️", "💖", "❤️", "💕"] : [emoji, "✨", emoji], 6);
  }

  // Double-tapping the post's photo likes it (never un-likes), like Instagram.
  const chooseRef = useRef<(r: Reaction) => void>(() => {});
  useEffect(() => {
    const onLike = (e: Event) => {
      if ((e as CustomEvent<{ postId: string }>).detail?.postId !== postId) return;
      if (mine) fly(reactionMeta[mine].emoji); else chooseRef.current("love");
    };
    window.addEventListener("cm:like", onLike);
    return () => window.removeEventListener("cm:like", onLike);
  });

  async function choose(r: Reaction) {
    const prev = mine;
    const next = prev === r ? null : r;
    setMine(next); setPicker(false); setBurst((b) => b + 1);
    if (next) fly(reactionMeta[next].emoji);
    setCounts((c) => { const n = { ...c }; if (prev) n[prev] = Math.max(0, n[prev] - 1); if (next) n[next] = (n[next] || 0) + 1; return n; });
    try { if (next) localStorage.setItem(`rx:${postId}`, next); else localStorage.removeItem(`rx:${postId}`); } catch { /* ignore */ }
    pending.current++;
    try {
      const res = await fetch("/api/react", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next ? { postId, reaction: next, on: true, previous: prev } : { postId, reaction: prev, on: false }) });
      if (res.ok) { const j = await res.json(); if (j.reactions) setCounts(j.reactions); }
    } catch { /* offline: keep optimistic count */ } finally { pending.current--; }
  }

  chooseRef.current = choose;

  function toggleSave() {
    setSaved((s) => { try { localStorage.setItem(`saved:${postId}`, s ? "0" : "1"); } catch { /* ignore */ } return !s; });
  }

  async function share() {
    const url = `${location.origin}${location.pathname}#${postId}`;
    try {
      if (navigator.share) await navigator.share({ title: "Children's Ministry", url });
      else { await navigator.clipboard.writeText(url); setShared(true); setTimeout(() => setShared(false), 1800); }
    } catch { /* cancelled */ }
  }

  const btn = "relative inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full px-3 text-[15px] font-semibold text-ink-soft transition-[background-color,color,transform] duration-100 hover:bg-ink/5 hover:text-ink active:scale-95 sm:flex-none sm:px-4";

  return (
    <div>
      <div className="flex items-center justify-between px-1 pb-3 text-sm text-ink-mute">
        <span className="inline-flex items-center gap-2">
          <span className="flex -space-x-1">{top.map((r) => <span key={r} className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm ring-2 ring-white">{reactionMeta[r].emoji}</span>)}</span>
          <span ref={totalRef} className="inline-block font-semibold tabular-nums">{compact(total)}</span>
        </span>
        <button type="button" onClick={onComment} className="font-semibold hover:text-ink hover:underline">{commentCount} {commentCount === 1 ? "comment" : "comments"}</button>
      </div>

      <div className="flex items-center gap-1 border-t border-ink/5 pt-2" ref={wrap}>
        <div
          className="relative flex-1 sm:flex-none"
          onMouseEnter={() => { if (matchMedia("(pointer: fine)").matches) hold.current = setTimeout(() => setPicker(true), 220); }}
          onMouseLeave={() => { clearTimeout(hold.current); }}
        >
          {/* Reaction picker */}
          <div
            role="menu"
            aria-label="Choose a reaction"
            className={clsx(
              "absolute bottom-full left-0 z-20 mb-2 flex gap-1 rounded-full bg-white p-1.5 shadow-lift ring-1 ring-ink/5 transition-all duration-200",
              picker ? "visible translate-y-0 scale-100 opacity-100" : "invisible translate-y-2 scale-90 opacity-0",
            )}
          >
            {order.map((r, i) => (
              <button
                key={r}
                type="button"
                role="menuitemradio"
                aria-checked={mine === r}
                aria-label={reactionMeta[r].label}
                title={reactionMeta[r].label}
                onClick={() => choose(r)}
                style={{ transitionDelay: picker ? `${i * 30}ms` : "0ms" }}
                className={clsx("flex h-11 w-11 items-center justify-center rounded-full text-2xl transition-transform duration-200 hover:-translate-y-1.5 hover:scale-125", mine === r && "bg-brand-50")}
              >
                {reactionMeta[r].emoji}
              </button>
            ))}
          </div>
          <button
            ref={likeBtn}
            type="button"
            aria-pressed={!!mine}
            aria-haspopup="menu"
            onClick={() => choose(mine ?? "love")}
            onContextMenu={(e) => { e.preventDefault(); setPicker(true); }}
            onTouchStart={() => { hold.current = setTimeout(() => setPicker(true), 380); }}
            onTouchEnd={() => clearTimeout(hold.current)}
            onKeyDown={(e) => { if (e.key === "ArrowUp") { e.preventDefault(); setPicker(true); } }}
            className={clsx(btn, "w-full", mine && reactionMeta[mine].color)}
          >
            <span key={burst} className={clsx("text-lg leading-none", burst > 0 && "lively:animate-[pop_.4s_ease-out]")}>{mine ? reactionMeta[mine].emoji : "🤍"}</span>
            {mine ? reactionMeta[mine].label : "Like"}
          </button>
        </div>
        <button type="button" onClick={onComment} className={btn}><MessageCircle className="h-5 w-5" /><span className="hidden sm:inline">Comment</span></button>
        <button type="button" onClick={share} className={btn} aria-live="polite">{shared ? <><Check className="h-5 w-5 text-mint-600" /><span className="hidden sm:inline">Copied</span></> : <><Share2 className="h-5 w-5" /><span className="hidden sm:inline">Share</span></>}</button>
        <button type="button" aria-pressed={saved} onClick={toggleSave} className={clsx(btn, "sm:ml-auto", saved && "text-brand-600")} aria-label={saved ? "Saved" : "Save post"}>
          <Bookmark className={clsx("h-5 w-5 transition-transform", saved && "scale-110 fill-current")} /><span className="hidden sm:inline">{saved ? "Saved" : "Save"}</span>
        </button>
      </div>
      <p className="sr-only">Hover, long-press or press the up arrow on Like to choose a different reaction.</p>
    </div>
  );
}
