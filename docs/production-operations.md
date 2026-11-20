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

An earlier authorized batch containing one 32-token-capped text stream and one
synthetic-audio request timed out at the outer five-minute tool deadline without
per-request results. Its harness had no per-request deadline or incremental
result output. That explains the missing diagnostics but not whether either call
was accepted. Non-billable CountTokens measured 11 text tokens and 26
prompt-plus-audio tokens; the capped estimate was $0.000714 USD at conservative
$2/$10 per-million-token rates. Actual usage and cost are unknown.

The owner later authorized one controlled text generation and, only if it
validated, one synthetic-audio request. One genuine Vertex AI text stream for
`gemini-3.8-flash` completed in 2,231 ms on 2026-11-19. Correlation ID:
`b19a0b59-5aea-433e-b106-cac44ff60613`; attempt ID:
`3d0a97a2-9489-4151-88c6-0fba07547571`. The stream completed without an SDK
transport error, but the returned text failed strict JSON parsing. The exact
HTTP status and response token-usage metadata were not retained by the one-off
test harness after that parse failure; therefore actual usage and cost cannot be
reported. The exact text was not logged. CountTokens measured 15 input tokens;
the test's 32-token output cap gives a conservative single-call estimate of
$0.000350 USD, not an absolute cap. The combined planning estimate using the
previous 26-token audio preflight was $0.000722 USD.

Test B was correctly skipped because Test A did not pass structural validation.
No automatic retry occurred. The temporary `roles/iam.serviceAccountTokenCreator`
binding was limited to the dedicated runtime service account, removed in the
test cleanup, and independently verified absent afterward. Cloud Logging and
the inspected Vertex EU/Global metrics had no per-request records in the test
window; this does not establish actual billing. No further Gemini generation
will run without separate authorization.

The Cloud Billing Budgets API is enabled. The project had no existing
project-scoped budget, so an alert-only £1/month budget was created for project
225578874852 with 25%, 50%, 90%, 100% current-spend and 100% forecast thresholds.
It has no spend cap: alerts do not stop or limit spending. Billing account
configuration was not changed. The service identity can inspect project-scoped
budgets but cannot list budgets at the entire billing-account scope; that wider
inspection requires billing-account access. The Vertex quota response exposed
no model-specific numeric effective limit for this check.

The API now assigns a server-generated request ID and returns it in
`X-Request-Id`. AI provider attempts log that correlation ID, a unique attempt
ID, provider/model/operation, timestamps, duration, token usage when returned,
and sanitized error name/code/status. Prompt text, audio, credential values,
and raw provider error messages are excluded. The production path has
request-level telemetry tests. Production usage normalization includes both
candidate and reasoning tokens in billable output estimates.

## Controlled Gemini text result (2026-11-20)

After a separate owner authorization, exactly one streaming text-generation
request was made with synthetic data, the production prompt, the preserved
Genesis context and the production response schema. No audio request or retry
was made. The first CountTokens preflight used an incorrect EU endpoint and
returned HTTP 404 without generation; the endpoint was corrected to the GenAI
SDK's EU multi-region `v1beta1` endpoint before the successful preflight and
generation.

- Model/region: `gemini-3.8-flash`, Vertex AI `eu`.
- Correlation ID: `8de1f2fd-1229-45ab-879a-031811d87b84`.
- Request: HTTP 200, stream completed in 36,566 ms, finish reason `STOP`,
  zero stream-frame parse errors.
- Response: strict JSON parsing and all 17 response-schema fields passed.
  Report-quality validation rejected the response; it was not usable or saved.
- Quality failure categories: `SOURCE_PROXIMITY`,
  `EXACT_HARMONIC_OVERCLAIM`,
  `UNVALIDATED_BIOACOUSTIC_CLASSIFICATION`, and
  `CONFIDENCE_SCOPE_OVERCLAIM`. The exact generated text was intentionally not
  retained or logged.
- Genesis context was included. The integrity/quality checks did not accept
  unsupported attribution or claims; the four categories above remain a real
  model-quality failure.
- CountTokens preflight, including the production schema, estimated 5,169
  input tokens. The completed request reported 5,901 prompt tokens, 4,282
  candidate tokens and 1,343 reasoning tokens (provider `totalTokenCount`:
  10,183). Thus the final request exceeded the separately authorized 5,200
  input-token limit by 701 tokens. The preflight undercounted actual usage by
  732 tokens. A source-level comparison found that the same prompt contents and
  structured response schema/configuration were passed to CountTokens and
  generation; no local payload difference explains the gap. Google's CountTokens
  documentation describes a prompt-token estimate, but does not document a
  guaranteed equality with post-generation `promptTokenCount`. The precise
  provider-side cause remains unresolved; do not treat CountTokens as a hard
  spending or authorization limit. No further generation is authorized.
