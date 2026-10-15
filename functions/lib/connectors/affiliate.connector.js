"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.affiliateConnector = exports.AffiliateConnector = void 0;
const base_connector_1 = require("./base.connector");
class AffiliateConnector extends base_connector_1.BaseConnector {
    async search(query, filters) {
        console.log(`[AffiliateConnector] Searching partner feed matching: "${query}"`);
        const mockItems = [
            {
                id: 'aff-401',
                name: 'Uniqlo Oxford Slim Fit Long Sleeve Shirt',
                brand: 'Uniqlo',
                price: 2490,
                imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
                productUrl: 'https://www.uniqlo.com/in/en/products/aff-401?utm_source=affiliate',
                category: 'tops',
                sizes: ['S', 'M', 'L', 'XL'],
                inStock: true
            },
            {
                id: 'aff-402',
                name: 'H&M Linen-Blend relaxed Chino Pants',
                brand: 'H&M',
                price: 1999,
                imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
                productUrl: 'https://www2.hm.com/en_in/product/aff-402.html?utm_source=affiliate',
                category: 'bottoms',
                sizes: ['30', '32', '34'],
                inStock: true
            }
        ];
        return mockItems.filter(item => item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.brand.toLowerCase().includes(query.toLowerCase()));
    }
    async getProduct(productId) {
        if (productId === 'aff-401') {
            return {
                id: 'aff-401',
                name: 'Uniqlo Oxford Slim Fit Long Sleeve Shirt',
                brand: 'Uniqlo',
                price: 2490,
                imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
                productUrl: 'https://www.uniqlo.com/in/en/products/aff-401?utm_source=affiliate',
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
            id: rawProduct.id || String(rawProduct.affiliateId),
            name: rawProduct.name || rawProduct.title,
            brand: rawProduct.brand,
            price: Number(rawProduct.price),
            imageUrl: rawProduct.imageUrl || '',
            productUrl: rawProduct.productUrl || '',
            category: (rawProduct.category || 'tops'),
            sizes: rawProduct.sizes || [],
            inStock: rawProduct.inStock ?? true,
            metadata: { source: 'AffiliateFeed', affiliateId: rawProduct.affiliateId, ...rawProduct.metadata }
        };
    }
}
exports.AffiliateConnector = AffiliateConnector;
exports.affiliateConnector = new AffiliateConnector();
//# sourceMappingURL=affiliate.connector.js.map