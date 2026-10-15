import { RetailerAdapter, InventoryStatus, UniversalCart, OrderRecord, OrderStatus, RetailerHealth } from '../types';

/**
 * Base mock adapter to simulate interactions with third-party retailers like Zara, Nike, etc.
 */
export class MockRetailerAdapter implements RetailerAdapter {
  constructor(public retailerId: string, private hasNativeIntegration: boolean = true) {}

  async checkInventory(productId: string, size: string): Promise<InventoryStatus> {
    // Simulate real-time API call
    return {
      status: 'in_stock',
      confidence: 0.95, // High confidence since it's a direct API call
      lastVerifiedAt: new Date().toISOString()
    };
  }

  async addToCart(productId: string, size: string, qty: number): Promise<boolean> {
    if (!this.hasNativeIntegration) return false;
    return true;
  }

  async checkout(cart: UniversalCart): Promise<OrderRecord> {
    if (!this.hasNativeIntegration) {
      throw new Error(`Native checkout not supported for ${this.retailerId}`);
    }

    const retailerItems = cart.items.filter(i => i.retailerId === this.retailerId);

    return {
      orderId: `ORD-${this.retailerId}-${Date.now()}`,
      userId: cart.userId,
      retailerId: this.retailerId,
      items: retailerItems,
      status: 'CREATED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async trackOrder(orderId: string): Promise<OrderStatus> {
    return 'SHIPPED';
  }

  async getHealthMetrics(): Promise<RetailerHealth> {
    return {
      successRate: 0.98,
      averageDeliveryDays: 3,
      returnDifficultyScore: 2,
      apiAvailability: 0.999,
      inventoryAccuracy: 0.95
    };
  }

  generateAffiliateLink(productId: string, size: string): string {
    return `https://www.${this.retailerId}.com/product/${productId}?size=${size}&ref=cartsync_ai`;
  }
}
