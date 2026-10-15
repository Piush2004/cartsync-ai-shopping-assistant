"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ajioConnector = exports.AjioConnector = void 0;
const base_connector_1 = require("./base.connector");
class AjioConnector extends base_connector_1.BaseConnector {
    async search(query, filters) {
        console.log(`[AjioConnector] Searching catalog for: "${query}"`);
        const mockItems = [
            {
                id: 'aji-201',
                name: 'Levis 511 Slim Fit Stretchable Jeans',
                brand: "Levi's",
                price: 2899,
                imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
                productUrl: 'https://www.ajio.com/jeans/levis/aji-201',
                category: 'bottoms',
                sizes: ['30', '32', '34', '36'],
                inStock: true
            },
            {
                id: 'aji-202',
                name: 'Adidas Men Solid Slim Track Pants',
                brand: 'Adidas',
                price: 2499,
                imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500',
                productUrl: 'https://www.ajio.com/pants/adidas/aji-202',
                category: 'bottoms',
                sizes: ['S', 'M', 'L'],
                inStock: true
            }
        ];
        return mockItems.filter(item => item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.brand.toLowerCase().includes(query.toLowerCase()));
    }
    async getProduct(productId) {
        if (productId === 'aji-201') {
            return {
                id: 'aji-201',
                name: 'Levis 511 Slim Fit Stretchable Jeans',
                brand: "Levi's",
                price: 2899,
                imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
                productUrl: 'https://www.ajio.com/jeans/levis/aji-201',
                category: 'bottoms',
                sizes: ['30', '32', '34', '36'],
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
            id: rawProduct.id || String(rawProduct.ajioId),
            name: rawProduct.name || rawProduct.title,
            brand: rawProduct.brand,
            price: Number(rawProduct.price),
            imageUrl: rawProduct.imageUrl || '',
            productUrl: rawProduct.productUrl || '',
            category: (rawProduct.category || 'bottoms'),
            sizes: rawProduct.sizes || [],
            inStock: rawProduct.inStock ?? true,
            metadata: { source: 'Ajio', ...rawProduct.metadata }
        };
    }
}
exports.AjioConnector = AjioConnector;
exports.ajioConnector = new AjioConnector();
//# sourceMappingURL=ajio.connector.js.map