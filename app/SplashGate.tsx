"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function SplashGate() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const resolveDestination = async () => {
      let destination = "/login";
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) destination = "/app";
      } catch {
        destination = "/login";
      }
      if (active) {
        setChecking(false);
        router.replace(destination);
      }
    };
    void resolveDestination();
    return () => { active = false; };
  }, [router]);

  return <main className="launch-screen" aria-label="Loading NAASCONNECT" aria-busy={checking}>
    <div className="launch-glow" aria-hidden="true"/>
    <div className="launch-content">
      <Image src="/brand/naasconnect-logo.png" alt="NAASCONNECT Nigeria" width={300} height={100} priority className="launch-logo"/>
      <div className="launch-progress" role="progressbar" aria-label="Preparing your NAASCONNECT experience"><span/></div>
      <p>CONNECTING FAITH · FELLOWSHIP · SERVICE</p>
      <small>NAASCONNECT NIGERIA</small>
    </div>
    <div className="launch-footer">A connected family across Nigeria</div>
  </main>;
}
