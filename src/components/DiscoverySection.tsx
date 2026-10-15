'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingBag, Send, Bot, Check, ArrowRight, Info } from 'lucide-react';

export interface Product {
  id: string;
  title: string;
  source: 'amazon' | 'flipkart';
  sourceId: string;
  price: number;
  gender: 'masculine' | 'feminine' | 'unisex';
  imageUrl: string;
  sizeChart: {
    size: string;
    chestMin: number;
    chestMax: number;
    waistMin: number;
    waistMax: number;
  }[];
}

interface DiscoverySectionProps {
  onSelectProduct: (product: Product) => void;
  selectedProduct: Product | null;
}

const PRODUCTS_DATABASE: Product[] = [
  {
    id: 'amazon_prod_1',
    title: 'Classic Bomber Jacket',
    source: 'amazon',
    sourceId: 'B08F91ABC',
    price: 120,
    gender: 'masculine',
    imageUrl: '/images/bomber_jacket.png',
    sizeChart: [
      { size: 'S', chestMin: 34, chestMax: 36, waistMin: 28, waistMax: 30 },
      { size: 'M', chestMin: 38, chestMax: 40, waistMin: 32, waistMax: 34 },
      { size: 'L', chestMin: 42, chestMax: 44, waistMin: 36, waistMax: 38 },
      { size: 'XL', chestMin: 46, chestMax: 48, waistMin: 40, waistMax: 42 }
    ]
  },
  {
    id: 'flipkart_prod_2',
    title: 'Floral Summer Dress',
    source: 'flipkart',
    sourceId: 'DRESS123XYZ',
    price: 45,
    gender: 'feminine',
    imageUrl: '/images/summer_dress.png',
    sizeChart: [
      { size: 'S', chestMin: 32, chestMax: 34, waistMin: 24, waistMax: 26 },
      { size: 'M', chestMin: 35, chestMax: 37, waistMin: 27, waistMax: 29 },
      { size: 'L', chestMin: 38, chestMax: 40, waistMin: 30, waistMax: 32 }
    ]
  },
  {
    id: 'amazon_prod_3',
    title: 'Unisex Oversized Hoodie',
    source: 'amazon',
    sourceId: 'B08F92DEF',
    price: 55,
    gender: 'unisex',
    imageUrl: '/images/oversized_hoodie.png',
    sizeChart: [
      { size: 'S', chestMin: 34, chestMax: 37, waistMin: 28, waistMax: 31 },
      { size: 'M', chestMin: 38, chestMax: 41, waistMin: 32, waistMax: 35 },
      { size: 'L', chestMin: 42, chestMax: 45, waistMin: 36, waistMax: 39 }
    ]
  }
];

interface Message {
  sender: 'user' | 'bot';
  text: string;
  matchedProductId?: string;
}

