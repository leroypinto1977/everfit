import { requireOwner } from "@/lib/admin-auth";
import { emailPreviews } from "@everfit/core/lib/email/samples";
import { emailConfigured } from "@everfit/core/lib/notify";
import TestSendForm from "./TestSendForm";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  const me = await requireOwner();
  const previews = emailPreviews();
  const configured = emailConfigured();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold italic">Email previews</h1>
        <p className="mt-1 text-sm text-[#6b7194]">
          Every transactional email the store sends, with sample data. Live sending requires
          BREVO_API_KEY and a verified sending domain.
        </p>
      </div>

      {configured ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm text-emerald-800">
          ✓ Brevo is configured — customer and admin emails are being sent
          {process.env.EMAIL_FROM ? (
            <> from <strong>{process.env.EMAIL_FROM}</strong></>
          ) : (
            <>. Set EMAIL_FROM to a verified domain address before launch.</>
          )}
          {!process.env.ORDER_NOTIFY_EMAIL && (
            <span className="mt-1 block">
              ⚠️ ORDER_NOTIFY_EMAIL isn&apos;t set — new-order and low-stock alerts have nowhere to go.
            </span>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-sm text-amber-800">
          ⚠️ Email sending is <strong>off</strong> — BREVO_API_KEY isn&apos;t set, so no emails go out
          (orders still work). Get a key from Brevo → Settings → SMTP &amp; API, add it to the
          environment, and set EMAIL_FROM to an address on your verified domain.
        </div>
      )}

      <TestSendForm
        templates={previews.map((p) => ({ key: p.key, subject: p.email.subject }))}
        defaultTo={process.env.ORDER_NOTIFY_EMAIL ?? me.email}
      />

      <div className="space-y-6">
        {previews.map((p) => (
          <div key={p.key} className="overflow-hidden rounded-2xl border border-[#e3e5f0] bg-white">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#e3e5f0] px-6 py-4">
              <div>
                <p className="font-semibold">{p.email.subject}</p>
                <p className="mt-0.5 text-xs text-[#9aa0c3]">{p.when}</p>
              </div>
            </div>
            <iframe
              title={p.email.subject}
              srcDoc={p.email.html}
              className="h-[640px] w-full border-0 bg-[#f4f5f9]"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
