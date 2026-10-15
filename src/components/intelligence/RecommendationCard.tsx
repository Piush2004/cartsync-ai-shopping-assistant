import { tokens } from '@/lib/theme/tokens';
import { RankedProduct } from '@/lib/intelligence/product/types';

export function RecommendationCard({ product }: { product: RankedProduct }) {
  return (
    <div 
      className="rounded-2xl border overflow-hidden flex flex-col"
      style={{ 
        backgroundColor: tokens.colors.background.glass, 
        borderColor: tokens.colors.border.subtle 
      }}
    >
      {/* Placeholder for image */}
      <div className="aspect-[3/4] w-full bg-white/5 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs uppercase tracking-widest text-white/30">Image</span>
        </div>
        <div className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: tokens.colors.accent.success, color: tokens.colors.background.primary }}>
          {product.overallRankScore}% Match
        </div>
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{ color: tokens.colors.text.muted }}>{product.brandSlug}</p>
            <h3 className="font-medium text-lg leading-tight" style={{ color: tokens.colors.text.primary }}>{product.title}</h3>
          </div>
          <p className="font-medium" style={{ color: tokens.colors.text.primary }}>{product.currency}{product.price}</p>
        </div>
        
        <div className="mt-4 pt-4 border-t" style={{ borderColor: tokens.colors.border.subtle }}>
          <p className="text-sm font-medium mb-1" style={{ color: tokens.colors.text.secondary }}>
            Size <span style={{ color: tokens.colors.text.primary }}>{product.recommendedSize}</span>
          </p>
          {product.reasons.length > 0 && (
            <p className="text-xs" style={{ color: tokens.colors.text.muted }}>{product.reasons[0]}</p>
          )}
        </div>
      </div>
    </div>
  );
}
