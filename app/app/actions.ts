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
  if (!orgId) redirect("/app/membership?membership=invalid");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  // Eligibility is enforced by the database RPC using authoritative profile
  // fields. Never authorize from editable Auth user_metadata in this action.
  const { error } = await supabase.rpc("request_member_onboarding", { p_org_id: orgId });
  if (error) {
    const code = (error as { code?: string }).code;
    if (code === "42883" || /function .*request_member_onboarding.* does not exist/i.test(error.message)) {
      redirect("/app/membership?membership=backend-not-ready");
    }
    redirect("/app/membership?membership=not-submitted");
  }
  revalidatePath("/app");
  redirect("/app/membership?membership=submitted");
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
  if (displayName.length < 2 || !["student","non_student"].includes(category)) redirect("/app/settings?profile=invalid");
  if ((category === "student" && (!institution || !NIGERIAN_STATES.has(stateOfAdmission))) ||
      (category === "non_student" && (!NIGERIAN_STATES.has(residentialState) || !NIGERIAN_STATES.has(preferredRegionState)))) {
    redirect("/app/settings?profile=region-required");
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
    profile_completed: true,
  }, { onConflict: "id" });
  if (error) {
    if (/column .* does not exist|schema cache/i.test(error.message)) redirect("/app/settings?profile=backend-not-ready");
    redirect("/app/settings?profile=not-saved");
  }
  revalidatePath("/app");
  revalidatePath("/app/settings");
  redirect("/app/settings?profile=saved");
}


