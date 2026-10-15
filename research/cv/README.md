# CartSync CV Research Lab

Isolated research environment for answering one question: **which CV
architecture can realistically measure a human body from ordinary smartphone
images, at CartSync's accuracy/performance/privacy constraints?**

This directory is not part of the production build. Nothing here is imported
by `apps/api` or `apps/web`. Its own Python environment (`research/cv/venv`,
Python 3.11.9 -- required for MediaPipe/most CV package compatibility, apps/api
runs 3.14) is fully separate from `apps/api/venv`.

## Layout

- `benchmarks/` -- write-ups of benchmark methodology and results (human-readable)
- `experiments/` -- one-off exploratory scripts, not meant to be re-run as a suite
- `models/` -- downloaded model weights (gitignored; re-downloaded on demand, never committed)
- `results/` -- raw JSON output from benchmark scripts (measured, not fabricated)
- `scripts/` -- the actual benchmark/experiment code

## Setup

```bash
cd research/cv
"../../local-compute/python311/tools/python.exe" -m venv venv   # Python 3.11, needed for MediaPipe
venv/Scripts/python.exe -m pip install -r requirements.txt
```

Note: this venv currently pins `matplotlib==3.8.4`. The default matplotlib
wheel (3.10.x, pulled in transitively by `mediapipe`'s `tasks.python.vision`
import graph) fails to import on this machine with
`ImportError: DLL load failed while importing _c_internal_utils: An
Application Control policy has blocked this file.` -- a Windows Application
Control / Smart App Control policy on this specific machine blocking that
particular compiled extension. This was **not bypassed** (no system security
settings were touched); pinning an older matplotlib build that isn't flagged
was sufficient. If you hit this on a different machine, check `pip list` for
the matplotlib version this repo pins before assuming CV work is blocked.

## Ground rules (see also the parent repo's "camera measurement product rule")

- Every number in `results/` and `benchmarks/` is either a real, wall-clock
  measurement taken on real hardware, or is explicitly labeled as sourced
  from an external document with a link. Nothing is estimated, assumed, or
  invented.
- Synthetic data is allowed for pipeline *debugging* and is always labeled
  `SYNTHETIC` in any output; it is never cited as evidence of real-world
  accuracy.
- This lab does not touch the production runtime. Nothing here writes to
  `apps/api`'s database, and no production code imports from `research/`.

## Current status

See `benchmarks/model_candidates.md` for the pose/depth model comparison and
recommendation, and `results/mediapipe_pose_cpu_benchmark.json` for the raw
measured numbers behind it.
