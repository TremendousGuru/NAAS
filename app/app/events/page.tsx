import Link from "next/link";
import PortalSideNav from "../PortalSideNav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCommunityEvent, registerForCommunityEvent, reviewCommunityEvent } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type EventRow = {
  id:string; created_by:string; organizer_org_id:string|null; audience_org_id:string|null;
  title:string; description:string; event_mode:string; starts_at:string; ends_at:string;
  timezone:string; venue:string|null; meeting_url:string|null; registration_deadline:string|null;
  capacity:number|null; requires_registration:boolean; cover_media_path:string|null;
  status:string; review_note:string|null;
};
const readable=(value:string)=>value.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());
const dateTime=(value:string)=>new Date(value).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"});

export default async function EventsPage({searchParams}:{searchParams:Promise<{result?:string}>}) {
  const params=await searchParams;
  const supabase=await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user) redirect("/login");
  const [membershipResult,eventResult,registrationResult,orgResult]=await Promise.all([
    supabase.from("org_memberships").select("id,org_id,role,status,org_units(name,org_type)").eq("user_id",user.id).eq("status","active"),
    supabase.from("community_events").select("id,created_by,organizer_org_id,audience_org_id,title,description,event_mode,starts_at,ends_at,timezone,venue,meeting_url,registration_deadline,capacity,requires_registration,cover_media_path,status,review_note").order("starts_at",{ascending:true}).limit(100),
    supabase.from("event_registrations").select("event_id,status").eq("user_id",user.id),
    supabase.from("org_units").select("id,name,org_type").eq("status","active").order("name").limit(500),
  ]);
  const memberships=membershipResult.data??[];
  const activeMember=memberships.length>0;
  const admins=memberships.filter(m=>["national_admin","union_admin","zone_admin","campus_admin","church_admin"].includes(m.role));
  const events=(eventResult.data??[]) as EventRow[];
  const registrations=new Map((registrationResult.data??[]).map(r=>[r.event_id,r.status]));
  const organizations=new Map((orgResult.data??[]).map(o=>[o.id,o.name]));
  const visibleEvents=await Promise.all(events.map(async event=>{
    if(!event.cover_media_path) return {...event,cover_url:null as string|null};
    const {data}=await supabase.storage.from("community-media").createSignedUrl(event.cover_media_path,3600);
    return {...event,cover_url:data?.signedUrl??null};
  }));
  const upcoming=visibleEvents.filter(e=>e.status==="published"&&new Date(e.ends_at)>=new Date());
  const ownPending=visibleEvents.filter(e=>e.created_by===user.id&&["pending","rejected"].includes(e.status));
  const moderation=visibleEvents.filter(e=>e.status==="pending"&&e.created_by!==user.id&&admins.length>0);
  const resultMessages:Record<string,string>={
    submitted:"Your event has been submitted. It will appear in the public calendar after the appropriate administrator approves it.",
    registered:"Your registration is confirmed.",invalid:"Check the event title, description and dates.",
    "venue-required":"Add a venue for an in-person or hybrid event.",
    "meeting-link-required":"Provide a valid HTTPS meeting link for an online or hybrid event.",
    "membership-required":"An active NAAS membership is required to create an event or register.",
    "not-authorized":"You are not authorized to publish on behalf of that organization.",
    "cover-invalid":"Choose a JPG, PNG or WebP cover image up to 3 MB.",
    "cover-upload-failed":"The cover image could not be uploaded.",
    "not-created":"The event could not be created. Check the details and try again.",
    "registration-failed":"Registration could not be completed. You may already be registered, the deadline may have passed, or capacity may be full.",
    reviewed:"The event review decision has been saved.",
    "review-invalid":"A valid event decision and a reason for rejection/cancellation are required.",
    "review-failed":"The event could not be reviewed within your current authority.",
  };
  return <main className="member-app portal-app-frame"><PortalSideNav/><div className="portal-main-column">
    <header className="portal-main-topbar"><span>NAASCONNECT NIGERIA <i>/</i> MEMBER SPACE</span><Link href="/app">Overview</Link></header>
    <div className="portal-dashboard directory-shell">
      <header className="directory-header"><Link href="/app" className="directory-back">← Member workspace</Link><span className="directory-kicker">NAASCONNECT NIGERIA · COMMUNITY CALENDAR</span><h1>Events</h1><p>Discover programmes, campus gatherings, worship experiences, conferences and community activities across NAASCONNECT.</p><Link href="/app/community" className="directory-back">Community feed →</Link></header>
      {params.result&&<p className={["invalid","venue-required","meeting-link-required","membership-required","not-authorized","cover-invalid","cover-upload-failed","not-created","registration-failed","review-invalid","review-failed"].includes(params.result)?"portal-inline-alert":"portal-inline-success"} role="status">{resultMessages[params.result]??"Event update: "+params.result.replaceAll("-"," ")}</p>}
      {activeMember&&<section className="portal-content-card community-composer-card">
        <div className="portal-card-heading"><span>MEMBER EVENT CREATION</span><h2>Create an event</h2><p>Every active member can submit an event. New events enter the appropriate review queue before appearing in the public calendar.</p></div>
        <form action={createCommunityEvent} className="member-status-composer">
          <label>Event title<input name="title" required minLength={4} maxLength={180} placeholder="Give your event a clear title"/></label>
          <label>Description<textarea name="description" required minLength={10} maxLength={8000} rows={5} placeholder="What is happening, who should attend and what should participants know?"/></label>
          <label>Event format<select name="event_mode" defaultValue="in_person"><option value="in_person">In person</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></label>
          <label>Start date and time<input type="datetime-local" name="starts_at" required/></label>
          <label>End date and time<input type="datetime-local" name="ends_at" required/></label>
          <label>Venue / location<input name="venue" maxLength={240} placeholder="Campus, church, hall or city"/></label>
          <label>Online meeting URL<input name="meeting_url" type="url" placeholder="https://..."/></label>
          <label>Registration deadline (optional)<input name="registration_deadline" type="datetime-local"/></label>
          <label>Maximum attendees (optional)<input name="capacity" type="number" min={1} max={100000} placeholder="Leave blank for no limit"/></label>
          <label>Event cover image (optional)<input type="file" name="cover" accept="image/jpeg,image/png,image/webp"/></label>
          <label className="member-inline-check"><input type="checkbox" name="requires_registration" defaultChecked/> Registration required</label>
          {admins.length>0&&<label>Publish on behalf of<select name="organizer_org_id" defaultValue=""><option value="">My personal member account</option>{admins.map(m=><option key={m.id} value={m.org_id}>{organizations.get(m.org_id)??"Authorized organization"} · announcement</option>)}</select></label>}
          <div><small>All submissions are reviewed before public listing. Uploads use the private NAASCONNECT community media store.</small><button type="submit">Submit event for review</button></div>
        </form>
      </section>}
      {admins.length>0&&<section className="portal-content-card">
        <div className="portal-card-heading"><span>ORGANIZER TOOLS</span><h2>Events awaiting review <small>{moderation.length}</small></h2><p>Review is limited to your National or assigned organizational authority.</p></div>
        {moderation.length===0?<p className="portal-empty-inline">No event submissions are awaiting review in your scope.</p>:<div className="directory-card-grid">{moderation.map(event=><article className="directory-card" key={event.id}>
          <span className="directory-active-label">Pending review</span><h3>{event.title}</h3><p className="directory-description">{event.description}</p><div className="directory-meta"><span>{dateTime(event.starts_at)}</span><span>{event.organizer_org_id?organizations.get(event.organizer_org_id):"Member-submitted event"}</span></div>
          <form action={reviewCommunityEvent} className="member-status-composer"><input type="hidden" name="event_id" value={event.id}/><label>Review note (required for rejection/cancellation)<textarea name="review_note" minLength={10} maxLength={1000}/></label><div><button name="decision" value="published" type="submit">Approve and publish</button><button name="decision" value="rejected" type="submit">Reject</button></div></form>
        </article>)}</div>}
      </section>}
      {ownPending.length>0&&<section className="portal-content-card"><div className="portal-card-heading"><span>YOUR SUBMISSIONS</span><h2>Events under review</h2></div><div className="directory-card-grid">{ownPending.map(event=><article className="directory-card" key={event.id}><span className="directory-active-label">{readable(event.status)}</span><h3>{event.title}</h3><p className="directory-description">{event.description}</p>{event.review_note&&<p className="directory-meta">Review note: {event.review_note}</p>}<div className="directory-meta"><span>{dateTime(event.starts_at)}</span></div></article>)}</div></section>}
      <section className="portal-content-card">
        <div className="portal-card-heading"><span>EVENTS DIRECTORY</span><h2>Upcoming events <small>{upcoming.length}</small></h2><p>Published events available to your active NAASCONNECT membership.</p></div>
        {eventResult.error?<p className="portal-inline-alert">The events directory could not be loaded. Refresh and try again.</p>:upcoming.length===0?<div className="directory-empty"><h3>No upcoming events yet</h3><p>Approved events will appear here. You can submit the first one using the form above.</p></div>:<div className="directory-card-grid">{upcoming.map(event=>{
          const registration=registrations.get(event.id);
          return <article className="directory-card" key={event.id}>
            <div className="directory-card-top"><span className="directory-org-mark">NAAS</span><span className="directory-active-label">{readable(event.event_mode)}</span></div>
            {event.cover_url&&<img src={event.cover_url} alt="" loading="lazy" style={{width:"100%",maxHeight:240,objectFit:"cover",borderRadius:12}}/>}
            <h3>{event.title}</h3><p className="directory-description" style={{whiteSpace:"pre-wrap"}}>{event.description}</p>
            <div className="directory-meta"><span>Starts {dateTime(event.starts_at)}</span><span>Ends {dateTime(event.ends_at)}</span></div>
            {event.venue&&<p className="directory-meta">Venue: {event.venue}</p>}
            {event.meeting_url&&<p><a href={event.meeting_url} target="_blank" rel="noreferrer">Open meeting link</a></p>}
            {event.capacity&&<p className="directory-meta">Capacity: {event.capacity}</p>}
            {event.registration_deadline&&<p className="directory-meta">Register by {dateTime(event.registration_deadline)}</p>}
            <div className="directory-meta"><span>{event.organizer_org_id?organizations.get(event.organizer_org_id):"NAASCONNECT member"}</span>{event.requires_registration&&<span>{registration==="registered"?"Registered": "Registration required"}</span>}</div>
            {event.requires_registration&&registration!=="registered"&&activeMember&&<form action={registerForCommunityEvent}><input type="hidden" name="event_id" value={event.id}/><button type="submit">Register for event</button></form>}
            {registration==="registered"&&<span className="status-tag">You are registered</span>}
          </article>;
        })}</div>}
      </section>
      <footer className="directory-footer">Event submissions are reviewed before publication. Registration capacity and deadlines are enforced by the database. Event updates appear in your in-app notifications.</footer>
    </div>
  </div></main>;
}