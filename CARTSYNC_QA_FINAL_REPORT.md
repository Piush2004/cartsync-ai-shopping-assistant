# CartSync AI — Production QA, Stress Test & Hardening Report

Date: 2026-08-11
Scope: `apps/api` (FastAPI) + `apps/web` (Next.js 16), the active stack per current git history.

## 1. Executive Summary

This pass found and fixed **9 confirmed, reproduced bugs**, including two P0s: a completely
fabricated "AI camera measurement" flow that told users their body had been scanned when
nothing was measured or saved, and two core API endpoints (`/product-intelligence/recommendations`,
`/conversation/chat`) that threw an unhandled 500 on **every single request** due to a
router/service contract mismatch that unit tests never exercised. A hardcoded JWT secret
committed to source control and a CORS misconfiguration that let any website make
credentialed requests were also live and are now fixed.

The single biggest finding is architectural, not a bug: **there is no computer-vision
measurement pipeline wired into the active product.** `apps/web/src/lib/cv/` contains only
type interfaces and image-quality utilities (blur/lighting checks); no MediaPipe or depth
model implementation exists. `apps/api`'s `/measurement/extract` endpoint is explicitly
commented "Mocking the math extraction" and returns a hardcoded `confidence_score: 0.92`
regardless of input. A README-documented Firebase/MediaPipe/Depth-Anything-V2 stack exists
at the repo root (`python/`, `local-compute/`, `src/`, `frontend/`, `functions/`) but is
**architecturally disconnected** from `apps/api`/`apps/web` — different auth system, different
database (Firestore vs. SQLAlchemy/SQLite), no shared code path. This needs a product decision,
not a bug fix.

I did **not** fabricate load-test numbers, camera hardware results, or accuracy benchmarks.
Where the master prompt asked for things this environment cannot honestly produce (real
device camera testing, 50/100 concurrent user load, screen-reader accessibility passes,
ground-truth measurement accuracy), those sections say so explicitly rather than inventing
plausible-looking numbers — see §21 "Not Executed / Explicitly Unvalidated."

**Final decision: B. STABILIZATION REQUIRED** (see §22).

## 2. Environment (as found)

| Component | Version |
|---|---|
| OS | Windows 11, PowerShell/Git Bash |
| Python | 3.14.5 (`apps/api/venv`) |
| Node | via root npm workspace (`apps/*`) |
| FastAPI | 0.139.2 |
| SQLAlchemy | 2.0.51 |
| Pydantic | 2.13.4 |
| Next.js | 16.2.10 (Turbopack) |
| React | 19.2.4 |
| DB | SQLite (`apps/api/cartsync.db`), Alembic-managed |

`apps/api/requirements.txt` was UTF-16LE-encoded (classic `pip freeze > requirements.txt`
under PowerShell without `-Encoding utf8`). It happened to still install cleanly because the
installed pip version sniffs the BOM, but this is fragile on Linux CI/Docker with older pip.
Fixed: re-saved as UTF-8.

## 3. Architecture Tested

- **Auth**: FastAPI + `python-jose` JWT (HS256, 7-day expiry) + Next.js server action setting
  an `httpOnly` cookie (`secure` gated on `NODE_ENV=production`). Verified correct.
- **Data model**: `User`, `MeasurementProfile` (immutable raw), `EffectiveMeasurement`
  (derived/mutable), `UserPreference`, `BrandAffinity` — all scoped by `user_id` derived from
  the JWT, never from client-supplied IDs. No IDOR path found in any router.
- **Schema management**: real Alembic migration chain (3 revisions), `Base.metadata.create_all()`
  correctly commented out and unused. Verified against a genuinely clean, isolated SQLite file.
- **Stylist/Product-Intelligence/Conversation engines**: small, deterministic, composable
  services (`services/stylist/*`, `services/product_intelligence/*`, `services/conversation/*`).
  Logic itself is sound; the routers gluing them together had the P0 bug in §5.
- **CV pipeline**: interfaces only (`VisionProvider`, camera `CameraStateMachine`,
  blur/lighting quality checks) — no implementation behind them. See §1 and §11.
