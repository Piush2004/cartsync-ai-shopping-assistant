from .run_tracker import run_tracker

class ComparisonEngine:
    def compare_runs(self, run_id_a: str, run_id_b: str) -> dict:
        """
        Compares baseline metrics (Run A) against challenger metrics (Run B).
        Determines overall status: Improved, Regressed, or Unchanged.
        """
        run_a = next((r for r in run_tracker.runs if r["experimentId"] == run_id_a), None)
        run_b = next((r for r in run_tracker.runs if r["experimentId"] == run_id_b), None)

        if not run_a or not run_b:
            raise KeyError("One or both comparison experiment IDs do not exist.")

        m_a = run_a["metrics"]
        m_b = run_b["metrics"]

        mae_diff = m_b["mae"] - m_a["mae"]
        rmse_diff = m_b["rmse"] - m_a["rmse"]
        acc_diff = m_b["accuracy"] - m_a["accuracy"]

        # Check threshold limits to assign change status
        # Negative MAE difference = lower error = improvement!
        if mae_diff < -0.05:
            status = "Improved"
        elif mae_diff > 0.05:
            status = "Regressed"
        else:
            status = "Unchanged"

        return {
            "baselineId": run_id_a,
            "challengerId": run_id_b,
            "metricsDelta": {
                "maeDiff": round(mae_diff, 3),
                "rmseDiff": round(rmse_diff, 3),
                "accuracyDiff": round(acc_diff, 2)
            },
            "status": status
        }

comparison_engine = ComparisonEngine()
