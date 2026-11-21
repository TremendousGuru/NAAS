import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = { "Access-Control-Allow-Origin": Deno.env.get("APP_ORIGIN") ?? "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (body: unknown, status=200) => new Response(JSON.stringify(body), {status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async (req) => {
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return json({error:"Method not allowed"},405);
 const url=Deno.env.get("SUPABASE_URL"), anon=Deno.env.get("SUPABASE_ANON_KEY"), secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
 if(!url||!anon||!secret) return json({error:"Server configuration incomplete"},500);
 const authorization=req.headers.get("Authorization"); if(!authorization) return json({error:"Authentication required"},401);
 const userClient=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false}});
 const {data:{user},error:userErr}=await userClient.auth.getUser(); if(userErr||!user) return json({error:"Invalid session"},401);
 const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 let body:{action?:string;request_id?:string}; try{body=await req.json();}catch{return json({error:"Invalid JSON"},400);}
 if(!body.request_id) return json({error:"request_id is required"},400);
 if(body.action==="invite"){
  const {data:r,error:e}=await userClient.from("admin_appointment_requests").select("id,seat_id,nominee_name,nominee_email,status").eq("id",body.request_id).maybeSingle();
  if(e||!r) return json({error:"Appointment not found or not visible to this administrator"},404);
  if(r.status!=="approved") return json({error:"Appointment has not been approved"},409);
  const {data:s,error:se}=await admin.from("org_admin_seats").select("id,org_id,admin_role,status").eq("id",r.seat_id).single();
  if(se||!s||s.status!=="awaiting_appointee") return json({error:"Administrator seat is not ready"},409);
  const {data:inv,error:ie}=await admin.auth.admin.inviteUserByEmail(r.nominee_email,{data:{full_name:r.nominee_name,naasconnect_admin_request:r.id}});
  if(ie||!inv.user) return json({error:ie?.message??"Invitation failed"},502);
  const {error:me}=await admin.from("org_memberships").upsert({org_id:s.org_id,user_id:inv.user.id,role:s.admin_role,status:"pending",approved_by:user.id,approved_at:new Date().toISOString(),joined_at:null},{onConflict:"org_id,user_id"});
  if(me) return json({error:"Invitation sent; membership provisioning requires reconciliation",detail:me.message},500);
  const {error:ue}=await admin.from("admin_appointment_requests").update({status:"invited",invited_user_id:inv.user.id,invited_at:new Date().toISOString()}).eq("id",r.id);
  if(ue) return json({error:"Invitation sent; appointment record requires reconciliation"},500);
  return json({ok:true,status:"invited",email:r.nominee_email});
 }
 if(body.action==="accept"){
  const {data:r,error:e}=await admin.from("admin_appointment_requests").select("id,seat_id,nominee_email,invited_user_id,status").eq("id",body.request_id).maybeSingle();
  if(e||!r) return json({error:"Appointment not found"},404);
  if(r.status!=="invited"||r.invited_user_id!==user.id||(user.email??"").toLowerCase()!==r.nominee_email.toLowerCase()) return json({error:"Invitation does not belong to this account"},403);
  const {data:s,error:se}=await admin.from("org_admin_seats").select("id,org_id").eq("id",r.seat_id).single(); if(se||!s) return json({error:"Seat not found"},404);
  const now=new Date().toISOString();
  const {error:me}=await admin.from("org_memberships").update({status:"active",joined_at:now}).eq("org_id",s.org_id).eq("user_id",user.id).eq("status","pending");
  if(me) return json({error:"Could not activate membership"},500);
  const {error:seu}=await admin.from("org_admin_seats").update({status:"active"}).eq("id",s.id); if(seu) return json({error:"Membership active; seat reconciliation required"},500);
  const {error:re}=await admin.from("admin_appointment_requests").update({status:"accepted",accepted_at:now}).eq("id",r.id); if(re) return json({error:"Account active; appointment reconciliation required"},500);
  return json({ok:true,status:"active"});
 }
 return json({error:"action must be invite or accept"},400);
});