/**
 * Email design system for EVHERFIT. Hand-rolled, table-based, inline-styled
 * HTML — the only thing that renders reliably across Gmail, Outlook and Apple
 * Mail. No web fonts (Outlook ignores them), so the wordmark is styled text.
 *
 * Brand tokens mirror globals.css: indigo #2b337d, deep #232a68, soft #e6e8f4,
 * pink #e56ca5 / soft #fce4ec, ink #22242c, muted #5e6478, page #f4f5f9.
 */

export const brand = {
  indigo: "#2b337d",
  indigoDeep: "#232a68",
  indigoSoft: "#e6e8f4",
  pink: "#e56ca5",
  pinkSoft: "#fce4ec",
  ink: "#22242c",
  muted: "#5e6478",
  line: "#e3e5f0",
  page: "#f4f5f9",
  card: "#ffffff",
  white: "#ffffff",
  green: "#1d9e75",
};

const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;

export function siteUrl(path = "") {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://evherfit.com").replace(/\/$/, "");
  return `${base}${path}`;
}

export function inr(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

export function fmtDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---------- components ---------- */

/** Bulletproof CTA button (table-wrapped anchor — survives Outlook). */
export function button(label: string, href: string, opts?: { color?: string }) {
  const bg = opts?.color ?? brand.indigo;
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0">
    <tr><td align="center" bgcolor="${bg}" style="border-radius:9999px">
      <a href="${href}" target="_blank"
         style="display:inline-block;padding:14px 32px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:9999px">
        ${esc(label)}
      </a>
    </td></tr>
  </table>`;
}

/** A label/value row for the summary table. `strong` and `accent` style the value. */
export function row(label: string, value: string, opts?: { strong?: boolean; color?: string }) {
  const color = opts?.color ?? brand.ink;
  const weight = opts?.strong ? "700" : "400";
  return `
  <tr>
    <td style="padding:9px 0;font-family:${FONT};font-size:14px;color:${brand.muted}">${esc(label)}</td>
    <td align="right" style="padding:9px 0;font-family:${FONT};font-size:14px;font-weight:${weight};color:${color}">${value}</td>
  </tr>`;
}

export function summary(rows: string) {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
         style="margin:8px 0 4px;border-top:1px solid ${brand.line};border-bottom:1px solid ${brand.line}">
    ${rows}
  </table>`;
}

/** Tinted callout box (tracking number, refund note, etc.). */
export function panel(html: string, opts?: { bg?: string; border?: string }) {
  const bg = opts?.bg ?? brand.indigoSoft;
  const border = opts?.border ?? "transparent";
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0">
    <tr><td bgcolor="${bg}" style="padding:16px 20px;border-radius:12px;border:1px solid ${border};font-family:${FONT};font-size:14px;color:${brand.ink};line-height:1.6">
      ${html}
    </td></tr>
  </table>`;
}

export function heading(text: string) {
  return `<h1 style="margin:0 0 12px;font-family:${FONT};font-size:22px;font-weight:700;color:${brand.ink};line-height:1.3">${esc(text)}</h1>`;
}

export function paragraph(html: string) {
  return `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;color:${brand.muted};line-height:1.65">${html}</p>`;
}

export function mono(text: string) {
  return `<span style="font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:13px;color:${brand.ink}">${esc(text)}</span>`;
}

/* ---------- shell ---------- */

const footerLinks = [
  ["Track order", "/track"],
  ["Shipping", "/shipping"],
  ["Returns", "/refunds"],
  ["Contact", "/contact"],
];

/**
 * Wrap body HTML in the branded shell. `preheader` is the hidden inbox-preview
 * line. `accent` swaps the header bar colour (e.g. pink for delight moments).
 */
export function shell(
  bodyHtml: string,
  opts: { preheader: string; headerBar?: string }
) {
  const bar = opts.headerBar ?? brand.indigo;
  const support = process.env.SUPPORT_EMAIL ?? "support@evherfit.com";

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>EVHERFIT</title>
</head>
<body style="margin:0;padding:0;background:${brand.page};-webkit-text-size-adjust:100%">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${brand.page}">
    ${esc(opts.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${brand.page}">
    <tr><td align="center" style="padding:32px 16px">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
             style="width:600px;max-width:100%;background:${brand.card};border-radius:18px;overflow:hidden;border:1px solid ${brand.line}">

        <!-- header -->
        <tr><td bgcolor="${bar}" style="padding:32px 40px;text-align:center">
          <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:700;font-size:28px;letter-spacing:1px;color:#ffffff">EVHERFIT</div>
          <div style="margin-top:6px;font-family:${FONT};font-size:11px;letter-spacing:4px;color:#c7cbed;text-transform:uppercase">Be the woman</div>
        </td></tr>

        <!-- body -->
        <tr><td style="padding:36px 40px">
          ${bodyHtml}
        </td></tr>

        <!-- footer -->
        <tr><td style="padding:28px 40px;background:${brand.page};border-top:1px solid ${brand.line}">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="padding-bottom:14px">
              ${footerLinks
                .map(
                  ([label, path]) =>
                    `<a href="${siteUrl(path)}" target="_blank" style="font-family:${FONT};font-size:13px;color:${brand.indigo};text-decoration:none;margin-right:18px">${label}</a>`
                )
                .join("")}
            </td></tr>
            <tr><td style="font-family:${FONT};font-size:12px;color:${brand.muted};line-height:1.6">
              Questions? Email <a href="mailto:${support}" style="color:${brand.indigo}">${support}</a>.<br>
              Evherfit · India · You're receiving this because you placed an order with us.<br>
              © ${new Date().getFullYear()} Evherfit. All rights reserved.
            </td></tr>
          </table>
        </td></tr>

      </table>

    </td></tr>
  </table>
</body></html>`;
}
