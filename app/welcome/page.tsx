import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WelcomeIntro from "./WelcomeIntro";

export const dynamic = "force-dynamic";
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const requested = params.next ?? "/app";
  const next = requested.startsWith("/") && !requested.startsWith("//") && !requested.startsWith("/welcome") ? requested : "/app";
  return <WelcomeIntro next={next} />;
}
