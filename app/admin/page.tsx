import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AdminWorkspace from "./AdminWorkspace";
import { signOut } from "../auth/actions";

export const dynamic = "force-dynamic";

export default async function AdministratorPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: assignments, error: assignmentError } = await supabase
    .from("org_memberships")
    .select("id,org_id,role,status,org_units(name,org_type)")
    .eq("user_id", user.id)
    .eq("status", "active");
  const authorized = (assignments ?? []).filter((a: any) =>
    ["national_admin","union_admin","zone_admin","campus_admin","church_admin"].includes(a.role)
  );
  if (assignmentError || authorized.length === 0) redirect("/app?access=restricted");

  return <main className="member-app">
    <header className="member-topbar">
      <Link href="/app" className="member-brand"><span className="member-eyebrow">NAASCONNECT</span><b>Administration</b></Link>
      <div className="member-top-actions"><span>{user.email}</span><form action={signOut}><button type="submit">Sign out</button></form></div>
    </header>
    <div className="member-main admin-route-main">
      <Link href="/app" className="admin-return-link">← Return to member space</Link>
      <div className="admin-live-scope"><b>Verified active assignments</b><span>{authorized.map((a: any) => a.role.replaceAll("_"," ") + " · " + (Array.isArray(a.org_units)?a.org_units[0]?.name:a.org_units?.name ?? "assigned organization")).join(" | ")}</span><small>The role and organization assignments above were loaded from the signed-in user's own active membership records. Database policies remain authoritative.</small></div>
      <AdminWorkspace active="Administration"/>
    </div>
  </main>;
}
