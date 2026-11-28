import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Assignment = {
  id: string;
  org_id: string;
  role: string;
  org_units: { name: string; org_type: string } | { name: string; org_type: string }[] | null;
};
type OrgUnit = {
  id: string;
  parent_id: string | null;
  org_type: string;
  name: string;
  slug: string;
  status: string;
  state_name: string | null;
  conference_name: string | null;
  institution_name: string | null;
  updated_at: string;
};
type AdminSeat = {
  id: string;
  org_id: string;
  approval_org_id: string;
  admin_role: string;
  status: string;
  username: string;
};
type OrgApplication = {
  id: string;
  parent_org_id: string;
  requested_org_type: string;
  organization_name: string;
  state_name: string | null;
  institution_name: string | null;
  status: string;
  created_at: string;
  reviewer_notes: string | null;
};

const scopeRoles: Record<string, string[]> = {
  national: ["national_admin"],
  union: ["union_admin"],
  zone: ["zone_admin"],
  institution: ["campus_admin", "church_admin"],
};
const readable = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const organizationName = (assignment: Assignment) =>
  Array.isArray(assignment.org_units) ? assignment.org_units[0]?.name : assignment.org_units?.name;

function descendants(rows: OrgUnit[], roots: string[]) {
  const visible = new Set<string>();
  const queue = [...roots];
  while (queue.length) {
    const current = queue.shift()!;
    if (visible.has(current)) continue;
    visible.add(current);
    for (const row of rows) {
      if (row.parent_id === current && !visible.has(row.id)) queue.push(row.id);
    }
  }
  return visible;
}

