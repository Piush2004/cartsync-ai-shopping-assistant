import time
from PIL import Image
from utils.firebase import get_bucket
from pipeline.context import PipelineContext

class ImageDownloadStage:
    @staticmethod
    def execute(context: PipelineContext) -> None:
        start_time = time.time()
        bucket = get_bucket()
        
        try:
            if not bucket:
                # Mock Mode
                context.front_local_path = context.temp_manager.register_file("mock_front.jpg")
                context.side_local_path = context.temp_manager.register_file("mock_side.jpg")
                
                # Create dummy files
                with open(context.front_local_path, 'w') as f: f.write("mock")
                with open(context.side_local_path, 'w') as f: f.write("mock")
            else:
                for path, side in [(context.front_storage_path, "front"), (context.side_storage_path, "side")]:
                    blob = bucket.blob(path)
                    if not blob.exists():
                        raise FileNotFoundError(f"Image not found at {path}")

                    local_path = context.temp_manager.register_file(f"{side}.jpg")
                    blob.download_to_filename(local_path)
                    
                    # Validation
                    with Image.open(local_path) as img:
                        if img.mode != 'RGB':
                            img = img.convert('RGB')
                            img.save(local_path)
                        
                        width, height = img.size
                        if width < 480 or height < 640:
                            raise ValueError(f"Resolution too low: {width}x{height}")
                    
                    if side == "front":
                        context.front_local_path = local_path
                    else:
                        context.side_local_path = local_path
            
            duration = (time.time() - start_time) * 1000
            context.metrics["downloadTime"] = duration
            context.log("download", duration, "success")
            
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            context.log("download", duration, "failed", error=str(e))
            raise
