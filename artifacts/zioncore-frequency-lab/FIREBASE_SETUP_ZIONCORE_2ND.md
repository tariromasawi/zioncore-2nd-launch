# ZionCore 2nd Firebase setup

## Independent project

- Firebase project: `zioncore-2nd-production`
- Project number: `225578874852`
- Production web app ID: `1:225578874852:web:df2ab8ae1735860719b9f1`
- Development web app ID: `1:225578874852:web:e9e67e76109a011219b9f1`
- Firestore: `(default)`, Native mode, Standard edition, `europe-west2`
- Web auth domain: `zioncore-2nd-production.firebaseapp.com`
- Storage bucket: `zioncore-2nd-production.firebasestorage.app`

The standalone application is locked to this project in both its browser and
Admin SDK configuration. Do not use `ethereal-throne-b20e6`, its web app
configuration, service-account credential, App Check key, or database here.

## Runtime configuration

The web client reads the `VITE_ZIONCORE_2ND_FIREBASE_*` variables shown in
`.env.example`. Keep development and production values in their corresponding
Replit environments. Firebase web configuration is public client configuration;
the Admin service account is not.

Set `ZIONCORE_2ND_BOOTSTRAP_SERVICE_ACCOUNT_JSON` only in the API server's
Replit Secrets. The service account must belong to `zioncore-2nd-production`.
Never put the credential in a repository file, browser bundle, test fixture, or
chat message.

## Verified project state

- The default Firestore database is ready in London.
- The active `cloud.firestore` release uses ruleset
  `projects/zioncore-2nd-production/rulesets/efa1868c-f45d-4bf6-b5c9-6ef16c7ed427`,
  with SHA-256
  `0550bae7d7c71efaa10498b9fb6931dd9b0747b4e2afadcc17a9b3b9da2f7457`.
  The rules permit authenticated users to access only their own validated
  frequency observations and read their own current membership record. Wallet,
  credit, billing, membership writes, and AI-job records remain server-only.
  Unmapped paths are denied by default.
- No customer documents or indexes were created or modified.
- The Cloud Firestore API is enabled. The existing service-account identity
  `firebase-adminsdk-fbsvc@zioncore-2nd-production.iam.gserviceaccount.com`
  completed a real read-only Firestore request; the diagnostic document was
  absent as expected and no document was written.
- A read-only Firebase Management API request successfully returned this web
  app's public configuration, and the returned project ID and App ID matched
  the approved project values above.
- Firebase Authentication is now initialized through the documented Firebase
  CLI auth-provider deployment. Email/Password is enabled; a read-only config
  check returned HTTP 200 with `signIn.email.enabled=true`. A temporary
  synthetic account completed sign-up and password sign-in; it was deleted
  after the check. No persistent test account remains and that test changed no
  billing settings.
- With that account's ID token, live Firestore accepted creation and reading of
  its own schema-valid frequency observation, denied a read under another UID,
  and denied a client wallet write. The temporary observation and account were
  deleted successfully. This exercised authenticated rules while App Check
  enforcement was off; it did not verify enforced App Check.
- A read-only Auth user listing after cleanup returned zero accounts. No owner
  account or owner claim exists in this project yet, and no privilege was
  assigned; owner access therefore remains unverified.
- The Email/Password session persisted after a full browser reload. A
  Chromium mobile-emulation smoke check at 402×874 rendered the landing page,
  Missions, Astronomy, Bioacoustics, Voice V2, Access, Dashboard, History, and
  Messages without horizontal overflow. This is not iPhone Safari verification.
- The authorized domains are `zioncore-2nd-production.firebaseapp.com`,
  `zioncore-2nd-production.web.app`, and
  `c9c8012c-55d1-412b-af8f-e60455c226a4-00-3ernpyafogg1c-33xtb81r.spock.replit.dev`.
  The production and development Replit environments now mark Firebase
  Authentication as ready.
- Browser inspection of the supplied Replit preview hostname showed that the
  page currently initializes Firebase project `ethereal-throne-b20e6`, not
  `zioncore-2nd-production`. It is therefore not the ZionCore 2nd frontend and
  was not used for a ZionCore 2nd browser sign-in or Firestore test. The main
  project was not changed.
- Google sign-in remains disabled. A provider setup attempt without a support
  email returned `400 INVALID_GOOGLE_SIGN_IN_BRAND_CONFIG` with:
  `Both public display name and customer support email must be provided for Google Sign-In brand configuration, or neither if the project already has the OAuth Brand set.`
  An owner-selected customer-support email is required to configure the OAuth
  brand. Apple sign-in remains disabled pending Apple Developer provider
  configuration. The account UI shows only providers that are actually enabled.
- An earlier direct Identity Platform initialization call returned
  `400 FAILED_PRECONDITION: BILLING_NOT_ENABLED`; the Firebase CLI path
  initialized standard Firebase Authentication without enabling billing.
