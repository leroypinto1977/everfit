"use server";

import { redirect } from "next/navigation";
import { createSession, isValidKey } from "@/lib/admin-auth";

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const key = String(formData.get("key") ?? "");
  if (!isValidKey(key)) {
    return { error: "That key didn't match. Check with whoever set up the site." };
  }
  await createSession();
  redirect("/admin");
}
