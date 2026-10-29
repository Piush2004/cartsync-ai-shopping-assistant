"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer, fadeInUp } from "@/lib/motion";
import { Card } from "@/components/ui/Card";
import { Ruler, Activity, ShoppingBag, Loader2 } from "lucide-react";
import { getToken } from "@/app/actions/auth";
import { apiClient } from "@/lib/client";
import { graphApi } from "@/lib/graph";

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        const token = await getToken();
        if (!token) return;
        const [data, graph] = await Promise.all([
          apiClient<any[]>('/measurement/history', {
            headers: { Authorization: `Bearer ${token}` },
          }),
          graphApi.getMe(token).catch(() => null),
        ]);
        setHistory(data || []);
        // Real confidence_score from the user's current EffectiveMeasurement
        // (1.0 for manual entry, the actual computed value for camera scans
        // -- see apps/api/routers/measurement.py). This used to be a
        // hardcoded "98%" shown for any user with at least one scan,
        // regardless of what was actually measured or how.
        setConfidenceScore(graph?.effective_measurements?.confidence_score ?? null);
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, []);

  // Format data for timeline
  const formattedHistory = history.map(item => {
    const changes = [];
    if (item.raw_data) {
      if (item.raw_data.chest) changes.push(`Chest updated: ${Math.round(item.raw_data.chest)}cm`);
      if (item.raw_data.waist) changes.push(`Waist updated: ${Math.round(item.raw_data.waist)}cm`);
      if (item.raw_data.height) changes.push(`Height updated: ${Math.round(item.raw_data.height)}cm`);
      if (item.raw_data.weight) changes.push(`Weight updated: ${Math.round(item.raw_data.weight)}kg`);
    }
    if (changes.length === 0) changes.push("Base profile scanned");

    return {
      id: item.id,
      created_at: item.created_at,
      source_type: item.source_type || "Scan",
      changes
    };
  });

  // Real chest-measurement trend from actual scans only -- no interpolation,
  // no placeholder months. The previous version of this panel rendered 6
  // fixed-height bars hardcoded to "Jan"-"Jun" for every user regardless of
  // how many scans they'd actually done.
  const chestTrend = history
    .filter((item) => typeof item.raw_data?.chest === "number")
    .map((item) => ({ date: item.created_at as string, chest: item.raw_data.chest as number }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const maxChest = chestTrend.length > 0 ? Math.max(...chestTrend.map((p) => p.chest)) : 0;
  const minChest = chestTrend.length > 0 ? Math.min(...chestTrend.map((p) => p.chest)) : 0;
  const chestRange = maxChest - minChest || 1;

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-12 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="mb-12">
            <h1 className="text-4xl font-bold text-text-primary tracking-tight">Your Activity & History</h1>
            <p className="text-text-secondary mt-2 text-lg">Track your measurements and style evolution over time.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { icon: Ruler, label: "Total Scans", value: history.length.toString(), color: "text-accent-blue", bg: "bg-accent-blue/10" },
              { icon: ShoppingBag, label: "Purchases Synced", value: "0", color: "text-accent-purple", bg: "bg-accent-purple/10" },
              { icon: Activity, label: "Fit Confidence", value: confidenceScore !== null ? `${Math.round(confidenceScore * 100)}%` : "--", color: "text-accent-emerald", bg: "bg-accent-emerald/10" }
            ].map((stat, idx) => (
              <motion.div key={idx} variants={fadeInUp}>
                <Card className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-muted uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-text-primary mt-1">{stat.value}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
               <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
            </div>
          ) : (
            <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Card className="p-8">
                  <h2 className="text-xl font-bold text-text-primary mb-8">Timeline</h2>
                  <div className="relative pl-4">
                    <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
                    
                    {formattedHistory.length === 0 ? (
                      <div className="py-8 text-text-secondary">No history found. Complete a scan to see your timeline.</div>
                    ) : (
                      <div className="space-y-10">
                        {formattedHistory.map((item) => (
                          <div key={item.id} className="relative pl-8">
                            <div className="absolute left-[-5px] top-1.5 w-3 h-3 rounded-full bg-accent-blue ring-4 ring-bg-card" />
                            <p className="text-sm font-bold text-text-primary">
                              {new Date(item.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                            <p className="text-sm text-text-secondary mt-1">
                              Source: <span className="font-medium text-text-primary">{item.source_type}</span>
                            </p>
                            <div className="mt-3 inline-flex flex-col gap-1 bg-bg-secondary border border-border rounded-lg p-3">
                              {item.changes.map((change, j) => (
                                <span key={j} className="text-sm text-text-primary font-medium flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
                                  {change}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <h3 className="text-sm font-bold text-text-primary mb-4">Chest Trend</h3>
                  {chestTrend.length < 2 ? (
                    <p className="text-sm text-text-secondary py-6 text-center">
                      Not enough scans yet to show a trend. This appears once you have at least two measurements with a chest value.
                    </p>
                  ) : (
                    <>
                      <div className="h-40 w-full flex items-end justify-between px-2 pb-2 border-b border-border relative gap-1">
                        {chestTrend.map((point, i) => (
                          <div
                            key={i}
                            className="flex-1 bg-accent-blue rounded-t-sm"
                            style={{ height: `${10 + ((point.chest - minChest) / chestRange) * 90}%` }}
                            title={`${point.chest.toFixed(1)}cm on ${new Date(point.date).toLocaleDateString()}`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-2 px-2 text-xs text-text-muted font-medium">
                        <span>{new Date(chestTrend[0].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                        <span>{new Date(chestTrend[chestTrend.length - 1].date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                      </div>
                    </>
                  )}
                </Card>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