- Separate reCAPTCHA Enterprise App Check keys are registered for the
  development and production web apps. The development key is restricted to the
  Replit preview hostname; the production key is restricted to the Firebase
  Hosting domains. A development-only debug token is registered for the
  development app and stored in Replit's Development environment, not source
  control.
- In an isolated browser running this standalone source with the development
  App Check debug provider, Firebase returned a token for the matching
  development App ID. The client completed sign-up/sign-in and its own
  Firestore observation write/read after Firestore App Check enforcement was
  enabled. A direct REST read carrying the same ID token and App Check token
  succeeded; the same request without an App Check token was rejected. The
  temporary account and observation were removed, and a read-only check found
  zero remaining Auth users.
- Firestore App Check enforcement is `ENFORCED`. Identity Toolkit App Check
  enforcement remains `OFF`; it was not enabled because Auth enforcement was
  not part of the verified client test. The development and production
  reCAPTCHA Enterprise keys remain separate; production-host client verification
  remains outstanding.
- The local Firestore emulator rules suite passed 14/14 tests; the API wallet,
  credit-ledger, Stripe-fulfilment, and interpretation integration suite passed
  20/20 tests.
- Storage is not enabled because the current application processes audio in the
  browser and stores only bounded observation metadata in Firestore.
- A historical text-only smoke check on `gemini-3.8-flash` returned `STOP` with
  usage of 7 prompt, 1 candidate, and 118 thought tokens. Its authentication
  path was not captured, and it verified only that a provider returned text;
  it was not a valid ZionCore interpretation or report. Keep customer AI gated
  until the standalone Vertex route produces a schema-valid report and usage
  controls are verified.

### Independent deployment configuration audit — 18 November 2026

- The production web App ID above matches the Firebase App Check resource. Its
  registered reCAPTCHA Enterprise site key allows
  `zioncore-2nd-production.web.app` and
  `zioncore-2nd-production.firebaseapp.com`; no site key value is stored in
  source. This verifies registration and hostname scope, not a live production
  token exchange.
- Authentication authorized domains include the two Firebase Hosting hosts and
  the Replit preview hostname. Email/Password is enabled; Google and Apple are
  not configured.
- The GitHub production environment is restricted to `main` and requires the
  repository owner as reviewer. Its public client variables were populated from
  this project's verified Firebase configuration. WIF, deployer/runtime
  identities, and scoped IAM bindings are configured for the guarded workflow.
- The Cloud Billing API was enabled for read-only status inspection. Billing
  was already attached (`billingEnabled=true`); its attachment was not changed.
- Secret Manager contains the ZionCore 2nd Gemini and optional OpenAI secret
  resources. The Gemini resource remains empty and is no longer used by the
  ADC deployment path; the optional OpenAI resource has no enabled version.
  Provider credentials were not copied from Replit or written to GitHub.
- The Hosting site exists but still serves HTTP 404, and no Cloud Run service
  exists. No application deployment or live production App Check token test has
  been performed.

### Vertex AI ADC verification — 19 November 2026

- The Google Gen AI SDK is configured for Vertex AI using the Cloud Run runtime
  service account and Application Default Credentials. The project's
  `aiplatform.googleapis.com` API was already enabled. The runtime account now
  has `roles/aiplatform.user`; it was not given a Gemini API key.
- `gemini-3.8-flash` supports text and audio input and the EU multi-region. The
  selected location is `eu`, matching the independent European deployment.
- To verify runtime permissions without creating a key, a temporary
  service-account impersonation grant was added to the runtime identity and
  removed after the check. With a short-lived token for that identity, the
  installed `@google/genai` SDK's CountTokens method succeeded for text and a
  synthetic one-second WAV. Google documents CountTokens as having no charge.
- This verifies the SDK's Vertex endpoint, runtime identity permissions, model
  and location, and accepted text/audio input shapes. It does not verify a
  billable `generateContent` or stream request, nor Cloud Run's metadata-server
  ADC because no Cloud Run service has been deployed.
- The deployment workflow now selects Vertex ADC and does not require a Gemini
  Secret Manager version. If an OpenAI fallback is configured, its own secret
  version is still required.
- The first owner-authorized verification batch attempted a text stream and a
  synthetic-audio request, each capped at 32 output tokens, but timed out at the
  outer five-minute tool deadline without per-request results. Its harness had
  no per-request deadline or incremental output. Non-billable CountTokens
  measured 11 text input tokens and 26 prompt-plus-audio tokens; the combined
  estimate was $0.000714 USD using conservative $2/$10-per-million-token rates.
  Whether either call was accepted and its actual usage remain unknown.
- A later owner-authorized controlled verification made one genuine
  `gemini-3.8-flash` Vertex AI text-stream request using the dedicated runtime
  identity. The SDK stream completed in 2,231 ms, but the returned text failed
  strict JSON validation. Correlation ID
  `b19a0b59-5aea-433e-b106-cac44ff60613`; attempt ID
  `3d0a97a2-9489-4151-88c6-0fba07547571`. The one-off test harness did not retain
  the exact HTTP status or response usage metadata after parsing failed; actual
  usage and charge are therefore unknown. Preflight CountTokens measured 15
  input tokens. The conservative estimate with the 32-token output limit is
  $0.000350 USD for this text request, not a hard cap. The earlier $0.000722
  estimate combined this request's preflight with the previous 26-token audio
  preflight.
