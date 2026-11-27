import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LeadershipEvent = {
  id: string;
  org_id: string;
  handover_request_id: string | null;
  event_type: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  delivered_at: string | null;
};

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  // This is the existing leadership-event stream, not a claim that a unified
  // notification inbox or delivery/preferences engine has been implemented.
  const { data, error } = await supabase
    .from("leadership_notification_events")
    .select("id,org_id,handover_request_id,event_type,payload,created_at,delivered_at")
    .eq("recipient_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const events = (data ?? []) as LeadershipEvent[];
  return (
    <main className="directory-shell">
      <header className="directory-header">
        <Link href="/app" className="directory-back">← Member workspace</Link>
        <span className="directory-kicker">NAASCONNECT NIGERIA · UPDATES</span>
        <h1>Leadership notifications</h1>
        <p>Leadership workflow events addressed to your account. Other notification categories and delivery preferences will be added when their approved backend services are available.</p>
      </header>
      {error ? (
        <div className="directory-empty" role="alert"><h3>Notifications could not be loaded</h3><p>Please refresh. If this continues, contact support.</p></div>
      ) : events.length === 0 ? (
        <div className="directory-empty"><h3>You are all caught up</h3><p>No leadership workflow notifications have been recorded for your account.</p></div>
      ) : (
        <div className="directory-card-grid">
          {events.map((event) => (
            <article className="directory-card" key={event.id}>
              <div className="directory-card-top"><span className="directory-org-mark">NAAS</span><span className="directory-active-label">{event.delivered_at ? "Recorded delivery" : "Recorded event"}</span></div>
              <h3>{readable(event.event_type)}</h3>
              <p className="directory-description">A leadership workflow event was recorded for an organization in your authorized notification stream.</p>
              <div className="directory-meta"><span>{new Date(event.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span>{event.handover_request_id && <span>Request {event.handover_request_id.slice(0, 8)}</span>}</div>
            </article>
          ))}
        </div>
      )}
      <footer className="directory-footer">This page reads the existing leadership notification event source. It does not mark events read or change notification preferences.</footer>
    </main>
  );
}
