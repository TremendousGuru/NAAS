import Link from "next/link";
import PortalSideNav from "../PortalSideNav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markUserNotificationRead } from "../actions";

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

export default async function NotificationsPage({searchParams}:{searchParams:Promise<{result?:string}>}) {
  const params=await searchParams;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  // Combine the two existing, user-scoped event sources. This is an in-app
  // activity inbox; it does not claim email/push delivery or read receipts.
  const [leadershipResult, membershipResult, appResult] = await Promise.all([
    supabase.from("leadership_notification_events")
      .select("id,org_id,handover_request_id,event_type,payload,created_at,delivered_at")
      .eq("recipient_user_id", user.id)
      .order("created_at", { ascending: false }).limit(100),
    supabase.from("membership_events")
      .select("id,org_id,event_type,details,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(100),
  ]);
  const error = leadershipResult.error || membershipResult.error || appResult.error;
  const events = [
    ...(leadershipResult.data ?? []).map(item => ({
      id: item.id, org_id: item.org_id, event_type: item.event_type,
      details: item.payload, created_at: item.created_at,
      source: "Leadership", reference_id: item.handover_request_id,
      delivered_at: item.delivered_at,
    })),
    ...(membershipResult.data ?? []).map(item => ({
      id: item.id, org_id: item.org_id, event_type: item.event_type,
      details: item.details, created_at: item.created_at,
      source: "Membership", reference_id: null, delivered_at: null,
    })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 150);\n  const appNotifications=appResult.data??[];
  return (
    <main className="member-app portal-app-frame"><PortalSideNav/><div className="portal-main-column"><header className="portal-main-topbar"><span>NAASCONNECT NIGERIA <i>/</i> MEMBER SPACE</span><Link href="/app">Overview</Link></header><div className="portal-dashboard directory-shell">
      <header className="directory-header">
        <Link href="/app" className="directory-back">← Member workspace</Link>
        <span className="directory-kicker">NAASCONNECT NIGERIA · UPDATES</span>
        <h1>Notifications</h1>
        <p>Membership decisions and leadership workflow updates addressed to your account, combined in one in-app activity inbox.</p>
      </header>
      {params.result&&<p className="portal-inline-success" role="status">{params.result==="read"?"Notification marked as read.":"Notification update: "+params.result}</p>}\n      {error ? (
        <div className="directory-empty" role="alert"><h3>Notifications could not be loaded</h3><p>Please refresh. If this continues, contact support.</p></div>
      ) : events.length === 0 && appNotifications.length===0 ? (
        <div className="directory-empty"><h3>You are all caught up</h3><p>No membership or leadership updates have been recorded for your account.</p></div>
      ) : (
        <div className="directory-card-grid">
          {events.map((event) => (
            <article className="directory-card" key={event.id}>
              <div className="directory-card-top"><span className="directory-org-mark">NAAS</span><span className="directory-active-label">{event.source}</span></div>
              <h3>{readable(event.event_type)}</h3>
              <p className="directory-description">An update was recorded in your {event.source.toLowerCase()} activity.</p>
              <div className="directory-meta"><span>{new Date(event.created_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</span>{event.reference_id && <span>Request {event.reference_id.slice(0, 8)}</span>}</div>
            </article>
          ))}
        </div>
      )}
      <footer className="directory-footer">This is your in-app inbox. Email and push delivery, notification preferences and scheduled event reminders are separate capabilities.</footer>
    </div></div></main>
  );
}
