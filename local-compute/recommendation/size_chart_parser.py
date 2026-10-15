import re

class SizeChartParser:
    def _parse_value_to_range(self, val) -> tuple:
        """
        Parses value into a (min_val, max_val) float tuple.
        Supports:
        - Numbers (int, float) -> (val, val)
        - Range string e.g. "92-100" -> (92.0, 100.0)
        - Bounds dictionary e.g. {"min": 90, "max": 98}
        - Lists/Tuples [92, 100] -> (92.0, 100.0)
        """
        if isinstance(val, (int, float)):
            return float(val), float(val)
        
        if isinstance(val, (list, tuple)):
            if len(val) >= 2:
                return float(val[0]), float(val[1])
            elif len(val) == 1:
                return float(val[0]), float(val[0])
            return 0.0, 0.0

        if isinstance(val, dict):
            min_val = val.get("min", val.get("min_val", 0.0))
            max_val = val.get("max", val.get("max_val", 0.0))
            return float(min_val), float(max_val)

        if isinstance(val, str):
            # Try to match range like "92-100" or "92 - 100"
            match = re.search(r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)', val)
            if match:
                return float(match.group(1)), float(match.group(2))
            
            # Match single numbers
            match_single = re.search(r'(\d+(?:\.\d+)?)', val)
            if match_single:
                parsed = float(match_single.group(1))
                return parsed, parsed

        return 0.0, 0.0

    def parse_size_chart(self, size_chart: dict) -> dict:
        """
        Parses a raw size chart dictionary into standard ranges format:
        {
            "S": {
                "chest": (90.0, 96.0),
                "waist": (78.0, 84.0)
            }
        }
        """
        parsed_chart = {}
        for size_label, metrics in size_chart.items():
            parsed_chart[size_label] = {}
            for metric_key, val in metrics.items():
                parsed_chart[size_label][metric_key] = self._parse_value_to_range(val)
        return parsed_chart

size_chart_parser = SizeChartParser()
