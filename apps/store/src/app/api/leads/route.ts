import { NextResponse } from "next/server";
import { parseLead, saveLead } from "@everfit/core/lib/leads";

/**
 * Public lead intake for the landing sites (1-to-1.evherfit.com). The browser
 * fires this with navigator.sendBeacon as it hands off to WhatsApp, so the body
 * arrives as text/plain and nobody reads the response — req.json() parses it
 * regardless of content type, and no CORS headers are needed.
 */

// A browser always sends Origin on a cross-site POST, so this keeps other
// websites from writing into the panel. It does not stop a script that forges
// the header. ponytail: no rate limit — add one if junk leads start appearing.
const ALLOWED_ORIGIN = /^https:\/\/([a-z0-9-]+\.)?evherfit\.com$/;

export async function POST(req: Request) {
  const origin = req.headers.get("origin") ?? "";
  if (process.env.NODE_ENV === "production" && !ALLOWED_ORIGIN.test(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const lead = parseLead(await req.json().catch(() => null));
  if (!lead) return NextResponse.json({ error: "Invalid application" }, { status: 400 });

  await saveLead(lead);
  return NextResponse.json({ ok: true });
}
