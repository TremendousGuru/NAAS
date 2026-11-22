"use client";

import { useState } from "react";

const states = ["Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara"];

export default function RegistrationFields() {
 const [category,setCategory]=useState("student");
 return <>
  <label>Membership category
   <select name="member_category" value={category} onChange={e=>setCategory(e.target.value)} required>
    <option value="student">Student / ASF member</option>
    <option value="non_student">Non-student / participating member</option>
   </select>
  </label>
  {category==="student" ? <>
   <label>State where you are studying
    <select name="state" required defaultValue=""><option value="" disabled>Select your state</option>{states.map(s=><option key={s}>{s}</option>)}</select>
   </label>
   <label>School / institution
    <input name="institution_name" required autoComplete="organization" placeholder="Name of university, college or institution"/>
   </label>
   <label>Course of study <span className="auth-field-optional">(optional)</span>
    <input name="course_of_study" placeholder="e.g. Computer Science"/>
   </label>
   <label>Current level <span className="auth-field-optional">(optional)</span>
    <select name="level_of_study" defaultValue=""><option value="">Select level (optional)</option><option>100 Level</option><option>200 Level</option><option>300 Level</option><option>400 Level</option><option>500 Level</option><option>600 Level</option><option>Postgraduate</option><option>Other</option></select>
   </label>
  </> : <>
   <label>State where you currently reside
    <select name="residential_state" required defaultValue=""><option value="" disabled>Select your state</option>{states.map(s=><option key={s}>{s}</option>)}</select>
   </label>
   <label>State / region of connection
    <select name="state" required defaultValue=""><option value="" disabled>Select your preferred NAAS region</option>{states.map(s=><option key={s}>{s}</option>)}</select>
   </label>
   <p className="auth-help-note">You can connect to a participating local church or other recognized NAAS community after your account is verified. Your account will not be assigned an organization or administrator role automatically.</p>
  </>}
 </>;
}
