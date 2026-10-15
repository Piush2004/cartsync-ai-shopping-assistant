import { OrderRecord, ReturnReason, CommerceEvent } from './types';
import { v4 as uuidv4 } from 'uuid';

export class ReturnsManager {
  private eventListeners: ((event: CommerceEvent) => void)[] = [];

  public subscribe(listener: (event: CommerceEvent) => void) {
    this.eventListeners.push(listener);
  }

  private publishEvent(userId: string, eventType: CommerceEvent['eventType'], payload: any) {
    const event: CommerceEvent = {
      eventId: uuidv4(),
      eventType,
      userId,
      timestamp: new Date().toISOString(),
      payload
    };
    this.eventListeners.forEach(listener => listener(event));
  }

  /**
   * Processes a return request for a specific item in an order.
   * Emits a RETURN_COMPLETED event which Epic 6 (Learning Engine) listens to 
   * in order to update the UserKnowledgeGraph calibrations.
   */
  public async processReturn(
    order: OrderRecord,
    itemId: string,
    reason: ReturnReason
  ): Promise<boolean> {
    const item = order.items.find(i => i.id === itemId);
    
    if (!item) {
      throw new Error('Item not found in order');
    }

    this.publishEvent(order.userId, 'RETURN_REQUESTED', { orderId: order.orderId, itemId, reason });

    // In production, this would call the RetailerAdapter.processReturn() API
    const returnAccepted = true; // Mock

    if (returnAccepted) {
      this.publishEvent(order.userId, 'RETURN_COMPLETED', { 
        orderId: order.orderId, 
        retailerId: item.retailerId,
        productId: item.productId,
        recommendedSize: item.recommendedSize,
        reason 
      });
    }

    return returnAccepted;
  }
}
