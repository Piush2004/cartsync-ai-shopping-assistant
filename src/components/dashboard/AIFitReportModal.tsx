import React from 'react';
import { motion } from 'framer-motion';
import { X, Share2, ShieldCheck, Download } from 'lucide-react';

interface AIFitReportModalProps {
  data: any;
  onClose: () => void;
}

export default function AIFitReportModal({ data, onClose }: AIFitReportModalProps) {
  if (!data) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#050505] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-white/10 flex justify-between items-start bg-black/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FFCC] rounded-full blur-[120px] opacity-10 pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2">CartSync AI Fit Report</h2>
            <p className="text-sm text-[#00FFCC] uppercase tracking-widest font-bold">
              Scan ID: {data.profile?.user_id.substring(0, 8) || 'GUEST'}-{new Date().getFullYear()} • v1.0
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors relative z-10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-8 space-y-8">
          
          {/* Fit Insights */}
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Fit Insights</h3>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-gray-300 font-light leading-relaxed">
                Your shoulder width is highly consistent with a <span className="text-white font-medium">Size M</span>. 
                However, your waist measurement leans closer to <span className="text-white font-medium">Size L</span> depending on the brand's cut. 
                For a <span className="text-[#00FFCC]">Slim Fit</span>, we recommend prioritizing tops with a bit of stretch, or sizing up to L in rigid materials like denim or heavy cotton.
              </p>
            </div>
          </section>

          {/* Measurements */}
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Core Dimensions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(data.measurements).slice(0, 4).map(([key, val]: any) => (
                <div key={key} className="p-4 rounded-xl bg-black border border-white/5 flex flex-col justify-between">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 truncate">
                    {key.replace('_', ' ')}
                  </p>
                  <p className="text-2xl font-light text-white">
                    {val.value ? `${val.value}` : '--'}
                    {val.value && <span className="text-sm text-gray-500 ml-1">cm</span>}
                  </p>
                  {val.status === 'success' && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-[#00FFCC] uppercase tracking-widest">
                      <ShieldCheck className="w-3 h-3" /> {Math.round(val.confidence * 100)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-black/50 flex gap-4">
          <button className="flex-1 bg-white text-black py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" /> Share Report
          </button>
          <button className="bg-white/5 text-white px-6 py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> Save PDF
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
