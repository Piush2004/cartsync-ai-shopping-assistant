'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Ruler, CheckCircle2, AlertCircle, TrendingUp, ChevronRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

interface Measurement {
  garment: number;
  user: number;
  fit: string;
}

interface SizingResult {
  recommendedSize: string;
  confidence: number;
  alternativeSize?: string;
  measurements: Record<string, Measurement>;
}

interface SizingPanelProps {
  result: SizingResult | null;
  isLoading: boolean;
  onRequestSizing?: () => void;
}

function ConfidenceRing({ confidence }: { confidence: number }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  const getColor = (c: number) => {
    if (c >= 85) return { stroke: '#22c55e', text: 'text-green-400', label: 'Perfect Fit!' };
    if (c >= 65) return { stroke: '#a78bfa', text: 'text-violet-400', label: 'Good Fit' };
    return { stroke: '#f59e0b', text: 'text-amber-400', label: 'Acceptable' };
  };

  const config = getColor(confidence);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          {/* Background track */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="6"
          />
          {/* Progress arc */}
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={config.stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring' }}
            className={`text-xl font-bold ${config.text}`}
          >
            {confidence}%
          </motion.span>
        </div>
      </div>
      <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
    </div>
  );
}

function FitBadge({ fit }: { fit: string }) {
  const config: Record<string, { bg: string; text: string; border: string }> = {
    Snug: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
    Perfect: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/20' },
    Loose: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
  };

  const style = config[fit] || config.Perfect;

  return (
    <span
      className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${style.bg} ${style.text} border ${style.border}`}
    >
      {fit}
    </span>
  );
}

export default function SizingPanel({
  result,
  isLoading,
  onRequestSizing,
}: SizingPanelProps) {
  if (isLoading) {
    return (
      <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="w-10 h-10" />
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" className="w-32 h-4" />
            <Skeleton variant="text" className="w-20 h-3" />
          </div>
        </div>
        <Skeleton variant="card" className="w-full h-24" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="text" className="w-full h-8" />
          ))}
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
          <Ruler className="w-7 h-7 text-violet-400" />
        </div>
        <h3 className="text-[#f5f5f7] font-semibold mb-1">Get Your Perfect Size</h3>
        <p className="text-zinc-400 text-sm mb-4 max-w-[240px] mx-auto">
          Our AI analyzes your measurements to recommend the ideal fit
        </p>
        {onRequestSizing && (
          <Button
            variant="primary"
            size="md"
            onClick={onRequestSizing}
            className="bg-gradient-to-r from-violet-600 to-indigo-600"
          >
            <Ruler className="w-4 h-4 mr-2" />
            Find My Size
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </motion.div>
    );
  }

  const measurementEntries = Object.entries(result.measurements);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <Ruler className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-[#f5f5f7] font-semibold text-sm">Size Recommendation</h3>
          <p className="text-zinc-500 text-xs">AI-powered fit analysis</p>
        </div>
      </div>

      {/* Main Result */}
      <div className="flex items-center justify-between bg-white/[0.03] rounded-xl p-5 border border-white/[0.04]">
        {/* Recommended Size */}
        <div className="flex flex-col items-center gap-2">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20"
          >
            <span className="text-2xl font-bold text-white">{result.recommendedSize}</span>
          </motion.div>
          <span className="text-xs text-zinc-400">Recommended</span>
        </div>

        {/* Confidence */}
        <ConfidenceRing confidence={result.confidence} />

        {/* Alternative */}
        {result.alternativeSize && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.05] border border-white/[0.1] flex items-center justify-center">
              <span className="text-xl font-semibold text-zinc-300">{result.alternativeSize}</span>
            </div>
            <span className="text-xs text-zinc-500">Alternative</span>
          </div>
        )}
      </div>

      {/* Measurements Table */}
      {measurementEntries.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium mb-3">
            Detailed Measurements
          </p>

          {/* Table Header */}
          <div className="grid grid-cols-4 gap-2 px-3 py-2 text-[11px] text-zinc-500 font-medium">
            <span>Area</span>
            <span className="text-center">Garment</span>
            <span className="text-center">You</span>
            <span className="text-right">Fit</span>
          </div>

          {/* Table Rows */}
          {measurementEntries.map(([area, data], index) => (
            <motion.div
              key={area}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.08, duration: 0.3 }}
              className="grid grid-cols-4 gap-2 px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-sm text-[#f5f5f7] font-medium capitalize">{area}</span>
              <span className="text-sm text-zinc-400 text-center tabular-nums">
                {data.garment}&quot;
              </span>
              <span className="text-sm text-zinc-400 text-center tabular-nums">
                {data.user}&quot;
              </span>
              <div className="flex justify-end">
                <FitBadge fit={data.fit} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
