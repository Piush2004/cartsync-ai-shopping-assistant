import { UniversalCart, CartItem, CommerceEvent } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Universal Cart State Manager
 */
export class CartManager {
  private cart: UniversalCart;
  private eventListeners: ((event: CommerceEvent) => void)[] = [];

  constructor(userId: string) {
    this.cart = {
      id: uuidv4(),
      userId,
      items: [],
      subtotal: 0,
      currency: 'USD',
      lastUpdatedAt: new Date().toISOString()
    };
    this.publishEvent('CART_CREATED', this.cart);
  }

  public subscribe(listener: (event: CommerceEvent) => void) {
    this.eventListeners.push(listener);
  }

  private publishEvent(eventType: CommerceEvent['eventType'], payload: any) {
    const event: CommerceEvent = {
      eventId: uuidv4(),
      eventType,
      userId: this.cart.userId,
      timestamp: new Date().toISOString(),
      payload
    };
    this.eventListeners.forEach(listener => listener(event));
  }

  private recalculateTotals() {
    this.cart.subtotal = this.cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.cart.lastUpdatedAt = new Date().toISOString();
  }

  public addItem(item: Omit<CartItem, 'id'>) {
    const newItem: CartItem = {
      ...item,
      id: uuidv4()
    };
    
    this.cart.items.push(newItem);
    this.recalculateTotals();
    this.publishEvent('ITEM_ADDED', newItem);
  }

  public removeItem(itemId: string) {
    this.cart.items = this.cart.items.filter(i => i.id !== itemId);
    this.recalculateTotals();
  }

  public getCart(): UniversalCart {
    return { ...this.cart }; // Return copy
  }
}
