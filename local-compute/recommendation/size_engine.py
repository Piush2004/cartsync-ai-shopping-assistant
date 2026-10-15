class SizeEngine:
    def __init__(self):
        # In-memory brand size charts
        # Structure: BRAND -> TYPE -> SIZE -> MEASUREMENT -> (min_cm, max_cm)
        self.size_charts = {
            "Nike": {
                "tops": {
                    "S": {"chest": (88, 96), "waist": (73, 81), "hips": (88, 96)},
                    "M": {"chest": (96, 104), "waist": (81, 89), "hips": (96, 104)},
                    "L": {"chest": (104, 112), "waist": (89, 97), "hips": (104, 112)},
                    "XL": {"chest": (112, 124), "waist": (97, 109), "hips": (112, 120)}
                },
                "bottoms": {
                    "S": {"waist": (73, 81), "hips": (88, 96), "inseam": (77, 82)},
                    "M": {"waist": (81, 89), "hips": (96, 104), "inseam": (78, 83)},
                    "L": {"waist": (89, 97), "hips": (104, 112), "inseam": (79, 84)},
                    "XL": {"waist": (97, 109), "hips": (112, 120), "inseam": (80, 85)}
                }
            },
            "Zara": {
                "tops": {
                    "S": {"chest": (86, 92), "waist": (72, 78), "hips": (86, 92)},
                    "M": {"chest": (92, 98), "waist": (78, 84), "hips": (92, 98)},
                    "L": {"chest": (98, 106), "waist": (84, 92), "hips": (98, 106)},
                    "XL": {"chest": (106, 114), "waist": (92, 100), "hips": (106, 114)}
                },
                "bottoms": {
                    "S": {"waist": (72, 78), "hips": (86, 92), "inseam": (76, 80)},
                    "M": {"waist": (78, 84), "hips": (92, 98), "inseam": (77, 81)},
                    "L": {"waist": (84, 92), "hips": (98, 106), "inseam": (78, 82)},
                    "XL": {"waist": (92, 100), "hips": (106, 114), "inseam": (79, 83)}
                }
            },
            "H&M": {
                "tops": {
                    "S": {"chest": (84, 92), "waist": (70, 78), "hips": (84, 92)},
                    "M": {"chest": (92, 100), "waist": (78, 86), "hips": (92, 100)},
                    "L": {"chest": (100, 108), "waist": (86, 94), "hips": (100, 108)},
                    "XL": {"chest": (108, 116), "waist": (94, 102), "hips": (108, 116)}
                },
                "bottoms": {
                    "S": {"waist": (70, 78), "hips": (84, 92), "inseam": (76, 80)},
                    "M": {"waist": (78, 86), "hips": (92, 100), "inseam": (77, 81)},
                    "L": {"waist": (86, 94), "hips": (100, 108), "inseam": (78, 82)},
                    "XL": {"waist": (94, 102), "hips": (108, 116), "inseam": (79, 83)}
                }
            }
        }
        # Fallback default chart (same as H&M)
        self.default_chart = self.size_charts["H&M"]

    def get_size_chart(self, brand: str, apparel_type: str) -> dict:
        brand_charts = self.size_charts.get(brand, self.default_chart)
        return brand_charts.get(apparel_type, brand_charts["tops"])

    def evaluate_sizes(self, user_measurements: dict, size_chart: dict) -> list:
        """
        Compares user measurements against each size in the chart.
        Returns a list of size candidates with individual metric scores and fit types.
        """
        candidates = []
        
        for size, metrics in size_chart.items():
            match_points = 0
            total_points = len(metrics)
            details = {}
            
            for key, (min_val, max_val) in metrics.items():
                val = user_measurements.get(key)
                if val is None:
                    continue
                    
                # Determine metric fit
                if val < min_val:
                    # Oversized fit
                    offset = min_val - val
                    fit = "Oversized" if offset > 6 else "Relaxed"
                    score = max(0.0, 1.0 - (offset / 10.0))
                elif min_val <= val <= max_val:
                    # Fitting range
                    span = max_val - min_val
                    pct = (val - min_val) / span if span > 0 else 0.5
                    
                    if pct > 0.8:
                        fit = "Tight"
                    elif pct < 0.3:
                        fit = "Relaxed"
                    else:
                        fit = "Regular"
                    score = 1.0
                    match_points += 1
                else:
                    # Tight/too small fit
                    offset = val - max_val
                    fit = "Tight"
                    score = max(0.0, 1.0 - (offset / 10.0))
                    
                details[key] = {
                    "fit": fit,
                    "score": round(score, 2),
                    "user_val": val,
                    "range": (min_val, max_val)
                }
            
            size_score = match_points / total_points if total_points > 0 else 0.0
            
            candidates.append({
                "size": size,
                "score": round(size_score, 2),
                "details": details
            })
            
        return candidates

size_engine = SizeEngine()
