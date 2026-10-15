import { CommerceEvent } from './types';

type EventHandler = (event: CommerceEvent) => Promise<void> | void;

/**
 * Centralized Commerce Event Bus.
 * Enables loose coupling, asynchronous processing, and easier testing.
 */
export class CommerceEventBus {
  private static instance: CommerceEventBus;
  private listeners: Map<string, EventHandler[]> = new Map();

  private constructor() {}

  public static getInstance(): CommerceEventBus {
    if (!CommerceEventBus.instance) {
      CommerceEventBus.instance = new CommerceEventBus();
    }
    return CommerceEventBus.instance;
  }

  public subscribe(eventType: string, handler: EventHandler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(handler);
  }

  public async publish(event: CommerceEvent) {
    const handlers = this.listeners.get(event.eventType) || [];
    
    // Asynchronous processing
    const promises = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error processing event ${event.eventId} in handler:`, error);
        // Implement retry logic here in production
      }
    });

    await Promise.allSettled(promises);
  }
}
