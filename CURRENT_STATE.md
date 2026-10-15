# CartSync Current State (verified 2026-08-11, before V1 CV pipeline implementation)

This file is a snapshot, not a living document. It exists to separate what is
independently re-verified in this session from what earlier reports claimed.
Where this repeats `CARTSYNC_QA_FINAL_REPORT.md` or
`docs/architecture/canonical-architecture-decision.md`, it's because those
claims were re-checked against the actual code, not copied blind.

## Verified working

- **Backend test suite**: 65/65 passing (`cd apps/api && venv/Scripts/python.exe -m pytest -q`), re-run this session, not assumed from the earlier report.
- **Frontend**: `tsc --noEmit` clean, `next build` succeeds (13 static routes), ESLint at 49 errors/21 warnings (pre-existing `no-explicit-any`, not addressed).
- **Auth**: register/login/me round-trip, JWT via `python-jose`, bcrypt hashing, rate-limited (5/min, IP-keyed).
- **Rate limiting**: live on `/auth/{login,register}`, `/measurement/extract`, `/conversation/chat`, `/product-intelligence/recommendations` (added this session, `apps/api/core/rate_limit.py`).
- **Manual measurement entry**: `POST /api/v1/measurement/extract` accepts and validates numeric `raw_data` (chest/waist/hip/inseam/shoulder, bounded 20-250cm), persists `MeasurementProfile` (raw) + `EffectiveMeasurement` (derived).
- **Knowledge Graph read path**: `GET /api/v1/graph/me` aggregates measurements/preferences/brand-affinity correctly, scoped by JWT user (IDOR-tested).
- **Stylist engine**: deterministic sizing (`services/stylist/*`), reachable via `/stylist/recommendation`, `/stylist/preferences` (bug fixed this session -- see below).
- **Product Intelligence engine**: deterministic scoring (`services/product_intelligence/*`), reachable via `/product-intelligence/recommendations`.
- **Conversation engine**: rules-based intent routing (`services/conversation/conversation_engine.py`), explicitly self-labeled "LLM (Mocked for now)" in its own code -- not a real LLM, and the code doesn't claim to be one.
- **Camera UX shell**: `getUserMedia` permission flow, front/back toggle, 3-2-1 countdown, canvas JPEG capture, silhouette overlay guide, `CameraStateMachine` with a defined transition graph (`apps/web/src/components/camera/CameraView.tsx`, `apps/web/src/lib/cv/camera/state-machine.ts`).
- **Image quality utilities**: real (not stubbed) Laplacian-variance blur detection and luminance-based lighting analysis, both operating on real `ImageData` (`apps/web/src/lib/cv/quality/{blur,lighting,validation}.ts`).

## Confirmed NOT working / not implemented (as of this session, before today's CV work)

- **No pose detection is wired in anywhere in the active request path.** `apps/web/src/lib/cv/vision/{types,interfaces}.ts` define a `VisionProvider` interface and `PoseResult`/`VisionMetrics` types -- zero implementations exist. No `@mediapipe/*` package is in `apps/web/package.json`.
- **`apps/web/src/app/measurements/camera/page.tsx` captures a photo and does nothing with it.** `handleCapture` runs a 600ms `setTimeout`, discards the captured `imageSrc`, and routes the user to manual entry. This is already honest (a prior QA pass fixed the version that falsely implied processing happened) -- the point here is it is not a partial pipeline, it is a no-op.
- **No calibration module exists.** No height-based (or any) pixel-to-cm scale estimation code exists anywhere in `apps/web` or `apps/api`.
- **No measurement geometry module exists.** No circumference-from-landmark formula, ellipse approximation, or any 2D-to-measurement math exists in the active stack.
- **No confidence computation exists for camera measurements.** `apps/api/routers/measurement.py`'s `/extract` endpoint hardcodes `confidence_score=0.92` for every manual submission -- this is intentionally out of scope for this bug (manual entry has no meaningful "confidence" to compute), but it means there is currently no code anywhere that computes a confidence score from real inputs.
- **No front/side consistency check exists.** There is currently no code path that even accepts two images for one measurement session.
- **No measurement review/confirm UI exists.** `/measurement/extract` is called and committed in one step wherever it's called from (currently only reachable via manual entry, which doesn't need review).
- **No provenance fields exist in the database.** `MeasurementProfile` has `source_type` (string, unvalidated) and `raw_data` (JSON blob) -- no `model_version`, `algorithm_version`, `calibration_method`, or structured confidence breakdown columns exist on either `MeasurementProfile` or `EffectiveMeasurement`.
- **No `/testing` or `/beta` feedback flow exists.** No feedback-collection UI or API endpoint exists anywhere in the repo.
- **Frontend has zero automated tests.** `apps/web/package.json` has no `test` script and no test runner (`vitest`/`jest`/`@testing-library/*`) is installed. Root `package.json`'s `npm run test --workspaces` currently no-ops for `apps/web`.
- **Real-user testing has not happened.** No human has captured a real photo through this pipeline and compared the result to a manually-measured ground truth. Every accuracy/repeatability claim in `research/cv/benchmarks/model_candidates.md` is about raw pose-landmark detection latency/visibility, not measurement accuracy -- because there is no measurement pipeline yet to measure the accuracy of.

## This session's starting bug fix (carried over from the prior stabilization pass)

`POST /stylist/preferences` crashed with an unhandled 500 the first time any
user set a preference (`UserPreference` created with no `id`, no DB default
-- fixed in `apps/api/routers/stylist.py`, regression-tested).

## What "done" looks like for V1 (from this session's directive)

Real MediaPipe pose detection (client-side, CPU, per
`research/cv/benchmarks/model_candidates.md`) -> quality-gated front+side
capture -> height calibration -> geometric measurement estimation -> real
per-measurement confidence -> front/side consistency check -> anatomical
validation -> human review/confirm screen -> `POST /measurement/extract`
with real provenance -> existing Knowledge Graph/Stylist/Product Intelligence
path (already working, not being rewritten) -> AI Stylist. Everything below
"Confirmed NOT working" above is what this session builds next.
