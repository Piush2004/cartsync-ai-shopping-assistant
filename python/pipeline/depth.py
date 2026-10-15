import time
import os
import cv2
import numpy as np
from PIL import Image
from typing import Tuple, Dict, Any

from pipeline.context import PipelineContext
from utils.logger import logger
from utils.gpu import get_device, get_gpu_memory, get_cpu_memory
from utils.firebase import get_bucket
from config.settings import settings
from utils.model_registry import registry

class DepthStage:
    @staticmethod
    def execute(context: PipelineContext) -> None:
        start_time = time.time()
        
        try:
            if not context.pose_errors == []:
                logger.warning("Skipping depth, pose failed", job_id=context.job_id)
                return

            pipe = registry.get_depth_model()
            
            # Process Front
            f_depth_map, f_qual, f_res, f_valid = DepthStage._process_image(
                pipe, context.front_local_path, context.job_id, "front", context
            )
            
            # Process Side
            s_depth_map, s_qual, s_res, s_valid = DepthStage._process_image(
                pipe, context.side_local_path, context.job_id, "side", context
            )
            
            context.front_depth_map = f_depth_map
            context.side_depth_map = s_depth_map
            context.depth_resolution = f_res
            
            context.depth_quality = {
                "front": f_qual,
                "side": s_qual
            }
            
            if not f_valid or not s_valid:
                raise ValueError("Depth map validation failed (NaNs or Invalid range)")
            
            duration = (time.time() - start_time) * 1000
            
            # Metrics
            context.metrics["depthTime"] = duration
            context.depth_metadata = registry.get_depth_metadata()
            context.depth_metadata.update({
                "device": get_device(),
                "gpu_memory_mb": get_gpu_memory(),
                "cpu_memory_mb": get_cpu_memory(),
            })
            
            context.log("depth", duration, "success")
            
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            context.log("depth", duration, "failed", error=str(e))
            raise

    @staticmethod
    def _process_image(pipe, img_path: str, job_id: str, side: str, context: PipelineContext) -> Tuple[np.ndarray, Dict[str, Any], Tuple[int, int], bool]:
        if not os.path.exists(img_path) or "mock_" in img_path:
            return np.zeros((640, 480)), {}, (480, 640), True
            
        image = Image.open(img_path).convert("RGB")
        
        # Inference
        result = pipe(image)
        depth_img = result["depth"]
        depth_array = np.array(depth_img, dtype=np.float32)
        
        # Validation & Quality
        has_nan = np.isnan(depth_array).any()
        nan_percentage = np.isnan(depth_array).sum() / depth_array.size
        is_empty = np.all(depth_array == 0)
        valid = not has_nan and not is_empty
        
        d_min, d_max = depth_array.min(), depth_array.max()
        dynamic_range = (d_max - d_min) / 255.0 if d_max > 0 else 0.0
        
        quality = {
            "nan_percentage": float(nan_percentage),
            "dynamic_range": float(dynamic_range),
            "normalized": True
        }
        
        # Save Artifacts
        DepthStage._save_artifacts(depth_array, depth_img, job_id, side, context)
        
        if settings.runtime.ENV == "development":
            DepthStage._save_debug_image(depth_array, job_id, side)
            
        return depth_array, quality, (depth_array.shape[1], depth_array.shape[0]), valid

    @staticmethod
    def _save_artifacts(depth_array: np.ndarray, depth_img: Image.Image, job_id: str, side: str, context: PipelineContext) -> None:
        # Save PNG
        png_local = context.temp_manager.register_file(f"{side}_depth.png")
        depth_img.save(png_local, format="PNG", optimize=True)
        
        # Save NPY
        npy_local = context.temp_manager.register_file(f"{side}_depth.npy")
        np.save(npy_local, depth_array)
        
        bucket = get_bucket()
        if bucket:
            # Upload PNG
            png_storage = f"users/{context.uid}/measurements/{job_id}/depth/{side}_depth.png"
            bucket.blob(png_storage).upload_from_filename(png_local, content_type="image/png")
            
            # Upload NPY
            npy_storage = f"users/{context.uid}/measurements/{job_id}/depth/{side}_depth.npy"
            bucket.blob(npy_storage).upload_from_filename(npy_local, content_type="application/octet-stream")
            
            if side == "front":
                context.front_depth_png_path = png_storage
                context.front_depth_npy_path = npy_storage
            else:
                context.side_depth_png_path = png_storage
                context.side_depth_npy_path = npy_storage

    @staticmethod
    def _save_debug_image(depth_array: np.ndarray, job_id: str, side: str):
        try:
            debug_dir = f"/tmp/cartsyncai_debug/{job_id}"
            os.makedirs(debug_dir, exist_ok=True)
            
            # Apply color map for visualization
            depth_normalized = cv2.normalize(depth_array, None, 0, 255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
            depth_colored = cv2.applyColorMap(depth_normalized, cv2.COLORMAP_INFERNO)
            
            cv2.imwrite(f"{debug_dir}/{side}_depth_colored.jpg", depth_colored)
        except Exception as e:
            logger.error("Failed to generate debug depth image", error=str(e))
