import Link from "next/link";
import PortalSideNav from "../../PortalSideNav";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requestDirectoryMembership } from "../actions";

type Organization = {
  id: string; name: string; org_type: string; status: string;
  state_name: string | null; conference_name: string | null; institution_name: string | null;
  description: string | null; contact_email: string | null; whatsapp_url: string | null; website_url: string | null;
};

function safeWebUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function OrganizationDetails({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data: organization, error: organizationError } = await supabase.from("org_units")
    .select("id,name,org_type,status,state_name,conference_name,institution_name,description,contact_email,whatsapp_url,website_url")
    .eq("id", id)
    .eq("status", "active")
    .in("org_type", ["campus", "church"])
    .maybeSingle();

  if (organizationError || !organization) notFound();
  const org = organization as Organization;

  const [profileResult, membershipResult] = await Promise.all([
    supabase.from("profiles").select("member_category,institution_name,state_of_admission,preferred_region_state").eq("id", user.id).maybeSingle(),
    supabase.from("org_memberships").select("status,role").eq("user_id", user.id).eq("org_id", org.id).maybeSingle()
  ]);

  const category = profileResult.data?.member_category;
  const correctCategory = org.org_type === "campus" ? category === "student" : category === "non_student";
  const currentStatus = membershipResult.data?.status ?? null;
  const membershipCheckFailed = Boolean(membershipResult.error);
  const normalized = (value: string | null | undefined) => (value ?? "").trim().toLocaleLowerCase();
  const organizationDetailsReady = org.org_type === "campus"
    ? Boolean(org.institution_name?.trim() && org.state_name?.trim())
    : Boolean(org.state_name?.trim());
  const eligibilityMatches = org.org_type === "campus"
    ? normalized(profileResult.data?.institution_name) === normalized(org.institution_name)
      && normalized(profileResult.data?.state_of_admission) === normalized(org.state_name)
    : normalized(profileResult.data?.preferred_region_state) === normalized(org.state_name);
  const canSubmit = correctCategory && organizationDetailsReady && eligibilityMatches
    && !membershipCheckFailed && (!currentStatus || currentStatus === "rejected");
  const website = safeWebUrl(org.website_url);
  const whatsapp = safeWebUrl(org.whatsapp_url);
  const requestState = typeof query.request === "string" ? query.request : "";

  return (
    <main className="member-app portal-app-frame"><PortalSideNav/><div className="portal-main-column"><header className="portal-main-topbar"><span>NAASCONNECT NIGERIA <i>/</i> MEMBER SPACE</span><Link href="/app">Overview</Link></header><div className="portal-dashboard directory-shell">
      <header className="directory-header directory-detail-header">
        <Link href={`/app/directory?type=${org.org_type}`} className="directory-back">← Back to {org.org_type === "campus" ? "ASF directory" : "church directory"}</Link>
        <span className="directory-kicker">ORGANIZATION PROFILE · ACTIVE LISTING</span>
        <div className="directory-detail-title-row">
          <span className="directory-org-mark directory-org-mark-large">{org.org_type === "campus" ? "ASF" : "SDA"}</span>
          <div><h1>{org.name}</h1><p>{org.org_type === "campus" ? "Adventist Students Fellowship" : "Seventh-day Adventist church"}</p></div>
        </div>
      </header>

      {requestState === "submitted" && <div className="directory-feedback success" role="status">Your membership request has been submitted and is awaiting review by an authorized administrator.</div>}
      {requestState === "not-submitted" && <div className="directory-feedback error" role="alert">The request could not be submitted. Check your profile details and current membership status, then try again or contact support.</div>}

      <div className="directory-detail-grid">
        <section className="directory-detail-card">
          <span className="directory-kicker">ABOUT THIS ORGANIZATION</span>
          <h2>Organization information</h2>
          <p className="directory-detail-description">{org.description || "Additional organization information has not yet been supplied."}</p>
          <dl className="directory-detail-facts">
            {org.institution_name && <div><dt>Institution</dt><dd>{org.institution_name}</dd></div>}
            {org.state_name && <div><dt>State</dt><dd>{org.state_name}</dd></div>}
            {org.conference_name && <div><dt>Conference / region</dt><dd>{org.conference_name}</dd></div>}
            <div><dt>Listing status</dt><dd><span className="directory-active-label"><i/> Active</span></dd></div>
          </dl>
        </section>

        <aside className="directory-action-card">
          <span className="directory-kicker">NEXT STEP</span>
          <h2>{org.org_type === "campus" ? "Connect with this fellowship" : "Connect with this church"}</h2>
          {membershipCheckFailed ? (
            <p>We could not confirm your current membership status. Refresh this page before submitting a request.</p>
          ) : currentStatus && currentStatus !== "rejected" ? (
            <div className="directory-current-membership"><b>{currentStatus.replaceAll("_", " ")}</b><p>{currentStatus === "pending" ? "Your request is awaiting an administrator's decision." : currentStatus === "active" ? "You already have an active membership here." : "Your current membership record must be reviewed by an administrator before another request can be made."}</p></div>
          ) : !profileResult.data ? (
            <p>Complete your member profile before requesting an organization membership.</p>
          ) : !correctCategory ? (
            <p>{org.org_type === "campus" ? "Campus / ASF membership requests are available to student members." : "Church membership requests are available to non-student members."} Your profile category does not currently match this directory.</p>
          ) : !organizationDetailsReady ? (
            <p>This active listing is missing the institution or state information required for a safe eligibility check. An authorized administrator must complete the organization record before membership requests can be submitted.</p>
          ) : !eligibilityMatches ? (
            <p>{org.org_type === "campus"
              ? "Your saved institution and state of admission do not match this fellowship's listing. Choose a matching fellowship or correct your profile if its details are inaccurate."
              : "This church is outside your saved preferred church region. Choose a church in that region or correct your profile if the saved preference is inaccurate."}</p>
          ) : canSubmit ? (
            <>
              <p>{org.org_type === "campus"
                ? "Your institution and state of admission match this fellowship."
                : "This church matches your preferred church region. Your residential state remains separate."}</p>
              <form action={requestDirectoryMembership}>
                <input type="hidden" name="org_id" value={org.id}/>
                <button type="submit" className="directory-request-button">{currentStatus === "rejected" ? "Resubmit membership request" : "Request membership"} <span>→</span></button>
              </form>
              <small>Submitting a request does not automatically grant membership or an administrative role.</small>
            </>
          ) : null}
          <div className="directory-contact-list">
            {org.contact_email && <a href={`mailto:${org.contact_email}`}>Email organization</a>}
            {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp contact ↗</a>}
            {website && <a href={website} target="_blank" rel="noreferrer">Visit website ↗</a>}
            {!org.contact_email && !whatsapp && !website && <span>Contact information has not been published for this listing.</span>}
          </div>
        </aside>
      </div>
      <footer className="directory-footer">NAASCONNECT Nigeria · Membership eligibility is verified by the existing secure membership workflow.</footer>
    </div></div></main>
  );
}
