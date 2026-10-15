export type EventName = 
  | 'scan_started'
  | 'scan_completed'
  | 'camera_guidance_failed'
  | 'readiness_score'
  | 'retakes_count'
  | 'processing_duration'
  | 'fit_identity_viewed'
  | 'product_interaction'
  | 'why_this_works_expanded'
  | 'wardrobe_usage'
  | 'stylist_prompt'
  | 'feedback_submitted'
  | 'passport_flipped'
  | 'body_part_interact'
  | 'performance_metric';

export const trackEvent = (name: EventName, properties?: Record<string, any>) => {
  // Console logging for development
  console.log(`[Analytics] ${name}`, properties);
  
  // Store events locally for the Admin Dashboard to visualize
  if (typeof window !== 'undefined') {
    try {
      const events = JSON.parse(localStorage.getItem('cartsync_events') || '[]');
      events.push({ name, properties, timestamp: Date.now() });
      localStorage.setItem('cartsync_events', JSON.stringify(events));
    } catch (e) {
      console.warn("Analytics storage failed");
    }
  }
};

export const measurePerformance = (metricName: string, durationMs: number) => {
  trackEvent('performance_metric', { metric: metricName, durationMs });
};
