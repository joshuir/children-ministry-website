import { requireAdmin } from "@/lib/cms/auth";
import { deleteInbox, listInbox, listSubscribers, removeSubscriber, updateInbox } from "@/lib/cms/data";
import { bad, body } from "@/lib/cms/http";
import { buildXlsx } from "@/lib/xlsx";

const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const stamp = () => new Date().toISOString().slice(0, 10);

export const dynamic = "force-dynamic";

const csvCell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s; // stop spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: Record<string, unknown>[], cols: string[]) => [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n");

export async function GET(req: Request) {
  const s = await requireAdmin();
  if (s instanceof Response) return s;
  const q = new URL(req.url).searchParams;
  const what = q.get("what") || "messages";
  if (what === "subscribers") {
    const subs = await listSubscribers();
    if (q.get("format") === "csv") return new Response(csv(subs as any, ["email", "name", "createdAt", "source"]), { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="subscribers.csv"' } });
    if (q.get("format") === "xlsx") {
      // One running sheet of every subscriber (newest last), ready for a mail-merge or BCC.
      const sorted = [...subs].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const buf = buildXlsx([
        { name: "Subscribers", columns: [{ header: "#", width: 6 }, { header: "Name", width: 26 }, { header: "First name", width: 14 }, { header: "Email", width: 36 }, { header: "Subscribed", width: 20 }, { header: "Source", width: 12 }, { header: "Status", width: 12 }],
          rows: sorted.map((x, i) => [i + 1, x.name || "", (x.name || "").split(/\s+/)[0] || "", x.email, new Date(x.createdAt), x.source || "website", "Subscribed"]) },
        { name: "Send list", columns: [{ header: "BCC — paste into your email", width: 90 }],
          rows: [[sorted.map((x) => x.email).join("; ")], [`${sorted.length} addresses · exported ${stamp()}`]] },
      ]);
      return new Response(new Uint8Array(buf), { headers: { "Content-Type": XLSX, "Content-Disposition": `attachment; filename="newsletter-subscribers-${stamp()}.xlsx"`, "Cache-Control": "no-store" } });
    }
    return Response.json({ subscribers: subs }, { headers: { "Cache-Control": "no-store" } });
  }
  const msgs = await listInbox();
  if (q.get("format") === "csv") return new Response(csv(msgs as any, ["createdAt", "kind", "name", "email", "phone", "topic", "message"]), { headers: { "Content-Type": "text/csv", "Content-Disposition": 'attachment; filename="messages.csv"' } });
  if (q.get("format") === "xlsx") {
    const buf = buildXlsx([{ name: "Messages", columns: [{ header: "Received", width: 20 }, { header: "Type", width: 10 }, { header: "Name", width: 22 }, { header: "Email", width: 30 }, { header: "Phone", width: 16 }, { header: "Topic", width: 18 }, { header: "Message", width: 70 }],
      rows: msgs.map((m: any) => [new Date(m.createdAt), m.kind, m.name, m.email, m.phone, m.topic, m.message]) }]);
    return new Response(new Uint8Array(buf), { headers: { "Content-Type": XLSX, "Content-Disposition": `attachment; filename="messages-${stamp()}.xlsx"`, "Cache-Control": "no-store" } });
  }
  return Response.json({ messages: msgs }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(req: Request) {
  const s = await requireAdmin(req);
  if (s instanceof Response) return s;
  const b = await body<{ id: string; read: boolean }>(req);
  if (!b?.id) return bad("Missing id.");
  await updateInbox(b.id, { read: !!b.read });
  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const s = await requireAdmin(req);
  if (s instanceof Response) return s;
  const b = await body<{ id?: string; email?: string }>(req);
  if (b?.email) await removeSubscriber(b.email);
  else if (b?.id) await deleteInbox(b.id);
  else return bad("Missing id.");
  return Response.json({ ok: true });
}
