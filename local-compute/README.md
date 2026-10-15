# CartSyncAI Local AI Model Setup Guide

This guide details the local LLM environment configurations for CartSyncAI on Windows using Ollama.

---

## 1. System Requirements & Hardware Target
* **OS:** Windows 10/11
* **GPU:** NVIDIA GeForce RTX 5060 (8GB VRAM)
* **System RAM:** 24GB RAM
* **Disk Space:** ~20 GB free space (SSD recommended)

---

## 2. Ollama Installation & Verification
1. Download and run the official Windows installer from: [Ollama Releases](https://ollama.com/download/windows)
2. Open your terminal (PowerShell or Command Prompt) and run the command to verify it is running:
   ```bash
   ollama --version
   ```

---

## 3. Python Virtual Environment Setup (Step 1)
To isolate dependencies, initialize and activate a Python virtual environment:
```powershell
# Create virtual environment
python -m venv venv

# Activate on Windows (PowerShell)
.\venv\Scripts\Activate.ps1
```

---

## 4. Automated Environment Setup & Dependency Installer (Step 2)
Run the PowerShell setup script to configure dependencies and install the CUDA-supported PyTorch runtime:
```powershell
# Run installation script
.\scripts\setup_env.ps1
```

---

## 5. Model Setup Check
We provide an automated setup script to check, pull, and verify all Ollama LLMs:
```bash
python scripts/setup_ollama.py
```
This script will:
* Verify Ollama service connectivity.
* Check if models exist in the local catalog.
* Download missing models with automatic Qwen2.5 fallbacks if needed.
* Verify final layout status.

---

## 4. Run-Time Model Mappings
The Local Compute Runtime uses environment variables to map logical model names rather than hardcoding targets. The configurations are loaded in `config/settings.py` and can be set in your `.env` file:

```bash
# Model Configurations (.env)
SUPERVISOR_MODEL=qwen3:8b
FAST_MODEL=qwen3:4b
CODER_MODEL=qwen2.5-coder:7b
EMBEDDING_MODEL=nomic-embed-text
LLAMA_MODEL=llama3.1:8b
```
If these models are not found, the runtime will fall back to their closest corresponding counterparts (`qwen2.5:7b` and `qwen2.5:3b`) mapped by the installer.
