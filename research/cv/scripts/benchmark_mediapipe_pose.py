"""
Real (not simulated) latency benchmark for MediaPipe's Pose Landmarker
running on this machine's CPU, against actual repository test images.

Downloads the official model file from Google's public model CDN on first
run (cached under research/cv/models/ afterward -- never re-downloaded).
Every number this script prints is a wall-clock measurement; nothing here is
estimated, assumed, or copied from documentation.
"""
import statistics
import sys
import time
import urllib.request
from pathlib import Path

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

REPO_ROOT = Path(__file__).resolve().parents[3]
MODELS_DIR = Path(__file__).resolve().parents[1] / "models"
MODEL_PATH = MODELS_DIR / "pose_landmarker_full.task"
MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/"
    "pose_landmarker_full/float16/1/pose_landmarker_full.task"
)

TEST_IMAGES = [
    REPO_ROOT / "testing-assets" / "front" / "male_001_front.jpg",
    REPO_ROOT / "testing-assets" / "front" / "female_001_front.jpg",
    REPO_ROOT / "testing-assets" / "side" / "male_001_side.jpg",
    REPO_ROOT / "testing-assets" / "side" / "female_001_side.jpg",
]


def ensure_model():
    if MODEL_PATH.exists():
        print(f"Using cached model: {MODEL_PATH} ({MODEL_PATH.stat().st_size / 1e6:.2f} MB)")
        return
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Downloading {MODEL_URL} -> {MODEL_PATH}")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print(f"Downloaded: {MODEL_PATH.stat().st_size / 1e6:.2f} MB")


def run_benchmark():
    ensure_model()

    base_options = mp_python.BaseOptions(model_asset_path=str(MODEL_PATH))
    options = vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=vision.RunningMode.IMAGE,
        num_poses=1,
        min_pose_detection_confidence=0.5,
        min_pose_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )

    print("\n--- Model init latency (cold start, includes graph build) ---")
    t0 = time.perf_counter()
    landmarker = vision.PoseLandmarker.create_from_options(options)
    init_ms = (time.perf_counter() - t0) * 1000
    print(f"PoseLandmarker.create_from_options: {init_ms:.1f} ms")

    results = []
    for img_path in TEST_IMAGES:
        if not img_path.exists():
            print(f"SKIP (not found): {img_path}")
            continue

        bgr = cv2.imread(str(img_path))
        if bgr is None:
            print(f"SKIP (failed to decode): {img_path}")
            continue
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

        # Discard the first inference on this image (cache/allocator warmup),
        # then take 10 timed repeats -- report all of them, not just the best.
        landmarker.detect(mp_image)

        latencies_ms = []
        for _ in range(10):
            t0 = time.perf_counter()
            result = landmarker.detect(mp_image)
            latencies_ms.append((time.perf_counter() - t0) * 1000)

        num_landmarks = len(result.pose_landmarks[0]) if result.pose_landmarks else 0
        avg_visibility = (
            statistics.mean(lm.visibility for lm in result.pose_landmarks[0])
            if result.pose_landmarks else 0.0
        )

        entry = {
            "image": str(img_path.relative_to(REPO_ROOT)),
            "resolution": f"{bgr.shape[1]}x{bgr.shape[0]}",
            "landmarks_detected": num_landmarks,
            "avg_landmark_visibility": round(avg_visibility, 4),
            "latency_ms_mean": round(statistics.mean(latencies_ms), 2),
            "latency_ms_median": round(statistics.median(latencies_ms), 2),
            "latency_ms_min": round(min(latencies_ms), 2),
            "latency_ms_max": round(max(latencies_ms), 2),
            "latency_ms_stdev": round(statistics.stdev(latencies_ms), 2),
            "raw_samples_ms": [round(x, 2) for x in latencies_ms],
        }
        results.append(entry)
        print(f"\n{entry['image']} ({entry['resolution']}):")
        print(f"  landmarks_detected={entry['landmarks_detected']}  avg_visibility={entry['avg_landmark_visibility']}")
        print(f"  latency mean={entry['latency_ms_mean']}ms median={entry['latency_ms_median']}ms "
              f"min={entry['latency_ms_min']}ms max={entry['latency_ms_max']}ms stdev={entry['latency_ms_stdev']}ms")

    landmarker.close()
    return {"init_ms": round(init_ms, 1), "per_image": results}


if __name__ == "__main__":
    import json
    import platform

    summary = run_benchmark()
    summary["environment"] = {
        "platform": platform.platform(),
        "python_version": platform.python_version(),
        "cv2_version": cv2.__version__,
        "mediapipe_version": getattr(mp, "__version__", "unknown"),
        "execution_provider": "CPU (mediapipe Python Tasks API has no GPU delegate on Windows)",
    }

    out_path = Path(__file__).resolve().parents[1] / "results" / "mediapipe_pose_cpu_benchmark.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(summary, indent=2))
    print(f"\nResults written to {out_path}")
