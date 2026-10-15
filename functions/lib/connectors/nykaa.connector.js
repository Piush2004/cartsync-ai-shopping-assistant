"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nykaaConnector = exports.NykaaConnector = void 0;
const base_connector_1 = require("./base.connector");
class NykaaConnector extends base_connector_1.BaseConnector {
    async search(query, filters) {
        console.log(`[NykaaConnector] Searching Nykaa catalog for: "${query}"`);
        const mockItems = [
            {
                id: 'nyk-301',
                name: 'Gucci Bloom Eau de Parfum',
                brand: 'Gucci',
                price: 8400,
                imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500',
                productUrl: 'https://www.nykaa.com/perfume/gucci/nyk-301',
                category: 'outerwear', // Categorized under outerwear for mock trial
                sizes: ['50ml', '100ml'],
                inStock: true
            },
            {
                id: 'nyk-302',
                name: 'Zara Woman Rose Gold Jacket',
                brand: 'Zara',
                price: 4999,
                imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
                productUrl: 'https://www.nykaa.com/clothing/zara/nyk-302',
                category: 'outerwear',
                sizes: ['S', 'M', 'L'],
                inStock: true
            }
        ];
        return mockItems.filter(item => item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.brand.toLowerCase().includes(query.toLowerCase()));
    }
    async getProduct(productId) {
        if (productId === 'nyk-302') {
            return {
                id: 'nyk-302',
                name: 'Zara Woman Rose Gold Jacket',
                brand: 'Zara',
                price: 4999,
                imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
                productUrl: 'https://www.nykaa.com/clothing/zara/nyk-302',
                category: 'outerwear',
                sizes: ['S', 'M', 'L'],
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
            id: rawProduct.id || String(rawProduct.nykaaId),
            name: rawProduct.name || rawProduct.title,
            brand: rawProduct.brand,
            price: Number(rawProduct.price),
            imageUrl: rawProduct.imageUrl || '',
            productUrl: rawProduct.productUrl || '',
            category: (rawProduct.category || 'outerwear'),
            sizes: rawProduct.sizes || [],
            inStock: rawProduct.inStock ?? true,
            metadata: { source: 'Nykaa', ...rawProduct.metadata }
        };
    }
}
exports.NykaaConnector = NykaaConnector;
exports.nykaaConnector = new NykaaConnector();
//# sourceMappingURL=nykaa.connector.js.map