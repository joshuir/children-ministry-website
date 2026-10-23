import { requireAdmin, requireOwner } from "@/lib/cms/auth";
import { authenticate, hashPassword, loadStaff, normUser, ownerAccount, passwordProblem, toPublic, updateStaff, validUsername, type PublicStaff } from "@/lib/cms/staff";
import { bad, body, clean } from "@/lib/cms/http";

export const dynamic = "force-dynamic";
const json = (d: unknown, status = 200) => Response.json(d, { status, headers: { "Cache-Control": "no-store" } });

/** Owner: list every account. Editors: just themselves. */
export async function GET() {
  const s = await requireAdmin();
  if (s instanceof Response) return s;
  if (s.role !== "owner") return json({ me: s, accounts: [] });
  const owner = ownerAccount();
  const { list } = await loadStaff(true);
  const accounts: PublicStaff[] = [...(owner ? [{ username: owner.username, name: owner.name, role: "owner" as const, fromEnv: true }] : []), ...list.map(toPublic)];
  return json({ me: s, accounts });
}

/** Owner: create an editor account. */
export async function POST(req: Request) {
  const s = await requireOwner(req);
  if (s instanceof Response) return s;
  const b = await body<{ username?: string; name?: string; password?: string }>(req);
  const username = normUser(b?.username);
  const name = clean(b?.name, 60);
  if (!validUsername(username)) return bad("Usernames are 3–32 characters: lowercase letters, numbers, dots, dashes or underscores.");
  if (!name) return bad("Add the person's name.");
  const problem = passwordProblem(b?.password, username);
  if (problem) return bad(problem);
  if (username === ownerAccount()?.username) return bad("That username is taken.");
  const h = await hashPassword(String(b!.password));
  try {
    await updateStaff((list) => {
      if (list.some((r) => r.username === username)) throw new Error("taken");
      if (list.length >= 50) throw new Error("limit");
      return [...list, { username, name, role: "editor", ...h, createdAt: new Date().toISOString(), createdBy: s.username }];
    });
  } catch (e: any) {
    return bad(e?.message === "taken" ? "That username is taken." : e?.message === "limit" ? "You've reached the limit of 50 accounts." : "Couldn't create the account.");
  }
  return json({ ok: true });
}

/**
 * PATCH { username, name?, password?, disabled? } — owner edits an editor.
 * PATCH { self: true, currentPassword, newPassword } — any editor changes their own password.
 * Changing a password or disabling an account signs that person out everywhere.
 */
export async function PATCH(req: Request) {
  const s = await requireAdmin(req);
  if (s instanceof Response) return s;
  const b = await body<{ self?: boolean; username?: string; name?: string; password?: string; disabled?: boolean; currentPassword?: string; newPassword?: string }>(req);
  if (!b) return bad("Nothing to change.");

  if (b.self) {
    if (s.role === "owner") return bad("The owner password is set in the hosting environment variables (ADMIN_PASSWORD).");
    if (!(await authenticate(s.username, b.currentPassword))) return bad("Your current password isn't right.", 401);
    const problem = passwordProblem(b.newPassword, s.username);
    if (problem) return bad(problem);
    const h = await hashPassword(String(b.newPassword));
    await updateStaff((list) => list.map((r) => (r.username === s.username ? { ...r, ...h, updatedAt: new Date().toISOString() } : r)));
    return json({ ok: true, signedOut: true });
  }

  if (s.role !== "owner") return bad("Only the site owner can do that.", 403);
  const username = normUser(b.username);
  const { list } = await loadStaff(true);
  if (!list.some((r) => r.username === username)) return bad("No account with that username.", 404);
  let h: Awaited<ReturnType<typeof hashPassword>> | null = null;
  if (b.password !== undefined) {
    const problem = passwordProblem(b.password, username);
    if (problem) return bad(problem);
    h = await hashPassword(String(b.password));
  }
  const name = b.name !== undefined ? clean(b.name, 60) : undefined;
  await updateStaff((all) => all.map((r) => {
    if (r.username !== username) return r;
    const next = { ...r, updatedAt: new Date().toISOString() };
    if (name) next.name = name;
    if (h) Object.assign(next, h);
    if (typeof b.disabled === "boolean") { next.disabled = b.disabled; if (b.disabled) next.pv = (h?.pv ?? crypto.randomUUID().replace(/-/g, "").slice(0, 16)); }
    return next;
  }));
  return json({ ok: true });
}

/** Owner: remove an editor account (their sessions end immediately). */
export async function DELETE(req: Request) {
  const s = await requireOwner(req);
  if (s instanceof Response) return s;
  const b = await body<{ username?: string }>(req);
  const username = normUser(b?.username);
  await updateStaff((list) => list.filter((r) => r.username !== username));
  return json({ ok: true });
}
