"use client";

import { useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, Building2, CheckCircle2, ChevronDown, ChevronRight, Clock3, FileSearch, Filter, Landmark, LockKeyhole, MoreHorizontal, Search, ShieldCheck, Users, XCircle } from "lucide-react";

type Props = { active: string };
const requests = [
  { id:"MEM-2048", name:"Member application", detail:"Campus / ASF membership", org:"Campus scope", date:"Today · 10:42 AM", state:"Pending review", initials:"AM" },
  { id:"MEM-2047", name:"Membership transfer", detail:"Church to campus affiliation", org:"Connected organization", date:"Yesterday · 4:18 PM", state:"Pending review", initials:"KO" },
  { id:"MEM-2045", name:"Profile correction", detail:"Membership record update", org:"Campus scope", date:"21 Nov · 1:06 PM", state:"Needs information", initials:"TO" },
];
const audit = [
  ["10:42 AM","Membership review requested","MEM-2048","Membership workflow"],
  ["Yesterday","Leadership transition submitted","TRN-0082","Leadership workflow"],
  ["20 Nov","Organization profile updated","ORG-0104","Organization record"],
];
const titles: Record<string,string> = {
  Administration:"Administration overview",
  "Membership review":"Membership review",
  Organizations:"Organizations",
  Leadership:"Leadership & appointments",
  "Audit history":"Audit history",
};
export default function AdminWorkspace({active}:Props){
 const [search,setSearch]=useState("");
 const [filter,setFilter]=useState("All requests");
 const filtered=useMemo(()=>requests.filter(r=>(r.name+" "+r.id+" "+r.detail).toLowerCase().includes(search.toLowerCase())&&(filter==="All requests"||r.state===filter)),[search,filter]);
 const heading=titles[active]||"Administration overview";
 return <section className="admin-workspace">
  <div className="admin-context"><div className="admin-context-icon"><ShieldCheck size={19}/></div><div><b>Scoped administration workspace</b><span>Sample interface · No live records or permissions are being exercised</span></div><div className="scope-lock"><LockKeyhole size={13}/> Role & organization scope enforced by backend</div></div>
  {active==="Administration"||active==="Overview" ? <>
   <div className="admin-page-heading"><div><div className="section-kicker">AUTHORIZED WORKSPACE</div><h2>{heading}</h2><p>Review activity and manage only the organizations assigned to your approved role.</p></div><span className="admin-scope-chip">Example: Zone-level scope</span></div>
   <div className="admin-metrics">
    <article><div className="metric-top"><span>Pending membership reviews</span><Users size={17}/></div><strong>08</strong><small><span className="metric-warn">Needs attention</span> · sample count</small></article>
    <article><div className="metric-top"><span>Organizations in scope</span><Building2 size={17}/></div><strong>12</strong><small>Visible within assigned jurisdiction</small></article>
    <article><div className="metric-top"><span>Leadership requests</span><Landmark size={17}/></div><strong>03</strong><small>Awaiting designated approval</small></article>
    <article><div className="metric-top"><span>Recent administrative activity</span><Activity size={17}/></div><strong>24</strong><small>Illustrative last 30 days</small></article>
   </div>
   <div className="admin-dashboard-grid">
    <section className="admin-panel"><div className="admin-panel-head"><div><span className="section-kicker">REQUIRES ATTENTION</span><h3>Review queue</h3></div><span className="admin-count">3 examples</span></div>{requests.slice(0,3).map(r=><div className="review-row" key={r.id}><div className="review-avatar">{r.initials}</div><div className="review-main"><b>{r.name}</b><span>{r.detail} · {r.id}</span></div><span className={r.state==="Needs information"?"status-tag status-muted":"status-tag"}>{r.state}</span><ChevronRight size={16}/></div>)}<div className="admin-panel-foot">Review actions require an authenticated, active role with membership.review permission in the relevant scope.</div></section>
    <section className="admin-panel"><div className="admin-panel-head"><div><span className="section-kicker">YOUR AUTHORITY</span><h3>Scope & approval chain</h3></div><LockKeyhole size={17}/></div><div className="authority-box"><span className="authority-label">Illustrative assigned scope</span><b>One approved organization</b><small>Role assignment is bound to an organization ID—not a global administrator flag.</small></div><div className="approval-chain"><div><span className="chain-dot current"/> <span><b>Assigned administrator</b><small>May act only within the assigned scope</small></span></div><div><span className="chain-dot"/> <span><b>Next-level approving authority</b><small>Reviews transitions and escalations where required</small></span></div><div><span className="chain-dot"/> <span><b>National oversight</b><small>Only where the approved workflow assigns authority</small></span></div></div></section>
    <section className="admin-panel admin-wide"><div className="admin-panel-head"><div><span className="section-kicker">RECENT CHANGES</span><h3>Administrative activity</h3></div><span className="admin-readonly">Read-only preview</span></div>{audit.map(a=><div className="audit-row" key={a[2]}><Clock3 size={15}/><span>{a[0]}</span><b>{a[1]}</b><code>{a[2]}</code><small>{a[3]}</small></div>)}</section>
   </div>
  </> : active==="Membership review" ? <>
   <div className="admin-page-heading"><div><div className="section-kicker">MEMBERSHIP WORKFLOW</div><h2>{heading}</h2><p>Review requests routed to this administrator’s permitted organization scope.</p></div><span className="admin-scope-chip">Scoped queue only</span></div>
   <div className="admin-toolbar"><label className="admin-search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search request ID, type or detail"/></label><label className="admin-filter"><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All requests</option><option>Pending review</option><option>Needs information</option></select><ChevronDown size={14}/></label></div>
   <section className="admin-panel"><div className="admin-panel-head"><div><span className="section-kicker">INCOMING REQUESTS</span><h3>{filtered.length} sample requests</h3></div><span className="admin-readonly">Preview data</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>REQUEST</th><th>REQUEST TYPE</th><th>ORGANIZATION SCOPE</th><th>SUBMITTED</th><th>STATUS</th><th></th></tr></thead><tbody>{filtered.map(r=><tr key={r.id}><td><b>{r.id}</b><small>{r.name}</small></td><td>{r.detail}</td><td>{r.org}</td><td>{r.date}</td><td><span className="status-tag">{r.state}</span></td><td><button className="table-more" aria-label={"More options for "+r.id}><MoreHorizontal size={17}/></button></td></tr>)}</tbody></table></div><div className="admin-boundary-note"><LockKeyhole size={15}/> Approve, decline or request changes will be enabled only after server-side permission checks and the approved review RPC are connected.</div></section>
  </> : active==="Organizations" ? <>
   <div className="admin-page-heading"><div><div className="section-kicker">ORGANIZATION DIRECTORY</div><h2>{heading}</h2><p>Organizations are connected through approved relationships, not assumed to be a single parent-child chain.</p></div><span className="admin-scope-chip">Visible organizations only</span></div>
   <div className="org-admin-grid">{[{n:"National",d:"National-level organization",c:"1"},{n:"Union",d:"Union organizations in scope",c:"2"},{n:"Zone",d:"Zones in assigned jurisdiction",c:"4"},{n:"Campus / ASF",d:"Student fellowships",c:"8"},{n:"Local church",d:"Connected church records",c:"6"}].map(o=><article key={o.n}><div className="org-admin-icon"><Building2 size={18}/></div><span>{o.n}</span><strong>{o.c}</strong><small>{o.d}</small></article>)}</div>
   <section className="admin-panel org-relationship"><div className="admin-panel-head"><div><span className="section-kicker">STRUCTURE & RELATIONSHIPS</span><h3>How organizations connect</h3></div><span className="admin-readonly">Conceptual view</span></div><div className="relationship-flow"><div><Landmark/><b>National</b></div><ChevronDown/><div><Building2/><b>Union</b></div><ChevronDown/><div><Building2/><b>Zone</b></div><ChevronDown/><div className="relationship-branches"><span><Building2/><b>Campus / ASF</b><small>Student fellowship</small></span><span><Building2/><b>Local church</b><small>Separate organization type</small></span></div></div><p className="admin-boundary-note">Campus-to-church relationships and Conference/Mission oversight are represented as explicit relationships where applicable—not forced into the primary hierarchy.</p></section>
  </> : active==="Leadership" ? <>
   <div className="admin-page-heading"><div><div className="section-kicker">LEADERSHIP GOVERNANCE</div><h2>{heading}</h2><p>Appointments, terms and handovers retain history and follow the designated next-level approval chain.</p></div><span className="admin-scope-chip">No self-approval</span></div>
   <div className="leadership-cards"><article><span>Campus / ASF transition</span><b>Zone authority</b><small>Approval required for campus leadership handover</small></article><article><span>Zone transition</span><b>Union authority</b><small>Approval required for zone leadership handover</small></article><article><span>Union transition</span><b>National authority</b><small>Approval required for union leadership handover</small></article><article><span>National transition</span><b>Authority pending formal designation</b><small>Do not infer or invent an approving role</small></article></div>
   <section className="admin-panel"><div className="admin-panel-head"><div><span className="section-kicker">TRANSITION CONTROL</span><h3>Leadership safeguards</h3></div><ShieldCheck size={18}/></div><div className="safeguard-list"><p><CheckCircle2/> Current and incoming executive terms are retained as history; a transition does not overwrite the previous term.</p><p><CheckCircle2/> The submitter cannot approve their own elevation or handover request.</p><p><CheckCircle2/> Approval is routed to the designated next-level organization and role.</p><p><CheckCircle2/> Scoped administrators cannot appoint or manage peer organizations outside their jurisdiction.</p></div></section>
  </> : <>
   <div className="admin-page-heading"><div><div className="section-kicker">ACCOUNTABILITY</div><h2>{heading}</h2><p>Append-only administrative event history, with sensitive values excluded.</p></div><span className="admin-scope-chip">Restricted access</span></div>
   <section className="admin-panel"><div className="admin-panel-head"><div><span className="section-kicker">RECENT EVENTS</span><h3>Audit trail · illustrative entries</h3></div><FileSearch size={18}/></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>TIME</th><th>ACTIVITY</th><th>REFERENCE</th><th>SOURCE</th></tr></thead><tbody>{audit.map(a=><tr key={a[2]}><td>{a[0]}</td><td><b>{a[1]}</b></td><td><code>{a[2]}</code></td><td>{a[3]}</td></tr>)}</tbody></table></div><div className="admin-boundary-note"><LockKeyhole size={15}/> Audit records are read-only to administrators; visibility is restricted by the approved audit access policy. Passwords, tokens and secret values must never appear here.</div></section>
  </>}
  <div className="admin-preview-foot"><ShieldCheck size={15}/><span>Interface preview only. No membership, organization, leadership or audit record can be changed from this screen until the live authenticated services and scoped authorization policies are connected.</span></div>
 </section>;
}
