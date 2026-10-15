import { CartManager } from './cart';
import { CheckoutManager } from './checkout';
import { ReturnsManager } from './returns';
import { InventoryManager } from './inventory';
import { PriceIntelligenceEngine } from './price-watch';
import { MockRetailerAdapter } from './adapters/mock-adapter';

// Singletons for platform usage
export const inventoryManager = new InventoryManager();
export const checkoutManager = new CheckoutManager();
export const returnsManager = new ReturnsManager();
export const priceEngine = new PriceIntelligenceEngine();

// Register Default Adapters
const zaraAdapter = new MockRetailerAdapter('zara', true);
const nikeAdapter = new MockRetailerAdapter('nike', true);
const uniqloAdapter = new MockRetailerAdapter('uniqlo', false); // Requires redirect

inventoryManager.registerAdapter(zaraAdapter);
inventoryManager.registerAdapter(nikeAdapter);
inventoryManager.registerAdapter(uniqloAdapter);

checkoutManager.registerAdapter(zaraAdapter);
checkoutManager.registerAdapter(nikeAdapter);
checkoutManager.registerAdapter(uniqloAdapter);

export * from './types';
export * from './cart';
export * from './checkout';
export * from './returns';
export * from './inventory';
export * from './price-watch';
export * from './event-bus';
export * from './intelligence';
export * from './notifications';
export * from './security';
export * from './adapters/mock-adapter';
