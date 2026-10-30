import { loadLeadFields, saveLeadFields } from "@/lib/office-live";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return NextResponse.json({ ok: true, fields: await loadLeadFields(id) });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { fields?: Record<string, string> } | null;
  const error = await saveLeadFields(id, body?.fields ?? {});
  if (error) return NextResponse.json({ ok: false, message: error }, { status: 503 });
  return NextResponse.json({ ok: true });
}
