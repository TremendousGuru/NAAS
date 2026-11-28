import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsOrigin = Deno.env.get("APP_ORIGIN") ?? "null";
const cors = {
  "Access-Control-Allow-Origin": corsOrigin,
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
const REVIEW_STATUSES = ["reviewing", "resolved", "dismissed"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return json({ error: "Server configuration incomplete" }, 500);

  const authorization = req.headers.get("Authorization");
  if (!authorization) return json({ error: "Authentication required" }, 401);
  const userClient = createClient(url, anon, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return json({ error: "Invalid session" }, 401);

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Platform-wide moderation is deliberately limited to an active National
  // administrator assignment. User-editable metadata is never an authority.
  const { data: nationalOrg, error: orgError } = await admin
    .from("org_units")
    .select("id")
    .eq("org_type", "national")
    .eq("status", "active")
    .maybeSingle();
  if (orgError || !nationalOrg) return json({ error: "National organization authority is unavailable" }, 503);

  const { data: authority, error: authorityError } = await userClient
    .from("org_memberships")
    .select("id")
    .eq("org_id", nationalOrg.id)
    .eq("user_id", user.id)
    .eq("role", "national_admin")
    .eq("status", "active")
    .maybeSingle();
  if (authorityError || !authority) return json({ error: "National administrator authority required" }, 403);

  let body: {
    action?: string;
    report_id?: string;
    post_id?: string;
    status?: string;
    review_note?: string;
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (body.action === "list") {
    const { data: reports, error } = await admin
      .from("community_post_reports")
      .select("id,post_id,reporter_user_id,reason,details,status,created_at,community_posts!inner(id,author_user_id,author_org_id,post_type,title,content,status,published_at)")
      .is("community_posts.author_org_id", null)
      .eq("community_posts.post_type", "member_post")
      .in("status", ["open", "reviewing"])
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) return json({ error: "Could not load the personal-post moderation queue" }, 500);
    return json({ ok: true, reports: reports ?? [] });
  }

  if (body.action === "review") {
    if (!body.report_id || !UUID.test(body.report_id) || !body.status || !REVIEW_STATUSES.includes(body.status)) {
      return json({ error: "A valid report and review status are required" }, 400);
    }
    const note = (body.review_note ?? "").trim();
    if (note && (note.length < 10 || note.length > 1000)) {
      return json({ error: "Review notes must contain 10–1000 characters" }, 400);
    }

    const { data: report, error: readError } = await admin
      .from("community_post_reports")
      .select("id,post_id,community_posts!inner(author_org_id,post_type)")
      .eq("id", body.report_id)
      .maybeSingle();
    const post = Array.isArray(report?.community_posts) ? report.community_posts[0] : report?.community_posts;
    if (readError || !report || !post || post.author_org_id !== null || post.post_type !== "member_post") {
      return json({ error: "Personal member-post report not found" }, 404);
    }

    const { error: updateError } = await admin
      .from("community_post_reports")
      .update({
        status: body.status,
        reviewer_user_id: user.id,
        review_note: note || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", body.report_id);
    if (updateError) return json({ error: "Could not save the report review" }, 500);
    return json({ ok: true, status: body.status });
  }

  if (body.action === "hide_post") {
    if (!body.post_id || !UUID.test(body.post_id) || !body.report_id || !UUID.test(body.report_id)) {
      return json({ error: "A valid post and report are required" }, 400);
    }
    const note = (body.review_note ?? "").trim();
    if (note.length < 10 || note.length > 1000) {
      return json({ error: "A moderation note of 10–1000 characters is required" }, 400);
    }

    const { data: post, error: postReadError } = await admin
      .from("community_posts")
      .select("id,author_org_id,post_type,status")
      .eq("id", body.post_id)
      .maybeSingle();
    if (postReadError || !post || post.author_org_id !== null || post.post_type !== "member_post") {
      return json({ error: "Personal member post not found" }, 404);
    }
    if (post.status === "removed") return json({ error: "Removed posts cannot be restored from this queue" }, 409);

    if (post.status !== "hidden") {
      const { error: hideError } = await admin
        .from("community_posts")
        .update({ status: "hidden" })
        .eq("id", body.post_id)
        .eq("status", "published");
      if (hideError) return json({ error: "Could not hide the reported post" }, 500);
    }

    const { error: reportUpdateError } = await admin
      .from("community_post_reports")
      .update({
        status: "resolved",
        reviewer_user_id: user.id,
        review_note: note,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", body.report_id)
      .eq("post_id", body.post_id);
    if (reportUpdateError) {
      return json({ ok: true, status: "hidden", warning: "Post hidden; report record needs reconciliation" });
    }
    return json({ ok: true, status: "hidden" });
  }

  return json({ error: "action must be list, review or hide_post" }, 400);
});
