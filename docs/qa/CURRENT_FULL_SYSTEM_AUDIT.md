# CartSync Current Full-System Audit

Date: 2026-08-11
Scope: `apps/api` + `apps/web` (canonical stack). Legacy tree (`src/`, `python/`,
`frontend/`, `functions/`, `local-compute/`) already fully audited in
`docs/architecture/canonical-architecture-decision.md` and not re-covered here.

Method: repository-wide pattern search, fresh test execution (not trusted
from prior reports), live browser testing with a real registered user
against a running dev server, and direct source inspection of every area
below. Findings are classified WORKING / PARTIALLY WORKING / MOCKED /
UNVALIDATED / BROKEN / DEPRECATED / DUPLICATED / UNUSED.

## Summary of bugs found this pass (all fixed, see `CARTSYNC_FULL_BUILD_VERIFICATION_REPORT.md` for verification evidence)

1. **BROKEN -- Sign-out never worked.** `Sidebar.tsx`'s `handleLogout` called `fetch('/api/auth/session', { method: 'DELETE' })`, a Next.js API route that does not exist anywhere in this codebase. The httpOnly `access_token` cookie was never cleared. Users could never actually log out via the UI. **Fixed**: now calls the real `logoutAction` server action.
2. **BROKEN -- every first-time user's dashboard falsely showed "CartSync is temporarily unavailable".** `dashboard/page.tsx` only treated HTTP 404 as "no data yet" for `/product-intelligence/recommendations`, but the backend returns 400 for that exact case (`Missing effective measurements`). Every brand-new user's first load rejected the `Promise.all` and fell into the offline-error branch instead of the intended onboarding welcome screen. **Fixed**: 400 now handled the same as 404 for this call (and defensively for `/graph/me`, which doesn't currently 400 but costs nothing to guard).
3. **BROKEN -- real resource leak.** `CameraView.tsx`'s unmount cleanup closed over `stream` from a `useEffect` with an empty dependency array, so it always saw `stream`'s initial value (`null`) and never actually called `track.stop()` -- the camera stayed on indefinitely after navigating away. Same stale-closure class of bug also left the 3-2-1 countdown's `setInterval` running after unmount. **Fixed**: both now use refs instead of the stale state closure.
4. **MOCKED (fabricated data presented as real) -- History page's "Body Evolution" chart and "Fit Confidence" stat.** Six bars at fixed heights hardcoded to "Jan"-"Jun", shown identically for every user regardless of actual history; "Fit Confidence" was a literal `"98%"` string whenever `history.length > 0`. **Fixed**: chart now plots real chest-measurement history (only when >=2 real data points exist, otherwise an honest "not enough scans yet" message); confidence now reads the user's real `EffectiveMeasurement.confidence_score`.
5. **DUPLICATED + fabricated defaults -- orphaned `/measurements/upload` route.** A second, unreachable (no links anywhere) manual-entry page duplicating `/measurements`, with form inputs pre-filled with hardcoded `defaultValue`s (chest=95.0, waist=82.0, hip=100.0, shoulder=45.0, inseam=80.0) that would submit as real if the user didn't change them, and copy stating "simulate the scanner payload." **Fixed**: page and its dedicated server action deleted; `/measurements` already does this correctly (loads real prior values, no fake defaults).
6. **BUG (fixed in the previous session, re-verified here) -- `/measurement/extract` fabricated omitted fields and hardcoded manual-entry confidence.** Already fixed and regression-tested before this audit pass; re-verified still fixed.
7. **BUG (fixed in the previous session, re-verified here) -- `POST /stylist/preferences` 500 on first use.** Already fixed and regression-tested; re-verified still fixed.
8. **Minor -- misleading comments/fallback**, not functional bugs but flagged and cleaned up: `brand_engine.py`'s "Mock brand sizing DB" comment (real deterministic logic, not mocked -- reworded); `stylist/page.tsx`'s token-fetch catch block silently fell back to the literal string `"demo-token"` on failure (dead-in-practice since `getToken()` doesn't throw, but would have caused confusing 401s if it ever did -- now leaves the token null, which the page already handles).

## Unconfirmed / flagged, not fixed

- **Dev-mode-only rendering artifact (unconfirmed root cause).** During testing with a deliberately invalidated session, the dashboard's error state was observed rendered into the DOM correctly (confirmed via direct DOM inspection) but stuck at `opacity: 0` (a Framer Motion `PageTransition` / `AnimatePresence mode="wait"` wrapper never animated to visible). This did not reproduce on a fresh valid login, a fresh browser tab with a clean load, or in the production build check. It coincided with a Next.js dev-mode console-error overlay ("1 Issue" badge) triggered by the app's own (legitimate) `console.error("Dashboard error:", err)` call. Root cause not conclusively identified; flagged for a follow-up investigation specifically in dev mode rather than treated as a confirmed production bug, since the actual underlying causes that triggered the error state in the first place (broken logout, 400-vs-404 handling) are now fixed and this exact repro path no longer occurs.
- **`qa_master.py`, `qa_phase2_3.py`, `seed_test_user.py`** (apps/api root) -- standalone, unimported dev/QA harness scripts using `random.uniform()` to generate synthetic test measurements against a running local server. Confirmed not imported by the application (`grep` found zero references outside themselves). Legitimate QA tooling, not production fabrication -- but loose at the repo root where they could be mistaken for app code. Left in place (not a bug), noted as a minor hygiene item for a future pass.
- **`npm audit` pre-existing high-severity advisories** (`next`, `postcss`, `sharp`, `js-yaml`, `nanoid`) -- unrelated to this session's changes, not fixed (a Next.js version bump deserves its own reviewed change, not a side effect of a QA pass).

## Area-by-area status

| Area | Status | Evidence |
|---|---|---|
| Backend test suite | WORKING | 74/74 passing; full run, per-file run, and reversed-order run all agree (order-independent) |
| Frontend typecheck/lint/build | WORKING | `tsc` clean, `next build` clean (12 routes), ESLint 48 errors/19 warnings (pre-existing `no-explicit-any`/style debt, improved from session start via dead-code removal) |
| Fresh DB migrations | WORKING | All 5 migrations apply cleanly to a throwaway SQLite file; 11 tables + `alembic_version` produced, matches every SQLAlchemy model |
| Auth (register/login/me/logout) | WORKING (logout was BROKEN, now fixed) | Verified live: register -> login -> dashboard -> logout -> redirected to `/login` with session actually cleared |
| Protected routes | WORKING | `middleware.ts` covers dashboard/measurements/profile/history/products/stylist/testing; verified `/testing` added this session, matches BUG-07's fix pattern |
| Rate limiting | WORKING | 11 dedicated tests: threshold, burst, per-user isolation, 429 shape, window reset |
| IDOR/BOLA | WORKING | Existing + 1 new test (testing-feedback cross-user isolation) all scope by JWT-derived `user_id`; no route found that trusts a client-supplied ID |
| Manual measurement entry | WORKING | Live: submitted real values, persisted, reflected in dashboard/history/product recommendations |
| Camera capture UI (permission/capture/countdown) | WORKING to the sandbox's boundary | Verified real getUserMedia flow, graceful permission-denied fallback; live camera stream itself not testable in this sandboxed browser (documented limitation, not a bug) |
| MediaPipe pose detection | WORKING (real, measured separately) | `research/cv/results/mediapipe_pose_cpu_benchmark.json` -- real inference against real photos, not mocked; not re-exercised through the live UI this pass (same sandbox limitation) |
| Image quality gates | WORKING (unit-tested), UNVALIDATED against real bad photos | 5 dedicated tests with synthetic fixtures; real blurry/dark/cropped photo behavior not observed live |
| Calibration | WORKING (unit-tested) | 5 tests incl. tilt/visibility warning cases |
| Measurement geometry | WORKING (unit-tested), circumference is an explicitly-labeled ESTIMATE | 13 tests; every circumference value carries `isEstimate: true` and a capped confidence |
| Confidence engine | WORKING (unit-tested), weights are documented-not-fitted | 6 tests; reproducible (pure function, same input -> same output, no randomness) |
| Front/side consistency | WORKING (unit-tested) | 3 tests incl. the inconsistency-flagging case |
| Measurement review/confirm UI | WORKING | Renders per-field value/confidence/estimate flag; nothing POSTs until Confirm is clicked |
| Backend provenance | WORKING | `source_type`/`model_version`/`algorithm_version`/`calibration_method`/`confidence_breakdown` all real columns, verified via 5 dedicated tests + live history page showing real `source: manual_entry` |
| Knowledge Graph | WORKING | `/graph/me` verified live reflecting real submitted measurements; IDOR-tested |
| Stylist engine | WORKING | Deterministic (`brand_engine`/`sizing_engine`/etc.), verified live via real chat question routed to `BrandEngine`+`StylistEngine` with sources shown |
| Product Intelligence | WORKING | Verified live: real fit-score percentages computed and displayed for 3 brands against submitted measurements |
| Conversation/AI Stylist | WORKING, honestly self-labeled rules-based | `services/conversation/conversation_engine.py` comment: "LLM (Mocked for now)" -- accurate, not a false claim; verified live, sources shown in UI |
| History | WORKING (was PARTIALLY MOCKED, now fixed) | See bug #4 above |
| Testing feedback | WORKING | Verified live: submit -> persisted -> confirmation screen; IDOR-tested |
| Profile completion | WORKING | Verified live: real percentages by category, "Add Body Measurements" CTA matches actual missing data |
| Analytics | WORKING, no sensitive payloads found | Event names reviewed (`scan_*`, `camera_*`, `logout`, etc.); all payloads are booleans/enums/counts, no raw images or exact biometric values found in any `trackEvent` call site |
| Security (JWT/CORS/rate-limit/secrets) | WORKING | Re-verified this pass; no committed secrets, no tracked `.pyc`/`.db`, `requirements.txt` ASCII |
| Privacy (image handling) | WORKING | No `UploadFile`/file-upload endpoint exists anywhere in `apps/api` -- confirmed by grep; images architecturally cannot leave the browser |
| `/measurements/upload` | DUPLICATED + fabricating -- REMOVED | See bug #5 |
| Legacy tree (`src/`, `python/`, etc.) | Not re-audited this pass (see canonical-architecture-decision.md) | No new imports/references found from `apps/*` this session |
| Mobile/physical-device testing | NOT TESTED | No physical device available in this environment |
| Accessibility (WCAG/screen-reader) | NOT TESTED | No accessibility tooling run this session |
| Load/concurrency testing | NOT TESTED | No load-testing tool run beyond the existing single-request latency numbers from the prior QA pass |

## Regression check against `CARTSYNC_QA_FINAL_REPORT.md`

See `CARTSYNC_FULL_BUILD_VERIFICATION_REPORT.md` §"Regression Table" for the
full BUG-01 through BUG-09 verification. All 9 remain fixed.
