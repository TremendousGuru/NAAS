"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WelcomeIntro({ next }: { next: string }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setTimeout(() => router.replace(next), 5000);
    return () => window.clearTimeout(timer);
  }, [next, router]);
  return <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#10264d] px-6 text-white">
    <div className="pointer-events-none absolute inset-0 opacity-30" style={{background:"radial-gradient(circle at 50% 38%, #6488c6 0, transparent 48%)"}} />
    <section className="relative z-10 mx-auto flex w-full max-w-xl flex-col items-center text-center">
      <div className="mb-8 grid h-24 w-24 place-items-center rounded-[28px] border border-white/20 bg-white/10 p-3 shadow-2xl"><Image src="/brand/naas-logo.png" alt="NAAS emblem" width={84} height={84} priority className="h-auto w-full" /></div>
      <span className="text-[10px] font-extrabold tracking-[.28em] text-blue-200">FAITH · FELLOWSHIP · SERVICE</span>
      <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">Welcome to <span className="text-blue-200">NAASCONNECT</span></h1>
      <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/85">One family, connected in purpose. Your community and workspace are getting ready.</p>
      <div className="mt-10 h-1.5 w-48 overflow-hidden rounded-full bg-white/15"><div className="h-full origin-left animate-[welcome-progress_5s_linear_forwards] rounded-full bg-blue-200" /></div>
      <p className="mt-4 text-[10px] font-semibold tracking-[.16em] text-blue-200/80">YOUR PORTAL WILL OPEN IN A MOMENT</p>
      <button type="button" onClick={() => router.replace(next)} className="mt-8 rounded-full border border-white/25 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/10">Continue now</button>
    </section>
    <style jsx>{`@keyframes welcome-progress{from{transform:scaleX(0)}to{transform:scaleX(1)}}`}</style>
  </main>;
}
