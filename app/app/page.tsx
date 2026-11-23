import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../auth/actions";
import { publishTextStatus, requestMembership, updateMemberProfile } from "./actions";
import MemberProfileForm from "./MemberProfileForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Membership = { id:string; org_id:string; role:string; status:string; org_units:{name:string;org_type:string}|{name:string;org_type:string}[]|null };
function roleLabel(role:string){return role.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());}
function organizationName(m:Membership){return Array.isArray(m.org_units)?m.org_units[0]?.name:m.org_units?.name;}

export default async function AuthenticatedApp(){
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user) redirect("/login");
 const [profileResult,membershipResult,statusResult,organizationResult]=await Promise.all([
  supabase.from("profiles").select("display_name,phone,member_category,state_of_admission,residential_state,preferred_region_state,institution_name,course_of_study,level_of_study,state_of_origin,profile_completed").eq("id",user.id).maybeSingle(),
  supabase.from("org_memberships").select("id,org_id,role,status,org_units(name,org_type)").eq("user_id",user.id).order("created_at",{ascending:false}),
  supabase.from("community_statuses").select("id,content,media_url,created_at,expires_at,author_org_id").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(30),
  supabase.from("org_units").select("id,name,org_type,state_name").eq("status","active").in("org_type",["campus","church"]).order("name")
 ]);
 const profile=profileResult.data;
 const rows=(membershipResult.data??[]) as unknown as Membership[];
 const active=rows.filter(m=>m.status==="active"), pending=rows.filter(m=>m.status==="pending");
 const admins=active.filter(m=>["national_admin","union_admin","zone_admin","campus_admin","church_admin"].includes(m.role));
 const meta=user.user_metadata??{};
 const memberCategory=profile?.member_category??String(meta.member_category??"");
 const category=memberCategory==="student"?"Student / ASF member":memberCategory==="non_student"?"Non-student member":"Complete your member profile";
 const displayName=profile?.display_name??String(meta.display_name??user.email?.split("@")[0]??"Member");
 const firstName=displayName.trim().split(/\s+/)[0]||"Member";
 return <main className="member-app">
  <header className="member-topbar"><Link href="/app" className="member-brand"><Image src="/brand/naas-logo.png" alt="NAAS" width={38} height={38}/><Image src="/brand/naasconnect-logo.png" alt="NAASCONNECT Nigeria" width={160} height={42}/></Link><div className="member-top-actions"><span>{user.email}</span><form action={signOut}><button type="submit">Sign out</button></form></div></header>
  <div className="member-app-body"><aside className="member-sidebar"><div className="member-side-title">YOUR SPACE</div><a className="member-nav active" href="#overview">Overview</a><a className="member-nav" href="#statuses">Global Status</a><a className="member-nav" href="#membership">My Membership</a><a className="member-nav" href="#profile">Edit profile</a><a className="member-nav" href="#resources">Bible & Lesson Study</a>{admins.length>0&&<><div className="member-side-title admin-side-title">ADMINISTRATION</div><Link className="member-nav" href="/admin">Administrator workspace</Link></>}</aside>
  <section className="member-main" id="overview">
   <div className="member-welcome"><div><span className="member-eyebrow">NAASCONNECT NIGERIA · MEMBER SPACE</span><h1>Welcome, {firstName}</h1><p>Your community, fellowship and spiritual resources in one place.</p></div><span className="member-category">{category}</span></div>
   {profileResult.error&&<div className="member-alert"><b>We could not load your profile.</b><p>Please refresh. If the problem continues, contact support.</p></div>}
   <div className="member-stats"><article><span>Active memberships</span><b>{active.length}</b></article><article><span>Pending requests</span><b>{pending.length}</b></article><article><span>Active global statuses</span><b>{statusResult.error?"—":(statusResult.data??[]).length}</b></article></div>
   <section className="member-panel" id="membership"><div className="member-panel-head"><div><span className="member-eyebrow">YOUR ORGANIZATIONS</span><h2>Memberships & affiliations</h2></div></div>
   {membershipResult.error?<p className="member-empty">Membership information is temporarily unavailable. Your account remains signed in; please refresh shortly.</p>:rows.length===0?<div className="member-empty"><b>Your account is created. Organization membership is a separate step.</b><p>A campus/ASF or participating church affiliation must be submitted and approved by the responsible administrator. Your account does not grant an organization role automatically.</p><span className="member-pending-note">No membership request is recorded yet.</span></div>:<div className="member-list">{rows.map(m=><article key={m.id}><div><b>{organizationName(m)??"Organization"}</b><small>{roleLabel(m.role)} · {m.org_id.slice(0,8)}</small></div><span className={"member-status "+m.status}>{roleLabel(m.status)}</span></article>)}</div>}
   <div className="member-membership-request"><b>Request an organization membership</b><p>{memberCategory==="student"?"Choose your verified campus / Adventist Students Fellowship.":"Choose a participating local church."} Requests remain pending until an authorized administrator reviews them.</p>{(organizationResult.data??[]).filter((org:any)=>memberCategory==="student"?org.org_type==="campus":memberCategory==="non_student"?org.org_type==="church":false).filter((org:any)=>!rows.some(m=>m.org_id===org.id)).map((org:any)=><form action={requestMembership} key={org.id}><input type="hidden" name="org_id" value={org.id}/><span><b>{org.name}</b><small>{org.org_type==="campus"?"Campus / ASF":"Local church"}{org.state_name?" · "+org.state_name:""}</small></span><button type="submit">Request membership</button></form>)}{organizationResult.error?<small>Organization list is temporarily unavailable.</small>:(organizationResult.data??[]).filter((org:any)=>memberCategory==="student"?org.org_type==="campus":memberCategory==="non_student"?org.org_type==="church":false).length===0?<small>No verified active {memberCategory==="student"?"campus / ASF":"local church"} records are currently available in the live directory. Your registration remains saved; the directory must be populated and verified by authorized NAAS administrators before membership requests can be submitted.</small>:null}</div>
   <div className="member-profile-summary"><b>Registration information</b><span>{profile?.institution_name??(typeof meta.institution_name==="string"?meta.institution_name:"Institution not supplied")}</span><span>{memberCategory==="student"?(profile?.state_of_admission?"State of admission: "+profile.state_of_admission:"Admission state not supplied"):memberCategory==="non_student"?(profile?.residential_state?"Residence: "+profile.residential_state:"Residence not supplied")+" · "+(profile?.preferred_region_state?"Preferred church region: "+profile.preferred_region_state:"Preferred church region not supplied"):"Membership category not selected"}</span><span>{profile?.course_of_study??"Course not supplied"}{profile?.level_of_study?" · "+profile.level_of_study:""}</span></div></section>
   <section className="member-panel" id="profile"><div className="member-panel-head"><div><span className="member-eyebrow">ACCOUNT DETAILS</span><h2>Edit your profile</h2><p>Update the personal details attached to your NAASCONNECT account.</p></div></div><MemberProfileForm action={updateMemberProfile} profile={profile} displayName={displayName} metadata={meta as Record<string, unknown>}/></section>
   <section className="member-panel" id="statuses"><div className="member-panel-head"><div><span className="member-eyebrow">COMMUNITY · GLOBAL</span><h2>Global Status</h2><p>Active status updates shared with authenticated NAASCONNECT members.</p></div></div>
   {active.length>0?<form action={publishTextStatus} className="member-status-composer"><label htmlFor="status-content">Share a status with the NAASCONNECT community</label><textarea id="status-content" name="content" maxLength={2000} minLength={1} required placeholder="What would you like to share?"/><div><small>Visible to authenticated members · Expires after 24 hours</small><button type="submit">Publish status</button></div></form>:<p className="member-empty">Status publishing unlocks after an organization administrator approves at least one membership. All active statuses remain globally visible to authenticated members.</p>}
   {statusResult.error?<p className="member-empty">Global Status is temporarily unavailable. Please refresh in a moment.</p>:(statusResult.data??[]).length===0?<p className="member-empty">No active status updates yet. Status publishing is available to members with an approved active membership.</p>:<div className="member-status-feed">{statusResult.data!.map(s=><article key={s.id}><p>{s.content}</p><small>{new Date(s.created_at).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"})} · Expires {new Date(s.expires_at).toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"})}</small></article>)}</div>}</section>
   <section className="member-panel" id="resources"><div className="member-panel-head"><div><span className="member-eyebrow">GROW IN FAITH</span><h2>Bible & Lesson Study</h2><p>Study resources supplied for the NAASCONNECT community.</p></div></div><div className="member-resource-links"><a href="/kjv.pdf" target="_blank" rel="noreferrer">Open KJV Bible PDF</a><a href="/Lesson%20Study%20Guide-%204th%20Quarter_2026.pdf" target="_blank" rel="noreferrer">Open 4th Quarter 2026 Lesson Study Guide</a></div></section>
   {admins.length>0&&<div className="member-admin-note">Your account has {admins.length} active scoped administrator assignment(s). Every protected action is checked again by Supabase authorization.</div>}
  </section></div></main>;
}
