"use client";

import { Card } from "@/components/ui/Card";
import { Clock, User, ArrowRight, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, popIn, drawLine } from "@/lib/motion";
import { Button } from "@/components/ui/Button";

interface HistoryTimelineProps {
  history: any[];
}

export function HistoryTimeline({ history }: HistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center h-full space-y-4">
        <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center">
          <User className="w-8 h-8 text-accent-blue" />
        </div>
        <div>
          <p className="text-text-primary font-bold">Let's build your fit profile</p>
          <p className="text-sm text-text-secondary mt-2 max-w-[250px] leading-relaxed">
            Add your first set of measurements to unlock personalized styling and size recommendations.
          </p>
        </div>
        <div className="flex flex-col w-full gap-2 pt-2">
          <Button variant="primary" onClick={() => window.location.href = '/measurements'} className="flex items-center justify-center gap-2">
            Enter Manually <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" onClick={() => window.location.href = '/measurements/camera'} className="flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" /> Use Camera Scanner
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-bold text-text-primary mb-6">History</h2>
      
      <div className="relative pl-3">
        {/* Animated Vertical line */}
        <motion.div 
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={drawLine}
          className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-accent-blue via-border to-transparent origin-top" 
        />
        
        <motion.div 
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="space-y-8"
        >
          {history.slice(0, 4).map((item: any, idx: number) => (
            <div key={item.id} className="relative pl-6">
              {/* Animated Dot */}
              <motion.div 
                variants={popIn}
                className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-accent-blue ring-4 ring-bg-card" 
              />
              
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * idx + 0.3 }}
              >
                <p className="text-sm font-semibold text-text-primary">
                  {new Date(item.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-sm text-text-secondary mt-1">
                  Measurements via <span className="text-text-primary font-medium">{item.source_type}</span>
                </p>
              </motion.div>
            </div>
          ))}
        </motion.div>
      </div>
    </Card>
  );
}
