import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const rawNext = request.nextUrl.searchParams.get("next") ?? "/app";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=The%20confirmation%20link%20is%20missing%20or%20expired", request.url));
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(new URL("/login?error=The%20confirmation%20link%20could%20not%20be%20verified.%20Request%20a%20new%20link.", request.url));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const meta = user.user_metadata ?? {};
    const profile = {
      id: user.id,
      display_name: String(meta.display_name ?? meta.full_name ?? user.email?.split("@")[0] ?? "NAASCONNECT Member").slice(0,120),
      phone: typeof meta.phone === "string" ? meta.phone.slice(0,32) : null,
      institution_name: typeof meta.institution_name === "string" ? meta.institution_name.slice(0,180) : null,
      course_of_study: typeof meta.course_of_study === "string" ? meta.course_of_study.slice(0,120) : null,
      level_of_study: typeof meta.level_of_study === "string" ? meta.level_of_study.slice(0,80) : null,
      profile_completed: true,
    };
    const { error: profileError } = await supabase.from("profiles").upsert(profile, { onConflict: "id" });
    if (profileError) {
      return NextResponse.redirect(new URL("/welcome?next=%2Fapp%3Fsetup%3Dprofile", request.url));
    }
  }
  const destination = next === "/reset-password" ? next : "/welcome?next=" + encodeURIComponent(next);
  return NextResponse.redirect(new URL(destination, request.url));
}
