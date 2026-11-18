# ZionCore 2nd production operations

## Independent host configuration

The source now contains a Firebase Hosting + Cloud Run deployment path. The
intended Firebase Hosting origin is
`https://zioncore-2nd-production.web.app`, with `/api/**` rewritten to the
`zioncore-2nd-api` Cloud Run service in `europe-west2`. This is a configured
target, not a verified live site: the address returned HTTP 404 at the last
production check. Do not use `https://zioncore.replit.app`, which belongs to
the main ZionCore application.

The GitHub deployment workflow is manual-only and runs only from `main` after
the explicit deployment confirmation. It is not run by this source change.
The `zioncore-2nd-production` GitHub environment is now configured with a
required review from the repository owner and a `main`-only deployment branch
policy. The GitHub Actions variables below were set from the verified Firebase
project configuration:

- `GCP_WORKLOAD_IDENTITY_PROVIDER` and `GCP_DEPLOYER_SERVICE_ACCOUNT` for
  GitHub-to-Google Workload Identity Federation.
- `ZIONCORE_2ND_RUNTIME_SERVICE_ACCOUNT`, a dedicated Cloud Run identity with
  only the Firebase Auth/Firestore permissions the API requires and
  `secretAccessor` on its configured AI secrets.
- `ZIONCORE_2ND_GEMINI_SECRET_NAME` in Google Secret Manager; optionally
  `ZIONCORE_2ND_OPENAI_SECRET_NAME` for the fallback provider.
- `ZIONCORE_2ND_FIREBASE_API_KEY` and `ZIONCORE_2ND_APPCHECK_SITE_KEY` as
  GitHub environment variables. They are public client values; no credential
  or provider key was added to GitHub.

The WIF pool/provider and dedicated deployer/runtime identities now exist in
`zioncore-2nd-production`. The provider trusts only the repository's
`main`-branch manual run of this workflow using the protected GitHub
environment. The deployer has `roles/run.sourceDeveloper`,
`roles/serviceusage.serviceUsageConsumer`, and `roles/firebasehosting.admin`.
It also has `roles/run.admin` because the workflow creates the API as a public
Cloud Run service for Firebase Hosting rewrites and must set its invoker policy.
The deployer may attach only the dedicated runtime identity. The Cloud Build
default compute identity has `roles/run.builder`. The runtime has Firestore/Auth
roles and `secretAccessor` only on the two ZionCore 2nd AI secret resources.

Both Secret Manager resources exist, but neither has an enabled version. The
workflow now checks for enabled versions without reading their contents and
will stop before deployment until a ZionCore 2nd Gemini key is supplied.
No key was copied from the Replit workspace. The Cloud Billing API was enabled
only to inspect billing status; the project already reports an attached billing
account (`billingEnabled=true`). No billing attachment or payment setting was
changed.

The Firebase Hosting site exists at
`https://zioncore-2nd-production.web.app`, but it still returns HTTP 404 and
there is no Cloud Run service. No application deployment was started. Required
Google and Apple sign-in providers are not yet enabled; Email/Password is
enabled. The production Firebase App ID and reCAPTCHA Enterprise key match, and
the key allows the two Firebase Hosting domains. Production token exchange
cannot be verified until the actual application is deployed, so browser
Firestore history remains disabled in the deployment configuration.

The initial workflow deliberately leaves Firestore client access, AI
project-security approval, Google sign-in, Apple sign-in, Stripe checkout,
premium features, and paid usage disabled. Enable those separately only after
their corresponding production configuration and browser verification pass.
The production build omits canonical and sitemap URLs when the standalone host
is unset, and fails if the main site's origin is supplied.

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

For Cloud Run, Firebase Admin uses Application Default Credentials only when
`ZIONCORE_2ND_ADMIN_AUTH_MODE=adc` and the runtime service is
`zioncore-2nd-api`. The Replit service-account JSON remains supported for the
existing Replit runtime and is not copied into GitHub or Cloud Run. Direct
Gemini and OpenAI keys are supported through `GOOGLE_GENAI_API_KEY` and
`OPENAI_API_KEY`, respectively; inject them from Secret Manager only.
