# ZionCore 2nd Release Readiness

## Verified

- The public source repository is
  `https://github.com/tariromasawi/zioncore-2nd-launch`, branch `main`. Its
  initial root commit is a clean export from private source commit
  `ee647e19e3c01e5622394f09d90b5503d4943e0c`; no private Git history was copied.
  Original-workspace byte-for-byte parity remains unverified.
- The repository contains 607 tracked files. `SOURCE_INVENTORY.sha256` records
  606 tracked-file checksums; CI verifies the manifest after every push.
- The Phase 1 source baseline and file-comparison findings are recorded in
  `docs/ZIONCORE-2ND-PHASE-1-SOURCE-BASELINE.md`.
- The GitHub Actions validation workflow runs typecheck, web and API tests,
  Firebase emulator checks, source-inventory verification, and web/API
  production builds. Public root commit `a46007d35d5252b8d30ef950079ec892d85f4c19`
  passed GitHub Actions run `44323918639`.
- A clean production-mode build after deferring optional lab visuals measured
  196,474 gzip bytes for the initial JavaScript, below the 200,000-byte budget.
- The complete preview application source is present in
  `artifacts/zioncore-frequency-lab`, with the API in `artifacts/api-server`
  and shared packages in `lib/`.
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
3. **Business payments:** code and emulator tests exist, but live Stripe
   catalogue, independent price IDs, webhook delivery, and customer checkout
   were not tested or changed.
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
7. **Dependency advisories:** the scoped full dependency audit reports one high
   and one moderate development-tool advisory, plus two moderate production
   transitive advisories (`glob` and `minimatch`). The high `picomatch` advisory
   currently has no patched release in the registry result. The Firebase CLI
   was updated to 15.36.0; the advisory remains open. Do not claim a clean
   dependency audit.

## Deployment boundary

The independent Firestore rules and App Check enforcement are configured, but
no application deployment, billing activation, production Stripe operation,
or change to the original ZionCore project was performed. The public repository
is a source release, not a live application. Do not describe the system as
launch-ready until the blockers above are resolved and the resulting live
journeys are verified.
