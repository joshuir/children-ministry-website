"use client";

import { useRef } from "react";
import clsx from "clsx";
import { gsap, useGSAP } from "@/lib/gsap";
import { isReduced } from "@/lib/motion-pref";

export type Mood = "idle" | "happy" | "sad" | "cheer" | "think" | "wave";

/**
 * Pip the lamb — the Bible games mascot (an original character). Pip reacts to how a child is doing:
 * hops when they're right, droops gently when they're not, cheers at milestones, tilts its head while
 * they think, and waves hello. `beat` re-plays the reaction for the same mood (e.g. two right answers
 * in a row). In calm mode Pip only changes expression — no hopping or spinning.
 */
export function Mascot({ mood = "idle", say, beat = 0, size = 120, className, bubble = "right" }: {
  mood?: Mood; say?: string; beat?: number; size?: number; className?: string; bubble?: "right" | "top" | "none";
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = root.current;
    if (!el) return;
    const q = gsap.utils.selector(el);
    const calm = isReduced();
    const body = q("[data-pip-body]"), head = q("[data-pip-head]"), earL = q("[data-pip-ear-l]"), earR = q("[data-pip-ear-r]");
    const eyesOpen = q("[data-pip-eyes-open]"), eyesHappy = q("[data-pip-eyes-happy]"), eyesSad = q("[data-pip-eyes-sad]");
    const mouthSmile = q("[data-pip-smile]"), mouthO = q("[data-pip-o]"), sparkles = q("[data-pip-spark]"), hoof = q("[data-pip-hoof]");

    // expression
    gsap.set(eyesOpen, { autoAlpha: mood === "happy" || mood === "cheer" || mood === "sad" ? 0 : 1 });
    gsap.set(eyesHappy, { autoAlpha: mood === "happy" || mood === "cheer" ? 1 : 0 });
    gsap.set(eyesSad, { autoAlpha: mood === "sad" ? 1 : 0 });
    gsap.set(mouthSmile, { autoAlpha: mood === "think" || mood === "sad" ? 0 : 1 });
    gsap.set(mouthO, { autoAlpha: mood === "think" || mood === "sad" ? 1 : 0 });

    const tl = gsap.timeline();
    if (calm) {
      tl.fromTo(el.querySelector("svg"), { autoAlpha: 0.6 }, { autoAlpha: 1, duration: 0.3 });
      return;
    }
    const ears = (rot: number, d = 0.3) => tl.to(earL, { rotation: -rot, duration: d, ease: "back.out(2)", transformOrigin: "90% 20%" }, 0).to(earR, { rotation: rot, duration: d, ease: "back.out(2)", transformOrigin: "10% 20%" }, 0);

    switch (mood) {
      case "happy":
        ears(-12);
        tl.to(body, { y: -18, duration: 0.22, ease: "power2.out" }, 0)
          .to(body, { y: 0, duration: 0.5, ease: "bounce.out" })
          .fromTo(sparkles, { scale: 0, autoAlpha: 1, transformOrigin: "50% 50%" }, { scale: 1.2, autoAlpha: 0, duration: 0.8, stagger: 0.06, ease: "power2.out" }, 0.1);
        break;
      case "cheer":
        ears(-18);
        tl.to(body, { y: -26, duration: 0.25, ease: "power2.out" }, 0)
          .to(body, { rotation: 360, duration: 0.6, ease: "power2.inOut", transformOrigin: "50% 60%" }, 0.05)
          .to(body, { y: 0, duration: 0.5, ease: "bounce.out" }, 0.55)
          .set(body, { rotation: 0 })
          .fromTo(hoof, { rotation: 0 }, { rotation: -40, yoyo: true, repeat: 3, duration: 0.15, transformOrigin: "50% 0%" }, 0.3)
          .fromTo(sparkles, { scale: 0, autoAlpha: 1, transformOrigin: "50% 50%" }, { scale: 1.4, autoAlpha: 0, duration: 1, stagger: 0.08, ease: "power2.out" }, 0.2);
        break;
      case "sad":
        ears(28, 0.5);
        tl.to(head, { y: 4, rotation: -6, duration: 0.5, ease: "power2.out", transformOrigin: "50% 80%" }, 0)
          .to(body, { scaleY: 0.96, duration: 0.4, ease: "power2.out", transformOrigin: "50% 100%" }, 0)
          .to([head, body], { y: 0, rotation: 0, scaleY: 1, duration: 0.6, ease: "power2.inOut", delay: 1.2 });
        break;
      case "think":
        ears(6);
        tl.to(head, { rotation: 10, duration: 0.5, ease: "power2.out", transformOrigin: "50% 80%" }, 0)
          .to(head, { rotation: 4, duration: 1.4, ease: "sine.inOut", yoyo: true, repeat: -1 });
        break;
      case "wave":
        ears(-8);
        tl.fromTo(hoof, { rotation: 0 }, { rotation: -50, yoyo: true, repeat: 5, duration: 0.18, ease: "sine.inOut", transformOrigin: "50% 0%" }, 0.1);
        break;
      default:
        ears(0, 0.4);
        tl.to(head, { rotation: 0, y: 0, duration: 0.3 }, 0);
    }
    // gentle idle breathing + blinking always runs underneath
    const idle = gsap.to(body, { y: "-=3", duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1, delay: tl.duration() });
    const blink = gsap.timeline({ repeat: -1, repeatDelay: 2.8, delay: 1.5 }).to(eyesOpen, { scaleY: 0.1, duration: 0.08, transformOrigin: "50% 50%" }).to(eyesOpen, { scaleY: 1, duration: 0.12 });
    return () => { idle.kill(); blink.kill(); };
  }, { scope: root, dependencies: [mood, beat], revertOnUpdate: true });

  // speech bubble pops in whenever the line changes
  useGSAP(() => {
    const b = root.current?.querySelector("[data-pip-bubble]");
    if (!b || !say || isReduced()) return;
    gsap.fromTo(b, { autoAlpha: 0, scale: 0.85, y: 6 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(1.8)" });
  }, { scope: root, dependencies: [say, beat] });

  return (
    <div ref={root} className={clsx("flex items-center gap-3", bubble === "top" && "flex-col-reverse", className)} data-mood={mood}>
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label="Pip the lamb" className="shrink-0 overflow-visible">
        <g data-pip-body>
          {/* sparkles */}
          {[[14, 22], [104, 18], [10, 70], [110, 64], [60, 4]].map(([x, y], i) => (
            <path key={i} data-pip-spark opacity="0" transform={`translate(${x} ${y})`} d="M0-7C1-2 2-1 7 0C2 1 1 2 0 7C-1 2-2 1-7 0C-2-1-1-2 0-7Z" fill={i % 2 ? "#FFC53D" : "#FF7A59"} />
          ))}
          {/* legs */}
          <rect x="40" y="88" width="9" height="20" rx="4.5" fill="#3A2F2A" />
          <rect x="71" y="88" width="9" height="20" rx="4.5" fill="#3A2F2A" />
          {/* fleece */}
          <g fill="#FFFFFF" stroke="#E6E1D8" strokeWidth="2">
            <circle cx="34" cy="74" r="16" /><circle cx="52" cy="64" r="18" /><circle cx="72" cy="64" r="18" /><circle cx="88" cy="74" r="16" />
            <circle cx="44" cy="86" r="15" /><circle cx="62" cy="88" r="16" /><circle cx="80" cy="86" r="15" />
          </g>
          {/* waving hoof */}
          <g data-pip-hoof><rect x="86" y="70" width="8" height="20" rx="4" fill="#3A2F2A" transform="rotate(-20 90 70)" /></g>
          {/* scarf in the ministry's blue */}
          <path d="M40 62 Q60 72 80 62 L82 69 Q60 80 38 69 Z" fill="#2563EB" />
          <path d="M70 68 l8 14 l-7 2 l-5 -14 Z" fill="#1D4FD8" />
          {/* head */}
          <g data-pip-head>
            <g data-pip-ear-l><ellipse cx="34" cy="38" rx="13" ry="7" fill="#3A2F2A" transform="rotate(-20 34 38)" /><ellipse cx="35" cy="38" rx="8" ry="4" fill="#F7B8A8" transform="rotate(-20 35 38)" /></g>
            <g data-pip-ear-r><ellipse cx="86" cy="38" rx="13" ry="7" fill="#3A2F2A" transform="rotate(20 86 38)" /><ellipse cx="85" cy="38" rx="8" ry="4" fill="#F7B8A8" transform="rotate(20 85 38)" /></g>
            <g fill="#FFFFFF" stroke="#E6E1D8" strokeWidth="2"><circle cx="48" cy="22" r="9" /><circle cx="60" cy="18" r="10" /><circle cx="72" cy="22" r="9" /></g>
            <ellipse cx="60" cy="42" rx="22" ry="21" fill="#4A3C35" />
            <ellipse cx="60" cy="46" rx="17" ry="15" fill="#5B4B42" />
            {/* eyes: open */}
            <g data-pip-eyes-open>
              <ellipse cx="51" cy="40" rx="5" ry="6" fill="#fff" /><ellipse cx="69" cy="40" rx="5" ry="6" fill="#fff" />
              <circle cx="52" cy="41" r="3" fill="#0B1530" /><circle cx="70" cy="41" r="3" fill="#0B1530" />
              <circle cx="53" cy="39.6" r="1" fill="#fff" /><circle cx="71" cy="39.6" r="1" fill="#fff" />
            </g>
            {/* eyes: happy */}
            <g data-pip-eyes-happy opacity="0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M46 42 Q51 35 56 42" /><path d="M64 42 Q69 35 74 42" /></g>
            {/* eyes: sad */}
            <g data-pip-eyes-sad opacity="0" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M46 40 Q51 44 56 40" /><path d="M64 40 Q69 44 74 40" /></g>
            {/* cheeks */}
            <circle cx="44" cy="50" r="3.5" fill="#FF7A59" opacity=".55" /><circle cx="76" cy="50" r="3.5" fill="#FF7A59" opacity=".55" />
            {/* mouths */}
            <path data-pip-smile d="M53 51 Q60 58 67 51" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
            <ellipse data-pip-o cx="60" cy="54" rx="3" ry="3.5" fill="#2A211D" opacity="0" />
          </g>
        </g>
      </svg>
      {say && bubble !== "none" && (
        <p data-pip-bubble role="status" className={clsx("relative max-w-[260px] rounded-3xl border-2 border-ink/10 bg-white px-4 py-3 font-display text-[15px] font-semibold leading-snug text-ink shadow-card",
          bubble === "right" ? "before:absolute before:-left-[9px] before:top-1/2 before:-mt-2 before:border-y-[8px] before:border-r-[9px] before:border-y-transparent before:border-r-white" : "text-center")}>
          {say}
        </p>
      )}
    </div>
  );
}
