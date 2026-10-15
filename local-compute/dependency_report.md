# CartSyncAI Dependency & Compatibility Report

This document records the installation settings, hardware compatibilities, and memory requirements of the CartSyncAI Local Compute Node.

---

## 1. System Hardware Target
* **Graphics Processor:** NVIDIA GeForce RTX 5060 Laptop/Desktop GPU
* **VRAM Limits:** 8.0 GB Dedicated VRAM
* **System memory:** 24.0 GB System RAM
* **Instruction Set:** CUDA Compute Capability 8.9+ (Ada Lovelace Architecture)

---

## 2. Core Dependencies & Versions

| Package Name | Minimum Version | Target CUDA Compatibility | Role within CartSyncAI |
| :--- | :---: | :---: | :--- |
| **`torch`** (PyTorch) | `2.1.0` | CUDA 12.1 / cu121 | Deep learning core tensor runtime |
| **`torchvision`** | `0.16.0` | CUDA 12.1 / cu121 | Image tensor scaling and transforms |
| **`mediapipe`** | `0.10.8` | CPU / GPU boundary | 2D body landmark coordinate mapping |
| **`opencv-python`** | `4.8.0` | CPU boundary | Blur detection and image conversions |
| **`transformers`** | `4.35.0` | CUDA 12.1 / fp16 | Local LLM / Ollama connection handlers |
| **`diffusers`** | `0.22.0` | CUDA 12.1 / fp16 / xFormers | Try-on diffusion model runs |
| **`accelerate`** | `0.24.0` | CUDA 12.1 | Multi-GPU and memory-efficient loadings |
| **`xformers`** | `0.0.22` | CUDA 12.1 | Attention optimization for diffusion |
| **`safetensors`** | `0.4.0` | N/A | Secure model weight serialization |
| **`onnxruntime`** | `1.16.0` | Optional CUDA execution | Optimized pose landmark sub-inferences |

---

## 3. Estimated Run-Time Memory Allocations

| Operational Pipeline | Expected VRAM | Expected System RAM | Model Offloading Strategy |
| :--- | :---: | :---: | :--- |
| **Pose Calibration (MediaPipe)** | ~0.5 GB | ~1.2 GB | Runs in shared GPU memory space |
| **LLM Inference (`qwen3:8b`)** | ~5.8 GB | ~8.0 GB | Loaded into GPU via Ollama; offloaded when idle |
| **Virtual Try-On (VTON)** | ~6.5 GB | ~12.0 GB | Uses FP16 precision, xFormers attention, and CPU offloads |

---

## 4. CUDA & GPU Compatibility Diagnostics
* **Hardware Acceleration:** RTX 5060 Laptop/Desktop GPUs fully support CUDA 12.1 and Torch 2.1+ compute kernels.
* **Mixed Precision:** Uses FP16 (`torch.float16`) to guarantee that try-on diffusion operations run within the 8GB VRAM ceiling without memory leakage.
