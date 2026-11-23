"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function publishTextStatus(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim().slice(0, 2000);
  if (!content) redirect("/app?status=empty#statuses");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data: membership, error: membershipError } = await supabase
    .from("org_memberships").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (membershipError || !membership) redirect("/app?status=membership-required#statuses");
  const { error } = await supabase.from("community_statuses").insert({
    author_user_id: user.id, author_org_id: null, content,
  });
  if (error) redirect("/app?status=not-published#statuses");
  revalidatePath("/app");
  redirect("/app?status=published#statuses");
}

export async function requestMembership(formData: FormData) {
  const orgId = String(formData.get("org_id") ?? "").trim();
  if (!orgId) redirect("/app?membership=invalid#membership");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const category = user.user_metadata?.member_category;
  const { data: org, error: orgError } = await supabase.from("org_units")
    .select("id,org_type,status").eq("id", orgId).eq("status", "active").maybeSingle();
  if (orgError || !org) redirect("/app?membership=unavailable#membership");
  if ((category === "student" && org.org_type !== "campus") ||
      (category === "non_student" && org.org_type !== "church")) {
    redirect("/app?membership=category-mismatch#membership");
  }
  if (!["campus", "church"].includes(org.org_type)) redirect("/app?membership=invalid#membership");

  const role = org.org_type === "church" ? "church_member" : "member";
  const { error } = await supabase.from("org_memberships").insert({
    user_id: user.id, org_id: org.id, role, status: "pending",
  });
  if (error) redirect("/app?membership=not-submitted#membership");
  revalidatePath("/app");
  redirect("/app?membership=submitted#membership");
}

export async function updateMemberProfile(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 120);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 32);
  const institution = String(formData.get("institution_name") ?? "").trim().slice(0, 180);
  const course = String(formData.get("course_of_study") ?? "").trim().slice(0, 120);
  const level = String(formData.get("level_of_study") ?? "").trim().slice(0, 80);
  const stateOfOrigin = String(formData.get("state_of_origin") ?? "").trim().slice(0, 80);
  const stateOfAdmission = String(formData.get("state_of_admission") ?? "").trim().slice(0, 80);
  const residentialState = String(formData.get("residential_state") ?? "").trim().slice(0, 80);
  if (displayName.length < 2) redirect("/app?profile=invalid#profile");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const metadata = user.user_metadata ?? {};
  const { error: metadataError } = await supabase.auth.updateUser({ data: {
    ...metadata,
    state_of_admission: metadata.member_category === "student" ? (stateOfAdmission || null) : null,
    residential_state: metadata.member_category === "non_student" ? (residentialState || null) : null,
    institution_name: institution || null, course_of_study: course || null, level_of_study: level || null,
  } });
  if (metadataError) redirect("/app?profile=not-saved#profile");
  const { error } = await supabase.from("profiles").upsert({
    id: user.id, display_name: displayName, phone: phone || null,
    institution_name: institution || null, course_of_study: course || null,
    level_of_study: level || null, state_of_origin: stateOfOrigin || null,
  }, { onConflict: "id" });
  if (error) redirect("/app?profile=not-saved#profile");
  revalidatePath("/app");
  redirect("/app?profile=saved#profile");
}
