import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { completeAdminInvitation } from "../../actions";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default async function CompleteAdminInvitation({searchParams}:{searchParams:Promise<{request_id?:string;result?:string}>}) {
 const {request_id:requestId,result}=await searchParams;
 if(!requestId||!/^[0-9a-f-]{36}$/i.test(requestId)) redirect("/login?error=Invalid%20administrator%20invitation");
 const supabase=await createClient();
 const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user?.email) redirect("/login?error=Sign%20in%20using%20the%20invited%20email%20address");
 const {data:request}=await supabase.from("admin_appointment_requests").select("id,nominee_name,nominee_email,status,invited_user_id").eq("id",requestId).maybeSingle();
 const matching=!!request&&request.status==="invited"&&request.invited_user_id===user.id&&request.nominee_email.toLowerCase()===user.email.toLowerCase();
 const messages:Record<string,string>={invalid:"Enter your name and matching passwords. Use at least 12 characters.", "password-failed":"The password could not be saved. Use a stronger password and try again.", "profile-failed":"Your profile could not be saved. Please try again.", "activation-failed":"Your profile is saved, but the administrator assignment could not yet be activated. Contact the appointing authority before retrying."};
 return <main className="portals-page"><header><Link href="/" className="portals-brand">NAASCONNECT NIGERIA</Link><Link href="/login">Switch account</Link></header><section className="portals-heading"><span className="public-eyebrow">SECURE ADMINISTRATOR ONBOARDING</span><h1>Set up your administrator account.</h1><p>Complete your personal profile and choose your own password before your approved organization assignment is activated.</p></section>{matching?<div className="portals-grid"><article><span className="portal-number">APPROVED APPOINTMENT</span><h2>{request.nominee_name}</h2><p>{request.nominee_email}</p>{result&&<p className="portal-inline-alert" role="alert">{messages[result]??"Review the details and try again."}</p>}<form action={completeAdminInvitation} className="auth-form"><input type="hidden" name="request_id" value={requestId}/><label>Full name<input name="display_name" required minLength={2} maxLength={120} defaultValue={request.nominee_name}/></label><label>Phone number<input name="phone" type="tel" maxLength={32} placeholder="+234…"/></label><label>Create your personal password<input name="password" type="password" required minLength={12} autoComplete="new-password" placeholder="At least 12 characters"/></label><label>Confirm password<input name="password_confirmation" type="password" required minLength={12} autoComplete="new-password" placeholder="Enter the same password again"/></label><button type="submit">Complete profile and activate appointment</button></form><small>Your password is managed by Supabase Auth. It is never shared with or visible to the nominating administrator.</small></article></div>:<footer>This invitation is expired, already accepted, or belongs to a different signed-in account. Use the exact invited email address or contact the appointing authority.</footer>}</main>;
}