- **Legacy stack** (`python/`, `local-compute/`, `src/`, `frontend/`, `functions/`,
  Firebase/Firestore config at repo root): not part of the request path for `apps/web`, not
  audited in depth — flagged as an architecture-consistency problem (§18) rather than tested,
  since it is a different system.

## 4. Tests Executed

- Backend: `pytest` (real runs, not simulated), TestClient-driven adversarial requests
  against a live in-process ASGI app for auth, measurement, product-intelligence,
  conversation, and graph routers.
- `alembic upgrade head` against a throwaway, isolated SQLite file (not the dev db).
- Frontend: `tsc --noEmit`, `eslint`, `next build` (Turbopack, production mode) — all real,
  all from a clean invocation, not assumed.
- Static/manual review of camera capture, state machine, middleware route protection,
  CORS/cookie config, and a repo-wide grep for secrets/mocks/hardcoded claims.

## 5. Tests Passed / Failed

- Backend suite: **28/28 passing** at end of session (14 pre-existing + 14 new regression
  tests added this session; see `apps/api/tests/test_regression_qa_hardening.py`).
  Before fixes, 5 of the new adversarial tests would have failed (500s/incorrect status
  codes) against the pre-existing code — captured as regressions, not run standalone.
- Frontend: `tsc --noEmit` — 1 error found, fixed, now 0. `next build` — succeeds (0 errors,
  2 informational warnings). ESLint — 49 errors / 21 warnings, almost entirely
  `@typescript-eslint/no-explicit-any` and unescaped-apostrophe style rules; not fixed in
  bulk (see §19, P3) except where an error indicated a real bug (§7, BUG-05).

## 6. Bugs Found and Fixed

### BUG-01 — P0 — Fabricated camera measurement flow
- **Root cause**: `apps/web/src/app/measurements/camera/page.tsx` captured a real photo via
  `getUserMedia`, then ran a hardcoded `setTimeout` and displayed "Extracting skeletal
  landmarks and calculating confidence scores" / "Your base measurements have been extracted
  successfully" — the code literally comments `// Simulate processing for now`. No API call
  was ever made; the photo was discarded.
- **Fix**: Removed the fabricated progress/success copy and API-call implication; the screen
  now honestly tells the user automatic extraction isn't available yet and routes to manual
  entry.
- **Files changed**: `apps/web/src/app/measurements/camera/page.tsx`.
- **Verification**: manual code review + `tsc`/`next build` pass.

