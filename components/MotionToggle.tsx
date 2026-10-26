"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { motionSetting, setMotionSetting, type MotionSetting } from "@/lib/motion-pref";

const OPTIONS: { id: MotionSetting; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "Use the site's default" },
  { id: "on", label: "On", hint: "Full animations" },
  { id: "off", label: "Calm", hint: "Gentle fades only" },
];

/**
 * Lets visitors choose how much the site moves. "Auto" follows the device (on Windows: Settings →
 * Accessibility → Visual effects → Animation effects). The page reloads so every animation is set up
 * cleanly for the new choice.
 */
export function MotionToggle() {
  const [value, setValue] = useState<MotionSetting | null>(null);
  useEffect(() => setValue(motionSetting()), []);

  function choose(s: MotionSetting) {
    if (s === value) return;
    setMotionSetting(s);
    setValue(s);
    location.reload();
  }

  return (
    <div role="radiogroup" aria-label="Animations" className="inline-flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
      <span className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-white/50">Animations</span>
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          title={o.hint}
          onClick={() => choose(o.id)}
          className={clsx("min-h-[36px] rounded-full px-3 text-xs font-bold transition-colors duration-150", value === o.id ? "bg-white text-ink" : "text-white/70 hover:text-white")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
