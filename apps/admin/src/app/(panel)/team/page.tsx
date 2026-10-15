import { requireOwner } from "@/lib/admin-auth";
import { listAdminUsers } from "@/lib/team";
import { setRoleAction, setScreensAction, toggleActiveAction } from "./actions";
import { AddUserForm, ResetPasswordForm, ScreenChecklist } from "./TeamForms";

export const dynamic = "force-dynamic";

/** Who can sign in to this panel and what they can open. Owners only. */
export default async function TeamPage() {
  const me = await requireOwner();
  const team = await listAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold italic">Team</h1>
        <p className="mt-1 text-sm text-[#6b7194]">Who can sign in to this admin panel, and what they can open.</p>
      </div>

      <div className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
        <h2 className="font-semibold">Add a team member</h2>
        <p className="mt-1 text-sm text-[#6b7194]">
          Staff open only the screens you tick, and can use everything on them. Owners see every screen
          and are the only ones who can issue refunds, change store settings and manage this team. New
          members choose their own password the first time they sign in.
        </p>
        <AddUserForm />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#e3e5f0] bg-white">
        <div className="px-6 py-4">
          <h2 className="font-semibold">Members</h2>
        </div>
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-y border-[#e3e5f0] text-xs uppercase tracking-wider text-[#9aa0c3]">
            <tr>
              <th className="px-6 py-4">Member</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Screens</th>
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
                <td className="px-6 py-4">
                  {u.role === "owner" ? (
                    <span className="text-xs text-[#9aa0c3]">Every screen</span>
                  ) : (
                    <form action={setScreensAction} key={u.screens.join()} className="max-w-md space-y-2">
                      <input type="hidden" name="id" value={u.id} />
                      <ScreenChecklist selected={u.screens} />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-[#2b337d] underline-offset-2 hover:underline"
                      >
                        Save access
                      </button>
                    </form>
                  )}
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
                  {u.mustChangePassword && (
                    <span className="mt-1 block text-xs text-[#9aa0c3]">temporary password</span>
                  )}
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
                  {/* your own password: Settings → Your password, so you can't lock yourself out */}
                  {u.id !== me.id && <ResetPasswordForm id={u.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
