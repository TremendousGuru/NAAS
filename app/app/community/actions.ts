"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set(["image/jpeg","image/png","image/webp","image/gif","video/mp4","video/webm"]);

export async function publishCommunityPost(formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const postType = String(formData.get("post_type") ?? "member_post");
  const orgId = String(formData.get("author_org_id") ?? "").trim() || null;
  const file = formData.get("media");
  if (!content || content.length > 5000 || !["member_post","announcement"].includes(postType)) {
    redirect("/app/community?post=invalid");
  }
  if (postType === "announcement" && (!orgId || title.length < 3 || title.length > 160)) {
    redirect("/app/community?post=announcement-details-required");
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  let mediaPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    if (!allowedTypes.has(file.type) || file.size > 10 * 1024 * 1024) redirect("/app/community?post=media-invalid");
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const safeExt = /^[a-z0-9]{2,5}$/.test(ext) ? ext : "bin";
    mediaPath = user.id + "/" + crypto.randomUUID() + "." + safeExt;
    const { error: uploadError } = await supabase.storage.from("community-media").upload(mediaPath, file, {
      contentType: file.type, upsert: false,
    });
    if (uploadError) redirect("/app/community?post=media-upload-failed");
  }

  const payload = {
    author_user_id: user.id,
    author_org_id: postType === "announcement" ? orgId : null,
    audience_org_id: postType === "announcement" ? orgId : null,
    post_type: postType,
    title: postType === "announcement" ? title : null,
    content,
    media_path: mediaPath,
  };
  const { error } = await supabase.from("community_posts").insert(payload);
  if (error) {
    if (mediaPath) await supabase.storage.from("community-media").remove([mediaPath]);
    redirect("/app/community?post=not-published");
  }
  revalidatePath("/app/community");
  redirect("/app/community?post=published");
}

export async function reportCommunityPost(formData: FormData) {
  const postId = String(formData.get("post_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim().slice(0,1000);
  if (!postId || !["spam","harassment","hate_or_abuse","misinformation","inappropriate","other"].includes(reason)) {
    redirect("/app/community?report=invalid");
  }
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { error } = await supabase.from("community_post_reports").insert({
    post_id: postId, reporter_user_id: user.id, reason, details: details || null,
  });
  redirect(error ? "/app/community?report=not-submitted" : "/app/community?report=submitted");
}

export async function reviewCommunityReport(formData: FormData) {
  const reportId = String(formData.get("report_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const note = String(formData.get("review_note") ?? "").trim().slice(0,1000);
  if (!reportId || !["reviewing","resolved","dismissed"].includes(status) || note.length < 10) redirect("/app/community?moderation=invalid");
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");
  const { error } = await supabase.from("community_post_reports").update({
    status, reviewer_user_id: user.id, review_note: note, reviewed_at: new Date().toISOString(),
  }).eq("id",reportId);
  redirect(error ? "/app/community?moderation=not-saved" : "/app/community?moderation=saved");
}
