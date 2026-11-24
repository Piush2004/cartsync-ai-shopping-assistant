# CartSync Android app: hand-over

For the owner (you) and for the friend who tests it. Plan: `FLUTTER_APP_PLAN.md`.

## What is built

| Part | State |
|---|---|
| Server address, sign up, sign in, sign out | Done, checked on an emulator against the real backend |
| Shopping-app layout: bottom tabs (Home, Try on, Ask, You), search bar, banner carousel, category chips, product grid with your size, You tab | Done, checked on the emulator, at 1.5x text size, and in tests for a 360x640 phone |
| Measurements (chest, waist, hip, inseam, shoulder) | Done, saved to the server, filled in again on return |
| Ask the stylist | Done. Model answer with Ollama on, offline note with Ollama off |
| Try on: photo, Myntra link, size tag | Done. Real Myntra link gives product, price, size tag with reasons |
| Try on: the finished picture | Needs a fal.ai key on the laptop (see below). Without one the app says so plainly |
| Release APK | `apps/mobile/build/app/outputs/flutter-apk/app-release.apk` |

Tests: `cd apps/mobile && flutter test` (93), `flutter analyze` (clean),
`cd apps/api && venv/Scripts/python.exe -m pytest -q` (180).

## Owner: before the friend tests

Everything runs on this laptop. It must stay on, awake and online.

1. **Ollama** (for model-written chat answers): `ollama serve`.
   Without it the chat still works, with short built-in answers.
2. **Backend** from `apps/api` (no `--reload`):
   ```bash
   ./venv/Scripts/python.exe -m uvicorn main:app --host 127.0.0.1 --port 8010
   ```
   Port 8010 is used here because 8000 was taken by another project.
3. **Tunnel** (the one step that makes this laptop reachable from the internet):
   ```bash
   D:/tools/cloudflared/cloudflared.exe tunnel --url http://localhost:8010 --protocol http2
   ```
   (`--protocol http2` because the default QUIC connection timed out on this
   network.) It prints an address like `https://something.trycloudflare.com`. Tunnel
   port 8010 only. Never tunnel 3000, 11434, or the whole machine.
4. Check `https://<that address>/api/v1/health` shows `{"status":"ok"}`.
5. Send the friend: the APK, that address, and the steps below.
6. **Close the tunnel (Ctrl+C) when the test ends.** The address is public:
   anyone who has it can reach the sign-up page. A quick tunnel gets a new
   address every restart, so the friend must paste the new one
   (menu, then "Server address").

Rate limits (5 sign-ins a minute, 5 sign-ups a minute) are counted per real
caller behind the tunnel, using Cloudflare's `CF-Connecting-IP`, trusted only
from the local tunnel program.

### Try-on pictures

Set `FAL_API_KEY` (a fal.ai account is yours to create; it bills per picture)
in the environment before starting the backend. Without it the app shows
"Picture try-on is not set up on this server yet" and the size still works.

### Known limits to tell the friend

- Product links: Myntra worked earlier on 18 Nov, then Myntra showed a
  "Site Maintenance" page to everyone, including a normal browser, so it is
  down on their side, not blocked by us. Flipkart answered "HTTP 429" (too
  many requests) after many test lookups, and Amazon links never give product
  data. In every case the app says to use "Garment photo" instead, and that
  route works.
- The product grid on Home uses the app's own 7 sample products (brand-colour
  tiles, no photos), each with your size.
- The app only works while the laptop is on and the tunnel is open.
- The size uses a general chart unless the brand has its own data, and says so.
- Android only. The APK is signed with a debug key, which is fine for
  sideloading and not for a store.

## Friend: test steps

1. Install the app. Android will ask to allow installing from this source.
2. Open it and paste the server address you were sent.
3. Create an account.
4. Enter your measurements in centimetres.
5. Open "Try on a product", take a photo of yourself (full body, good light)
   and paste a Myntra product link.
6. Note the size it gives. Does it match what you usually buy?
7. Ask the stylist: "Does Zara run small?"
8. Tell us anything that was confusing, slow, or wrong.
