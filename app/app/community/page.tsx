import Link from "next/link";
import PortalSideNav from "../PortalSideNav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteCommunityStatus, publishCommunityStatus } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StatusRow = {
  id: string;
  content: string;
  media_url: string | null;
  created_at: string;
  expires_at: string;
  author_user_id: string;
  author_org_id: string | null;
};

export default async function CommunityPage({searchParams}:{searchParams:Promise<{status?:string}>}) {\n  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const [statusResult, membershipResult] = await Promise.all([
    supabase.from("community_statuses")
      .select("id,content,media_url,created_at,expires_at,author_user_id,author_org_id")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false }).limit(100),
    supabase.from("org_memberships")
      .select("id,org_id,role,status,org_units(name,org_type)")
      .eq("user_id", user.id).eq("status", "active"),
  ]);
  const { data, error } = statusResult;
  const memberships = membershipResult.data ?? [];
  const activeMembership = memberships.length > 0;
  const adminMemberships = memberships.filter(item => ["national_admin","union_admin","zone_admin","campus_admin","church_admin"].includes(item.role));
  const statuses = (data ?? []) as StatusRow[];
  return (
    <main className="member-app portal-app-frame"><PortalSideNav/><div className="portal-main-column"><header className="portal-main-topbar"><span>NAASCONNECT NIGERIA <i>/</i> MEMBER SPACE</span><Link href="/app">Overview</Link></header><div className="portal-dashboard directory-shell">
      <header className="directory-header">
        <Link href="/app" className="directory-back">← Member workspace</Link>
        <span className="directory-kicker">NAASCONNECT NIGERIA · COMMUNITY</span>
        <h1>Global Status</h1>
        <p>Short-lived updates shared across the authenticated NAASCONNECT community. Statuses expire automatically according to their recorded expiry time.</p>
      </header>
      {params.status && <p className="portal-inline-success" role="status">{params.status === "published" ? "Your status has been published." : params.status === "deleted" ? "Your status has been deleted." : "Status update: " + params.status.replaceAll("-", " ")}</p>}\n      <section className="directory-search-panel">
        <div className="directory-results-head">
          <div><span className="directory-kicker">YOUR COMMUNITY</span><h2>Recent updates <span>{statuses.length}</span></h2></div>
          <span className="directory-count-note">{statuses.length} active updates</span>
        </div>
      </section>
      {activeMembership && <section className="portal-content-card community-composer-card">
        <div className="portal-card-heading"><span>SHARE WITH THE COMMUNITY</span><h2>Publish a status</h2><p>Personal updates are shared under your account. Organisation publishing is limited to active administrator assignments.</p></div>
        <form action={publishCommunityStatus} className="member-status-composer">
          <label>Post as<select name="author_org_id" defaultValue=""><option value="">My personal account</option>{adminMemberships.map(item=>{const org=Array.isArray(item.org_units)?item.org_units[0]:item.org_units;return <option key={item.id} value={item.org_id}>{org?.name??"Authorised organisation"}</option>;})}</select></label>
          <label htmlFor="community-status-content">Your update</label><textarea id="community-status-content" name="content" maxLength={2000} minLength={1} required placeholder="Share an update with the NAASCONNECT community."/>
          <label>Optional media link<input name="media_url" type="url" placeholder="https://..."/></label><div><small>Visible to authenticated members · Expires after 24 hours</small><button type="submit">Publish status</button></div>
        </form>
      </section>}
      {!activeMembership && <div className="portal-inline-alert">Status publishing becomes available after an organisation membership is approved. <Link href="/app/membership">View membership options</Link></div>}
      {error ? (
        <div className="directory-empty" role="alert"><h3>Statuses are temporarily unavailable</h3><p>Refresh the page. If this continues, contact support.</p></div>
      ) : statuses.length === 0 ? (
        <div className="directory-empty"><h3>No active statuses yet</h3><p>When members and authorized organization representatives share updates, they will appear here.</p></div>
      ) : (
        <div className="directory-card-grid">
          {statuses.map((status) => (
            <article className="directory-card" key={status.id}>
              <div className="directory-card-top"><span className="directory-org-mark">NAAS</span><span className="directory-active-label"><i/> Active</span></div>
              <p className="directory-description" style={{ whiteSpace: "pre-wrap" }}>{status.content}</p>
              {status.media_url && <a className="directory-card-link" href={status.media_url} target="_blank" rel="noreferrer">Open attached media ↗</a>}
              <div className="directory-meta"><span>{new Date(status.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span><span>Expires {new Date(status.expires_at).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}</span></div>
              {status.author_user_id === user.id && <><small className="directory-description">Posted by you</small><form action={deleteCommunityStatus}><input type="hidden" name="status_id" value={status.id}/><button type="submit">Delete status</button></form></>}
              {status.author_org_id && <small className="directory-description">Organization update</small>}
            </article>
          ))}
        </div>
      )}
      <footer className="directory-footer">Only authenticated NAASCONNECT users can access global statuses. Expired statuses are excluded from this view.</footer>
    </div></div></main>
  );
}
