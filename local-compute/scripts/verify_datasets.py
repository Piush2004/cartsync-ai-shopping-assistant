import os
import sys
import numpy as np
from PIL import Image

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datasets.benchmark_manager import benchmark_manager

def verify_dataset_pipeline():
    print("==================================================")
    print("     CartSyncAI Dataset & Benchmark Test          ")
    print("==================================================")

    # Reset registry database before running test to ensure clean runs
    benchmark_manager.registry.subjects.clear()
    if os.path.exists(benchmark_manager.registry.registry_path):
        os.remove(benchmark_manager.registry.registry_path)

    import shutil
    if os.path.exists(benchmark_manager.data_dir):
        shutil.rmtree(benchmark_manager.data_dir)
    os.makedirs(benchmark_manager.data_dir, exist_ok=True)

    def generate_image(path, color, width=640):
        img = Image.new("RGB", (width, 480), color=color)
        img.save(path)

    # 2. Import Subjects
    print("\n2. Importing benchmark subject profiles...")
    
    # Subject 1
    f1 = "./f1.jpg"
    s1_img = "./s1.jpg"
    generate_image(f1, (150, 150, 150), width=640)
    generate_image(s1_img, (150, 150, 151), width=641)
    s1 = benchmark_manager.import_subject(
        subject_id="subject_001_male",
        front_path=f1,
        side_path=s1_img,
        shoulder=44, chest=100, waist=82, hips=96, inseam=80, sleeve=60, neck=38,
        height=178.0, gender="male"
    )
    
    # Subject 2
    f2 = "./f2.jpg"
    s2_img = "./s2.jpg"
    generate_image(f2, (151, 150, 150), width=642)
    generate_image(s2_img, (151, 150, 151), width=643)
    s2 = benchmark_manager.import_subject(
        subject_id="subject_002_female",
        front_path=f2,
        side_path=s2_img,
        shoulder=38, chest=86, waist=64, hips=90, inseam=72, sleeve=54, neck=32,
        height=162.0, gender="female"
    )

    # Subject 3
    f3 = "./f3.jpg"
    s3_img = "./s3.jpg"
    generate_image(f3, (152, 150, 150), width=644)
    generate_image(s3_img, (152, 150, 151), width=645)
    s3 = benchmark_manager.import_subject(
        subject_id="subject_003_male_large",
        front_path=f3,
        side_path=s3_img,
        shoulder=47, chest=112, waist=98, hips=104, inseam=82, sleeve=62, neck=42,
        height=182.0, gender="male"
    )

    for i, s in enumerate([s1, s2, s3]):
        if s.get("status") == "SUCCESS":
            print(f" [PASS] Subject {i+1} imported successfully: {s['subject']['subjectId']}")
        else:
            print(f" [FAIL] Failed to import subject {i+1}: {s.get('errors')}")
            sys.exit(1)

    # 3. Process Splits and Benchmark pipeline
    print("\n3. Processing Splits & Benchmark Pipeline...")
    res = benchmark_manager.process_benchmark_pipeline()
    
    if res.get("status") == "SUCCESS":
        splits = res["splits"]
        stats = res["statistics"]
        print(f" [PASS] Benchmark statistics compiled successfully.")
        print(f"   - Split results: Train: {len(splits['train'])} | Val: {len(splits['validation'])} | Test: {len(splits['test'])}")
        print(f"   - Mean Height:  {stats['heightStats']['mean']} cm (Std Dev: {stats['heightStats']['std']})")
        print(f"   - Gender Distribution: {stats['genderDistribution']}")
    else:
        print(" [FAIL] Benchmark manager pipeline execution returned failure status.")
        sys.exit(1)

    # 4. Check file exports
    print("\n4. Checking exported assets...")
    expected_files = [
        "./datasets/repository/splits.json",
        "./datasets/repository/benchmark_summary.json",
        "./datasets/repository/benchmark_summary.md"
    ]
    for f in expected_files:
        if os.path.exists(f) and os.path.getsize(f) > 0:
            print(f"   - [PASS] Found non-empty asset: {f}")
        else:
            print(f"   - [FAIL] Missing or empty asset: {f}")
            sys.exit(1)

    # Cleanup temp placeholder images
    for p in [f1, s1_img, f2, s2_img, f3, s3_img]:
        if os.path.exists(p):
            os.remove(p)

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_dataset_pipeline()
