"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { login, setupOwner } from "./actions";
import { InfinityMark } from "@/components/Logo";

const inputCls =
  "w-full rounded-xl border border-[#dcdfee] bg-white px-4 py-3.5 outline-none transition-all focus:border-[#2b337d] focus:ring-2 focus:ring-[#2b337d]/15";

export default function LoginForm({ needsSetup }: { needsSetup: boolean }) {
  const [state, action, pending] = useActionState(needsSetup ? setupOwner : login, undefined);
  const justReset = useSearchParams().get("reset") === "1";

  return (
    <main className="flex min-h-screen items-stretch bg-[#f3f4fa] text-[#1c2030]">
      {/* brand panel */}
      <div className="relative hidden w-1/2 items-end overflow-hidden bg-[#2b337d] p-12 lg:flex">
        <InfinityMark className="absolute -right-32 top-1/4 w-[640px] text-white/10" draw />
        <div className="relative text-white">
          <div className="flex items-center gap-3">
            <InfinityMark className="h-7" />
            <span className="font-display text-3xl font-bold italic">EVHERFIT</span>
          </div>
          <p className="mt-3 text-sm uppercase tracking-[0.4em] text-white/60">Be the woman</p>
        </div>
      </div>

      {/* form */}
      <div className="flex flex-1 items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.21, 0.65, 0.36, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <InfinityMark className="h-5 text-[#2b337d]" />
            <span className="font-display text-xl font-bold italic text-[#2b337d]">EVHERFIT</span>
          </div>

          <h1 className="font-display text-3xl font-bold italic">
            {needsSetup ? "Set up your store" : "Store admin"}
          </h1>
          <p className="mt-2 text-sm text-[#6b7194]">
            {needsSetup
              ? "Create the owner account. You'll need the setup key (ADMIN_KEY) from your environment config."
              : "Sign in to manage orders, products and customers."}
          </p>

          <form action={action} className="mt-8 space-y-4">
            {needsSetup && (
              <>
                <input type="password" name="key" required autoFocus placeholder="Setup key (ADMIN_KEY)" className={inputCls} />
                <input type="text" name="name" required placeholder="Your name" className={inputCls} />
              </>
            )}
            <input
              type="email"
              name="email"
              required
              autoFocus={!needsSetup}
              placeholder="Email"
              autoComplete="email"
              className={inputCls}
            />
            <input
              type="password"
              name="password"
              required
              placeholder={needsSetup ? "Choose a password (8+ characters)" : "Password"}
              autoComplete={needsSetup ? "new-password" : "current-password"}
              className={inputCls}
            />
            {justReset && !state?.error && (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Password updated — sign in with your new password.
              </p>
            )}
            {state?.error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {state.error}
              </motion.p>
            )}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-[#2b337d] py-3.5 font-semibold text-white transition-all hover:bg-[#232a68] active:scale-[0.99] disabled:opacity-60"
            >
              {pending ? "One moment…" : needsSetup ? "Create owner account" : "Sign in"}
            </button>
          </form>

          {!needsSetup && (
            <p className="mt-5 text-center text-sm text-[#6b7194]">
              <Link href="/admin/forgot" className="text-[#2b337d] underline-offset-2 hover:underline">
                Forgot your password?
              </Link>
            </p>
          )}
        </motion.div>
      </div>
    </main>
  );
}
