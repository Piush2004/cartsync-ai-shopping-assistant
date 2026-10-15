from typing import Dict, Any, Optional
from utils.logger import logger
from utils.temp_files import TemporaryFileManager

class PipelineContext:
    def __init__(self, job_id: str, uid: str, height_cm: float, front_storage_path: str, side_storage_path: str, metadata: Optional[Dict[str, Any]] = None):
        self.job_id = job_id
        self.uid = uid
        self.height_cm = height_cm
        self.front_storage_path = front_storage_path
        self.side_storage_path = side_storage_path
        self.metadata = metadata or {}
        
        self.temp_manager = TemporaryFileManager(prefix=f"job_{job_id}_")
        self.working_directory = self.temp_manager.temp_dir
        
        # Extracted paths (to be set by download stage)
        self.front_local_path: Optional[str] = None
        self.side_local_path: Optional[str] = None
        
        # Outputs
        self.front_landmarks: Optional[List[Dict[str, Any]]] = None
        self.side_landmarks: Optional[List[Dict[str, Any]]] = None
        self.front_world_landmarks: Optional[List[Dict[str, Any]]] = None
        self.side_world_landmarks: Optional[List[Dict[str, Any]]] = None
        
        self.pose_score: float = 0.0
        self.pose_confidence: float = 0.0
        self.pose_errors: List[str] = []
        
        # Depth Outputs
        self.front_depth_map: Optional[Any] = None # numpy array
        self.side_depth_map: Optional[Any] = None
        self.depth_resolution: Optional[Tuple[int, int]] = None
        self.depth_quality: Dict[str, Any] = {}
        self.depth_metadata: Dict[str, Any] = {}
        
        self.front_depth_png_path: Optional[str] = None
        self.front_depth_npy_path: Optional[str] = None
        self.side_depth_png_path: Optional[str] = None
        self.side_depth_npy_path: Optional[str] = None
        
        # Calibration Outputs (Phase 4.4A)
        self.body_axis: Dict[str, Any] = {}
        self.body_rotation: float = 0.0
        self.body_tilt: float = 0.0
        self.pixel_height: float = 0.0
        self.depth_scale: float = 0.0
        self.scale_factor: float = 0.0
        self.metric_landmarks: Dict[str, List[Dict[str, Any]]] = {} # front/side
        self.calibration: Dict[str, Any] = {}
        self.calibration_quality: Dict[str, Any] = {}
        self.calibration_warnings: List[str] = []
        
        # Skeleton Refinement Outputs (Phase 4.4B)
        self.refined_skeleton: Dict[str, List[Dict[str, Any]]] = {}
        self.refinement_warnings: List[str] = []
        
        # Quality Assessment Outputs (Phase 4.4C)
        self.quality_assessment: Dict[str, Any] = {}
        
        # Measurement Outputs (Phase 4.4D)
        self.measurements: Optional[Dict[str, float]] = None
        
        # Evaluation Engine Outputs (Phase 5.1)
        self.ground_truth: Optional[Dict[str, float]] = None
        self.evaluation_results: Optional[Dict[str, Any]] = None
        self.dataset_metadata: Optional[Dict[str, str]] = None
        
        # Size Recommendation Engine (Phase 5.3 & 5.4)
        self.fit_preference: str = "regular" # slim, regular, oversized
        self.size_recommendations: Optional[Dict[str, Any]] = None
        
        # Metrics tracking
        self.metrics: Dict[str, float] = {}

    def log(self, stage: str, duration_ms: float, status: str, **kwargs) -> None:
        """Centralized structured logger following the exact requested schema"""
        log_payload = {
            "job": self.job_id,
            "stage": stage,
            "duration": duration_ms,
            "status": status
        }
        log_payload.update(kwargs)
        
        if status == "success":
            logger.info("Pipeline Step", **log_payload)
        else:
            logger.error("Pipeline Step", **log_payload)

    def cleanup(self) -> None:
        self.temp_manager.cleanup()
