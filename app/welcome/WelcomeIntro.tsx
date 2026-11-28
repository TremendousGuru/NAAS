"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MINIMUM_INTRO_MS = 5000;

export default function WelcomeIntro({ next }: { next: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    const startedAt = Date.now();

    const finishIntro = async () => {
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
      if (remaining > 0) await new Promise(resolve => window.setTimeout(resolve, remaining));

      if (active) {
        setChecking(false);
        router.replace(next);
      }
    };

    void finishIntro();
    return () => { active = false; };
  }, [next, router]);

  return (
    <main className="launch-screen" aria-label="Welcome to NAASCONNECT" aria-busy={checking}>
      <div className="launch-glow" aria-hidden="true" />
      <section className="launch-content">
        <Image
          src="/brand/naasconnect-logo.png"
          alt="NAASCONNECT Nigeria"
          width={360}
          height={120}
          priority
          className="launch-logo"
        />
        <div className="launch-progress" role="progressbar" aria-label="Preparing your NAASCONNECT experience">
          <span />
        </div>
        <p>CONNECTING FAITH · FELLOWSHIP · SERVICE</p>
        <small>NAASCONNECT NIGERIA</small>
        <button
          type="button"
          onClick={() => router.replace(next)}
          className="mt-8 rounded-full border border-white/25 bg-white/5 px-5 py-2.5 text-xs font-bold tracking-wide text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Continue now
        </button>
      </section>
      <div className="launch-footer">A connected family across Nigeria</div>
    </main>
  );
}
