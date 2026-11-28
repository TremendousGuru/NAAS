# NAASCONNECT — Batch 2C Community Experience Design Brief

**Status:** Design preparation; owner review required before frontend implementation  
**Branch:** `feature/naasconnect-batch2c-community`  
**Product:** NAASCONNECT Nigeria  
**Scope:** Batch 2C only — persistent community feed, organization announcements, post creation, media, reporting and moderation.

## 1. Preserve existing product foundations

- Keep the existing member workspace navigation, authenticated layout, DM Sans + Manrope typography, navy/blue palette, and approved NAASCONNECT logo.
- Keep `/app/community` as the community entry point, but distinguish persistent posts from the existing Global Status feature.
- Do not replace, rename, or repurpose `community_statuses`. It remains the 24-hour platform-wide Status/Stories surface.
- Reuse the existing authenticated Supabase server client and member session.
- Do not create public/anonymous community access.

## 2. Screens for owner review

### A. Community feed — desktop and mobile
- Clear page title and short explanatory description.
- Persistent post composer entry point.
- Feed filters: For you, Following, Campus, Church, Official.
- Post cards with author identity, author organization where applicable, publication time, text/media, and contextual actions.
- Distinct visual treatment for official announcements.
- Right rail for pinned/recent official announcements and community guidelines on desktop.
- Single-column responsive feed on mobile; no horizontal page overflow.

### B. Official announcement detail
- Verified organization identity and organization level.
- Announcement title, content, media, publication time and audience label.
- Clear route back to the community feed.
- Audience wording must reflect the actual authorized target scope, not imply a national broadcast by default.

### C. Create post / announcement
- Text content with a visible character limit.
- Post type: community post or official announcement, only where the user's permissions allow it.
- Audience selection constrained by the user's active membership or administrator scope.
- Private media upload affordance for approved image/video formats and configured size limits.
- Clear draft/publish states, validation, upload progress, and failure feedback.
- No client-controlled author identity, role, or organizational authority.

### D. Moderation centre
- Report queue scoped to the moderator's authorized organization and descendants as permitted by policy.
- Report reason, target post, reporter, timestamps and status.
- Review detail with remove/restore/dismiss/escalate actions only where permitted.
- Mandatory reason for consequential moderation decisions.
- Empty, loading, error, and unauthorized states.
- No global moderation visibility for campus or zonal moderators.

## 3. Interaction and content rules

- A normal member may publish a personal community post only when the database says they have an active NAAS organization membership.
- An organization-authored announcement requires the publisher to have an active administrator assignment for that organization.
- The author organization and audience organization are separate concepts. A publisher cannot choose an audience outside their authorized scope.
- Post editing/deletion is limited to the author and authorized moderators, subject to published-content policy.
- Any authenticated member may submit a report; only appropriately scoped moderators can review it.
- Reporting does not automatically remove content.
- Do not add private messaging, comments, reactions, event creation, or notification delivery in Batch 2C; those are separate approved/later capabilities.

## 4. Visual direction

- Retain the current NAASCONNECT workspace visual language: clean white surfaces, soft cool-grey canvas, navy text, restrained blue actions, subtle borders and low-elevation cards.
- Use DM Sans for interface/body text and Manrope for strong headings, matching the current app CSS.
- Prioritize legibility and content hierarchy over decorative effects.
- Keep status stories visually distinct from persistent posts.
- Keep all primary actions touch-friendly and all form states accessible.

## 5. Owner acceptance before code

The owner reviews and approves:
1. Desktop community feed.
2. Mobile community feed.
3. Announcement detail.
4. Create post/announcement.
5. Moderation centre.

After approval, implement the approved screens on this branch, then connect them to the reviewed Batch 2C database contract. Do not treat this design brief as approval of unreviewed UI details.
