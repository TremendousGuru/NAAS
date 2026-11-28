"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";

const items = [
  ["Overview", "/app"], ["My membership", "/app/membership"],
  ["Community status", "/app/community"], ["Events", "/app/events"],
  ["Notifications", "/app/notifications"], ["Find an ASF", "/app/directory?type=campus"],
  ["Find a church", "/app/directory?type=church"], ["Bible & lesson study", "/app/resources"],
  ["Settings", "/app/settings"],
] as const;

export default function PortalNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <>
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      <Link href="/app" aria-label="NAASCONNECT member home"><Image src="/brand/naasconnect-logo.png" alt="NAASCONNECT" width={150} height={46} className="h-auto w-[138px]" /></Link>
      <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls="member-mobile-navigation" aria-label={open ? "Close portal menu" : "Open portal menu"} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-700"><span className="text-2xl leading-none" aria-hidden="true">{open ? "×" : "☰"}</span></button>
    </div>
    <aside className="hidden min-h-screen w-[250px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen">
      <Link href="/app" className="mb-7 border-b border-slate-100 px-2 pb-6"><Image src="/brand/naasconnect-logo.png" alt="NAASCONNECT Nigeria" width={165} height={50} className="h-auto w-[155px]" /></Link>
      <span className="mb-3 px-2 text-[10px] font-extrabold tracking-[.16em] text-slate-400">MEMBER WORKSPACE</span>
      <nav aria-label="Member portal navigation" className="flex flex-col gap-1">
        {items.map(([label, href]) => <Link key={href} href={href} className={`rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors ${pathname === href.split("?")[0] ? "bg-blue-50 text-blue-900" : "text-slate-600 hover:bg-slate-50 hover:text-blue-900"}`}>{label}</Link>)}
      </nav>
      <form action={signOut} className="mt-auto border-t border-slate-100 pt-5"><button type="submit" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-[13px] font-bold text-slate-600 hover:bg-slate-50">Sign out</button></form>
    </aside>
    {open && <div id="member-mobile-navigation" className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden" onClick={() => setOpen(false)}>
      <aside className="flex h-full w-[min(86vw,340px)] flex-col overflow-y-auto bg-white px-4 py-5 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 px-1 pb-4"><Image src="/brand/naasconnect-logo.png" alt="NAASCONNECT Nigeria" width={155} height={48} className="h-auto w-[145px]" /><button type="button" aria-label="Close portal menu" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-xl">×</button></div>
        <span className="mb-3 px-2 text-[10px] font-extrabold tracking-[.16em] text-slate-400">MEMBER WORKSPACE</span>
        <nav aria-label="Member portal navigation" className="flex flex-col gap-1">
          {items.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`rounded-xl px-3 py-3.5 text-sm font-semibold ${pathname === href.split("?")[0] ? "bg-blue-50 text-blue-900" : "text-slate-700 hover:bg-slate-50"}`}>{label}</Link>)}
        </nav>
        <form action={signOut} className="mt-auto border-t border-slate-100 pt-5"><button type="submit" className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600">Sign out</button></form>
      </aside>
    </div>}
  </>;
}
