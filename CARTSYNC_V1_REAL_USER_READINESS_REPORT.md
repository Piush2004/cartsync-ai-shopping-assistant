# CartSync V1 Real-User Readiness Report

Date: 2026-08-11
Scope: `apps/api` + `apps/web` (canonical stack per `docs/architecture/canonical-architecture-decision.md`)

## 1. Architecture

```
Camera (browser, getUserMedia)
  -> Quality gate (blur/lighting, apps/web/src/lib/cv/quality/validation.ts)
  -> MediaPipeProvider (apps/web/src/lib/cv/vision/mediapipe-provider.ts) -- WASM, client-side, CPU
  -> Pose quality gate (apps/web/src/lib/cv/quality/pose-validation.ts)
  -> Calibration (apps/web/src/lib/cv/calibration/height-calibration.ts) -- user-height, per capture
  -> Geometry (apps/web/src/lib/cv/measurement/geometry.ts) -- landmark distances + ellipse estimate
  -> Confidence (apps/web/src/lib/cv/confidence/confidence.ts)
  -> Front/side consistency (apps/web/src/lib/cv/validation/consistency.ts)
  -> Anatomical validation (apps/web/src/lib/cv/validation/anatomical.ts)
  -> Human review/confirm (apps/web/src/components/measurements/MeasurementReview.tsx)
  -> POST /api/v1/measurement/extract (apps/api/routers/measurement.py)
  -> MeasurementProfile (raw) + EffectiveMeasurement (derived, with provenance)
  -> Knowledge Graph (/graph/me) -> Stylist -> Product Intelligence -> Dashboard/Chat
```

Everything through "Anatomical validation" runs entirely in the browser. No
image is ever uploaded to `apps/api` -- only the final, reviewed numeric
measurements and their provenance metadata are sent, after the user
explicitly confirms them.

## 2. Implemented CV pipeline

All new this session, all real (no `setTimeout`, no `Math.random()`, no
hardcoded output):

- `apps/web/src/lib/cv/vision/mediapipe-provider.ts` -- `MediaPipeProvider implements VisionProvider`
- `apps/web/src/lib/cv/vision/landmarks.ts` -- BlazePose's 33-point topology (Google's, not invented)
- `apps/web/src/lib/cv/calibration/height-calibration.ts`
- `apps/web/src/lib/cv/measurement/geometry.ts`
- `apps/web/src/lib/cv/confidence/confidence.ts`
- `apps/web/src/lib/cv/validation/{anatomical,consistency}.ts`
- `apps/web/src/lib/cv/quality/{pose-validation,messages}.ts`
- `apps/web/src/lib/cv/measurement/pipeline.ts` -- orchestrates all of the above
- `apps/web/src/app/measurements/camera/page.tsx` -- rewritten: height entry -> guided front capture -> guided side capture -> processing -> review/confirm
- `apps/web/src/components/measurements/MeasurementReview.tsx`
- `apps/api/models/measurement.py`, `apps/api/schemas/measurement.py`, `apps/api/routers/measurement.py` -- provenance fields, and two fabrication bugs removed (see §21)

## 3. Model used

**MediaPipe Pose Landmarker, `pose_landmarker_full`, float16, version tag
`mediapipe-pose-landmarker-full-float16-1`.** Apache 2.0. Chosen and
benchmarked in `research/cv/benchmarks/model_candidates.md` against MoveNet
and YOLO-Pose (YOLO-Pose disqualified on licensing -- AGPL-3.0/paid
Enterprise for a closed-source app). Runs client-side via
`@mediapipe/tasks-vision` (WASM), CPU delegate by default per that
research's finding that this RTX 5060 dev machine cannot currently run
CUDA-accelerated ONNX/PyTorch inference (`sm_120` support gap, documented
with sources in that file). **No depth or segmentation model is used in
V1** -- deliberately, per that same research, since no real depth model
license/weights/accuracy justified the added complexity yet.

## 4. Measurement formulas

Fully documented in code comments at each call site (not just here, so they
stay next to what they describe):

