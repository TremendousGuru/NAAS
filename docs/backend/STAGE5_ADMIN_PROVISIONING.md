# NAASCONNECT — Stage 5 Administrator Provisioning

## Implemented
- Added the three union records beneath the national root: WNUC, ENUC and NNUC.
- Added 20 provisional zones from the project's supplied working territorial list: 9 Western, 3 Northern and 8 Eastern.
- Added one reserved administrator seat for the national root, each union and each zone (24 seats total).
- Each seat has a unique username, role, approval authority and reserved status.
- Approval routing: national root appoints/approves union administrators; each union approves its zone administrators.
- The geography is explicitly marked provisional in metadata and must be confirmed by NAAS/church authorities before public launch.
- Campus and local-church records are not fabricated; they will be added as verified institutions/locations are supplied or approved.

## Credential lifecycle
The agreed default password `123456789` is retained as a temporary handover bootstrap credential policy. It is NOT stored in this table, source code, metadata or plaintext database fields, and no shared Auth accounts have been created. A reserved seat is not a login account.

At handover, after the named appointee's email and appointment are verified, the controlled provisioning process may issue the agreed temporary credential. First successful sign-in must force a password change and completion of required profile details before privileged access is granted. The Auth password itself must be stored only by Supabase Auth (hashed); application data stores only credential lifecycle state. Do not send the common temporary credential in bulk or publish it.

## Security and operational notes
- `org_admin_seats` has RLS enabled and no anonymous table grants.
- Authenticated SELECT is granted but row access is restricted to administrators who can administer the organization or its approval authority.
- No user Auth accounts were created because no appointee names/emails have been supplied.
- A future activation workflow must verify the appointee, issue credentials individually, require password replacement, and only then activate the matching `org_memberships` row.
- The first provisional seed used only the supplied working list; it is not a certified official national directory.

## Migration
`supabase/migrations/20261121140100_stage5_provisional_geography_admin_seats.sql`
