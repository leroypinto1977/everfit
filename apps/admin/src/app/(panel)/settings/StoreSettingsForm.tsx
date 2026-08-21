"use client";

import { useActionState, useState } from "react";
import type { ResolvedSetting } from "@everfit/core/lib/settings";
import { saveSettingsAction } from "./actions";

const inputCls =
  "w-full rounded-xl border border-[#dcdfee] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#2b337d]";

/**
 * Where a value is currently coming from. Worth showing: "environment" means
 * the value is still in the .env file on the server and editing it here moves
 * it into the database, after which the env var stops having any effect.
 */
function SourceBadge({ source }: { source: ResolvedSetting["source"] }) {
  const style =
    source === "database"
      ? "bg-emerald-50 text-emerald-700"
      : source === "environment"
        ? "bg-indigo-50 text-[#2b337d]"
        : "bg-gray-100 text-gray-500";
  const label = source === "database" ? "saved here" : source === "environment" ? "from .env" : "not set";
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${style}`}>{label}</span>;
}

export function StoreSettingsForm({ settings }: { settings: ResolvedSetting[] }) {
  const [state, action, pending] = useActionState(saveSettingsAction, undefined);

  /*
   * Controlled inputs, because React resets an uncontrolled form after a form
   * action completes. With `defaultValue` a single bad field threw away every
   * other edit in the form: type a state, an address and a malformed GST rate,
   * and the rate error would take the state and address down with it.
   *
   * State is re-seeded from the server whenever the saved values actually
   * change — which happens after a successful save (and shows normalisation,
   * e.g. a GSTIN upper-cased) but not after a rejected one, so the typing
   * survives exactly when it should.
   */
  const serverValues = settings.map((s) => s.value);
  const signature = serverValues.join("\u0000");
  const [seed, setSeed] = useState(signature);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(settings.map((s) => [s.def.key, s.value]))
  );
  if (seed !== signature) {
    setSeed(signature);
    setValues(Object.fromEntries(settings.map((s) => [s.def.key, s.value])));
  }

  const groups = settings.reduce<Record<string, ResolvedSetting[]>>((acc, s) => {
    (acc[s.def.group] ??= []).push(s);
    return acc;
  }, {});

  return (
    <form action={action} className="mt-5 space-y-6">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#9aa0c3]">{group}</h3>
          <div className="mt-3 space-y-4">
            {items.map(({ def, source, updatedAt, updatedBy }) => (
              <div key={def.key}>
                <label htmlFor={def.key} className="flex flex-wrap items-center gap-2 text-sm font-medium">
                  {def.label}
                  <SourceBadge source={source} />
                </label>

                {def.multiline ? (
                  <textarea
                    id={def.key}
                    name={def.key}
                    rows={2}
                    value={values[def.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [def.key]: e.target.value }))}
                    placeholder={def.placeholder}
                    className={`mt-1.5 ${inputCls}`}
                  />
                ) : (
                  <input
                    id={def.key}
                    name={def.key}
                    value={values[def.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [def.key]: e.target.value }))}
                    placeholder={def.placeholder}
                    inputMode={def.kind === "number" ? "numeric" : undefined}
                    className={`mt-1.5 ${inputCls}`}
                  />
                )}

                <p className="mt-1.5 text-xs leading-relaxed text-[#6b7194]">{def.help}</p>
                {source === "database" && updatedAt && (
                  <p className="mt-0.5 text-[11px] text-[#9aa0c3]">
                    Changed {new Date(updatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    {updatedBy ? ` by ${updatedBy}` : ""} · clear the field to go back to{" "}
                    <code className="font-mono">{def.envVar}</code>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {(state?.error || state?.ok) && (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            state.error ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {state.error ?? state.ok}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-[#2b337d] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#232a68] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save store settings"}
      </button>
    </form>
  );
}
