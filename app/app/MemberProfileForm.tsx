"use client";

import { useState } from "react";

const states = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

type Profile = {
 display_name?: string | null; phone?: string | null; member_category?: string | null;
 institution_name?: string | null; course_of_study?: string | null; level_of_study?: string | null;
 state_of_admission?: string | null; residential_state?: string | null;
 preferred_region_state?: string | null; state_of_origin?: string | null;
};

export default function MemberProfileForm({ action, profile, displayName, metadata }: {
 action: (formData: FormData) => void | Promise<void>;
 profile: Profile | null;
 displayName: string;
 metadata: Record<string, unknown>;
}) {
 const [category,setCategory] = useState(profile?.member_category === "non_student" ? "non_student" : profile?.member_category === "student" ? "student" : metadata.member_category === "non_student" ? "non_student" : metadata.member_category === "student" ? "student" : "");
 const meta = (key:string) => typeof metadata[key] === "string" ? metadata[key] as string : "";
 return <form action={action} className="member-profile-form">
  <label>Full name<input name="display_name" required minLength={2} maxLength={120} defaultValue={profile?.display_name ?? displayName}/></label>
  <label>Phone number<input name="phone" type="tel" maxLength={32} defaultValue={profile?.phone ?? meta("phone")}/></label>
  <label>Membership category<select name="member_category" required value={category} onChange={e=>setCategory(e.target.value)}><option value="">Choose category</option><option value="student">Student</option><option value="non_student">Non-student</option></select></label>
  {category === "student" && <fieldset className="profile-fieldset"><legend>Student / campus details</legend>
   <label>Institution / school<input name="institution_name" required maxLength={180} defaultValue={profile?.institution_name ?? meta("institution_name")}/></label>
   <label>Course of study<input name="course_of_study" maxLength={120} defaultValue={profile?.course_of_study ?? meta("course_of_study")}/></label>
   <label>Level of study<input name="level_of_study" maxLength={80} defaultValue={profile?.level_of_study ?? meta("level_of_study")}/></label>
   <label>State where your institution is located<select name="state_of_admission" required defaultValue={profile?.state_of_admission ?? meta("state_of_admission")}><option value="">Choose state</option>{states.map(s=><option key={s}>{s}</option>)}</select></label>
   <p className="profile-help">Your selected institution state automatically assigns your provisional Zone and Union using the current approved state coverage. Verified university matching will be added when the national institution directory is supplied.</p>
  </fieldset>}
  {category === "non_student" && <fieldset className="profile-fieldset"><legend>Non-student / church details</legend>
   <label>Residential state<select name="residential_state" required defaultValue={profile?.residential_state ?? meta("residential_state")}><option value="">Choose state of residence</option>{states.map(s=><option key={s}>{s}</option>)}</select></label>
   <label>Preferred church / administrative region<select name="preferred_region_state" required defaultValue={profile?.preferred_region_state ?? meta("preferred_region_state")}><option value="">Choose preferred region</option>{states.map(s=><option key={s}>{s}</option>)}</select></label>
   <p className="profile-help">Your residential state and preferred church region are separate details. Church eligibility is checked against your preferred region.</p>
  </fieldset>}
  <label>State of origin<input name="state_of_origin" maxLength={80} defaultValue={profile?.state_of_origin ?? meta("state_of_origin")}/></label>
  <div className="profile-submit-row"><small>Your information is saved to your member profile. Organization eligibility is checked securely when you request membership.</small><button type="submit">Save profile</button></div>
 </form>;
}