export async function requestMembershipTransfer(formData: FormData) {
  const sourceMembershipId = String(formData.get("source_membership_id") ?? "").trim();
  const destinationOrgId = String(formData.get("destination_org_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 1000);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(sourceMembershipId) || !uuid.test(destinationOrgId) || reason.length < 10) {
    redirect("/app/membership?transfer=invalid");
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  // RLS validates ownership, active source membership, eligible organization
  // types and active destination. The database also rejects same-org transfers.
  const { data: source, error: sourceError } = await supabase
    .from("org_memberships")
    .select("id,org_id,status,org_units(org_type)")
    .eq("id", sourceMembershipId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (sourceError || !source) redirect("/app/membership?transfer=source-unavailable");
  if (source.org_id === destinationOrgId) redirect("/app/membership?transfer=same-organization");

  const { error } = await supabase.from("membership_transfer_requests").insert({
    user_id: user.id,
    source_membership_id: source.id,
    source_org_id: source.org_id,
    destination_org_id: destinationOrgId,
    reason,
  });
  if (error) redirect("/app/membership?transfer=not-submitted");
  revalidatePath("/app");
  redirect("/app/membership?transfer=submitted");
}

export async function cancelMembershipTransfer(formData: FormData) {
  const transferId = String(formData.get("transfer_id") ?? "").trim();
  const reason = String(formData.get("cancellation_reason") ?? "").trim().slice(0, 1000);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
  if (!uuid.test(transferId) || reason.length < 10) redirect("/app/membership?transfer=cancel-invalid");

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { error } = await supabase.rpc("cancel_membership_transfer", {
    p_transfer_id: transferId,
    p_cancellation_reason: reason,
  });
  if (error) redirect("/app/membership?transfer=cancel-failed");
  revalidatePath("/app");
  redirect("/app/membership?transfer=cancelled");
}

export async function publishCommunityStatus(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim().slice(0, 2000);
  const mediaUrlRaw = String(formData.get("media_url") ?? "").trim();
  const orgId = String(formData.get("author_org_id") ?? "").trim();
  let mediaUrl: string | null = null;
  if (!content) redirect("/app/community?status=empty");
  if (mediaUrlRaw) {
    try {
      const parsed = new URL(mediaUrlRaw);
      if (parsed.protocol !== "https:" || mediaUrlRaw.length > 2048) throw new Error("Invalid media URL");
      mediaUrl = parsed.toString();
    } catch { redirect("/app/community?status=invalid-media"); }
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  if (orgId) {
    const { error } = await supabase.from("community_statuses").insert({ author_user_id: user.id, author_org_id: orgId, content, media_url: mediaUrl });
    if (error) redirect("/app/community?status=not-published");
  } else {
    const { data: membership, error: membershipError } = await supabase.from("org_memberships").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
    if (membershipError || !membership) redirect("/app/community?status=membership-required");
    const { error } = await supabase.from("community_statuses").insert({ author_user_id: user.id, author_org_id: null, content, media_url: mediaUrl });
    if (error) redirect("/app/community?status=not-published");
  }
  revalidatePath("/app"); revalidatePath("/app/community");
  redirect("/app/community?status=published");
}

export async function deleteCommunityStatus(formData: FormData) {
  const statusId = String(formData.get("status_id") ?? "").trim();
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(statusId)) redirect("/app/community?status=invalid-delete");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { error } = await supabase.from("community_statuses").delete().eq("id", statusId);
  if (error) redirect("/app/community?status=delete-failed");
  revalidatePath("/app"); revalidatePath("/app/community");
  redirect("/app/community?status=deleted");
}


export async function publishCommunityPost(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim().slice(0, 5000);
  const titleRaw = String(formData.get("title") ?? "").trim().slice(0, 160);
  const orgId = String(formData.get("author_org_id") ?? "").trim();
  if (content.length < 1) redirect("/app/community?feed=empty");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  if (orgId) {
    if (titleRaw.length < 3) redirect("/app/community?feed=title-required");
    const { data: assignment, error: assignmentError } = await supabase
      .from("org_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("org_id", orgId)
      .eq("status", "active")
      .in("role", ["national_admin", "union_admin", "zone_admin", "campus_admin", "church_admin"])
      .maybeSingle();
    if (assignmentError || !assignment) redirect("/app/community?feed=not-authorized");
    const { error } = await supabase.from("community_posts").insert({
      author_user_id: user.id,
      author_org_id: orgId,
      audience_org_id: orgId,
      post_type: "announcement",
      title: titleRaw,
      content,
      status: "published",
    });
    if (error) redirect("/app/community?feed=not-published");
  } else {
    const { data: membership, error: membershipError } = await supabase
      .from("org_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (membershipError || !membership) redirect("/app/community?feed=membership-required");
    const { error } = await supabase.from("community_posts").insert({
      author_user_id: user.id,
      author_org_id: null,
      audience_org_id: null,
      post_type: "member_post",
      title: null,
      content,
      status: "published",
    });
    if (error) redirect("/app/community?feed=not-published");
  }
  revalidatePath("/app/community");
  redirect("/app/community?feed=published");
}

export async function reportCommunityPost(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim().slice(0, 1000);
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const reasons = ["spam", "harassment", "hate_or_abuse", "misinformation", "inappropriate", "other"];
  if (!uuid.test(postId) || !reasons.includes(reason)) redirect("/app/community?report=invalid");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { error } = await supabase.from("community_post_reports").insert({
    post_id: postId,
    reporter_user_id: user.id,
    reason,
    details: details || null,
  });
  if (error) redirect("/app/community?report=not-submitted");
  revalidatePath("/app/community");
  redirect("/app/community?report=submitted");
}


export async function reviewCommunityPostReport(formData: FormData) {
  const reportId = String(formData.get("report_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const reviewNoteRaw = String(formData.get("review_note") ?? "").trim();
  const reviewNote = reviewNoteRaw || null;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuid.test(reportId) || !["reviewing", "resolved", "dismissed"].includes(status) ||
      (reviewNote !== null && (reviewNote.length < 10 || reviewNote.length > 1000))) {
    redirect("/app/community?moderation=invalid");
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  // RLS is the authority for review scope: only reports on organization
  // posts within the current administrator's assigned scope can be updated.
  const { data, error } = await supabase.from("community_post_reports").update({
    status, reviewer_user_id: user.id, review_note: reviewNote,
    reviewed_at: new Date().toISOString(),
  }).eq("id", reportId).select("id").maybeSingle();

  if (error || !data) redirect("/app/community?moderation=not-authorized");
  revalidatePath("/app/community");
  redirect("/app/community?moderation=updated");
}


export async function reviewGlobalCommunityPostReport(formData: FormData) {
  const reportId=String(formData.get("report_id")??"").trim();
  const status=String(formData.get("status")??"").trim();
  const note=String(formData.get("review_note")??"").trim();
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(reportId) ||
     !["reviewing","resolved","dismissed"].includes(status) || (note.length>0&&(note.length<10||note.length>1000))) {
    redirect("/app/community?global_moderation=invalid");
  }
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user) redirect("/login");
  const {data,error}=await supabase.functions.invoke("community-moderation",{
    body:{action:"review",report_id:reportId,status,review_note:note||null}
  });
  if(error||!data?.ok) redirect("/app/community?global_moderation=failed");
  revalidatePath("/app/community");
  redirect("/app/community?global_moderation=reviewed");
}

export async function hideGlobalCommunityPost(formData: FormData) {
  const reportId=String(formData.get("report_id")??"").trim();
  const postId=String(formData.get("post_id")??"").trim();
  const note=String(formData.get("review_note")??"").trim();
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if(!uuid.test(reportId)||!uuid.test(postId)||note.length<10||note.length>1000) {
    redirect("/app/community?global_moderation=invalid");
  }
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user) redirect("/login");
  const {data,error}=await supabase.functions.invoke("community-moderation",{
    body:{action:"hide_post",report_id:reportId,post_id:postId,review_note:note}
  });
  if(error||!data?.ok) redirect("/app/community?global_moderation=failed");
  revalidatePath("/app/community");
  redirect("/app/community?global_moderation=hidden");
}
