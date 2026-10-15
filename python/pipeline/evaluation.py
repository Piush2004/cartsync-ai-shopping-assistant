import time
import numpy as np
from typing import Dict, Any, Optional

from pipeline.context import PipelineContext
from utils.logger import logger

class EvaluationStage:
    @staticmethod
    def execute(context: PipelineContext) -> None:
        start_time = time.time()
        
        try:
            if not context.measurements or not context.ground_truth:
                logger.info("EvaluationStage skipped, missing measurements or ground truth.", job_id=context.job_id)
                return
                
            predicted = context.measurements
            ground_truth = context.ground_truth
            
            evaluation = {}
            errors = []
            category_errors = {}
            
            for key, pred_data in predicted.items():
                if key in ground_truth:
                    pred_val = pred_data.get("value")
                    if pred_val is None:
                        continue
                        
                    gt_val = ground_truth[key]
                    error = abs(pred_val - gt_val)
                    pct_error = (error / gt_val) * 100 if gt_val > 0 else 0
                    
                    cat = pred_data.get("category", "unknown")
                    
                    evaluation[key] = {
                        "predicted": pred_val,
                        "groundTruth": gt_val,
                        "error": round(error, 2),
                        "percentageError": round(pct_error, 2),
                        "category": cat
                    }
                    errors.append(error)
                    if cat not in category_errors:
                        category_errors[cat] = []
                    category_errors[cat].append(error)
                    
            if errors:
                mae = float(np.mean(errors))
                rmse = float(np.sqrt(np.mean(np.square(errors))))
                
                cat_metrics = {}
                for c, errs in category_errors.items():
                    cat_metrics[c] = {
                        "MAE": round(float(np.mean(errs)), 2),
                        "RMSE": round(float(np.sqrt(np.mean(np.square(errs)))), 2)
                    }
                
                context.evaluation_results = {
                    "itemized": evaluation,
                    "metrics": {
                        "global": {
                            "MAE": round(mae, 2),
                            "RMSE": round(rmse, 2)
                        },
                        "categorical": cat_metrics
                    },
                    "dataset": context.dataset_metadata or {
                        "name": "CartSync Validation Set",
                        "version": "v1.0",
                        "samples": 1 # for this single job
                    },
                    "models": {
                        "pose": "MediaPipe Pose Heavy",
                        "depth": "Depth Anything V2 ViT-S",
                        "anthropometry": "1.0.1",
                        "measurementEngine": "4.4E"
                    }
                }

            duration = (time.time() - start_time) * 1000
            context.metrics["evaluationTime"] = duration
            context.log("evaluation", duration, "success")

        except Exception as e:
            duration = (time.time() - start_time) * 1000
            context.log("evaluation", duration, "failed", error=str(e))
            raise
