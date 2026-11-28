import Link from "next/link";
import PortalSideNav from "../PortalSideNav";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const NIGERIAN_STATES = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

type DirectoryOrganization = {
  id: string;
  name: string;
  org_type: string;
  state_name: string | null;
  conference_name: string | null;
  institution_name: string | null;
  description: string | null;
};

export default async function OrganizationDirectory({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const type = params.type === "church" ? "church" : "campus";
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const state = typeof params.state === "string" ? params.state.trim() : "";
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const [organizationsResult, profileResult] = await Promise.all([
    supabase.from("org_units")
      .select("id,name,org_type,state_name,conference_name,institution_name,description")
      .eq("status", "active")
      .eq("org_type", type)
      .order("name", { ascending: true })
      .limit(250),
    supabase.from("profiles")
      .select("member_category,state_of_admission,preferred_region_state,institution_name,profile_completed")
      .eq("id", user.id)
      .maybeSingle()
  ]);

  const allOrganizations = (organizationsResult.data ?? []) as DirectoryOrganization[];
  const normalizedQuery = query.toLocaleLowerCase();
  const normalizedState = state.toLocaleLowerCase();
  const organizations = allOrganizations.filter((organization) => {
    const searchable = [organization.name, organization.institution_name, organization.state_name, organization.conference_name, organization.description]
      .filter(Boolean).join(" ").toLocaleLowerCase();
    const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
    const matchesState = !normalizedState || (organization.state_name ?? "").toLocaleLowerCase().includes(normalizedState);
    return matchesQuery && matchesState;
  });

  const isStudent = profileResult.data?.member_category === "student";
  const isNonStudent = profileResult.data?.member_category === "non_student";
  const canRequestThisType = !profileResult.error && profileResult.data?.profile_completed === true && (type === "campus" ? isStudent : isNonStudent);

  return (
    <main className="member-app portal-app-frame"><PortalSideNav/><div className="portal-main-column"><header className="portal-main-topbar"><span>NAASCONNECT NIGERIA <i>/</i> MEMBER SPACE</span><Link href="/app">Overview</Link></header><div className="portal-dashboard directory-shell">
      <header className="directory-header">
        <Link href="/app" className="directory-back">← Member workspace</Link>
        <span className="directory-kicker">NAASCONNECT NIGERIA · DISCOVERY</span>
        <h1>Find your community</h1>
        <p>Discover active Adventist Students Fellowships and Seventh-day Adventist churches. Only active organization records are shown.</p>
      </header>

      <nav className="directory-tabs" aria-label="Organization directories">
        <Link href="/app/directory?type=campus" aria-current={type === "campus" ? "page" : undefined} className={type === "campus" ? "selected" : ""}>Campus / ASF directory</Link>
        <Link href="/app/directory?type=church" aria-current={type === "church" ? "page" : undefined} className={type === "church" ? "selected" : ""}>Church directory</Link>
      </nav>

      <section className="directory-search-panel" aria-label="Search directory">
        <form method="get" action="/app/directory" className="directory-search-form">
          <input type="hidden" name="type" value={type}/>
          <label className="directory-query-field">
            <span>Search by name, institution or conference</span>
            <input name="q" type="search" maxLength={100} defaultValue={query} placeholder={type === "campus" ? "e.g. University or fellowship name" : "e.g. church name"}/>
          </label>
          <label className="directory-state-field">
            <span>State</span>
            <select name="state" defaultValue={state}>
              <option value="">All states</option>
              {NIGERIAN_STATES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button type="submit">Search directory</button>
          {(query || state) && <Link className="directory-clear" href={`/app/directory?type=${type}`}>Clear filters</Link>}
        </form>
      </section>

      <div className="directory-results-head">
        <div>
          <span className="directory-kicker">{type === "campus" ? "ADVENTIST STUDENTS FELLOWSHIPS" : "SEVENTH-DAY ADVENTIST CHURCHES"}</span>
          <h2>{type === "campus" ? "Campus fellowships" : "Churches"} <span>{organizations.length}</span></h2>
        </div>
        <p>{canRequestThisType ? "Your completed profile is eligible to request membership from a matching organization." : type === "campus" ? "Complete a student profile to request campus membership." : "Complete a non-student profile to request church membership."}</p>
      </div>

      {organizationsResult.error ? (
        <div className="directory-empty" role="alert">
          <div className="directory-empty-icon">!</div>
          <h3>We could not load the directory</h3>
          <p>Please refresh the page. If the issue continues, contact the NAASCONNECT support team.</p>
        </div>
      ) : organizations.length === 0 ? (
        <div className="directory-empty">
          <div className="directory-empty-icon">⌕</div>
          <h3>{allOrganizations.length === 0 ? "No active listings yet" : "No matching organizations"}</h3>
          <p>{allOrganizations.length === 0
            ? `There are currently no active ${type === "campus" ? "campus / ASF" : "church"} records in the directory. Organization records must be added and activated by authorized administrators before they become discoverable. No sample or unverified listings are being displayed.`
            : "Try a different name or clear the selected state filter to see more results."}</p>
          {(query || state) && <Link href={`/app/directory?type=${type}`}>Clear search and filters</Link>}
        </div>
      ) : (
        <div className="directory-card-grid">
          {organizations.map((organization) => (
            <article className="directory-card" key={organization.id}>
              <div className="directory-card-top">
                <span className="directory-org-mark">{type === "campus" ? "ASF" : "SDA"}</span>
                <span className="directory-active-label"><i/> Active listing</span>
              </div>
              <h3>{organization.name}</h3>
              {organization.institution_name && <p className="directory-institution">{organization.institution_name}</p>}
              <div className="directory-meta">
                {organization.state_name && <span>⌖ {organization.state_name}</span>}
                {organization.conference_name && <span>{organization.conference_name}</span>}
              </div>
              <p className="directory-description">{organization.description || "Organization details will be updated by an authorized administrator."}</p>
              <Link className="directory-card-link" href={`/app/directory/${organization.id}`}>View organization <span>→</span></Link>
            </article>
          ))}
        </div>
      )}
      <footer className="directory-footer">NAASCONNECT Nigeria · Organization information is displayed according to its current approval and visibility status.</footer>
    </div></div></main>
  );
}
