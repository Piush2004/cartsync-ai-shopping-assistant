"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { ProductCard } from "@/components/dashboard/ProductCard";
import { Button } from "@/components/ui/Button";
import { Sparkles, SlidersHorizontal, Search, Loader2 } from "lucide-react";
import { getToken } from "@/app/actions/auth";
import { apiClient } from "@/lib/client";

const CATEGORIES = ["All", "T-Shirts", "Pants", "Outerwear", "Footwear"];

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await apiClient<any>('/product-intelligence/recommendations', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setProducts(data.products || []);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filteredProducts = activeCategory === "All" 
    ? products 
    : products.filter(p => p.product.category === activeCategory.toLowerCase());

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <motion.div variants={fadeInUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-blue/20 bg-accent-blue/5 text-accent-blue text-sm font-medium mb-4">
                <Sparkles className="w-4 h-4" />
                <span>AI Sourced Recommendations</span>
              </div>
              <h1 className="text-4xl font-bold text-text-primary tracking-tight">Your Products</h1>
              <p className="text-text-secondary mt-2 text-lg">Curated specifically for your exact body measurements.</p>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="flex gap-3">
              <div className="relative w-64">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full h-11 pl-11 pr-4 bg-bg-elevated border border-border rounded-xl text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                />
              </div>
              <Button variant="secondary" className="h-11 px-4">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </motion.div>
          </div>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === category
                    ? "bg-text-primary text-bg-primary"
                    : "bg-bg-elevated border border-border text-text-secondary hover:text-text-primary hover:border-border-hover"
                }`}
              >
                {category}
              </button>
            ))}
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
            </div>
          ) : (
            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product, idx) => (
                <div key={idx} className="w-full flex justify-center">
                  <ProductCard product={product} />
                </div>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-20">
                  <p className="text-text-secondary text-lg">No products found matching your profile in this category.</p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