export default function DiscoverySection({ onSelectProduct, selectedProduct }: DiscoverySectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(PRODUCTS_DATABASE);
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Hello! I am your CartSync discovery assistant. Type what you are looking for (e.g. "classic leather look" or "something floral") and I will query our indexes.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Filter products when search query changes
  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      setFilteredProducts(PRODUCTS_DATABASE);
    } else {
      setFilteredProducts(
        PRODUCTS_DATABASE.filter(
          p => p.title.toLowerCase().includes(q) || p.gender.toLowerCase().includes(q)
        )
      );
    }
  }, [searchQuery]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setIsTyping(true);

    // Simulate Algolia Grounded search response
    setTimeout(() => {
      let botResponse = "I scanned the Algolia indexes, but couldn't find matches matching that specific description. Try asking for 'jacket', 'dress', or 'hoodie'!";
      let matchedId: string | undefined;

      const lowerText = userText.toLowerCase();
      if (lowerText.includes('jacket') || lowerText.includes('leather') || lowerText.includes('bomber') || lowerText.includes('brown')) {
        botResponse = "I matched the 'Classic Bomber Jacket' from Amazon. It fits masculine biometrics best. Would you like to select it for Try-On?";
        matchedId = 'amazon_prod_1';
      } else if (lowerText.includes('dress') || lowerText.includes('floral') || lowerText.includes('summer')) {
        botResponse = "Found it! The 'Floral Summer Dress' from Flipkart. Designed with light, breathable material. Click below to load it into the Try-On studio.";
        matchedId = 'flipkart_prod_2';
      } else if (lowerText.includes('hoodie') || lowerText.includes('oversized') || lowerText.includes('grey') || lowerText.includes('unisex')) {
        botResponse = "I found the 'Unisex Oversized Hoodie' from Amazon. It supports unisex fits and maps across both masculine and feminine sizing sheets.";
        matchedId = 'amazon_prod_3';
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: botResponse, matchedProductId: matchedId }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleProductSelect = (prod: Product) => {
    onSelectProduct(prod);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Search & Product Catalog Grid */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-violet-500" />
              Federated Discovery Catalog
            </h2>
            <p className="text-xs text-neutral-400">Indexed 6-hourly from Amazon and Flipkart APIs</p>
          </div>
          
          {/* Algolia Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Algolia collection..."
              className="w-full rounded-xl border border-white/10 bg-neutral-950/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredProducts.map((product) => {
              const isSelected = selectedProduct?.id === product.id;
              return (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                    isSelected 
                      ? 'border-violet-500 bg-violet-950/10 shadow-[0_0_20px_rgba(139,92,246,0.15)]' 
                      : 'border-white/5 bg-neutral-900/40 hover:border-white/10'
                  }`}
                >
                  {/* Source Indicator */}
                  <div className="absolute left-3 top-3 z-10 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-neutral-300 backdrop-blur-md uppercase tracking-wider">
                    {product.source}
                  </div>

                  {/* Product Image */}
                  <div className="relative h-60 w-full overflow-hidden bg-neutral-950/80 flex items-center justify-center">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">{product.title}</h3>
                        <span className="inline-block mt-1 rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          {product.gender}
                        </span>
                      </div>
                      <span className="text-lg font-bold text-violet-400">${product.price}</span>
                    </div>

                    <button
                      onClick={() => handleProductSelect(product)}
                      className={`w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        isSelected
                          ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20'
                          : 'bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="h-4 w-4" /> Selected for Try-On
                        </>
                      ) : (
                        'Select for Try-On'
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* AI Assistant Panel */}
      <div className="border border-white/5 bg-neutral-900/20 rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-xl">
        <div className="border-b border-white/5 bg-neutral-900/60 p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
            <Bot className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Catalog Agent</h3>
            <p className="text-[10px] text-neutral-400">Grounded Search assistant</p>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin scrollbar-thumb-white/5">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-2.5 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {msg.sender === 'bot' && (
                <div className="h-6 w-6 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-400 shrink-0">
                  <Bot className="h-3.5 w-3.5" />
                </div>
              )}
              <div className="space-y-2">
                <div
                  className={`rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-violet-600 text-white'
                      : 'bg-neutral-800/80 text-neutral-300'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.matchedProductId && (
                  <button
                    onClick={() => {
                      const prod = PRODUCTS_DATABASE.find(p => p.id === msg.matchedProductId);
                      if (prod) handleProductSelect(prod);
                    }}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Load selected item into studio <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2.5 max-w-[85%]">
              <div className="h-6 w-6 rounded-full bg-violet-600/10 flex items-center justify-center text-violet-400 shrink-0">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="rounded-2xl px-4 py-2.5 bg-neutral-800/80 text-neutral-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 border-t border-white/5 bg-neutral-950/30 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ask AI about fit, style, or matching..."
            className="flex-1 rounded-xl border border-white/5 bg-neutral-950 px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-violet-500/50 transition-colors"
          />
          <button
            type="submit"
            className="h-8 w-8 rounded-xl bg-violet-600 text-white flex items-center justify-center hover:bg-violet-500 transition-colors shadow-md shadow-violet-600/15"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
export { PRODUCTS_DATABASE };
