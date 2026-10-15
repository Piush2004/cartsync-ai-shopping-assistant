import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import Image from 'next/image';

interface CompareModalProps {
  products: any[];
  onClose: () => void;
}

export default function CompareModal({ products, onClose }: CompareModalProps) {
  if (!products || products.length < 2) return null;

  const [p1, p2] = products;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0A0A0A] border border-white/10 w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/50">
          <h2 className="text-xl font-bold tracking-tight text-white">Compare Fit Intelligence</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="p-4 border-b border-white/10 w-1/4"></th>
                <th className="p-4 border-b border-white/10 w-3/8 align-bottom">
                  <div className="relative w-32 h-32 rounded-xl mb-4 bg-[#111] overflow-hidden">
                    <Image src={p1.product.images[0]} alt={p1.product.title} fill className="object-cover" />
                  </div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{p1.product.brand}</p>
                  <p className="font-bold text-white text-lg leading-tight">{p1.product.title}</p>
                </th>
                <th className="p-4 border-b border-white/10 w-3/8 align-bottom">
                  <div className="relative w-32 h-32 rounded-xl mb-4 bg-[#111] overflow-hidden">
                    <Image src={p2.product.images[0]} alt={p2.product.title} fill className="object-cover" />
                  </div>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{p2.product.brand}</p>
                  <p className="font-bold text-white text-lg leading-tight">{p2.product.title}</p>
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-gray-400 uppercase tracking-widest text-xs">AI Fit Score</td>
                <td className="p-4 text-2xl font-light text-[#00FFCC]">{p1.fit_score}%</td>
                <td className="p-4 text-2xl font-light text-[#00FFCC]">{p2.fit_score}%</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-gray-400 uppercase tracking-widest text-xs">Rec. Size</td>
                <td className="p-4 text-white font-mono text-lg">{p1.recommended_size}</td>
                <td className="p-4 text-white font-mono text-lg">{p2.recommended_size}</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-gray-400 uppercase tracking-widest text-xs">Fit Type</td>
                <td className="p-4 text-white capitalize">{p1.product.fit_type}</td>
                <td className="p-4 text-white capitalize">{p2.product.fit_type}</td>
              </tr>
              <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-gray-400 uppercase tracking-widest text-xs">Match Quality</td>
                <td className="p-4 text-white">{p1.fit_category}</td>
                <td className="p-4 text-white">{p2.fit_category}</td>
              </tr>
              <tr className="hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium text-gray-400 uppercase tracking-widest text-xs">Price</td>
                <td className="p-4 text-white">${p1.product.price}</td>
                <td className="p-4 text-white">${p2.product.price}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
