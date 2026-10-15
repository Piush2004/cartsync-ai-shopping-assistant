import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface RecommendationCardProps {
  productData: any;
}

export default function RecommendationCard({ productData }: RecommendationCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { product, recommended_size, fit_score, fit_category, reasons } = productData;

  const isPerfect = fit_score >= 90;

  return (
    <>
      <motion.div 
        whileHover={{ y: -5 }}
        onClick={() => setShowDetails(true)}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="glass-card rounded-2xl overflow-hidden group cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row h-full">
          {/* Product Image */}
          <div className="w-full sm:w-1/3 h-48 sm:h-auto bg-[#111] overflow-hidden relative">
            <Image 
              src={product.images[0]} 
              alt={product.title}
              fill
              className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
              sizes="(max-width: 640px) 100vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent sm:bg-gradient-to-r" />
            <div className="absolute bottom-4 left-4 sm:hidden">
              <span className="text-[10px] font-bold tracking-widest uppercase text-white bg-black/50 px-2 py-1 backdrop-blur-md rounded-full">
                {product.brand}
              </span>
            </div>
          </div>
          
          {/* Content */}
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden sm:block mb-1">{product.brand}</p>
                  <h3 className="text-lg font-bold text-white tracking-tight">{product.title}</h3>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Fit Score</p>
                  <p className={`text-2xl font-light tracking-tighter ${isPerfect ? 'text-[#00FFCC]' : 'text-white'}`}>
                    {fit_score}%
                  </p>
                </div>
              </div>
              
              <div className="flex gap-6 mb-6 border-y border-white/5 py-4">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Recommended</p>
                  <p className="text-xl font-medium text-white">{recommended_size}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Match Quality</p>
                  <p className="text-xl font-medium text-white">{fit_category}</p>
                </div>
              </div>
            </div>

            <div className="text-sm font-medium text-[#00FFCC] uppercase tracking-widest flex items-center gap-2">
              Why this fits <ArrowRightMini />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Slide-over / Modal for "Why this recommendation?" */}
      <AnimatePresence>
        {showDetails && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setShowDetails(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0A0A0A] border border-white/10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowDetails(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="mb-8">
                <p className="text-xs text-[#00FFCC] font-bold uppercase tracking-widest mb-2">Fit Intelligence</p>
                <h3 className="text-2xl font-bold text-white tracking-tight">{product.title}</h3>
                <p className="text-gray-400 mt-2">Recommended Size: <span className="text-white font-medium">{recommended_size}</span></p>
              </div>

              <div className="space-y-6">
                {reasons.map((reason: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                    {reason.includes('Warning') || reason.includes('compromise') ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-[#00FFCC] mt-0.5 flex-shrink-0 opacity-80" />
                    )}
                    <p className="text-sm text-gray-300 font-light leading-relaxed">{reason}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex gap-4">
                <button className="flex-1 bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors">
                  Shop Now
                </button>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3 border-t border-white/5 pt-6">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Was this helpful?</p>
                <div className="flex gap-4">
                  <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-[#00FFCC] transition-colors border border-white/10 px-4 py-2 rounded-full">
                    👍 Yes
                  </button>
                  <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors border border-white/10 px-4 py-2 rounded-full">
                    👎 No
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const ArrowRightMini = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"></path>
    <path d="m12 5 7 7-7 7"></path>
  </svg>
);
