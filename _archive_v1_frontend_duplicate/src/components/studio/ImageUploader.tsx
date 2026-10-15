'use client';

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, X, ImageIcon, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ImageUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
  currentImage: string | null;
  maxSizeMB?: number;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_EXTENSIONS = '.jpg,.jpeg,.png,.webp';

export default function ImageUploader({
  onImageSelect,
  currentImage,
  maxSizeMB = 5,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentImage);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return 'Please upload a JPEG, PNG, or WebP image';
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `File size must be under ${maxSizeMB}MB`;
      }
      return null;
    },
    [maxSizeMB]
  );

  const processFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const previewUrl = e.target?.result as string;
        setPreview(previewUrl);
        onImageSelect(file, previewUrl);
      };
      reader.readAsDataURL(file);
    },
    [validateFile, onImageSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleRemove = useCallback(() => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const openFilePicker = () => fileInputRef.current?.click();

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={handleFileSelect}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {preview ? (
          /* Preview State */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative group rounded-2xl overflow-hidden border border-white/[0.06]"
          >
            <img
              src={preview}
              alt="Uploaded preview"
              className="w-full aspect-[3/4] object-cover"
            />
            {/* Overlay controls */}
            <motion.div
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={openFilePicker}
                className="bg-white/10 border border-white/20 hover:bg-white/20"
              >
                <Camera className="w-4 h-4 mr-1.5" />
                Change
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleRemove}
              >
                <X className="w-4 h-4 mr-1.5" />
                Remove
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          /* Upload Zone */
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFilePicker}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed
              transition-all duration-300 aspect-[3/4]
              flex flex-col items-center justify-center gap-4 p-6
              ${
                isDragOver
                  ? 'border-violet-500 bg-violet-500/10 scale-[1.02]'
                  : 'border-white/[0.1] bg-white/[0.02] hover:border-white/[0.2] hover:bg-white/[0.04]'
              }
            `}
          >
            <motion.div
              animate={
                isDragOver
                  ? { scale: 1.1, y: -5 }
                  : { scale: 1, y: 0 }
              }
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className={`
                w-16 h-16 rounded-2xl flex items-center justify-center
                ${
                  isDragOver
                    ? 'bg-violet-500/20'
                    : 'bg-white/[0.05]'
                }
              `}
            >
              {isDragOver ? (
                <Upload className="w-8 h-8 text-violet-400" />
              ) : (
                <Camera className="w-8 h-8 text-zinc-400" />
              )}
            </motion.div>

            <div className="text-center">
              <p className="text-[#f5f5f7] font-medium text-sm mb-1">
                {isDragOver ? 'Drop your photo here' : 'Upload your photo'}
              </p>
              <p className="text-zinc-500 text-xs">
                Drag & drop or click to browse
              </p>
              <p className="text-zinc-600 text-xs mt-2">
                JPEG, PNG, WebP • Max {maxSizeMB}MB
              </p>
            </div>

            {/* Decorative corner accents */}
            <div className="absolute top-3 left-3 w-4 h-4 border-l-2 border-t-2 border-white/[0.1] rounded-tl-sm" />
            <div className="absolute top-3 right-3 w-4 h-4 border-r-2 border-t-2 border-white/[0.1] rounded-tr-sm" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-l-2 border-b-2 border-white/[0.1] rounded-bl-sm" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-r-2 border-b-2 border-white/[0.1] rounded-br-sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-3 flex items-center gap-2 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
