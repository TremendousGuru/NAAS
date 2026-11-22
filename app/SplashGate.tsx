"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function SplashGate() {
  const router = useRouter();
  useEffect(() => {
    let destination = "/login";
    let active = true;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) destination = "/app";
    }).catch(() => undefined);
    const timer = window.setTimeout(() => { if (active) router.replace(destination); }, 5000);
    return () => { active = false; window.clearTimeout(timer); };
  }, [router]);
  return <main className="launch-screen" aria-label="Loading NAASCONNECT">
    <div className="launch-glow"/>
    <div className="launch-content">
      <Image src="/brand/naasconnect-logo.png" alt="NAASCONNECT Nigeria" width={300} height={100} priority className="launch-logo"/>
      <div className="launch-progress"><span/></div>
      <p>CONNECTING FAITH · FELLOWSHIP · SERVICE</p>
      <small>NAASCONNECT NIGERIA</small>
    </div>
    <div className="launch-footer">A connected family across Nigeria</div>
  </main>;
}
