import { tokens } from '@/lib/theme/tokens';
import { UserIntelligence } from '@/lib/intelligence/orchestrator';

export function FitIdentityCard({ identity }: { identity: UserIntelligence['fitIdentity'] }) {
  return (
    <div 
      className="p-8 rounded-2xl border"
      style={{ 
        backgroundColor: tokens.colors.background.glass, 
        borderColor: tokens.colors.border.subtle,
        backdropFilter: 'blur(12px)'
      }}
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-light mb-1" style={{ color: tokens.colors.text.secondary }}>Fit DNA</h2>
          <p className="text-3xl font-medium tracking-tight" style={{ color: tokens.colors.text.primary }}>
            {identity.primaryFitIntent}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm uppercase tracking-widest mb-1" style={{ color: tokens.colors.text.muted }}>Last Updated</p>
          <p className="font-medium" style={{ color: tokens.colors.text.secondary }}>{identity.lastUpdated}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 rounded-full border flex items-center justify-center" style={{ borderColor: tokens.colors.border.active }}>
          <span className="text-xl font-light" style={{ color: tokens.colors.accent.success }}>{identity.confidenceScore}%</span>
        </div>
        <p className="text-sm" style={{ color: tokens.colors.text.secondary }}>Overall Measurement Confidence</p>
      </div>
    </div>
  );
}