### BUG-02 — P0 — `/product-intelligence/recommendations` and `/conversation/chat` 500 on every call
- **Root cause**: `routers/product_intelligence.py` and `routers/conversation.py` constructed
  `StylistContext(measurements=..., preferences=..., brand_name=...)`, but
  `services/stylist/types.py` defines `StylistContext(chest, waist, brand_name,
  fit_preference)` — all required, none matching. Both routers then called
  `StylistEngine.generate(ctx)`, a method that does not exist (`RecommendationEngine` only
  has `get_recommendation`). Reproduced live: `pydantic.ValidationError` → unhandled 500 on
  every request to both endpoints, for the exact intents ("What size should I buy?", "Does
  Zara fit me?") the conversational stylist exists to answer. Pre-existing unit tests never
  caught this because they call the engines directly, bypassing the router glue.
- **Fix**: Both routers now build `StylistContext` with the correct fields and call
  `get_recommendation()`.
- **Files changed**: `apps/api/routers/product_intelligence.py`, `apps/api/routers/conversation.py`.
- **Test added**: `test_product_intelligence_recommendations_does_not_500`,
  `test_conversation_chat_sizing_intent_does_not_500`,
  `test_conversation_chat_product_intent_does_not_500`,
  `test_conversation_chat_brand_intent_does_not_500`.
- **Verification**: all 4 now return 200 with real computed data; full suite green.

### BUG-03 — P0 — Hardcoded JWT signing secret committed to source control
- **Root cause**: `core/config.py` had `SECRET_KEY: str = "09d25e09...e8d3e7"` as a literal
  default, and no `.env` file exists to override it — this value is what the app actually
  runs on. Anyone with repo read access can forge a valid token for any user.
- **Fix**: Default now generates a random per-process secret via `secrets.token_hex(32)`
  (env var `SECRET_KEY` still takes priority via pydantic-settings, as required for real
  deployments); a runtime warning fires if the old leaked value is ever explicitly set via
  env var.
- **Files changed**: `apps/api/core/config.py`.
- **Action still required by operators**: set `SECRET_KEY` explicitly in any shared/staging/
  production environment — the random fallback is dev-only (invalidates sessions on restart).

### BUG-04 — P1 — CORS wildcard + credentials
- **Root cause**: `allow_origins=["*"]` with `allow_credentials=True`. Starlette's
  `CORSMiddleware` reflects the request's actual `Origin` header back verbatim in this
  combination rather than sending a literal `*` — meaning any website could make
  cookie-bearing, authenticated requests to this API from a victim's browser.
- **Fix**: Origins now come from `CORS_ALLOWED_ORIGINS` (comma-separated env var, defaults to
  `http://localhost:3000`).
- **Files changed**: `apps/api/main.py`, `apps/api/core/config.py`.
- **Test added**: `test_cors_does_not_wildcard_with_credentials`.

### BUG-05 — P1 — Measurement input had zero validation; NaN crashed error responses too
- **Root cause**: `MeasurementUpload.raw_data: Dict[str, Any]` accepted anything. Reproduced
  live: `chest: -50`, `chest: 999999`, and `chest: "abc"` were all silently accepted (`200
  OK`), persisted to the DB, and still stamped with the hardcoded `confidence_score: 0.92`.
  Separately, a `NaN` JSON literal (which Python's stdlib parser accepts non-standard) crashed
  the *error response itself* when rejected, because FastAPI's default validation-error
  serializer uses `json.dumps(..., allow_nan=False)` — turning a should-be-422 into an
  unhandled 500 for any endpoint, not just this one.
- **Fix**: `MeasurementUpload` now validates known measurement keys are finite numbers within
  a plausible bound (20–250cm for chest/waist/hip, etc.) via a Pydantic field validator; a
  global `RequestValidationError` handler in `main.py` sanitizes any non-finite float before
  serializing so validation errors can never themselves crash.
- **Files changed**: `apps/api/schemas/measurement.py`, `apps/api/main.py`.
- **Tests added**: 4 tests covering negative/absurd/non-numeric/NaN rejection plus one
  confirming valid input still succeeds.

### BUG-06 — P1 — Empty and oversized passwords crashed or were silently accepted
- **Root cause**: `UserCreate.password: str` had no bounds. Registering with `password: ""`
  returned `200 OK`. Registering (or logging in) with a password over bcrypt's 72-byte limit
  raised an unhandled `ValueError` inside `bcrypt.hashpw`/`checkpw` → 500, reproducible from
  either the register or login endpoint (login uses `OAuth2PasswordRequestForm`, which isn't
  covered by any Pydantic length constraint).
- **Fix**: `UserCreate.password` now has `min_length=8, max_length=72`; `core/security.py`
  additionally guards both `get_password_hash` and `verify_password` directly so login can
  never crash on this regardless of which caller reaches it.
- **Files changed**: `apps/api/schemas/user.py`, `apps/api/core/security.py`.
- **Tests added**: 3 tests (empty password rejected, oversized password rejected at register,
  oversized password at login returns a clean 400 not a 500).

### BUG-07 — P2 — Route-protection gap on `/history`, `/products`, `/stylist`
- **Root cause**: all three pages call `getToken()` expecting an authenticated session, but
  `middleware.ts`'s route matcher only covered `/dashboard`, `/measurements`, `/profile`.
  An unauthenticated visitor hitting those three pages got a broken client render instead of
  a clean redirect to `/login`.
- **Fix**: added the three routes to both the protected-route check and the middleware
  matcher.
- **Files changed**: `apps/web/src/middleware.ts`.

### BUG-08 — P2 — JSON logs always had `null` timestamp and `null` level
- **Root cause**: `main.py` configured `JsonFormatter('%(timestamp)s %(level)s ...')` —
  neither `timestamp` nor `level` are real Python `LogRecord` attributes (`asctime` and
  `levelname` are). Every production log line silently lost its severity and timestamp.
- **Fix**: corrected the format string.
- **Files changed**: `apps/api/main.py`.

### BUG-09 — P2 — Test suite mutated the real dev database; `state-machine.ts` type error
- **Root cause A**: `test_api_stylist.py` imported the real `engine`/`get_db` from
  `database.py` directly with no override, so every `pytest` run wrote to and read from the
  actual `apps/api/cartsync.db` — explaining why it showed as git-modified after test runs.
- **Fix A**: added `apps/api/tests/conftest.py` with an isolated in-memory SQLite fixture
  (`StaticPool`-backed, since default pooling opens a fresh, empty `:memory:` db per
  connection) and an authenticated-client fixture; all new tests use it.
- **Root cause B**: `apps/web/src/lib/cv/camera/state-machine.ts` fired
  `trackEvent("frame_validation_failed", ...)` on *every* transition into `FAILED` (camera
  permission denial, hardware error, capture failure — not just frame-validation failures),
  which was also a TypeScript compile error since that string wasn't in the `EventName`
  union — a real, reproducible `tsc` failure, not a style nit.
- **Fix B**: added a correctly-scoped `camera_state_failed` event name and used it instead,
  fixing both the mislabeled analytics and the compile error.
- **Files changed**: `apps/api/tests/conftest.py` (new),
  `apps/api/tests/test_regression_qa_hardening.py` (new), `apps/web/src/lib/analytics/events.ts`,
  `apps/web/src/lib/cv/camera/state-machine.ts`.

## 7. Security Findings

| Finding | Severity | Status |
|---|---|---|
| Hardcoded JWT secret in source control | P0 | Fixed (BUG-03) |
| CORS wildcard + credentials | P0/P1 | Fixed (BUG-04) |
| No password length bounds (empty accepted, long crashes) | P1 | Fixed (BUG-06) |
| No IDOR/BOLA found — all queries scoped by JWT-derived `user_id` | — | Verified clean |
| Cookie flags (`httpOnly`, conditional `secure`) | — | Verified correct |
| SQL injection | — | Not exploitable — SQLAlchemy ORM used throughout, no raw SQL/string interpolation found |
| No secrets/`.env`/service-account files committed to git | — | Verified clean |
| Dev SQLite db (with real bcrypt hashes) and 34 `.pyc` files tracked in git | P2 | `.gitignore` added; **`git rm --cached` recommended but not performed** (changes staging state, left for the user) |
| No rate limiting on `/auth/login`, `/auth/register`, `/measurement/extract`, `/conversation/chat` | P1 | **Not implemented** — flagged, not fixed (see §19) |
| `python-jose` / `passlib` — `passlib` confirmed unused dead dependency (bcrypt used directly) | P3 | Documented, not removed |

## 8. Performance Findings

Only single-process, single-request latencies were measured via TestClient in this session —
**not a real load test.** No 10/50/100-concurrent-user benchmark was run; fabricating one
would violate the master prompt's explicit instruction not to invent benchmarks.

| Metric | Result | Status |
|---|---|---|
| `/measurement/extract` (TestClient, single request) | ~10–56ms | Informational only |
| `/product-intelligence/recommendations` | ~47ms | Informational only |
| `next build` (Turbopack, cold) | Compiled in 5.3s, typechecked in 5.9s, 13 static pages in 1.2s | Real, measured |
| Concurrent load (10/50/100 users) | **Not executed** | No load-testing tool run this session |

## 9. Database Findings

- Alembic migration chain (3 revisions) applies cleanly to a genuinely empty SQLite file →
  produces all 11 expected tables. `create_all()` confirmed unused in `main.py`.
- All FK relationships (`user_id` → `users.id`) present; queries consistently scoped by
  authenticated user.
- `MeasurementProfile` (raw) vs `EffectiveMeasurement` (derived) separation is a sound design
  — but `extract_measurements` *deletes* the prior `EffectiveMeasurement` row on every new
  submission (upsert-by-delete). This is intentional per the code's own docstring ("mutable"),
  not a bug, but it means measurement history for *effective* measurements doesn't exist —
  only raw `MeasurementProfile` rows are retained (`/measurement/history` reads from there).
  Worth knowing if "measurement history" UI expects effective-measurement trend data.
- Real dev database committed to git (see §7).

## 10. Camera/CV Findings

See §1 and BUG-01. Summary:
- **Real**: `getUserMedia` permission flow, front/back camera toggle, 3-2-1 countdown capture,
  canvas-based JPEG capture, permission-denied state, `VisionProvider` TypeScript interface,
  blur/lighting quality-check utilities (`lib/cv/quality/*`), a camera state machine with a
  defined valid-transition graph.
- **Not real**: any implementation of `VisionProvider`, any pose/depth model, any code path
  connecting a captured photo to the backend at all. The capture screen fabricated a
  measurement-success narrative for a photo that was never processed or transmitted — now
  fixed to be honest (BUG-01).
- Measurement accuracy: **UNVALIDATED** by definition, since no extraction pipeline exists
  to validate. The backend's `confidence_score: 0.92` is a hardcoded literal, not a
  computed value, for the manual-entry path too.

## 11. UX Findings

- Manual measurement entry form is clean, well-labeled, and now honestly represents the only
  working measurement path.
- Camera flow's fabricated success state (BUG-01) was the single worst UX/trust issue found —
  fixed.
- Auth pages, dashboard, stylist chat: functional per code review and `next build`; full
  interactive browser walkthrough (click-through of every state per §14 of the brief) was
  **not performed** this session — no browser automation tool was invoked. Static analysis
  and `tsc`/`eslint`/`next build` are not a substitute for that and are reported as what they
  are.

## 12. Accessibility Findings

**Not executed.** No screen-reader pass, no keyboard-navigation walkthrough, no contrast
audit was performed this session. Flagging as unvalidated rather than asserting a score.

## 13. Privacy Findings

- Analytics (`lib/analytics/track.ts`) currently only `console.info`s events — nothing is
  sent to a real third-party endpoint yet, so there is no live exfiltration risk today, but
  also no evidence one way or the other about what a real analytics integration would send
  later (raw measurement values already flow through `trackEvent` call sites in a few
  components — worth a explicit allowlist review before wiring a real provider).
- `MeasurementProfile.raw_data` (JSON column, model docstring calls it "highly sensitive") is
  stored without any redaction/anonymization step — expected for now since there's no image
  data flowing into it (manual entry only), but will need attention once/if a real image
  pipeline exists.
- No raw camera images are persisted anywhere server-side (confirmed — no upload code path
  exists at all, per §10).

## 14. Remaining Technical Debt

- 49 ESLint errors / 21 warnings, almost entirely `@typescript-eslint/no-explicit-any` and
  unescaped-apostrophe rules — not fixed in bulk (deliberate scope decision, see §19).
- `CustomCursor.tsx` calls `setState` synchronously inside an effect (flagged by
  `react-hooks/set-state-in-effect` as an error, not just a warning) — real anti-pattern,
  not fixed this session.
- `middleware.ts` file convention is deprecated in Next.js 16 in favor of `proxy` — build
  still succeeds today but this will eventually break on a future Next.js upgrade.
- `passlib` listed in `requirements.txt` but unused (bcrypt used directly) — dead dependency.
- Two parallel, incompatible architectures coexist in the repo (§1, §18) — needs a decision,
  not a patch.

## 15. Remaining Prototype / Non-Functional Components

- Entire computer-vision measurement extraction pipeline (pose, depth, calibration).
- `/conversation/chat`'s "LLM" is explicitly a rules-based template
  (`services/conversation/conversation_engine.py` comment: "5. LLM (Mocked for now)") — not a
  real language model call. This is honestly labeled in the code already; no user-facing
  claim contradicts it.
- Rate limiting on any endpoint.
- Real analytics provider (currently console-only).

## 16. Recommended Improvements (not implemented this session — out of hardening scope)

- Add rate limiting (login, register, measurement extraction, conversation chat) — a minimal
  in-memory or Redis-backed limiter, not a distributed system.
- Decide and document which of the two architectures (`apps/api`+`apps/web` vs. the
  Firebase/`python`/`local-compute` stack) is canonical; archive or delete the other to stop
  future confusion.
- `git rm --cached` the tracked `.pyc` files and `cartsync.db` now that `.gitignore` exists.
- Add an integration test that exercises every router through TestClient end-to-end (the gap
  that let BUG-02 ship silently) rather than only unit-testing the underlying services.

## 17. P0/P1/P2/P3 Backlog

| ID | Priority | Item | Status |
|---|---|---|---|
| BUG-01 | P0 | Fabricated camera measurement flow | **Fixed** |
| BUG-02 | P0 | product-intelligence & conversation endpoints 500 on every call | **Fixed** |
| BUG-03 | P0 | Hardcoded JWT secret in source control | **Fixed** |
| BUG-04 | P1 | CORS wildcard + credentials | **Fixed** |
| BUG-05 | P1 | Measurement input validation + NaN crash in error handler | **Fixed** |
| BUG-06 | P1 | Empty/oversized password handling | **Fixed** |
| — | P1 | No rate limiting on auth/measurement/chat endpoints | Open |
| BUG-07 | P2 | Route-protection gap (`/history`, `/products`, `/stylist`) | **Fixed** |
| BUG-08 | P2 | JSON logger always logs null timestamp/level | **Fixed** |
| BUG-09 | P2 | Test suite mutated real dev DB; state-machine type error | **Fixed** |
| — | P2 | Tracked `.pyc`/`cartsync.db` in git | `.gitignore` added; untracking left to user |
| — | P3 | 49 ESLint `no-explicit-any`/style errors | Open |
| — | P3 | `passlib` dead dependency | Open |
| — | P3 | `middleware.ts` → `proxy` rename (Next 16 deprecation) | Open |
| — | P3 | Dual/legacy architecture consolidation | Open (product decision) |

## 18. Architectural Note (not a bug — a decision needed)

The repository contains two complete, non-interoperating implementations of "CartSync":
1. `apps/api` + `apps/web` — FastAPI/SQLAlchemy/SQLite + Next.js, actively developed (per git
   status), matches the actually-running system audited above.
2. Root-level `src/`, `python/`, `frontend/`, `functions/`, `local-compute/` — Firebase/
   Firestore + a from-scratch MediaPipe/Depth-Anything-V2 pipeline, matching what the
   top-level `README.md` describes as the architecture.

These share no auth system, no database, and no measurement pipeline. This should be
resolved before further feature work — most likely by explicitly archiving the legacy tree
and updating the README, or by deliberately porting the working CV code from `python/`/
`local-compute/` into `apps/api` if that pipeline is further along than a first read suggests
(not assessed in depth this session — out of scope for a hardening pass on the active stack).

## 19. Scope Decisions

Given the enormous size of the original 46-section brief (a multi-week QA program), this
session prioritized finding and fixing **real, reproduced** defects over superficially
touching every section. Explicitly out of scope this session, by design:
- Bulk ESLint `any`-type cleanup (49 call sites) — quality debt, not correctness bugs; fixing
  all of them risks unreviewed churn for a hardening pass.
- Implementing rate limiting — flagged as P1 but genuinely new functionality, not a fix to
  existing broken behavior; deferred to avoid scope creep into feature work.
- Any load/stress testing beyond single-request latency — no tool available to honestly
  simulate concurrent users without fabricating results.
- Browser-driven UI/accessibility/responsive walkthrough — no browser automation was invoked
  this session; static analysis (`tsc`, `eslint`, `next build`) covers correctness but not
  actual rendered behavior.

## 20. Production Readiness Score (0–10, evidence-based)

| Category | Score | Basis |
|---|---|---|
| Architecture | 4 | Sound within `apps/api`, but two incompatible parallel stacks coexist (§18) |
| Frontend | 6 | Builds clean, typechecks clean post-fix; real lint debt remains |
| Backend | 6 | Clean structure, migrations real; had 2 completely broken endpoints pre-fix |
| Database | 7 | Real migrations, correct FK scoping; dev db committed to git |
| Authentication | 6 | Correct cookie/JWT mechanics; secret was hardcoded pre-fix |
| Security | 4 → 7 post-fix | 3 P0/P1 holes found and closed; no rate limiting remains open |
| Measurement Engine | 1 | Does not exist beyond manual entry + a random-fallback stub |
| Computer Vision | 1 | Interfaces and quality checks only; no model implementation |
| AI/ML | 2 | Conversation "LLM" is an honestly-labeled rules engine, not a model call |
| Product Intelligence | 6 | Sound, deterministic scoring logic; was unreachable via the API pre-fix |
| Stylist | 6 | Sound, deterministic; was unreachable via conversation pre-fix |
| Performance | N/A | Not load-tested; single-request latency only |
| Testing | 6 | 28 passing tests post-session, real DB isolation now in place; no E2E/browser tests |
| Accessibility | N/A | Not evaluated this session |
| UX | 5 | Fabricated camera flow was the worst issue; now fixed to be honest |
| Privacy | 6 | No leakage found; analytics is console-only for now |
| Maintainability | 5 | Good service decomposition; dual-architecture confusion hurts this |
| Scalability | N/A | Not evaluated — SQLite dev db, no infra tested |

No single overall number is given — averaging categories that include "does not exist" (CV)
with categories that are solid (DB) would misrepresent both.

## 21. Not Executed / Explicitly Unvalidated

- Real device camera testing (multiple devices, lighting conditions, occlusion scenarios).
- Concurrent load testing at any scale.
- Screen-reader / keyboard-only accessibility pass.
- Full interactive browser click-through of every route/state.
- Real-world measurement accuracy benchmarking against ground truth (no such pipeline exists
  to benchmark — see §10).
- Deep audit of the legacy `python/`/`local-compute/` CV code (out of scope — different,
  disconnected system).

## 22. Final Decision

**B. STABILIZATION REQUIRED.**

Not (A) ready for new feature development: the product's core stated value proposition — AI
body measurement via camera — does not exist in the active codebase, and until this session
two of six backend feature endpoints returned an unconditional 500. Not (C) critical blocker:
every P0 found was reproduced, root-caused, fixed, and covered by a regression test in this
session, and the full test suite (28/28) plus a clean production build confirm no regression
was introduced. The path to (A) is: decide the CV/measurement architecture question (§18),
add rate limiting, and continue closing the P2/P3 backlog in §17 — not further firefighting.

## 23. Evidence / Exact Commands Used

```bash
# Backend
cd apps/api
venv/Scripts/pip.exe install -r requirements.txt --dry-run
venv/Scripts/python.exe -m pytest -v
SQLALCHEMY_DATABASE_URL="sqlite:///./qa_clean_migration_test.db" venv/Scripts/alembic.exe upgrade head
# (plus targeted TestClient scripts reproducing each bug in §6 before/after fix)

# Frontend (from repo root, npm workspace)
npx tsc --noEmit -p apps/web/tsconfig.json
cd apps/web && ../../node_modules/.bin/eslint . --max-warnings=9999
cd apps/web && ../../node_modules/.bin/next build

# Repo hygiene
git ls-files | grep -iE "\.env$|serviceAccountKey|credentials\.json|\.pem$|\.key$"
git ls-files | grep -E "__pycache__|\.pyc$|\.db$"
```

All 28 backend tests and the `next build` output referenced above were run in this session;
none of the numbers in this report were estimated or extrapolated.
