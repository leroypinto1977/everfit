import { requireAdmin } from "@/lib/admin-auth";
import { listAdminUsers } from "@/lib/team";
import { setRoleAction, toggleActiveAction } from "./actions";
import { AddUserForm, ChangePasswordForm } from "./SettingsForms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await requireAdmin();
  const team = me.role === "owner" ? await listAdminUsers() : [];

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
        <div className="overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
          <div className="px-6 py-4">
            <h2 className="font-semibold">Team</h2>
          </div>
          <table className="w-full text-left text-sm">
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
