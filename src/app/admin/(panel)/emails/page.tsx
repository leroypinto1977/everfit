import { requireOwner } from "@/lib/admin-auth";
import { emailPreviews } from "@/lib/email/samples";

export const dynamic = "force-dynamic";

export default async function EmailsPage() {
  await requireOwner();
  const previews = emailPreviews();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold italic">Email previews</h1>
        <p className="mt-1 text-sm text-[#6b7194]">
          Every transactional email the store sends, with sample data. Live sending requires
          RESEND_API_KEY and a verified sending domain.
        </p>
      </div>

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
