import Link from "next/link";
import PortalSideNav from "../PortalSideNav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteCommunityStatus, publishCommunityStatus, publishCommunityPost, reportCommunityPost, reviewCommunityPostReport, reviewGlobalCommunityPostReport, hideGlobalCommunityPost } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type StatusRow = {
  id: string; content: string; media_url: string | null; created_at: string;
  expires_at: string; author_user_id: string; author_org_id: string | null;
};
type CommunityPost = {
  id: string; author_user_id: string; author_org_id: string | null;
  audience_org_id: string | null; post_type: string; title: string | null;
  content: string; media_path: string | null; media_signed_url?: string | null; status: string; published_at: string;
};

type ModerationReport = {
  id: string; post_id: string; reason: string; details: string | null;
  status: string; created_at: string;
  community_posts: {
    id: string; author_org_id: string | null; post_type: string;
    title: string | null; content: string; status: string;
  } | null;
};

type GlobalModerationReport = {
  id:string; post_id:string; reporter_user_id:string; reason:string;
  details:string|null; status:string; created_at:string;
  community_posts:{
    id:string; author_user_id:string; author_org_id:string|null;
    post_type:string; title:string|null; content:string; status:string; published_at:string;
  } | {
    id:string; author_user_id:string; author_org_id:string|null;
    post_type:string; title:string|null; content:string; status:string; published_at:string;
  }[] | null;
};

const readable = (value: string) => value.replaceAll("_", " ").replace(/\\b\\w/g, letter => letter.toUpperCase());

