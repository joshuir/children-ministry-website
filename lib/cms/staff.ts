import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { privatePrefix, readJson, writeJson, ConflictError } from "./store";

/**
 * Staff accounts for the content manager.
 *
 *  - The OWNER account comes from the Vercel environment (ADMIN_USERNAME + ADMIN_PASSWORD).
 *    It can't be locked out or deleted from inside the CMS, and only the owner can manage staff.
 *  - EDITOR accounts are created by the owner. Each has its own username and password.
 *    Passwords are hashed with scrypt (salted, slow) and the whole account file is
 *    additionally encrypted with AES-256-GCM using a key derived from AUTH_SECRET, so the
 *    stored file is unreadable even if its address were ever discovered.
 *  - Every account carries a "password version" (pv). It changes whenever the password is
 *    reset or the account is disabled, which instantly signs out every session for that person.
 */

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number, opts: object) => Promise<Buffer>;
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export type Role = "owner" | "editor";
export interface StaffRecord { username: string; name: string; role: "editor"; salt: string; hash: string; pv: string; disabled?: boolean; createdAt: string; createdBy: string; updatedAt?: string }
export interface PublicStaff { username: string; name: string; role: Role; disabled?: boolean; createdAt?: string; createdBy?: string; updatedAt?: string; fromEnv?: boolean }
export interface Account { username: string; name: string; role: Role; pv: string }

export const MIN_PASSWORD = 12;
export const normUser = (u: unknown) => String(u ?? "").trim().toLowerCase();
export const validUsername = (u: string) => /^[a-z0-9][a-z0-9._-]{2,31}$/.test(u);

/** AUTH_SECRET, or null when it's missing in production (then nobody can sign in — fail closed). */
export function authSecret(): string | null {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") return null;
  return "local-dev-secret-only-for-npm-run-dev";
}

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/* ---------------- owner (from environment) ---------------- */

export function ownerAccount(): (Account & { password: string }) | null {
  const password = process.env.ADMIN_PASSWORD || (process.env.NODE_ENV === "production" ? "" : "admin");
  const username = normUser(process.env.ADMIN_USERNAME || (process.env.NODE_ENV === "production" ? "" : "admin"));
  const secret = authSecret();
  if (!password || !username || !secret) return null;
  return { username, name: process.env.ADMIN_NAME || "Site owner", role: "owner", pv: sha(secret + ":owner:" + username + ":" + password).slice(0, 16), password };
}

/* ---------------- encrypted account file ---------------- */

const FILE = () => privatePrefix() + "staff/accounts.enc.json";
interface Sealed { v: 1; iv: string; tag: string; data: string }

function key() {
  const s = authSecret();
  if (!s) throw new Error("Sign-in is disabled: AUTH_SECRET is not set.");
  return createHash("sha256").update("cms-staff-key:" + s).digest();
}
function seal(list: StaffRecord[]): Sealed {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(JSON.stringify(list), "utf8"), c.final()]);
  return { v: 1, iv: iv.toString("base64"), tag: c.getAuthTag().toString("base64"), data: data.toString("base64") };
}
function open(s: Sealed): StaffRecord[] {
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(s.iv, "base64"));
  d.setAuthTag(Buffer.from(s.tag, "base64"));
  return JSON.parse(Buffer.concat([d.update(Buffer.from(s.data, "base64")), d.final()]).toString("utf8"));
}

let cache: { at: number; list: StaffRecord[]; etag: string | null } | null = null;

export async function loadStaff(fresh = false): Promise<{ list: StaffRecord[]; etag: string | null }> {
  if (!fresh && cache && Date.now() - cache.at < 10_000) return cache;
  const r = await readJson<Sealed>(FILE());
  const list = r ? open(r.data) : [];
  cache = { at: Date.now(), list, etag: r ? r.etag : null };
  return cache;
}

/** Read-modify-write with optimistic concurrency (retries once on a clash). */
export async function updateStaff(fn: (list: StaffRecord[]) => StaffRecord[]) {
  for (let i = 0; i < 2; i++) {
    const { list, etag } = await loadStaff(true);
    const next = fn(structuredClone(list));
    try {
      const tag = await writeJson(FILE(), seal(next), etag);
      cache = { at: Date.now(), list: next, etag: tag };
      return next;
    } catch (e) {
      if (!(e instanceof ConflictError) || i === 1) throw e;
    }
  }
  throw new Error("Couldn't save accounts.");
}

/* ---------------- passwords ---------------- */

export async function hashPassword(pw: string) {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64, SCRYPT);
  return { salt: salt.toString("base64"), hash: hash.toString("base64"), pv: randomBytes(8).toString("hex") };
}

async function verifyHash(pw: string, salt: string, hash: string) {
  const got = await scrypt(pw, Buffer.from(salt, "base64"), 64, SCRYPT);
  const want = Buffer.from(hash, "base64");
  return got.length === want.length && timingSafeEqual(got, want);
}

const DUMMY = { salt: randomBytes(16).toString("base64"), hash: randomBytes(64).toString("base64") };

/** Returns the account when (and only when) the username AND password are both correct. */
export async function authenticate(usernameRaw: unknown, passwordRaw: unknown): Promise<Account | null> {
  const username = normUser(usernameRaw);
  const password = typeof passwordRaw === "string" ? passwordRaw : "";
  if (!username || !password || password.length > 200 || !authSecret()) return null;

  const owner = ownerAccount();
  if (owner && safeEqual(username, owner.username)) {
    const s = authSecret()!;
    const ok = safeEqual(createHmac("sha256", s).update(password).digest("hex"), createHmac("sha256", s).update(owner.password).digest("hex"));
    return ok ? { username: owner.username, name: owner.name, role: "owner", pv: owner.pv } : null;
  }

  const { list } = await loadStaff();
  const rec = list.find((r) => r.username === username);
  // Always run the slow hash so response time doesn't reveal whether a username exists.
  const ok = await verifyHash(password, rec?.salt ?? DUMMY.salt, rec?.hash ?? DUMMY.hash);
  if (!rec || rec.disabled || !ok) return null;
  return { username: rec.username, name: rec.name, role: "editor", pv: rec.pv };
}

/** Confirms a signed-in session still belongs to a live account with the same password version. */
export async function currentAccount(username: string, pv: string): Promise<Account | null> {
  const owner = ownerAccount();
  if (owner && username === owner.username) return safeEqual(pv, owner.pv) ? { username, name: owner.name, role: "owner", pv } : null;
  const { list } = await loadStaff();
  const rec = list.find((r) => r.username === username);
  if (!rec || rec.disabled || !safeEqual(pv, rec.pv)) return null;
  return { username, name: rec.name, role: "editor", pv };
}

export function toPublic(r: StaffRecord): PublicStaff {
  return { username: r.username, name: r.name, role: r.role, disabled: r.disabled, createdAt: r.createdAt, createdBy: r.createdBy, updatedAt: r.updatedAt };
}

export function passwordProblem(pw: unknown, username?: string): string | null {
  if (typeof pw !== "string" || pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (pw.length > 200) return "That password is too long.";
  if (username && pw.toLowerCase().includes(username)) return "The password mustn't contain the username.";
  if (/^(.)\1+$/.test(pw) || /^(password|123456|qwerty)/i.test(pw)) return "Choose a less predictable password.";
  return null;
}
