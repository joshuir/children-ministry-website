import { useId } from "react";
import type { SceneKey, Tone } from "@/lib/types";

/**
 * Illustrated scenes used wherever a photo hasn't been uploaded yet.
 * They're drawn in SVG (no image requests), cropped with `slice` so they fill
 * any aspect ratio, and keep the focal motif in the centre third.
 */

const palette: Record<Tone, { bg: string; bg2: string; blob: string; accent: string; ink: string }> = {
  blue:  { bg: "#DCE7FF", bg2: "#B9CEFF", blob: "#5B8CFF", accent: "#FFC53D", ink: "#0B1530" },
  sun:   { bg: "#FFF4D1", bg2: "#FFE29A", blob: "#FFC53D", accent: "#2563EB", ink: "#0B1530" },
  coral: { bg: "#FFE4DC", bg2: "#FFC6B5", blob: "#FF7A59", accent: "#2563EB", ink: "#0B1530" },
  mint:  { bg: "#E3F1FF", bg2: "#BFDCFF", blob: "#4FA8FF", accent: "#FF7A59", ink: "#0B1530" },
  lilac: { bg: "#E4E8F5", bg2: "#C5CEEA", blob: "#1E3A8A", accent: "#FFC53D", ink: "#0B1530" },
  ink:   { bg: "#16224A", bg2: "#0B1530", blob: "#2563EB", accent: "#FFC53D", ink: "#0B1530" },
};

const skins = ["#5C3317", "#8D5524", "#3D2314", "#C68642", "#6B3F23"];
const shirts = ["#2563EB", "#FF7A59", "#4FA8FF", "#FFC53D", "#1E3A8A", "#0B1530"];

type Arms = "down" | "up" | "hold" | "pray" | "wave";

