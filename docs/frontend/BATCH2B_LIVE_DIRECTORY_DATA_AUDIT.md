# Batch 2B — Live Directory Data Audit

**Checked:** 28 November 2026 (post-approval update)  
**Repository:** `TremendousGuru/NAAS`  
**Branch:** `feature/naasconnect-mobile-multipage-intro`  
**Supabase project:** `csytneubatlaakpmnsfk`  
**Live preview:** https://naasconnect-nigeria-qsgo54qb2-tredexhq-6708.vercel.app  
**Deployment commit:** `543a72dcc4fb643a0b3f2e073a1d2e0f8ab75063`

## 1. Verified live database inventory

Read-only query of `public.org_units` returned 24 records:

| Organization type | Active | Pending | Total |
|---|---:|---:|---:|
| National | 1 | 0 | 1 |
| Union | 3 | 0 | 3 |
| Zone | 20 | 0 | 20 |
| Campus / ASF | 0 | 0 | 0 |
| Church | 0 | 0 | 0 |
| **Total** | **1** | **23** | **24** |

The active records are **Nigeria Association of Adventist Students**, all three approved Union organizations, and all twenty approved Zone organizations. There are currently no campus/ASF or church records in `org_units`.

The directory UI intentionally queries only records with `status = 'active'` and only `org_type = 'campus'` or `org_type = 'church'`. Therefore both directory tabs correctly show an empty-state message today. They must not display pending organizations or invented sample churches/fellowships.

## 2. Current union and zone records

The live database contains these pending union records:

- Eastern Nigeria Union Conference (`enuc`)
- Northern Nigeria Union Conference (`nnuc`)
- Western Nigeria Union Conference (`wnuc`)

The twenty activated zone records are:

- Abia Zone
- Akwa Ibom Zone
- Anambra Zone
- Cross River Zone
- Delta Zone
- Ebonyi Zone
- Edo Zone
- Ekiti Zone
- Enugu Zone
- Imo Zone
- Kwara / Kogi Zone
- Lagos Zone
- North-Central Nigeria Zone
- North-East Nigeria Zone
- North-West Nigeria Zone
- Ogun Zone
- Ondo Zone
- Osun Zone
- Oyo Zone
- Rivers & Bayelsa Zone

These records preserve their current parent relationships and state/conference metadata in Supabase. Their activation was explicitly approved by the project owner on 28 November 2026. Their parent relationships were preserved and verified before activation.

## 3. Previously supplied source-list check

The project Library was searched for the church, campus/ASF, mission/conference and organization lists. The located Master Product Requirements Documents describe the organizational model and identify supplied lists as seed/reference data requiring validation, but the retrieved documents do not contain a complete authoritative church or campus directory roster.

The PRD describes the following as provisional union groupings:
- Western Nigeria Union Conference (WNUC NAAS)
- Northern Nigeria Union Conference (NNUC NAAS)
- Eastern Nigeria Union Conference (ENUC NAAS)

Do not treat these provisional groupings or pending zone records as evidence that local churches or campus fellowships have been supplied, verified or activated.

## 4. Live preview route

The directory is currently a member-only route:
- `/app/directory?type=campus`
- `/app/directory?type=church`

Preview base URL:
`https://naasconnect-nigeria-qsgo54qb2-tredexhq-6708.vercel.app`

The route requires a signed-in member. The current `org_units` SELECT RLS policy grants visibility to the `authenticated` role for active organizations (and scoped administrators for their permitted records); it does not grant anonymous public access. A public directory cannot safely be enabled by frontend code alone. It requires an approved database read policy or a narrowly scoped public RPC, which is a database security change and is held while the migration-integrity/recovery gate remains unresolved.

## 5. Frontend and deployment verification

- The latest branch deployment for commit `543a72d` is Vercel `READY`.
- GitHub workflow run `46096184867` completed successfully.
- Its quality-gate job passed TypeScript validation, production build and Playwright production-browser checks.
- The live directory pages are built from the deployed branch; the empty-state is expected given the current live database records.

## 6. Remaining directory data and implementation requirements

1. Recover the exact church roster and campus/ASF roster from the user-provided source material or the responsible organization. The project files retrieved in this audit do not contain complete rosters.
2. Validate each record's official name, parent organization, state, LGA/location, institution (for ASF), conference/mission relationship, contact details, and authorization to publish.
3. Import records as pending/unverified first, preserving provenance; do not mark them active automatically.
4. Have the authorized scoped administrators review and activate only confirmed records.
5. Improve directory search/pagination so it scales beyond a fixed first-page fetch.
6. Add public discovery only after an approved, narrowly scoped anonymous read design is available and the database migration/recovery gate has passed.
7. Add end-to-end coverage for search, filtering, pagination, organization detail, membership eligibility and RLS boundaries.

## Safety and source-of-truth rules

- GitHub remains the source of truth for application structure.
- Supabase remains the source of truth for live organization records and their current status.
- No data was inserted or deleted during this post-approval update. Exactly 3 Union and 20 Zone organization records were changed from pending to active in one guarded transaction after verifying the National → Union → Zone hierarchy.
- No migration or schema change was applied.
- Do not fabricate or infer church/campus records from conference/zone names.


## 7. Post-approval activation — 28 November 2026

The project owner explicitly approved activation of the three Union and twenty Zone organizations. A guarded transaction verified exactly three pending Union children under the National root, exactly twenty pending Zone children under those Unions, and zero invalid Zone parent relationships before changing the 23 records to active. Post-transaction verification returned National 1 active, Union 3 active, Zone 20 active.

The 3 Union administrator seats and 20 Zone administrator seats remain reserved. They are vacant appointments, not user accounts. They will become active only when verified nominees complete the existing approval, invitation, email verification and acceptance workflow. The National administrator seat remains active.
