# CartSync Flutter app: build plan

Written 2026-11-17. Nothing in this plan has been built or installed yet.
This file is the instruction set for the session that does the work. It
replaces the Expo suggestion in `docs/ROADMAP.md` Phase C.

## Decisions already made by the owner

1. **Flutter**, not React Native.
2. **Do not install anything until the owner says "start".** Flutter and the
   Android tools are not on this laptop (`flutter` and `cloudflared` were
   both "command not found" on 2026-11-17).
3. **Hosting: the backend runs on the owner's laptop, reached through a
   tunnel.** No cloud host.
4. **Friend's phone is unknown.** Build Android first. The existing website
   is the fallback for an iPhone (a Windows laptop cannot build iPhone apps).

## Hard rules for whoever builds this

- Work in `apps/mobile/`. Do not change `apps/api` behaviour except where
  this plan says so. Do not touch `apps/web`.
- The app never computes a size. Sizes come from the API.
- Never show a made-up result. If a call fails, show the server's own
  message and a way forward.
- No technical words on screen: no "confidence", "engine", "API", "token",
  "source".
- Every phase ends with its tests passing and its "done when" check run on
  a real device or emulator. Report what was actually run.
- Ask the owner before: installing software, opening the tunnel, sending
  the APK to anyone, creating any account.
- Never put the fal.ai key, `SECRET_KEY`, or any password in the app or in
  git.

## What v1 contains, and what it does not

In v1:

| Screen | What the user does | API call |
|---|---|---|
| Server address | First run only: paste the address the owner sends | `GET /api/v1/health` to check it |
| Sign up | Email + password (8 to 72 characters) | `POST /api/v1/auth/register` (JSON `email`, `password`) |
| Sign in | Email + password | `POST /api/v1/auth/login` (form fields `username`, `password`) returns `access_token` |
| Home | Rail of three hang tags: try on, measurements, ask | `GET /api/v1/auth/me`, `GET /api/v1/graph/me` |
| Measurements | Type chest, waist, hip, inseam, shoulder in cm | `POST /api/v1/measurement/extract` with `source_type: "manual"`, `raw_data: {chest, waist, hip, inseam, shoulder}` |
| Try on | Pick own photo, then paste a product link or pick a garment photo | `POST /api/v1/link-import/preview` (JSON `url`), then `POST /api/v1/vton/try-on` (multipart `person_image` + `garment_image` or `garment_image_url`) |
| Size tag | Shows "Buy size M" on a hang tag with the reasons | From `fit_guide` in the link-import response |
| Ask | Chat with the stylist | `POST /api/v1/conversation/chat` (JSON `question`); show the offline note when `answered_by` is `"rules"` |

All calls except health, register and login send
`Authorization: Bearer <access_token>`.

Not in v1, and why:

- **Camera body scan.** The website's scan uses MediaPipe for the web, which
  Flutter cannot reuse. v1 uses typed measurements. Phase 6 adds the scan.
- **Sharing a product from the Myntra app into CartSync.** Phase 6.
- **iPhone build, Play Store listing.** Need a Mac and paid accounts.
- **Saved items and try-on history.** The API does not store them yet
  (`docs/ROADMAP.md` A1, A2).

Known limits to tell the friend up front:

- Product links work for Myntra. Flipkart and Amazon links fail with a
  clear message; she uploads a garment photo instead.
- Try-on pictures need a fal.ai key on the laptop. Without it the app says
  try-on is not set up. Only the owner can create that account.
- The app only works while the owner's laptop is on and the tunnel is open.

## Design

Carry the website's look across so the two feel like one product.

- **Colours:** background `#F5F7F4`, text and outlines `#232B6B` / `#1B1F3B`,
  cards `#FFFFFF`, borders `#D9DFD6`, marigold `#F4C20D`, error `#D7263D`.
- **Shifting gradient ("shot silk"):** deep `#232B6B → #5B2A86 → #A12568 →
  #1F6F78` on primary buttons and the rail bar; light `#F4C20D → #F9A26C →
  #F7A8C4` on the main tag. Animate slowly. Stop the animation when the
  phone's "reduce motion" setting is on.
- **Type:** Bricolage Grotesque for headings, Atkinson Hyperlegible for
  everything else (both via the `google_fonts` package, bundled in the app
  so it works offline).
- **Signature element:** the hang tag. The home screen is a rail with three
  tags; the size result is one large marigold tag that swings once.
- **Layout:** one column, thumb-reachable primary button at the bottom,
  minimum touch target 48 px, text never below 14 px.
- **Words:** buttons say what they do ("Save measurements", "Try it on").
  Errors say what happened and what to do next.

## Phases

Do them in order. Do not start a phase until the one before it is done.

### Phase 0: tools (needs the owner's "start")

1. Install Flutter stable from flutter.dev into `D:\tools\flutter`; add its
   `bin` to PATH.
2. Install Android Studio (or the Android command-line tools), an SDK
   platform, and one emulator image. Run `flutter doctor --android-licenses`.
3. Install `cloudflared` from Cloudflare's official release page.

Done when: `flutter doctor` shows no errors for Flutter and the Android
toolchain, and an emulator boots.

### Phase 1: project and foundations

1. `flutter create --org ai.cartsync --platforms android,ios apps/mobile`.
2. Packages: `http`, `flutter_secure_storage`, `go_router`, `image_picker`,
   `google_fonts`. Add nothing else without a reason written in the commit.
3. `lib/theme/`: colours, text styles, the silk gradient widget, the hang
   tag widget (ported from `apps/web/src/components/tryon/SizeTag.tsx`).
