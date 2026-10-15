import os
import psutil

def get_device():
    """Returns 'cuda' if available and allowed, else 'cpu'"""
    from config.settings import settings
    try:
        import torch
        if settings.runtime.USE_GPU and torch.cuda.is_available():
            return "cuda"
    except ImportError:
        pass
    return "cpu"

def get_gpu_memory():
    """Returns allocated GPU memory in MB if CUDA is used"""
    try:
        import torch
        if torch.cuda.is_available():
            return torch.cuda.memory_allocated() / (1024 * 1024)
    except ImportError:
        pass
    return 0.0

def get_cpu_memory():
    """Returns system memory usage in MB"""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / (1024 * 1024)