export default async function OrganizationManagement({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; org?: string }>;
}) {
  const params = await searchParams;
  const requestedScope = typeof params.scope === "string" ? params.scope : "";
  const requestedOrg = typeof params.org === "string" ? params.org : "";
  if (requestedScope && !scopeRoles[requestedScope]) redirect("/app?access=restricted");

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("org_memberships")
    .select("id,org_id,role,org_units(name,org_type)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const assignments = ((assignmentRows ?? []) as unknown as Assignment[]).filter((item) =>
    ["national_admin", "union_admin", "zone_admin", "campus_admin", "church_admin"].includes(item.role)
  );
  const scopedAssignments = requestedScope
    ? assignments.filter((item) => scopeRoles[requestedScope].includes(item.role))
    : assignments;
  const authorized = requestedOrg
    ? scopedAssignments.filter((item) => item.org_id === requestedOrg)
    : scopedAssignments;

  if (assignmentError || authorized.length === 0) redirect("/app?access=restricted");

  const [orgResult, seatResult, applicationResult] = await Promise.all([
    supabase.from("org_units")
      .select("id,parent_id,org_type,name,slug,status,state_name,conference_name,institution_name,updated_at")
      .order("org_type")
      .order("name"),
    supabase.from("org_admin_seats")
      .select("id,org_id,approval_org_id,admin_role,status,username")
      .order("admin_role"),
    supabase.from("org_applications")
      .select("id,parent_org_id,requested_org_type,organization_name,state_name,institution_name,status,created_at,reviewer_notes")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const organizations = (orgResult.data ?? []) as OrgUnit[];
  const seats = (seatResult.data ?? []) as AdminSeat[];
  const applications = (applicationResult.data ?? []) as OrgApplication[];
  const visibleIds = descendants(organizations, authorized.map((item) => item.org_id));
  const visibleOrganizations = organizations.filter((item) => visibleIds.has(item.id));
  const visibleSeats = seats.filter((item) => visibleIds.has(item.org_id));
  const visibleApplications = applications.filter((item) => visibleIds.has(item.parent_org_id));
  const organizationById = new Map(visibleOrganizations.map((item) => [item.id, item]));
  const pendingOrganizations = visibleOrganizations.filter((item) => item.status === "pending").length;
  const activeOrganizations = visibleOrganizations.filter((item) => item.status === "active").length;
  const pendingSeats = visibleSeats.filter((item) => item.status === "reserved" || item.status === "awaiting_appointee" || item.status === "pending_approval").length;
  const pendingApplications = visibleApplications.filter((item) => ["pending", "under_review"].includes(item.status)).length;

  return (
    <main className="member-app admin-leadership-page">
      <header className="member-topbar">
        <Link href="/admin" className="member-brand"><span className="member-eyebrow">NAASCONNECT</span><b>Organization management</b></Link>
        <div className="member-top-actions"><span>{user.email}</span><Link href="/app">Member space</Link></div>
      </header>
      <div className="admin-leadership-main">
        <Link
          href={"/admin" + (requestedScope ? "?scope=" + requestedScope : "") + (requestedOrg ? (requestedScope ? "&" : "?") + "org=" + requestedOrg : "")}
          className="admin-return-link"
        >← Return to administration</Link>
        <nav className="admin-portal-switcher" aria-label="Organization administration navigation">
          <Link href={"/admin/organizations" + (requestedScope ? "?scope=" + requestedScope : "") + (requestedOrg ? (requestedScope ? "&" : "?") + "org=" + requestedOrg : "")}>Organizations</Link>
          <Link href={"/admin/onboarding" + (requestedScope ? "?scope=" + requestedScope : "")}>Administrator appointments</Link>{assignments.length>0&&<Link href="/admin/structure">National structure</Link>}
          <Link href={"/admin/leadership" + (requestedScope ? "?scope=" + requestedScope : "") + (requestedOrg ? (requestedScope ? "&" : "?") + "org=" + requestedOrg : "")}>Leadership & executives</Link>
        </nav>

        <div className="admin-page-heading">
          <div>
            <div className="section-kicker">BATCH 3 · ORGANIZATIONAL ADMINISTRATION</div>
            <h1>Organization management</h1>
            <p>Review the organizations, administrator seats and applications within your verified authority. Records are loaded from Supabase and restricted by its row-level security policies.</p>
          </div>
          <span className="admin-scope-chip">Verified scope only</span>
        </div>

        <div className="admin-live-scope">
          <b>Your active administrative assignment</b>
          <span>{authorized.map((item) => readable(item.role) + " · " + (organizationName(item) ?? "Assigned organization")).join(" | ")}</span>
          <small>Changing a URL or selecting another organization does not grant access. Your active database assignment remains authoritative.</small>
        </div>

        <div className="admin-metrics">
          <article><div className="metric-top"><span>Organizations in scope</span></div><strong>{visibleOrganizations.length}</strong><small>Visible through your assigned jurisdiction</small></article>
          <article><div className="metric-top"><span>Active organizations</span></div><strong>{activeOrganizations}</strong><small>Currently active records</small></article>
          <article><div className="metric-top"><span>Pending organizations</span></div><strong>{pendingOrganizations}</strong><small>Awaiting authorized review</small></article>
          <article><div className="metric-top"><span>Pending admin seats</span></div><strong>{pendingSeats}</strong><small>Reserved or awaiting appointment</small></article>
        </div>

        <section className="portal-content-card">
          <div className="portal-card-heading"><span>ORGANIZATION HIERARCHY</span><h2>Organizations under your authority</h2><p>Pending organizations remain pending. This page does not activate, approve or invent organization records.</p></div>
          {orgResult.error ? (
            <p className="portal-inline-alert" role="alert">Organization records could not be loaded. Refresh the page or contact support if the issue continues.</p>
          ) : visibleOrganizations.length === 0 ? (
            <p className="portal-empty-inline">No organization records are visible in this assigned scope.</p>
          ) : (
            <div className="admin-executive-list">
              {visibleOrganizations.map((org) => {
                const parent = org.parent_id ? organizationById.get(org.parent_id) : null;
                const childCount = visibleOrganizations.filter((child) => child.parent_id === org.id).length;
                return (
                  <article key={org.id}>
                    <div>
                      <b>{org.name}</b>
                      <small>{readable(org.org_type)} · {org.status.replaceAll("_", " ")} · {org.slug}</small>
                      <small>{parent ? "Parent: " + parent.name : "Top-level organization"}{org.state_name ? " · " + org.state_name : ""}{org.conference_name ? " · " + org.conference_name : ""}{org.institution_name ? " · " + org.institution_name : ""}</small>
                      <small>{childCount} direct {childCount === 1 ? "child organization" : "child organizations"}</small>
                    </div>
                    <span className="status-tag">{readable(org.status)}</span>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="portal-content-card">
          <div className="portal-card-heading"><span>ADMINISTRATOR ACCESS</span><h2>Reserved seats in your scope</h2><p>Seats are tied to organization records. A reserved seat is not an active administrator account.</p></div>
          {seatResult.error ? (
            <p className="portal-inline-alert" role="alert">Administrator seats could not be loaded for this scope.</p>
          ) : visibleSeats.length === 0 ? (
            <p className="portal-empty-inline">No administrator seats are visible in this scope.</p>
          ) : (
            <div className="admin-executive-list">
              {visibleSeats.map((seat) => {
                const org = organizationById.get(seat.org_id);
                return <article key={seat.id}><div><b>{org?.name ?? "Assigned organization"}</b><small>{readable(seat.admin_role)} · {seat.username}</small><small>Seat status: {readable(seat.status)}</small></div><span className="status-tag">{readable(seat.status)}</span></article>;
              })}
            </div>
          )}
        </section>

        <section className="portal-content-card">
          <div className="portal-card-heading"><span>ORGANIZATION APPLICATIONS</span><h2>Applications awaiting attention</h2><p>Applications are shown only when their parent organization falls within your verified jurisdiction.</p></div>
          {applicationResult.error ? (
            <p className="portal-inline-alert" role="alert">Organization applications could not be loaded for this scope.</p>
          ) : visibleApplications.length === 0 ? (
            <p className="portal-empty-inline">There are no organization applications in this scope.</p>
          ) : (
            <div className="admin-executive-list">
              {visibleApplications.map((application) => (
                <article key={application.id}>
                  <div>
                    <b>{application.organization_name}</b>
                    <small>{readable(application.requested_org_type)} · {readable(application.status)}</small>
                    <small>Parent: {organizationById.get(application.parent_org_id)?.name ?? "Authorized parent organization"}</small>
                    <small>{application.institution_name ?? application.state_name ?? "Additional location details not supplied"} · Submitted {new Date(application.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</small>
                    {application.reviewer_notes && <small>Review note: {application.reviewer_notes}</small>}
                  </div>
                  <span className="status-tag">{readable(application.status)}</span>
                </article>
              ))}
            </div>
          )}
          <p className="admin-boundary-note">Decision controls are intentionally not exposed in this first slice. The live schema currently has no verified atomic application-approval routine that creates the organization and its administrator seat together. We will not risk partially approving an application or creating an organization without its governed access seat.</p>
        </section>

        <footer className="portal-page-footer">
          <span>Batch 3 · Slice 1 — live, scoped organization overview</span>
          <span>Read-only · no production records changed</span>
        </footer>
      </div>
    </main>
  );
}
