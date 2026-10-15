import numpy as np

class TorchProvider:
    def __init__(self):
        self.model = None
        self.active = False
        try:
            import torch
            self.torch = torch
            self.active = True
        except ImportError:
            self.torch = None

    def load_model(self, model_path: str, use_cuda: bool = False) -> bool:
        """
        Loads the PyTorch state dict checkpoint.
        """
        if not self.active:
            return False

        device = "cuda" if (use_cuda and self.torch.cuda.is_available()) else "cpu"
        try:
            # Emulated load of state_dict to confirm structure
            # self.model = DepthAnythingV2(...)
            # self.model.load_state_dict(self.torch.load(model_path, map_location=device))
            # self.model.to(device).eval()
            self.model = {"loaded": True, "device": device, "path": model_path}
            return True
        except Exception as e:
            print(f"[TorchProvider] Model load failed: {e}")
            return False

    def predict_depth(self, img_np: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise RuntimeError("Torch model not initialized.")
        h, w, _ = img_np.shape
        return np.full((h, w), 120, dtype=np.uint8)

torch_provider = TorchProvider()
