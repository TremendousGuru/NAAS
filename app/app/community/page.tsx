import Link from "next/link";
import PortalSideNav from "../PortalSideNav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteCommunityStatus, publishCommunityStatus } from "../actions";
import { publishCommunityPost, reportCommunityPost, reviewCommunityReport } from "./actions";

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

export default async function CommunityPage({searchParams}:{searchParams:Promise<{status?:string;post?:string;report?:string;moderation?:string}>}) {
  const params = await searchParams;
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
  const [{ data: communityPosts, error: communityError }, { data: scopedAdminRows }, { data: openReports }] = await Promise.all([
    supabase.from("community_posts").select("id,author_user_id,author_org_id,audience_org_id,post_type,title,content,media_path,published_at,org_units(name)").eq("status","published").order("published_at",{ascending:false}).limit(50),
    supabase.from("org_memberships").select("org_id,role,org_units!inner(id,name,status)").eq("user_id",user.id).eq("status","active").in("role",["national_admin","union_admin","zone_admin","campus_admin","church_admin"]),
    supabase.from("community_post_reports").select("id,post_id,reason,details,status,created_at,community_posts!inner(title,content,author_org_id)").in("status",["open","reviewing"]).order("created_at",{ascending:true}).limit(50)
  ]);
  const scopedAdmins=(scopedAdminRows??[]).filter((r:any)=>r.org_units?.status==="active");
  const scopedReports=(openReports??[]).filter((r:any)=>scopedAdmins.some((o:any)=>o.org_id===r.community_posts?.author_org_id));
  const persistentPosts=(communityPosts??[]) as any[];
  const signedMedia=await Promise.all(persistentPosts.map(post=>post.media_path?supabase.storage.from("community-media").createSignedUrl(post.media_path,300):Promise.resolve({data:null} as any)));
  const mediaUrls=new Map(persistentPosts.map((post,i)=>[post.id,signedMedia[i]?.data?.signedUrl??null]));

  return (
    <main className="member-app portal-app-frame"><PortalSideNav/><div className="portal-main-column"><header className="portal-main-topbar"><span>NAASCONNECT NIGERIA <i>/</i> MEMBER SPACE</span><Link href="/app">Overview</Link></header><div className="portal-dashboard directory-shell">
      <header className="directory-header">
        <Link href="/app" className="directory-back">← Member workspace</Link>
        <span className="directory-kicker">NAASCONNECT NIGERIA · COMMUNITY</span>
        <h1>Global Status</h1>
        <p>Short-lived updates shared across the authenticated NAASCONNECT community. Statuses expire automatically according to their recorded expiry time.</p>
      </header>
      {params.status && <p className="portal-inline-success" role="status">{params.status === "published" ? "Your status has been published." : params.status === "deleted" ? "Your status has been deleted." : "Status update: " + params.status.replaceAll("-", " ")}</p>}
      <section className="directory-search-panel">
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

      <section className="community-composer">
        <span className="directory-kicker">PERSISTENT COMMUNITY</span><h2>Share a community post</h2>
        <p>These posts remain in the feed. They are separate from the 24-hour Global Status updates above.</p>
        {params.post && <p className="community-feedback" role="status">{params.post==="published"?"Your post has been published.":"The post could not be published. Check your permissions and attachment."}</p>}
        {params.report && <p className="community-feedback" role="status">{params.report==="submitted"?"Your report has been submitted.":"The report could not be submitted."}</p>}
        {params.moderation && <p className="community-feedback" role="status">{params.moderation==="saved"?"Moderation decision saved.":"Moderation action failed."}</p>}
        <form action={publishCommunityPost} className="community-form">
          <label>Post type<select name="post_type"><option value="member_post">Community post</option>{scopedAdmins.length>0&&<option value="announcement">Official announcement</option>}</select></label>
          {scopedAdmins.length>0&&<label>Organization<select name="author_org_id"><option value="">Choose organization</option>{scopedAdmins.map((o:any)=><option key={o.org_id} value={o.org_id}>{o.org_units.name}</option>)}</select></label>}
          <label>Announcement title<input name="title" maxLength={160} placeholder="Required for official announcements"/></label>
          <label>Message<textarea name="content" required maxLength={5000} rows={4}/></label>
          <label>Image or short video<input name="media" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"/></label>
          <small>Maximum attachment size: 10 MB. Media is stored privately.</small><button className="community-submit" type="submit">Publish post</button>
        </form>
      </section>
      <section className="community-feed">
        <div className="community-section-heading"><div><span className="directory-kicker">LATEST POSTS</span><h2>Community feed</h2></div><span>{persistentPosts.length} posts</span></div>
        {communityError?<div className="directory-empty"><h3>Community feed unavailable</h3><p>The persistent community feature may not yet be enabled in this environment.</p></div>:persistentPosts.length===0?<div className="directory-empty"><h3>No community posts yet</h3><p>New persistent posts will appear here.</p></div>:persistentPosts.map(post=><article className="community-post" key={post.id}>
          <span className={post.post_type==="announcement"?"community-badge official":"community-badge"}>{post.post_type==="announcement"?"Official announcement":"Community post"}</span>
          <h3>{post.title??"Community update"}</h3><small>{post.org_units?.name??"NAASCONNECT member"} · {new Date(post.published_at).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"})}</small>
          <p className="community-post-copy">{post.content}</p>{mediaUrls.get(post.id)&&<a className="community-media-link" href={mediaUrls.get(post.id)!} target="_blank" rel="noreferrer">View attachment ↗</a>}
          <details className="community-report"><summary>Report this post</summary><form action={reportCommunityPost}><input type="hidden" name="post_id" value={post.id}/><label>Reason<select name="reason"><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="hate_or_abuse">Hate or abuse</option><option value="misinformation">Misinformation</option><option value="inappropriate">Inappropriate</option><option value="other">Other</option></select></label><label>Details<textarea name="details" maxLength={1000}/></label><button type="submit">Submit report</button></form></details>
        </article>)}
      </section>
      {scopedReports.length>0&&<section className="community-moderation"><span className="directory-kicker">AUTHORIZED MODERATION</span><h2>Moderation queue</h2>{scopedReports.map((r:any)=><article className="community-post" key={r.id}><b>{r.reason.replaceAll("_"," ")}</b><p>{r.community_posts?.title??r.community_posts?.content}</p><form action={reviewCommunityReport}><input type="hidden" name="report_id" value={r.id}/><label>Decision<select name="status"><option value="reviewing">Under review</option><option value="resolved">Resolve</option><option value="dismissed">Dismiss</option></select></label><label>Review note<textarea name="review_note" minLength={10} required/></label><button type="submit">Save decision</button></form></article>)}</section>}

      <footer className="directory-footer">Only authenticated NAASCONNECT users can access global statuses. Expired statuses are excluded from this view.</footer>
    </div></div></main>
  );
}
