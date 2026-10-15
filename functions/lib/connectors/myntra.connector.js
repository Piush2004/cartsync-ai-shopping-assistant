"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.myntraConnector = exports.MyntraConnector = void 0;
const base_connector_1 = require("./base.connector");
class MyntraConnector extends base_connector_1.BaseConnector {
    async search(query, filters) {
        console.log(`[MyntraConnector] Searching catalog for: "${query}"`);
        // Return mock standardized catalog items for Myntra
        const mockItems = [
            {
                id: 'myn-101',
                name: 'Roadster Men Navy Cotton Casual Shirt',
                brand: 'Roadster',
                price: 999,
                imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
                productUrl: 'https://www.myntra.com/shirts/roadster/myn-101',
                category: 'tops',
                sizes: ['S', 'M', 'L', 'XL'],
                inStock: true
            },
            {
                id: 'myn-102',
                name: 'Nike Men Legend Dri-FIT Training Tee',
                brand: 'Nike',
                price: 1895,
                imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
                productUrl: 'https://www.myntra.com/tshirts/nike/myn-102',
                category: 'tops',
                sizes: ['M', 'L', 'XL'],
                inStock: true
            }
        ];
        return mockItems.filter(item => item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.brand.toLowerCase().includes(query.toLowerCase()));
    }
    async getProduct(productId) {
        if (productId === 'myn-101') {
            return {
                id: 'myn-101',
                name: 'Roadster Men Navy Cotton Casual Shirt',
                brand: 'Roadster',
                price: 999,
                imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
                productUrl: 'https://www.myntra.com/shirts/roadster/myn-101',
                category: 'tops',
                sizes: ['S', 'M', 'L', 'XL'],
                inStock: true
            };
        }
        return null;
    }
    async getAvailability(productId, size) {
        const product = await this.getProduct(productId);
        if (!product)
            return false;
        if (size)
            return product.sizes.includes(size) && product.inStock;
        return product.inStock;
    }
    normalizeProduct(rawProduct) {
        return {
            id: rawProduct.id || String(rawProduct.myntraId),
            name: rawProduct.name || rawProduct.title,
            brand: rawProduct.brand,
            price: Number(rawProduct.price || rawProduct.discountedPrice),
            imageUrl: rawProduct.imageUrl || rawProduct.image,
            productUrl: rawProduct.productUrl || '',
            category: (rawProduct.category || 'tops'),
            sizes: rawProduct.sizes || [],
            inStock: rawProduct.inStock ?? true,
            metadata: { source: 'Myntra', ...rawProduct.metadata }
        };
    }
}
exports.MyntraConnector = MyntraConnector;
exports.myntraConnector = new MyntraConnector();
//# sourceMappingURL=myntra.connector.js.map