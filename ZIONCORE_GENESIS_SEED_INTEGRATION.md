# ZionCore Genesis Seed — Integration Map

**Status:** The full lab client routes AI interpretation through the authenticated,
credit-quoted server API. Development and production App Check token exchange
have been verified; Firebase Authentication is not initialized, so authenticated
AI requests remain unavailable until that external project blocker is resolved.

## Source and version

The immutable source and correction record are documented in
[`ZIONCORE_GENESIS_SEED_CHANGELOG.md`](ZIONCORE_GENESIS_SEED_CHANGELOG.md).
The runtime operational-context implementation is version `1.3.1` and includes
the exact source SHA-256 in its provider prompt. Each request is capped at 8,000
Genesis-context characters; it receives a compact operational policy and
curated source-informed modules, not the full source archive or claimed
verbatim excerpts.

## Primary server-side flow

```text
authenticated lab request
  → POST /api/ai/interpretation or /api/ai/interpretation/audio
  → server validates identity, request, quote, and credit reservation
  → buildAnalysisPrompt(...)
  → buildGenesisSeedContext(...)
  → Gemini/OpenAI provider router
  → validated interpretation and financial settlement
```

Traceable code points:

| Stage | Source |
| --- | --- |
| Versioned operational context and source provenance | `lib/frequency-ai-contract/src/genesis-seed.ts` |
| Prompt assembly includes the Genesis context | `lib/frequency-ai-contract/src/index.ts`, `buildAnalysisPrompt` |
| Authenticated, quoted, credit-reserved interpretation | `artifacts/api-server/src/routes/ai-interpretation.ts` |
| Consented audio interpretation uses the same prompt builder | `artifacts/api-server/src/routes/ai-audio-interpretation.ts` |
| Provider routing | `artifacts/api-server/src/lib/ai-provider-router.ts` |
| Full lab client uses server quote and interpretation APIs | `artifacts/zioncore-frequency-lab/src/lib/ai-analysis.ts` |
| Full lab App Check and Firebase identity headers | `artifacts/zioncore-frequency-lab/src/lib/firebase.ts` |
| Quote preview, explicit credit confirmation, and no-cost cancellation | `artifacts/zioncore-frequency-lab/src/components/analysis-panel.tsx` and `artifacts/zioncore-frequency-lab/src/App.tsx` |
| Basic-measurement contract, with missing-feature boundaries | `lib/api-spec/openapi.yaml` and `lib/frequency-ai-contract/src/index.ts` |
| Archive hash verification, run in CI and release checks | `lib/frequency-ai-contract/src/genesis-seed.test.ts` and `lib/frequency-ai-contract/package.json` |
| Backend route verifies source hash reaches the provider prompt | `artifacts/api-server/src/routes/ai-interpretation.integration.test.ts` |

The backend does not send the full 169,387-character archive on every request.
It sends a source-informed policy and curated modules within the 8,000-character
context limit. This avoids unnecessary provider cost and unrelated family
details. The archive remains complete and available to authorized source review.
The runtime context keeps observations, interpretations, hypotheses, and faith
reflection distinct, and does not override consent, privacy, security, or
required owner approvals.

## Full ZionCore 2nd interpretation path

`artifacts/zioncore-frequency-lab/src/lib/ai-analysis.ts` sends only the selected,
structured measurement values to the existing API. Firebase ID token and App
Check headers are required. The user receives a server-signed credit quote and
must confirm before a request begins. The backend applies the same Genesis
context, provider routing, output checks, credit reservation, and recovery
behavior used by the primary lab. The request does not include microphone audio,
spectrum bins, or notes.

Advanced `signalFeatures` and `spectralMatrixAnalysis` are optional in the shared
API contract. When they are absent, the backend states that they were not
supplied and prohibits the model from inventing them. Integration tests cover
the base-measurement path using the local Firestore emulator; no paid live
request has been made.

Production App Check token exchange is verified. Firebase Authentication,
live model availability, quota behavior, and mobile-browser operation still
require external verification before launch.

## Scope and safeguards

The source archive is preserved unchanged. Runtime instructions are selected
operational guidance, not a replacement document. Software will not claim
consciousness, supernatural guarantees, or unverified external communication,
and will not implement self-replication, unauthorized access, surveillance, or
unreviewed production changes. Those limits do not edit the archive; they define
what the application can safely and truthfully execute.

No new Genesis-only frontend features were added. Existing Live Lab, History,
Exploration, and Genesis routes are preserved.
