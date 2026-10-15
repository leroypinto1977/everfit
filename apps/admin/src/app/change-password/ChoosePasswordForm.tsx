"use client";

import { useActionState } from "react";
import { choosePassword, logout } from "../login/actions";
import AuthShell, { authButton, authInput } from "../login/AuthShell";

export default function ChoosePasswordForm({ name }: { name: string }) {
  const [state, action, pending] = useActionState(choosePassword, undefined);

  return (
    <AuthShell
      title="Choose your password"
      subtitle={`Hi ${name} — you signed in with a password someone else set. Pick your own to continue.`}
    >
      <form action={action} className="mt-8 space-y-4">
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="New password (8+ characters)"
          autoComplete="new-password"
          className={authInput}
        />
        <input
          type="password"
          name="confirm"
          required
          placeholder="Confirm new password"
          autoComplete="new-password"
          className={authInput}
        />
        {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>}
        <button type="submit" disabled={pending} className={authButton}>
          {pending ? "Saving…" : "Save password & continue"}
        </button>
      </form>
      <form action={logout} className="mt-4 text-center">
        <button type="submit" className="text-sm text-[#6b7194] underline-offset-2 hover:underline">
          Sign out
        </button>
      </form>
    </AuthShell>
  );
}
