import { RetailerAdapter, InventoryStatus } from './types';

export class InventoryManager {
  private adapters: Map<string, RetailerAdapter> = new Map();

  public registerAdapter(adapter: RetailerAdapter) {
    this.adapters.set(adapter.retailerId, adapter);
  }

  /**
   * Checks inventory for a product, returning a structured confidence metric.
   * If the adapter isn't available, returns a cached/low-confidence status.
   */
  public async checkAvailability(
    retailerId: string, 
    productId: string, 
    size: string
  ): Promise<InventoryStatus> {
    const adapter = this.adapters.get(retailerId);

    if (!adapter) {
      // Fallback: If no direct integration exists, we assume in-stock but with very low confidence
      return {
        status: 'in_stock',
        confidence: 0.2, // Low confidence
        lastVerifiedAt: new Date(Date.now() - 86400000).toISOString() // Yesterday
      };
    }

    try {
      return await adapter.checkInventory(productId, size);
    } catch (e) {
      return {
        status: 'in_stock',
        confidence: 0.1, // API failed, extreme low confidence
        lastVerifiedAt: new Date().toISOString()
      };
    }
  }
}
