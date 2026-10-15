import { MeasurementProfile } from '../intelligence/measurement';

export interface AnalyticsEvent {
  eventName: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
  properties: Record<string, any>;
}

export interface FitFeedback {
  id: string;
  userId: string;
  productId: string;
  predictedSize: string;
  purchasedSize: string;
  overallFitRating: 1 | 2 | 3 | 4 | 5; // 1 = Way too small, 3 = Perfect, 5 = Way too big
  dimensionFeedback: {
    chest?: 'tight' | 'perfect' | 'loose';
    waist?: 'tight' | 'perfect' | 'loose';
    length?: 'short' | 'perfect' | 'long';
  };
  timestamp: string;
}

export interface MeasurementHistoryRecord {
  id: string;
  userId: string;
  timestamp: string;
  profile: MeasurementProfile; // The actual snapshot of measurements
  active: boolean; // Is this the currently active profile?
}

export interface TelemetryConfig {
  endpoint: string;
  flushIntervalMs: number;
  batchSize: number;
}
