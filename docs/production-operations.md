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
  Firebase Auth/Firestore permissions, `roles/aiplatform.user`, and
  `secretAccessor` only on the optional OpenAI fallback secret.
- `ZIONCORE_2ND_FIREBASE_API_KEY` and `ZIONCORE_2ND_APPCHECK_SITE_KEY` as
  GitHub environment variables. They are public client values; no credential
  or provider key was added to GitHub.

Gemini production requests use the Google Gen AI SDK with Vertex AI and the
Cloud Run runtime identity through ADC. The configured model is
`gemini-3.8-flash` in the supported `eu` multi-region; no Gemini API key or
Gemini Secret Manager version is required. OpenAI remains optional and requires
its own Secret Manager version only if that fallback is configured.

The WIF pool/provider and dedicated deployer/runtime identities now exist in
`zioncore-2nd-production`. The provider trusts only the repository's
`main`-branch manual run of this workflow using the protected GitHub
environment. The deployer has `roles/run.sourceDeveloper`,
`roles/serviceusage.serviceUsageConsumer`, and `roles/firebasehosting.admin`.
It also has `roles/run.admin` because the workflow creates the API as a public
Cloud Run service for Firebase Hosting rewrites and must set its invoker policy.
The deployer may attach only the dedicated runtime identity. The Cloud Build
default compute identity has `roles/run.builder`. The runtime has Firestore/Auth
roles, Agent Platform User, and `secretAccessor` only on the optional OpenAI
secret. The unused Gemini secret resource is retained empty and the runtime has
no access to it.

The Vertex AI API is enabled, and the runtime has the documented
`roles/aiplatform.user` role. A temporary service-account impersonation grant was
used and removed after the `@google/genai` SDK successfully counted both text
tokens and a synthetic WAV's audio tokens as the runtime identity. Google
documents CountTokens as non-billable. This verifies authentication,
model/location availability, and text/audio request formats; it does not test
paid generation or streaming.

One owner-authorized verification batch containing a 32-token-capped text
stream and a 32-token-capped interpretation of a synthetic 0.25-second WAV
timed out after five minutes before returning per-request results. The client
cannot determine whether either request was accepted or provide actual token
usage/cost. A Cloud Logging query returned no matching entries, and the batch
was not retried to avoid duplicate charges. The Billing Budgets API is disabled,
so no project budget was verified; the Vertex quota response exposed no
model-specific numeric effective limit for this check. Do not treat model
generation or streaming as verified or proceed to deployment on this evidence.

The optional OpenAI Secret Manager resource has no enabled version. No Gemini
or OpenAI key was copied from the Replit workspace. The Cloud Billing API was
enabled only to inspect billing status; the project already reports an attached
billing account (`billingEnabled=true`). No billing attachment or payment
setting was changed.

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
Gemini API keys remain an optional development path through
`GOOGLE_GENAI_API_KEY`; Cloud Run uses Vertex ADC. OpenAI keys are injected from
Secret Manager only and remain optional.