4. `lib/api/`: one `ApiClient` holding the server address and the token,
   mapping server errors to one `ApiException(message, status)`. FastAPI's
   `detail` is a string for most errors and a list of `{msg}` objects for
   422s; handle both (see `apps/web/src/lib/client.ts`).
5. Token goes in `flutter_secure_storage`, never in plain preferences.
6. Server address is entered once on first run and stored. It must be
   changeable from a settings entry, because a quick tunnel's address
   changes every time the tunnel restarts.

Done when: unit tests for `ApiClient` pass against a fake HTTP client
(success, 401, 422 list-detail, network failure), and the hang tag has a
widget test.

### Phase 2: sign-in and home

Screens: server address, sign up, sign in, home rail. A 401 on any call
clears the token and returns to sign in.

Done when: on the emulator, pointed at the laptop backend
(`http://10.0.2.2:8000` from the Android emulator), a new account can be
created, signed out, and signed back in. Widget tests cover the form
validation messages.

### Phase 3: measurements and stylist chat

Done when: typed measurements save and the home screen reflects them; the
chat returns a model-written answer with Ollama running and the offline
note with Ollama stopped.

### Phase 4: try on

1. Photo picker for the person photo (camera or gallery). Reject files over
   8 MB before upload, matching the server limit.
2. Garment by link or by photo. Show the product preview and the size tag.
3. Show the result picture, with "Try another".
4. Generation takes 10 to 60 seconds: show progress and keep the button
   disabled; never fire a second request.

Done when: a Myntra link shows the product and size tag; a blocked link
shows the server's message and the photo-upload path still works; with no
fal.ai key the app shows the "not set up" message, and with a key it shows
a real picture.

### Phase 5: tunnel, release build, hand-over

1. Backend: start with `uvicorn main:app --host 127.0.0.1 --port 8000`
   (no `--reload`) from `apps/api`. Set `SECRET_KEY` as a real environment
   variable first so sessions survive restarts.
2. Tunnel: `cloudflared tunnel --url http://localhost:8000`. Tunnel port
   8000 only. Never tunnel port 3000, the Ollama port 11434, or the whole
   machine.
3. Check `https://<tunnel>/api/v1/health` from a phone on mobile data.
4. `flutter build apk --release`. Install it on a real Android phone first.
5. Send the friend: the APK, the server address, and the test steps below.

Things to know about the tunnel:

- A quick tunnel needs no account, but its address changes on every
  restart and Cloudflare gives no uptime promise. A fixed address needs a
  free Cloudflare account and a domain; only the owner can set that up.
- The address is public. Anyone who has it can reach the sign-up page.
  Close the tunnel when testing ends.
- Sign-in and sign-up rate limits are counted per caller address. Behind
  the tunnel every caller looks like the laptop itself, so check whether
  the limiter sees the real address; if not, read Cloudflare's
  `CF-Connecting-IP` header in `apps/api/core/rate_limit.py`, with a test.
- The laptop must stay awake and online.

Done when: the release APK, on a real phone on mobile data, completes sign
up, measurements, chat, and a try-on through the tunnel.

### Phase 6: later

Camera body scan (MediaPipe native, or a WebView around the website's scan
page), Android share target for product links, iPhone build, store release.

## Testing

| Level | What | Command |
|---|---|---|
| Unit | `ApiClient`, error mapping, input validation, price formatting | `flutter test` |
| Widget | Each screen's empty, loading, error and success states, with a fake `ApiClient` | `flutter test` |
| Integration | Full sign-up to size-tag flow on an emulator against the real local backend | `flutter test integration_test` |
| Backend | Unchanged; must still pass | `cd apps/api && venv/Scripts/python.exe -m pytest -q` |
| Device | Release APK on a real phone through the tunnel | Manual, steps below |

No test may call fal.ai or a real shop website.

### Test steps to send the friend

1. Install the app. Android will ask to allow installing from this source.
2. Paste the server address you were sent.
3. Create an account.
4. Enter your measurements in centimetres.
5. Open Try on, take a front-facing photo, paste a Myntra product link.
6. Note the size it gives. Does it match what you usually buy?
7. Ask the stylist "Does Zara run small?".
8. Tell us anything that was confusing, slow, or wrong.

## Only the owner can do these

- Say "start" to allow the installs in Phase 0.
- Create a fal.ai account and key, or accept that try-on shows "not set up".
- Keep the laptop on, and decide when the tunnel is open.
- Find out the friend's phone type.
- Later: Cloudflare account for a fixed address, Google Play and Apple
  developer accounts.

## What changed while building (read this before trusting the text above)

- **Fonts:** bundled in `apps/mobile/assets/fonts` through the pubspec, not
  `google_fonts`. The package cannot bundle the Bricolage variable font.
- **Port:** the backend runs on 8010 here because 8000 belongs to another
  project. Tunnel 8010, not 8000.
- **Project name:** created with `--project-name cartsync`.
- **Extra package:** `http_parser`, to label photo uploads as `image/jpeg`,
  `image/png` or `image/webp`. Without it the `http` package sends
  `application/octet-stream` and the server refuses every photo (found on
  the emulator; covered by `test/upload_type_test.dart`).
- **Integration test:** `integration_test/auth_flow_test.dart` hangs on the
  emulator here, so Phase 2 to 4 were checked by hand on the emulator and by
  widget tests instead. It has not been shown to pass.
- **Rate limiter:** `apps/api/core/rate_limit.py` now reads
  `CF-Connecting-IP`, only from a loopback caller, with tests.
- Everything for this app was installed on D: (`D:\tools`), including the
  Flutter, Gradle and pub caches. See `D:\tools\cartsync-env.ps1`.
- Hand-over steps: `MOBILE_HANDOVER.md`.
