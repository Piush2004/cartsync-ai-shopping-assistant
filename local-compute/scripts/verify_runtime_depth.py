import os
import sys
from PIL import Image

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from depth.runtime.depth_runtime import depth_runtime

def verify_depth_runtime():
    print("==================================================")
    print("     CartSyncAI Depth V2 Runtime Integration      ")
    print("==================================================")

    img = Image.new("RGB", (640, 480), color=(120, 120, 120))

    # Test 1: Development Mode (emulation fallback enabled)
    print("1. Testing Development Mode execution...")
    os.environ["DEPTH_DEV_MODE"] = "true"
    
    try:
        res = depth_runtime.compute_depth(img)
        print(" [PASS] Development mode completed successfully.")
        print(f"   - Backend:       {res['backendUsed']}")
        print(f"   - Device:        {res['device']}")
        print(f"   - Model Version: {res['modelVersion']}")
        print(f"   - Memory footprint: {res['memoryUsageMb']} MB")
        print(f"   - Inference draw time: {res['inferenceTimeMs']} ms")
    except Exception as e:
        print(f" [FAIL] Dev mode execution failed: {e}")
        sys.exit(1)

    # Test 2: Production Mode (strict file checks enabled)
    print("\n2. Testing Production Mode weight checks...")
    os.environ["DEPTH_DEV_MODE"] = "false"
    
    try:
        depth_runtime.compute_depth(img)
        print(" [PASS] Production mode mesh generated (official weight files found).")
    except FileNotFoundError as e:
        print(f" [PASS] Production mode correctly blocked execution and raised: {e}")
    except Exception as e:
        print(f" [FAIL] Production mode raised unexpected error: {e}")
        sys.exit(1)

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_depth_runtime()
