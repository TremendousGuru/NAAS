"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");const supabase=createClient();const {error}=await supabase.auth.updateUser({password});setBusy(false);setMessage(error?error.message:"Password updated. You can now sign in.");}
  return <main className="auth-shell"><section className="auth-brand-panel"><div className="auth-brand-logos"><img src="/brand/naas-logo.png" alt="NAAS"/><img src="/brand/naasconnect-logo.png" alt="NAASCONNECT"/></div><div className="auth-brand-copy"><span>ACCOUNT SECURITY</span><h1>A secure account.<br/>A connected family.</h1><p>Choose a new password to protect your NAASCONNECT account.</p></div></section><section className="auth-form-panel"><div className="auth-form-wrap"><div className="auth-form-heading"><span>ACCOUNT RECOVERY</span><h2>Set a new password</h2><p>Use at least 10 characters.</p></div><form className="auth-form" onSubmit={submit}><label>New password<input type="password" minLength={10} required value={password} onChange={e=>setPassword(e.target.value)}/></label><button disabled={busy}>{busy?"Updating…":"Update password"}</button></form>{message&&<div className="auth-alert success">{message}</div>}<div className="auth-switch"><Link href="/login">Return to sign in</Link></div></div></section></main>;
}
