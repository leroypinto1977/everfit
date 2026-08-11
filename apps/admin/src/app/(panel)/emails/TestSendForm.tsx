"use client";

import { useActionState } from "react";
import { sendTestEmailAction } from "./actions";

/** Pick a template + inbox, send a real email through Brevo to verify setup. */
export default function TestSendForm({
  templates,
  defaultTo,
}: {
  templates: { key: string; subject: string }[];
  defaultTo: string;
}) {
  const [state, action, pending] = useActionState(sendTestEmailAction, undefined);

  return (
    <form action={action} className="rounded-2xl border border-[#e3e5f0] bg-white p-6">
      <h2 className="font-semibold">Send a test email</h2>
      <p className="mt-1 text-sm text-[#6b7194]">
        Delivers the selected template (with sample data) to a real inbox so you can verify the
        Brevo setup and how it renders in an email client.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <label htmlFor="template" className="mb-2 block text-sm text-[#6b7194]">
            Template
          </label>
          <select
            id="template"
            name="template"
            className="w-full rounded-xl border border-[#dcdfee] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2b337d]"
          >
            {templates.map((t) => (
              <option key={t.key} value={t.key}>
                {t.subject}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-64 flex-1">
          <label htmlFor="to" className="mb-2 block text-sm text-[#6b7194]">
            Send to
          </label>
          <input
            id="to"
            name="to"
            type="email"
            required
            defaultValue={defaultTo}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#dcdfee] px-4 py-2.5 text-sm outline-none focus:border-[#2b337d]"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#2b337d] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#232a68] disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send test"}
        </button>
      </div>
      {state?.error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{state.error}</p>
      )}
      {state?.ok && (
        <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.ok}</p>
      )}
    </form>
  );
}
