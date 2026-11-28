import { redirect } from "next/navigation";
import { reviewMembership, reviewMembershipTransfer } from "./actions";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../auth/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Assignment = {
  id: string; org_id: string; role: string;
  org_units: { name: string; org_type: string } | { name: string; org_type: string }[] | null;
};
type ReviewItem = {
  membership_id: string; organization_id: string; organization_name: string;
  organization_type: string; display_name: string; institution_name: string | null;
  course_of_study: string | null; level_of_study: string | null;
  requested_role: string; requested_at: string;
};
function orgName(a: Assignment) {
  return Array.isArray(a.org_units) ? a.org_units[0]?.name : a.org_units?.name;
}
function label(value: string) {
  return value.replaceAll("_", " ").replace(/\\b\\w/g, c => c.toUpperCase());
}

export default async function AdministratorPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const reviewState = typeof params.review === "string" ? params.review : "";
  const transferState = typeof params.transfer === "string" ? params.transfer : "";
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");

  const { data: assignments, error: assignmentError } = await supabase
    .from("org_memberships")
    .select("id,org_id,role,status,org_units(name,org_type)")
    .eq("user_id", user.id).eq("status", "active");

  const allAuthorized = ((assignments ?? []) as unknown as Assignment[]).filter(a =>
    ["national_admin", "union_admin", "zone_admin", "campus_admin", "church_admin"].includes(a.role)
  );
  const requestedScope = typeof params.scope === "string" ? params.scope : "";
  const scopeRoles: Record<string, string[]> = {
    national: ["national_admin"],
    union: ["union_admin"],
    zone: ["zone_admin"],
    institution: ["campus_admin", "church_admin"],
  };
  if (requestedScope && !scopeRoles[requestedScope]) redirect("/app?access=restricted");
  const requestedOrg = typeof params.org === "string" ? params.org : "";
  const scopeAuthorized = requestedScope
    ? allAuthorized.filter(a => scopeRoles[requestedScope].includes(a.role))
    : allAuthorized;
  const authorized = requestedOrg
    ? scopeAuthorized.filter(a => a.org_id === requestedOrg)
    : scopeAuthorized;
  if (assignmentError || authorized.length === 0) redirect("/app?access=restricted");

  // Read-only queue calls. The database function independently verifies each
  // requested organization scope; this page never widens an administrator's scope.
  const queueResults = await Promise.all(authorized.map(async assignment => {
    const { data, error: queueError } = await supabase.rpc("get_membership_review_queue", {
      p_org_id: assignment.org_id, p_search: null, p_from: null, p_to: null, p_limit: 50, p_offset: 0,
    });
    const payload = data as { items?: ReviewItem[]; total_count?: number } | null;
    return { assignment, items: queueError ? [] : (payload?.items ?? []), total: payload?.total_count ?? 0, error: queueError };
  }));
  const queueErrors = queueResults.filter(r => r.error).length;
  const totalPending = queueResults.reduce((sum, r) => sum + r.total, 0);
  // RLS exposes only requests involving an organization this administrator
  // is authorized to manage. The review RPC performs the authoritative stage check.
  const { data: transferRows, error: transferQueueError } = await supabase
    .from("membership_transfer_requests")
    .select("id,user_id,source_org_id,destination_org_id,reason,status,created_at,reviewer_notes")
    .in("status", ["pending_source", "pending_destination"])
    .order("created_at", { ascending: true })
    .limit(100);
  const authorizedOrgIds = new Set(authorized.map(assignment => assignment.org_id));
  const transferRequests = (transferRows ?? []).filter(item =>
    authorizedOrgIds.has(item.source_org_id) || authorizedOrgIds.has(item.destination_org_id)
  );
  const transferOrgIds = [...new Set(transferRequests.flatMap(item => [item.source_org_id, item.destination_org_id]))];
  const { data: transferOrganizations } = transferOrgIds.length
    ? await supabase.from("org_units").select("id,name,org_type,state_name").in("id", transferOrgIds)
    : { data: [] as { id: string; name: string; org_type: string; state_name: string | null }[] };
  const transferOrgMap = new Map((transferOrganizations ?? []).map(org => [org.id, org]));


  return <main className="member-app">
    <header className="member-topbar">
      <Link href="/app" className="member-brand"><span className="member-eyebrow">NAASCONNECT</span><b>Administration</b></Link>
      <div className="member-top-actions"><span>{user.email}</span><form action={signOut}><button type="submit">Sign out</button></form></div>
    </header>
    <div className="member-main admin-route-main">
      <Link href="/app" className="admin-return-link">← Return to member space</Link>
      <nav className="admin-portal-switcher" aria-label="Your assigned administration portals">{allAuthorized.some(a=>a.role==="national_admin")&&<Link href={"/admin?scope=national&org="+allAuthorized.find(a=>a.role==="national_admin")!.org_id}>National</Link>}{allAuthorized.filter(a=>a.role==="union_admin").map(a=><Link key={a.id} href={"/admin?scope=union&org="+a.org_id}>{orgName(a)??"Union"} portal</Link>)}{allAuthorized.filter(a=>a.role==="zone_admin").map(a=><Link key={a.id} href={"/admin?scope=zone&org="+a.org_id}>{orgName(a)??"Zone"} portal</Link>)}{allAuthorized.filter(a=>["campus_admin","church_admin"].includes(a.role)).map(a=><Link key={a.id} href={"/admin?scope=institution&org="+a.org_id}>{orgName(a)??"Institution"} portal</Link>)}<Link href={requestedScope ? "/admin/leadership?scope="+requestedScope : "/admin/leadership"} className="admin-leadership-link">Leadership & executives →</Link></nav>
      {reviewState === "approved" && <div className="directory-feedback success" role="status">Membership approved. The member’s status and audit history have been updated.</div>}
      {reviewState === "rejected" && <div className="directory-feedback success" role="status">Membership request rejected. The reason has been recorded in the membership history.</div>}
      {(reviewState === "failed" || reviewState === "invalid") && <div className="directory-feedback error" role="alert">The review could not be completed. Refresh the queue and confirm the request is still pending and within your authorized scope.</div>}
      {transferState === "approved" && <div className="directory-feedback success" role="status">Transfer stage approved. If this was the destination review, the membership transfer is now complete.</div>}
      {transferState === "rejected" && <div className="directory-feedback success" role="status">The transfer request was rejected and the decision was recorded.</div>}
      {(transferState === "failed" || transferState === "invalid") && <div className="directory-feedback error" role="alert">The transfer review could not be completed. The request may have changed state or may be outside your organization scope.</div>}

      <div className="admin-live-scope">
        <b>Verified active assignments</b>
        <span>{authorized.map(a => label(a.role) + " · " + (orgName(a) ?? "Assigned organization")).join(" | ")}</span>
        <small>Assignments are loaded from the signed-in user's active membership records. Supabase independently enforces every organization scope.</small>
      </div>
      <section className="admin-workspace">
        <div className="admin-page-heading"><div><div className="section-kicker">AUTHORIZED WORKSPACE</div><h2>{requestedScope ? requestedScope.charAt(0).toUpperCase()+requestedScope.slice(1)+" administration" : "Membership review"}</h2><p>Live pending membership requests within your approved organisation scope.</p></div><span className="admin-scope-chip">Scoped queue only</span></div>
        <div className="admin-metrics">
          <article><div className="metric-top"><span>Pending requests in scope</span></div><strong>{totalPending}</strong><small>Live database count</small></article>
          <article><div className="metric-top"><span>Assigned organizations</span></div><strong>{authorized.length}</strong><small>Active administrator assignments</small></article>
          <article><div className="metric-top"><span>Queue read errors</span></div><strong>{queueErrors}</strong><small>{queueErrors ? "Some scoped queues could not load" : "All scoped queues responded"}</small></article>
        </div>
        {queueResults.map(({ assignment, items, error: queueError }) => <section className="admin-panel" key={assignment.id}>
          <div className="admin-panel-head"><div><span className="section-kicker">{label((Array.isArray(assignment.org_units) ? assignment.org_units[0]?.org_type : assignment.org_units?.org_type) ?? "organization")} SCOPE</span><h3>{orgName(assignment) ?? "Assigned organization"}</h3></div><span className="admin-count">{items.length} shown</span></div>
          {queueError ? <p className="member-empty">The live review queue could not be loaded for this scope. No sample records are displayed.</p> :
           items.length === 0 ? <p className="member-empty">There are currently no pending membership requests in this organization scope.</p> :
           <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>APPLICANT</th><th>ORGANIZATION</th><th>REQUESTED ROLE</th><th>SUBMITTED</th><th>STATUS</th><th>REVIEW</th></tr></thead><tbody>{items.map(item=><tr key={item.membership_id}><td><b>{item.display_name}</b><small>{item.institution_name ?? "Institution not supplied"}{item.course_of_study ? " · " + item.course_of_study : ""}{item.level_of_study ? " · " + item.level_of_study : ""}</small></td><td>{item.organization_name}<small>{label(item.organization_type)}</small></td><td>{label(item.requested_role)}</td><td>{new Date(item.requested_at).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"})}</td><td><span className="status-tag">Pending review</span></td><td><div className="admin-review-actions"><form action={reviewMembership}><input type="hidden" name="membership_id" value={item.membership_id}/><input type="hidden" name="decision" value="approve"/><button type="submit">Approve</button></form><form action={reviewMembership}><input type="hidden" name="membership_id" value={item.membership_id}/><input type="hidden" name="decision" value="reject"/><label><span className="sr-only">Reason for rejection</span><textarea name="reviewer_notes" minLength={10} maxLength={1000} required rows={2} placeholder="Reason for rejection (10–1000 characters)"/></label><button type="submit">Reject</button></form></div></td></tr>)}</tbody></table></div>}
        </section>)}

        <section className="admin-panel" id="transfers">
          <div className="admin-panel-head"><div><span className="section-kicker">MEMBERSHIP LIFECYCLE</span><h3>Membership transfer reviews</h3><p>Requests are routed to the source organization first, then the destination organization.</p></div><span className="admin-count">{transferQueueError ? "Unavailable" : transferRequests.length + " pending"}</span></div>
          {transferQueueError ? <p className="member-empty">The transfer queue could not be loaded. No sample requests are displayed.</p> :
            transferRequests.length === 0 ? <p className="member-empty">There are no pending transfer requests in the organizations you administer.</p> :
            <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>MEMBER REFERENCE</th><th>TRANSFER</th><th>REASON</th><th>STAGE</th><th>SUBMITTED</th><th>DECISION</th></tr></thead><tbody>
              {transferRequests.map(item => {
                const source = transferOrgMap.get(item.source_org_id);
                const destination = transferOrgMap.get(item.destination_org_id);
                const stageOrgId = item.status === "pending_source" ? item.source_org_id : item.destination_org_id;
                const stageOrg = transferOrgMap.get(stageOrgId);
                return <tr key={item.id}>
                  <td><b>Member {item.user_id.slice(0, 8)}</b><small>Request {item.id.slice(0, 8)}</small></td>
                  <td><b>{source?.name ?? "Source organization"}</b><small>→ {destination?.name ?? "Destination organization"}</small></td>
                  <td>{item.reason ?? "No reason supplied"}</td>
                  <td><span className="status-tag">{item.status === "pending_source" ? "Source review" : "Destination review"}</span><small>{stageOrg?.name ?? "Assigned organization"}</small></td>
                  <td>{new Date(item.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td><div className="admin-review-actions">
                    <form action={reviewMembershipTransfer}><input type="hidden" name="transfer_id" value={item.id}/><input type="hidden" name="decision" value="approve"/><button type="submit">Approve</button></form>
                    <form action={reviewMembershipTransfer}><input type="hidden" name="transfer_id" value={item.id}/><input type="hidden" name="decision" value="reject"/><label><span className="sr-only">Reason for transfer rejection</span><textarea name="reviewer_notes" minLength={10} maxLength={1000} required rows={2} placeholder="Reason for rejection (10–1000 characters)"/></label><button type="submit">Reject</button></form>
                  </div></td>
                </tr>;
              })}
            </tbody></table></div>}
          <div className="admin-boundary-note">Only transfer requests visible through the administrator’s existing organization-scoped RLS policy appear here. Approval or rejection is performed by review_membership_transfer, which checks the current stage and administrator authority again inside the database.</div>
        </section>
        <div className="admin-boundary-note">Every decision is submitted through the existing transactional review_member_onboarding RPC. The database rechecks the administrator’s organization scope, blocks self-review, confirms the request is still pending, revalidates eligibility on approval, requires a reason for rejection, and writes the membership event atomically. Client-side controls do not grant authority.</div>
      </section>
    </div>
  </main>;
}
