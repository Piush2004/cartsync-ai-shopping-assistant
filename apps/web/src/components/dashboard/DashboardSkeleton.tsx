"use client";

import { GlowCard } from "@/components/ui/GlowCard";
import { Skeleton } from "@/components/ui/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-12 w-full animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="flex flex-wrap gap-4 mt-8">
          <Skeleton className="h-[64px] w-48 rounded-full" />
          <Skeleton className="h-[64px] w-48 rounded-full" />
          <Skeleton className="h-[64px] w-48 rounded-full" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-12">
          {/* Measurements Grid Skeleton */}
          <section>
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <GlowCard key={i} className="p-4 border-border/50">
                  <div className="flex justify-between items-center mb-4">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <Skeleton className="w-12 h-4" />
                  </div>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-2 w-full" />
                </GlowCard>
              ))}
            </div>
          </section>

          {/* AI Stylist Panel Skeleton */}
          <section>
            <Skeleton className="h-8 w-32 mb-6" />
            <GlowCard className="h-[500px] p-0 flex flex-col border-border/50">
              <div className="p-4 border-b border-border/50 flex justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <div className="p-6 flex-1 space-y-6">
                <div className="flex justify-start">
                  <Skeleton className="h-24 w-3/4 rounded-2xl rounded-tl-sm" />
                </div>
                <div className="flex justify-end">
                  <Skeleton className="h-16 w-1/2 rounded-2xl rounded-tr-sm" />
                </div>
                <div className="flex justify-start">
                  <Skeleton className="h-32 w-2/3 rounded-2xl rounded-tl-sm" />
                </div>
              </div>
              <div className="p-6 pt-2">
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
            </GlowCard>
          </section>
        </div>

        {/* Right Column Skeleton */}
        <div className="space-y-8">
          <GlowCard className="h-48 border-border/50">
            <Skeleton className="h-6 w-32 mb-6" />
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </GlowCard>

          <GlowCard className="h-64 border-border/50">
            <Skeleton className="h-6 w-48 mb-6" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
