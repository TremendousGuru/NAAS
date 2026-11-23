"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NIGERIAN_STATES = new Set(["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"]);

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

  // Eligibility is enforced by the database RPC using authoritative profile
  // fields. Never authorize from editable Auth user_metadata in this action.
  const { error } = await supabase.rpc("request_member_onboarding", { p_org_id: orgId });
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "42883" || /function .*request_member_onboarding.* does not exist/i.test(error.message)) {
      redirect("/app?membership=backend-not-ready#membership");
    }
    redirect("/app?membership=not-submitted#membership");
  }
  revalidatePath("/app");
  redirect("/app?membership=submitted#membership");
}

export async function updateMemberProfile(formData: FormData) {
  const displayName = String(formData.get("display_name") ?? "").trim().slice(0, 120);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 32);
  const category = String(formData.get("member_category") ?? "").trim();
  const institution = String(formData.get("institution_name") ?? "").trim().slice(0, 180);
  const course = String(formData.get("course_of_study") ?? "").trim().slice(0, 120);
  const level = String(formData.get("level_of_study") ?? "").trim().slice(0, 80);
  const stateOfOrigin = String(formData.get("state_of_origin") ?? "").trim();
  const stateOfAdmission = String(formData.get("state_of_admission") ?? "").trim();
  const residentialState = String(formData.get("residential_state") ?? "").trim();
  const preferredRegionState = String(formData.get("preferred_region_state") ?? "").trim();
  if (displayName.length < 2 || !["student","non_student"].includes(category)) redirect("/app?profile=invalid#profile");
  if ((category === "student" && (!institution || !NIGERIAN_STATES.has(stateOfAdmission))) ||
      (category === "non_student" && (!NIGERIAN_STATES.has(residentialState) || !NIGERIAN_STATES.has(preferredRegionState)))) {
    redirect("/app?profile=region-required#profile");
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    display_name: displayName,
    phone: phone || null,
    member_category: category,
    institution_name: category === "student" ? institution : null,
    course_of_study: category === "student" ? course || null : null,
    level_of_study: category === "student" ? level || null : null,
    state_of_origin: stateOfOrigin || null,
    state_of_admission: category === "student" ? stateOfAdmission : null,
    residential_state: category === "non_student" ? residentialState : null,
    preferred_region_state: category === "non_student" ? preferredRegionState : null,
  }, { onConflict: "id" });
  if (error) {
    if (/column .* does not exist|schema cache/i.test(error.message)) redirect("/app?profile=backend-not-ready#profile");
    redirect("/app?profile=not-saved#profile");
  }
  revalidatePath("/app");
  redirect("/app?profile=saved#profile");
}
