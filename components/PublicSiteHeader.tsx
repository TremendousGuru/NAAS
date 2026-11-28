"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/community", label: "Community" },
  { href: "/events", label: "Events" },
  { href: "/portals", label: "Portals" },
];

export default function PublicSiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="relative z-40 border-b border-slate-100 bg-white">
      <div className="mx-auto flex min-h-[76px] max-w-[1240px] items-center justify-between gap-5 px-5 sm:px-7">
        <Link href="/" aria-label="NAASCONNECT home" onClick={() => setOpen(false)} className="shrink-0">
          <Image src="/brand/naasconnect-logo.png" alt="NAASCONNECT Nigeria" width={190} height={58} priority className="h-auto w-[145px] sm:w-[175px]" />
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
          {links.map(link => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} className={`text-[13px] font-semibold transition-colors ${pathname === link.href ? "text-blue-800" : "text-slate-600 hover:text-blue-800"}`}>{link.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login" className="text-[13px] font-bold text-slate-700 hover:text-blue-800">Sign in</Link>
          <Link href="/login?mode=signup" className="rounded-lg bg-blue-900 px-4 py-3 text-[12px] font-bold text-white shadow-sm hover:bg-blue-800">Join NAASCONNECT</Link>
        </div>
        <button type="button" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls="public-mobile-navigation" onClick={() => setOpen(v => !v)} className="grid h-11 w-11 place-items-center rounded-xl border border-slate-200 text-slate-700 md:hidden">
          <span className="text-2xl leading-none" aria-hidden="true">{open ? "×" : "☰"}</span>
        </button>
      </div>
      {open && <div id="public-mobile-navigation" className="border-t border-slate-100 bg-white px-5 pb-5 pt-3 shadow-lg md:hidden">
        <nav aria-label="Mobile navigation" className="flex flex-col">
          {links.map(link => <Link key={link.href} href={link.href} onClick={() => setOpen(false)} aria-current={pathname === link.href ? "page" : undefined} className={`rounded-lg px-3 py-3 text-sm font-semibold ${pathname === link.href ? "bg-blue-50 text-blue-900" : "text-slate-700"}`}>{link.label}</Link>)}
        </nav>
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
          <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-3 py-3 text-center text-sm font-bold text-slate-700">Sign in</Link>
          <Link href="/login?mode=signup" onClick={() => setOpen(false)} className="rounded-lg bg-blue-900 px-3 py-3 text-center text-sm font-bold text-white">Join now</Link>
        </div>
      </div>}
    </header>
  );
}
