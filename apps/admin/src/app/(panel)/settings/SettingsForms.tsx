"use client";

import { useActionState, useState } from "react";
import { DEFAULT_STAFF_SCREENS, SCREENS } from "@/lib/screens";
import { addUserAction, changePasswordAction, resetUserPasswordAction } from "./actions";

const inputCls =
  "w-full rounded-xl border border-[#dcdfee] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2b337d]";

function Feedback({ state }: { state: { error?: string; ok?: string } | undefined }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <p
      className={`rounded-xl px-4 py-3 text-sm ${
        state.error ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {state.error ?? state.ok}
    </p>
  );
}

/** One checkbox per admin screen, posted as repeated `screens` fields. */
export function ScreenChecklist({ selected }: { selected: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {SCREENS.map((s) => (
        <label key={s.key} className="flex items-center gap-2 text-sm text-[#4a5072]">
          <input
            type="checkbox"
            name="screens"
            value={s.key}
            defaultChecked={selected.includes(s.key)}
            className="h-4 w-4 accent-[#2b337d]"
          />
          {s.label}
        </label>
      ))}
    </div>
  );
}

export function AddUserForm() {
  const [state, action, pending] = useActionState(addUserAction, undefined);
  const [role, setRole] = useState("staff");
  return (
    <form action={action} className="mt-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="name" required placeholder="Name" className={inputCls} />
        <input name="email" type="email" required placeholder="Email" className={inputCls} />
        <input
          name="password"
          type="password"
          required
          placeholder="Initial password (8+ chars)"
          autoComplete="new-password"
          className={inputCls}
        />
        <select name="role" className={inputCls} value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="staff">Staff — only the screens ticked below</option>
          <option value="owner">Owner — every screen, the team and store settings</option>
        </select>
      </div>
      {role === "staff" && (
        <fieldset className="rounded-xl border border-[#e3e5f0] px-4 py-3">
          <legend className="px-1 text-xs font-medium uppercase tracking-[0.15em] text-[#6b7194]">
            Screens they can open
          </legend>
          <ScreenChecklist selected={DEFAULT_STAFF_SCREENS} />
        </fieldset>
      )}
      <Feedback state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#2b337d] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#232a68] disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add team member"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined);
  return (
    <form action={action} className="mt-4 space-y-3">
      <input
        name="current"
        type="password"
        required
        placeholder="Current password"
        autoComplete="current-password"
        className={inputCls}
      />
      <input
        name="next"
        type="password"
        required
        placeholder="New password (8+ chars)"
        autoComplete="new-password"
        className={inputCls}
      />
      <Feedback state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl border border-[#dcdfee] px-6 py-2.5 text-sm font-semibold text-[#4a5072] hover:border-[#2b337d]/40 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}

/** Team row: the owner types a temporary password; the member must replace it at next sign-in. */
export function ResetPasswordForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(resetUserPasswordAction, undefined);
  return (
    <details className="mt-2 text-left">
      <summary className="cursor-pointer list-none text-right text-xs text-[#2b337d] underline-offset-2 hover:underline">
        reset password
      </summary>
      <form action={action} className="mt-2 w-56 space-y-2">
        <input type="hidden" name="id" value={id} />
        <input
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="Temporary password, 8+"
          autoComplete="new-password"
          className={inputCls}
        />
        <Feedback state={state} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-xl bg-[#2b337d] px-4 py-2 text-xs font-semibold text-white hover:bg-[#232a68] disabled:opacity-60"
        >
          {pending ? "Resetting…" : "Reset & sign them out"}
        </button>
      </form>
    </details>
  );
}
