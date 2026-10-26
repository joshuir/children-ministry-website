import clsx from "clsx";
import { BookOpen, Compass, Crown, Feather, Flame, Heart, ScrollText, Sprout, Star, Trophy, Lock } from "lucide-react";
import type { Badge } from "@/lib/learn";

const icons = { seed: Sprout, flame: Flame, star: Star, crown: Crown, heart: Heart, book: BookOpen, compass: Compass, trophy: Trophy, dove: Feather, scroll: ScrollText } as const;
const tones = {
  blue: "from-brand-400 to-brand-600 shadow-[0_5px_0_0_#173EA8]",
  sun: "from-sun-300 to-sun-400 shadow-[0_5px_0_0_#B7791F]",
  coral: "from-coral-400 to-coral-600 shadow-[0_5px_0_0_#9C3218]",
  mint: "from-mint-400 to-mint-600 shadow-[0_5px_0_0_#0E4E9C]",
  lilac: "from-lilac-400 to-brand-900 shadow-[0_5px_0_0_#0B1530]",
};

/** A round medal for a badge; greyed out with a lock until it's earned. */
export function BadgeIcon({ badge, size = 64, earned }: { badge: Badge; size?: number; earned: boolean }) {
  const Icon = earned ? icons[badge.icon] : Lock;
  return (
    <span aria-hidden className={clsx("relative inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-b ring-4 ring-white", earned ? tones[badge.tone] : "from-ink/10 to-ink/20 shadow-[0_5px_0_0_rgba(11,21,48,.18)]")} style={{ width: size, height: size }}>
      <Icon className={clsx(earned ? "text-white" : "text-ink/35")} style={{ width: size * 0.46, height: size * 0.46 }} strokeWidth={2.4} />
      {earned && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-white/80" />}
    </span>
  );
}
