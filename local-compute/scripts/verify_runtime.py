import sys
import os
import shutil

def run_diagnostics():
    print("==================================================")
    print("      CartSyncAI Runtime Diagnostic Utility       ")
    print("==================================================")
    
    # 1. Python Environment Checks
    print(f"Python Version: {sys.version}")
    print(f"Exec Path: {sys.executable}")
    
    # 2. PyTorch & CUDA Verification
    print("\n[1/3] Verifying PyTorch & CUDA Support...")
    try:
        import torch
        print(f" - PyTorch Version: {torch.__version__}")
        cuda_avail = torch.cuda.is_available()
        print(f" - CUDA Availability: {'PASS' if cuda_avail else 'FAIL'}")
        if cuda_avail:
            print(f" - PyTorch CUDA build: {torch.version.cuda}")
            gpu_name = torch.cuda.get_device_name(0)
            print(f" - GPU Model: {gpu_name}")
            total_memory = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
            print(f" - Dedicated VRAM: {round(total_memory, 2)} GB")
            if total_memory >= 7.5:
                print("   - VRAM Status: PASS (RTX 5060 8GB satisfies requirements)")
            else:
                print("   - VRAM Warning: Under 8GB threshold. Mixed-precision models recommended.")
        else:
            print(" - Warning: PyTorch is running in CPU-only mode. GPU acceleration unavailable.")
    except ImportError:
        print(" - PyTorch Import: FAIL (package not installed)")
        
    # 3. AI Framework Imports
    print("\n[2/3] Checking AI Framework Modules...")
    frameworks = {
        "mediapipe": "MediaPipe (Pose Tracking)",
        "cv2": "OpenCV (Image Operations)",
        "transformers": "Transformers (LLM Models)",
        "diffusers": "Diffusers (VTON Diffusion)",
        "accelerate": "Accelerate (GPU Optimization)",
        "safetensors": "Safetensors (Secure Weights)",
        "onnxruntime": "ONNX Runtime (Execution Engine)"
    }
    
    for module_name, desc in frameworks.items():
        try:
            mod = __import__(module_name)
            ver = getattr(mod, "__version__", "unknown")
            print(f" - {desc}: PASS (Version: {ver})")
        except ImportError:
            print(f" - {desc}: FAIL (Import Error)")
            
    # 4. Storage Space Verification
    print("\n[3/3] Verifying Storage Allocations...")
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        total, used, free = shutil.disk_usage(base_dir)
        free_gb = free / (1024 ** 3)
        print(f" - Target Drive: {os.path.splitdrive(base_dir)[0]}\\")
        print(f" - Available Space: {round(free_gb, 1)} GB")
        if free_gb >= 25.0:
            print("   - Disk Space: PASS (Sufficient for models storage cache)")
        else:
            print("   - Disk Space Warning: Under 25GB. Low disk space might cause model download failures.")
    except Exception as e:
        print(f" - Storage Check failed: {e}")
        
    print("==================================================")

if __name__ == "__main__":
    run_diagnostics()
