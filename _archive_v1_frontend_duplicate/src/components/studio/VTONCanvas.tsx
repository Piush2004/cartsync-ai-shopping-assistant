'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Wand2,
  Download,
  Zap,
  Camera,
  GripVertical,
  ImageIcon,
  ShoppingBag,
  Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface VTONCanvasProps {
  userImage: string | null;
  resultImage: string | null;
  isProcessing: boolean;
  onUpload: (file: File) => void;
  onTryOn: () => void;
  selectedProduct: any | null;
}

export default function VTONCanvas({
  userImage,
  resultImage,
  isProcessing,
  onUpload,
  onTryOn,
  selectedProduct,
}: VTONCanvasProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  const handleSliderMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current || !isDragging) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSliderPosition(percentage);
    },
    [isDragging]
  );

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => handleSliderMove(e.clientX);
  const handleTouchMove = (e: React.TouchEvent) => handleSliderMove(e.touches[0].clientX);

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = 'cartsyncai-tryon.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative aspect-[4/5] md:aspect-[16/10] bg-[#0a0a0f] overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <AnimatePresence mode="wait">
          {!userImage ? (
            /* Upload Zone State */
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group"
            >
              {/* Background decoration */}
              <motion.div
                className="absolute w-80 h-80 rounded-full bg-violet-600/5 blur-[120px]"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{ duration: 5, repeat: Infinity }}
              />

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative z-10 flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-3xl border-2 border-dashed border-white/[0.15] flex items-center justify-center mb-5 group-hover:border-violet-500/40 transition-colors duration-300">
                  <Camera className="w-9 h-9 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                </div>
                <h3 className="text-[#f5f5f7] font-semibold text-lg mb-1">
                  Upload your photo
                </h3>
                <p className="text-zinc-500 text-sm">
                  Click or drag to get started
                </p>
              </motion.div>
            </motion.div>
          ) : userImage && resultImage ? (
            /* Comparison Slider State */
            <motion.div
              key="comparison"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {/* Result image (full) */}
              <img
                src={resultImage}
                alt="Try-on result"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* User image (clipped) */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={userImage}
                  alt="Original photo"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    width: containerRef.current
                      ? `${containerRef.current.offsetWidth}px`
                      : '100%',
                  }}
                />
              </div>

              {/* Slider handle */}
              <div
                className="absolute top-0 bottom-0 z-20 cursor-col-resize"
                style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleMouseDown}
              >
                <div className="w-0.5 h-full bg-white/60" />
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing">
                  <GripVertical className="w-4 h-4 text-zinc-800" />
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-xs text-white font-medium">
                Original
              </div>
              <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-xs text-white font-medium">
                Try-On Result
              </div>
            </motion.div>
          ) : userImage && isProcessing ? (
            /* Processing State */
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img
                src={userImage}
                alt="User photo"
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* Shimmer overlay */}
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
              <motion.div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(124,58,237,0.15), transparent)',
                }}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-10 h-10 text-violet-400" />
                </motion.div>
                <div className="text-center">
                  <p className="text-[#f5f5f7] font-semibold mb-1">
                    Creating your look...
                  </p>
                  <p className="text-zinc-400 text-sm">
                    AI is generating your virtual try-on
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            /* Photo uploaded, awaiting try-on */
            <motion.div
              key="ready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <img
                src={userImage}
                alt="User photo"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-white/80 text-sm">
                  {selectedProduct
                    ? 'Ready! Tap Try On below'
                    : 'Select a product and tap Try On'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected product floating badge */}
        <AnimatePresence>
          {selectedProduct && userImage && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-4 left-4 z-30 flex items-center gap-3 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-xl border border-white/[0.1]"
            >
              {selectedProduct.imageUrl && (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
              )}
              <div>
                <p className="text-xs text-white font-medium line-clamp-1 max-w-[140px]">
                  {selectedProduct.name}
                </p>
                <p className="text-[11px] text-zinc-400">{selectedProduct.brand}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.05] bg-white/[0.02]">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1]"
        >
          <Upload className="w-4 h-4 mr-1.5" />
          {userImage ? 'Change' : 'Upload'}
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={onTryOn}
          disabled={!userImage || !selectedProduct || isProcessing}
          loading={isProcessing}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 px-6"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          Try On
          <span className="ml-2 opacity-60 flex items-center text-xs">
            <Zap className="w-3 h-3 mr-0.5" />1
          </span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleDownload}
          disabled={!resultImage}
          className="bg-white/[0.05] border border-white/[0.08] hover:bg-white/[0.1]"
        >
          <Download className="w-4 h-4 mr-1.5" />
          Save
        </Button>
      </div>
    </div>
  );
}
