import { NextResponse } from "next/server";
import { parseLead, saveLead } from "@everfit/core/lib/leads";
import { sendLeadNotification } from "@everfit/core/lib/notify";

/**
 * Public lead intake for the landing sites (1-to-1.evherfit.com). The form
 * posts its JSON as a plain string, which a browser sends as text/plain — a
 * "simple" cross-origin request with no preflight, so there is no OPTIONS
 * handler here. req.json() parses the body regardless of content type.
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

  // The form shows the visitor "submitted" or "try again" from this response,
  // and a page on another origin may only read it if we name that origin.
  const headers = origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : undefined;

  const lead = parseLead(await req.json().catch(() => null));
  if (!lead) return NextResponse.json({ error: "Invalid application" }, { status: 400, headers });

  // Awaited, not fire-and-forget: a serverless function can be frozen the moment
  // it responds. A failed email is logged, never thrown — the lead is saved.
  if (await saveLead(lead)) await sendLeadNotification(lead);
  return NextResponse.json({ ok: true }, { headers });
}
