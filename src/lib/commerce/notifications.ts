export interface EventNotification {
  id: string;
  userId: string;
  type: 'ORDER_SHIPPED' | 'PRICE_DROPPED' | 'DELIVERY_COMPLETED';
  message: string;
  timestamp: string;
  read: boolean;
}

export interface IntelligenceNotification {
  id: string;
  userId: string;
  type: 'CONFIDENCE_IMPROVED' | 'NEW_PREDICTION' | 'BRAND_SIZING_UPDATED' | 'RECOMMENDATION_REFRESHED';
  message: string;
  timestamp: string;
  read: boolean;
}

export class NotificationManager {
  /**
   * Dispatches standard commerce events (shipped, delivered, price drops).
   */
  public dispatchEventNotification(notification: Omit<EventNotification, 'id' | 'timestamp' | 'read'>) {
    const fullNotification: EventNotification = {
      ...notification,
      id: `evt_notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    // Push to UI / Mobile Push Notification service
    console.log('[Event Notification]', fullNotification.message);
  }

  /**
   * Dispatches intelligence events (Measurement improved, brand bias updated).
   * These are handled differently in the UI (e.g., inside the AI Stylist chat).
   */
  public dispatchIntelligenceNotification(notification: Omit<IntelligenceNotification, 'id' | 'timestamp' | 'read'>) {
    const fullNotification: IntelligenceNotification = {
      ...notification,
      id: `int_notif_${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    // Push to Stylist / Knowledge Graph UI
    console.log('[Intelligence Notification]', fullNotification.message);
  }
}
