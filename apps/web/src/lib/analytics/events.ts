// apps/web/src/lib/analytics/events.ts

export type EventName = 
  | 'page_view'
  | 'measurement_uploaded'
  | 'recommendation_click'
  | 'chat_interaction'
  | 'profile_completion_changed'
  | 'stylist_recommendation_generated'
  | 'product_clicked'
  | 'product_saved'
  | 'profile_photo_uploaded'
  | 'camera_capture_started'
  | 'camera_capture_completed'
  | 'camera_state_failed'
  | 'scan_started'
  | 'scan_quality_failed'
  | 'scan_completed'
  | 'scan_failed'
  | 'scan_measurements_confirmed'
  | 'scan_measurements_edited'
  | 'scan_retaken'
  | 'logout';

export interface BaseEventProperties {
  timestamp: string;
  url: string;
}

export type EventProperties = Record<string, string | number | boolean | undefined | null>;
