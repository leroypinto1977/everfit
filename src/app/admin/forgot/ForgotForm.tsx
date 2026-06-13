"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "../login/actions";
import AuthShell, { authButton, authInput } from "../login/AuthShell";

export default function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.ok) {
    return (
      <AuthShell title="Check your inbox" subtitle="If that email belongs to an admin account, a reset link is on its way.">
        <p className="mt-8 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          The link is valid for 1 hour. Don&apos;t see it? Check spam, or request another.
        </p>
        <p className="mt-6 text-center text-sm text-[#6b7194]">
          <Link href="/admin/login" className="text-[#2b337d] underline-offset-2 hover:underline">
            ← Back to sign in
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot password" subtitle="We'll email you a link to set a new one.">
      <form action={action} className="mt-8 space-y-4">
        <input
          type="email"
          name="email"
          required
          autoFocus
          placeholder="Your admin email"
          autoComplete="email"
          className={authInput}
        />
        {state?.error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>}
        <button type="submit" disabled={pending} className={authButton}>
          {pending ? "Sending…" : "Send reset link"}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-[#6b7194]">
        <Link href="/admin/login" className="text-[#2b337d] underline-offset-2 hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
