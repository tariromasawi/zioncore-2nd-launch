# ZionCore 2nd execution matrix

**Updated:** 19 November 2026
**Source branch:** `deployment/zioncore-2nd`
**Export source commit:** `ee647e19e3c01e5622394f09d90b5503d4943e0c`
**Firebase project:** `zioncore-2nd-production` (`225578874852`)
**Status rule:** “Present” means source exists; “verified” means the stated behavior was exercised. A passing build is not production acceptance.

The latest user instruction selects the independent `zioncore-2nd-production`
Firebase project and prohibits changes to the main ZionCore production
application. This matrix follows that decision. The assigned Task #2 file
originally names `ethereal-throne-b20e6`; that main project was not changed.

## Requirements, evidence, and remaining acceptance

| Requirement | Implementation/source | Current status and evidence | Remaining acceptance / dependency |
|---|---|---|---|
| Preserve the full current source snapshot | Public repository `tariromasawi/zioncore-2nd-launch`, branch `main` | **Verified for this snapshot:** 614 tracked files, 613 checksummed entries; all hashes are checked in CI; the export uses a new root commit, not private Git history | Compare against the actual original Replit source/checkpoints to prove parity; that source history is not accessible from this workspace |
| Preserve the original Genesis Seed | `governance/genesis/GENESIS_SEED.original.txt`; Genesis package and archive tests | **Verified:** original archive hash `f87c324da247443bcf6ac4c6b799241e871abc3dec8aaa69c921cd123943f95e`; archive tests pass | Exercise every intended backend intelligence workflow against a live provider before claiming operational integration |
| Recover the exact approved nine-phase plan | `docs/ZIONCORE-2ND-PHASE-1-SOURCE-BASELINE.md` records the limitation | **Blocked:** exact nine titles and acceptance criteria are not present in accessible source | Recover the original plan record from project history or the owner; do not invent or rename phases |
| Build and test from preserved source | workspace manifests, lockfile, `verify:release`, GitHub Actions | **Verified:** local release suite passes; after the latest API diagnostics changes, API typecheck, 127 unit tests, and API build pass. GitHub Actions runs `44575531289` and `44575954927` passed for commits `3e523f69029f96aedeed43a93a4f33f6ea8b9b3b` and `99a50c232929fb0d2b64d5df0637ec466afee9a7`; earlier baseline runs also passed. The build removes the main-site origin when no Z2 hostname is set. | Resolve the non-fatal large web chunk warning if performance budgets require it |
| Public entry and customer-facing routes | `artifacts/zioncore-frequency-lab/src/App.tsx`, `src/pages/public-home/`, and `src/pages/` | **Present:** evidence-aware public landing at `/`; existing Live Lab remains at `/lab`; direct tool links include Dashboard, History, Messages, Exploration, Missions, Astronomy, Bioacoustics, Voice V2, Access and related routes | Test the full interaction, permission, processing, save/export and recovery flow for each route from the independent public host |
| Backend and API | `artifacts/api-server/src/` | **Present:** 17 endpoint registrations and corresponding routes/services in the current snapshot; production billing returns now accept only the explicitly configured Z2 origin and fail closed otherwise | Verify all intended endpoints against the deployed standalone frontend and production-safe service configuration |
| Independent Firebase project | `FIREBASE_SETUP_ZIONCORE_2ND.md`, Firebase app config | **Verified:** project ID and project number match; default Firestore Native database is in `europe-west2`; main project not modified | Confirm all production resources and deployment identities when the independent hosting target is selected |
| Email/password Auth | Firebase Auth configuration and `src/lib/firebase.ts`, account UI | **Verified in standalone browser:** temporary account signed up, signed in, and remained signed in after reload; cleanup left zero Auth users | Validate from the eventual independent public host and complete account recovery/email-verification paths |
| Google sign-in | Firebase Authentication provider | **Blocked:** live configuration returned `INVALID_GOOGLE_SIGN_IN_BRAND_CONFIG` | Owner must choose the public display name and support email, then the provider and callback flow must be retested |
| Apple sign-in | Firebase Authentication provider | **Blocked:** Apple Developer configuration was unavailable | Configure Apple Services ID/team/key using secure secret storage, then test the full callback flow |
| Customer history privacy | `firestore.rules`, observation services and API identity checks | **Partially verified live:** own observation create/read succeeded; cross-account read and client wallet write were denied; temporary data was deleted | Test all collection/subcollection paths, query shapes, deletion/export and production indexes with the final schema |
| Firestore App Check | Firebase App Check service for Firestore | **Verified for development client:** Firestore is `ENFORCED`; app-attested client write/read and attested REST read succeeded; the same read without App Check was rejected | Test the production reCAPTCHA key from the independently served production hostname; Identity Toolkit enforcement remains `OFF` |
| Firebase Storage | Storage configuration and application modules | **Partial:** source/configuration is present, but no complete live upload/read/delete journey was verified in this cycle | Verify bucket separation, rules, App Check behavior, retention, export and deletion using the final app host |
| Owner authentication/dashboard | owner routes, claim checks and admin UI | **Blocked for live identity:** source and emulator checks exist, but the project has zero users and no owner claim | Owner must create/sign into the intended account; verify identity, assign the approved claim securely, then test each owner operation |
| AI model availability | Gemini provider adapter, Vertex ADC and structured response schemas | **Partial:** ADC and token counting passed, and one authorized text generation completed but failed response validation. The deployment branch now supplies the supported Gemini response schemas for text and audio, preserves local Zod/quality checks, and records finish reasons and safe failure categories. No billable generation was repeated. | Obtain fresh authorization for one bounded live text request; run audio only if it succeeds; then verify saved results and Cloud Run runtime ADC after deployment |
| AI quota and spending limits | AI route guards, provider telemetry and project budget | **Partial:** Vertex ADC and the £1/month alert-only budget are verified. A 32-token one-off cap could not satisfy the 17-field, 1,800–2,400-word report; the exact historical finish reason and usage were not captured. The application itself uses 8,192 output tokens. Mocked regression coverage now verifies status/usage/finish-reason diagnostics, truncation categories and schema enforcement. | Request fresh authorization before any further billable generation; confirm the provider's returned usage and estimate before enabling paid customer AI |
| Stripe, credits and subscriptions | Stripe routes, webhook, wallet ledger and tests | **Present; live journey unverified:** emulator and unit tests pass; no real purchase or subscription was made | Verify test-mode Checkout/webhook/idempotency/refund/cancellation journeys before any approved production transaction |
| Messages and protocol compatibility | `/messages`, acoustic encoder/decoder and protocol documentation | **Present; original parity unverified:** current source and tests exist | Compare with recoverable original implementation and decode genuine transmitter recordings across devices/sample rates |
| Voice V2 | Voice V2 page and receiver/decoder code | **Present; physical/device validation incomplete** | Verify original recordings, supported sample rates, checksum recovery and mobile recording behavior |
| Missions, Astronomy, Bioacoustics and Exploration | dedicated pages, research modules and datasets/adapters | **Present in source; end-to-end claims remain partial** | Verify each workflow with licensed/provenance-backed data and distinguish real measurements from generated or simulated results |
| Mobile browser behavior | responsive UI and browser-based recording/audio | **Partially verified:** nine routes rendered at 402×874 Chromium emulation without horizontal overflow | Test iPhone Safari microphone permission, interruption recovery, playback, keyboard, upload and network behavior on a real device |
| GitHub source integrity and secret hygiene | `SOURCE_INVENTORY.sha256`, inventory script, CI | **Verified for the current deployment branch:** 617 tracked files, 616 checksummed entries; inventory check passes; the targeted credential-pattern scan found no matches and no tracked credential `.env` | Keep scans in the release workflow and perform a full security review before deployment |
| Dependency security | scoped `pnpm audit` of the standalone source lockfile | **Production audit clean:** Firebase Admin is updated to 14.5.1 and the compatible `rimraf` override removes the production `glob`/`minimatch` advisories. Full development audit still reports one high `picomatch` and three moderate advisories inside Firebase CLI tooling; the high has no patched release in the current registry result | Keep emulator tooling confined to development/CI; retain the passing release checks and re-evaluate when upstream patches are available |
| Independent production deployment | hosting and backend infrastructure | **Not deployed:** no independent live ZionCore 2nd URL was verified; no app deployment was made | Select/approve hosting, configure production keys and backend endpoint, then deploy and verify source-to-deployment commit |
| Main ZionCore isolation | separate project/repository policy | **Verified for this work:** no main app deployment, Firestore rules change, or main Firebase data change was made | Preserve this boundary during future integration and release work |

## Immediate sequence

1. Complete owner-independent Firebase work and keep the Firestore/App Check
   boundary documented.
2. Obtain only the Google brand details and owner identity needed for the
   corresponding live checks; configure Apple only if Apple sign-in is required.
3. Keep AI disabled until live quota, cost, credit and recovery behavior are
   demonstrated.
4. Recover the exact original nine-phase specification and the original
   standalone source history; compare by file and behavior before declaring
   parity.
5. Finish feature-specific end-to-end tests, then prepare an independent
   deployment and verify it against a specific GitHub commit.

No row marked partial or blocked should be presented as complete. No production
application deployment, real Stripe transaction, owner claim assignment, or
main-project modification is implied by this matrix.