- **Shoulder width, arm length, torso length, inseam (proxy):** direct
  landmark-to-landmark pixel distance x `cmPerPixel`. Real measurements, not
  estimates -- bounded only by pose-detection and calibration accuracy.
- **Chest, waist, hip circumference:** front-view width (shoulder distance
  for chest, hip-landmark distance for hip, linear interpolation between the
  two for waist -- there is no waist landmark in BlazePose's 33 points) fed
  into Ramanujan's second ellipse-perimeter approximation, assuming a
  depth:width ratio (chest 0.70, waist 0.75, hip 0.85) that is a **working
  default, not a sourced anthropometric constant** -- see
  `geometry.ts`'s `ASSUMED_DEPTH_TO_WIDTH_RATIO` doc comment. **These are
  estimates, and the UI labels them as such** (`isEstimate: true`,
  confidence capped at 0.65 regardless of how clean the input is).

## 5. Model version / algorithm version / calibration method

Stored as real provenance on every camera-sourced `EffectiveMeasurement` row
(`apps/api/models/measurement.py`): `model_version =
"mediapipe-pose-landmarker-full-float16-1"`, `algorithm_version =
"geometric-v1"`, `calibration_method = "user_height"`. Manual entries have
`source_type = "manual"` and no model/algorithm/calibration fields (there is
nothing to attribute -- the user typed the number).

## 6. Confidence method

Weighted combination of 5 documented (not fitted) factors -- see
`confidence.ts`: pose (0.25), image quality (0.15), calibration (0.20),
geometry (0.25, hard-capped at 0.65 because circumference estimates rest on
an unvalidated depth-ratio assumption), front/side consistency (0.15).
**No factor or weight was fit to real accuracy data -- there isn't any yet
(§11).** This is a declared starting point, explicitly flagged in code as
provisional pending real validation.

## 7. Test datasets

- `testing-assets/{front,side}/{male,female}_001_*.jpg` -- 4 real photos
  already in the repo, used for the real MediaPipe CPU benchmark in
  `research/cv/results/mediapipe_pose_cpu_benchmark.json`.
- Synthetic landmark fixtures (hand-authored coordinates, not from any real
  photo) in every `*.test.ts` file under `apps/web/src/lib/cv/` -- used
  exclusively for unit-testing the math, always labeled `SYNTHETIC` in code
  comments where used, per `research/cv/README.md`'s ground rules. Never
  cited as evidence of real-world accuracy.

## 8. Synthetic tests

42 Vitest unit/integration tests across 7 files, all passing:
`calibration/height-calibration.test.ts` (5), `measurement/geometry.test.ts`
(13), `confidence/confidence.test.ts` (6), `validation/consistency.test.ts`
(3), `validation/anatomical.test.ts` (9), `quality/pose-validation.test.ts`
(5), `measurement/pipeline.test.ts` (6, full pipeline integration with a
synthetic standing-pose fixture). Plus 73 backend pytest tests (up from 65 at
the start of this session -- 8 new: 2 fabrication-fix regressions, 3
provenance/confidence-schema tests, 3 testing-feedback endpoint tests).

## 9. Real-user tests

**NOT TESTED.** No real human has been through this flow yet. The sandboxed
browser environment available in this session cannot grant camera access
(confirmed: navigating to `/measurements/camera`, entering a height, and
reaching the front-capture step correctly renders CameraView's
"Camera Access Denied" fallback UI, with no crash -- but real capture,
real MediaPipe inference against a live feed, and the review screen were
not exercised with a live camera). `docs/testing/real-user-test-protocol.md`
is ready for when your friend tests it; her results should be transcribed
into a revision of this report, replacing the NOT MEASURED lines below.

## 10. Measurement accuracy

**NOT MEASURED.** No manual tape-measurement ground truth has been compared
against a camera estimate. Cannot be measured until §9 happens. Per-field
MAE/error table is in `docs/testing/real-user-test-protocol.md` §11, blank,
waiting for real data.

## 11. MAE

**NOT MEASURED.** See §10.

## 12. Repeatability

**NOT MEASURED.** No repeated real capture has been performed. Protocol
exists in `docs/testing/real-user-test-protocol.md` §"Repeatability."

## 13. Failure cases

**Implemented, unit-tested, NOT verified against real bad photos.** The
quality gates (`IMAGE_TOO_BLURRY`, `LIGHT_TOO_LOW`, `LIGHT_TOO_BRIGHT`,
`POSE_NOT_DETECTED`, `LOW_LANDMARK_CONFIDENCE`, `BODY_OUT_OF_FRAME`,
`MULTIPLE_PEOPLE`) exist and are unit-tested with synthetic inputs
(`pose-validation.test.ts`). Whether they correctly catch a real dark photo,
a real cropped photo, etc. is untested -- flagged in
`docs/testing/real-user-test-protocol.md`'s failure-case checklist for the
real test session.

## 14. Browser performance

**Partially measured, partially not.** Real: MediaPipe pose-landmark
inference latency on this dev machine's CPU, against real photos --
46-49ms/frame (`research/cv/results/mediapipe_pose_cpu_benchmark.json`).
**NOT MEASURED**: the same thing through an actual browser tab (that
benchmark ran in Python, not the browser's WASM runtime -- browser WASM is
typically slower than native Python bindings for the same model), model
cold-load time over a real network connection to the CDN, or any mobile
device numbers (no phone was used this session).

## 15. API performance

**NOT MEASURED this session.** The prior QA pass measured single-request
`TestClient` latencies (~10-56ms for `/measurement/extract`) which are still
architecturally representative (the endpoint's logic didn't get slower --
it got more honest, per §21), but no fresh measurement was taken specifically
for the provenance-carrying payload shape.

## 16. Security

Rate limiting added this session (`apps/api/core/rate_limit.py`): 5/min on
login+register (IP-keyed), 10/min on measurement/extract, 20/min on
conversation/chat, 30/min on product-intelligence/recommendations (all
user-keyed once authenticated). `/testing` and `/measurements/camera` (its
UI route) both added to `middleware.ts`'s protected-route matcher --
`/testing` would otherwise have had the same route-protection gap as the
prior QA pass's BUG-07. No new auth/CORS/JWT changes this session (those
were fixed in the prior pass and re-verified passing, not re-touched).
`npm audit` still reports pre-existing high-severity advisories in
`next`/`postcss`/`sharp`/`js-yaml`/`nanoid` -- **not fixed this session**,
flagged rather than force-upgraded mid-feature-work (a Next.js minor bump is
its own reviewable change, not a side effect of adding a camera pipeline).

