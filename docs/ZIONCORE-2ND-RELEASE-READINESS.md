# ZionCore 2nd Release Readiness

## Verified

- The public source repository is
  `https://github.com/tariromasawi/zioncore-2nd-launch`, branch `main`. Its
  initial root commit is a clean export from private source commit
  `ee647e19e3c01e5622394f09d90b5503d4943e0c`; no private Git history was copied.
  Original-workspace byte-for-byte parity remains unverified.
- The repository now contains 609 tracked files. `SOURCE_INVENTORY.sha256`
  records 608 tracked-file checksums; CI verifies the manifest after every push.
- The Phase 1 source baseline and file-comparison findings are recorded in
  `docs/ZIONCORE-2ND-PHASE-1-SOURCE-BASELINE.md`.
- The GitHub Actions validation workflow runs typecheck, web and API tests,
  Firebase emulator checks, source-inventory verification, and web/API
  production builds. The landing-page and standalone-origin changes passed the
  full local release gate and GitHub Actions run
  `44333293318` for source commit
  `53f76547f4b23aa83ed2b9235fd4e4603dc4d797`.
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
- Local checks passed: web unit tests 426/426; API unit tests 108/108; web and
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
  Billing API was enabled for inspection, and the project already reports an
  attached billing account. No billing attachment was changed. Google and Apple
  sign-in remain disabled; browser Firestore access and paid features remain
  fail-closed.
- Vertex AI (`aiplatform.googleapis.com`) is enabled and the dedicated runtime
  account has `roles/aiplatform.user`. Using a short-lived impersonated token for
  that runtime identity, the `@google/genai` SDK successfully counted text and
  synthetic WAV tokens for `gemini-3.8-flash` in the EU multi-region. Google
  documents CountTokens as non-billable. This verifies IAM, model/location, and
  text/audio request formats; Cloud Run's metadata-based ADC and billable
  generation/streaming remain unverified.
- The owner-authorized, 32-output-token-capped text-stream and synthetic
  0.25-second audio-generation checks timed out as one batch after five minutes
  without per-request results. Cloud Logging returned no matching entries, so
  request acceptance, response validity, usage, and actual cost are unknown.
  No retry was made. Non-billable CountTokens measured 11 text input tokens and
  26 prompt-plus-audio tokens; with a 32-token output cap per request and
  conservative $2/$10 rates, the combined maximum estimate is $0.000714, but
  the actual charge is unknown. The Billing Budgets API is disabled, and the
  quota query returned no model-specific numeric effective limit. These are
  unresolved release checks; do not claim AI generation or streaming is
  verified.
- The deployment container was not built locally and the workflow was not run;
  local validation can verify source/build behavior but cannot prove Cloud
  Build, Firebase Hosting, App Check, or production AI operation.

## Dependency advisory status

- `pnpm audit --prod` reports no known vulnerabilities in production
  dependencies.
- The full development dependency audit reports three moderate advisories
  inside the Firebase CLI (`firebase-tools@15.36.0`) dependency tree:
  `glob@10.5.0`, `minimatch@9.0.9`, and `@opentelemetry/core@1.30.1`.
  `firebase-tools@15.36.0` is the current published version; a blanket major
  override could break the deployment/emulator CLI, so no unverified override
  was applied. Recheck when the upstream CLI updates its dependency ranges.
- GitHub currently lists a high-severity `picomatch@4.0.7` alert on the default
  branch, but the advisory is marked withdrawn and is absent from the local npm
  audit result. GitHub also reports the three moderate development-tree alerts.
  The code-scanning alerts endpoint returned 404; whether code scanning is
  configured is not verified.

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
