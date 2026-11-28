import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic="force-dynamic";
export const revalidate=0;

type StructureRow={id:string;parent_id:string|null;org_type:string;name:string;state_name:string|null;status:string;member_count:number;student_count:number;institution_count:number};
type AdminAssignment={org_id:string;role:string;org_units:{name:string;org_type:string}|{name:string;org_type:string}[]|null};
const nameOf=(v:AdminAssignment["org_units"])=>Array.isArray(v)?v[0]?.name:v?.name;

export default async function NationalStructurePage({searchParams}:{searchParams:Promise<{org?:string}>}){
 const params=await searchParams;
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user) redirect("/login");
 const {data:assignments,error:assignmentError}=await supabase.from("org_memberships")
  .select("org_id,role,org_units(name,org_type)").eq("user_id",user.id).eq("status","active");
 const authorized=((assignments??[]) as unknown as AdminAssignment[]).filter(a=>["national_admin","union_admin","zone_admin"].includes(a.role));
 if(assignmentError||!authorized.length) redirect("/app?access=restricted");
 const priority=(role:string)=>role==="national_admin"?0:role==="union_admin"?1:2;
 const defaultAssignment=[...authorized].sort((a,b)=>priority(a.role)-priority(b.role))[0];
 const rootOrgId=params.org??defaultAssignment.org_id;
 const {data,error}=await supabase.rpc("get_scoped_structure_summary",{p_org_id:rootOrgId});
 const rows=(data??[]) as StructureRow[];
 if(error||!rows.length) redirect("/app?access=restricted");
 const root=rows.find(r=>r.id===rootOrgId)??rows[0];
 const unions=root.org_type==="national"?rows.filter(r=>r.org_type==="union"):root.org_type==="union"?[root]:[];
 const zones=root.org_type==="zone"?[root]:rows.filter(r=>r.org_type==="zone");
 const campuses=rows.filter(r=>r.org_type==="campus");
 const totalMembers=zones.reduce((sum,z)=>sum+Number(z.member_count??0),0);
 const totalStudents=zones.reduce((sum,z)=>sum+Number(z.student_count??0),0);
 const totalInstitutions=zones.reduce((sum,z)=>sum+Number(z.institution_count??0),0);
 const canChooseScope=authorized.some(a=>a.role==="national_admin");
 return <main className="member-app admin-leadership-page">
  <header className="member-topbar"><Link href="/admin" className="member-brand"><span className="member-eyebrow">NAASCONNECT</span><b>Organizational structure</b></Link><div className="member-top-actions"><span>{user.email}</span><Link href="/admin">Administration</Link></div></header>
  <div className="admin-leadership-main">
   <Link href="/admin" className="admin-return-link">← Return to administration</Link>
   <nav className="admin-portal-switcher"><Link href="/admin/organizations">Organizations</Link><Link href="/admin/onboarding">Administrator appointments</Link><Link href="/admin/structure">My organizational structure</Link></nav>
   <div className="admin-page-heading"><div><div className="section-kicker">REGIONAL DATA DIRECTORY</div><h1>{root.name}</h1><p>Live organizational hierarchy, state coverage, verified institutions and regional member distribution within your authorized scope.</p></div><span className="admin-scope-chip">{root.org_type.replaceAll("_"," ")} administrator scope</span></div>
   {canChooseScope&&<section className="portal-content-card"><div className="portal-card-heading"><span>QUICK SCOPE SWITCH</span><h2>View a Union or Zone</h2><p>National administrators can open any Union or Zone within the National hierarchy.</p></div><div className="portal-page-footer">{rows.filter(r=>r.org_type==="union"||r.org_type==="zone").map(r=><Link key={r.id} href={"/admin/structure?org="+r.id}>{r.name} →</Link>)}</div></section>}
   <div className="admin-metrics">
    <article><div className="metric-top"><span>Unions in scope</span></div><strong>{unions.length}</strong><small>Under the selected National / Union scope</small></article>
    <article><div className="metric-top"><span>Zones in scope</span></div><strong>{zones.length}</strong><small>Grouped under their parent Union</small></article>
    <article><div className="metric-top"><span>Universities / campuses</span></div><strong>{totalInstitutions}</strong><small>Verified campus records attached to Zones</small></article>
    <article><div className="metric-top"><span>Classified member profiles</span></div><strong>{totalMembers}</strong><small>Profiles assigned by approved state coverage</small></article>
   </div>
   <div className="admin-metrics"><article><div className="metric-top"><span>Student profiles</span></div><strong>{totalStudents}</strong><small>Classified using institution state</small></article></div>
   {unions.map(union=>{const children=zones.filter(z=>z.parent_id===union.id);return <section className="portal-content-card" key={union.id}>
    <div className="portal-card-heading"><span>UNION CONFERENCE · {children.length} ZONES</span><h2>{union.name}</h2><p>Parent: {root.org_type==="national"?root.name:"National hierarchy"} · {union.status}</p></div>
    {children.length===0?<p className="portal-empty-inline">No Zone records are attached to this Union in the current scope.</p>:<div className="admin-executive-list">{children.map(zone=><article key={zone.id}><div><b>{zone.name}</b><small>States covered: {zone.state_name??"Not configured"}</small><small>{Number(zone.member_count??0)} classified profiles · {Number(zone.student_count??0)} students · {Number(zone.institution_count??0)} institutions</small><small><Link href={"/admin/structure?org="+zone.id}>Open Zone workspace data →</Link></small></div><span className="status-tag">{zone.status}</span></article>)}</div>}
   </section>})}
   {root.org_type==="zone"&&<section className="portal-content-card"><div className="portal-card-heading"><span>ZONE INSTITUTIONS</span><h2>Universities and campuses</h2><p>Verified campus records attached directly to this Zone.</p></div>{campuses.length===0?<p className="portal-empty-inline">No university / campus records have been loaded yet. The National administrator can populate these after the verified institution dataset is supplied.</p>:<div className="admin-executive-list">{campuses.map(c=><article key={c.id}><div><b>{c.name}</b><small>{c.state_name??"State not recorded"} · {c.status}</small></div><span className="status-tag">{c.status}</span></article>)}</div>}</section>}
   <section className="portal-content-card"><div className="portal-card-heading"><span>INSTITUTION DATA COMPLETION</span><h2>University directory onboarding</h2><p>University records will be attached to their correct Zones and inherit the parent Union. We will not invent campus records from free-text member entries.</p></div><p className="portal-empty-inline">Current verified campus records in this scope: {campuses.length||totalInstitutions}. Student profiles can already be provisionally classified by their selected institution state.</p><div className="portal-page-footer"><Link href="/admin/organizations">Manage organization records →</Link><Link href="/admin/onboarding">Invite administrators →</Link></div></section>
   <footer className="portal-page-footer"><span>Live regional structure · verified administrator scope</span><span>Member counts are based on profile classification, not guessed institution data.</span></footer>
  </div>
 </main>;
}