import Link from "next/link";
import { LEAD_STATUSES, isLeadStatus, leadStats, listLeads, type LeadStatus } from "@everfit/core/lib/leads";
import KpiCard from "@/components/KpiCard";
import { saveFollowUpAction } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const badge: Record<LeadStatus, string> = {
  new: "bg-amber-50 text-amber-700 border-amber-200",
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  no_response: "bg-gray-100 text-gray-500 border-gray-200",
  call_booked: "bg-purple-50 text-purple-700 border-purple-200",
  call_done: "bg-[#2b337d]/5 text-[#2b337d] border-[#2b337d]/20",
  joined: "bg-emerald-50 text-emerald-700 border-emerald-200",
  not_joining: "bg-red-50 text-red-600 border-red-200",
};

const IST = { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" } as const;

function pageUrl(status: string, q: string, page: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/one-to-one?${qs}` : "/one-to-one";
}

export default async function OneToOnePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status: statusParam = "", q = "", page: pageParam = "1" } = await searchParams;
  const status = isLeadStatus(statusParam) ? statusParam : "";
  const page = Math.max(1, parseInt(pageParam, 10) || 1);

  const [{ leads, total }, stats] = await Promise.all([
    listLeads({ status, q, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    leadStats(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const count = (s: LeadStatus) => stats.byStatus[s] ?? 0;
  const inProgress = count("contacted") + count("no_response") + count("call_booked") + count("call_done");
  const filters = [
    { label: "All", value: "", n: stats.total },
    ...LEAD_STATUSES.map((s) => ({ label: s.label, value: s.value as string, n: count(s.value) })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold italic">1-to-1</h1>
        <p className="mt-1 text-sm text-[#6b7194]">
          Applications from 1-to-1.evherfit.com — the reference on each lead matches the one in their
          WhatsApp message
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          index={0}
          label="Total leads"
          value={String(stats.total)}
          hint={`${stats.last7Days} in the last 7 days`}
        />
        <KpiCard
          index={1}
          label="To contact"
          value={String(count("new"))}
          hint="new, nobody has reached out yet"
        />
        <KpiCard
          index={2}
          label="In progress"
          value={String(inProgress)}
          hint={`${count("call_done")} call${count("call_done") === 1 ? "" : "s"} done, awaiting a decision`}
        />
        <KpiCard
          index={3}
          label="Joined"
          value={String(count("joined"))}
          hint={
            stats.total ? `${Math.round((count("joined") / stats.total) * 100)}% of all leads` : "no leads yet"
          }
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Link
              key={f.value}
              href={pageUrl(f.value, q, 1)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                status === f.value
                  ? "border-[#2b337d] bg-[#2b337d] text-white"
                  : "border-[#dcdfee] bg-white text-[#4a5072] hover:border-[#2b337d]/40"
              }`}
            >
              {f.label} <span className="opacity-60">{f.n}</span>
            </Link>
          ))}
        </div>
        <form>
          {status && <input type="hidden" name="status" value={status} />}
          <label htmlFor="lead-search" className="sr-only">
            Search leads
          </label>
          <input
            id="lead-search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, email, reference…"
            className="w-full rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm outline-none focus:border-[#2b337d] sm:w-80"
          />
        </form>
      </div>

      <div className="space-y-3">
        {leads.length === 0 && (
          <p className="rounded-2xl border border-[#e3e5f0] bg-white px-6 py-14 text-center text-sm text-[#9aa0c3]">
            {status || q ? "No leads match." : "No leads yet."}
          </p>
        )}
        {leads.map((lead) => {
          const leadStatus = isLeadStatus(lead.status) ? lead.status : "new";
          return (
            <details key={lead.id} className="rounded-2xl border border-[#e3e5f0] bg-white">
              <summary className="cursor-pointer px-6 py-4 text-sm">
                <span className="flex flex-wrap items-center gap-x-5 gap-y-2">
                  <span className="min-w-0 flex-1">
                    <span className="font-medium text-[#2b337d]">{lead.name}</span>
                    <span className="block truncate text-xs text-[#9aa0c3]">
                      {lead.phone} · {lead.email}
                    </span>
                  </span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badge[leadStatus]}`}>
                    {LEAD_STATUSES.find((s) => s.value === leadStatus)?.label}
                  </span>
                  <span className="rounded-full bg-[#eef0f8] px-2 py-0.5 font-mono text-xs text-[#4a5072]">
                    #{lead.ref}
                  </span>
                  <span className="text-xs text-[#9aa0c3]">{lead.createdAt.toLocaleString("en-IN", IST)}</span>
                </span>
                {lead.summary && (
                  <span className="mt-2 line-clamp-2 text-[#4a5072]">
                    <span className="font-semibold">Conclusion:</span> {lead.summary}
                  </span>
                )}
              </summary>

              <div className="grid gap-8 border-t border-[#eef0f7] px-6 py-5 lg:grid-cols-[1fr_20rem]">
                <dl className="grid content-start gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                  {lead.answers.map((a) => (
                    <div key={a.label}>
                      <dt className="text-xs text-[#9aa0c3]">{a.label}</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap break-words">{a.value}</dd>
                    </div>
                  ))}
                </dl>

                <form action={saveFollowUpAction} className="space-y-3">
                  <input type="hidden" name="id" value={lead.id} />
                  <label className="block text-xs font-medium uppercase tracking-[0.15em] text-[#6b7194]">
                    Status
                    <select
                      name="status"
                      defaultValue={leadStatus}
                      className="mt-1.5 w-full rounded-xl border border-[#dcdfee] bg-white px-4 py-2 text-sm font-normal normal-case tracking-normal text-[#22242c] outline-none focus:border-[#2b337d]"
                    >
                      {LEAD_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs font-medium uppercase tracking-[0.15em] text-[#6b7194]">
                    Call conclusion
                    <textarea
                      name="summary"
                      rows={5}
                      defaultValue={lead.summary ?? ""}
                      placeholder="How the call went, what was agreed, the next step…"
                      className="mt-1.5 w-full rounded-xl border border-[#dcdfee] px-4 py-3 text-sm font-normal normal-case tracking-normal text-[#22242c] outline-none focus:border-[#2b337d]"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="submit"
                      className="rounded-xl bg-[#2b337d] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#232a68]"
                    >
                      Save
                    </button>
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl border border-[#dcdfee] px-4 py-2 text-sm font-medium text-[#2b337d] hover:border-[#2b337d]/40"
                    >
                      Message on WhatsApp
                    </a>
                  </div>
                  {lead.updatedAt && (
                    <p className="text-xs text-[#9aa0c3]">
                      Last updated by {lead.updatedBy} · {lead.updatedAt.toLocaleString("en-IN", IST)}
                    </p>
                  )}
                </form>
              </div>
            </details>
          );
        })}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-[#6b7194]">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={pageUrl(status, q, page - 1)}
                className="rounded-xl border border-[#dcdfee] bg-white px-4 py-2 hover:border-[#2b337d]/40"
              >
                ← Previous
              </Link>
            )}
            {page < pages && (
              <Link
                href={pageUrl(status, q, page + 1)}
                className="rounded-xl border border-[#dcdfee] bg-white px-4 py-2 hover:border-[#2b337d]/40"
              >
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
