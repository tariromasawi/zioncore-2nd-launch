# ZionCore release evidence

## Repeatable local checks

Run `pnpm run verify:release` from the workspace root. The same command is
registered as the `zioncore-release` validation.

The command stops at the first failed or unexecutable check. Each subprocess
has an eight-minute timeout. A stopped run does not imply later checks passed.
The local database suites use the existing demo-project Firebase emulators;
wallet/fulfillment/recovery tests reject absent, remote or malformed emulator
targets before initializing their Firebase app.

Checks:

1. Canonical workspace type checking.
2. Frontend unit tests.
3. API unit tests.
4. Tooling tests, including failure behavior of this check runner.
5. Firebase Authentication emulator tests.
6. Firestore client security-rule emulator tests.
7. Transactional wallet, Stripe fulfillment and paid-reading recovery emulator tests.
8. API production build.
9. Web production build, including the initial-bundle regression guard.

This is a repeatable engineering check, not an automatic block on the Publish
button, a security audit, or a certification that live integrations work.
Emulator tests do not contact Stripe to create real payments.

## Operational evidence still required

### Local results verified — 17 November 2026

| Suite | Passed |
| --- | ---: |
| Genesis archive integrity | 2 |
| Frontend unit | 426 |
| API unit | 108 |
| Tooling unit | 10 |
| Authentication emulator | 3 |
| Firestore rules emulator | 14 |
| Wallet, fulfillment and recovery emulator | 20 |
| **Total distinct tests** | **583** |

`pnpm run verify:release` passed all ten checks on 17 November 2026: workspace
types, Genesis integrity, frontend and API tests, tooling tests, Auth and
Firestore emulator checks, wallet/fulfillment recovery tests, and both
production builds. The browser bundle emitted a non-fatal large-chunk warning.
These are local and emulator checks, not production-provider or mobile Safari
certification.

### Live Firebase checks verified — 17 November 2026

- A disposable Firebase Auth account signed up and signed in against
  `zioncore-2nd-production`.
- The isolated standalone browser build obtained an App Check token for the
  registered development App ID. After Firestore enforcement was set to
  `ENFORCED`, the client SDK created and read its own observation successfully.
- A direct Firestore read with both the Firebase ID token and App Check token
  succeeded; the same read without App Check was rejected. Earlier live rule
  checks also denied cross-account reads and client wallet writes.
- The temporary account and all test observations were deleted; a follow-up
  Auth listing found zero users.
- Email/Password authentication remained signed in after a full browser reload.
- At a simulated 402×874 mobile viewport, `/`, `/missions`, `/astronomy`,
  `/bioacoustics`, `/voice-v2`, `/access`, `/dashboard`, `/history`, and
  `/messages` rendered with content and no horizontal overflow. This was
  Chromium mobile emulation, not iPhone Safari testing.
- The supplied shared Replit preview currently initializes the main Firebase
  project, so it was not used for ZionCore 2nd verification.

Both production builds and the canonical workspace type check passed. No real
purchase or production-data write was performed. Local emulator logs are
excluded from Git and deployment inputs.

| Area | Required evidence before claiming operational completion |
| --- | --- |
| Production identity | Google/Apple provider setup and owner journey; Email/Password sign-in and reload persistence passed in the standalone development browser |
| Production App Check | Firestore enforcement passed with the development debug provider; validate the production reCAPTCHA key from the independently served app |
| Production wallet | Correct balance after refresh, sign-out/sign-in and a second authorized session |
| Live Stripe fulfillment | An explicitly approved real purchase, verified webhook delivery, one credit grant across repeated notifications, correct cancellation/refund handling |
| Premium | Verified subscription state, expiry/cancellation handling and correct server-side entitlement |
| Paid interpretation | Approved quote, reservation, successful report, settlement, visible remaining balance and recovery after interrupted transport |
| Production cleanup | Required Firestore collection-group index available; retry-record cleanup succeeds |
| Storage reliability | Investigate existing SDK listener/deprecation warnings without hiding them or weakening stream cleanup |
| Experience | Real-device microphone permissions, audio playback/stop, keyboard access and representative mobile-network performance |

Do not mark these complete from the presence of code, a health response,
successful local tests or installed credentials. Record the actual observed
result without customer identifiers, tokens, signed URLs or credentials.

## Tactical priorities

- Resolve money, identity, privacy and data-loss risks before cosmetic additions.
- Change one coherent behavior at a time; preserve working capabilities.
- Test failure and retry paths, not only successful responses.
- Keep speculative interpretation distinct from measured signal observations.
- Prefer measured reliability, comprehension and repeat use over code volume
  or unsupported superiority claims.
- Evaluate retention, purchase completion, support issues and costs using
  observed, appropriately collected data; none is guaranteed by this checklist.
