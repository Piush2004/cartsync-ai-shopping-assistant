import { UniversalCart, RetailerAdapter, OrderRecord, CommerceEvent } from './types';
import { v4 as uuidv4 } from 'uuid';

export class CheckoutManager {
  private adapters: Map<string, RetailerAdapter> = new Map();
  private eventListeners: ((event: CommerceEvent) => void)[] = [];

  public registerAdapter(adapter: RetailerAdapter) {
    this.adapters.set(adapter.retailerId, adapter);
  }

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
   * Processes a Universal Cart.
   * Splits items by retailer. If native checkout is supported, it dispatches the order.
   * If not, it returns affiliate links for the user to complete checkout externally.
   */
  public async processCheckout(cart: UniversalCart): Promise<{ 
    nativeOrders: OrderRecord[], 
    redirectUrls: string[] 
  }> {
    this.publishEvent(cart.userId, 'CHECKOUT_STARTED', { cartId: cart.id });

    const nativeOrders: OrderRecord[] = [];
    const redirectUrls: string[] = [];

    // Group items by retailer
    const itemsByRetailer = new Map<string, UniversalCart>();
    
    for (const item of cart.items) {
      if (!itemsByRetailer.has(item.retailerId)) {
        itemsByRetailer.set(item.retailerId, {
          ...cart,
          id: `${cart.id}-${item.retailerId}`,
          items: [],
          subtotal: 0
        });
      }
      const retailerCart = itemsByRetailer.get(item.retailerId)!;
      retailerCart.items.push(item);
      retailerCart.subtotal += (item.price * item.quantity);
    }

    // Process each retailer group
    for (const [retailerId, retailerCart] of itemsByRetailer.entries()) {
      const adapter = this.adapters.get(retailerId);
      
      if (!adapter) {
        throw new Error(`No adapter found for retailer ${retailerId}`);
      }

      // Check if items require redirect
      const requiresRedirect = retailerCart.items.some(i => i.checkoutMethod === 'affiliate_redirect');

      if (requiresRedirect) {
        // Generate redirect links for all items in this group
        for (const item of retailerCart.items) {
          const url = adapter.generateAffiliateLink(item.productId, item.recommendedSize);
          redirectUrls.push(url);
        }
      } else {
        // Process natively
        const order = await adapter.checkout(retailerCart);
        nativeOrders.push(order);
      }
    }

    this.publishEvent(cart.userId, 'CHECKOUT_COMPLETED', { nativeOrders, redirectUrls });

    return { nativeOrders, redirectUrls };
  }
}
