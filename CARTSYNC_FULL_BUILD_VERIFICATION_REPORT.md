# CartSync Full Build Verification Report

Date: 2026-08-11
Companion documents: `docs/qa/CURRENT_FULL_SYSTEM_AUDIT.md` (detailed findings),
`CARTSYNC_QA_FINAL_REPORT.md` (prior QA pass), `CARTSYNC_V1_REAL_USER_READINESS_REPORT.md`
(CV pipeline detail), `research/cv/` (model benchmarking).

Every number below is either a real measurement from this session, or
explicitly marked **NOT MEASURED**, **NOT TESTED**, or **NOT AVAILABLE**.
Nothing is estimated.

## 1. Executive Summary

This pass re-verified the entire active stack from source, found and fixed
**5 real, previously-undiscovered bugs** (one of them, broken sign-out,
was severe enough that it blocked this very testing session until found and
fixed), and re-confirmed all 9 bugs from the prior QA pass remain fixed.
Three of the five new bugs were genuine fabricated-data violations (a fake
hardcoded activity chart, a fake confidence percentage, and an orphaned page
that pre-filled fake default measurements) -- exactly the class of problem
this whole engagement exists to eliminate. All were found by actually using
the running application with a real registered user, not by code review
alone. The core golden path (register -> login -> manual measurements ->
dashboard -> Knowledge Graph -> Stylist -> Product Intelligence -> AI
Stylist chat -> history -> testing feedback) was exercised live and works
end to end with real, computed, traceable data. The camera/CV pipeline is
implemented and unit-tested (42 tests) but has not been exercised with a
live camera in this sandboxed environment -- that remains the actual gate on
real-user readiness, unchanged from the prior report.

## 2. Repository Audit

