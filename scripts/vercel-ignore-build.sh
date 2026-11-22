#!/usr/bin/env bash
# Vercel Ignored Build Step: wait for the exact commit's GitHub pre-deployment QA status.
# Exit 0 = skip this deployment; exit 1 = allow Vercel to build and deploy.
set -uo pipefail

REPOSITORY="TremendousGuru/NAAS"
CONTEXT="naasconnect/predeploy-quality-gate"
export CONTEXT
COMMIT_SHA="${VERCEL_GIT_COMMIT_SHA:-}"

if [[ ! "$COMMIT_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "No valid Vercel Git commit SHA; failing closed and skipping deployment."
  exit 0
fi

for attempt in $(seq 1 60); do
  STATE="$(curl --silent --show-error --fail --max-time 10 \
    -H "Accept: application/vnd.github+json" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    "https://api.github.com/repos/$REPOSITORY/commits/$COMMIT_SHA/status" 2>/dev/null |
    node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const s=JSON.parse(d).statuses||[];const x=s.find(v=>v.context===process.env.CONTEXT);process.stdout.write(x?.state||"missing")}catch{process.stdout.write("missing")}})' 2>/dev/null || true)"

  case "$STATE" in
    success)
      echo "Pre-deployment QA passed for $COMMIT_SHA. Allowing Vercel deployment."
      exit 1
      ;;
    failure|error)
      echo "Pre-deployment QA failed for $COMMIT_SHA. Skipping Vercel deployment."
      exit 0
      ;;
    *)
      echo "Waiting for GitHub pre-deployment QA status ($attempt/60): $STATE"
      sleep 20
      ;;
  esac
done

echo "Pre-deployment QA did not report success before timeout. Skipping deployment safely."
exit 0