## 17. Privacy

Raw images never leave the browser -- confirmed by code inspection: the
camera page only ever passes `HTMLCanvasElement`/`ImageData` to
`MediaPipeProvider` and local math modules; the only network call in the
entire flow is the final `POST /measurement/extract` with numeric
measurements + provenance strings, never image bytes. Height is stored via
the existing `raw_data.height` convention (manual-entry path already did
this), not a new sensitive field. Analytics events added this session
(`scan_started`, `scan_quality_failed`, `scan_completed`, `scan_failed`,
`scan_measurements_confirmed`, `scan_retaken`) carry only booleans/enums/
confidence buckets -- never a measurement value or image, matching the
existing `trackEvent` convention (console-only today, no real third-party
sink to leak to).

## 18. UX findings

**Not evaluated with a real user** (§9). Structurally: the flow is height ->
front photo (with explicit on-screen instructions) -> side photo -> a
processing screen -> a review screen showing every measurement with its
value, confidence, and an "estimated" flag on circumference values, with
explicit Confirm/Retake actions -- nothing saves without that confirmation.
Quality/pose failures show plain-English messages (`quality/messages.ts`),
never a raw error code.

## 19. Known limitations

- Circumference (chest/waist/hip) is a geometric estimate from an
  **unvalidated** assumed depth:width ratio -- the single biggest accuracy
  risk in the whole pipeline, and honestly labeled as such throughout the
  code and UI.
