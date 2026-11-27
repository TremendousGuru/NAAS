import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../auth/actions";
import { publishTextStatus, publishCommunityStatus, requestMembership, requestMembershipTransfer, cancelMembershipTransfer } from "./actions";
import MemberProfileForm from "./MemberProfileForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Membership = { id:string; org_id:string; role:string; status:string; org_units:{name:string;org_type:string}|{name:string;org_type:string}[]|null };
type MembershipEvent = { id:string; org_id:string; event_type:string; created_at:string; org_units:{name:string}|{name:string}[]|null };
type MembershipTransfer = { id:string; source_membership_id:string; source_org_id:string; destination_org_id:string; reason:string|null; status:string; created_at:string };
function roleLabel(role:string){return role.replaceAll("_"," ").replace(/\b\w/g,c=>c.toUpperCase());}
function organizationName(m:Membership){return Array.isArray(m.org_units)?m.org_units[0]?.name:m.org_units?.name;}
function eventOrganizationName(e:MembershipEvent){return Array.isArray(e.org_units)?e.org_units[0]?.name:e.org_units?.name;}
function eventLabel(value:string){return value.split("_").map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join(" ");}

export default async function AuthenticatedApp({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const supabase=await createClient();
 const {data:{user},error:authError}=await supabase.auth.getUser();
 if(authError||!user) redirect("/login");

 async function saveMemberProfile(formData:FormData){
  "use server";
  const displayName=String(formData.get("display_name")??"").trim().slice(0,120);
  const phone=String(formData.get("phone")??"").trim().slice(0,32);
  const category=String(formData.get("member_category")??"").trim();
  const institution=String(formData.get("institution_name")??"").trim().slice(0,180);
  const course=String(formData.get("course_of_study")??"").trim().slice(0,120);
  const level=String(formData.get("level_of_study")??"").trim().slice(0,80);
  const stateOfOrigin=String(formData.get("state_of_origin")??"").trim().slice(0,80);
  const stateOfAdmission=String(formData.get("state_of_admission")??"").trim();
  const residentialState=String(formData.get("residential_state")??"").trim();
  const preferredRegionState=String(formData.get("preferred_region_state")??"").trim();
  const states=["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];
  if(displayName.length<2||!["student","non_student"].includes(category)) redirect("/app?profile=invalid#profile");
  if((category==="student"&&(!institution||!states.includes(stateOfAdmission)))||(category==="non_student"&&(!states.includes(residentialState)||!states.includes(preferredRegionState)))) redirect("/app?profile=region-required#profile");
  const client=await createClient();
  const {data:{user:currentUser},error:auth}=await client.auth.getUser();
  if(auth||!currentUser) redirect("/login");
  const {error:profileError}=await client.from("profiles").upsert({
   id:currentUser.id,display_name:displayName,phone:phone||null,member_category:category,profile_completed:true,
   institution_name:category==="student"?institution:null,
   course_of_study:category==="student"?(course||null):null,
   level_of_study:category==="student"?(level||null):null,
   state_of_origin:stateOfOrigin||null,
   state_of_admission:category==="student"?stateOfAdmission:null,
   residential_state:category==="non_student"?residentialState:null,
   preferred_region_state:category==="non_student"?preferredRegionState:null
  },{onConflict:"id"});
  if(profileError) redirect("/app?profile=not-saved#profile");
  revalidatePath("/app");
  redirect("/app?profile=saved#profile");
 }

 async function changeAccountEmail(formData:FormData){
  "use server";
  const email=String(formData.get("email")??"").trim().toLowerCase().slice(0,254);
  if(!email.includes("@")||!email.split("@")[1]?.includes(".")||email.includes(" ")) redirect("/app?security=invalid-email#security");
  const client=await createClient();
  const {data:{user:currentUser},error:auth}=await client.auth.getUser();
  if(auth||!currentUser) redirect("/login");
  if(email===currentUser.email?.toLowerCase()) redirect("/app?security=same-email#security");
  const {error}=await client.auth.updateUser({email});
  if(error) redirect("/app?security=email-failed#security");
  redirect("/app?security=email-pending#security");
 }

 async function changeAccountPassword(formData:FormData){
  "use server";
  const password=String(formData.get("password")??"");
  const confirmation=String(formData.get("password_confirmation")??"");
  if(password.length<10||password!==confirmation) redirect("/app?security=password-invalid#security");
  const client=await createClient();
  const {data:{user:currentUser},error:auth}=await client.auth.getUser();
  if(auth||!currentUser) redirect("/login");
  const {error}=await client.auth.updateUser({password});
  if(error) redirect("/app?security=password-failed#security");
  redirect("/app?security=password-updated#security");
 }

 const [profileResult,membershipResult,statusResult,organizationResult,historyResult,transferResult]=await Promise.all([
  supabase.from("profiles").select("display_name,phone,member_category,institution_name,course_of_study,level_of_study,state_of_admission,residential_state,preferred_region_state,state_of_origin,profile_completed").eq("id",user.id).maybeSingle(),
  supabase.from("org_memberships").select("id,org_id,role,status,org_units(name,org_type)").eq("user_id",user.id).order("created_at",{ascending:false}),
  supabase.from("community_statuses").select("id,content,media_url,created_at,expires_at,author_org_id").gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(30),
  supabase.from("org_units").select("id,name,org_type,state_name").eq("status","active").in("org_type",["campus","church"]).order("name"),
  supabase.from("membership_events").select("id,org_id,event_type,created_at,org_units(name)").eq("user_id",user.id).order("created_at",{ascending:false}).limit(25),
  supabase.from("membership_transfer_requests").select("id,source_membership_id,source_org_id,destination_org_id,reason,status,created_at").eq("user_id",user.id).order("created_at",{ascending:false}).limit(20)
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
  <div className="member-app-body"><aside className="member-sidebar"><div className="member-side-title">YOUR SPACE</div><a className="member-nav active" href="#overview">Overview</a><Link className="member-nav" href="/app/community">Global Status</Link><Link className="member-nav" href="/app/notifications">Notifications</Link><div className="member-side-title">DISCOVER</div><Link className="member-nav" href="/app/directory?type=campus">Find an ASF</Link><Link className="member-nav" href="/app/directory?type=church">Find a church</Link><a className="member-nav" href="#membership">My Membership</a><a className="member-nav" href="#history">History</a><a className="member-nav" href="#profile">Edit profile</a><a className="member-nav" href="#security">Account settings</a><a className="member-nav" href="#resources">Bible & Lesson Study</a>{admins.length>0&&<><div className="member-side-title admin-side-title">ADMINISTRATION</div><Link className="member-nav" href="/admin">Administrator workspace</Link></>}</aside>
  <section className="member-main" id="overview">
   <div className="member-welcome"><div><span className="member-eyebrow">NAASCONNECT NIGERIA · MEMBER SPACE</span><h1>Welcome, {firstName}</h1><p>Your community, fellowship and spiritual resources in one place.</p></div><span className="member-category">{category}</span></div>
   {profileResult.error&&<div className="member-alert"><b>We could not load your profile.</b><p>Please refresh. If the problem continues, contact support.</p></div>}
   <div className="member-stats"><article><span>Active memberships</span><b>{active.length}</b></article><article><span>Pending requests</span><b>{pending.length}</b></article><article><span>Active global statuses</span><b>{statusResult.error?"—":(statusResult.data??[]).length}</b></article></div>
   <section className="member-panel" id="membership"><div className="member-panel-head"><div><span className="member-eyebrow">YOUR ORGANIZATIONS</span><h2>Memberships & affiliations</h2></div></div>
   {membershipResult.error?<p className="member-empty">Membership information is temporarily unavailable. Your account remains signed in; please refresh shortly.</p>:rows.length===0?<div className="member-empty"><b>Your account is created. Organization membership is a separate step.</b><p>A campus/ASF or participating church affiliation must be submitted and approved by the responsible administrator. Your account does not grant an organization role automatically.</p><span className="member-pending-note">No membership request is recorded yet.</span></div>:<div className="member-list">{rows.map(m=><article key={m.id}><div><b>{organizationName(m)??"Organization"}</b><small>{roleLabel(m.role)} · {m.org_id.slice(0,8)}</small></div><span className={"member-status "+m.status}>{roleLabel(m.status)}</span></article>)}</div>}
   <div className="member-membership-request"><b>Request an organization membership</b><p>{memberCategory==="student"?"Choose your verified campus / Adventist Students Fellowship.":"Choose a participating local church."} Requests remain pending until an authorized administrator reviews them.</p>{(organizationResult.data??[]).filter((org:any)=>memberCategory==="student"?org.org_type==="campus":memberCategory==="non_student"?org.org_type==="church":false).filter((org:any)=>!rows.some(m=>m.org_id===org.id)).map((org:any)=><form action={requestMembership} key={org.id}><input type="hidden" name="org_id" value={org.id}/><span><b>{org.name}</b><small>{org.org_type==="campus"?"Campus / ASF":"Local church"}{org.state_name?" · "+org.state_name:""}</small></span><button type="submit">Request membership</button></form>)}{organizationResult.error?<small>Organization list is temporarily unavailable.</small>:(organizationResult.data??[]).filter((org:any)=>memberCategory==="student"?org.org_type==="campus":memberCategory==="non_student"?org.org_type==="church":false).length===0?<small>No verified active {memberCategory==="student"?"campus / ASF":"local church"} records are currently available in the live directory. Your registration remains saved; the directory must be populated and verified by authorized NAAS administrators before membership requests can be submitted.</small>:null}</div>
   {typeof params.transfer==="string"&&<p className="member-empty" role="status">{({
    "submitted":"Your transfer request has been submitted. The source organization must review it first, followed by the destination organization.",
    "cancelled":"Your pending transfer request has been cancelled.",
    "invalid":"Choose a valid destination and provide a reason of at least 10 characters.",
    "source-unavailable":"The source membership is no longer active or could not be verified.",
    "same-organization":"Choose a different organization from your current membership.",
    "not-submitted":"We could not submit the transfer request. Check that you do not already have a pending request and try again.",
    "cancel-invalid":"Provide a valid transfer request and a cancellation reason of at least 10 characters.",
    "cancel-failed":"The transfer could not be cancelled. It may already have moved to a final state."
   } as Record<string,string>)[params.transfer]??"Transfer request updated."}</p>}
   <div className="member-transfer-panel">
    <div className="member-panel-head"><div><span className="member-eyebrow">MEMBERSHIP LIFECYCLE</span><h3>Transfer membership</h3><p>Move an active membership to another eligible campus/ASF or church. The current organization reviews first; the destination organization reviews second.</p></div></div>
    {transferResult.error?<p className="member-empty">Transfer requests are temporarily unavailable. Please refresh.</p>:((transferResult.data??[]) as MembershipTransfer[]).length>0?<div className="member-list">{((transferResult.data??[]) as MembershipTransfer[]).map(t=><article key={t.id}><div><b>{organizationName(rows.find(m=>m.org_id===t.source_org_id)??({org_units:null} as unknown as Membership))??"Current organization"} → {(organizationResult.data??[]).find((o:any)=>o.id===t.destination_org_id)?.name??"Destination organization"}</b><small>{t.reason??"No reason supplied"} · {new Date(t.created_at).toLocaleDateString("en-NG",{dateStyle:"medium"})}</small><small>Transfer reference: {t.id.slice(0,8)}</small></div><span className={"member-status "+t.status}>{roleLabel(t.status)}</span>{["pending_source","pending_destination"].includes(t.status)&&<form action={cancelMembershipTransfer} className="member-transfer-cancel"><input type="hidden" name="transfer_id" value={t.id}/><label>Cancellation reason<input name="cancellation_reason" minLength={10} maxLength={1000} required placeholder="Why are you cancelling?"/></label><button type="submit">Cancel request</button></form>}</article>)}</div>:<p className="member-empty">You have no membership transfer requests.</p>}
    {rows.filter(m=>m.status==="active"&&["campus","church"].includes((Array.isArray(m.org_units)?m.org_units[0]?.org_type:m.org_units?.org_type)??"")).map(source=>{const sourceType=Array.isArray(source.org_units)?source.org_units[0]?.org_type:source.org_units?.org_type;const destinations=(organizationResult.data??[]).filter((org:any)=>org.org_type===sourceType&&org.id!==source.org_id);return <form action={requestMembershipTransfer} className="member-transfer-form" key={source.id}><b>Transfer from {organizationName(source)??"your current organization"}</b><input type="hidden" name="source_membership_id" value={source.id}/><label>Destination organization<select name="destination_org_id" required defaultValue=""><option value="" disabled>Select an eligible organization</option>{destinations.map((org:any)=><option value={org.id} key={org.id}>{org.name}{org.state_name?" · "+org.state_name:""}</option>)}</select></label><label>Reason for transfer<textarea name="reason" required minLength={10} maxLength={1000} rows={3} placeholder="Explain why you are requesting this transfer (at least 10 characters)."/></label><button type="submit" disabled={destinations.length===0}>Submit transfer request</button>{destinations.length===0&&<small>No other active eligible organization of this type is currently available.</small>}</form>})}
   </div>
   <div className="member-profile-summary"><b>Registration information</b><span>{profile?.institution_name??"Institution not supplied"}</span><span>{memberCategory==="student"?(profile?.state_of_admission?"State of admission: "+profile.state_of_admission:"Admission state not supplied"):memberCategory==="non_student"?(profile?.residential_state?"Residence: "+profile.residential_state:"Residence not supplied")+" · "+(profile?.preferred_region_state?"Preferred church region: "+profile.preferred_region_state:"Preferred church region not supplied"):"Membership category not selected"}</span><span>{profile?.course_of_study??"Course not supplied"}{profile?.level_of_study?" · "+profile.level_of_study:""}</span></div></section>

   <section className="member-panel" id="history"><div className="member-panel-head"><div><span className="member-eyebrow">MEMBERSHIP LIFECYCLE</span><h2>Membership activity</h2><p>A record of membership requests, decisions and changes visible to your account.</p></div><span className="member-category">{historyResult.error?"Unavailable":(historyResult.data??[]).length+" events"}</span></div>
   {historyResult.error?<p className="member-empty">Membership history is temporarily unavailable. Your current membership information remains available above.</p>:(historyResult.data??[]).length===0?<p className="member-empty">No membership activity has been recorded for this account yet. New requests and administrator decisions will appear here when recorded.</p>:<div className="member-history-list">{(historyResult.data as unknown as MembershipEvent[]).map((event,index)=><article key={event.id} style={{display:"grid",gridTemplateColumns:"18px minmax(0,1fr)",gap:12,padding:"12px 0",borderTop:index===0?"1px solid #edf0f5":"1px solid #edf0f5"}}><span aria-hidden="true" style={{width:10,height:10,borderRadius:99,background:"#3158b7",margin:"4px auto",boxShadow:"0 0 0 4px #edf2fc"}}/><div style={{minWidth:0}}><div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><b style={{fontSize:11,color:"#34445d"}}>{eventLabel(event.event_type)}</b><time style={{fontSize:9,color:"#8996a8"}} dateTime={event.created_at}>{new Date(event.created_at).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"})}</time></div><small style={{display:"block",fontSize:9,color:"#8793a5",marginTop:4}}>{eventOrganizationName(event)??"Organization activity"}</small></div></article>)}</div>}</section>
   <section className="member-panel" id="profile"><div className="member-panel-head"><div><span className="member-eyebrow">ACCOUNT DETAILS</span><h2>Edit your profile</h2><p>Update the personal details attached to your NAASCONNECT account.</p></div></div><MemberProfileForm action={saveMemberProfile} profile={profile} displayName={displayName} metadata={meta as Record<string, unknown>}/></section>
   <section className="member-panel" id="statuses"><div className="member-panel-head"><div><span className="member-eyebrow">COMMUNITY · GLOBAL</span><h2>Global Status</h2><p>Active status updates shared with authenticated NAASCONNECT members.</p></div></div>
   {active.length>0?<form action={publishCommunityStatus} className="member-status-composer"><label>Post as<select name="author_org_id" defaultValue=""><option value="">My personal account</option>{admins.map(m=><option value={m.org_id} key={m.id}>{organizationName(m)??"Authorized organization"}</option>)}</select></label><label htmlFor="status-content">Share a status with the NAASCONNECT community</label><textarea id="status-content" name="content" maxLength={2000} minLength={1} required placeholder="What would you like to share?"/><label>Optional media URL<input name="media_url" type="url" placeholder="https://..."/></label><div><small>Visible to authenticated members · Expires after 24 hours</small><button type="submit">Publish status</button></div></form>:<p className="member-empty">Status publishing unlocks after an organization administrator approves at least one membership. All active statuses remain globally visible to authenticated members.</p>}
   {statusResult.error?<p className="member-empty">Global Status is temporarily unavailable. Please refresh in a moment.</p>:(statusResult.data??[]).length===0?<p className="member-empty">No active status updates yet. Status publishing is available to members with an approved active membership.</p>:<div className="member-status-feed">{statusResult.data!.map(s=><article key={s.id}><p>{s.content}</p><small>{new Date(s.created_at).toLocaleString("en-NG",{dateStyle:"medium",timeStyle:"short"})} · Expires {new Date(s.expires_at).toLocaleTimeString("en-NG",{hour:"2-digit",minute:"2-digit"})}</small></article>)}</div>}</section>
   <section className="member-panel" id="resources"><div className="member-panel-head"><div><span className="member-eyebrow">GROW IN FAITH</span><h2>Bible & Lesson Study</h2><p>Study resources supplied for the NAASCONNECT community.</p></div></div><div className="member-resource-links"><a href="/kjv.pdf" target="_blank" rel="noreferrer">Open KJV Bible PDF</a><a href="/Lesson%20Study%20Guide-%204th%20Quarter_2026.pdf" target="_blank" rel="noreferrer">Open 4th Quarter 2026 Lesson Study Guide</a></div></section>

   <section className="member-panel" id="security"><div className="member-panel-head"><div><span className="member-eyebrow">ACCOUNT & SECURITY</span><h2>Account settings</h2><p>Manage the email address and password used to sign in to NAASCONNECT.</p></div></div>
   {typeof params.security==="string"&&<p role="status" className="member-empty">{({
    "email-pending":"A confirmation link has been sent to your new email address. Your sign-in email changes after confirmation.",
    "email-failed":"We could not start the email change. Please check the address and try again.",
    "invalid-email":"Enter a valid email address.",
    "same-email":"That is already your current email address.",
    "password-invalid":"Use a password of at least 10 characters and make sure both entries match.",
    "password-failed":"We could not update your password. Please try again.",
    "password-updated":"Your password has been updated successfully."
   } as Record<string,string>)[params.security]??"Account settings updated."}</p>}
   <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,260px),1fr))",gap:14}}>
    <form action={changeAccountEmail} className="member-profile-form"><b style={{fontSize:11,color:"#354660"}}>Change email address</b><label>Current email<input value={user.email??""} readOnly aria-readonly="true"/></label><label>New email address<input name="email" type="email" required maxLength={254} autoComplete="email" placeholder="you@example.com"/></label><small style={{fontSize:9,color:"#8793a5",lineHeight:1.6}}>A confirmation link is required before the new address becomes your sign-in email.</small><div className="profile-submit-row"><button type="submit">Update email</button></div></form>
    <form action={changeAccountPassword} className="member-profile-form"><b style={{fontSize:11,color:"#354660"}}>Change password</b><label>New password<input name="password" type="password" required minLength={10} maxLength={128} autoComplete="new-password"/></label><label>Confirm new password<input name="password_confirmation" type="password" required minLength={10} maxLength={128} autoComplete="new-password"/></label><small style={{fontSize:9,color:"#8793a5",lineHeight:1.6}}>Choose a strong password with at least 10 characters. You can sign out after updating if this device is shared.</small><div className="profile-submit-row"><button type="submit">Update password</button></div></form>
   </div>
  </section>
   {admins.length>0&&<div className="member-admin-note">Your account has {admins.length} active scoped administrator assignment(s). Every protected action is checked again by Supabase authorization.</div>}
  </section></div></main>;
}
