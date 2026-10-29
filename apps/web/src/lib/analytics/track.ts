// apps/web/src/lib/analytics/track.ts

import { EventName, EventProperties } from './events';

export const trackEvent = (eventName: EventName, properties?: EventProperties) => {
  // In a real app, this would send data to Mixpanel, Amplitude, PostHog, or a custom backend.
  // For this milestone, we log to the console structured for a future dashboard.
  if (typeof window !== 'undefined') {
    const payload = {
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }
    };
    
    // Using console.info instead of console.log to easily filter analytics events
    console.info(`[Analytics] ${eventName}`, payload);
  }
};
