import os
import glob
import yaml
import time
from typing import Dict, Any, List, Optional

from pipeline.context import PipelineContext
from utils.logger import logger

class SizeRecommendationEngine:
    @staticmethod
    def execute(context: PipelineContext) -> None:
        start_time = time.time()
        
        try:
            if not context.measurements:
                logger.warning("SizeRecommendationEngine skipped, no measurements.", job_id=context.job_id)
                return
                
            charts_path = os.path.join(os.path.dirname(__file__), "..", "size_charts")
            charts = SizeRecommendationEngine._load_charts(charts_path)
            
            recommendations = {}
            
            for brand_name, brand_data in charts.items():
                recommendations[brand_name] = {}
                
                category = brand_data.get("category", "Unknown").lower()
                sizes = brand_data.get("sizes", [])
                decision_rules = brand_data.get("decision", {})
                
                rec = SizeRecommendationEngine._map_size(
                    context.measurements, 
                    sizes, 
                    decision_rules,
                    context.fit_preference,
                    brand_name,
                    category
                )
                
                if rec:
                    recommendations[brand_name][category] = rec
                        
            context.size_recommendations = recommendations

            duration = (time.time() - start_time) * 1000
            context.metrics["sizingTime"] = duration
            context.log("size_recommendation", duration, "success")

        except Exception as e:
            duration = (time.time() - start_time) * 1000
            context.log("size_recommendation", duration, "failed", error=str(e))
            raise

    @staticmethod
    def _load_charts(path: str) -> Dict[str, Any]:
        charts = {}
        if not os.path.exists(path):
            return charts
            
        for f in glob.glob(os.path.join(path, "*.yaml")):
            with open(f, 'r') as file:
                try:
                    brand_data = yaml.safe_load(file)
                    brand = brand_data.get("brand", "Unknown")
                    charts[brand] = brand_data
                except Exception as e:
                    logger.error(f"Failed to load yaml {f}: {e}")
        return charts

    @staticmethod
    def _map_size(
        measurements: Dict[str, Any], 
        sizes: List[Dict[str, Any]], 
        decision_rules: Dict[str, Any],
        fit_preference: str,
        brand_name: str,
        category: str
    ) -> Optional[Dict[str, Any]]:
        if not sizes:
            return None
            
        trace = [f"Loaded {brand_name} {category} chart"]
        
        primary_dims = decision_rules.get("primary", [])
        secondary_dims = decision_rules.get("secondary", [])
        min_required = decision_rules.get("minimum_required", [])
        
        measured_values = {}
        confidences = {}
        for k, v in measurements.items():
            if v.get("value") is not None:
                measured_values[k] = v["value"]
                confidences[k] = v.get("confidence", 0.0)
                
        # Check minimum required
        for req in min_required:
            if req not in measured_values:
                trace.append(f"Missing required measurement: {req}. Aborting.")
                return None
                
        # Helper to find which size index a single dimension falls into
        def find_idx_for_dim(dim: str) -> Tuple[int, float]:
            if dim not in measured_values: return -1, 0.0
            val = measured_values[dim]
            for i, rule in enumerate(sizes):
                if dim in rule:
                    min_val, max_val = rule[dim][0], rule[dim][1]
                    if min_val <= val < max_val:
                        # Chart confidence: how close to the center?
                        center = (max_val + min_val) / 2
                        width = max_val - min_val
                        dist_from_center = abs(val - center)
                        c_conf = 1.0 - (dist_from_center / (width / 2.0))
                        # floor it to something reasonable, like 0.3 at the absolute edge
                        c_conf = max(0.3, c_conf)
                        return i, c_conf
            return -1, 0.0

        # Evaluate primary
        primary_idx = -1
        primary_chart_conf = 0.0
        primary_used = None
        for p in primary_dims:
            idx, c_conf = find_idx_for_dim(p)
            if idx != -1:
                primary_idx = idx
                primary_chart_conf = c_conf
                primary_used = p
                trace.append(f"Primary measurement = {p} -> matches {sizes[idx]['size']}")
                break
                
        if primary_idx == -1:
            trace.append("Could not match any primary measurements.")
            return None
            
        # Evaluate secondary for warnings
        secondary_used = []
        fit_warnings = []
        for s in secondary_dims:
            idx, _ = find_idx_for_dim(s)
            if idx != -1:
                secondary_used.append(s)
                if abs(idx - primary_idx) >= 1:
                    s_size = sizes[idx]['size']
                    p_size = sizes[primary_idx]['size']
                    fit_warnings.append(f"{p} and {s} fall into different size categories. Consider trying both {p_size} and {s_size}.")
                    trace.append(f"Discrepancy detected: {s} indicates {s_size}")

        best_size_idx = primary_idx
        
        # Borderline detection
        borderline = False
        if primary_chart_conf < 0.5:
            borderline = True
            trace.append("Borderline detected (primary measurement near boundary)")
            
        # Adjust for Fit Preference
        target_idx = best_size_idx
        trace.append(f"Fit preference = {fit_preference}")
        if fit_preference == "slim" and best_size_idx > 0:
            target_idx -= 1
            trace.append(f"Shifted recommendation from {sizes[best_size_idx]['size']} to {sizes[target_idx]['size']}")
        elif (fit_preference == "oversized" or fit_preference == "relaxed") and best_size_idx < len(sizes) - 1:
            target_idx += 1
            trace.append(f"Shifted recommendation from {sizes[best_size_idx]['size']} to {sizes[target_idx]['size']}")
            
        recommended_size = sizes[target_idx]["size"]
        
        # Alternate Size
        alternate_size = None
        if borderline and target_idx < len(sizes) - 1:
            alternate_size = sizes[target_idx + 1]["size"]
        elif borderline and target_idx > 0:
            alternate_size = sizes[target_idx - 1]["size"]
            
        # Confidences
        all_used = [primary_used] + secondary_used
        weights = [0.6] + [0.4 / len(secondary_used)] * len(secondary_used) if secondary_used else [1.0]
        
        measurement_conf = sum(confidences[d] * w for d, w in zip(all_used, weights))
        chart_conf = primary_chart_conf # Could average with secondary
        recommendation_score = measurement_conf * chart_conf
        
        return {
            "decision": {
                "primaryMeasurement": primary_used,
                "secondaryMeasurements": secondary_used
            },
            "size": recommended_size,
            "alternate": alternate_size,
            "borderline": borderline,
            "measurementConfidence": round(measurement_conf, 2),
            "chartConfidence": round(chart_conf, 2),
            "recommendationScore": round(recommendation_score, 2),
            "fitWarnings": fit_warnings,
            "decisionTrace": trace
        }
