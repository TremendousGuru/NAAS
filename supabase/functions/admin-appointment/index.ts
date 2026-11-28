import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const appOrigin = Deno.env.get("APP_ORIGIN") ?? "null";
const cors = {
  "Access-Control-Allow-Origin": appOrigin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const APPROVER_ROLES = ["national_admin", "union_admin", "zone_admin"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !secret || !Deno.env.get("APP_ORIGIN")) {
    return json({ error: "Server configuration incomplete" }, 500);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Authentication required" }, 401);

  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: userErr } = await userClient.auth.getUser();
  if (userErr || !user) return json({ error: "Invalid session" }, 401);

  const admin = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let body: { action?: string; request_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  if (!body.request_id || !UUID.test(body.request_id)) {
    return json({ error: "A valid request_id is required" }, 400);
  }

  if (body.action === "invite") {
    const { data: request, error: requestError } = await userClient
      .from("admin_appointment_requests")
      .select("id,seat_id,nominee_name,nominee_email,status,reviewed_by,reviewed_at")
      .eq("id", body.request_id)
      .maybeSingle();

    if (requestError || !request) {
      return json({ error: "Appointment not found or not visible to this administrator" }, 404);
    }
    if (request.status !== "approved" || !request.reviewed_by || !request.reviewed_at) {
      return json({ error: "Appointment has not been approved" }, 409);
    }

    const { data: seat, error: seatError } = await admin
      .from("org_admin_seats")
      .select("id,org_id,approval_org_id,admin_role,status")
      .eq("id", request.seat_id)
      .maybeSingle();

    if (seatError || !seat || seat.status !== "awaiting_appointee") {
      return json({ error: "Administrator seat is not ready" }, 409);
    }

    // A request's creator can still read it after losing their admin role.
    // Re-check active authority at the seat's approval organization at invite
    // time, rather than relying on the requester's historical SELECT access.
    const { data: authority, error: authorityError } = await userClient
      .from("org_memberships")
      .select("id,role")
      .eq("org_id", seat.approval_org_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("role", APPROVER_ROLES)
      .maybeSingle();

    if (authorityError || !authority) {
      return json({ error: "Only a currently active administrator at the approving organization may send this invitation" }, 403);
    }

    const redirectTo = new URL(
      "/auth/callback?next=" +
        encodeURIComponent("/admin/invitation?request_id=" + request.id),
      appOrigin,
    ).toString();

    const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
      request.nominee_email,
      {
        options: {
          redirectTo,
          data: {
            full_name: request.nominee_name,
            naasconnect_admin_request: request.id,
          },
        },
      },
    );

    if (inviteError || !invitation.user) {
      return json({ error: inviteError?.message ?? "Invitation failed" }, 502);
    }

    const now = new Date().toISOString();
    // Record the invited identity before membership provisioning. Acceptance
    // below is idempotent and can safely complete membership provisioning if
    // this first pending-membership write fails.
    const { error: requestUpdateError } = await admin
      .from("admin_appointment_requests")
      .update({
        status: "invited",
        invited_user_id: invitation.user.id,
        invited_at: now,
      })
      .eq("id", request.id)
      .eq("status", "approved");

    if (requestUpdateError) {
      return json({
        error: "Invitation sent, but the appointment record needs administrator reconciliation",
      }, 500);
    }

    const { error: membershipError } = await admin
      .from("org_memberships")
      .upsert({
        org_id: seat.org_id,
        user_id: invitation.user.id,
        role: seat.admin_role,
        status: "pending",
        approved_by: request.reviewed_by,
        approved_at: request.reviewed_at,
        joined_at: null,
      }, { onConflict: "org_id,user_id" });

    if (membershipError) {
      // Do not invite again: the request is already marked invited. The
      // invitee's acceptance path will create/activate the scoped membership.
      return json({
        ok: true,
        status: "invited",
        email: request.nominee_email,
        warning: "Membership will be provisioned when the invitee accepts",
      });
    }

    return json({ ok: true, status: "invited", email: request.nominee_email });
  }

  if (body.action === "accept") {
    const { data: request, error: requestError } = await admin
      .from("admin_appointment_requests")
      .select("id,seat_id,nominee_email,invited_user_id,status,reviewed_by,reviewed_at")
      .eq("id", body.request_id)
      .maybeSingle();

    if (requestError || !request) return json({ error: "Appointment not found" }, 404);
    if (
      !["invited", "accepted"].includes(request.status) ||
      request.invited_user_id !== user.id ||
      (user.email ?? "").toLowerCase() !== request.nominee_email.toLowerCase()
    ) {
      return json({ error: "Invitation does not belong to this account" }, 403);
    }
    if (request.status === "accepted") return json({ ok: true, status: "active" });
    if (!request.reviewed_by || !request.reviewed_at) {
      return json({ error: "The approved appointment record is incomplete" }, 409);
    }

    const { data: seat, error: seatError } = await admin
      .from("org_admin_seats")
      .select("id,org_id,admin_role,status")
      .eq("id", request.seat_id)
      .maybeSingle();

    if (seatError || !seat || !["awaiting_appointee", "active"].includes(seat.status)) {
      return json({ error: "Administrator seat is not available for acceptance" }, 409);
    }

    const now = new Date().toISOString();
    // Upsert makes acceptance retry-safe if an earlier attempt stopped after
    // the invite was recorded but before the pending membership was created.
    const { error: membershipError } = await admin
      .from("org_memberships")
      .upsert({
        org_id: seat.org_id,
        user_id: user.id,
        role: seat.admin_role,
        status: "active",
        approved_by: request.reviewed_by,
        approved_at: request.reviewed_at,
        joined_at: now,
      }, { onConflict: "org_id,user_id" });

    if (membershipError) return json({ error: "Could not activate the administrator membership" }, 500);

    const { error: seatUpdateError } = await admin
      .from("org_admin_seats")
      .update({ status: "active" })
      .eq("id", seat.id)
      .in("status", ["awaiting_appointee", "active"]);

    if (seatUpdateError) return json({ error: "Membership active; administrator seat reconciliation required" }, 500);

    const { error: requestUpdateError } = await admin
      .from("admin_appointment_requests")
      .update({ status: "accepted", accepted_at: now })
      .eq("id", request.id)
      .eq("status", "invited");

    if (requestUpdateError) {
      return json({ error: "Membership active; appointment status reconciliation required" }, 500);
    }

    return json({ ok: true, status: "active" });
  }

  return json({ error: "action must be invite or accept" }, 400);
});
