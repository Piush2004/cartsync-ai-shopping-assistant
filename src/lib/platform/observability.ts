import { ApiAnalytics } from './types';

export class ObservabilityLayer {
  private analyticsBuffer: ApiAnalytics[] = [];

  /**
   * Tracks operational KPIs for the Developer Platform.
   */
  public logRequest(analytics: ApiAnalytics) {
    this.analyticsBuffer.push(analytics);
    
    // Periodically flush to Data Warehouse / Datadog
    if (this.analyticsBuffer.length > 100) {
      this.flush();
    }
  }

  private flush() {
    console.log(`[Observability] Flushing ${this.analyticsBuffer.length} analytics records.`);
    this.analyticsBuffer = [];
  }
}
