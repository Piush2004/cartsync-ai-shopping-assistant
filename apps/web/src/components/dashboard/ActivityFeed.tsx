"use client";

import { Card } from "@/components/ui/Card";
import { LogIn, Upload, RefreshCw, Sparkles } from "lucide-react";

interface ActivityFeedProps {
  history: any[];
}

export function ActivityFeed({ history }: ActivityFeedProps) {
  return (
    <Card>
      <h2 className="text-lg font-bold text-text-primary mb-6">Recent Activity</h2>
      
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20 shrink-0">
            <LogIn className="w-4 h-4 text-accent-blue" />
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">Logged in to CartSync</p>
            <p className="text-xs text-text-muted mt-0.5">Just now</p>
          </div>
        </div>

        {history && history.length > 0 && (
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-full bg-accent-purple/10 flex items-center justify-center border border-accent-purple/20 shrink-0">
              <RefreshCw className="w-4 h-4 text-accent-purple" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Knowledge Graph synced</p>
              <p className="text-xs text-text-muted mt-0.5">Dimensions recalibrated</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
