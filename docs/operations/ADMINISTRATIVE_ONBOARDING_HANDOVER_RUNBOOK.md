# NAASCONNECT — Administrative onboarding and handover runbook

Updated: 28 November 2026

This document describes how the organization should onboard real officers when the website is handed over. It distinguishes implemented application/database workflows from production setup and first-appointment steps that still require authorized human action.

## 1. The hierarchy

The current organization structure is:

1. National level.
2. Three Union Conferences: Eastern Nigerian Union Conference, Northern Nigerian Union Conference, and Western Nigerian Union Conference.
3. Twenty Zones, allocated to their parent unions.
4. Campus/university and local-church organizations under their appropriate parent Zone.
5. Ordinary members, who join a campus or church and are reviewed as members.

The portal selector is an entry-point selector, not a role-granting mechanism. The database's active appointment/membership assignment determines which workspace a person may enter and which organization they can administer.

## 2. First-time launch: establish the National President

The first National administrator is a special bootstrap because there is no active National administrator who can approve that first seat. It must not be self-approved.

Handover procedure:
1. The NAAS/church owner or designated governing authority confirms the identity and authority of the person who is to become the first National President.
2. A designated technical custodian performs the documented, audited first-seat bootstrap using the approved server-side administrative process. The custodian must not use a public signup form, shared password, or browser-exposed service-role key.
3. The appointee receives an invitation at their verified personal/official email.
4. The appointee opens the invitation, signs in using that exact email, sets their own password, completes their profile, and accepts the appointment.
5. The system activates the National administrator membership only after verifying the invited user, invitation state and appointment. The National workspace becomes accessible.

The first bootstrap is an operational dependency; it is not completed merely because the National login page exists.

## 3. Normal appointment chain after bootstrap

### National → Union Presidents
1. The National President signs into the National portal.
2. They open Administrator onboarding.
3. They select a reserved seat for one of the three Union Conferences and enter the nominee's name and email.
4. The nomination is submitted to the approval authority recorded for that seat.
5. The authorized reviewer approves or rejects it. Rejections require a reason and are recorded.
6. After approval, the authorized administrator sends the secure invitation.
7. The nominee uses the invited email, sets a personal password, completes their profile and accepts.
8. The Union administrator assignment is activated and the Union workspace becomes available for that Union only.

### Union → Zone Presidents
1. Each Union President signs into their own Union portal.
2. They nominate Zone Presidents only for seats belonging to their own Union.
3. The nomination is reviewed by the approval authority defined for the relevant Zone seat.
4. After approval, an invitation is sent.
5. The nominee accepts, sets a personal password and completes their profile.
6. The Zone administrator assignment activates, scoped to that Zone and its authorized descendants.

The Union portal must not expose another Union's seats or data. The National portal must not allow a Union administrator to act as National.

### Zone → Campus and church administrators
1. The Zone President opens Administrator onboarding.
2. They nominate the appropriate campus/university or local-church administrator for an existing organization under their Zone.
3. The parent-level authority reviews the appointment.
4. After approval, the nominee receives an invitation and completes the same secure acceptance process.
5. The activated administrator can manage only the assigned campus or church workspace.

The organization record must exist and be linked to the correct parent Zone before the appointment can be completed. Do not create duplicate organizations to work around a missing record; correct the hierarchy record through the approved data-maintenance process.

## 4. What the nominee experiences

The invitation email contains a secure link. The nominee:
1. Opens the link and signs in with the exact invited email address.
2. Is checked against the invitation's user ID, email and current status.
3. Completes their name and phone details.
4. Creates and confirms a personal password (minimum 12 characters in the current completion form).
5. Accepts the appointment.
6. The server-side activation function activates the reserved administrator assignment.
7. On subsequent sign-in, they choose their portal and are sent to the workspace associated with their active assignment.

A member account, a Zone account, and a Union account are not interchangeable. If one person is formally appointed to more than one scope, the database must hold each authorized assignment; access to each scope is still checked independently.

