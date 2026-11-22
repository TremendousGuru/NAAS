"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login?error=Enter%20your%20email%20and%20password");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=The%20email%20or%20password%20was%20not%20accepted");
  redirect("/app");
}

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("display_name") ?? "").trim();
  if (!email || password.length < 10 || !displayName) redirect("/login?mode=signup&error=Complete%20all%20fields%20and%20use%20a%20password%20of%20at%20least%2010%20characters");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName }, emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback` } });
  if (error) redirect("/login?mode=signup&error=Account%20registration%20could%20not%20be%20completed");
  redirect("/login?message=Check%20your%20email%20to%20confirm%20your%20account");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect("/login?mode=reset&error=Enter%20your%20email");
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/auth/callback?next=/reset-password` });
  redirect("/login?message=If%20an%20account%20exists%2C%20a%20password%20reset%20email%20has%20been%20sent");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
