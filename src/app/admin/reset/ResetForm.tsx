"use client";

import { useActionState } from "react";
import { resetPassword } from "../login/actions";
import AuthShell, { authButton, authInput } from "../login/AuthShell";

export default function ResetForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPassword, undefined);

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you don't use elsewhere.">
      <form action={action} className="mt-8 space-y-4">
        <input type="hidden" name="token" value={token} />
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
          {pending ? "Saving…" : "Set password & sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
