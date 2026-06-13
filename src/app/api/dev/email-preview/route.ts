import { emailPreviews } from "@/lib/email/samples";

/**
 * Dev-only email gallery. Open /api/dev/email-preview to see every template
 * stacked in iframes; add ?t=<key> (e.g. ?t=shipped) to view one raw, full
 * page — handy for forwarding a single template to a real inbox to test
 * rendering. Returns 404 in production so it's never publicly exposed.
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const previews = emailPreviews();
  const { searchParams } = new URL(req.url);
  const wanted = searchParams.get("t");

  if (wanted) {
    const hit = previews.find((p) => p.key === wanted);
    if (!hit) return new Response(`Unknown template "${wanted}"`, { status: 404 });
    return new Response(hit.email.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }

  const cards = previews
    .map(
      (p) => `
      <section style="margin:0 auto 40px;max-width:680px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin-bottom:10px">
          <div>
            <div style="font-weight:600;color:#22242c">${p.email.subject}</div>
            <div style="font-size:13px;color:#5e6478">${p.when}</div>
          </div>
          <a href="?t=${p.key}" style="font-size:13px;color:#2b337d;white-space:nowrap">open raw &rarr;</a>
        </div>
        <iframe srcdoc="${p.email.html.replace(/"/g, "&quot;")}"
                style="width:100%;height:680px;border:1px solid #e3e5f0;border-radius:14px;background:#f4f5f9"></iframe>
      </section>`
    )
    .join("");

  const page = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>EVHERFIT email previews</title></head>
<body style="margin:0;padding:40px 16px;background:#eef0f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <div style="max-width:680px;margin:0 auto 28px">
    <h1 style="margin:0;font-size:24px;color:#22242c">EVHERFIT email previews</h1>
    <p style="margin:6px 0 0;font-size:14px;color:#5e6478">Dev-only gallery · ${previews.length} templates · sample data. Append <code>?t=&lt;key&gt;</code> to view one raw.</p>
  </div>
  ${cards}
</body></html>`;

  return new Response(page, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
