# Phase 1 integration and acceptance status

Reviewed: 30 October 2026

Branch reviewed: `feature/phase1-frontend-layout` at `0428f89` (29 October 2026). The working tree was clean before this status update.

## Overall status

The latest branch passes a focused, no-model end-to-end flow through the current Learn interface and SQLite-backed MCP service. The project team also confirmed that real microphone recognition and audible playback are usable. Full Phase 1 acceptance remains open: generated AI explanations are unavailable, the frontend unit suite has one failing test, lint reports three errors, and team/partner sign-off has not been recorded.

Status meanings: **Complete** = the stated criterion has evidence; **Partial** = implementation or a limited check exists, but a validation result or dependency remains; **Open** = an acceptance gate has not been met; **Phase 2** = planned work outside Phase 1.

## Acceptance status

| Acceptance area | Status | Latest branch evidence | Remaining closure action |
|---|---|---|---|
| Branch integration | Complete | Current branch includes SQLite/MCP integration and the 29 October frontend version 2 and hydration fix (`036523f`, `bef9f34`, `0428f89`). It tracks `origin/feature/phase1-frontend-layout`. | Preserve the branch and commit reference in the final acceptance record. |
| Real course material and source navigation | Partial | The 30 October production-browser check confirmed units, outline, material, search, source navigation and ordered content via MCP/SQLite. The 15 recorded retrieval cases with expected source IDs are all marked passed. Mapping exceptions and 453 image-only slides remain unresolved. | Resolve mapping exceptions, agree image-only slide handling, and keep source/content checks in regression evidence. |
| Frontend workflow and progress | Partial | The 30 October Learn-page check passed typed and simulated-voice questions, source links, synthetic feedback, read-aloud, local progress increment and no-page-error checks. The production build passed. | Fix the one frontend unit-test failure and three lint errors; rerun unit tests, lint, hydration/progress checks and the browser journey. |
| MCP and backend integration | Partial | The production-browser/API check exercised all six actions through the frontend MCP client: units, outline, material, search, concept explanation and marked-answer feedback. MCP self-test passed. Python suite: 49 passed, 3 expected failures. | Reconcile the old backend README test count, rerun checks after frontend fixes, and attach reproducible output. |
| Recorded retrieval examples | Complete | `docs/evidence/phase1/retrieval.json` contains 15 natural-language, spoken-style question cases with expected source IDs; all 15 are marked passed. These are text cases, not audio recordings. | Rerun if retrieval logic or course mappings change. |
| Real microphone and audible playback | Complete | The project team manually confirmed on 30 October that real microphone recognition and audible playback are usable. The browser automation used simulated speech. | Record the tested browser/device and basic failure/fallback observations. |
| Ask Aita generated explanations | Open | The current frontend calls `explain_concept` through MCP and correctly displays context-only mode. The production-browser test confirmed no-model handling and source display. The backend README states that partner model credentials are unavailable; generated answers are not validated. | Obtain partner AI-pool access or an approved scope exception, then test grounded answers, false premises, unsupported questions and service failures. |
| Assessment feedback explanation | Partial | The current route sends controlled synthetic correct/incorrect cases through `explain_marked_answer`; API and browser checks passed, including prompt filtering. No model is configured, so generated feedback is unavailable. | Validate model-backed synthetic explanations without crossing the human-marking boundary or exposing answer keys. |
| Latest-branch context-only end-to-end flow | Complete | On 30 October, the production build was exercised in Edge with the model disabled. Course selection/material, typed and simulated-voice questions, source links, synthetic feedback, read-aloud and local progress increment passed; no browser page errors were reported. | Preserve the run conditions and repeat after code changes. This does not verify generated AI answers or real microphone hardware. |
| Phase 1 acceptance and sign-off | Open | The context-only flow passes, but AI generation is unavailable. `npm test` reports 33 passed and one failed; `npm run lint` reports three errors. No completed Must Have matrix or team/partner review is recorded. | Fix frontend checks, complete the Must Have matrix and review, and obtain model access or an explicitly approved scope exception before closing full acceptance. |
| Production database, authentication and cross-device progress | Phase 2 | The prototype stores progress in browser storage; production learner-data storage and authentication are not implemented. | Confirm database/GAR and privacy scope, then implement authentication, persistent progress, access isolation and recovery checks in Phase 2. |

## Latest-branch verification record (30 October 2026)

| Check | Result |
|---|---|
| Frontend production build (`npm run build`) | Passed. |
| Frontend unit tests (`npm test`) | 33 passed, 1 failed. `tests/voice-navigation.test.js` expected the legacy `/ask` route but received `null`. |
| Frontend lint (`npm run lint`) | Failed with three `react-hooks/set-state-in-effect` errors: `AppHeader.jsx:39` and `AitaMvp.jsx:90,100`. |
| Python suite (`python -m pytest -q -p no:cacheprovider`) | 49 passed, 3 expected failures, 1 pytest deprecation warning. |
| MCP self-test (`python -m aita.server --selftest`) | Passed; model reported unavailable. |
| Production-browser/API integration | Passed in Edge with model variables unset: all six MCP actions exercised; context-only answer, sources, synthetic feedback, origin rejection, reading and local progress checks passed. Speech in browser automation was simulated. |
| Manual microphone/playback check | Project team confirmed usable on 30 October; browser/device details were not recorded. |

The focused end-to-end browser run checked the latest built branch, but it was run as an inline verification and did not overwrite the historical `docs/evidence/phase1/browser.json` results. The checked-in `src/frontend/scripts/check-integration.mjs` contains selectors for the earlier Learn layout and must be updated before it can serve as the repeatable regression runner for version 2.

## External decisions still required

1. Confirm the partner AI endpoint/model and access, or document an explicitly approved Phase 1 scope exception. Context-only operation is not evidence of generated AI explanations.
2. Approve how the 453 image-only slides will be handled; do not claim OCR coverage unless it is implemented and verified.
3. Resolve outstanding data-mapping tokens and audit exceptions with the team/partner.
4. Record human review of AI-assisted code and the relevant pull requests.

Database/GAR, production authentication and cross-device persistence remain Phase 2 work.

## Carry-over into Phase 2

If Phase 1 acceptance is not closed this semester, the outstanding acceptance actions will be carried into the opening stage of Phase 2 next semester and completed before later Phase 2 implementation proceeds. Carry-over actions are: resolve the frontend unit-test failure and lint errors; obtain partner model access or an approved scope exception; validate model-backed concept and synthetic assessment explanations; resolve image-only slide and data-mapping decisions; rerun the Must Have matrix and current-branch integration checks; and record team/partner review. Production database, authentication and cross-device progress remain planned Phase 2 work.
