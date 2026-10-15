'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STAGES = [
  { id: "uploading", label: "Uploading Media" },
  { id: "pose", label: "Detecting Body Topology" },
  { id: "depth", label: "Estimating 3D Depth" },
  { id: "calibration", label: "Calibrating Skeleton" },
  { id: "measurement", label: "Recovering Measurements" },
  { id: "recommendation", label: "Ranking AI Fit Scores" },
  { id: "completed", label: "Complete" }
];

export default function ProcessingOverlay({ jobId, onComplete }: { jobId: string, onComplete: () => void }) {
  const [currentStageId, setCurrentStageId] = useState<string>("uploading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (!res.ok) throw new Error("Failed to fetch job status");
        
        const data = await res.json();
        
        if (data.error) {
          setError(data.error);
          clearInterval(interval);
          return;
        }

        if (data.stage) setCurrentStageId(data.stage);

        if (data.stage === "completed") {
          clearInterval(interval);
          setTimeout(onComplete, 1500);
        }
      } catch (err: any) {
        console.error(err);
        setError("Network interruption or timeout during inference. Please try again.");
        clearInterval(interval);
      }
    };

    interval = setInterval(pollStatus, 1500);
    pollStatus();

    return () => clearInterval(interval);
  }, [jobId, onComplete]);

  const currentIndex = STAGES.findIndex(s => s.id === currentStageId);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="glass-card p-10 rounded-3xl max-w-md w-full border border-white/10 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle animated background glow */}
          <motion.div 
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              scale: [1, 1.2, 1] 
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,rgba(0,255,204,0.05)_0%,transparent_50%)] pointer-events-none" 
          />

          <div className="flex items-center justify-center mb-8 relative z-10">
            <div className="w-20 h-20 bg-black/50 border border-white/5 rounded-full flex items-center justify-center relative shadow-[0_0_30px_rgba(0,255,204,0.1)]">
              {error ? (
                <AlertTriangle className="w-8 h-8 text-red-500" />
              ) : currentStageId !== "completed" ? (
                <Loader2 className="w-8 h-8 text-[#00FFCC] animate-spin" />
              ) : (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <CheckCircle2 className="w-10 h-10 text-[#00FFCC]" />
                </motion.div>
              )}
            </div>
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight text-center mb-8 text-white relative z-10">
            {error ? "Processing Failed" : "Analyzing Scan"}
          </h2>

          {error && (
            <div className="mb-8 p-4 bg-red-950/50 border border-red-500/20 text-red-200 rounded-xl text-sm relative z-10">
              {error}
            </div>
          )}

          <div className="space-y-6 relative z-10">
            {STAGES.map((stage, idx) => {
              const isCompleted = idx < currentIndex || currentStageId === "completed";
              const isCurrent = idx === currentIndex && !error;
              
              return (
                <div key={stage.id} className="flex items-center gap-4">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#00FFCC] flex-shrink-0" />
                  ) : isCurrent ? (
                    <motion.div 
                      animate={{ opacity: [0.5, 1, 0.5] }} 
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Circle className="w-5 h-5 text-[#00FFCC] flex-shrink-0 fill-[#00FFCC]/20" />
                    </motion.div>
                  ) : (
                    <Circle className="w-5 h-5 text-gray-700 flex-shrink-0" />
                  )}
                  <span className={`text-sm tracking-wide ${isCurrent ? 'text-white font-medium' : isCompleted ? 'text-gray-400' : 'text-gray-700'}`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>

          {error && (
            <button 
              onClick={onComplete}
              className="mt-8 w-full bg-white text-black py-3 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-gray-200 transition-colors relative z-10"
            >
              Close
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
