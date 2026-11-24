# CartSync roadmap

Written 2026-11-17. Covers three things: finishing the web app so it works
end to end, running the stylist on a local LLM, and the mobile app. Each
phase lists what it needs and how to tell it is done.

## Where the app is today

Working and tested (165 backend tests, 92 frontend tests):

- Sign-up, sign-in, sign-out.
- Body measurements from two camera photos (runs in the browser) or typed in.
- Fit guide by garment type: tops from chest, trousers from waist (women's
  also from hip), dresses from the largest of bust, waist and hip.
- Paste a product link: reads name, brand, photo and price. Proven on
  Myntra. Flipkart shows a CAPTCHA and Amazon publishes no product data, so
  both fall back to "upload a photo".
- Virtual try-on code path, calling fal.ai. Never produced a real picture
  because no fal.ai key has been set.

Not real yet:

- **Stylist chat** is keyword rules, not a language model.
- **Products page** is seven hardcoded items with no photos or prices.
- **Size charts** are one general chart. Only Zara has a brand adjustment.
- **Not deployed.** It runs on this laptop only.
- `/settings` and `/profile` pages do not exist (links to them were removed).

## Phase A: make the web app complete

| Step | What | Needs | Done when |
|---|---|---|---|
| A1 | My Items: save every imported product (photo, price, size, link) and replace the hardcoded Products page with it | Nothing | A pasted link shows up on My Items after a reload |
| A2 | Try-on history: keep each generated picture against its item | A1, a file store (Render disk or S3-style bucket) | A past try-on can be reopened |
| A3 | Profile page: name, men's/women's sizing, fit preference | Nothing | Fit guide uses the saved department when a title doesn't say |
| A4 | Brand size charts as data, entered from each brand's published chart | Someone to transcribe real charts; start with the brands the tester buys | A brand with a chart no longer shows the "general chart" caveat |
| A5 | Deploy: Vercel + Render + Postgres, per `DEPLOYMENT.md` | fal.ai, Render and Vercel accounts (owner must create them) | A phone on mobile data can sign up and get a real try-on picture |
| A6 | Cleanup: 46 lint errors, `middleware` to `proxy` rename, stale `CURRENT_STATE.md` | Nothing | `npm run lint` passes |

Order: A1 and A3 first (no dependencies), A5 as soon as the accounts exist,
then A2 and A4.

## Phase B: stylist on a local LLM

### What is already here

- Ollama 0.40.14 is installed on this laptop with `qwen2.5:7b` (4.7 GB)
  downloaded. The GPU is an RTX 5060 Laptop with 8 GB.
- The job queue (`apps/api/routers/compute.py`) and the worker node
  (`local-compute/`) exist and are tested. The `LLMWorker` is a placeholder
  that fails honestly.
- Not yet checked: whether Ollama runs this model on the GPU or falls back
  to CPU on this card. That is step B1.

### Design

The model writes the words. It never decides the size. Sizes keep coming
from the tested sizing engine, and the model is handed the result to explain.
This keeps the one number the user acts on out of the model's hands.

```
phone/browser -> apps/api /conversation/chat
                   |- sizing engine  -> size + reasons (as today)
                   |- enqueue LLM job (question, measurements, size, saved items)
                   '- wait up to ~20 s for the result
local-compute node (this laptop) -> claims job -> Ollama -> completes job
```

- If no worker answers in time, the API returns today's rules-based answer.
  The chat always answers; the model makes it better when the laptop is on.
- In local development the API can call Ollama directly on
  `localhost:11434` and skip the queue.
- The deployed API cannot reach the laptop, which is why the laptop pulls
  jobs from the queue instead.

| Step | What | Done when |
|---|---|---|
| B1 | Measure `qwen2.5:7b` on this laptop: GPU or CPU, seconds per answer | A number is written down; pick 7b or a smaller model from it |
| B2 | Real `LLMWorker`: calls Ollama, returns text, fails honestly on error | A queued job comes back with a model-written answer |
| B3 | `/conversation/chat` enqueues, waits, falls back to rules | Chat works with the laptop on and with it off |
| B4 | Prompt and guardrails: answer only from supplied facts, say "I don't know" otherwise | A set of 20 test questions gets no invented sizes or prices |
| B5 | Chat UI shows whether the answer came from the model or the fallback | Label visible in the chat |

Limits to accept: the laptop must be on and online for model answers, one
answer at a time on an 8 GB card, and answers take seconds, not instant.
Hosted model APIs remove all three at a per-message cost; the queue design
lets that be swapped in later without changing the chat endpoint.

Local try-on (IDM-VTON) stays out of scope until someone confirms current
PyTorch supports this GPU. It was blocked in August and has not been
re-checked.

## Phase C: mobile app

### Step C1: installable web app first

Make the existing site a PWA: manifest, icons, service worker for the app
shell, "Add to Home Screen". The camera capture and every page already work
in a mobile browser, so this gives a home-screen app with no second
codebase. Done when it installs on Android and iOS and the camera flow works
from the installed icon. Depends on A5 (PWAs need HTTPS).

### Step C2: native app when the PWA runs out

Build native only for things the web cannot do well: sharing a product
straight from the Myntra app into CartSync, push notifications, and a
smoother camera.

- **Stack:** Expo (React Native) with TypeScript. Same language as the web
  app, one codebase for Android and iOS, and no backend changes because the
  API is already plain JSON over HTTPS.
- **Shared code:** move the API clients (`apps/web/src/lib/*.ts`) and the
  measurement maths (`apps/web/src/lib/cv/`) into `packages/` so web and
  mobile import the same code.
- **Auth:** the web app keeps its token in an httpOnly cookie. Mobile sends
  the same token as a Bearer header and stores it in the device keychain.
  The API already accepts Bearer tokens.
- **Pose detection:** the web build uses MediaPipe for web. Native needs the
  MediaPipe native SDK or a WebView around the existing capture page. Start
  with the WebView; replace it only if it is too slow.
- **Share target:** register CartSync as a share target so "Share" on a
  product in Myntra opens the try-on screen with the link filled in. This is
  the main reason to go native.

| Step | What | Done when |
|---|---|---|
| C1 | PWA | Installs from the browser on both platforms |
| C2 | Extract shared packages | Web app builds using `packages/` imports |
| C3 | Expo app: sign-in, dashboard, try-on, measurements via WebView | Runs on a real Android phone |
| C4 | Share target | Sharing a Myntra product opens try-on with the link |
| C5 | Store release | Needs Google Play ($25 once) and Apple Developer ($99/year) accounts |

## Things only the owner can do

- Create fal.ai, Render and Vercel accounts (A5).
- Create Google Play and Apple Developer accounts (C5).
- Keep the laptop on for local-model answers (Phase B).
- Supply real brand size charts, or name the brands to transcribe (A4).
