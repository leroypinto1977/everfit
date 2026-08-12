import { checkEnv, type EnvCheckEntry } from "@everfit/core/lib/env";
import { requireAdmin } from "@/lib/admin-auth";
import { listAdminUsers } from "@/lib/team";
import { setRoleAction, toggleActiveAction } from "./actions";
import { AddUserForm, ChangePasswordForm } from "./SettingsForms";

export const dynamic = "force-dynamic";

/**
 * The checks below used to be a hand-written list that drifted from the
 * variables the code actually reads — which is how the panel shipped without
 * half its config. They now come from the shared registry in
 * packages/core/src/lib/env.ts, filtered to what THIS deployment reads, so a
 * new variable shows up here the moment it is added there.
 *
 * Only what is set is reported; no value is ever rendered.
 */
function groupChecks(entries: EnvCheckEntry[]) {
  const groups = new Map<string, EnvCheckEntry[]>();
  for (const entry of entries) {
    const list = groups.get(entry.variable.group) ?? [];
    list.push(entry);
    groups.set(entry.variable.group, list);
  }
  return [...groups];
}

const STATUS = {
  required: { badge: "bg-red-100 text-red-700", label: "missing", mark: "!" },
  recommended: { badge: "bg-amber-100 text-amber-700", label: "not set", mark: "!" },
  optional: { badge: "bg-gray-100 text-gray-500", label: "using default", mark: "–" },
} as const;

export default async function SettingsPage() {
  const me = await requireAdmin();
  const team = me.role === "owner" ? await listAdminUsers() : [];
  const env = me.role === "owner" ? checkEnv("admin") : null;
  const groups = env ? groupChecks(env.entries) : [];

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

      {env && (
        <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold">Store configuration</h2>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                env.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {env.ok
                ? "all required variables set"
                : `${env.missingRequired.length} required variable${
                    env.missingRequired.length === 1 ? "" : "s"
                  } missing`}
            </span>
          </div>
          <p className="mt-1 text-sm text-[#6b7194]">
            Every environment variable this admin deployment reads. Set them in{" "}
            <code className="rounded bg-[#f4f5f9] px-1">apps/admin/.env.production</code> on the server (or
            the platform&apos;s dashboard), then rebuild — <code className="rounded bg-[#f4f5f9] px-1">
              NEXT_PUBLIC_*
            </code>{" "}
            values are baked in at build time, so a restart alone is not enough.
          </p>

          {groups.map(([group, entries]) => (
            <div key={group} className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9aa0c3]">{group}</h3>
              <ul className="mt-2 space-y-3">
                {entries.map(({ variable, set }) => {
                  const status = STATUS[variable.level];
                  return (
                    <li key={variable.name} className="flex items-start gap-3 text-sm">
                      <span
                        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          set ? "bg-emerald-100 text-emerald-700" : status.badge
                        }`}
                      >
                        {set ? "✓" : status.mark}
                      </span>
                      <span>
                        <code className="font-medium">{variable.name}</code>
                        <span
                          className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            set ? "bg-emerald-50 text-emerald-700" : status.badge
                          }`}
                        >
                          {set ? "configured" : status.label}
                        </span>
                        <span className="block text-xs leading-relaxed text-[#6b7194]">
                          {variable.summary} {!set && variable.level !== "optional" && variable.impact}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
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
