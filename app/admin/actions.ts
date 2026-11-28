"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function leadershipRedirect(formData: FormData, result: string): never {
  const scope = String(formData.get("scope") ?? "").trim();
  const safeScope = ["national", "union", "zone", "institution"].includes(scope) ? scope : "";
  redirect("/admin/leadership?result=" + result + (safeScope ? "&scope=" + safeScope : ""));
}

export async function reviewMembership(formData: FormData) {
  const membershipId = String(formData.get("membership_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const reviewerNotes = String(formData.get("reviewer_notes") ?? "").trim().slice(0, 1000);

  if (!UUID.test(membershipId) || !["approve", "reject"].includes(decision)) {
    redirect("/admin?review=invalid");
  }
  if (decision === "reject" && reviewerNotes.length < 10) {
    redirect("/admin?review=invalid");
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  // The transactional database RPC is the authority for organization scope,
  // self-review prevention, pending-state checks, eligibility and audit events.
  const { error } = await supabase.rpc("review_member_onboarding", {
    p_membership_id: membershipId,
    p_decision: decision,
    p_reviewer_notes: reviewerNotes || null,
  });

  if (error) redirect("/admin?review=failed");
  revalidatePath("/admin");
  revalidatePath("/app");
  redirect(`/admin?review=${decision === "approve" ? "approved" : "rejected"}`);
}

export async function reviewMembershipTransfer(formData: FormData) {
  const transferId = String(formData.get("transfer_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const reviewerNotes = String(formData.get("reviewer_notes") ?? "").trim().slice(0, 1000);

  if (!UUID.test(transferId) || !["approve", "reject"].includes(decision)) {
    redirect("/admin?transfer=invalid#transfers");
  }
  if (decision === "reject" && reviewerNotes.length < 10) {
    redirect("/admin?transfer=invalid#transfers");
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  // The RPC independently verifies the actor's authority over the source or
  // destination organization for the request's current review stage.
  const { error } = await supabase.rpc("review_membership_transfer", {
    p_transfer_id: transferId,
    p_decision: decision,
    p_reviewer_notes: reviewerNotes || null,
  });

  if (error) redirect("/admin?transfer=failed#transfers");
  revalidatePath("/admin");
  revalidatePath("/app");
  redirect(`/admin?transfer=${decision === "approve" ? "approved" : "rejected"}#transfers`);
}


export async function saveExecutivePortfolio(formData: FormData) {
  const orgId = String(formData.get("org_id") ?? "").trim();
  const key = String(formData.get("portfolio_key") ?? "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 50);
  const title = String(formData.get("title") ?? "").trim().slice(0, 100);
  const description = String(formData.get("description") ?? "").trim().slice(0, 1000);
  const responsibilities = String(formData.get("responsibilities") ?? "").split("\n").map(value => value.trim()).filter(Boolean).slice(0, 20);
  const displayOrder = Number.parseInt(String(formData.get("display_order") ?? "100"), 10);
  const termRaw = String(formData.get("term_duration_months") ?? "").trim();
  const termDuration = termRaw ? Number.parseInt(termRaw, 10) : null;
  const isRequired = formData.get("is_required") === "on";
  if (!UUID.test(orgId) || !/^[a-z][a-z0-9_]{1,49}$/.test(key) || title.length < 2 ||
      !Number.isInteger(displayOrder) || displayOrder < 0 || displayOrder > 10000 ||
      (termDuration !== null && (!Number.isInteger(termDuration) || termDuration < 1 || termDuration > 60))) {
    leadershipRedirect(formData, "portfolio-invalid");
  }
  if (responsibilities.some(item => item.length < 3 || item.length > 300)) {
    leadershipRedirect(formData, "portfolio-invalid");
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { error } = await supabase.rpc("save_executive_portfolio", {
    p_org_id: orgId, p_portfolio_key: key, p_title: title,
    p_description: description || null, p_responsibilities: responsibilities,
    p_display_order: displayOrder, p_is_required: isRequired, p_term_duration_months: termDuration,
  });
  if (error) leadershipRedirect(formData, "portfolio-failed");
  revalidatePath("/admin/leadership");
  leadershipRedirect(formData, "portfolio-saved");
}

export async function submitLeadershipAppointment(formData: FormData) {
  const orgId = String(formData.get("org_id") ?? "").trim();
  const positionKey = String(formData.get("position_key") ?? "").trim();
  const positionTitle = String(formData.get("position_title") ?? "").trim().slice(0, 100);
  const incomingUserId = String(formData.get("incoming_user_id") ?? "").trim();
  const notes = String(formData.get("request_notes") ?? "").trim().slice(0, 1000);
  if (!UUID.test(orgId) || !/^[a-z][a-z0-9_]{1,49}$/.test(positionKey) ||
      !UUID.test(incomingUserId) || positionTitle.length < 2) {
    leadershipRedirect(formData, "appointment-invalid");
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { error } = await supabase.rpc("submit_leadership_handover", {
    p_org_id: orgId, p_position_key: positionKey, p_position_title: positionTitle,
    p_incoming_user_id: incomingUserId, p_request_notes: notes || null,
  });
  if (error) leadershipRedirect(formData, "appointment-failed");
  revalidatePath("/admin/leadership");
  leadershipRedirect(formData, "appointment-submitted");
}

export async function reviewLeadershipAppointment(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const notes = String(formData.get("reviewer_notes") ?? "").trim().slice(0, 1000);
  if (!UUID.test(requestId) || !["approved", "rejected"].includes(decision) ||
      (decision === "rejected" && notes.length < 10)) {
    leadershipRedirect(formData, "review-invalid");
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { error } = await supabase.rpc("review_leadership_handover", {
    p_request_id: requestId, p_decision: decision, p_reviewer_notes: notes || null,
  });
  if (error) leadershipRedirect(formData, "review-failed");
  revalidatePath("/admin/leadership");
  redirect("/admin/leadership?result=review-" + decision);
}

export async function setExecutiveTerm(formData: FormData) {
  const positionId = String(formData.get("position_id") ?? "").trim();
  const termEnd = String(formData.get("term_ends_at") ?? "").trim();
  const notes = String(formData.get("appointment_notes") ?? "").trim().slice(0, 1000);
  const parsed = new Date(termEnd);
  if (!UUID.test(positionId) || !termEnd || Number.isNaN(parsed.getTime())) leadershipRedirect(formData, "term-invalid");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { error } = await supabase.rpc("set_executive_term", {
    p_position_id: positionId, p_term_ends_at: parsed.toISOString(), p_appointment_notes: notes || null,
  });
  if (error) leadershipRedirect(formData, "term-failed");
  revalidatePath("/admin/leadership");
  leadershipRedirect(formData, "term-saved");
}


export async function submitAdminAppointment(formData: FormData) {
  const seatId = String(formData.get("seat_id") ?? "").trim();
  const nomineeName = String(formData.get("nominee_name") ?? "").trim().slice(0, 120);
  const nomineeEmail = String(formData.get("nominee_email") ?? "").trim().toLowerCase().slice(0, 254);
  if (!UUID.test(seatId) || nomineeName.length < 2 || !/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(nomineeEmail)) {
    redirect("/admin/onboarding?result=invalid");
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { error } = await supabase.rpc("submit_admin_appointment", {
    p_seat_id: seatId, p_nominee_name: nomineeName, p_nominee_email: nomineeEmail,
  });
  if (error) redirect("/admin/onboarding?result=submit-failed");
  revalidatePath("/admin/onboarding");
  redirect("/admin/onboarding?result=submitted");
}

export async function reviewAdminAppointment(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "").trim();
  const decision = String(formData.get("decision") ?? "").trim();
  const notes = String(formData.get("reviewer_notes") ?? "").trim().slice(0, 1000);
  if (!UUID.test(requestId) || !["approved", "rejected"].includes(decision) ||
      (decision === "rejected" && notes.length < 10)) redirect("/admin/onboarding?result=review-invalid");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { error } = await supabase.rpc("review_admin_appointment", {
    p_request_id: requestId, p_decision: decision, p_notes: notes || null,
  });
  if (error) redirect("/admin/onboarding?result=review-failed");
  revalidatePath("/admin/onboarding");
  redirect("/admin/onboarding?result=" + (decision === "approved" ? "approved" : "rejected"));
}

export async function inviteAdminAppointee(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!UUID.test(requestId)) redirect("/admin/onboarding?result=invite-invalid");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data, error } = await supabase.functions.invoke("admin-appointment", {
    body: { action: "invite", request_id: requestId },
  });
  if (error || !data?.ok) redirect("/admin/onboarding?result=invite-failed");
  revalidatePath("/admin/onboarding");
  redirect("/admin/onboarding?result=invited");
}


export async function acceptAdminInvitation(formData: FormData) {
  const requestId = String(formData.get("request_id") ?? "").trim();
  if (!UUID.test(requestId)) redirect("/login?error=Invalid%20administrator%20invitation");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { data, error } = await supabase.functions.invoke("admin-appointment", {
    body: { action: "accept", request_id: requestId },
  });
  if (error || !data?.ok) redirect("/admin/invitation?request_id=" + requestId + "&result=failed");
  revalidatePath("/admin");
  redirect("/welcome?next=%2Fadmin");
}
