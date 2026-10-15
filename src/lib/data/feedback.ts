import { FitFeedback } from './types';
import { analytics } from './analytics';

export interface FeedbackRepository {
  saveFeedback(feedback: Omit<FitFeedback, 'id' | 'timestamp'>): Promise<FitFeedback>;
  getUserFeedback(userId: string): Promise<FitFeedback[]>;
}

/**
 * Manages user fit feedback micro-surveys.
 * This data is critical for the Epic 6 Learning Engine to calibrate user profiles.
 */
export class InMemoryFeedbackRepository implements FeedbackRepository {
  private feedbackStore: FitFeedback[] = [];

  async saveFeedback(data: Omit<FitFeedback, 'id' | 'timestamp'>): Promise<FitFeedback> {
    const feedback: FitFeedback = {
      ...data,
      id: `fb_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    this.feedbackStore.push(feedback);

    // Automatically fire a telemetry event
    analytics.track('FEEDBACK_SUBMITTED', {
      productId: feedback.productId,
      overallRating: feedback.overallFitRating,
      purchasedSize: feedback.purchasedSize,
      predictedSize: feedback.predictedSize
    }, feedback.userId);

    return feedback;
  }

  async getUserFeedback(userId: string): Promise<FitFeedback[]> {
    return this.feedbackStore.filter(fb => fb.userId === userId);
  }
}
