import { NextResponse } from "next/server";
import { COOKIE, cookieOptions } from "@/lib/cms/auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, "", { ...cookieOptions, maxAge: 0 });
  res.cookies.set("cm_admin", "", { path: "/", maxAge: 0 }); // old cookie from the previous sign-in system
  return res;
}