export default async function CommunityPage({searchParams}:{searchParams:Promise<{status?:string;feed?:string;report?:string;moderation?:string;global_moderation?:string}>}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const [statusResult, membershipResult, postResult, organizationResult, reportResult] = await Promise.all([
    supabase.from("community_statuses").select("id,content,media_url,created_at,expires_at,author_user_id,author_org_id")
      .gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(50),
    supabase.from("org_memberships").select("id,org_id,role,status,org_units(name,org_type)")
      .eq("user_id", user.id).eq("status", "active"),
    supabase.from("community_posts").select("id,author_user_id,author_org_id,audience_org_id,post_type,title,content,media_path,status,published_at")
      .eq("status", "published").order("published_at", { ascending: false }).limit(50),
    supabase.from("org_units").select("id,name,org_type").eq("status", "active").order("name").limit(500),
    supabase.from("community_post_reports")
      .select("id,post_id,reason,details,status,created_at,community_posts!inner(id,author_org_id,post_type,title,content,status)")
      .in("status", ["open", "reviewing"]).order("created_at", { ascending: false }).limit(50),
  ]);
  const statuses = (statusResult.data ?? []) as StatusRow[];
  const rawPosts = (postResult.data ?? []) as CommunityPost[];
  const posts = await Promise.all(rawPosts.map(async post => {
    if (!post.media_path) return post;
    const { data } = await supabase.storage.from("community-media").createSignedUrl(post.media_path, 3600);
    return { ...post, media_signed_url: data?.signedUrl ?? null };
  }));
  const memberships = membershipResult.data ?? [];
  const activeMembership = memberships.length > 0;
  const adminMemberships = memberships.filter(item => ["national_admin","union_admin","zone_admin","campus_admin","church_admin"].includes(item.role));
  const isNationalAdmin = adminMemberships.some(item => item.role === "national_admin");
  let globalModerationReports: GlobalModerationReport[] = [];
  let globalModerationError = false;
  if (isNationalAdmin) {
    const { data, error } = await supabase.functions.invoke("community-moderation", { body: { action: "list" } });
    if (error || !data?.ok) globalModerationError = true;
    else globalModerationReports = (data.reports ?? []) as GlobalModerationReport[];
  }
  const moderationReports = (reportResult.data ?? []) as unknown as ModerationReport[];
  // Personal member-post reports remain excluded until a global moderation
  // authority and matching database policy are formally implemented.
  const scopedModerationReports = adminMemberships.length
    ? moderationReports.filter(report => Boolean(report.community_posts?.author_org_id))
    : [];
  const orgs = new Map((organizationResult.data ?? []).map(item => [item.id, item]));
  const feedError = postResult.error || membershipResult.error || organizationResult.error;
  return (
    <main className="member-app portal-app-frame"><PortalSideNav/><div className="portal-main-column">
      <header className="portal-main-topbar"><span>NAASCONNECT NIGERIA <i>/</i> MEMBER SPACE</span><Link href="/app">Overview</Link></header>
      <div className="portal-dashboard directory-shell">
        <header className="directory-header">
          <Link href="/app" className="directory-back">← Member workspace</Link>
          <span className="directory-kicker">NAASCONNECT NIGERIA · COMMUNITY</span>
          <h1>Community</h1>
          <p>Share updates, follow organization announcements and stay connected with the wider NAAS community.</p>
        </header>

        {params.feed && <p className="portal-inline-success" role="status">{({
          published:"Your post has been published.",empty:"Write a message before publishing.",
          "title-required":"Organization announcements need a title of at least three characters.",
          "not-authorized":"You do not have an active administrator assignment for that organization.",
          "membership-required":"An active NAAS membership is required to publish.",
          "not-published":"The post could not be published. Check your access and try again.",
          "media-too-large":"Media files must be 10 MB or smaller.", "media-invalid":"Choose a supported image or video file.",
          "media-upload-failed":"The media upload failed. Please try again."
        } as Record<string,string>)[params.feed] ?? "Community update: " + params.feed.replaceAll("-"," ")}</p>}
        {params.report && <p className="portal-inline-success" role="status">{params.report === "submitted" ? "Thank you. Your report has been submitted for review." : params.report === "rate-limited" ? "You have reached the report limit (5 per hour or 20 per day). Please wait before submitting another report." : "The report could not be submitted. Please try again."}</p>}
        {params.moderation && <p className="portal-inline-success" role="status">{params.moderation === "updated" ? "The report review has been saved." : "The report could not be updated. Your administrator scope may not include this post."}</p>}
        {params.global_moderation && <p className="portal-inline-success" role="status">{({
          reviewed:"Personal-post report review saved.",
          hidden:"The reported personal post has been hidden from the community feed.",
          invalid:"Check the report, decision and moderation note.",
          failed:"The platform moderation action could not be completed. Confirm your National administrator access and try again."
        } as Record<string,string>)[params.global_moderation] ?? "Platform moderation update."}</p>}
        {params.status && <p className="portal-inline-success" role="status">{params.status === "published" ? "Your status has been published." : params.status === "deleted" ? "Your status has been deleted." : "Status update: " + params.status.replaceAll("-"," ")}</p>}

        {isNationalAdmin && <section className="portal-content-card">
          <div className="portal-card-heading"><span>NATIONAL ADMINISTRATION</span><h2>Platform-wide member-post moderation <small>{globalModerationReports.length}</small></h2><p>National administrators can review reports on personal member posts across the platform. This queue is separate from organization-scoped announcement moderation.</p></div>
          {globalModerationError ? <div className="directory-empty" role="alert"><h3>Platform moderation queue unavailable</h3><p>The National moderation service did not return a valid response. Refresh or contact support if this continues.</p></div>
          : globalModerationReports.length===0 ? <div className="directory-empty"><h3>No personal-post reports awaiting review</h3><p>New reports about personal member posts will appear here.</p></div>
          : <div className="directory-card-grid">{globalModerationReports.map(report=>{
            const post=Array.isArray(report.community_posts)?report.community_posts[0]:report.community_posts;
            if(!post) return null;
            return <article className="directory-card" key={report.id}>
              <div className="directory-card-top"><span className="directory-org-mark">MEMBER POST</span><span className="directory-active-label">{report.status.replaceAll("_"," ")}</span></div>
              {post.title&&<h3>{post.title}</h3>}
              <p className="directory-description" style={{whiteSpace:"pre-wrap"}}>{post.content}</p>
              <div className="directory-meta"><span>Reason: {readable(report.reason)}</span><span>Reported {new Date(report.created_at).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"})}</span></div>
              <p className="directory-meta">Reporter reference: {report.reporter_user_id.slice(0,8)} · Post status: {readable(post.status)}</p>
              {report.details&&<p className="directory-description">Reporter details: {report.details}</p>}
              <form action={reviewGlobalCommunityPostReport} className="member-status-composer">
                <input type="hidden" name="report_id" value={report.id}/>
                <label>Review outcome<select name="status" defaultValue={report.status}><option value="reviewing">Under review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></label>
                <label>Review note (optional; at least 10 characters if entered)<textarea name="review_note" minLength={10} maxLength={1000}/></label>
                <button type="submit">Save report review</button>
              </form>
              {post.status==="published"&&<form action={hideGlobalCommunityPost} className="member-status-composer">
                <input type="hidden" name="report_id" value={report.id}/>
                <input type="hidden" name="post_id" value={post.id}/>
                <label>Reason for hiding this post (required)<textarea name="review_note" required minLength={10} maxLength={1000}/></label>
                <button type="submit">Hide post from community</button>
              </form>}
            </article>;
          })}</div>}
        </section>}

        {adminMemberships.length > 0 && <section className="portal-content-card">
          <div className="portal-card-heading"><span>ADMIN TOOLS</span><h2>Organization moderation <small>{scopedModerationReports.length}</small></h2><p>Review reports for organization announcements within your assigned scope. Personal member-post moderation is not enabled by the current database policies.</p></div>
          {reportResult.error ? <div className="directory-empty" role="alert"><h3>Moderation queue unavailable</h3><p>Refresh the page or contact support if this continues.</p></div>
          : scopedModerationReports.length === 0 ? <div className="directory-empty"><h3>No organization reports awaiting review</h3><p>New reports for announcements in your authorized organization scope will appear here.</p></div>
          : <div className="directory-card-grid">{scopedModerationReports.map(report => {
            const post = report.community_posts;
            if (!post) return null;
            return <article className="directory-card" key={report.id}>
              <div className="directory-card-top"><span className="directory-org-mark">REPORT</span><span className="directory-active-label">{report.status.replaceAll("_", " ")}</span></div>
              {post.title && <h3>{post.title}</h3>}
              <p className="directory-description" style={{whiteSpace:"pre-wrap"}}>{post.content}</p>
              <div className="directory-meta"><span>Reason: {readable(report.reason)}</span><span>{new Date(report.created_at).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"})}</span></div>
              {report.details && <p className="directory-description">Reporter details: {report.details}</p>}
              <form action={reviewCommunityPostReport} className="member-status-composer">
                <input type="hidden" name="report_id" value={report.id}/>
                <label>Review outcome<select name="status" defaultValue={report.status === "open" ? "reviewing" : report.status}><option value="reviewing">Under review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></label>
                <label>Review note (optional; at least 10 characters if entered)<textarea name="review_note" maxLength={1000} minLength={10}/></label>
                <button type="submit">Save review</button>
              </form>
            </article>;
          })}</div>}
        </section>}

        {activeMembership && <section className="portal-content-card community-composer-card">
          <div className="portal-card-heading"><span>COMMUNITY FEED</span><h2>Create a post</h2><p>Members can publish community posts. Active administrators can also publish announcements for their assigned organization.</p></div>
          <form action={publishCommunityPost} className="member-status-composer">
            <label>Publish as
              <select name="author_org_id" defaultValue="">
                <option value="">My personal account · Community-wide</option>
                {adminMemberships.map(item => {const org=Array.isArray(item.org_units)?item.org_units[0]:item.org_units;return <option key={item.id} value={item.org_id}>{org?.name ?? "Authorized organization"} · Announcement</option>;})}
              </select>
            </label>
            <label>Announcement title (required only for organization announcements)<input name="title" maxLength={160} minLength={3} placeholder="Organization announcement title"/></label>
            <label htmlFor="community-post-content">Message</label>
            <textarea id="community-post-content" name="content" maxLength={5000} minLength={1} required placeholder="Share an update, story or announcement with the community."/>
            <label>Photo or video (optional) <input type="file" name="media" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"/></label>
            <small>Images and MP4/WebM videos · maximum 10 MB per file</small>
            <div><small>Published posts are subject to the community guidelines and reporting process.</small><button type="submit">Publish post</button></div>
          </form>
        </section>}

        <section className="portal-content-card">
          <div className="portal-card-heading"><span>COMMUNITY FEED</span><h2>Recent posts <small>{posts.length}</small></h2><p>Community-wide posts and announcements visible to your active membership.</p></div>
          {feedError ? <div className="directory-empty" role="alert"><h3>Community feed unavailable</h3><p>Refresh the page. If the problem continues, contact support.</p></div>
          : posts.length === 0 ? <div className="directory-empty"><h3>No posts yet</h3><p>When members and authorized organizations publish updates, they will appear here.</p></div>
          : <div className="directory-card-grid">
            {posts.map(post => {
              const org=post.author_org_id?orgs.get(post.author_org_id):null;
              return <article className="directory-card" key={post.id}>
                <div className="directory-card-top"><span className="directory-org-mark">NAAS</span><span className="directory-active-label">{post.post_type==="announcement"?"Organization announcement":"Member post"}</span></div>
                {post.title && <h3>{post.title}</h3>}
                <p className="directory-description" style={{whiteSpace:"pre-wrap"}}>{post.content}</p>
                <div className="directory-meta"><span>{org?.name ?? (post.author_user_id===user.id?"Posted by you":"NAASCONNECT member")}</span><span>{new Date(post.published_at).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"})}</span></div>
                {post.author_user_id!==user.id && <details><summary>Report this post</summary><form action={reportCommunityPost} className="member-status-composer"><input type="hidden" name="post_id" value={post.id}/><label>Reason<select name="reason" required defaultValue=""><option value="" disabled>Select a reason</option><option value="spam">Spam</option><option value="harassment">Harassment</option><option value="hate_or_abuse">Hate or abuse</option><option value="misinformation">Misinformation</option><option value="inappropriate">Inappropriate content</option><option value="other">Other</option></select></label><label>Additional details (optional)<textarea name="details" maxLength={1000}/></label><button type="submit">Submit report</button></form></details>}
              </article>;
            })}
          </div>}
        </section>

        <section className="portal-content-card community-composer-card">
          <div className="portal-card-heading"><span>24-HOUR UPDATES</span><h2>Global status</h2><p>Short-lived member and organization updates expire automatically after 24 hours.</p></div>
          {activeMembership && <form action={publishCommunityStatus} className="member-status-composer">
            <label>Post as<select name="author_org_id" defaultValue=""><option value="">My personal account</option>{adminMemberships.map(item=>{const org=Array.isArray(item.org_units)?item.org_units[0]:item.org_units;return <option key={item.id} value={item.org_id}>{org?.name??"Authorized organization"}</option>;})}</select></label>
            <label htmlFor="community-status-content">Your status</label><textarea id="community-status-content" name="content" maxLength={2000} minLength={1} required placeholder="Share a brief update."/>
            <label>Optional media link<input name="media_url" type="url" placeholder="https://..."/></label><div><small>Visible to authenticated members · Expires after 24 hours</small><button type="submit">Publish status</button></div>
          </form>}
          {!activeMembership && <p className="portal-inline-alert">Status publishing becomes available after an organization membership is approved. <Link href="/app/membership">View membership options</Link></p>}
          {statusResult.error ? <div className="directory-empty" role="alert"><h3>Statuses are temporarily unavailable</h3></div>
          : statuses.length===0 ? <div className="directory-empty"><h3>No active statuses yet</h3><p>Short-lived updates will appear here.</p></div>
          : <div className="directory-card-grid">{statuses.map(status=><article className="directory-card" key={status.id}><div className="directory-card-top"><span className="directory-org-mark">NAAS</span><span className="directory-active-label">Active status</span></div><p className="directory-description" style={{whiteSpace:"pre-wrap"}}>{status.content}</p>{status.media_url&&<a className="directory-card-link" href={status.media_url} target="_blank" rel="noreferrer">Open attached media ↗</a>}<div className="directory-meta"><span>{new Date(status.created_at).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"})}</span><span>Expires {new Date(status.expires_at).toLocaleString("en-NG",{dateStyle:"short",timeStyle:"short"})}</span></div>{status.author_user_id===user.id&&<form action={deleteCommunityStatus}><input type="hidden" name="status_id" value={status.id}/><button type="submit">Delete status</button></form>}</article>)}</div>}
        </section>
        <footer className="directory-footer">Only authenticated members can access the community feed. Organization announcements and reports are restricted by the active database authorization policies.</footer>
      </div>
    </div></main>
  );
}
