'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wand2,
  Sparkles,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import VTONCanvas from '@/components/studio/VTONCanvas';
import ImageUploader from '@/components/studio/ImageUploader';
import ProductCard from '@/components/features/ProductCard';
import GatedFeature from '@/components/features/GatedFeature';
import AuthModal from '@/components/auth/AuthModal';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { vtonAPI } from '@/lib/api';

// Mock products for the carousel
const mockProducts = [
  {
    id: 'p1',
    name: 'Classic Slim Fit Blazer',
    brand: 'Raymond',
    price: 4999,
    currency: 'INR',
    imageUrl: 'https://picsum.photos/seed/blazer/400/500',
    category: 'Blazers',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#1a1a2e', '#4a3f35', '#2d3436'],
    platform: 'amazon' as const,
    rating: 4.3,
    url: '#',
  },
  {
    id: 'p2',
    name: 'Floral Print Maxi Dress',
    brand: 'Zara',
    price: 2799,
    currency: 'INR',
    imageUrl: 'https://picsum.photos/seed/dress/400/500',
    category: 'Dresses',
    sizes: ['XS', 'S', 'M', 'L'],
    colors: ['#e17055', '#fdcb6e', '#a29bfe'],
    platform: 'flipkart' as const,
    rating: 4.5,
    url: '#',
  },
  {
    id: 'p3',
    name: 'Premium Denim Jacket',
    brand: 'Levi\'s',
    price: 3499,
    currency: 'INR',
    imageUrl: 'https://picsum.photos/seed/denim/400/500',
    category: 'Jackets',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['#2d3436', '#636e72', '#b2bec3'],
    platform: 'amazon' as const,
    rating: 4.7,
    url: '#',
  },
  {
    id: 'p4',
    name: 'Silk Blend Saree',
    brand: 'FabIndia',
    price: 5999,
    currency: 'INR',
    imageUrl: 'https://picsum.photos/seed/saree/400/500',
    category: 'Sarees',
    sizes: ['Free'],
    colors: ['#d63031', '#0984e3', '#00b894'],
    platform: 'flipkart' as const,
    rating: 4.4,
    url: '#',
  },
  {
    id: 'p5',
    name: 'Casual Linen Shirt',
    brand: 'H&M',
    price: 1499,
    currency: 'INR',
    imageUrl: 'https://picsum.photos/seed/shirt/400/500',
    category: 'Shirts',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['#ffeaa7', '#dfe6e9', '#fab1a0'],
    platform: 'amazon' as const,
    rating: 4.1,
    url: '#',
  },
];

export default function StudioPage() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [userFile, setUserFile] = useState<File | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [carouselOffset, setCarouselOffset] = useState(0);

  const handleUploadFromCanvas = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setUserImage(e.target?.result as string);
      setUserFile(file);
      setResultImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUploadFromUploader = useCallback((file: File, preview: string) => {
    setUserImage(preview);
    setUserFile(file);
    setResultImage(null);
    setError(null);
  }, []);

  const handleTryOn = useCallback(async () => {
    if (!userImage || !selectedProduct) return;

    try {
      setIsProcessing(true);
      setError(null);
      const response: any = await vtonAPI(
        userImage,
        selectedProduct.id,
        'non-binary',
        'non-binary',
        selectedProduct.category
      );
      setResultImage(response?.result?.resultImageUrl || userImage);
    } catch (err: any) {
      if (err?.status === 403) {
        setError('Content moderation: This image cannot be processed. Please try a different photo.');
      } else {
        setError(err.message || 'Failed to process try-on. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [userImage, selectedProduct]);

  const handleProductSelect = (productId: string) => {
    const product = mockProducts.find((p) => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      setResultImage(null);
    }
  };

  const scrollCarousel = (direction: 'left' | 'right') => {
    setCarouselOffset((prev) => {
      const max = Math.max(0, (mockProducts.length - 3) * 260);
      if (direction === 'left') return Math.max(0, prev - 300);
      return Math.min(max, prev + 300);
    });
  };

  if (!loading && !user) {
    return (
      <div className="h-screen flex flex-col bg-[#0a0a0f]">
        <div className="relative z-30">
          <Navbar />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
              <Wand2 className="w-10 h-10 text-violet-400" />
            </div>
            <h2 className="text-2xl font-bold text-[#f5f5f7] mb-2">
              Virtual Try-On Studio
            </h2>
            <p className="text-zinc-400 mb-6 max-w-sm">
              Sign in to virtually try on clothes using AI-powered technology
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-violet-600 to-indigo-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Sign In to Get Started
            </Button>
          </motion.div>
          <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden relative">
      {/* Background ambient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-violet-600/[0.03] blur-[150px]" />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-indigo-600/[0.04] blur-[130px]" />
      </div>

      {/* Navbar */}
      <div className="relative z-30">
        <Navbar />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0 relative z-10">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block flex-shrink-0">
          <Sidebar />
        </div>

        {/* Content */}
        <main className="flex-1 min-h-0 overflow-y-auto p-3 md:p-5 space-y-5">
          {/* Error Alert */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300 flex-1">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Studio Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
            {/* VTON Canvas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <GatedFeature featureName="Virtual Try-On" cost={1}>
                <VTONCanvas
                  userImage={userImage}
                  resultImage={resultImage}
                  isProcessing={isProcessing}
                  onUpload={handleUploadFromCanvas}
                  onTryOn={handleTryOn}
                  selectedProduct={selectedProduct}
                />
              </GatedFeature>
            </motion.div>

            {/* Side Panel: Uploader + Selected Product */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
            >
              {/* Upload Area */}
              <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">Your Photo</h3>
                <ImageUploader
                  onImageSelect={handleUploadFromUploader}
                  currentImage={userImage}
                />
              </div>

              {/* Selected Product Info */}
              <AnimatePresence>
                {selectedProduct && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4"
                  >
                    <h3 className="text-sm font-semibold text-[#f5f5f7] mb-3">
                      Selected Item
                    </h3>
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedProduct.imageUrl}
                        alt={selectedProduct.name}
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-zinc-500 uppercase tracking-wider">
                          {selectedProduct.brand}
                        </p>
                        <p className="text-sm text-[#f5f5f7] font-medium truncate">
                          {selectedProduct.name}
                        </p>
                        <p className="text-sm text-violet-400 font-bold mt-0.5">
                          ₹{selectedProduct.price.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Product Carousel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#f5f5f7]">
                  Try On These Looks
                </h3>
                <p className="text-sm text-zinc-500">
                  Select an item to virtually try on
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => scrollCarousel('left')}
                  className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollCarousel('right')}
                  className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-hidden">
              <motion.div
                className="flex gap-4"
                animate={{ x: -carouselOffset }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {mockProducts.map((product) => (
                  <div
                    key={product.id}
                    className={`flex-shrink-0 transition-all duration-300 ${
                      selectedProduct?.id === product.id
                        ? 'ring-2 ring-violet-500 ring-offset-2 ring-offset-[#0a0a0f] rounded-2xl'
                        : ''
                    }`}
                  >
                    <ProductCard
                      product={product}
                      onTryOn={handleProductSelect}
                    />
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
