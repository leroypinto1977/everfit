"use client";

import { useActionState } from "react";
import { addUserAction, changePasswordAction } from "./actions";

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

export function AddUserForm() {
  const [state, action, pending] = useActionState(addUserAction, undefined);
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
        <select name="role" className={inputCls} defaultValue="staff">
          <option value="staff">Staff — fulfil orders</option>
          <option value="owner">Owner — full access</option>
        </select>
      </div>
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
