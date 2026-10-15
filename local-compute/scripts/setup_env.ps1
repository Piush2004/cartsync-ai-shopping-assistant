# CartSyncAI Environment Setup Script (Windows PowerShell)
$ErrorActionPreference = "Stop"

Write-Host "==================================================" -ForegroundColor Green
Write-Host "      CartSyncAI Environment Installation         " -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green

# 1. Verify Python Version
Write-Host "[1/4] Verifying Python 3.11+ Installation..." -ForegroundColor Yellow
try {
    $pythonVer = python --version 2>&1
    Write-Host " - Found Python: $pythonVer"
} catch {
    Write-Error "Python is not installed or not in system PATH. Please install Python 3.11+ from python.org."
}

# 2. Virtual Environment Setup
Write-Host "`n[2/4] Setting up Python Virtual Environment..." -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    Write-Host " - Creating virtual environment 'venv'..."
    python -m venv venv
    Write-Host " - Virtual environment created successfully."
} else {
    Write-Host " - Existing virtual environment 'venv' detected. Skipping creation."
}

# 3. Package Upgrades & PyTorch CUDA Installation
Write-Host "`n[3/4] Installing CUDA-enabled PyTorch & Dependencies..." -ForegroundColor Yellow
# Note: Executing via venv python directly to ensure correct pip target
Write-Host " - Upgrading pip..."
.\venv\Scripts\python.exe -m pip install --upgrade pip

Write-Host " - Installing PyTorch, TorchVision, and TorchAudio (CUDA 12.1 target)..."
.\venv\Scripts\python.exe -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# 4. Install requirements.txt
Write-Host "`n[4/4] Installing remaining framework requirements..." -ForegroundColor Yellow
if (Test-Path "requirements.txt") {
    .\venv\Scripts\python.exe -m pip install -r requirements.txt
} else {
    Write-Warning "requirements.txt not found in current directory."
}

Write-Host "`n==================================================" -ForegroundColor Green
Write-Host " Setup Complete! To run diagnostics, execute:     " -ForegroundColor Green
Write-Host " .\venv\Scripts\python.exe scripts\verify_runtime.py" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Green
