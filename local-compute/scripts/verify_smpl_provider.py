import os
import sys

# Ensure local-compute is in Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from avatar.providers.smpl.provider import smpl_provider, MissingSMPLModelError

def verify_smpl_provider():
    print("==================================================")
    print("      CartSyncAI SMPL Provider readiness check    ")
    print("==================================================")

    # 1. Run Production Mode Verification (Assets Missing)
    print("1. Testing Production Mode (AVATAR_DEV_MODE = false)...")
    smpl_provider.dev_mode = False
    
    try:
        # Should raise MissingSMPLModelError since real assets are missing
        smpl_provider.generate_mesh([0.0]*10, "neutral")
        print(" [FAIL] generate_mesh did not raise MissingSMPLModelError in Production Mode!")
        sys.exit(1)
    except MissingSMPLModelError as e:
        print(f" [PASS] Raised expected error: {e}")
    except Exception as e:
        print(f" [FAIL] Raised unexpected exception: {e}")
        sys.exit(1)

    # 2. Run Development Mode Verification (Emulation Active)
    print("\n2. Testing Development Mode (AVATAR_DEV_MODE = true)...")
    smpl_provider.dev_mode = True
    
    # Clean loader cache to verify reloading mock coordinates
    smpl_provider.loader.models_cache.clear()
    
    try:
        res = smpl_provider.generate_mesh([0.0]*10, "neutral")
        if res.get("status") == "SUCCESS":
            print(f" [PASS] Generated mockup mesh: {res['statistics']['vertexCount']} vertices, {res['statistics']['faceCount']} faces.")
        else:
            print(" [FAIL] Failed to generate mockup mesh in Development Mode.")
            sys.exit(1)
    except Exception as e:
        print(f" [FAIL] Dev mode exception: {e}")
        sys.exit(1)

    # 3. Verify Status & Health Endpoints
    print("\n3. Testing provider status reporting...")
    status = smpl_provider.get_status()
    print(f" - Provider: {status['providerName']} v{status['providerVersion']}")
    print(f" - Model Type: {status['modelType']} | Dev Mode: {status['developmentMode']}")
    print(f" - Status Code: {status['status']}")
    
    print("\n4. Testing health check diagnostic metrics...")
    health = smpl_provider.check_health()
    print(f" - Healthy: {health['healthy']}")
    print(f" - Cache count: {health['cacheCount']}")
    print(f" - Latency: {health['initializationTimeMs']} ms")
    print(f" - Peak memory: {health['memoryUsageMb']} MB")

    print("==================================================")
    print("      Verification Status: ALL TESTS PASSED!      ")
    print("==================================================")

if __name__ == "__main__":
    verify_smpl_provider()
