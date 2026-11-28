import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn, signUp, requestPasswordReset, resendConfirmation } from "@/app/auth/actions";
import RegistrationFields from "./RegistrationFields";

type Portal = "member" | "national" | "union" | "zone" | "institution";
const zoneOptions = [
 { slug: "abia-zone", name: "Abia Zone" },
 { slug: "akwa-ibom-zone", name: "Akwa Ibom Zone" },
 { slug: "anambra-zone", name: "Anambra Zone" },
 { slug: "cross-river-zone", name: "Cross River Zone" },
 { slug: "delta-zone", name: "Delta Zone" },
 { slug: "ebonyi-zone", name: "Ebonyi Zone" },
 { slug: "edo-zone", name: "Edo Zone" },
 { slug: "ekiti-zone", name: "Ekiti Zone" },
 { slug: "enugu-zone", name: "Enugu Zone" },
 { slug: "imo-zone", name: "Imo Zone" },
 { slug: "kwara-kogi-zone", name: "Kwara / Kogi Zone" },
 { slug: "lagos-zone", name: "Lagos Zone" },
 { slug: "north-central-nigeria-zone", name: "North-Central Nigeria Zone" },
 { slug: "north-east-nigeria-zone", name: "North-East Nigeria Zone" },
 { slug: "north-west-nigeria-zone", name: "North-West Nigeria Zone" },
 { slug: "ogun-zone", name: "Ogun Zone" },
 { slug: "ondo-zone", name: "Ondo Zone" },
 { slug: "osun-zone", name: "Osun Zone" },
 { slug: "oyo-zone", name: "Oyo Zone" },
 { slug: "rivers-bayelsa-zone", name: "Rivers & Bayelsa Zone" },
];
const portalConfig: Record<Portal,{title:string;kicker:string;description:string;workspace:string;signup:boolean}> = {
 member:{title:"Member sign in",kicker:"MEMBER COMMUNITY",description:"Your membership, campus community, updates and personal account.",workspace:"NAASCONNECT MEMBER PORTAL",signup:true},
 national:{title:"National administration",kicker:"NATIONAL LEADERSHIP",description:"Secure entry for appointed National-level administrators only.",workspace:"NATIONAL ADMINISTRATOR PORTAL",signup:false},
 union:{title:"Union administration",kicker:"UNION LEADERSHIP",description:"Secure entry for administrators appointed to a specific Union Conference.",workspace:"UNION ADMINISTRATOR PORTAL",signup:false},
 zone:{title:"Zonal administration",kicker:"ZONAL LEADERSHIP",description:"Secure entry for administrators appointed to a specific Zone.",workspace:"ZONAL ADMINISTRATOR PORTAL",signup:false},
 institution:{title:"Institution administration",kicker:"CAMPUS & CHURCH LEADERSHIP",description:"Secure entry for appointed campus and local-church administrators.",workspace:"INSTITUTION ADMINISTRATOR PORTAL",signup:false},
};
type Props = { searchParams: Promise<{ mode?: string; error?: string; message?: string; portal?: string }> };
export default async function LoginPage({ searchParams }: Props) {
 const params=await searchParams;
 const portal=(params.portal&&params.portal in portalConfig?params.portal:"member") as Portal;
 const config=portalConfig[portal];
 const mode=params.mode??"login";
 if(mode==="signup"&&!config.signup) redirect("/login?portal="+portal+"&error=Administrator%20accounts%20are%20created%20through%20verified%20appointments.%20Contact%20your%20appointing%20authority.");
 return <main className={"auth-shell auth-portal-"+portal} data-portal={portal}>
  <section className="auth-brand-panel">
   <div className="auth-brand-logos"><Image src="/brand/naas-logo.png" alt="NAAS" width={62} height={62} priority/><Image src="/brand/naasconnect-logo.png" alt="NAASCONNECT" width={220} height={62} priority/></div>
   <div className="auth-brand-copy"><span>{config.kicker}</span><h1>{portal==="member"?"One family. Connected in purpose.":config.title+"."}</h1><p>{config.description}</p><div className="auth-portal-badge">{config.workspace}</div></div>
   <div className="auth-brand-footer">NAASCONNECT NIGERIA · SECURE ACCESS</div>
  </section>
  <section className="auth-form-panel"><div className="auth-form-wrap">
   <Link href="/portals" className="auth-back">← Choose a different portal</Link>
   <div className="auth-form-heading"><span>{config.workspace}</span><h2>{mode==="signup"?"Create your member account":mode==="reset"?"Reset your password": "Sign in to "+(portal==="member"?"your account":portal+" administration")}</h2><p>{mode==="signup"?"Create your NAASCONNECT member identity.":mode==="reset"?"We’ll send a secure password reset link to your email.":config.description}</p></div>
   {params.error&&<div className="auth-alert error" role="alert">{params.error}</div>}
   {params.message&&<div className="auth-alert success" role="status">{params.message}</div>}
   {mode==="reset"?<form action={requestPasswordReset} className="auth-form"><input type="hidden" name="portal" value={portal}/><label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com"/></label><button type="submit">Send reset link</button></form>:
    mode==="signup"?<form action={signUp} className="auth-form"><label>Full name<input name="display_name" required autoComplete="name" placeholder="Your full name"/></label><label>Phone number<input name="phone" type="tel" required autoComplete="tel" placeholder="+234 800 000 0000"/></label><label>Email address<input name="email" type="email" required autoComplete="email" placeholder="you@example.com"/></label><RegistrationFields/><label>Password<input name="password" type="password" minLength={10} required autoComplete="new-password" placeholder="At least 10 characters"/></label><button type="submit">Create member account</button></form>:
    <form action={signIn} className="auth-form"><input type="hidden" name="portal" value={portal}/>{portal==="zone"&&<label>Select your Zone<select name="org_slug" required defaultValue=""><option value="" disabled>Choose your assigned Zone</option>{zoneOptions.map(zone=><option key={zone.slug} value={zone.slug}>{zone.name}</option>)}</select></label>}<label>Email address<input name="email" type="email" required autoComplete="username" placeholder="Enter your assigned account email"/></label><label>Password<input name="password" type="password" required autoComplete="current-password" placeholder="Enter your password"/></label><div className="auth-inline"><Link href={"/login?portal="+portal+"&mode=reset"}>Forgot password?</Link></div><button type="submit">Enter {portal==="member"?"member":"administrator"} workspace</button></form>}
   {portal==="member"?<div className="auth-switch">{mode==="login"?<>New to NAASCONNECT? <Link href="/login?portal=member&mode=signup">Create a member account</Link></>:<>Already registered? <Link href="/login?portal=member">Sign in</Link></>}</div>:<div className="auth-admin-invite-note"><b>Administrator account access is invitation-only.</b><p>You cannot create a National, Union, Zone or Institution administrator account from this page. The authorized appointing authority must approve your appointment and send your invitation first.</p><Link href="/portals">View all portal entry points</Link></div>}
   {mode==="login"&&<form action={resendConfirmation} className="auth-resend-form"><label>Didn’t receive your verification email?<input name="email" type="email" required placeholder="Enter your registration email"/></label><button type="submit">Resend confirmation email</button></form>}
   <p className="auth-security">This entry point accepts only accounts with an active assignment for this portal. An account belonging to another portal cannot be used here.</p>
  </div></section>
 </main>;
}
