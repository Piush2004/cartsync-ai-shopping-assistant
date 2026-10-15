import os

class ModelLoader:
    def __init__(self, models_dir: str = "./models/depth"):
        self.models_dir = os.path.abspath(models_dir)
        os.makedirs(self.models_dir, exist_ok=True)

    def get_onnx_model_path(self, encoder: str = "vitl") -> str:
        return os.path.join(self.models_dir, f"depth_anything_v2_{encoder}.onnx")

    def get_torch_model_path(self, encoder: str = "vitl") -> str:
        return os.path.join(self.models_dir, f"depth_anything_v2_{encoder}.pth")

    def discover_checkpoints(self) -> dict:
        """
        Scans the depth models folder and returns a list of found ONNX/PyTorch models.
        """
        encoders = ["vits", "vitb", "vitl"]
        discovered = {"onnx": [], "torch": []}
        
        for enc in encoders:
            onnx_p = self.get_onnx_model_path(enc)
            if os.path.exists(onnx_p):
                discovered["onnx"].append(enc)
                
            torch_p = self.get_torch_model_path(enc)
            if os.path.exists(torch_p):
                discovered["torch"].append(enc)
                
        return discovered

model_loader = ModelLoader()
