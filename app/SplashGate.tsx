"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

const MINIMUM_INTRO_MS = 5000;

export default function SplashGate() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const startedAt = Date.now();

    const resolveDestination = async () => {
      let destination = "/login";
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session) destination = "/app";
      } catch {
        destination = "/login";
      }

      // Do not navigate away before the brand mark has had a chance to load
      // and the intro has been visible long enough to render on small devices.
      const logo = document.querySelector<HTMLImageElement>(".launch-logo");
      if (logo && !logo.complete) {
        await new Promise<void>(resolve => {
          logo.addEventListener("load", () => resolve(), { once: true });
          logo.addEventListener("error", () => resolve(), { once: true });
        });
      }
      if (logo?.complete && logo.naturalWidth > 0 && typeof logo.decode === "function") {
        await logo.decode().catch(() => undefined);
      }

      const remaining = Math.max(0, MINIMUM_INTRO_MS - (Date.now() - startedAt));
      if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));

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
