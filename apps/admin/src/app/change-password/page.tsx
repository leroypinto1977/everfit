import { requirePasswordChange } from "@/lib/admin-auth";
import ChoosePasswordForm from "./ChoosePasswordForm";

export const dynamic = "force-dynamic";

/**
 * Where requireAdmin sends anyone signed in on a password an owner chose (a new
 * team member, or after an owner reset it). Outside the panel layout, which
 * would send them straight back here.
 */
export default async function ChangePasswordPage() {
  const me = await requirePasswordChange();
  return <ChoosePasswordForm name={me.name} />;
}
