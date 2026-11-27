"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