- Waist has no BlazePose landmark at all; its width is a linear
  interpolation between chest and hip, which is a weaker approximation than
  the other two.
- "Inseam" is actually hip-to-ankle, not true crotch-to-floor -- systematically
  under-measures by a few cm, documented as `measureInseamProxy`, not
  `measureInseam`.
- Height is not persisted as a first-class profile field -- reused the
  existing `raw_data.height` JSON convention to avoid a user-profile schema
  change this session; the user re-enters height on every scan.
- GPU acceleration is unavailable on this dev machine for CV inference
  (`sm_120`/CUDA-13 pip-ecosystem gap, documented in `research/cv`) -- V1
  correctly does not depend on it, but it also hasn't been *tested* on a
  machine where GPU delegate does work.
- `CameraStateMachine` (`apps/web/src/lib/cv/camera/state-machine.ts`) was
  not wired into the new two-step flow -- the flow uses simpler React state
  instead, since the existing class models a single capture's lifecycle, not
  a two-photo + review sequence. It remains available, unused, for a future
  deeper integration.
- `npm audit` high-severity advisories in dependencies unrelated to this
  session's work are still open (§16).

## 20. Remaining bugs found and fixed this session (beyond the CV pipeline itself)

- **`POST /stylist/preferences` 500 on first use** -- `UserPreference`
  created without an `id`; fixed, regression-tested.
- **A pre-existing test-isolation leak** -- `test_api_stylist.py` mutated
  global FastAPI dependency-override state at module-import time with no
  teardown; fixed.
- **`local-compute/.venv` + `local-compute/python311`** -- 4.5GB, ~59,000
  files of a committed Python venv/portable-distribution, untracked from git
  (not deleted from disk).

## 21. Fabrication bugs found and fixed this session

Two real instances of exactly the dishonesty pattern this whole engagement
exists to eliminate, found while extending `/measurement/extract` for
camera provenance:

1. `extract_measurements` defaulted **any omitted field** to a fixed number
   (hip 100.0cm, inseam 80.0cm, shoulder 45.0cm) or a **randomly jittered**
   number (chest `95.0 + random.uniform(-2,2)`, waist `82.0 +
   random.uniform(-2,2)`) instead of leaving it null. A user submitting only
   a chest value silently got four measurements back that nobody provided
   and no algorithm computed. **Fixed**: omitted fields now stay `None`.
2. Manual entries were stamped with a hardcoded `confidence_score: 0.92`
   regardless of input -- an "AI confidence" number applied to a value the
   user typed in themselves. **Fixed**: manual entry is now `1.0`
   (fully trusted, the user's own stated value, not a fabricated
   probabilistic score); camera entries now use the real, computed
   `confidence_breakdown.overall`.

## 22. Production blockers

1. **No real-user test has happened.** This is the actual gate on calling
   V1 done -- everything else in this report is either real-and-verified or
   honestly marked unverified.
2. **Circumference accuracy is completely unvalidated.** Until §10/§11 have
   real numbers, don't market "measure your body" as more than
   "estimate your body" to anyone.
3. **Mobile/browser performance is unmeasured.** A desktop CPU Python
   benchmark is not evidence this works acceptably on a mid-range phone
   browser.

## 23. Recommended next steps

1. Run the real-user test session (`docs/testing/real-user-test-protocol.md`)
   with your friend, on an actual phone/laptop with camera access.
2. Fill in this report's §9-§14 with what actually happened -- including if
   it goes badly. A failed test that gets fixed is worth more than a report
   with blanks filled by guessing.
3. If circumference MAE from step 1 is unacceptably large, that is the
   signal (not a guess) for whether depth estimation is worth its cost --
   re-open `research/cv/benchmarks/model_candidates.md`'s depth-model
   evaluation with real error data driving the decision, per that
   document's own recommendation.
4. Decide on the `npm audit` dependency upgrades (§16) as their own reviewed
   change.
5. Decide whether to persist height as a real profile field once the
   re-enter-every-scan friction shows up as real user feedback (§19).