## 5. Executive Committee (EXCO) setup after the president is active

1. The appointed president opens Executive / Leadership management for their organization.
2. They reviews the portfolio positions configured for that organization (for example, secretary, treasurer and other approved offices).
3. They add or confirm the organization's positions and responsibilities where the model permits.
4. They select eligible existing members as nominees. A nominee must already have an active membership in that organization and a verified Auth email.
5. Initial appointments and later handovers are submitted through the leadership workflow.
6. The parent-level authority reviews the request. The submitter cannot approve their own request, and the outgoing incumbent cannot approve their own replacement.
7. On approval, the active position holder changes, the history is retained, and an in-platform notification/announcement event is recorded.

Do not invent EXCO names, create dummy profiles, or appoint someone without the organization's confirmation. The president configures the actual executive team after their own appointment is active.

## 6. Ordinary member onboarding (separate from administrator onboarding)

1. The person selects Member portal and creates a member account.
2. They confirm their email and complete the member profile.
3. They select the relevant existing campus or church and submit a membership request.
4. The request remains pending; it does not grant administrator rights.
5. The authorized campus/church administrator reviews and approves or rejects the request.
6. An approved member can use the member workspace and the services permitted to ordinary members.

## 7. What is implemented versus what remains before handover

### Implemented in the repository/backend
- Reserved administrator seats and the approval hierarchy.
- Database-backed appointment request, review and invitation states.
- Authenticated RPC boundaries for nomination and review.
- JWT-protected Edge Function for invitations and activation.
- Administrator onboarding UI at `/admin/onboarding`.
- Invitation acceptance/profile/password completion UI at `/admin/invitation/complete`.
- Portal-specific login entry points and role/organization assignment checks.
- Executive portfolio and leadership handover backend plus the management interface.
- Server-side checks that the invite belongs to the signed-in user and invited email.

### Still required before operational handover
- Fix the currently failing GitHub TypeScript quality gate and obtain a passing production build and Playwright run.
- Verify production Supabase Auth email/SMTP, Site URL, redirect allow-list and Edge Function `APP_ORIGIN`; send and accept a real test invitation.
- Complete the separately controlled first National President bootstrap after written/recorded authority verification.
- Run end-to-end tests with designated test accounts at National, each Union, a Zone, a campus/church and an ordinary member. Verify cross-scope denials.
- Confirm the canonical list of all 20 Zones and their parent-union mapping, plus campuses/churches and parent mappings, against the approved organizational records.
- Seed/confirm leadership portfolio positions and run a test leadership appointment/handover before real officers use it.
- Provide a read-only demonstration environment or demo data if stakeholders need to inspect dashboards before real appointments. Demo access must never be an admin role or use production member records.

No real administrator should be promised live access until an appointment is approved, an invitation is accepted, and the active assignment is present.

## 8. Handover checklist

- [ ] Approved National President identity and bootstrap authorization recorded.
- [ ] National invitation delivered and accepted.
- [ ] Three Union Presidents appointed and activated.
- [ ] All 20 Zone Presidents appointed and activated under the correct Union.
- [ ] Campus/church records reconciled to the approved list.
- [ ] Campus/church administrators appointed as required.
- [ ] EXCO portfolios confirmed and actual officers appointed.
- [ ] Member signup and membership approval tested.
- [ ] Cross-portal and cross-organization denial tests pass.
- [ ] SMTP and invitation acceptance tested.
- [ ] GitHub quality gate and Vercel deployment pass.
- [ ] Admin handover guide and recovery/contact procedure delivered.

## Security rules for the handover team

- Never share one default password across officers.
- Never ask an appointee to send their password to an administrator.
- Never use portal selection as proof of authority.
- Never expose the Supabase service-role key in frontend code.
- Never bypass RLS or create an active membership manually just to make a dashboard visible.
- Revoke or hand over access when an officer's term ends; use the recorded leadership handover workflow.
