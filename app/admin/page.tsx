import type { Metadata } from "next";
import { getSession } from "@/lib/cms/auth";
import { Cms } from "./cms/Cms";
import { Login } from "./Login";

export const metadata: Metadata = { title: "Content manager", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  // Covers the public header/footer so the CMS gets the full screen.
  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-paper">{session ? <Cms user={session} /> : <Login />}</div>;
}