function Kid({ x, y, s = 1, i = 0, arms = "down", adult = false }: { x: number; y: number; s?: number; i?: number; arms?: Arms; adult?: boolean }) {
  const skin = skins[i % skins.length];
  const shirt = shirts[(i + 1) % shirts.length];
  const hair = i % 3 === 0 ? "puffs" : i % 3 === 1 ? "short" : "braids";
  const k = adult ? 1.35 : 1;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * k})`}>
      {/* body */}
      <rect x={-17} y={0} width={34} height={44} rx={16} fill={shirt} />
      {/* arms */}
      {arms === "up" && (<><path d="M-14 8 L-30 -22" stroke={skin} strokeWidth={8} strokeLinecap="round" /><path d="M14 8 L30 -22" stroke={skin} strokeWidth={8} strokeLinecap="round" /></>)}
      {arms === "wave" && (<><path d="M-14 10 L-24 32" stroke={skin} strokeWidth={8} strokeLinecap="round" /><path d="M14 8 L30 -20" stroke={skin} strokeWidth={8} strokeLinecap="round" /></>)}
      {arms === "down" && (<><path d="M-15 10 L-22 34" stroke={skin} strokeWidth={8} strokeLinecap="round" /><path d="M15 10 L22 34" stroke={skin} strokeWidth={8} strokeLinecap="round" /></>)}
      {arms === "hold" && (<><path d="M-14 10 L-6 26" stroke={skin} strokeWidth={8} strokeLinecap="round" /><path d="M14 10 L6 26" stroke={skin} strokeWidth={8} strokeLinecap="round" /></>)}
      {arms === "pray" && (<><path d="M-13 12 L-2 4" stroke={skin} strokeWidth={8} strokeLinecap="round" /><path d="M13 12 L2 4" stroke={skin} strokeWidth={8} strokeLinecap="round" /><path d="M0 -2 L0 8" stroke={skin} strokeWidth={7} strokeLinecap="round" /></>)}
      {/* head */}
      <circle cx={0} cy={-14} r={16} fill={skin} />
      {hair === "puffs" && (<><circle cx={-14} cy={-28} r={8} fill="#1B1210" /><circle cx={14} cy={-28} r={8} fill="#1B1210" /><path d="M-15 -18 a15 15 0 0 1 30 0 a15 10 0 0 0 -30 0" fill="#1B1210" /></>)}
      {hair === "short" && <path d="M-16 -15 a16 16 0 0 1 32 0 q-8 -7 -16 -6 q-8 -1 -16 6z" fill="#1B1210" />}
      {hair === "braids" && (<><path d="M-16 -14 a16 16 0 0 1 32 0 q-16 -10 -32 0z" fill="#1B1210" /><rect x={-20} y={-16} width={6} height={22} rx={3} fill="#1B1210" /><rect x={14} y={-16} width={6} height={22} rx={3} fill="#1B1210" /></>)}
      {/* face */}
      <circle cx={-5.5} cy={-13} r={1.8} fill="#0B1530" />
      <circle cx={5.5} cy={-13} r={1.8} fill="#0B1530" />
      <path d="M-5 -6 q5 5 10 0" stroke="#0B1530" strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <circle cx={-10} cy={-8} r={2.5} fill="#FF7A59" opacity={0.35} />
      <circle cx={10} cy={-8} r={2.5} fill="#FF7A59" opacity={0.35} />
    </g>
  );
}

const Sparkle = ({ x, y, s = 1, c }: { x: number; y: number; s?: number; c: string }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -10 C1.5 -2 2 -1.5 10 0 C2 1.5 1.5 2 0 10 C-1.5 2 -2 1.5 -10 0 C-2 -1.5 -1.5 -2 0 -10Z" fill={c} />
);

const Note = ({ x, y, c }: { x: number; y: number; c: string }) => (
  <g transform={`translate(${x} ${y})`} fill={c}><ellipse cx={0} cy={14} rx={6} ry={4.5} /><rect x={4.5} y={-8} width={2.5} height={22} /><path d="M7 -8 q10 4 8 14 q-2 -6 -8 -7z" /></g>
);

function Palm({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <path d="M0 0 L0 -60" stroke="#1E3A8A" strokeWidth={3} />
      {Array.from({ length: 7 }).map((_, i) => (
        <path key={i} d={`M0 ${-56 + i * 7} q${i % 2 ? 14 : -14} -4 ${i % 2 ? 22 : -22} 6`} stroke="#4FA8FF" strokeWidth={5} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
}

function Motif({ scene, p }: { scene: SceneKey; p: (typeof palette)[Tone] }) {
  switch (scene) {
    case "bible":
      return (
        <g>
          {[...Array(7)].map((_, i) => (
            <path key={i} d={`M200 170 L${120 + i * 27} 60`} stroke={p.accent} strokeWidth={4} strokeLinecap="round" opacity={0.5} />
          ))}
          <path d="M120 170 q40 -18 80 0 v52 q-40 -16 -80 0z" fill="#fff" stroke={p.ink} strokeWidth={3} />
          <path d="M280 170 q-40 -18 -80 0 v52 q40 -16 80 0z" fill="#fff" stroke={p.ink} strokeWidth={3} />
          {[0, 1, 2].map((i) => (<g key={i}><path d={`M134 ${184 + i * 10} q30 -9 56 0`} stroke={p.bg2} strokeWidth={3} fill="none" /><path d={`M266 ${184 + i * 10} q-30 -9 -56 0`} stroke={p.bg2} strokeWidth={3} fill="none" /></g>))}
          <Kid x={104} y={204} i={0} arms="wave" s={0.9} />
          <Kid x={296} y={204} i={1} arms="hold" s={0.9} />
        </g>
      );
    case "worship":
      return (
        <g>
          <Kid x={140} y={205} i={2} arms="up" />
          <Kid x={200} y={190} i={0} arms="up" s={1.1} />
          <Kid x={260} y={205} i={3} arms="up" />
          <Note x={110} y={90} c={p.ink} /><Note x={290} y={80} c={p.accent} /><Note x={225} y={60} c={p.ink} />
        </g>
      );
    case "harvest":
      return (
        <g>
          <ellipse cx={200} cy={150} rx={52} ry={24} fill="#B7791F" />
          <circle cx={170} cy={140} r={18} fill="#FF7A59" /><circle cx={204} cy={130} r={20} fill="#FFC53D" /><circle cx={232} cy={142} r={16} fill="#4FA8FF" />
          <path d="M196 112 q8 -22 22 -24 q-6 14 -14 26z" fill="#1E3A8A" />
          <path d="M148 150 h104 l-12 64 h-80z" fill="#D69E2E" stroke={p.ink} strokeWidth={3} />
          {[0, 1, 2].map((i) => <path key={i} d={`M152 ${168 + i * 16} h96`} stroke={p.ink} strokeWidth={2} opacity={0.4} />)}
          <Kid x={108} y={206} i={4} arms="wave" s={0.9} />
          <Kid x={292} y={206} i={1} arms="down" s={0.9} />
        </g>
      );
    case "parents":
      return (
        <g>
          <Kid x={160} y={168} i={2} arms="down" adult />
          <Kid x={240} y={200} i={0} arms="wave" />
          <path d="M200 70 c-14 -20 -42 -6 -30 16 l30 26 l30 -26 c12 -22 -16 -36 -30 -16z" fill={p.blob} />
        </g>
      );
    case "graduation":
      return (
        <g>
          <Kid x={200} y={190} i={1} arms="wave" s={1.15} />
          <path d="M160 152 l40 -18 l40 18 l-40 18z" fill={p.ink} transform="translate(0 -12)" />
          <path d="M236 142 v20" stroke={p.accent} strokeWidth={3} />
          <rect x={232} y={186} width={34} height={22} rx={4} fill="#fff" stroke={p.ink} strokeWidth={2.5} />
          <circle cx={262} cy={206} r={6} fill="#FF7A59" />
          {[[90, 80, "#FF7A59"], [310, 70, "#4FA8FF"], [120, 140, "#FFC53D"], [290, 130, "#1E3A8A"], [70, 190, "#2563EB"], [330, 200, "#FF7A59"]].map(([x, y, c], i) => (
            <rect key={i} x={x as number} y={y as number} width={10} height={6} rx={2} fill={c as string} transform={`rotate(${i * 37} ${x} ${y})`} />
          ))}
        </g>
      );
    case "hosanna":
      return (
        <g>
          <Palm x={120} y={190} r={-14} /><Kid x={140} y={205} i={3} arms="hold" />
          <Palm x={205} y={180} r={6} /><Kid x={200} y={196} i={0} arms="hold" s={1.08} />
          <Palm x={275} y={190} r={16} /><Kid x={260} y={205} i={4} arms="hold" />
        </g>
      );
    case "evangelism":
      return (
        <g>
          <circle cx={200} cy={110} r={46} fill="#fff" stroke={p.ink} strokeWidth={3} />
          <path d="M162 96 q20 -6 26 10 q10 14 -6 22 q-14 4 -18 -10z M206 74 q20 4 30 22 q-12 4 -20 -4 q-12 -4 -10 -18z M214 128 q12 -8 22 2 q-4 14 -18 16z" fill={p.blob} />
          <Kid x={120} y={205} i={1} arms="wave" />
          <Kid x={282} y={205} i={2} arms="hold" />
          <rect x={272} y={222} width={20} height={14} rx={2} fill="#fff" stroke={p.ink} strokeWidth={2} />
          <Sparkle x={140} y={70} c={p.accent} /><Sparkle x={270} y={60} c={p.accent} s={0.7} />
        </g>
      );
    case "excursion":
      return (
        <g>
          <circle cx={110} cy={140} r={36} fill="#4FA8FF" /><rect x={106} y={160} width={8} height={40} fill="#1E3A8A" />
          <circle cx={300} cy={130} r={44} fill="#4FA8FF" /><rect x={296} y={160} width={8} height={44} fill="#1E3A8A" />
          <rect x={140} y={150} width={130} height={62} rx={14} fill="#FFC53D" stroke={p.ink} strokeWidth={3} />
          {[0, 1, 2].map((i) => <rect key={i} x={152 + i * 36} y={162} width={28} height={22} rx={5} fill="#DCE7FF" stroke={p.ink} strokeWidth={2} />)}
          <circle cx={170} cy={214} r={12} fill={p.ink} /><circle cx={244} cy={214} r={12} fill={p.ink} />
          <circle cx={170} cy={214} r={4} fill="#fff" /><circle cx={244} cy={214} r={4} fill="#fff" />
        </g>
      );
    case "camping":
      return (
        <g>
          {[[60, 50], [120, 30], [300, 40], [350, 80], [250, 24], [180, 60]].map(([x, y], i) => <Sparkle key={i} x={x} y={y} s={0.5 + (i % 3) * 0.2} c="#FFD966" />)}
          <circle cx={330} cy={60} r={18} fill="#FFF4D1" /><circle cx={338} cy={54} r={16} fill={p.bg2} />
          <path d="M110 214 l60 -100 l60 100z" fill="#FF7A59" stroke="#FFF4D1" strokeWidth={3} />
          <path d="M170 114 l-18 100 h36z" fill="#D9472A" />
          <path d="M270 214 q-14 -24 6 -40 q4 16 14 12 q10 18 -4 28z" fill="#FFC53D" />
          <path d="M276 214 q-6 -14 4 -22 q2 10 8 8 q4 10 -4 14z" fill="#FF7A59" />
          <rect x={256} y={212} width={44} height={6} rx={3} fill="#8D5524" />
          <Kid x={312} y={204} i={0} arms="down" s={0.85} />
        </g>
      );
    case "craft":
      return (
        <g>
          <rect x={192} y={130} width={18} height={90} rx={6} fill="#8D5524" />
          <circle cx={200} cy={110} r={62} fill="#4FA8FF" />
          {[[160, 90, "#FFC53D"], [200, 70, "#FF7A59"], [240, 92, "#1E3A8A"], [176, 130, "#2563EB"], [226, 128, "#FFC53D"], [200, 104, "#fff"], [148, 118, "#FF7A59"], [252, 120, "#fff"]].map(([x, y, c], i) => (
            <ellipse key={i} cx={x as number} cy={y as number} rx={10} ry={6} fill={c as string} transform={`rotate(${i * 40 - 30} ${x} ${y})`} />
          ))}
          <Kid x={116} y={208} i={3} arms="up" s={0.9} />
          <Kid x={286} y={208} i={0} arms="wave" s={0.9} />
        </g>
      );
    case "prayer":
      return (
        <g>
          <path d="M200 64 q-30 -16 -50 4 q24 -2 34 14 q-30 6 -28 26 q22 -18 44 -12 q22 -6 44 12 q2 -20 -28 -26 q10 -16 34 -14 q-20 -20 -50 -4z" fill="#fff" stroke={p.ink} strokeWidth={2.5} />
          <Kid x={150} y={200} i={1} arms="pray" />
          <Kid x={250} y={200} i={4} arms="pray" />
          <Sparkle x={110} y={110} c={p.accent} /><Sparkle x={292} y={104} c={p.accent} s={0.8} />
        </g>
      );
    case "music":
      return (
        <g>
          <Kid x={200} y={186} i={2} arms="hold" s={1.1} />
          <g transform="translate(200 214) rotate(-28)">
            <ellipse cx={-14} cy={0} rx={22} ry={18} fill="#D69E2E" stroke={p.ink} strokeWidth={2.5} />
            <circle cx={-14} cy={0} r={6} fill={p.ink} />
            <rect x={6} y={-4} width={60} height={8} rx={3} fill="#8D5524" />
          </g>
          <Note x={110} y={100} c={p.ink} /><Note x={290} y={90} c={p.accent} /><Note x={260} y={150} c={p.ink} /><Note x={140} y={150} c={p.accent} />
        </g>
      );
    case "app":
      return (
        <g>
          <rect x={150} y={40} width={100} height={200} rx={20} fill={p.ink} />
          <rect x={158} y={50} width={84} height={180} rx={14} fill="#fff" />
          <rect x={166} y={62} width={68} height={44} rx={8} fill={p.bg2} />
          <rect x={166} y={114} width={50} height={6} rx={3} fill={p.ink} opacity={0.8} />
          <rect x={166} y={126} width={64} height={5} rx={2.5} fill={p.ink} opacity={0.25} />
          <rect x={166} y={136} width={56} height={5} rx={2.5} fill={p.ink} opacity={0.25} />
          <rect x={166} y={152} width={68} height={28} rx={8} fill={p.blob} />
          <rect x={166} y={188} width={32} height={30} rx={8} fill="#FFC53D" /><rect x={202} y={188} width={32} height={30} rx={8} fill="#4FA8FF" />
          <Sparkle x={110} y={80} c={p.accent} /><Sparkle x={292} y={190} c={p.accent} s={0.7} />
        </g>
      );
    case "sunrise":
    default:
      return (
        <g>
          <circle cx={200} cy={170} r={58} fill={p.accent} opacity={0.9} />
          {[...Array(9)].map((_, i) => {
            const a = (Math.PI * (i + 1)) / 10;
            return <path key={i} d={`M${200 - Math.cos(a) * 72} ${170 - Math.sin(a) * 72} L${200 - Math.cos(a) * 92} ${170 - Math.sin(a) * 92}`} stroke={p.accent} strokeWidth={5} strokeLinecap="round" />;
          })}
          <path d="M150 170 v-40 l50 -30 l50 30 v40z" fill="#fff" stroke={p.ink} strokeWidth={3} />
          <path d="M200 80 v-22 M190 66 h20" stroke={p.ink} strokeWidth={4} strokeLinecap="round" />
          <rect x={188} y={136} width={24} height={34} rx={12} fill={p.blob} />
        </g>
      );
  }
}

export function Scene({ scene = "sunrise", tone = "blue", className, title }: { scene?: SceneKey; tone?: Tone; className?: string; title?: string }) {
  const p = palette[tone];
  // Unique per instance: shared ids made Safari resolve url(#…) to a copy inside a hidden menu and paint it black.
  const id = `${scene}-${tone}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 400 280" preserveAspectRatio="xMidYMid slice" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.bg} />
          <stop offset="1" stopColor={p.bg2} />
        </linearGradient>
      </defs>
      <rect width="400" height="280" fill={`url(#bg-${id})`} />
      <circle cx="40" cy="250" r="90" fill={p.blob} opacity={0.18} />
      <circle cx="380" cy="30" r="70" fill={p.blob} opacity={0.14} />
      <path d="M0 236 q100 -26 200 -6 t200 -4 v60 h-400z" fill={tone === "ink" ? "#0E2463" : "#fff"} opacity={tone === "ink" ? 1 : 0.55} />
      <Motif scene={scene} p={p} />
    </svg>
  );
}
