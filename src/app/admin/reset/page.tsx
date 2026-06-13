import Link from "next/link";
import { isValidResetToken } from "@/lib/admin-auth";
import AuthShell from "../login/AuthShell";
import ResetForm from "./ResetForm";

export const dynamic = "force-dynamic";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  const valid = token ? await isValidResetToken(token) : false;

  if (!valid) {
    return (
      <AuthShell title="Link expired" subtitle="This reset link is invalid or has already been used.">
        <p className="mt-8 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Reset links are valid for 1 hour and can be used once. Request a fresh one to continue.
        </p>
        <Link
          href="/admin/forgot"
          className="mt-6 block w-full rounded-xl bg-[#2b337d] py-3.5 text-center font-semibold text-white transition-all hover:bg-[#232a68]"
        >
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return <ResetForm token={token} />;
}
