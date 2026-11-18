# ZionCore 2nd — Phase 1 Source Baseline

## Scope and status

This record carries out the available Phase 1 instructions to review the
project baseline and recover source provenance. The original approved
nine-phase document with the exact Phase 1 title and acceptance criteria is
not present in the accessible files or supplied directives. This is therefore
an evidence-based Phase 1 execution record, not a claim that the unavailable
master plan has been recovered or formally accepted.

## Preserved source lanes

| Source lane | Ref / commit | Tracked files | Finding |
|---|---|---:|---|
| Original task-source candidate | `7be5bc14971d67445dc68282aee140b75833b476` | 225 | Preserved historical source; not by itself the full current preview. |
| Recovery integration | `2ac10c8e112f5c02a6c8dcb417929b47b9cc75d4` | 843 | Preserved integration snapshot; not proof of original-source parity. |
| Composite source snapshot | `2e352721be2b9eb348ae9919496e756692e980e0` | 1,784 | Evidence composite, not an authoritative application checkout. |
| Standalone preparation | `36ce3d3d538421cc8fb4c1bbb2109ed8f3c51597` | 228 | Preserved standalone-preparation lane. |
| Phase 5 functional integration | `aad3a4d68853832c822e495fd480b80d1c87e436` | 843 | Preserved worktree and history. |
| Full preview implementation | `9a60773f3f649c9b4cfc63117c1643018f4cff0d` | 850 | Current complete preview source line; it also contains a separate reduced artifact and unrelated workspace material. |
| Private standalone GitHub source | `e6cbbd495ba4379726741c150209eb0a08d85c3a` on `main` | 604 | Preserves the full preview app, API, shared packages, project documentation and source inventory. |

The existing `ZIONCORE_PHASE_3_FULL_FILE_COMPARISON.csv` records prior
comparisons across the preservation lanes. It is supporting evidence, not a
replacement for checking the actual source files.

## File comparison: full preview line and GitHub source

At the recorded revisions, the 850-file preview worktree and 604-file GitHub
repository share 603 paths. Of those, 602 were byte-identical; the sole
difference was the release-readiness document, updated in the GitHub copy.
The GitHub repository adds `SOURCE_INVENTORY.sha256`, which records hashes for
the 603 source files.

The 247 preview-worktree paths not copied into the standalone repository are
classified as follows:

* 101 files under `artifacts/zioncore-2nd`, a separate artifact copy kept
  outside the selected full-preview application source.
* 69 files under `artifacts/mockup-sandbox`, the separate component-preview
  artifact.
* 41 CapCut/Replit research-source files, unrelated to the ZionCore 2nd
  runtime application.
* 26 internal `.agents/memory` files and 10 workspace-level files, including
  Replit configuration, a workspace Firebase configuration/indexes file,
  internal workflow metadata and research notes.

These files remain in their original workspace/history; none were deleted.
The root-level `firestore.indexes.json` and multi-artifact `firebase.json` were
not copied into the standalone source. The standalone app currently has its
own Firebase config and rules, but no standalone Hosting/API deployment
configuration. This is a known packaging/deployment gap, not a claim that
those workspace files are interchangeable with a standalone deployment.

The application route table in `artifacts/zioncore-frequency-lab/src/App.tsx`
registers `/`, `/access`, `/admin`, `/astronomy`, `/bioacoustics`, `/cards`,
`/dashboard`, `/devices`, `/devotional`, `/discover`, `/exploration`,
`/history`, `/history/:id`, `/history/device`, `/history/device/:id`,
`/messages`, `/missions`, `/owner`, `/premium`, `/voice-v2` and `/wallet`.

## Verified feature source

The selected full preview source registers customer-facing routes and pages
for Dashboard, History, Messages, Exploration, Missions, Astronomy,
Bioacoustics, Voice V2 and Access. The app also contains audio-analysis,
research, authentication, wallet and owner/admin modules. Route registration
and source presence do not prove that live account, AI, payment or admin
journeys work; see `ZIONCORE-2ND-RELEASE-READINESS.md` for those blockers.

## Original-source and plan limits

The supplied Replit address is a preview URL, not an editable-source
attestation. The current fork's full preview source is preserved, but the
accessible records do not prove byte-for-byte parity with the original
Replit project or expose its original checkpoints.

The available nine-phase directives require recovery of the previously
approved plan but do not contain its exact nine titles and acceptance
criteria. In particular, the exact original Phase 1 title remains unverified.
Do not invent or relabel the missing plan. Continue using the concrete
requirements in the directives and keep formal phase acceptance pending
recovery of the master specification.

## Current external state

* GitHub repository `tariromasawi/zioncore-2nd` is private; the full-source
  validation workflow passes on the preserved `main` branch. During this
  session, the repository API was found to report public visibility; it was
  restored to private. A source scan found no common credential patterns, but
  visibility changes cannot revoke copies made while source was public.
* Firestore read/rules and App Check were verified on
  `zioncore-2nd-production`; Authentication remains uninitialized.
* No independent ZionCore 2nd application deployment was made. The prior
  GitHub Pages configuration was removed and its README-only URL now returns
  HTTP 404; it was not the application.
* The original main ZionCore app and Firebase project were not changed.
