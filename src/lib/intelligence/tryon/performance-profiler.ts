export interface TryOnMetrics {
  meshGenerationTimeMs: number;
  physicsTimeMs: number;
  renderingTimeMs: number;
  cacheHit: boolean;
  totalLatencyMs: number;
}

export class TryOnPerformanceProfiler {
  private metrics: Partial<TryOnMetrics> = {};
  private stageStartTime: number = 0;

  public startStage() {
    this.stageStartTime = performance.now();
  }

  public endStage(stage: keyof TryOnMetrics) {
    if (this.stageStartTime > 0) {
      const duration = performance.now() - this.stageStartTime;
      (this.metrics[stage] as number) = duration;
      this.stageStartTime = 0;
    }
  }

  public recordCacheHit(hit: boolean) {
    this.metrics.cacheHit = hit;
  }

  public getReport(): TryOnMetrics {
    return {
      meshGenerationTimeMs: this.metrics.meshGenerationTimeMs || 0,
      physicsTimeMs: this.metrics.physicsTimeMs || 0,
      renderingTimeMs: this.metrics.renderingTimeMs || 0,
      cacheHit: this.metrics.cacheHit || false,
      totalLatencyMs: this.metrics.totalLatencyMs || 0
    };
  }
}
