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

An owner-authorized verification batch contained one 32-token-capped text stream
and one 32-token-capped interpretation of a synthetic 0.25-second WAV. The outer
test process timed out after five minutes before it emitted either result. The
test harness had no per-request abort deadline and printed results only after
the complete batch, so the observed failure is a loss of per-request diagnostics;
it does not establish whether the provider accepted either request or what caused
the delay. Non-billable CountTokens confirmed input sizes of 11 text tokens and
26 tokens for the prompt plus synthetic WAV. With the output cap on each request
and conservative $2/$10 per-million-token rates, the combined maximum estimate
is $0.000714 USD; actual usage and cost remain unknown. No matching Cloud Logging
entries or Vertex EU online-prediction metric series appeared in the inspected
24-hour window. Missing telemetry is not evidence that no request was accepted.
No retry has been made.

The Cloud Billing Budgets API is enabled. The project had no existing
project-scoped budget, so an alert-only £1/month budget was created for project
225578874852 with 25%, 50%, 90%, 100% current-spend and 100% forecast thresholds.
It has no spend cap: alerts do not stop or limit spending. Billing account
configuration was not changed. The Vertex quota response exposed no
model-specific numeric effective limit for this check.

The API now assigns a server-generated request ID and returns it in
`X-Request-Id`. AI provider attempts log that correlation ID, a unique attempt
ID, provider/model/operation, timestamps, duration, token usage when returned,
and sanitized error name/code/status. Prompt text, audio, credential values,
and raw provider error messages are excluded. This instrumentation does not
retroactively reveal the outcome of the timed-out test batch.

The optional OpenAI Secret Manager resource has no enabled version. No Gemini
or OpenAI key was copied from the Replit workspace. The project reports an
attached billing account (`billingEnabled=true`); neither its billing
attachment nor payment settings were changed.

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
