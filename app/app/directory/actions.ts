"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function requestDirectoryMembership(formData: FormData) {
  const organizationId = String(formData.get("org_id") ?? "").trim();
  if (!UUID.test(organizationId)) redirect("/app/directory?request=invalid");

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  // The existing database RPC checks the authoritative profile category,
  // institution/state or preferred church region, and resubmission rules.
  const { error } = await supabase.rpc("request_member_onboarding", { p_org_id: organizationId });
  if (error) redirect(`/app/directory/${organizationId}?request=not-submitted`);

  revalidatePath("/app");
  revalidatePath("/app/directory");
  redirect(`/app/directory/${organizationId}?request=submitted`);
}
