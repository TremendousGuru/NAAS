import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export default async function CommunityPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data, error } = await supabase
    .from("community_statuses")
    .select("id,content,media_url,created_at,expires_at,author_user_id,author_org_id")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(100);

  const statuses = (data ?? []) as StatusRow[];
  return (
    <main className="directory-shell">
      <header className="directory-header">
        <Link href="/app" className="directory-back">← Member workspace</Link>
        <span className="directory-kicker">NAASCONNECT NIGERIA · COMMUNITY</span>
        <h1>Global Status</h1>
        <p>Short-lived updates shared across the authenticated NAASCONNECT community. Statuses expire automatically according to their recorded expiry time.</p>
      </header>
      <section className="directory-search-panel">
        <div className="directory-results-head">
          <div><span className="directory-kicker">YOUR COMMUNITY</span><h2>Recent updates <span>{statuses.length}</span></h2></div>
          <Link className="directory-card-link" href="/app#statuses">Create a status →</Link>
        </div>
      </section>
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
              {status.author_user_id === user.id && <small className="directory-description">Posted by you</small>}
              {status.author_org_id && <small className="directory-description">Organization update</small>}
            </article>
          ))}
        </div>
      )}
      <footer className="directory-footer">Only authenticated NAASCONNECT users can access global statuses. Expired statuses are excluded from this view.</footer>
    </main>
  );
}
