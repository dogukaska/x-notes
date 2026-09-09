"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function resolveEmail(identifier: string): Promise<string | null> {
  if (identifier.includes("@")) return identifier;

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("user_id")
    .eq("username", identifier.toLowerCase())
    .maybeSingle();

  if (!data) return null;

  const { data: userData } = await admin.auth.admin.getUserById(data.user_id);
  return userData.user?.email ?? null;
}

export async function signIn(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const email = await resolveEmail(identifier);
  if (!email) {
    redirect(`/login?error=${encodeURIComponent("Kullanıcı adı veya e-posta hatalı")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("E-posta veya şifre hatalı")}`);
  }

  redirect("/");
}
