# ZionCore 2nd Release Readiness

## Verified

- The public source repository is
  `https://github.com/tariromasawi/zioncore-2nd-launch`, branch `main`. Its
  initial root commit is a clean export from private source commit
  `ee647e19e3c01e5622394f09d90b5503d4943e0c`; no private Git history was copied.
  Original-workspace byte-for-byte parity remains unverified.
- The repository contains 617 tracked files on the current deployment branch.
  `SOURCE_INVENTORY.sha256` records checksums for the 616 other tracked files; CI verifies the manifest after
  every push.
- The Phase 1 source baseline and file-comparison findings are recorded in
  `docs/ZIONCORE-2ND-PHASE-1-SOURCE-BASELINE.md`.
- The GitHub Actions validation workflow runs typecheck, web and API tests,
  Firebase emulator checks, source-inventory verification, and web/API
  production builds. The structured-output change
  `3e523f69029f96aedeed43a93a4f33f6ea8b9b3b` passed run `44575531289`;
  documentation follow-up `99a50c232929fb0d2b64d5df0637ec466afee9a7` passed
  run `44575954927`. Earlier baseline runs (`44550130621` and `44550116862`)
  also passed for `e6ca411dda2593658052c942f8d95b24a7bb490c`. PR #1 remains
  open and unmerged.
- A clean production-mode build after deferring optional lab visuals measured
  196,474 gzip bytes for the initial JavaScript, below the 200,000-byte budget.
- The complete standalone application source is present in
  `artifacts/zioncore-frequency-lab`, with the API in `artifacts/api-server`
  and shared packages in `lib/`.
- The public entry route `/` now introduces the research product and preserves
  the original Live Lab at `/lab`. All “open lab” links point to `/lab`.
- Canonical/social metadata uses `VITE_PUBLIC_SITE_URL`; until an independent
  hostname exists, the production build omits the old main-site canonical and
  sitemap URLs. The build rejects `zioncore.replit.app` as a standalone host.
- Production checkout return origins now require `ZIONCORE_2ND_PUBLIC_ORIGIN`
  and fail closed if it is unset, malformed, or set to the main-site domain.
- The original Genesis Seed is preserved byte-for-byte; SHA-256:
  `f87c324da247443bcf6ac4c6b799241e871abc3dec8aaa69c921cd123943f95e`.
- Firebase project identity and server service-account project were verified
  as `zioncore-2nd-production` (`225578874852`).
- A real read-only Admin SDK request completed against the live default
  Firestore database in `europe-west2`.
- Reviewed Firestore rules are deployed to the independent project. Rules
  emulator tests passed 14/14.
- Firestore App Check enforcement is enabled. The standalone browser SDK passed
  authenticated own-record write/read with a valid development App Check token;
  a matching authenticated REST read without App Check was rejected. The test
  account and record were deleted. Identity Toolkit enforcement remains off.
- Latest local checks passed: web unit tests 426/426; API unit tests 127/127; web and
  API typechecks; web and API production builds; wallet/ledger/Stripe emulator
  integration tests 20/20.
- Firebase Authentication emulator tests passed 3/3 for registration,
  sign-out, sign-in, invalid-password handling, duplicate email rejection and
  server-side token verification. Live Email/Password sign-up/sign-in and
  session restoration after reload also passed with a disposable account.
- The standalone browser rendered content at `/`, `/missions`, `/astronomy`,
  `/bioacoustics`, `/voice-v2`, `/access`, `/dashboard`, `/history`, and
  `/messages` in a simulated 402×874 viewport without horizontal overflow.
  Unauthenticated wallet and owner endpoints returned 401 as intended.
- Source uses the ZionCore 2nd Firebase project in runtime configuration; no
  main-project ID or main-project service-account variable was found in the
  selected runtime source.
- The main ZionCore Firebase project and production application were not
  changed.
- A manual-only GitHub deployment workflow, Firebase Hosting SPA/API rewrite,
  Cloud Run container definition, and ADC runtime path are prepared on the
  deployment branch. They have not been deployed or run against Google Cloud.
- The deployment workflow keeps checkout, premium access, paid AI usage,
  Firestore client access, and AI project-security approval disabled by default.

## Independent deployment status

- Target repository: `https://github.com/tariromasawi/zioncore-2nd-launch`
- Target Firebase project: `zioncore-2nd-production` (`225578874852`)
- Intended web origin: `https://zioncore-2nd-production.web.app` (not live;
  returned HTTP 404 at the last check)
- Intended API: Cloud Run service `zioncore-2nd-api` in `europe-west2`
- The workflow is manual-only, requires a typed deployment confirmation and
  must be run from `main`. No Cloud Run or Hosting release was started from the
  fork.
- The GitHub production environment now has an owner reviewer and a `main`-only
  branch policy. WIF is restricted to this repository's manual deployment
  workflow on `main`; dedicated deployer/runtime identities and their scoped
  project/resource permissions are configured.
