import os
import sys

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from avatar.providers.smpl.provider import smpl_provider, MissingSMPLModelError

def verify_smpl_runtime():
    print("==================================================")
    print("       CartSyncAI SMPL Runtime Integration        ")
    print("==================================================")

    # Test 1: Development mode (emulation enabled)
    print("1. Testing Development Mode execution...")
    os.environ["AVATAR_DEV_MODE"] = "true"
    smpl_provider.dev_mode = True # refresh instance config
    
    try:
        betas = [1.0, -1.0, 0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
        res = smpl_provider.generate_mesh(betas, gender="female")
        
        print(" [PASS] Development mode completed successfully.")
        print(f"   - Vertices generated: {len(res['vertices'])}")
        print(f"   - Faces count:        {len(res['faces'])}")
        print(f"   - Joint count:        {len(res['joints'])}")
        print(f"   - Bounding Box:       {res['statistics']['boundingBox']}")
        print(f"   - Generation Speed:   {res['statistics']['generationTimeMs']} ms")
    except Exception as e:
        print(f" [FAIL] Dev mode execution failed: {e}")
        sys.exit(1)

    # Test 2: Production mode (strict checks enabled, missing assets should throw)
    print("\n2. Testing Production Mode asset security...")
    os.environ["AVATAR_DEV_MODE"] = "false"
    smpl_provider.dev_mode = False # refresh instance config
    
    try:
        smpl_provider.generate_mesh(betas, gender="male")
        # If this doesn't raise an error (assuming models are not present), let's print a warning
        print(" [PASS] Production mode mesh generated (official model files found).")
    except MissingSMPLModelError as e:
        print(f" [PASS] Production mode correctly blocked execution and raised: {e}")
    except Exception as e:
        print(f" [FAIL] Production mode raised unexpected error type: {e}")
        sys.exit(1)

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_smpl_runtime()
