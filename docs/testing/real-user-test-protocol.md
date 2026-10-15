# CartSync Real-User Test Protocol

For the first real human tester (not synthetic fixtures, not the engineer).
Use this to structure the session and capture results honestly -- do not
fill in numbers that weren't actually observed.

## Before starting

- Confirm `apps/api` (`uvicorn main:app --reload`) and `apps/web` (`npm run dev`)
  are both running.
- Confirm the tester has a browser with camera access (Chrome/Safari on a
  real phone or laptop -- this cannot be tested in a sandboxed/headless
  browser, which is why this session hasn't happened yet as of this report).
- Have a tape measure on hand if the tester is willing to take manual
  reference measurements for accuracy comparison (see §11).

## Test steps

Record for each: **success/failure, time taken, error (if any), user
feedback (verbatim if possible), measurement output, confidence.** Leave a
field blank rather than guessing.

| # | Step | Success/Fail | Time | Error | Feedback | Notes |
|---|---|---|---|---|---|---|
| 01 | Register + login | | | | | |
| 02 | Enter height, start scan | | | | | |
| 03 | Front photo capture (may take multiple attempts -- record how many) | | | | | |
| 04 | Side photo capture | | | | | |
| 05 | Measurement review screen -- values, confidence shown correctly? | | | | | |
| 06 | Confirm measurements | | | | | |
| 07 | Dashboard / Fit Identity reflects the new measurements | | | | | |
| 08 | Stylist recommendation (`/stylist`) | | | | | |
| 09 | Product recommendations (`/products`) | | | | | |
| 10 | Ask the AI Stylist a question (e.g. "What size should I buy?") | | | | | |
| 11 | Repeat scan (retake) -- does it feel consistent? | | | | | |
| 12 | Submit `/testing` feedback form | | | | | |

## Failure-case checks (Phase 27)

Deliberately try each of these and record what actually happens (not what
should happen):

- Bad lighting (very dark room)
- Camera too close / too far
- Head or feet cropped out of frame
- Tilted body / off-axis camera
- Side angle facing the wrong way
- Busy background
- Loose/baggy clothing
- A second person stepping into frame

For each: does CartSync show a clear, honest error (per §4 of the master
brief -- "we couldn't confidently read your measurements"), or does it
silently produce a number? A produced number in any of these cases is a bug.

## Accuracy comparison (only if the tester is willing to share manual measurements)

| Measurement | Camera estimate (cm) | Manual tape measurement (cm) | Absolute error (cm) |
|---|---|---|---|
| Chest | | | |
| Waist | | | |
| Hip | | | |
| Shoulder | | | |
| Inseam (proxy) | | | |

Compute MAE across whichever rows have both values filled in. Do not average
in rows the tester didn't provide a manual value for.

## Repeatability (only if the tester captures 2-3 times under similar conditions)

| Capture | Chest | Waist | Hip |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

Compute standard deviation and coefficient of variation (stdev / mean) per
column across however many captures were actually done.

## After the session

Transcribe the results above (not a summary, the actual filled-in table)
into `CARTSYNC_V1_REAL_USER_READINESS_REPORT.md`'s accuracy/repeatability
sections, replacing every "NOT MEASURED" placeholder that this session
produced real data for. Leave any row this session didn't cover as "NOT
MEASURED" -- do not extrapolate.
