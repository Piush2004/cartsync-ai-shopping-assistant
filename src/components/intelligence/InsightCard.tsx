import { tokens } from '@/lib/theme/tokens';
import { UserIntelligence } from '@/lib/intelligence/orchestrator';

export function InsightCard({ insights }: { insights: UserIntelligence['insights'] }) {
  return (
    <div 
      className="p-8 rounded-2xl border"
      style={{ 
        backgroundColor: tokens.colors.background.glass, 
        borderColor: tokens.colors.border.subtle,
        backdropFilter: 'blur(12px)'
      }}
    >
      <h2 className="text-xl font-light mb-6" style={{ color: tokens.colors.text.primary }}>Today's Intelligence</h2>
      <ul className="space-y-4">
        {insights.map((insight, i) => {
          let color = tokens.colors.text.secondary;
          if (insight.type === 'positive') color = tokens.colors.accent.success;
          if (insight.type === 'warning') color = tokens.colors.accent.warning;
          
          return (
            <li key={i} className="flex items-start space-x-3">
              <span style={{ color }}>✓</span>
              <span className="text-sm" style={{ color: tokens.colors.text.secondary }}>{insight.message}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
