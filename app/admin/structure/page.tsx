import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";
export const revalidate=0;

type StructureRow={id:string;parent_id:string|null;org_type:string;name:string;state_name:string|null;status:string;member_count:number;student_count:number;institution_count:number};

export default async function NationalStructurePage(){
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user) redirect("/login");
 const {data:membershipRows,error:membershipError}=await supabase.from("org_memberships").select("org_id,role,status").eq("user_id",user.id).eq("status","active");
 if(membershipError||!membershipRows?.some(m=>m.role==="national_admin")) redirect("/app?access=restricted");
 const {data,error}=await supabase.rpc("get_national_structure_summary");
 const rows=(data??[]) as StructureRow[];
 const national=rows.find(r=>r.org_type==="national");
 const unions=rows.filter(r=>r.org_type==="union");
 const zones=rows.filter(r=>r.org_type==="zone");
 const totalMembers=zones.reduce((sum,z)=>sum+Number(z.member_count??0),0);
 const totalStudents=zones.reduce((sum,z)=>sum+Number(z.student_count??0),0);
 const totalInstitutions=zones.reduce((sum,z)=>sum+Number(z.institution_count??0),0);
 return <main className="member-app admin-leadership-page">
  <header className="member-topbar"><Link href="/admin" className="member-brand"><span className="member-eyebrow">NAASCONNECT</span><b>National structure</b></Link><div className="member-top-actions"><span>{user.email}</span><Link href="/admin">Administration</Link></div></header>
  <div className="admin-leadership-main">
   <Link href="/admin" className="admin-return-link">← Return to National administration</Link>
   <nav className="admin-portal-switcher"><Link href="/admin/organizations">Organizations</Link><Link href="/admin/onboarding">Administrator appointments</Link><Link href="/admin/structure">National structure</Link></nav>
   <div className="admin-page-heading"><div><div className="section-kicker">NATIONAL DATA DIRECTORY</div><h1>Organizational structure</h1><p>One National organization, three Union Conferences, their Zones, and the universities and member distribution assigned to each Zone.</p></div><span className="admin-scope-chip">National administrator</span></div>
   {error?<p className="portal-inline-alert">The national structure summary could not be loaded. Confirm your National administrator assignment and refresh.</p>:<>
    <div className="admin-metrics">
     <article><div className="metric-top"><span>National organization</span></div><strong>{national?1:0}</strong><small>{national?.name??"Not available"}</small></article>
     <article><div className="metric-top"><span>Union Conferences</span></div><strong>{unions.length}</strong><small>Directly under National</small></article>
     <article><div className="metric-top"><span>Zones</span></div><strong>{zones.length}</strong><small>Grouped under their Union</small></article>
     <article><div className="metric-top"><span>Universities / campuses</span></div><strong>{totalInstitutions}</strong><small>Verified institution records currently attached to Zones</small></article>
    </div>
    <div className="admin-metrics">
     <article><div className="metric-top"><span>Classified member profiles</span></div><strong>{totalMembers}</strong><small>Profiles assigned to a Zone by state</small></article>
     <article><div className="metric-top"><span>Student profiles</span></div><strong>{totalStudents}</strong><small>Students classified by institution state</small></article>
    </div>
    <section className="portal-content-card"><div className="portal-card-heading"><span>HIERARCHY OVERVIEW</span><h2>{national?.name??"National organization"}</h2><p>Each Union contains its currently configured Zones. State coverage follows the live Zone records; university records can be populated after the verified institution list is supplied.</p></div>
     {unions.map(union=>{const children=zones.filter(z=>z.parent_id===union.id);return <section className="portal-content-card" key={union.id}>
      <div className="portal-card-heading"><span>UNION CONFERENCE · {children.length} ZONES</span><h2>{union.name}</h2><p>Parent: {national?.name??"National"} · {union.status}</p></div>
      {children.length===0?<p className="portal-empty-inline">No Zone records are currently attached to this Union.</p>:<div className="admin-executive-list">{children.map(zone=><article key={zone.id}><div><b>{zone.name}</b><small>States covered: {zone.state_name??"Not configured"}</small><small>{Number(zone.member_count??0)} classified profiles · {Number(zone.student_count??0)} students · {Number(zone.institution_count??0)} institutions</small></div><span className="status-tag">{zone.status}</span></article>)}</div>}
     </section>})}
    </section>
    <section className="portal-content-card"><div className="portal-card-heading"><span>DATA COMPLETION</span><h2>University directory onboarding</h2><p>University records are not being invented or inferred from free-text member profiles. Once the verified Nigerian university and campus list is supplied, each institution can be attached to its correct Zone and inherited Union.</p></div><p className="portal-empty-inline">Current verified institution records: {totalInstitutions}. Student profiles can already be provisionally classified by their selected institution state.</p><div className="portal-page-footer"><Link href="/admin/organizations">Manage organization records →</Link><Link href="/admin/onboarding">Invite Union and Zone administrators →</Link></div></section>
   </>}
   <footer className="portal-page-footer"><span>National hierarchy · live database summary</span><span>Counts are derived from verified records, not estimates.</span></footer>
  </div>
 </main>;
}