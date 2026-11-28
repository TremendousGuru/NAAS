"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function InitialNationalAdminSetupPage() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 12) return setError("Use a temporary password with at least 12 characters.");
    if (password !== confirmation) return setError("The password confirmation does not match.");
    if (token.length < 20) return setError("Enter the one-time setup token configured in Supabase.");
    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error: invokeError } = await supabase.functions.invoke("national-admin-bootstrap", {
        body: { email: "tremendous.available@gmail.com", display_name: "Tobi Tremendous", password },
        headers: { "x-naas-setup-token": token },
      });
      if (invokeError || !data?.ok) {
        setError(data?.error ?? invokeError?.message ?? "The initial administrator could not be provisioned.");
        return;
      }
      setSuccess(true);
      setToken("");
      setPassword("");
      setConfirmation("");
    } catch {
      setError("The bootstrap service could not be reached. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-shell auth-portal-national">
    <section className="auth-brand-panel">
      <div className="auth-brand-copy">
        <span>CONTROLLED FIRST-TIME SETUP</span>
        <h1>Establish the National administrator.</h1>
        <p>This one-time setup is reserved for the designated NAAS technical custodian after authorization from the governing authority.</p>
        <div className="auth-portal-badge">NATIONAL ADMINISTRATOR BOOTSTRAP</div>
      </div>
      <div className="auth-brand-footer">NAASCONNECT NIGERIA · RESTRICTED INITIALIZATION</div>
    </section>
    <section className="auth-form-panel"><div className="auth-form-wrap">
      <Link href="/portals" className="auth-back">← Return to portal selection</Link>
      <div className="auth-form-heading"><span>ONE-TIME PROVISIONING</span><h2>{success ? "National access established" : "Create the first National account"}</h2><p>{success ? "The designated account and National administrator assignment have been created." : "The token is checked server-side. It is never placed in a URL or stored in the browser."}</p></div>
      {success ? <div className="auth-alert success" role="status"><b>Bootstrap completed.</b><p>Sign in using the designated email address through the National portal. Change the temporary password immediately and complete the administrator profile.</p><Link href="/login?portal=national">Go to National sign in →</Link></div> :
      <form className="auth-form" onSubmit={submit}>
        <label>Administrator name<input value="Tobi Tremendous" readOnly /></label>
        <label>Designated email<input value="tremendous.available@gmail.com" readOnly /></label>
        <label>One-time setup token<input type="password" value={token} onChange={e=>setToken(e.target.value)} autoComplete="off" required placeholder="Paste the configured setup token" /></label>
        <label>Temporary password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={12} maxLength={128} autoComplete="new-password" required placeholder="At least 12 characters" /></label>
        <label>Confirm temporary password<input type="password" value={confirmation} onChange={e=>setConfirmation(e.target.value)} minLength={12} maxLength={128} autoComplete="new-password" required placeholder="Re-enter temporary password" /></label>
        {error && <div className="auth-alert error" role="alert">{error}</div>}
        <button type="submit" disabled={busy}>{busy ? "Provisioning securely…" : "Create National administrator"}</button>
        <p className="auth-security">This endpoint refuses to run if a National administrator is already active. Administrator authority is assigned only to the designated account and the reserved National seat.</p>
      </form>}
    </div></section>
  </main>;
}
