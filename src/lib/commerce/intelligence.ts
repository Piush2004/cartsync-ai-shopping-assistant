import { CommerceIntelligence, OrderRecord } from './types';

export class CommerceIntelligenceEngine {
  /**
   * Computes Commerce Intelligence metrics from a user's order history.
   * This bridges the gap between transactional commerce and the UserKnowledgeGraph.
   */
  public computeIntelligence(userId: string, orders: OrderRecord[]): CommerceIntelligence {
    if (orders.length === 0) {
      return {
        userId,
        averageOrderValue: 0,
        purchaseFrequencyDays: 0,
        returnFrequencyRate: 0,
        favoriteRetailer: 'none',
        preferredPriceRange: { min: 0, max: 0 },
        conversionRate: 0,
        lifetimeValue: 0
      };
    }

    let totalSpent = 0;
    let returnedItemsCount = 0;
    let totalItemsCount = 0;
    const retailerCounts: Record<string, number> = {};
    const prices: number[] = [];

    orders.forEach(order => {
      // Calculate total spent based on FULFILLED, SHIPPED, DELIVERED, CLOSED
      if (['FULFILLED', 'SHIPPED', 'DELIVERED', 'CLOSED'].includes(order.status)) {
         const orderTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
         totalSpent += orderTotal;
      }

      order.items.forEach(item => {
        totalItemsCount += item.quantity;
        prices.push(item.price);
        
        // Track Retailer frequency
        retailerCounts[item.retailerId] = (retailerCounts[item.retailerId] || 0) + item.quantity;
      });

      // Track returns
      if (order.status === 'RETURNED') {
        // Simple logic for mock; in prod this would look at item-level return events
        returnedItemsCount += order.items.reduce((sum, item) => sum + item.quantity, 0);
      }
    });

    const averageOrderValue = totalSpent / orders.length;
    const returnFrequencyRate = totalItemsCount > 0 ? returnedItemsCount / totalItemsCount : 0;
    const lifetimeValue = totalSpent;

    // Find favorite retailer
    let favoriteRetailer = 'none';
    let maxCount = 0;
    Object.entries(retailerCounts).forEach(([retailer, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteRetailer = retailer;
      }
    });

    // Calculate Price Range
    prices.sort((a, b) => a - b);
    const preferredPriceRange = prices.length > 0 
      ? { min: prices[0], max: prices[prices.length - 1] } 
      : { min: 0, max: 0 };

    return {
      userId,
      averageOrderValue,
      purchaseFrequencyDays: 30, // Mock: In prod, calculate avg diff between order dates
      returnFrequencyRate,
      favoriteRetailer,
      preferredPriceRange,
      conversionRate: 0.15, // Mock: (Orders / Sessions)
      lifetimeValue
    };
  }
}
