import os
import requests

def run_agent(payload: dict) -> dict:
    """
    Interfaces with the local Ollama instance running Qwen 3 8B.
    """
    ollama_base = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    model_name = os.getenv("MODEL_NAME", "qwen2:8b")
    
    prompt = payload.get("prompt", "")
    system_instruction = payload.get("system", "You are the CartSyncAI Fashion Assistant.")
    
    response = requests.post(f"{ollama_base}/api/chat", json={
        "model": model_name,
        "messages": [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": prompt}
        ],
        "stream": False
    })
    
    if response.status_code == 200:
        data = response.json()
        return {"response": data.get("message", {}).get("content", "")}
    else:
        raise Exception(f"Ollama error: {response.text}")