- Firebase public API and App Check site keys are stored as GitHub environment
  variables, not committed to source. The production App ID matches the
  registered App Check configuration, and the reCAPTCHA key allows only the
  Firebase Hosting domains. Production-host token exchange remains unverified
  because the site has not been deployed.
- Gemini production no longer depends on a Secret Manager key. The Cloud Run
  runtime uses Vertex AI through ADC; the unused Gemini secret resource remains
  empty and the runtime has no access to it. OpenAI remains optional and needs
  an enabled secret version only if that fallback is configured.
- Cloud Run, Cloud Build, and Firebase Hosting APIs are enabled. The Cloud
   Billing and Billing Budgets APIs are enabled for inspection; the project
   reports an attached billing account. A project-scoped £1 monthly alert-only
   budget was created with 25%, 50%, 90%, 100% current and 100% forecast
   thresholds. No hard spending cap, billing attachment, or payment setting was
   changed. Google and Apple
  sign-in remain disabled; browser Firestore access and paid features remain
  fail-closed.
- Vertex AI (`aiplatform.googleapis.com`) is enabled and the dedicated runtime
  account has `roles/aiplatform.user`. Using a short-lived impersonated token for
  that runtime identity, the `@google/genai` SDK successfully counted text and
  synthetic WAV tokens for `gemini-3.8-flash` in the EU multi-region. Google
  documents CountTokens as non-billable. This verifies IAM, model/location, and
  text/audio request formats; Cloud Run's metadata-based ADC and billable
  generation/streaming remain unverified.
- The first capped text/audio batch timed out at the outer five-minute tool
  deadline without per-request diagnostics. In the later authorized controlled
  retry, one genuine Gemini text stream completed in 2,231 ms but failed strict
  JSON validation. Its correlation ID was
  `b19a0b59-5aea-433e-b106-cac44ff60613`; the one-off harness did not retain the
  exact HTTP status or returned token-usage metadata after the parse failure.
  CountTokens measured 15 text input tokens. The 32-output-token cap gives a
  conservative single-call estimate of $0.000350 USD; the earlier combined
  planning estimate using a 26-token audio preflight was $0.000722 USD. Actual
  usage and cost remain unknown. The audio request was skipped because Test A
  did not pass; no automatic retry or further generation was made. The
  temporary runtime-scoped Token Creator binding was removed and independently
  verified absent. Cloud Logging and inspected Vertex metrics had no matching
  records, and the quota query returned no model-specific numeric effective
  limit. Billable generation is not verified end to end.
- The earlier direct test harness did not retain exact response status or token
  usage after parsing failed; that historical information cannot be
  reconstructed. Application-route diagnostics have since been updated to
  retain provider usage and finish reasons before validation, with categorized
  validation failures and no prompt, audio, credentials, or response-body
  logging. No additional live generation was run.
- The deployment container was not built locally and the workflow was not run;
  local validation can verify source/build behavior but cannot prove Cloud
  Build, Firebase Hosting, App Check, or production AI operation.

## Gemini structured-output correction — 19 November 2026

- The prior authorized one-off text request used a 32-token output cap for a
  response contract with 17 required top-level fields and a requested
  1,800–2,400-word report. That cap cannot satisfy the contract. The test
  harness did not retain the model finish reason or usage after parsing failed,
  so the precise reason for that historical response failure cannot be proven.
- The production application uses an 8,192-token output cap; it was not using
  the test's 32-token cap. Before this correction its Gemini requests asked for
  JSON MIME output but did not send the response schema, leaving strict Zod
  validation as a post-generation check.
- The deployment branch now sends Gemini structured-output schemas for both
  full interpretations and short audio-segment observations. The schemas are
  derived from the existing Zod contracts, filtered to Vertex's documented
  supported fields, and still receive full server-side Zod and quality
  validation afterward. The Gemini prompt no longer repeats the response
  schema; the OpenAI fallback retains its explicit JSON-shape instructions.
- Provider telemetry now retains a sanitized finish reason alongside
  correlation/attempt IDs, timestamps, duration, provider/model, and returned
  usage. Validation failures are categorized as empty, incomplete, malformed
  JSON, schema-invalid, or quality-invalid without logging prompts, audio, or
  generated response text. Audio segment validation failures are logged with
  only the segment operation and category.
- Local synthetic and mocked regression tests cover schema compatibility,
  streamed text assembly, truncation classification, schema/quality failure
  categories, safe telemetry, and both Gemini response shapes. No billable
  generation was retried; live model generation remains unverified until a
  separately authorized bounded test.
- Reference: [Vertex AI structured output](https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/control-generated-output).

## Public repository security and privacy review — 19 November 2026

- GitHub reports this repository as public. Secret scanning and push protection
  are enabled. The open and resolved secret-alert queries both returned zero
  alerts.
- A targeted high-confidence credential-pattern scan across reachable Git
  history found no private-key headers, cloud access keys, GitHub tokens,
  OpenAI/Stripe secrets, webhook secrets, Slack tokens, or Google API-key
  patterns. The only credential-style tracked files are the two `.env.example`
  templates. This targeted scan is not a security certification.
