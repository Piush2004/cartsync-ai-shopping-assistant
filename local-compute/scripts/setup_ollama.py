import subprocess
import json
import urllib.request
import urllib.error
import sys

OLLAMA_URL = "http://localhost:11434"

MODELS_TO_INSTALL = [
    {
        "name": "qwen3:8b",
        "fallback": "qwen2.5:7b",
        "purpose": "Primary Supervisor Agent",
        "size_est": "4.7 GB"
    },
    {
        "name": "qwen3:4b",
        "fallback": "qwen2.5:3b",
        "purpose": "Fast Sizing Classifier",
        "size_est": "1.9 GB"
    },
    {
        "name": "qwen2.5-coder:7b",
        "fallback": "qwen2.5-coder:7b",
        "purpose": "Development & Automation",
        "size_est": "4.7 GB"
    },
    {
        "name": "nomic-embed-text",
        "fallback": "nomic-embed-text",
        "purpose": "Semantic Text Search",
        "size_est": "274 MB"
    },
    {
        "name": "llama3.1:8b",
        "fallback": "llama3.1:8b",
        "purpose": "Secondary Supervisor",
        "size_est": "4.7 GB"
    },
    {
        "name": "llava:7b",
        "fallback": "llava:7b",
        "purpose": "Vision Model (Image Understanding)",
        "size_est": "4.7 GB"
    }
]

def verify_ollama_running():
    print("Checking if Ollama service is running...")
    try:
        req = urllib.request.Request(f"{OLLAMA_URL}/api/tags")
        with urllib.request.urlopen(req, timeout=3) as r:
            if r.status == 200:
                print(" - Success: Ollama service is active and responding.")
                return True
    except Exception as e:
        print(f" - Error: Ollama service is not responding at {OLLAMA_URL}.")
        print("   Please start Ollama in your system tray or run the Ollama app.")
        return False
    return False

def get_installed_models():
    try:
        req = urllib.request.Request(f"{OLLAMA_URL}/api/tags")
        with urllib.request.urlopen(req, timeout=3) as r:
            data = json.loads(r.read().decode('utf-8'))
            return [m['name'] for m in data.get('models', [])]
    except Exception:
        return []

def pull_model(model_name: str) -> bool:
    print(f"\nPulling Ollama model: '{model_name}'...")
    try:
        # Run ollama pull command synchronously
        process = subprocess.Popen(["ollama", "pull", model_name], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        for line in process.stdout:
            sys.stdout.write(line)
            sys.stdout.flush()
        process.wait()
        return process.returncode == 0
    except Exception as e:
        print(f" - Error running 'ollama pull': {e}")
        return False

def setup_environment():
    if not verify_ollama_running():
        sys.exit(1)
        
    installed = get_installed_models()
    print(f"Currently installed models: {installed}")
    
    for item in MODELS_TO_INSTALL:
        target = item["name"]
        fallback = item["fallback"]
        purpose = item["purpose"]
        size = item["size_est"]
        
        # Check if target or fallback is already present
        already_has = False
        active_model = target
        
        for inst in installed:
            if inst.startswith(target) or inst.startswith(fallback):
                already_has = True
                active_model = inst
                break
                
        if already_has:
            print(f" -> Model '{active_model}' is already installed ({purpose}). Skipping.")
            continue
            
        print(f"\nMissing model: '{target}' ({purpose})")
        print(f" -> Estimated download size: {size}")
        
        success = pull_model(target)
        if not success:
            print(f" -> Target '{target}' failed or not found in registry. Attempting fallback '{fallback}'...")
            success = pull_model(fallback)
            
        if success:
            print(f" -> Successfully installed '{fallback}'!")
        else:
            print(f" -> Critical Error: Failed to pull both '{target}' and '{fallback}'.")

    # Final Verification
    print("\n--- Final Verification ---")
    final_installed = get_installed_models()
    all_ok = True
    for item in MODELS_TO_INSTALL:
        target = item["name"]
        fallback = item["fallback"]
        found = False
        for inst in final_installed:
            if inst.startswith(target) or inst.startswith(fallback):
                found = True
                print(f" [PASS] Model reference for '{target}' is satisfied by '{inst}'")
                break
        if not found:
            print(f" [FAIL] Model reference for '{target}' is MISSING.")
            all_ok = False
            
    if all_ok:
        print("\nAll required LLM models successfully verified and ready for CartSyncAI!")
    else:
        print("\nWarning: Some model targets are incomplete. Please check connection.")

if __name__ == "__main__":
    setup_environment()
