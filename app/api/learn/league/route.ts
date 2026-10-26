import { mutateJson, readJson } from "@/lib/cms/store";
import { bad, body, rateLimit } from "@/lib/cms/http";
import { weekKey } from "@/lib/learn";

export const dynamic = "force-dynamic";

/**
 * Team league: XP pooled by age group for the current week. Completely anonymous — only three
 * numbers are stored, no names, devices or IP addresses.
 */
type Board = { week: string; teams: Record<string, number> };
const key = (week: string) => `learn/league-${week}.json`;
const empty = (week: string): Board => ({ week, teams: { 1: 0, 2: 0, 3: 0 } });

export async function GET() {
  const week = weekKey();
  const res = await readJson<Board>(key(week)).catch(() => null);
  return Response.json(res?.data ?? empty(week), { headers: { "Cache-Control": "public, max-age=0, s-maxage=30, stale-while-revalidate=60" } });
}

/** Body: { team: 1|2|3, xp } — called when a lesson finishes. */
export async function POST(req: Request) {
  if (!rateLimit(req, "league", 30, 10 * 60_000)) return bad("Slow down a little 🙂", 429);
  const b = await body<{ team: number; xp: number }>(req);
  const team = Number(b?.team), xp = Math.round(Number(b?.xp));
  if (![1, 2, 3].includes(team) || !Number.isFinite(xp) || xp <= 0 || xp > 200) return bad("Bad score.");
  const week = weekKey();
  const board = await mutateJson<Board>(key(week), () => empty(week), (cur) => ({ week, teams: { ...cur.teams, [team]: (cur.teams[team] || 0) + xp } }));
  return Response.json(board);
}