- No code-scanning analysis is configured; GitHub returned `no analysis found`.
  The Replit SAST and privacy scanners in this workspace scan the main workspace
  root, not this nested ZionCore 2nd worktree, so their results are not claimed
  as scans of this public repository.
- The byte-preserved Genesis source contains owner-provided family/devotional
  names. It remains unchanged as required; public disclosure of that material
  is a residual privacy consideration. No source or Git history was rewritten.

## Dependency advisory status

- `pnpm audit --prod` reports no known vulnerabilities in production
  dependencies.
- The full development dependency audit reports three moderate advisories
  inside the Firebase CLI (`firebase-tools@15.36.0`) development dependency
  tree: `glob@10.5.0`, `minimatch@9.0.9`, and `@opentelemetry/core@1.30.1`.
  Registry metadata reports `firebase-tools@15.37.0` as the latest release, but
  the package manager's minimum-release-age policy rejected it as too recent on
  19 November 2026. The policy was not bypassed. A blanket major override could
  break the deployment/emulator CLI, so no unverified override was applied.
- GitHub currently lists a high-severity `picomatch@4.0.7` alert on the default
  branch, but the advisory is marked withdrawn and is absent from the local npm
  audit result. GitHub also reports the three moderate development-tree alerts.

## Historical hosting and source-visibility note

The following records an earlier review of the separate private preservation
repository `tariromasawi/zioncore-2nd`. It is not a claim that this new public
repository has a live application deployment.

At that time, a legacy GitHub Pages configuration on `main` at the repository
root had published a README/Jekyll page at
`https://tariromasawi.github.io/zioncore-2nd/`; this was not the application.
The Pages configuration was removed from that separate repository, and its
old deployment records were marked inactive. The URL returned HTTP 200 during
propagation but returned HTTP 404 at the final check.

The separate preservation repository had previously been reported public and
was restored to private; the period of that visibility was not established.
Changing visibility cannot revoke any copies made while source was public.
This new source release is intentionally public under the latest owner
directive. A targeted scan of its tracked files found no private-key, Stripe
secret, GitHub token, service-account private-key or credential `.env`
patterns. This is not a formal security certification.

## Blocking launch items

1. **Firebase Authentication and history:** Email/Password is enabled and live
   sign-up/sign-in passed using one disposable synthetic account, which was
   deleted afterward. A valid own observation create/read passed; cross-account
   read and wallet write were denied. No customer data or persistent test
   account remains. Google sign-in needs an owner-selected OAuth support email;
   Apple sign-in needs Apple Developer configuration. Firestore App Check
   enforcement is verified; owner access remains unverified.
2. **Cloud AI:** application requests remain gated until live authenticated
   flows and project/provider cost and quota settings are verified. One minimal
   text-only `gemini-3.8-flash` reachability check succeeded (7 prompt, 1 output,
   118 thought tokens; no customer data); this did not verify the app's
   authenticated AI route or quota enforcement.
3. **Business payments:** a read-only live Stripe catalog check confirmed active
   GBP prices for the app's current supported credit packs (250, 500, 1,050,
   2,750 and 5,750 credits) and £1/month Premium. Active legacy 50/200/1,000
   credit products also exist, but the app classifies them as legacy and does
   not expose them for new checkout. No checkout, webhook fulfillment, or
   charge was performed. Production checkout remains disabled until separate
   ZionCore 2nd Stripe credentials, the exact offer set, approved host, and
   environment gates are configured.
4. **Independent production API:** the source builds and the Replit preview
   API responds locally; no independent production backend was deployed.
5. **Live customer and owner journeys:** Email/Password sign-in, persistent
   session after reload, and temporary customer history access passed. Owner
   access remains unverified. A read-only Auth listing found zero users after
   cleanup, so no owner account or claim is available; none was assigned. The
   supplied Replit preview resolves to the main Firebase project, not this app,
   so it cannot validate the standalone Firebase client.
6. **Mobile browser:** the nine key routes rendered at 402×874 Chromium
   mobile-emulation width without horizontal overflow; final iPhone Safari
   end-to-end verification remains outstanding.
7. **Dependency advisories:** the production dependency audit now reports zero
   advisories after updating Firebase Admin to 14.5.1 and applying a tested
   `rimraf` 6 override. The full development audit still reports one high
   `picomatch` and three moderate advisories in Firebase CLI tooling. The high
   advisory has no patched release in the registry result; the CLI is used for
   emulator/development checks and is not a production runtime dependency.

## Deployment boundary

The independent Firestore rules and App Check enforcement are configured, but
no application deployment, billing activation, production Stripe operation,
or change to the original ZionCore project was performed. The public repository
is a source release, not a live application. The current Replit deployment
metadata still points to the main site, not this standalone product. Do not
describe the system as launch-ready until an independent host is deployed and
the resulting live journeys are verified.