- Google's current GenerateContentResponse reference defines
  `totalTokenCount` as prompt + candidate + tool-use prompt + reasoning tokens.
  The returned aggregate (10,183) equals prompt + candidates and omits the
  separately reported 1,343 reasoning tokens; the documented component total
  is 11,526. Application accounting now retains both aggregates, flags this
  mismatch, and estimates cost from prompt + tool-use input plus candidate +
  reasoning output exactly once. It never adds the provider aggregate to those
  components. The returned metadata therefore remains internally inconsistent
  and is a diagnostic limitation.
- Conservative estimated cost including reasoning tokens: **US$0.068052**
  using the application's $2/$10-per-million accounting ceiling. Google's
  public model pricing lists introductory Gemini 3.8 Flash rates of $0.75/$3.75
  per million input/output tokens through 2026-12-31 and standard rates of
  $1.50/$7.50 afterward. This estimate is not an invoice or hard spend cap.
  Current accrued project spend was not available from the Budgets API.
- The verified £1/month alert budget and its 25%, 50%, 90%, 100% current-spend
  and 100% forecast alerts remained unchanged; the budget is not a spend cap.
- The bootstrap identity's temporary `roles/iam.serviceAccountTokenCreator`
  grant was scoped to the dedicated runtime service account, then removed and
  independently verified absent. No credentials, tokens, prompt text, response
  text or customer data were written to logs or source.

The generation-quality failure is addressed in source without lowering the
quality gate:

- Proximity/distance statements remain rejected because the current measurement
  contract contains no calibrated distance or sound-pressure evidence.
- Harmonic comparisons are now calculated deterministically from measured peaks,
  the nearest integer multiple and the FFT resolution. A non-zero difference is
  never described as exact; unsupported exact claims are rejected even when the
  difference exceeds one FFT bin.
- Animal and biological source claims, including plant, leaf, flower, fungus and
  microbial labels, remain unverified hypotheses unless suitable independent
  evidence exists. The model cannot turn derived features into confirmed IDs.
- Numeric model confidence is no longer converted into arbitrary low/moderate/
  high bands. The report uses qualitative, explicitly uncalibrated categories;
  scope overclaims remain rejected.

The text-generation adapter now performs a non-billable CountTokens preflight
with the same prompt, structured response schema, and generation configuration.
It applies 25% headroom against the authorized 5,200 input-token ceiling and a
US$0.10 estimated per-request ceiling using the conservative $2/$10 rates and
maximum output budget. The observed 5,169-token estimate therefore fails before
generation (conservative estimate 6,462); a missing or failed preflight also
fails closed and is not sent to the fallback provider. The guard is an
application-level estimate, not a provider-enforced or account-level spending
cap. Google's CountTokens documentation states the endpoint itself is not
charged; it remains subject to service availability and request limits.

Cloud AI generation defaults to disabled
(`ZIONCORE_2ND_AI_GENERATION_ENABLED=false`), and audio generation additionally
requires its own explicit flag
(`ZIONCORE_2ND_AI_AUDIO_GENERATION_ENABLED=false`). While disabled, the API
exposes no paid AI quote and returns 503 before wallet reservation or provider
calls. Local analysis remains available. Enabling either cloud feature requires
a separate owner decision after quality and financial controls are accepted.
Mocked and deterministic regression tests cover these boundaries, token
breakdown, the inconsistent aggregate, preflight rejection and cost estimation.
Firestore-emulator integration also verifies that when both providers return
quality-invalid reports, the job is marked failed, no report is stored, the
credit reservation is released, and no settlement occurs. Its 22 tests pass.
The complete 11-step local release suite passed before this final test-only
addition; it is being rerun for the committed version. No additional live
generation was performed. This work does not verify Cloud Run's production ADC,
a successful AI report, or live application delivery.

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

For Gemini token accounting, preserve the detailed usage fields and compare
provider-reported totals to the documented component sum. CountTokens is a
preflight estimate, not a guaranteed spending cap; the current implementation
fails closed above a 5,200-token input budget after 25% headroom or above its
US$0.10 estimated maximum. Keep cloud generation disabled until a separately
authorized request verifies that the report meets the quality gate.

Official references:

- [GenerateContentResponse usage metadata](https://docs.cloud.google.com/gemini-enterprise-agent-platform/reference/rest/v1/GenerateContentResponse)
- [Count Tokens API](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/get-token-count)
- [Gemini thinking token billing](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/thinking#pricing)
- [Google Cloud model pricing](https://cloud.google.com/model-garden/pricing)

For Cloud Run, Firebase Admin uses Application Default Credentials only when
`ZIONCORE_2ND_ADMIN_AUTH_MODE=adc` and the runtime service is
`zioncore-2nd-api`. The Replit service-account JSON remains supported for the
existing Replit runtime and is not copied into GitHub or Cloud Run. Direct
Gemini API keys remain an optional development path through
`GOOGLE_GENAI_API_KEY`; Cloud Run uses Vertex ADC. OpenAI keys are injected from
Secret Manager only and remain optional.
