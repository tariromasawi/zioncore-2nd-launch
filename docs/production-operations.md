# ZionCore 2nd production operations

## Independent host configuration

ZionCore 2nd does not yet have a verified independent production URL. Do not use
`https://zioncore.replit.app`; that address belongs to the main ZionCore
application. After an independent host is assigned, set
`VITE_PUBLIC_SITE_URL` for the web build and `ZIONCORE_2ND_PUBLIC_ORIGIN` for
the API to that exact HTTPS origin. The production build omits canonical and
sitemap URLs when the standalone host is unset, and fails if the main site's
origin is supplied.

Before enabling production checkout, add the verified standalone host to the
ZionCore 2nd Firebase Authentication authorized domains and the production
App Check key's allowed hostnames. Keep Stripe return URLs and CORS allowlists
scoped to the same standalone deployment.

## Release and recovery

1. Review the exact release commit and approved deployment target before a release.
2. After deployment, confirm the independent site loads, deep links survive reload,
   and `GET /api/healthz` returns HTTP 200.
3. Confirm owner-only routes reject anonymous requests before checking approved
   owner access.
4. If a release fails its health check, restore the last known good deployment
   revision; do not apply an unreviewed production data migration as a recovery step.
5. Re-run the release gate before a correction is released.

## Firebase data protection

The separate ZionCore 2nd Firestore read and rules/App Check checks are recorded
in `artifacts/zioncore-frequency-lab/FIREBASE_SETUP_ZIONCORE_2ND.md`. The main
ZionCore Firebase project is not the target for this application.

At that check, Firestore point-in-time recovery was disabled and no backup schedules were returned. App Storage has no built-in automated object backup. Configure backups only after choosing a protected destination, retention period, access policy, and budget; avoid copying customer audio or account data into temporary storage.

## Uptime and spending controls

- Replit documents deployment uptime monitoring and downtime email alerts in Publishing → Monitoring. Enable these in the account UI if available for the deployment.
- Replit documents usage limits and budget controls under Settings → Billing → Usage. Set a budget cap and review usage there; these are account-level controls and cannot be safely changed from application code.
- The API health endpoint is a lightweight availability check, not proof that Firebase, Stripe, or AI operations are healthy. Use the owner diagnostics and provider checks for those services.

## Portability and providers

The application source supports Firebase Authentication/Firestore, Stripe
billing, and Google Gemini AI. Keep credentials in the independent deployment's
secret manager and validate every provider after a hosting change. Do not claim
these services are live until they have been exercised through the deployed
standalone application.
