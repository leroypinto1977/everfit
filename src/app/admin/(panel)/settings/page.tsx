import { requireAdmin } from "@/lib/admin-auth";
import { listAdminUsers } from "@/lib/team";
import { setRoleAction, toggleActiveAction } from "./actions";
import { AddUserForm, ChangePasswordForm } from "./SettingsForms";

export const dynamic = "force-dynamic";

/** What each integration needs before the store is fully live. */
function integrationChecks() {
  return [
    {
      name: "Razorpay payments",
      ok: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      detail: "RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET — customers can't pay without these.",
    },
    {
      name: "Razorpay webhook",
      ok: Boolean(process.env.RAZORPAY_WEBHOOK_SECRET),
      detail:
        "RAZORPAY_WEBHOOK_SECRET — add the webhook in the Razorpay dashboard (URL /api/webhooks/razorpay, events payment.captured, payment.failed, refund.processed, refund.failed) so payments confirm even if the customer closes the tab.",
    },
    {
      name: "Brevo email",
      ok: Boolean(process.env.BREVO_API_KEY),
      detail: "BREVO_API_KEY — order confirmations, shipping updates and alerts are skipped without it.",
    },
    {
      name: "Sender address",
      ok: Boolean(process.env.EMAIL_FROM),
      detail: "EMAIL_FROM — must be an address on a domain verified in Brevo (SPF/DKIM/DMARC).",
    },
    {
      name: "Order alerts inbox",
      ok: Boolean(process.env.ORDER_NOTIFY_EMAIL),
      detail: "ORDER_NOTIFY_EMAIL — where new-order and low-stock alerts are delivered.",
    },
    {
      name: "Site URL",
      ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      detail: "NEXT_PUBLIC_SITE_URL — used for links inside emails and on invoices.",
    },
  ];
}

export default async function SettingsPage() {
  const me = await requireAdmin();
  const team = me.role === "owner" ? await listAdminUsers() : [];
  const checks = me.role === "owner" ? integrationChecks() : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold italic">Settings</h1>
        <p className="mt-1 text-sm text-[#6b7194]">
          Signed in as {me.name} ({me.email}) · {me.role}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
          <h2 className="font-semibold">Your password</h2>
          <ChangePasswordForm />
        </div>

        {me.role === "owner" && (
          <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
            <h2 className="font-semibold">Add a team member</h2>
            <p className="mt-1 text-sm text-[#6b7194]">
              Staff can manage and fulfil orders. Owners can also edit products, issue refunds, export data
              and manage this team.
            </p>
            <AddUserForm />
          </div>
        )}
      </div>

      {me.role === "owner" && (
        <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
          <h2 className="font-semibold">Store configuration</h2>
          <p className="mt-1 text-sm text-[#6b7194]">
            Environment-driven integrations. Set these in Vercel → Project → Settings → Environment
            Variables (and .env.local for development), then redeploy.
          </p>
          <ul className="mt-4 space-y-3">
            {checks.map((c) => (
              <li key={c.name} className="flex items-start gap-3 text-sm">
                <span
                  className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    c.ok ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {c.ok ? "✓" : "!"}
                </span>
                <span>
                  <span className="font-medium">{c.name}</span>
                  <span className={`ml-2 text-xs font-semibold ${c.ok ? "text-emerald-700" : "text-amber-700"}`}>
                    {c.ok ? "configured" : "not set"}
                  </span>
                  <span className="block text-xs leading-relaxed text-[#6b7194]">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {me.role === "owner" && (
        <div className="overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
          <div className="px-6 py-4">
            <h2 className="font-semibold">Team</h2>
          </div>
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-y border-[#e3e5f0] text-xs uppercase tracking-wider text-[#9aa0c3]">
              <tr>
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Last login</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {team.map((u) => (
                <tr key={u.id} className="border-b border-[#eef0f7] last:border-0">
                  <td className="px-6 py-4">
                    <span className="font-medium">{u.name}</span>
                    {u.id === me.id && <span className="ml-2 text-xs text-[#9aa0c3]">(you)</span>}
                    <span className="block text-xs text-[#9aa0c3]">{u.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <form action={setRoleAction} className="inline">
                      <input type="hidden" name="id" value={u.id} />
                      <input type="hidden" name="role" value={u.role === "owner" ? "staff" : "owner"} />
                      <span className="capitalize">{u.role}</span>
                      {u.id !== me.id && (
                        <button
                          type="submit"
                          className="ml-2 text-xs text-[#2b337d] underline-offset-2 hover:underline"
                        >
                          make {u.role === "owner" ? "staff" : "owner"}
                        </button>
                      )}
                    </form>
                  </td>
                  <td className="px-6 py-4 text-xs text-[#9aa0c3]">
                    {u.lastLoginAt
                      ? u.lastLoginAt.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                      : "never"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        u.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {u.active ? "active" : "deactivated"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {u.id !== me.id && (
                      <form action={toggleActiveAction} className="inline">
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="active" value={String(!u.active)} />
                        <button
                          type="submit"
                          className={`text-xs underline-offset-2 hover:underline ${
                            u.active ? "text-red-600" : "text-emerald-700"
                          }`}
                        >
                          {u.active ? "deactivate" : "reactivate"}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
