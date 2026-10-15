import numpy as np
from PIL import Image
import requests
from io import BytesIO

class ImageValidationService:
    def download_image(self, url: str) -> Image.Image:
        """Downloads an image from a URL or opens it if it is a local path."""
        if url.startswith(('http://', 'https://')):
            try:
                response = requests.get(url, timeout=15)
                response.raise_for_status()
                return Image.open(BytesIO(response.content))
            except Exception as e:
                raise ValueError(f"Failed to download image from {url}: {e}")
        else:
            try:
                return Image.open(url)
            except Exception as e:
                raise ValueError(f"Failed to open local image {url}: {e}")

    def validate(self, image: Image.Image, image_label: str) -> dict:
        """
        Validates resolution, lighting, and sharpness.
        Raises ValueError if validations fail.
        """
        width, height = image.size
        
        # 1. Resolution Check
        if width < 640 or height < 480:
            raise ValueError(f"{image_label} image resolution {width}x{height} is too low. Minimum required is 640x480.")
            
        # Convert to grayscale for quality checks
        gray = image.convert('L')
        img_np = np.array(gray)
        
        # 2. Lighting (Brightness) Check
        mean_brightness = float(np.mean(img_np))
        if mean_brightness < 45.0:
            raise ValueError(f"{image_label} image is too dark (average brightness: {round(mean_brightness, 1)}). Please improve lighting.")
        if mean_brightness > 240.0:
            raise ValueError(f"{image_label} image is overexposed (average brightness: {round(mean_brightness, 1)}). Please reduce lighting.")
            
        # 3. Sharpness (Blur) Check
        # Compute gradient magnitude variance as a sharpness metric
        gx, gy = np.gradient(img_np.astype(float))
        gradient_magnitude = np.sqrt(gx**2 + gy**2)
        sharpness = float(np.var(gradient_magnitude))
        
        if sharpness < 10.0:
            raise ValueError(f"{image_label} image is blurry (sharpness score: {round(sharpness, 2)}). Please stabilize camera and retake.")
            
        return {
            "width": width,
            "height": height,
            "brightness": mean_brightness,
            "sharpness": sharpness
        }

image_validation_service = ImageValidationService()
