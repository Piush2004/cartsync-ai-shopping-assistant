import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface MeasurementCardProps {
  label: string;
  data: {
    value: number | null;
    status: string;
    confidence: number;
  };
}

export default function MeasurementCard({ label, data }: MeasurementCardProps) {
  const { value, status, confidence } = data;
  const isSuccess = status === "success" && value !== null;

  return (
    <div className="group border-b border-white/10 pb-4 last:border-0 last:pb-0">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-medium uppercase tracking-widest text-gray-400 group-hover:text-white transition-colors">
          {label.replace('_', ' ')}
        </h3>
        {isSuccess ? (
          <span className="text-[#00FFCC] text-xs font-mono">{Math.round(confidence * 100)}%</span>
        ) : (
          <AlertCircle className="w-4 h-4 text-red-500" />
        )}
      </div>
      
      <div className="flex items-baseline gap-1">
        {isSuccess ? (
          <>
            <span className="text-3xl font-light tracking-tighter text-white">{value}</span>
            <span className="text-gray-500 font-mono text-sm">cm</span>
          </>
        ) : (
          <span className="text-lg font-light text-gray-600">Unavailable</span>
        )}
      </div>
    </div>
  );
}
