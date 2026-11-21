# NAASCONNECT Nigeria — Stage 5.5: Executive Onboarding & Organizational Management

## Implemented
- Organization-scoped executive portfolio catalogue.
- Portfolio title, description, responsibilities, display order, required/optional flag, and suggested term duration (1–60 months).
- Administrative save/upsert RPC guarded by `private.can_administer_org`, preserving jurisdictional hierarchy.
- Existing leadership positions can be linked to matching portfolio keys; current holder and handover authority remain controlled by Stage 5.4.
- Member-visible executive directory RPC returns only position details and public profile fields, and only to active members of that organization or administrators with jurisdiction.
- Directory computes term indicators: vacant, active without end date, term ending within 60 days, and expired.
- Existing Stage 5.4 initial appointment/handover requests remain the only route for assigning a person to a position. A new executive must be an active member with verified email; approval follows the parent-level chain.
- New foreign-key and term indexes.

## Database objects
- `public.org_executive_portfolios`
- Added `portfolio_id` and `appointment_notes` to `public.org_leadership_positions`
- Scoped term update RPC: `public.set_executive_term`
- RPCs: `public.save_executive_portfolio`, `public.get_org_executive_directory`
- Private implementation functions with restricted execute grants.

## Applied migrations
- `20261121140551_stage5_5_executive_portfolios_directory_term_management`
- `20261121140620_stage5_5_1_harden_directory_rpc_and_fk_indexes`
- `20261121140642_stage5_5_2_scoped_executive_term_updates`

## Security and verification
- RLS enabled on the new public portfolio table.
- Portfolio reads require active organization membership or administrative jurisdiction.
- Portfolio writes and executive term changes are only possible through authenticated RPCs, which verify `private.can_administer_org`.
- Term updates only apply to active appointments and reject end dates earlier than the appointment start.
- Directory access requires authentication plus active membership or administrative jurisdiction.
- Public/anon cannot execute either RPC.
- Directory RPC is a SECURITY INVOKER API wrapper; its private SECURITY DEFINER implementation validates organization scope before returning only display-name/avatar fields and executive data.
- Security advisor: no remaining findings after the hardening migration.
- Health advisor: no findings.
- Performance advisor: new foreign-key indexes added. Unused-index notices are expected before application traffic.
- No live executive or portfolio records were fabricated. Current portfolio count and leadership position count are both zero; actual rosters must be configured by authorized administrators.

## Not yet delivered in this backend stage
- Frontend appointment-review dashboards and executive management screens.
- Automated email/push delivery and scheduled term-expiry reminders.
- Real-account end-to-end approval tests require authenticated test users and a seeded test organization.
- No standard portfolio catalogue was preloaded because official executive titles and portfolios may vary by organization and must be confirmed by NAAS leadership.

## Operational workflow
1. An authorized administrator configures the organization's executive portfolios and responsibilities.
2. The administrator submits an initial appointment through the existing Stage 5.4 handover RPC.
3. The nominee must already have an active organization membership and verified email.
4. The parent-level authority reviews the appointment.
5. Upon approval, the position becomes active and term end dates and appointment notes can be maintained by an authorized administrator.
6. Handover requests use the same approval chain and preserve the audit history.
