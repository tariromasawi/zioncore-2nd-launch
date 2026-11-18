# ZionCore 2nd Source Provenance

## Preserved implementation

The full laboratory application source is preserved in
`artifacts/zioncore-frequency-lab`, with its API in `artifacts/api-server` and
the shared application contracts and libraries in `lib/`. The source was
developed in the `zioncore-2nd/full-implementation` worktree and corresponds to
the multi-route preview experience supplied for ZionCore 2nd. The repository
keeps the full route, component, stylesheet, test, asset, API and shared-library
trees rather than substituting the reduced `artifacts/zioncore-2nd` snapshot.

The development worktree contained two identical Genesis Seed copies. The
standalone repository keeps the canonical archival file at
`governance/genesis/GENESIS_SEED.original.txt`. Both source copies were verified
to have SHA-256
`f87c324da247443bcf6ac4c6b799241e871abc3dec8aaa69c921cd123943f95e`.

## Included project boundaries

The standalone source contains the full web application, API server, shared
packages, required root manifests and lockfile, Firebase configuration and
rules, Genesis source, project-specific documentation, and CI validation
workflow. It excludes the main ZionCore application, other unrelated artifacts,
generated output, dependency caches, environment files containing values, and
credentials.

Firebase App Check keys, Firebase service-account JSON, Stripe credentials,
provider credentials and customer data are not committed. Configure them only
through the target environment's secret manager.

## Reproducibility

The CI workflow installs from the checked-in pnpm lockfile, runs web and API
typechecks and unit tests, runs Firebase emulator tests, and builds both
applications. It does not deploy. Production deployment remains gated until
Firebase Authentication, payment configuration, a backend runtime and the
required release approvals are ready.
