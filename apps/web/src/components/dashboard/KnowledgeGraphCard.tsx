"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { motion } from "framer-motion";
import { popIn, staggerContainer, fadeInUp } from "@/lib/motion";
import { Activity, GitBranch, Database, ShieldCheck, Clock } from "lucide-react";

interface KnowledgeGraphCardProps {
  graph: any;
}

export function KnowledgeGraphCard({ graph }: KnowledgeGraphCardProps) {
  const version = graph.graph_version || "v1.0.0";
  const lastUpdated = graph.last_updated 
    ? new Date(graph.last_updated).toLocaleDateString()
    : "Never";

  return (
    <Card className="relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-bl-full -z-10" />

      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
            <Database className="w-5 h-5 text-accent-blue" />
            Knowledge Graph
          </h2>
          <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> Version {version}
          </p>
        </div>
        <div className="text-right">
          <Badge variant="default" className="text-xs bg-bg-elevated border-border text-text-primary">
            {graph.profile_confidence ? `${Math.round(graph.profile_confidence)}% Confidence` : 'Learning'}
          </Badge>
          <p className="text-[10px] text-text-muted mt-2 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3" /> {lastUpdated}
          </p>
        </div>
      </div>
      
      <div className="space-y-6">
        
        {/* Style Profile */}
        <motion.div variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1">
             Style DNA
          </p>
          <div className="flex flex-wrap gap-2">
            {graph.preferences?.clothing_styles?.length > 0 ? (
              graph.preferences.clothing_styles.map((style: string, i: number) => (
                <motion.span 
                  key={i} 
                  variants={popIn}
                  className="text-xs text-text-secondary px-2 py-1 rounded bg-bg-elevated border border-border"
                >
                  #{style}
                </motion.span>
              ))
            ) : (
              <span className="text-sm text-text-secondary">Not mapped yet</span>
            )}
            
            {graph.preferences?.fit_preference && (
              <motion.span variants={popIn}>
                 <Badge variant="premium">{graph.preferences.fit_preference} fit</Badge>
              </motion.span>
            )}
          </div>
        </motion.div>

        {/* Brands and Calibration */}
        <motion.div variants={staggerContainer} initial="initial" whileInView="animate" viewport={{ once: true }}>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Brand Affinities & Offsets
          </p>
          <div className="flex flex-wrap gap-2">
            {graph.brand_affinity && graph.brand_affinity.length > 0 ? (
              graph.brand_affinity.map((b: any, i: number) => {
                const offset = graph.calibration_offsets?.[b.brand_id] || b.size_offset || 0;
                return (
                  <motion.div key={i} variants={popIn} className="flex items-center">
                    <Badge variant="default" className="rounded-r-none border-r-0">
                      {b.brand_id.toUpperCase()}
                    </Badge>
                    {offset !== 0 && (
                      <Badge variant="default" className={`rounded-l-none border-l-0 ${offset > 0 ? 'text-accent-blue bg-accent-blue/10' : 'text-accent-rose bg-accent-rose/10'}`}>
                        {offset > 0 ? `+${offset}` : offset}
                      </Badge>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <span className="text-sm text-text-secondary">None selected</span>
            )}
          </div>
        </motion.div>

        {/* Measurements Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-bg-elevated rounded-lg p-3 border border-border">
            <p className="text-[10px] uppercase text-text-muted font-bold mb-1 flex items-center gap-1">
              <Activity className="w-3 h-3" /> Raw Data
            </p>
            <p className="text-sm font-medium text-text-primary">
              {graph.raw_measurements ? 'Captured' : 'Pending'}
            </p>
          </div>
          <div className="bg-bg-elevated rounded-lg p-3 border border-border">
            <p className="text-[10px] uppercase text-text-muted font-bold mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Effective
            </p>
            <p className="text-sm font-medium text-text-primary">
              {graph.effective_measurements ? 'Calibrated' : 'Pending'}
            </p>
          </div>
        </div>

      </div>
    </Card>
  );
}
