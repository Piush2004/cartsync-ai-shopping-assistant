'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Zap, Ruler, ShoppingBag, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
  category: string;
  sizes: string[];
  colors: string[];
  platform: 'amazon' | 'flipkart';
  rating: number;
  url: string;
}

interface ProductCardProps {
  product: Product;
  onTryOn?: (productId: string) => void;
  onGetSize?: (productId: string) => void;
}

const platformConfig = {
  amazon: {
    label: 'Amazon',
    bg: 'bg-[#ff9900]/90',
    text: 'text-black',
  },
  flipkart: {
    label: 'Flipkart',
    bg: 'bg-[#2874f0]/90',
    text: 'text-white',
  },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${
            star <= Math.floor(rating)
              ? 'text-amber-400 fill-amber-400'
              : star - 0.5 <= rating
              ? 'text-amber-400 fill-amber-400/50'
              : 'text-zinc-600'
          }`}
        />
      ))}
      <span className="text-xs text-zinc-400 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ProductCard({
  product,
  onTryOn,
  onGetSize,
}: ProductCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const platform = platformConfig[product.platform];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="group relative w-full min-w-[240px] max-w-[280px] rounded-2xl backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_40px_rgba(124,58,237,0.12)] hover:border-violet-500/20"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden bg-white/[0.02]">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          unoptimized
          className={`object-cover transition-all duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
        />
        {!imageLoaded && (
          <div className="absolute inset-0 bg-white/[0.02] animate-pulse" />
        )}

        {/* Platform Badge */}
        <div
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg ${platform.bg} ${platform.text} text-[11px] font-bold backdrop-blur-sm shadow-lg`}
        >
          {platform.label}
        </div>

        {/* Quick link */}
        <motion.a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <ExternalLink className="w-3.5 h-3.5 text-white" />
        </motion.a>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Brand & Name */}
        <div>
          <p className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider mb-0.5">
            {product.brand}
          </p>
          <h3 className="text-sm font-semibold text-[#f5f5f7] line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </div>

        {/* Price & Rating */}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#f5f5f7]">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          <StarRating rating={product.rating} />
        </div>

        {/* Sizes */}
        {product.sizes.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {product.sizes.map((size) => (
              <span
                key={size}
                className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[11px] font-medium text-zinc-300 hover:border-violet-500/30 hover:bg-violet-500/10 transition-colors cursor-default"
              >
                {size}
              </span>
            ))}
          </div>
        )}

        {/* Colors */}
        {product.colors.length > 0 && (
          <div className="flex items-center gap-1.5">
            {product.colors.map((color, idx) => (
              <span
                key={idx}
                className="w-4 h-4 rounded-full border-2 border-white/10 hover:border-white/30 transition-colors cursor-pointer"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          {onTryOn && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onTryOn(product.id)}
              className="flex-1 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/10"
            >
              <ShoppingBag className="w-3.5 h-3.5 mr-1" />
              Try On
              <span className="ml-1 opacity-60 flex items-center">
                <Zap className="w-2.5 h-2.5" />1
              </span>
            </Button>
          )}
          {onGetSize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onGetSize(product.id)}
              className="flex-1 text-xs bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1]"
            >
              <Ruler className="w-3.5 h-3.5 mr-1" />
              Get Size
              <span className="ml-1 opacity-60 flex items-center">
                <Zap className="w-2.5 h-2.5" />1
              </span>
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
