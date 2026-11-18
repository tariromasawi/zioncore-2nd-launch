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
  after the check. No persistent test account remains and billing was not enabled.
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
- A minimal text-only provider check on `gemini-3.8-flash` succeeded with
  `STOP`; usage reported 7 prompt, 1 output, and 118 thought tokens. It contained
  no customer data and verified provider reachability only. Application AI
  remains gated until project/provider quotas and usage controls are confirmed.

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
