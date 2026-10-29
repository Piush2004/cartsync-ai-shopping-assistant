"use client";

import { GlowCard } from "@/components/ui/GlowCard";
import { Button } from "@/components/ui/Button";
import { FitScoreBadge } from "@/components/ui/FitScoreBadge";
import { ShoppingBag } from "lucide-react";
import { TiltCard } from "@/components/effects/TiltCard";
import { trackEvent } from "@/lib/analytics/track";

interface ProductCardProps {
  product: any;
}

export function ProductCard({ product }: ProductCardProps) {
  const { product: info, fit_score, recommended_size, reason } = product;

  return (
    <TiltCard className="w-[340px] shrink-0">
      <GlowCard className="flex flex-col p-0 overflow-hidden group border-border hover:border-accent-blue/30 transition-all h-full relative">
        {/* Image Area with Parallax */}
        <div className="h-56 bg-gradient-to-br from-bg-elevated to-bg-secondary flex items-center justify-center relative overflow-hidden">
          {/* Subtle Parallax Background */}
          <div className="absolute inset-[-20%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 to-transparent opacity-50 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-700 ease-out" />
          {info.image_url ? (
            <img src={info.image_url} alt={info.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out z-10 opacity-90" />
          ) : (
            <ShoppingBag className="w-12 h-12 text-text-tertiary/50 relative z-10 group-hover:scale-110 group-hover:text-accent-blue/50 transition-all duration-500" />
          )}
          {/* Brand Tag */}
          <div className="absolute top-4 left-4 z-20">
            <span className="px-3 py-1 bg-black/40 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-white border border-white/10 group-hover:border-white/30 transition-colors">
              {info.brand}
            </span>
          </div>
        </div>
        
        {/* Content Area */}
        <div className="p-6 flex-1 flex flex-col relative z-10 bg-bg-card">
          <h3 className="text-xl font-bold text-text-primary mb-4 leading-tight group-hover:text-accent-blue transition-colors">
            {info.name}
          </h3>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="flex flex-col items-center justify-center bg-bg-elevated border border-border rounded-lg px-4 py-2 group-hover:border-accent-blue/30 transition-colors">
              <span className="text-[10px] uppercase text-text-muted font-bold tracking-wider mb-0.5">Size</span>
              <span className="text-xl font-black text-text-primary leading-none">{recommended_size}</span>
            </div>
            <div className="group-hover:scale-105 transition-transform">
              <FitScoreBadge score={fit_score} />
            </div>
          </div>
          
          <div className="mb-6 flex-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Why this fits</p>
            <ul className="space-y-2">
              {reason.slice(0, 3).map((r: string, i: number) => (
                <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                  <span className="text-accent-blue mt-1">•</span> 
                  <span className="leading-snug">{r}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Animated Button Reveal */}
          <div className="mt-auto overflow-hidden rounded-xl">
            <div className="translate-y-2 opacity-80 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 ease-out">
              <Button 
                variant="primary" 
                className="w-full"
                onClick={() => {
                  trackEvent('product_clicked', {
                    product_id: info.id || info.name,
                    product_name: info.name,
                    brand: info.brand,
                    fit_score,
                    recommended_size
                  });
                }}
              >
                Shop Now
              </Button>
            </div>
          </div>
        </div>
      </GlowCard>
    </TiltCard>
  );
}
