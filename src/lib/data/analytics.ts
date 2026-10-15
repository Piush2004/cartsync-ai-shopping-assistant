import { AnalyticsEvent, TelemetryConfig } from './types';

/**
 * Singleton Analytics Dispatcher
 * Batches telemetry events to reduce network overhead.
 */
class AnalyticsDispatcher {
  private queue: AnalyticsEvent[] = [];
  private config: TelemetryConfig;
  private timer: NodeJS.Timeout | null = null;
  private sessionId: string;

  constructor(config: Partial<TelemetryConfig> = {}) {
    this.config = {
      endpoint: config.endpoint || '/api/telemetry',
      flushIntervalMs: config.flushIntervalMs || 5000,
      batchSize: config.batchSize || 10
    };
    // Generate a simple session ID
    this.sessionId = Math.random().toString(36).substring(2, 15);
  }

  /**
   * Tracks an event by adding it to the queue.
   * Flushes immediately if batch size is reached.
   */
  public track(eventName: string, properties: Record<string, any> = {}, userId?: string) {
    const event: AnalyticsEvent = {
      eventName,
      userId,
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      properties
    };

    this.queue.push(event);

    if (this.queue.length >= this.config.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.config.flushIntervalMs);
    }
  }

  /**
   * Flushes the current queue to the backend.
   */
  public async flush() {
    if (this.queue.length === 0) return;

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const payload = [...this.queue];
    this.queue = []; // Clear immediately to prevent double-sends

    try {
      // In production, this would be a fetch POST to the telemetry endpoint.
      // For v3.0 MVP, we simulate a successful network request.
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Telemetry] Flushed ${payload.length} events:`, payload.map(e => e.eventName));
      }
    } catch (error) {
      console.error('[Telemetry] Failed to flush events', error);
      // Re-queue on failure (simplistic retry logic)
      this.queue = [...payload, ...this.queue];
    }
  }
}

// Export a default singleton instance
export const analytics = new AnalyticsDispatcher();
