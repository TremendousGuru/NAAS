# NAASCONNECT Nigeria — Frontend delivery and visual quality gate

**Applies to:** `feature/naasconnect-frontend-foundation` and the Vercel project `naasconnect-nigeria`
**Architecture authority:** NAASCONNECT V1.0
**Status:** Initial automated post-deployment browser gate added; GitHub secret configuration and first run still required.

## Objective

A green Vercel build is necessary but not sufficient. Every successful deployment must be inspected for browser errors, broken brand images, broken intro routing, text/layout overflow, and desktop/mobile regressions. The process must minimize avoidable preview deployments and conserve limited build/deployment credits.

## Current implementation in this change

- Restored the branded intro screen as the root route.
- Fixed the intro session check so it awaits Supabase session resolution before routing. The previous five-second timer could route a user to sign-in before the session request completed.
- Kept `/app` protected by server-side Supabase user verification; the intro is not an authorization boundary.
- Added a GitHub Actions workflow listening for successful Vercel `deployment_status` events.
- The workflow checks out the exact deployed commit, resolves that deployment's URL, and runs pinned Playwright browser checks in desktop Chromium and mobile Chromium.
- Browser checks verify intro visibility and logo image decoding, intro-to-login routing for an unauthenticated browser, both login logos, browser JavaScript errors, and horizontal overflow.
- Screenshots, traces on failure, and the HTML report are retained as GitHub Actions artifacts for 14 days.

## One-time setup required

The Vercel project has deployment protection enabled for previews. Add the Vercel Automation Bypass Secret as a GitHub Actions repository secret named:

`VERCEL_AUTOMATION_BYPASS_SECRET`

Create/copy this value from the Vercel project's Deployment Protection settings. Do not commit it, paste it into source files, or expose it in logs. Until configured, the visual QA job intentionally fails with a clear setup message rather than pretending that a protected preview was inspected.

## Required release gates

### Before pushing a batch

1. Confirm the intended repository, branch, and current HEAD.
2. Read the affected routes, server actions, existing CSS, assets and related V1.0 documents.
3. Check every referenced image/font/icon path against tracked assets.
4. Review route guards, loading/error/empty states, mobile breakpoints and reduced-motion behavior.
5. Review the complete diff for unrelated changes and duplicate workflows.
6. Run available static/type/build checks once per coherent batch where execution access is available.

### After each Vercel deployment

1. Confirm the Vercel deployment is `READY` and its commit SHA matches the intended GitHub commit.
2. Wait for the post-deployment visual QA workflow.
3. Review desktop and mobile screenshots, not just the test pass/fail summary.
4. Check intro routing, sign-in screen, brand image decoding, browser exceptions and horizontal overflow.
5. Inspect any failed trace and browser console/network evidence.
6. Record the deployment URL, commit, checks, issues, and resolution in the milestone log.
7. Do not promote to production while a required check is failing or screenshots have not been reviewed.

### Manual visual review checklist

- [ ] Intro screen appears, logo is crisp and correctly proportioned, progress indicator animates, and routing completes.
- [ ] NAAS and NAASCONNECT logos render on sign-in, registration and member workspace.
- [ ] No broken images, missing fonts, clipped text, overlapping controls or unexpected blank sections.
- [ ] Desktop widths and narrow mobile widths are usable without horizontal scrolling.
- [ ] Buttons, links, form validation, loading feedback and error messages behave correctly.
- [ ] Reduced-motion preference does not make the intro unusable.
- [ ] Authenticated and unauthenticated routing remains correct.
- [ ] Protected member/admin routes still enforce server-side authorization.

## Credit conservation rules

- Prefer one planned implementation batch over repeated speculative edits.
- Inspect existing code and assets before changing them.
- Run static checks and local/CI tests before allowing a Vercel build where practical.
- Use the existing Vercel project and branch; do not create parallel projects.
- Avoid force deployments and duplicate deployment triggers unless diagnosing a cache issue.
- Reuse the same READY preview for iterative inspection when the source has not changed.
- Group independent frontend changes into one commit when they are ready together.
- Never treat a READY status as proof of visual correctness.
- Do not run production deployment or database migration as part of a preview QA check.

## Known scope limitations

The browser QA harness lives outside the Next.js application typecheck: `tests/` and `playwright.config.ts` are explicitly excluded from the app's `tsconfig.json` compilation because Playwright is installed only in the GitHub Actions runner. This avoids adding a test-only dependency to the production application bundle. The first automated gate covers the intro and login pages plus desktop/mobile rendering basics. It does not yet prove the authenticated dashboard, profile editing, onboarding form branches, admin review workflows, status composer, image upload, accessibility conformance, or real email/session journeys. Those checks will be added alongside the corresponding feature milestones and must use controlled test accounts/fixtures without exposing real member data.

The CI workflow uses a pinned Playwright version and does not add a permanent dependency to the application's package manifest or lockfile. GitHub Actions still consumes runner minutes and artifact storage; it does not create an additional Vercel deployment.

## Current visual issue found during code review

The root route previously redirected directly to `/login` or `/app`, bypassing the existing branded `SplashGate`. The intro component also started a five-second redirect timer without awaiting `getSession()`, allowing a slow session read to race the timer. The root now renders the intro gate, and the gate awaits the session result before routing. The authenticated `/app` route continues to verify the user server-side.

## Evidence and sign-off

A deployment is marked **visually verified** only when:
- Vercel state is READY;
- the deployment commit is known;
- the automated visual QA run passed on that exact URL/commit;
- desktop and mobile screenshots have been reviewed;
- outstanding defects are either fixed or explicitly accepted and documented.

A passing automated check is not a production launch approval.
