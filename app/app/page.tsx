import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HomePage from "../page";
import { signOut } from "../auth/actions";

export default async function AuthenticatedApp() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("display_name, profile_completed").eq("id", user.id).maybeSingle();
  const { data: memberships } = await supabase.from("org_memberships").select("id, org_id, role, status, org_units(name, org_type)").eq("user_id", user.id).eq("status", "active");
  const isAdmin = (memberships ?? []).some((m: any) => ["national_admin","union_admin","zone_admin","campus_admin","church_admin"].includes(m.role));
  return <><div className="session-ribbon"><span>Signed in as <b>{profile?.display_name ?? user.email}</b></span><span>{isAdmin?"Administrator account":"Member account"}</span><form action={signOut}><button type="submit">Sign out</button></form></div><HomePage/></>;
}
