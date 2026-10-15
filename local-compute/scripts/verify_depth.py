import os
import sys
import numpy as np
from PIL import Image

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from depth.depth_manager import depth_manager
from depth.depth_visualizer import depth_visualizer

def verify_depth_integration():
    print("==================================================")
    print("    CartSyncAI Depth Anything V2 Refinement Test  ")
    print("==================================================")

    # 1. Create a mock standing person silhouette image (512x512)
    print("1. Creating dummy front silhouette target image...")
    w, h = 512, 512
    img_arr = np.zeros((h, w, 3), dtype=np.uint8)
    # Neutral background (light gray)
    img_arr[:, :] = [240, 240, 240]
    # Standing body vertical strip (dark gray)
    cx = w // 2
    for y in range(h):
        hw = int(w * 0.15) if y > int(h * 0.15) else int(w * 0.08)
        img_arr[y, cx - hw : cx + hw] = [50, 50, 50]
        
    original_img = Image.fromarray(img_arr)
    print(" [PASS] Dummy silhouette image created.")

    # 2. First Run: Depth extraction (Cache Miss)
    print("\n2. Running Depth Extraction (First Run)...")
    res1 = depth_manager.process_depth(original_img)
    if res1.get("status") == "SUCCESS":
        meta = res1["metadata"]
        print(f" [PASS] Extraction successful in {meta['inferenceTimeMs']} ms.")
        print(f"   - Hash:      {meta['imageHash']}")
        print(f"   - Cache Hit: {meta['cacheHit']}")
        print(f"   - Avg Depth: {meta['averageDepth']} / Confidence: {meta['confidence']}")
    else:
        print(" [FAIL] First run failed.")
        sys.exit(1)

    # 3. Second Run: Depth extraction (Cache Hit)
    print("\n3. Running Depth Extraction (Second Run - Cache Lookup)...")
    res2 = depth_manager.process_depth(original_img)
    if res2.get("status") == "SUCCESS":
        meta2 = res2["metadata"]
        print(f" [PASS] Extraction successful in {meta2['inferenceTimeMs']} ms.")
        print(f"   - Cache Hit: {meta2['cacheHit']}")
        if meta2["cacheHit"] is True:
            print("   - Success: Depth cache hit confirmed.")
        else:
            print("   - Error: Depth cache hit failed.")
            sys.exit(1)
    else:
        print(" [FAIL] Second run failed.")
        sys.exit(1)

    # 4. Generate Visualization Strip
    print("\n4. Exporting colorized Jet-heatmap strip...")
    try:
        depth_array = np.array(res1["depthMap"], dtype=np.uint8)
        strip = depth_visualizer.generate_visualization_strip(original_img, depth_array)
        
        out_dir = "./depth_output"
        os.makedirs(out_dir, exist_ok=True)
        strip_path = os.path.join(out_dir, "depth_strip.png")
        strip.save(strip_path)
        print(f" [PASS] Saved visualization strip to: {strip_path}")
    except Exception as e:
        print(f" [FAIL] Visualizer crash: {e}")
        sys.exit(1)

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_depth_integration()
