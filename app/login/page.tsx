import Image from "next/image";
import Link from "next/link";
import { signIn, signUp, requestPasswordReset } from "@/app/auth/actions";

type Props = { searchParams: Promise<{ mode?: string; error?: string; message?: string }> };
export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;
  const mode = params.mode ?? "login";
  return <main className="auth-shell">
    <section className="auth-brand-panel">
      <div className="auth-brand-logos"><Image src="/brand/naas-logo.png" alt="NAAS" width={62} height={62} priority/><Image src="/brand/naasconnect-logo.png" alt="NAASCONNECT" width={220} height={62} priority/></div>
      <div className="auth-brand-copy"><span>FAITH · FELLOWSHIP · SERVICE</span><h1>One family.<br/>Connected in purpose.</h1><p>A trusted digital home for NAAS, Adventist Students Fellowships, participating churches and members across Nigeria.</p></div>
      <div className="auth-brand-footer">NAASCONNECT NIGERIA · V1.0</div>
    </section>
    <section className="auth-form-panel"><div className="auth-form-wrap">
      <Link href="/" className="auth-back">← Back to overview</Link>
      <div className="auth-form-heading"><span>WELCOME TO NAASCONNECT</span><h2>{mode==="signup"?"Create your account":mode==="reset"?"Reset your password":"Sign in to continue"}</h2><p>{mode==="signup"?"Create one account for your NAASCONNECT identity.":mode==="reset"?"We’ll send a secure password reset link to your email.":"Access your member or approved administrator workspace."}</p></div>
      {params.error && <div className="auth-alert error" role="alert">{params.error}</div>}
      {params.message && <div className="auth-alert success" role="status">{params.message}</div>}
      {mode==="reset" ? <form action={requestPasswordReset} className="auth-form"><label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></label><button type="submit">Send reset link</button></form> :
      mode==="signup" ? <form action={signUp} className="auth-form"><label>Full name<input name="display_name" required autoComplete="name" placeholder="Your full name"/></label><label>Email address<input name="email" type="email" required autoComplete="email" placeholder="you@example.com"/></label><label>Password<input name="password" type="password" minLength={10} required autoComplete="new-password" placeholder="At least 10 characters"/></label><button type="submit">Create account</button></form> :
      <form action={signIn} className="auth-form"><label>Email address<input name="email" type="email" required autoComplete="username" placeholder="you@example.com"/></label><label>Password<input name="password" type="password" required autoComplete="current-password" placeholder="Enter your password"/></label><div className="auth-inline"><Link href="/login?mode=reset">Forgot password?</Link></div><button type="submit">Sign in securely</button></form>}
      <div className="auth-switch">{mode==="login"?<>New to NAASCONNECT? <Link href="/login?mode=signup">Create an account</Link></>:<>Already have an account? <Link href="/login">Sign in</Link></>}</div>
      <p className="auth-security">Your access is protected by Supabase authentication and organization-scoped permissions. Creating an account does not automatically grant administrator privileges.</p>
    </div></section>
  </main>;
}