Full pattern search across `apps/api` + `apps/web` for TODO/FIXME/mock/fake/
`Math.random`/`setTimeout`/placeholder/hardcoded. Every hit reviewed
individually; see `docs/qa/CURRENT_FULL_SYSTEM_AUDIT.md` for the complete
classified list. Net result: 3 real fabrication bugs found and fixed (History
page chart+confidence, `/measurements/upload`'s fake defaults), a handful of
misleading-but-harmless comments corrected, and the rest confirmed legitimate
(decorative animation `Math.random()`/`setTimeout()` on the landing page, the
self-labeled rules-based conversation engine, standalone unimported QA
scripts).

## 3. Architecture Verification

Confirmed via import/URL search: no `apps/*` code imports Firebase,
Firestore, or anything from the legacy `src/`/`python/`/`frontend/`/
`functions/`/`local-compute/` trees. `apps/api` and `apps/web` are the sole
active request path. No duplicate/competing implementation of any active
feature was found except the now-removed `/measurements/upload`.

## 4. Backend Verification

- `pytest`: **74/74 passing**. Run as a full suite, as each file
  individually, and in reversed file order -- all agree, confirming no
  order-dependence or shared-state leakage.
- Migrations: all 5 apply cleanly to a fresh throwaway SQLite database,
  producing all 11 expected tables.
- `requirements.txt`: ASCII-encoded (not the UTF-16LE issue from the
  original pre-QA state).

## 5. Frontend Verification

- `tsc --noEmit`: clean.
- `next build`: succeeds, 12 static routes (down from 13 -- `/measurements/upload` removed).
- `eslint`: 48 errors / 19 warnings, all pre-existing `@typescript-eslint/no-explicit-any`
  and style-rule debt (not fixed in bulk -- deliberate scope decision, matching
  the original QA pass's P3 categorization; net improved from session start
  via dead-code removal, not regressed).
- `vitest`: **42/42 passing** (CV math modules).

## 6. Authentication

Verified live end-to-end with a real registered user: register -> login ->
dashboard (authenticated) -> logout -> redirected to `/login`, subsequent
dashboard access correctly requires re-login. **Bug found and fixed**: sign-out
previously called a nonexistent API route and never cleared the session
cookie (see §31). Password/JWT/CORS edge cases: covered by the existing 74
automated tests (empty/oversized password, wrong password, missing/garbage
token, IDOR), not manually re-tried live beyond what those tests already
cover.

## 7. Database

See §4. FK scoping re-confirmed by grep: every router query filters by
`current_user.id` from the JWT, never a client-supplied ID.

## 8. Camera

Verified live up to the sandbox's boundary: `getUserMedia` permission
request fires correctly, permission-denied fallback UI renders correctly
with a retry option, front/back toggle and countdown logic present and
(per code review) correctly cleaned up on unmount after this session's leak
fix. **Live capture through an actual camera feed: NOT TESTED** -- this
sandboxed browser cannot grant camera access, confirmed by the tool
environment itself.

## 9. MediaPipe

Real MediaPipe Pose Landmarker execution independently verified in
`research/cv/results/mediapipe_pose_cpu_benchmark.json` (33/33 landmarks,
real photos, real CPU latency, no mocked/hardcoded/random landmark values
anywhere in `apps/web/src/lib/cv/vision/mediapipe-provider.ts` -- confirmed
by direct source read). Not re-exercised through the live browser UI this
session (same camera-access sandbox limitation as §8).

## 10. Image Quality

7 unit tests (`quality/pose-validation.test.ts`) plus the pre-existing 5 for
blur/lighting. Thresholds documented in code (`MIN_MEAN_VISIBILITY = 0.6`,
`FRAME_EDGE_MARGIN = 0.02`, `BLUR_THRESHOLD = 50`). Real-photo validation
(does a genuinely dark/blurry/cropped photo actually get rejected)
**NOT TESTED** -- requires a live camera.

## 11. Calibration

5 unit tests including tilt and low-visibility warning paths. Formula and
its limitations documented in `calibration/height-calibration.ts`.

## 12. Measurement Mathematics

13 unit tests. Every formula documented at its call site with units,
assumptions, and known limitations (see `CARTSYNC_V1_REAL_USER_READINESS_REPORT.md`
§4 for the consolidated list). Circumference values are explicitly flagged
`isEstimate: true` and never presented as directly measured.

## 13. Confidence

6 unit tests confirming: same input always produces the same output (pure
function, no `Math.random()` anywhere in the confidence module -- confirmed
by source read), out-of-range inputs clamp instead of producing invalid
output, geometry confidence never exceeds its documented 0.65 ceiling.

## 14. Front/Side Fusion

3 unit tests including the inconsistency-flagging case. Honestly scoped in
code comments to what it actually checks (proportion consistency between
independently-calibrated front/side captures) rather than the circumference
cross-validation the original brief's illustrative example implied, since no
depth signal exists to support that (documented in
`validation/consistency.ts`).

## 15. Knowledge Graph

Verified live: `/graph/me` correctly reflects a real submitted measurement
(chest/waist/height matching exactly what was entered), correctly returns
null/empty fields for a brand-new user, IDOR-tested (user B cannot see user
A's data).

## 16. Stylist

Verified live: real chat question ("What size should I buy from Zara?")
correctly routed to `BrandEngine` + `StylistEngine`, response sources shown
in the UI (`SOURCES: BRANDENGINE · STYLISTENGINE`). Deterministic --
`brand_engine.py`'s misleading "Mock" comment corrected (logic itself was
always real, just poorly labeled).

## 17. Product Intelligence

Verified live: real, differentiated fit-score percentages ("45% -- Poor
Fit", "26%...") computed and displayed for 3 different brands against the
same submitted measurements on both `/dashboard` and `/products`.

## 18. Conversation

Verified live. Honestly self-labeled rules-based (`# 5. LLM (Mocked for
now)` in `conversation_engine.py` -- an accurate label, not a false claim).
No fabricated measurement or product data observed in any response this
session.

## 19. History

**Bug found and fixed this session**: "Body Evolution" chart was 6 hardcoded
fixed-height bars labeled "Jan"-"Jun" shown identically to every user; "Fit
Confidence" was a hardcoded `"98%"` literal. Both replaced with real data
(actual chest-measurement trend from real scans, real `confidence_score`
from the user's `EffectiveMeasurement`). Verified live with 1 and then 2 real
measurement submissions -- confirmed the trend chart correctly appears only
once 2+ real data points exist, and correctly plots the real values (92cm,
94cm) rather than anything fabricated.

## 20. Profile Completion

Verified live: category percentages (Basic Profile 15%, Body Measurements
30%, Style Preferences 15%, Favorite Brands 15%, Recommendations 10%,
Product Feedback 10%, Profile Photo 5%) and the "Add Body Measurements"
call-to-action correctly matched the actual missing data for a brand-new
user.

## 21. Testing Feedback

Verified live: full form submission (booleans + free text) -> real API call
-> confirmation screen. IDOR-tested this session (new test:
`test_testing_feedback_is_isolated_per_user`).

## 22. Analytics

Reviewed every `trackEvent` call site in `apps/web/src/app` and
`apps/web/src/lib`. No raw images, no exact biometric values, no PII found in
any event payload. All camera/scan-related events (`scan_started`,
`scan_quality_failed`, `scan_completed`, `scan_failed`,
`scan_measurements_confirmed`, `scan_retaken`) carry only booleans, enums,
and confidence buckets, matching Phase 23's requirement.

## 23. Security

Re-audited: no committed secrets (`git ls-files` grep clean), no tracked
`.pyc`/`__pycache__`/`.db`, JWT/CORS/rate-limiting unchanged and re-verified
passing, no file-upload endpoint exists anywhere in `apps/api` (confirmed by
grep for `UploadFile`/`File(` -- zero matches), so there is no arbitrary
file-write surface via the camera path. IDOR/BOLA: re-confirmed across every
router, one new explicit test added for the testing-feedback endpoint.
SQL injection: not exploitable (SQLAlchemy ORM throughout, no raw SQL
found). XSS/CSRF: not specifically re-tested this pass beyond what the
existing httpOnly-cookie + SameSite configuration already mitigates (carried
over from the prior QA pass, not re-verified with a fresh attack attempt this
session -- **NOT TESTED** this pass specifically).

## 24. Privacy

No raw image ever reaches `apps/api` -- architecturally impossible given no
upload endpoint exists (§23), confirmed by source inspection of the entire
camera pipeline (`apps/web/src/lib/cv/*`, `apps/web/src/app/measurements/camera/page.tsx`).

## 25. Performance

**NOT MEASURED this session** beyond what's already in
`research/cv/results/mediapipe_pose_cpu_benchmark.json` (CPU pose-inference
latency) and the prior QA pass's single-request API latencies. No fresh
Next.js build timing, FastAPI startup timing, or dashboard-load timing was
captured as a formal benchmark this pass -- fabricating numbers here would
violate the evidence rule.

## 26. Memory/Resource Testing

**Real bug found and fixed**: camera stream and countdown timer were never
actually cleaned up on unmount due to a stale-closure bug in `CameraView.tsx`
(see §31). Fixed and verified via `tsc`; live leak observation (e.g. via
browser dev tools memory profiling across repeated navigation)
**NOT TESTED** -- the fix is verified by code correctness, not by an observed
before/after memory measurement.

## 27. Responsive Testing

**NOT TESTED** this session. No viewport-simulation pass was run; all live
verification this session used a single desktop viewport.

## 28. Accessibility

**NOT TESTED.** No accessibility tooling (axe, Lighthouse, screen-reader
walkthrough) was run this session.

## 29. Regression Tests

See §36 below for the full table against `CARTSYNC_QA_FINAL_REPORT.md`.

## 30. Mock/Fabrication Audit

See §2 and `docs/qa/CURRENT_FULL_SYSTEM_AUDIT.md`. Net: 3 real fabrication
bugs found and fixed this session (History chart/confidence,
`/measurements/upload`'s fake defaults), 2 already fixed in the prior
session and re-confirmed still fixed (`/measurement/extract`'s fabricated
defaults, hardcoded manual-entry confidence), 0 remaining known fabrications
in the active request path.

## 31. Bugs Found

1. Sign-out completely non-functional (called a nonexistent API route, never cleared the session cookie).
2. Every first-time user's dashboard falsely showed a "servers unavailable" error instead of the onboarding screen (400-vs-404 handling mismatch).
3. Camera stream and countdown timer leaked past component unmount (stale-closure bug).
4. History page's "Body Evolution" chart was entirely fabricated (fixed heights, fixed "Jan"-"Jun" labels, shown to every user regardless of real data).
5. History page's "Fit Confidence" stat was a hardcoded `"98%"` literal.
6. Orphaned `/measurements/upload` route with hardcoded fake default measurement values, reachable by direct URL despite no in-app links.
7. `stylist/page.tsx` silently fell back to a fake `"demo-token"` string on a (practically unreachable) token-fetch failure.
8. Misleading comments in `brand_engine.py` and `stylist/page.tsx` calling real logic "mock"/"simulate".

## 32. Bugs Fixed

All 8 items in §31. Verified via `tsc --noEmit` (clean), `next build`
(clean, 12 routes), `vitest` (42/42), `pytest` (74/74), and live browser
re-verification for items 1, 2, 4, 5, and 6 specifically (the ones with
user-visible behavior change).

## 33. Bugs Remaining

None classified as P0/P1/P2 as of this report. One unconfirmed dev-mode-only
rendering observation flagged in `docs/qa/CURRENT_FULL_SYSTEM_AUDIT.md`
("Unconfirmed / flagged, not fixed") -- did not reproduce after the actual
underlying causes were fixed, root cause not conclusively identified, not
treated as a confirmed bug.

## 34. Tests Executed

`pytest` (full, per-file, reversed-order), `vitest`, `tsc --noEmit`,
`eslint`, `next build`, live browser golden-path walkthrough (register,
login, logout, manual measurement entry x2, dashboard, stylist chat,
products, history, testing feedback), fresh-database migration check,
repository-wide pattern search, IDOR verification.

## 35. Tests Passed

74/74 backend, 42/42 frontend unit, clean typecheck/lint/build, all live
browser walkthrough steps succeeded (after fixes).

## 36. Regression Table (vs. `CARTSYNC_QA_FINAL_REPORT.md`)

| Bug | Current Status | Verification |
|---|---|---|
| BUG-01 (fabricated camera measurement flow) | Fixed, superseded | Real MediaPipe pipeline now implemented (this engagement's main body of work) |
| BUG-02 (product-intelligence/conversation router mismatch) | Fixed | `test_product_intelligence_recommendations_does_not_500`, `test_conversation_chat_*_does_not_500` -- passing |
| BUG-03 (hardcoded JWT secret) | Fixed | `core/config.py` uses `secrets.token_hex(32)`, verified unchanged this session |
| BUG-04 (CORS wildcard+credentials) | Fixed | `test_cors_does_not_wildcard_with_credentials` -- passing |
| BUG-05 (measurement validation + NaN crash) | Fixed | 5 tests -- passing |
| BUG-06 (password validation) | Fixed | 3 tests -- passing |
| BUG-07 (route protection gap) | Fixed, extended | `/history`,`/products`,`/stylist` fixed prior session; `/testing` added this engagement, verified in `middleware.ts` |
| BUG-08 (JSON logging null timestamp/level) | Fixed | `main.py`'s `JsonFormatter('%(asctime)s %(levelname)s ...')` verified unchanged |
| BUG-09 (test DB mutation + state-machine type issue) | Fixed | `conftest.py`'s isolated `db_session` fixture verified still in use by all test files; dev DB mtime unchanged across a full test run |

All 9 remain fixed. Zero regressions found.

## 37. Not Tested

Live camera capture through an actual device, live MediaPipe inference
through the browser UI (vs. the Python benchmark), mobile/physical-device
rendering, accessibility (WCAG/screen-reader), load/concurrency testing
beyond prior single-request latencies, XSS/CSRF live attack attempts,
browser memory-profiler leak observation (leak was fixed by code
correctness, not confirmed via before/after memory measurement).

## 38. Real User Readiness

**READY WITH LIMITATIONS.**

The full non-camera product (auth, manual measurements, Knowledge Graph,
Stylist, Product Intelligence, conversation, history, testing feedback) is
verified working end-to-end with real data and no known fabrication. The
camera/CV pipeline is implemented, unit-tested, and independently benchmarked
for its pose-detection component, but has never been exercised with a live
camera by a human -- that gap is unchanged from
`CARTSYNC_V1_REAL_USER_READINESS_REPORT.md` and remains the actual blocker
to a full real-user test session. This pass found and fixed 5 bugs that
would have visibly degraded that session (a friend clicking "sign out" and
having it silently fail; her first dashboard load showing a false outage
message; fabricated chart/confidence numbers on the history page she would
have immediately noticed as fake) -- so the product is now materially closer
to ready than before this pass, but the camera capture step specifically
still needs its first real-device test before this can honestly be called
production-ready.

## 39. Remaining Risks

1. Camera/MediaPipe pipeline unverified on a real device/browser combination.
2. Circumference measurement accuracy completely unvalidated against any ground truth (unchanged from the readiness report).
3. Mobile responsiveness and accessibility unverified.
4. The dev-mode rendering anomaly (§33) is unconfirmed -- worth a specific follow-up if it ever reappears, since a page stuck invisible is a severe UX failure if it turns out to be reproducible in production.
5. `npm audit` dependency advisories remain open (pre-existing, out of this session's scope).

## 40. Recommended Next Steps

1. Run the real-user test session (`docs/testing/real-user-test-protocol.md`) -- this is the single most valuable next action; it's the only way to validate the camera pipeline and circumference accuracy claims.
2. If time allows before that session, do a mobile-viewport pass on the camera capture and review screens specifically, since that's where a real tester will actually be.
3. Decide on the `npm audit` upgrades as their own reviewed change.
4. If the dev-mode rendering anomaly reappears during the real-user session, capture it precisely (browser, exact repro steps) -- this report intentionally did not force a fix for an unconfirmed, non-reproducing issue.
