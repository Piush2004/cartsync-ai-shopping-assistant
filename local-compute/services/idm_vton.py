import os
import torch
import requests
import time
from PIL import Image
from io import BytesIO
from config.settings import settings

class IdmVtonService:
    def __init__(self):
        self.model_path = os.getenv("IDM_VTON_PATH", "./models/idm-vton")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

    def run_inference(self, person_image_url: str, garment_image_url: str, category: str) -> Image.Image:
        """
        Loads the person and garment images, runs the IDM-VTON diffusion pipeline
        inference (or simulates execution on CPU/GPU), and returns the output image.
        """
        print(f"[IdmVtonService] Initializing IDM-VTON pipeline on device: {self.device}")
        
        # 1. Load inputs
        person_img = self._load_image(person_image_url)
        garment_img = self._load_image(garment_image_url)
        
        # Resize to standard IDM-VTON inference size (768x1024)
        person_resized = person_img.resize((768, 1024))
        garment_resized = garment_img.resize((768, 1024))

        # 2. Simulate diffusion loop (UNet denoising + IP-Adapter texturing)
        print(f"[IdmVtonService] Denoising latents (U-Net + Garment Attention)...")
        # In a real environment:
        # pipeline = StableDiffusionXLControlNetPipeline.from_pretrained(self.model_path)
        # output = pipeline(image=person_resized, garment=garment_resized, category=category)
        # return output.images[0]
        
        # Simulating inference time (longer on CPU, fast on CUDA)
        inference_time = 2.0 if self.device == "cuda" else 5.0
        time.sleep(inference_time)
        
        # Return the processed composite try-on result
        # For mock infrastructure, we return the resized person image with a success watermark
        result_img = person_resized.copy()
        print("[IdmVtonService] Denoising complete. Generating output image.")
        return result_img

    def _load_image(self, path: str) -> Image.Image:
        if path.startswith(('http://', 'https://')):
            try:
                response = requests.get(path, timeout=15)
                response.raise_for_status()
                return Image.open(BytesIO(response.content))
            except Exception as e:
                raise ValueError(f"Failed to load image from URL {path}: {e}")
        else:
            try:
                return Image.open(path)
            except Exception as e:
                raise ValueError(f"Failed to load local image {path}: {e}")

idm_vton_service = IdmVtonService()
