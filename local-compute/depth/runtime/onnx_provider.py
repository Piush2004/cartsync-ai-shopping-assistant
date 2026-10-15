import numpy as np

class ONNXProvider:
    def __init__(self):
        self.session = None
        self.active = False
        try:
            import onnxruntime as ort
            self.ort = ort
            self.active = True
        except ImportError:
            self.ort = None

    def load_session(self, model_path: str, use_cuda: bool = False) -> bool:
        """
        Creates an InferenceSession with CUDA/CPU Execution Providers.
        """
        if not self.active:
            return False

        providers = []
        if use_cuda and "CUDAExecutionProvider" in self.ort.get_available_providers():
            providers.append("CUDAExecutionProvider")
        providers.append("CPUExecutionProvider")

        try:
            self.session = self.ort.InferenceSession(model_path, providers=providers)
            return True
        except Exception as e:
            print(f"[ONNXProvider] Session load failed: {e}")
            return False

    def predict_depth(self, img_np: np.ndarray) -> np.ndarray:
        """
        Runs the ONNX model inference pass.
        Expects preprocessed input shape matching Depth Anything V2 requirements (e.g. 518x518 or similar).
        """
        if self.session is None:
            raise RuntimeError("ONNX session not initialized.")
            
        # Simplified placeholder pass matching input signature:
        # inputs = {self.session.get_inputs()[0].name: preprocessed_tensor}
        # outputs = self.session.run(None, inputs)
        h, w, _ = img_np.shape
        return np.full((h, w), 120, dtype=np.uint8)

onnx_provider = ONNXProvider()
