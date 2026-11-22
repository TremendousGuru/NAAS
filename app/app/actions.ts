"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function publishTextStatus(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content || content.length > 2000) redirect("/app?status=invalid#statuses");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: membership, error: membershipError } = await supabase
    .from("org_memberships").select("id").eq("user_id", user.id).eq("status", "active").limit(1).maybeSingle();
  if (membershipError || !membership) redirect("/app?status=membership-required#statuses");

  const { error } = await supabase.from("community_statuses").insert({
    author_user_id: user.id,
    author_org_id: null,
    content,
  });
  if (error) redirect("/app?status=not-published#statuses");
  revalidatePath("/app");
  redirect("/app?status=published#statuses");
}
