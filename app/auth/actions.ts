"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const safeText = (value: FormDataEntryValue | null, max = 160) =>
  String(value ?? "").trim().slice(0, max);

export async function signIn(formData: FormData) {
  const email = safeText(formData.get("email"), 254).toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login?error=Enter%20your%20email%20and%20password");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=We%20could%20not%20sign%20you%20in.%20Check%20your%20details%20and%20confirm%20your%20email.");
  const portal = safeText(formData.get("portal"), 24);
  const destinations: Record<string, { roles: string[]; scope: string }> = {
    national: { roles: ["national_admin"], scope: "national" },
    union: { roles: ["union_admin"], scope: "union" },
    zone: { roles: ["zone_admin"], scope: "zone" },
    institution: { roles: ["campus_admin", "church_admin"], scope: "institution" },
  };
  if (portal === "member" || !portal) redirect("/welcome?next=%2Fapp");
  const destination = destinations[portal];
  if (!destination) redirect("/welcome?next=%2Fapp");
  const { data: assignments, error: assignmentError } = await supabase
    .from("org_memberships").select("id").eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
    .eq("status", "active").in("role", destination.roles).limit(1);
  if (assignmentError || !assignments?.length) {
    redirect("/login?portal=" + portal + "&error=This%20account%20does%20not%20have%20an%20active%20assignment%20for%20that%20portal.");
  }
  redirect("/welcome?next=" + encodeURIComponent("/admin?scope=" + destination.scope));
}

export async function signUp(formData: FormData) {
  const email = safeText(formData.get("email"), 254).toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = safeText(formData.get("display_name"), 120);
  const phone = safeText(formData.get("phone"), 32);
  const memberCategory = safeText(formData.get("member_category"), 20);
  const state = safeText(formData.get("state"), 80);
  const institution = safeText(formData.get("institution_name"), 180);
  const course = safeText(formData.get("course_of_study"), 120);
  const level = safeText(formData.get("level_of_study"), 80);
  const residence = safeText(formData.get("residential_state"), 80);
  const preferredRegion = memberCategory === "non_student" ? state : "";

  if (!email || !displayName || password.length < 10 || !phone || !state ||
      !["student", "non_student"].includes(memberCategory)) {
    redirect("/login?mode=signup&error=Complete%20the%20required%20fields%20and%20use%20a%20password%20of%20at%20least%2010%20characters");
  }
  if (memberCategory === "student" && !institution) {
    redirect("/login?mode=signup&error=Enter%20your%20school%20or%20institution");
  }
  if (memberCategory === "non_student" && (!residence || !preferredRegion)) {
    redirect("/login?mode=signup&error=Select%20your%20state%20of%20residence");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) redirect("/login?mode=signup&error=Registration%20is%20temporarily%20unavailable.%20Please%20contact%20support.");
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        full_name: displayName,
        phone,
        member_category: memberCategory,
        state_of_admission: memberCategory === "student" ? state : null,
        institution_name: memberCategory === "student" ? institution : null,
        course_of_study: memberCategory === "student" ? course : null,
        level_of_study: memberCategory === "student" ? level : null,
        residential_state: memberCategory === "non_student" ? residence : null,
        preferred_region_state: memberCategory === "non_student" ? preferredRegion : null,
        onboarding_version: "naasconnect-v1",
      },
      emailRedirectTo: new URL("/auth/callback", siteUrl).toString(),
    },
  });
  if (error) redirect("/login?mode=signup&error=Registration%20could%20not%20be%20completed.%20Please%20review%20your%20details%20or%20contact%20support.");
  redirect("/login?message=Account%20created.%20Check%20your%20email%20and%20confirm%20your%20address%20before%20signing%20in.");
}

export async function requestPasswordReset(formData: FormData) {
  const email = safeText(formData.get("email"), 254).toLowerCase();
  if (!email) redirect("/login?mode=reset&error=Enter%20your%20email");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) redirect("/login?mode=reset&error=Password%20recovery%20is%20temporarily%20unavailable");
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: new URL("/auth/callback?next=/reset-password", siteUrl).toString(),
  });
  if (error) redirect("/login?mode=reset&error=We%20could%20not%20send%20the%20reset%20email.%20Please%20try%20again.");
  redirect("/login?message=If%20an%20account%20exists,%20a%20password%20reset%20email%20has%20been%20sent");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function resendConfirmation(formData: FormData) {
  const email = safeText(formData.get("email"), 254).toLowerCase();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!email || !siteUrl) redirect("/login?error=Enter%20your%20email%20address");
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: new URL("/auth/callback", siteUrl).toString() },
  });
  if (error) redirect("/login?error=We%20could%20not%20resend%20the%20confirmation.%20Check%20the%20address%20or%20try%20again%20later.");
  redirect("/login?message=If%20the%20account%20is%20awaiting%20verification,%20a%20new%20confirmation%20email%20has%20been%20sent.");
}
