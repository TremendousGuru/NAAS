"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestMembership(formData: FormData) {
  const orgId = String(formData.get("org_id") ?? "").trim();
  if (!orgId) redirect("/app?membership=invalid#membership");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const category = user.user_metadata?.member_category;
  const { data: org, error: orgError } = await supabase.from("org_units")
    .select("id,org_type,status").eq("id",orgId).eq("status","active").maybeSingle();
  if (orgError || !org) redirect("/app?membership=unavailable#membership");
  if ((category === "student" && org.org_type !== "campus") ||
      (category === "non_student" && org.org_type !== "church")) {
    redirect("/app?membership=category-mismatch#membership");
  }
  if (!["campus","church"].includes(org.org_type)) redirect("/app?membership=invalid#membership");

  const role = org.org_type === "church" ? "church_member" : "member";
  const { error } = await supabase.from("org_memberships").insert({
    user_id:user.id, org_id:org.id, role, status:"pending"
  });
  if (error) redirect("/app?membership=not-submitted#membership");
  revalidatePath("/app");
  redirect("/app?membership=submitted#membership");
}
