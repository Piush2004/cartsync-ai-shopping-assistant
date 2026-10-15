export interface UniversalCart {
  id: string;
  userId: string;
  items: CartItem[];
  subtotal: number;
  currency: string;
  lastUpdatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  retailerId: string;
  recommendedSize: string;
  quantity: number;
  price: number;
  checkoutMethod: 'native_checkout' | 'affiliate_redirect';
}

export interface InventoryStatus {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  confidence: number; // 0.0 to 1.0
  lastVerifiedAt: string; // ISO Timestamp
}

export interface RetailerHealth {
  successRate: number; // 0.0 to 1.0
  averageDeliveryDays: number;
  returnDifficultyScore: number; // 1 (Easy) to 10 (Hard)
  apiAvailability: number; // 0.0 to 1.0
  inventoryAccuracy: number; // 0.0 to 1.0
}

export interface RetailerAdapter {
  retailerId: string;
  checkInventory(productId: string, size: string): Promise<InventoryStatus>;
  addToCart(productId: string, size: string, qty: number): Promise<boolean>;
  checkout(cart: UniversalCart): Promise<OrderRecord>;
  trackOrder(orderId: string): Promise<OrderStatus>;
  getHealthMetrics(): Promise<RetailerHealth>;
  generateAffiliateLink(productId: string, size: string): string;
}

export type OrderStatus = 
  | 'CREATED'
  | 'PAID'
  | 'CONFIRMED'
  | 'FULFILLED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'RETURN_WINDOW'
  | 'RETURNED'
  | 'CLOSED';

export interface OrderRecord {
  orderId: string;
  userId: string;
  retailerId: string;
  items: CartItem[];
  status: OrderStatus;
  trackingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommerceIntelligence {
  userId: string;
  averageOrderValue: number;
  purchaseFrequencyDays: number;
  returnFrequencyRate: number; // 0.0 to 1.0
  favoriteRetailer: string;
  preferredPriceRange: { min: number; max: number };
  conversionRate: number; // 0.0 to 1.0
  lifetimeValue: number;
}


export interface ReturnReason {
  category: 'too_small' | 'too_large' | 'fabric' | 'color' | 'quality' | 'expectation_mismatch' | 'damage';
  notes?: string;
}

export type CommerceEventType = 
  | 'CART_CREATED' 
  | 'ITEM_ADDED' 
  | 'CHECKOUT_STARTED' 
  | 'CHECKOUT_COMPLETED' 
  | 'ORDER_SHIPPED' 
  | 'ORDER_DELIVERED' 
  | 'RETURN_REQUESTED' 
  | 'RETURN_COMPLETED' 
  | 'PRICE_ALERT_SENT' 
  | 'WISHLIST_ADDED';

export interface CommerceEvent {
  eventId: string;
  eventType: CommerceEventType;
  userId: string;
  timestamp: string;
  payload: any;
}

export interface PriceIntelligence {
  productId: string;
  currentPrice: number;
  historicalPrices: { date: string; price: number }[];
  volatility: 'low' | 'medium' | 'high';
  predictedBestPurchaseWindow: string; // e.g., "Wait 2 weeks for Black Friday"
}
