# NAASCONNECT Batch 0 — Pre-deployment Quality Gate

**Project:** NAASCONNECT Nigeria  
**Repository:** TremendousGuru/NAAS  
**Branch:** feature/naasconnect-frontend-foundation  
**Scope:** Delivery safety only; no product feature or database work.

## What this gate does

Every Git push starts the GitHub Actions workflow `.github/workflows/naasconnect-predeploy-qa.yml`. The workflow runs against the exact pushed commit and performs:

1. Install application dependencies.
2. TypeScript validation (`npm run typecheck`).
3. Next.js production build (`npm run build`).
4. Chromium installation on Ubuntu 24.04.
5. Desktop Chromium and mobile-viewport Chromium Playwright checks against the locally built production server.
6. Upload screenshots, traces on failure and HTML report.
7. Publish the commit status `naasconnect/predeploy-quality-gate`.

The workflow first marks that status pending, then publishes success or failure after all checks. This prevents an old success status for the same immutable commit from being mistaken for a current run during a rerun.

## Vercel integration

The Vercel project `naasconnect-nigeria` is configured with the Ignored Build Step command:

```bash
bash scripts/vercel-ignore-build.sh
```

The script polls the public GitHub commit-status endpoint for the exact `VERCEL_GIT_COMMIT_SHA` and required context:

- **success:** exits 1, which tells Vercel to continue the build/deployment.
- **failure/error:** exits 0, which tells Vercel to skip the deployment.
- **pending/missing/API unavailable/timeout:** fails closed and skips the deployment.

This makes the GitHub quality gate a prerequisite for the Vercel Git deployment rather than a post-deployment-only check. The post-deployment visual workflow remains in place for inspection of the actual preview after Vercel has deployed it.

## Browser test safety

The Playwright config now defaults to `http://127.0.0.1:3000` and starts the already-built Next.js production server for local QA. It does not require Vercel credentials for local checks.

For protected Vercel previews, a scoped authentication fixture exchanges the bypass secret for the deployment cookie on the verified deployment origin. The secret is not sent as a global browser request header and is not placed in a URL. The existing post-deployment workflow remains responsible for requiring the secret when it inspects a protected preview.

## Dependency lockfile limitation

The repository did not contain `package-lock.json` at the time Batch 0 was prepared. Until a lockfile is generated and committed, CI uses `npm install` rather than `npm ci`. Playwright itself is pinned to 1.55.0, but the existing application dependency ranges are not yet fully locked. Generating and reviewing the npm lockfile is a remaining reproducibility hardening task.

## Verification status

The implementation is committed, but the gate is not considered operationally proven until the first GitHub Actions run for the implementation commit completes successfully and the matching Vercel deployment either proceeds on success or is skipped on a deliberately failed check. Do not mark Batch 0 fully verified based only on the presence of these files.

## Scope and safety

- No Supabase schema, data, RLS, RPC, grants or migration-ledger changes.
- No migration replay and no Phase 5.9 DDL.
- No production promotion.
- No change to V1.0 decisions or architecture.
- Existing post-deployment visual QA is retained.
