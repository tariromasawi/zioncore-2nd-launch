# ZionCore 2nd

ZionCore 2nd is the full standalone research laboratory source preserved from
the `zioncore-2nd/full-implementation` worktree. Its web application is
`artifacts/zioncore-frequency-lab`; its API is `artifacts/api-server`; shared
contracts and services are in `lib/`. This repository does not depend on the
main ZionCore application's source or API.

Public source repository: https://github.com/tariromasawi/zioncore-2nd-launch.
This repository is a source release, not an independently deployed live
application. See `docs/ZIONCORE-2ND-EXECUTION-MATRIX.md` and
`docs/ZIONCORE-2ND-RELEASE-READINESS.md` for verified capabilities and blockers.

## Included experience

The public entry page at `/` links into the Live Lab at `/lab` and the full web
application: exploration, missions, astronomy, bioacoustics, Voice V2, access
guidance, messages, device tools, signal cards, history, wallet, premium and
owner routes. The API contains authenticated
Firebase identity checks, research and AI routes, wallet and credit-ledger
operations, Stripe webhook/fulfilment code, owner diagnostics and health
endpoints. Financial and owner actions remain server-authorized.

Builds accept `VITE_PUBLIC_SITE_URL` only as an independent HTTPS origin. With
no hostname configured, the build removes old main-site canonical and sitemap
metadata rather than pointing ZionCore 2nd at `zioncore.replit.app`. Production
billing returns fail closed until `ZIONCORE_2ND_PUBLIC_ORIGIN` is set to the
verified standalone host.

The original Genesis Seed is preserved byte-for-byte at
`governance/genesis/GENESIS_SEED.original.txt`. Its SHA-256 is
`f87c324da247443bcf6ac4c6b799241e871abc3dec8aaa69c921cd123943f95e`.
`ZIONCORE_GENESIS_SEED_INTEGRATION.md` maps its bounded, versioned operational
context to the API prompt pipeline; the immutable source is not rewritten.

## Install and run

Use Node.js 22 or newer and pnpm 10:

```sh
pnpm install --frozen-lockfile
pnpm --filter @workspace/zioncore-frequency-lab run dev
pnpm --filter @workspace/api-server run dev
```

The artifact manifests contain the Replit preview routing configuration.
For local development, configure the public Firebase values documented in
`artifacts/zioncore-frequency-lab/.env.example` and keep the API service
credential in a server-side secret store as documented in
`artifacts/api-server/.env.example`. Never commit credential values.

## Validation

After staging source changes, refresh the tracked-file checksum manifest with
`pnpm run inventory:update`. CI runs `pnpm run inventory:check` and fails if the
manifest is stale.

```sh
pnpm run inventory:check
pnpm run typecheck
pnpm --filter @workspace/zioncore-frequency-lab run test:unit
pnpm --filter @workspace/api-server run test:unit
PORT=3000 BASE_PATH=/ pnpm --filter @workspace/zioncore-frequency-lab run build
pnpm --filter @workspace/api-server run build
```

Authentication, Firestore rules and wallet integration tests use the Firebase
emulators; see the `test:auth`, `test:rules` and `test:wallet` scripts in the
package manifests. Emulator passes do not establish live-project readiness.
GitHub Actions runs the unit, type, emulator and build checks on proposed
changes. It does not deploy production.

## Firebase status

The independent project is `zioncore-2nd-production` (`225578874852`). Its
default Firestore database is Native mode in `europe-west2`; reviewed rules are
deployed. Read-only Admin access succeeded using the project-specific service
identity. Development and production App Check configuration use distinct web
app IDs and hostname-restricted reCAPTCHA keys. Firestore App Check enforcement
is enabled and passed a standalone browser client test; Authentication App
Check enforcement remains off.

Firebase Authentication is now initialized with Email/Password through the
Firebase CLI; the live config read returned HTTP 200 and the exact Replit
development hostname is authorized. A disposable synthetic account completed
live sign-up/sign-in; its Firestore observation create/read succeeded,
cross-account read and wallet write were denied, and the account and observation
were removed. Its authenticated session also survived a browser reload. No
customer data or persistent test account remains. Google
sign-in still needs an owner-selected OAuth support email; Apple sign-in needs
Apple Developer configuration. Owner access still needs verification; the
project currently has zero Auth users and no owner claim. The supplied Replit
preview currently loads the main Firebase project, not this independent app,
so it cannot verify the ZionCore 2nd browser flow.
Cloud AI remains gated pending
provider quota and usage-control confirmation. See
`artifacts/zioncore-frequency-lab/FIREBASE_SETUP_ZIONCORE_2ND.md` for evidence.

## Release boundary

This source is buildable, but it is **not yet a complete business launch**.
Google and Apple sign-in, authenticated browser journeys, live AI
availability/quota, production payment configuration, an independently
deployed API runtime, and final mobile-browser verification remain outstanding.
The original ZionCore production project and its Firebase resources were not
modified.