- The synthetic-audio generation was skipped because the text check did not
  pass. No automatic retry or additional Gemini generation was made. The
  temporary Token Creator grant was restricted to the dedicated runtime
  service account, removed, and independently verified absent. Read-only
  Cloud Logging and Vertex EU/Global metric queries returned no per-request
  records for the test window; that does not establish actual billing.
- Billing Budgets API is now enabled. A project-scoped £1/month alert-only
  budget has 25%, 50%, 90%, 100% current-spend and 100% forecast alerts; it is
  not a spending cap. Project-scoped budget visibility works, but account-wide
  budget listing requires billing-account access. The quota query returned no
  model-specific numeric effective limit.
- Provider readiness as audited on this branch:

  | Provider path | Source and intended use | Authentication/configuration | Real generation evidence | Standalone launch state |
  | --- | --- | --- | --- | --- |
  | Vertex AI / Gemini | `@google/genai`; `gemini-3.8-flash` is the production text and audio model | Dedicated runtime service account with Vertex ADC; model access and CountTokens verified | One text stream completed, but failed strict JSON validation; no valid interpretation, usage metadata, or exact HTTP status retained. Audio generation was skipped. | Configured, but not proven to produce a valid report; do not enable paid use |
  | Google AI Studio / Gemini key | Supported optional `GOOGLE_GENAI_API_KEY` path; selects `gemini-3-flash-preview` | Not selected by the standalone deployment; do not reuse ZionCore 1 credentials | No generation test | Unverified and not selected |
  | Replit-managed Gemini | Supported by the workspace integration adapter and its paired integration variables | No standalone Cloud Run configuration verified | No generation test | Not a confirmed production provider |
  | OpenAI | `gpt-5.4-mini`, one bounded text fallback | Optional ZionCore 2nd Secret Manager resource has no enabled version | No generation test or fallback test | Unavailable for production fallback |
  | Replit-managed OpenAI | Supported by the workspace integration adapter and paired integration variables | No standalone Cloud Run configuration verified | No generation test | Not a confirmed production provider |
  | Browser Gemini Nano | Optional local model in the free listening interface, only after user consent | Browser capability-dependent, no server credential | No browser model inference verified in this check; unsupported browsers use local rules-based analysis | Local-only optional path; iPhone Safari uses the local fallback |
  | Deterministic local analysis | Browser signal measurement and rules-based reports | No provider or cloud credential required | Independent of the Gemini generation check | Local tools remain separate from cloud AI |

- The server router uses Gemini as the primary derived-feature interpretation
  provider and permits one OpenAI fallback after provider or validation
  failure. Raw audio segment review uses Gemini; the subsequent structured
  report may use the bounded OpenAI fallback. It has not been exercised against
  a real OpenAI endpoint. Current provider selection is
  capability- and configuration-based, not a measured complexity/latency
  optimizer. Token-based cost estimates, signed quotes, credit reservations,
  and fail-closed paid-usage flags exist. The current release configuration
  keeps paid usage and checkout disabled. No empirically validated
  cost-per-valid-report is available.
- The full application provider-path tests pass (116 API unit tests); four
  frequency contract and Genesis tests pass. The immutable Genesis source at
  `governance/genesis/GENESIS_SEED.original.txt` matches SHA-256
  `f87c324da247443bcf6ac4c6b799241e871abc3dec8aaa69c921cd123943f95e`.
  `buildAnalysisPrompt` includes the bounded, versioned Genesis operational
  context and selected domain references; the complete archive is not copied
  into each provider request. These checks verify source wiring and integrity,
  not a valid production AI report.
- These results do not verify a valid customer-facing AI report, fallback
  generation, Cloud Run metadata-server ADC, or the deployed application.
  Production deployment remains gated; do not represent AI generation as
  launch-verified.

## Data and access boundaries

The browser writes only records matching the observation schema in
`firestore.rules`, under `/users/{uid}/frequency_observations/{id}`. A user
cannot read or modify another UID's records. Financial ledgers, billing
documents, memberships, and server jobs are managed by the API's Firebase Admin
SDK and must not receive direct client writes. Admin SDK access uses Google
Cloud IAM and bypasses Firestore Security Rules.

Run `pnpm --filter @workspace/zioncore-frequency-lab run test:rules` before any
rules update. This uses the local emulator. The live project must be inspected
and separately verified after every production rules change.

## Independent production hostname

No independent ZionCore 2nd production hostname has been verified yet. Do not
add the main ZionCore host `zioncore.replit.app` to this application as a
substitute. Once the standalone host is available, add only that exact hostname
to Firebase Authentication authorized domains and the production App Check
key's allowed hostnames, then verify a real browser token exchange and signed-in
history flow from that host.
