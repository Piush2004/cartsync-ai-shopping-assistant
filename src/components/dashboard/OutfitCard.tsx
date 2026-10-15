import React from 'react';
import { motion } from 'framer-motion';

interface OutfitCardProps {
  outfitData: any;
}

export default function OutfitCard({ outfitData }: OutfitCardProps) {
  if (!outfitData) return null;
  const { outfit_name, overall_fit_score, items, reasoning } = outfitData;

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="glass-card rounded-3xl p-1 overflow-hidden relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-[#00FFCC]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="bg-[#0A0A0A] rounded-[22px] p-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">{outfit_name}</h3>
            <p className="text-sm text-gray-400 font-light">Complete look curated for your measurements.</p>
          </div>
          <div className="flex items-center gap-4 bg-[#111] px-6 py-3 rounded-2xl border border-white/5">
            <div>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Overall Fit</p>
              <p className="text-3xl font-light tracking-tighter text-[#00FFCC]">{overall_fit_score}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="bg-[#111] border border-white/5 p-4 rounded-xl flex items-center justify-between group/item hover:border-white/20 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  {item.role.substring(0, 3)}
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{item.role}</p>
                  <p className="font-medium text-white">{item.title}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Size</p>
                <p className="font-mono text-white bg-white/10 px-2 py-0.5 rounded">{item.recommended_size}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6">
          <p className="text-sm text-gray-400 font-light leading-relaxed max-w-2xl">
            <span className="text-[#00FFCC] font-medium mr-2">Why this works:</span>
            {reasoning}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
