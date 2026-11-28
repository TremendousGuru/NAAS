import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptAdminInvitation } from "../actions";
export const dynamic="force-dynamic";
export const revalidate=0;
export default async function AdminInvitationPage({searchParams}:{searchParams:Promise<{request_id?:string;result?:string}>}) {
 const {request_id:requestId,result}=await searchParams;
 if(!requestId||!/^[0-9a-f-]{36}$/i.test(requestId)) redirect("/login?error=The%20administrator%20invitation%20link%20is%20invalid");
 const supabase=await createClient();const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user) redirect("/login?error=Sign%20in%20with%20the%20email%20address%20that%20received%20the%20administrator%20invitation");
 const {data:request}=await supabase.from("admin_appointment_requests").select("id,nominee_name,nominee_email,status,invited_user_id").eq("id",requestId).maybeSingle();
 const matching=!!request&&request.status==="invited"&&request.invited_user_id===user.id&&(user.email??"").toLowerCase()===request.nominee_email.toLowerCase();
 return <main className="portals-page"><header><Link href="/" className="portals-brand">NAASCONNECT NIGERIA</Link><Link href="/login">Sign out and switch account</Link></header><section className="portals-heading"><span className="public-eyebrow">SECURE ADMINISTRATOR ONBOARDING</span><h1>{matching?"Accept your appointment.":"Invitation verification"}</h1><p>{matching?"Your appointment has been approved. Continue to secure account setup. Your administrator assignment activates only after you set your own password and complete your profile.":result==="failed"?"The invitation could not be activated. Contact the appointing authority to reconcile the request.":"This invitation is not valid for the signed-in account, or it has already been accepted."}</p></section>{matching?<div className="portals-grid"><article><span className="portal-number">VERIFIED INVITATION</span><h2>{request.nominee_name}</h2><p>{request.nominee_email}</p><small>By accepting, you activate only the organization administrator assignment approved for this invitation. Your account password remains personal and is never shared.</small><form action={acceptAdminInvitation}><input type="hidden" name="request_id" value={requestId}/><button type="submit">Continue to secure account setup</button></form></article></div>:<footer>For security, the invitation must be opened while signed in to the exact email address to which it was issued. Do not forward the invitation link.</footer>}</main>;
}
