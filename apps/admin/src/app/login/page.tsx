import { needsSetup } from "@/lib/admin-auth";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLogin() {
  return <LoginForm needsSetup={await needsSetup()} />;
}
