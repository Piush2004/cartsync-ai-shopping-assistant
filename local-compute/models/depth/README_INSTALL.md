# Depth Anything V2 Model Assets Installation Guide

To deploy production-ready depth estimation checks locally, you must obtain and organize the official checkpoints.

## 1. Download Pretrained Checkpoints
Navigate to the Depth Anything V2 official GitHub/HuggingFace hubs and download the model parameters:

* **Small Encoder (ViT-S):**
  * PyTorch: [depth_anything_v2_vits.pth](https://huggingface.co/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits.pth)
* **Base Encoder (ViT-B):**
  * PyTorch: [depth_anything_v2_vitb.pth](https://huggingface.co/depth-anything/Depth-Anything-V2-Base/resolve/main/depth_anything_v2_vitb.pth)
* **Large Encoder (ViT-L):**
  * PyTorch: [depth_anything_v2_vitl.pth](https://huggingface.co/depth-anything/Depth-Anything-V2-Large/resolve/main/depth_anything_v2_vitl.pth)

## 2. Place Files
Move the files to this folder, matching these exact names:
```
local-compute/
└── models/
    └── depth/
        ├── depth_anything_v2_vits.pth
        ├── depth_anything_v2_vitb.pth
        └── depth_anything_v2_vitl.pth
```

## 3. Verify System Configurations
Run the diagnostics script:
```bash
python models/depth/verify_real_depth.py
```
This script audits weights checksums, verifies CUDA accessibility, runs test image passes, and generates benchmark logs.
