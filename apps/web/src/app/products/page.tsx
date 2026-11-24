"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { ProductCard } from "@/components/dashboard/ProductCard";
import { Sparkles, Search, Loader2 } from "lucide-react";
import { getToken } from "@/app/actions/auth";
import { apiClient } from "@/lib/client";

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

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

  // Categories come from the products themselves, so a newly imported
  // "Hoodie" or "Jacket" gets its own chip without a code change.
  const categories = ["All", ...Array.from(new Set(products.map((p) => p.product.category as string))).sort()];
  const needle = query.trim().toLowerCase();
  const filteredProducts = products.filter((p) => {
    if (activeCategory !== "All" && p.product.category !== activeCategory) return false;
    if (!needle) return true;
    return `${p.product.name} ${p.product.brand}`.toLowerCase().includes(needle);
  });

  return (
    <div className="bg-bg-primary pb-12">
      <div className="w-full">
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
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="search" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search products"
                  placeholder="Search name or brand" 
                  className="w-full h-11 pl-11 pr-4 bg-bg-elevated border border-border rounded-xl text-sm focus:outline-none focus:border-accent-blue focus:ring-1 focus:ring-accent-blue transition-all"
                />
              </div>
            </motion.div>
          </div>

          <motion.div variants={fadeInUp} className="flex flex-wrap gap-2 mb-8">
            {categories.map(category => (
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
            <motion.div variants={fadeInUp} className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-6 2xl:gap-8">
              {filteredProducts.map((product, idx) => (
                <div key={idx} className="min-w-0">
                  <ProductCard product={product} />
                </div>
              ))}
              
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-20">
                  <p className="text-text-secondary text-lg">No products match. Try another category or clear the search.</p>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
