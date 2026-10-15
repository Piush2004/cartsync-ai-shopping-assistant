from .run_tracker import run_tracker

class Leaderboard:
    def get_leaderboard(self, sort_by: str = "mae") -> list:
        """
        Retrieves experiment runs sorted by selected metrics.
        - mae: ascending
        - rmse: ascending
        - accuracy: descending
        """
        runs = list(run_tracker.runs)
        
        if sort_by == "mae":
            sorted_runs = sorted(runs, key=lambda x: x["metrics"]["mae"])
        elif sort_by == "rmse":
            sorted_runs = sorted(runs, key=lambda x: x["metrics"]["rmse"])
        elif sort_by == "accuracy":
            sorted_runs = sorted(runs, key=lambda x: x["metrics"]["accuracy"], reverse=True)
        else:
            sorted_runs = runs
            
        return sorted_runs

leaderboard = Leaderboard()
