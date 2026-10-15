# CV Model Candidate Comparison

Date: 2026-08-11
Machine: Ryzen 7-class CPU, 24GB RAM, NVIDIA RTX 5060 8GB VRAM (Blackwell, `sm_120`), Windows 11, driver-reported CUDA 13.2.

Two kinds of claims appear below, and they are labeled accordingly:
- **MEASURED** -- run on this machine, this session, against real files. See `results/*.json` for raw output.
- **SOURCED** -- from an external source, with a link. Not independently verified by this lab.

Nothing below is estimated or assumed.

## 1. Pose estimation candidates

| Model | Keypoints | License | Model size | Speed (SOURCED) | Multi-person | Notes |
|---|---|---|---|---|---|---|
| **MediaPipe BlazePose / Pose Landmarker** | 33 (incl. z-depth, visibility, presence) | Apache 2.0 | Detector 3.14MB + Landmarker 12.9MB [(source)](https://huggingface.co/qualcomm/MediaPipe-Pose-Estimation) | Mobile: 11-12 FPS full / 5 FPS heavy on Pixel 5 [(source)](https://kitemetric.com/blogs/open-source-pose-detection-a-deep-dive-into-blazepose-movenet-and-yolov11) | No (single pose per detection region) | 33 landmarks is the most anatomically useful set of this group for body measurement (shoulders/hips/ankles all present with a z-estimate). |
| **MoveNet (Lightning/Thunder)** | 17 | Apache 2.0 (TF Hub) | Small (TFLite, <10MB typical) | Lightning: 34 FPS mobile browser [(source)](https://kitemetric.com/blogs/open-source-pose-detection-a-deep-dive-into-blazepose-movenet-and-yolov11) | No | Faster than BlazePose, but 17 keypoints omit the shoulder-width/hip-width detail a 33-point model gives for free; would need a second model or interpolation for equivalent coverage. |
| **YOLO-Pose (Ultralytics YOLO11/26)** | 17 | **AGPL-3.0**, or a paid Enterprise license for closed-source commercial use [(source)](https://docs.ultralytics.com/) | Varies by size (n/s/m/l/x) | YOLO26-nano: 30+ FPS on-device [(source)](https://kitemetric.com/blogs/open-source-pose-detection-a-deep-dive-into-blazepose-movenet-and-yolov11) | Yes | Licensing is disqualifying as-is: CartSync is closed-source, so shipping Ultralytics YOLO-Pose requires either open-sourcing the app under AGPL-3.0 or paying for an Enterprise license. Multi-person support is nice-to-have (occlusion/multiple-people detection) but not worth the licensing cost for V1. |

**Recommendation: MediaPipe Pose Landmarker (BlazePose, full-precision variant).** Apache 2.0, no licensing fee, richest keypoint set for this use case, and it is the only candidate actually verified end-to-end on this machine this session (below). MoveNet is a reasonable fallback if MediaPipe's CPU latency turns out to be a problem on lower-end devices than this dev machine -- worth a follow-up mobile-device benchmark before final commitment, since everything here was measured on a desktop-class CPU, not a phone.

### MEASURED: MediaPipe Pose Landmarker, CPU, this machine

Script: `scripts/benchmark_mediapipe_pose.py`. Full raw output:
`results/mediapipe_pose_cpu_benchmark.json`. Model: `pose_landmarker_full`
(float16, downloaded from Google's official model CDN, 9.40MB). Images: 4
real photos already in this repo (`testing-assets/{front,side}/*.jpg`),
896x1200, JPEG.

| Image | Landmarks | Avg. visibility | Latency mean | Latency stdev |
|---|---|---|---|---|
| front, male | 33 | 0.983 | 46.1ms | 2.0ms |
| front, female | 33 | 0.966 | 47.3ms | 1.8ms |
| side, male | 33 | 0.816 | 49.0ms | 1.9ms |
| side, female | 33 | 0.775 | 47.9ms | 1.5ms |

Cold-start model init: **4611.6ms** (one-time cost -- this is why the master
prompt's lazy-loading requirement matters: this must happen on scan-start,
never on page load).

**Real finding, not assumed:** side-view visibility (0.78-0.82) is
meaningfully lower than front-view (0.97-0.98) on the exact same subjects.
This validates the legacy tree's `pose_detection.py` view-ratio sanity check
concept (see canonical-architecture-decision.md §3) -- a production pipeline
needs an explicit lower confidence bar or a "hold still, side view is
harder" UX nudge for side captures, not a single uniform threshold.

**Not yet measured:** mobile-device latency (this is a desktop CPU), and
GPU-accelerated latency (MediaPipe's Python Tasks API has no GPU delegate
path on Windows -- confirmed no such option exists in the `PoseLandmarkerOptions`
API surface used above; GPU delegate is an Android/iOS/Linux-specific
MediaPipe feature).

## 2. Depth estimation candidates

| Model | Params | License | Speed (SOURCED) |
|---|---|---|---|
| **Depth Anything V2 - Small (vits)** | 24.8M | Apache 2.0 | 50+ FPS on consumer GPU [(source)](https://arxiv.org/html/2406.09414v1) |
| **Depth Anything V2 - Base/Large/Giant** | 97.5M / 335.3M / 1.3B | **CC-BY-NC-4.0 (non-commercial only)** [(source)](https://github.com/DepthAnything/Depth-Anything-V2) | Large is more accurate, but licensing rules it out for a commercial product |
| **MiDaS v2.1 small** | ~21M | MIT [(source)](https://medium.com/axinc-ai/midas-a-machine-learning-model-for-depth-estimation-e96119cc1a3c) | ~80MB ONNX fp32, ~20x faster than DPT-Large on CPU, "real-time" [(source)](https://medium.com/axinc-ai/midas-a-machine-learning-model-for-depth-estimation-e96119cc1a3c) |

**Recommendation: neither is committed to for V1.** Depth Anything V2 Small
is commercially usable (Apache 2.0) and MiDaS-small is MIT, so licensing
isn't the blocker for the *small* variants -- but per Phase 7/8 of the
product brief, 2D landmarks + monocular depth does not automatically equal a
trustworthy circumference measurement, and no depth model was actually
benchmarked against a real body-measurement ground truth in this session
(see §3, GPU status, for why this wasn't attempted yet). **This lab has not
verified that depth estimation improves measurement accuracy over pure
geometric (ellipse/silhouette) approaches for this use case** -- that
comparison is the actual open question, not "which depth model is fastest,"
and should be run before either model is wired into production.

## 3. GPU status on this machine (RTX 5060, `sm_120`) -- MEASURED

This matters because Phase 4 asks for CPU-vs-GPU numbers, and the honest
answer this session is: **GPU-accelerated ONNX/PyTorch inference does not
work out of the box on this GPU yet**, for reasons independent of CartSync's
code.

- `onnxruntime-gpu==1.28.0` installed cleanly and reports
  `CUDAExecutionProvider` as *available* (i.e. the shared library loads),
  but **actually running inference on it fails**: a minimal real ONNX graph
  (MatMul+ReLU, not a toy no-op) requested with `CUDAExecutionProvider`
  silently fell back to `CPUExecutionProvider` this session. The logged root
  cause: `onnxruntime_providers_cuda.dll` depends on `cublasLt64_13.dll`,
  which requires **CUDA 13.x** runtime libraries specifically (matching this
  machine's driver-reported CUDA 13.2) -- not CUDA 12.x, which is what the
  commonly-referenced `nvidia-cublas-cu12`/`nvidia-cudnn-cu12` pip packages
  provide. `pip index versions nvidia-cublas-cu13` shows only a `0.0.1`
  placeholder release on PyPI as of this session -- the CUDA 13 cuBLAS pip
  wheel ecosystem is not yet properly published, so `pip install
  nvidia-cublas-cu13` will not fix this today.
- **SOURCED**, corroborating: PyTorch's own forums/issue tracker confirm
  stable PyTorch releases don't yet support `sm_120`
  ([pytorch/pytorch#159207](https://github.com/pytorch/pytorch/issues/159207),
  [pytorch/pytorch#164342](https://github.com/pytorch/pytorch/issues/164342)),
  with nightly `cu128`/`cu129` builds as the only current workaround
  ([discuss.pytorch.org](https://discuss.pytorch.org/t/pytorch-support-for-sm-120-nvidia-geforce-rtx-5060/220941)).
- **Fallback behavior verified working**: the app did not crash -- it fell
  back to `CPUExecutionProvider` transparently. Whatever CartSync ships must
  do the same: never assume GPU availability, always have a working CPU path.
- **Not attempted this session** (would require NVIDIA's cuda-toolkit
  installer directly rather than pip packages, a heavier and more invasive
  step than a research spike justifies right now): getting a real CUDA 13
  execution provider working. This is a real open item, not a skipped
  formality -- flagged for a dedicated follow-up if GPU-side depth/SMPL
  benchmarking becomes a priority.

## 4. Bottom line for Phase 9 (VisionProvider implementation)

1. **V1 pose provider: MediaPipe Pose Landmarker (BlazePose, Apache 2.0)**,
   CPU-only, matching what's measured above (~46-49ms/frame on a desktop CPU
   -- expect this to be meaningfully slower on an actual phone browser via
   `@mediapipe/tasks-vision`'s WASM build; that's the next benchmark to run,
   not assumed here).
2. **No depth model is recommended for V1.** Start with the height-based
   calibration + 2D-landmark + ellipse-circumference approach referenced in
   `docs/architecture/canonical-architecture-decision.md` §3, which needs no
   depth model, no GPU, and no non-commercial license. Revisit depth
   (Depth Anything V2 Small, Apache 2.0) only after a real accuracy
   benchmark shows the ellipse-only approach isn't good enough -- per the
   product brief's own instruction not to add mathematical complexity
   without evidence it helps.
3. **YOLO-Pose is disqualified** for a closed-source product under the
   current licensing terms, not for a technical reason.
4. **GPU acceleration is not currently available** on this dev machine for
   ONNX/PyTorch workloads due to `sm_120` support lagging in the CUDA 13
   pip package ecosystem. Budget CPU-only performance for V1 and revisit
   once cu13 wheels mature or a cuda-toolkit-based install is worth the time.
