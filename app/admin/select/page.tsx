import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const roleByScope: Record<string, string[]> = {
  national: ["national_admin"],
  union: ["union_admin"],
  zone: ["zone_admin"],
  institution: ["campus_admin", "church_admin"],
};
type Assignment = {
  id: string;
  org_id: string;
  role: string;
  org_units: { id: string; name: string; org_type: string } | { id: string; name: string; org_type: string }[] | null;
};

export default async function SelectAdminOrganization({ searchParams }: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const { scope = "" } = await searchParams;
  const roles = roleByScope[scope];
  if (!roles) redirect("/app?access=restricted");

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login?portal=" + scope);

  const { data, error } = await supabase.from("org_memberships")
    .select("id,org_id,role,org_units(id,name,org_type)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .in("role", roles);

  const assignments = ((data ?? []) as unknown as Assignment[]).filter((item) => {
    const org = Array.isArray(item.org_units) ? item.org_units[0] : item.org_units;
    return scope === "national" ? org?.org_type === "national"
      : scope === "union" ? org?.org_type === "union"
      : scope === "zone" ? org?.org_type === "zone"
      : ["campus", "church"].includes(org?.org_type ?? "");
  });

  if (error || assignments.length === 0) redirect("/app?access=restricted");
  if (assignments.length === 1) {
    const org = assignments[0];
    redirect("/admin?scope=" + scope + "&org=" + org.org_id);
  }

  return <main className="portals-page">
    <header><Link href="/portals">← All portals</Link><span>NAASCONNECT NIGERIA</span></header>
    <section className="portals-heading">
      <span className="public-eyebrow">VERIFIED ADMINISTRATOR ACCESS</span>
      <h1>Select your organisation.</h1>
      <p>You have more than one active assignment at this level. Choose the organisation you intend to administer. Your access remains limited to that assignment.</p>
    </section>
    <div className="portals-grid">
      {assignments.map((item) => {
        const org = Array.isArray(item.org_units) ? item.org_units[0] : item.org_units;
        if (!org) return null;
        return <article key={item.id}>
          <span className="portal-number">{org.org_type.replaceAll("_", " ").toUpperCase()} WORKSPACE</span>
          <h2>{org.name}</h2>
          <p>Open the administration workspace assigned to your account.</p>
          <small>Role: {item.role.replaceAll("_", " ")}</small>
          <Link href={"/admin?scope=" + scope + "&org=" + item.org_id}>Open this workspace →</Link>
        </article>;
      })}
    </div>
    <footer>Only active administrator assignments are shown. If an organisation is missing, its authorised appointing authority must complete the appointment and activation process.</footer>
  </main>;
}
