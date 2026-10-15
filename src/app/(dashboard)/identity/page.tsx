import { FadeIn, SlideUp, StaggerContainer, StaggerItem, PageTransition } from '@/components/ui/motion';
import { generateUserIntelligence } from '@/lib/intelligence/orchestrator';
import { FitIdentityCard, InsightCard, RecommendationCard } from '@/components/intelligence';
import { tokens } from '@/lib/theme/tokens';

export default async function IdentityDashboard() {
  // In production, we get the userId from Auth context
  const intelligence = await generateUserIntelligence('user_123');

  return (
    <PageTransition className="min-h-screen font-sans p-8 md:p-12" style={{ backgroundColor: tokens.colors.background.primary, color: tokens.colors.text.primary }}>
      <div className="max-w-6xl mx-auto space-y-12">
        
        <SlideUp yOffset={30}>
          <header>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight">
              Home
            </h1>
            <p className="mt-4 text-lg" style={{ color: tokens.colors.text.secondary }}>
              Your intelligence feed. Tailored to your exact geometry.
            </p>
          </header>
        </SlideUp>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FadeIn delay={0.2}>
            <FitIdentityCard identity={intelligence.fitIdentity} />
          </FadeIn>

          <FadeIn delay={0.3}>
            <InsightCard insights={intelligence.insights} />
          </FadeIn>
        </div>

        {/* Measurements - Collapsed by Default */}
        <FadeIn delay={0.4}>
          <details className="group border rounded-2xl cursor-pointer" style={{ borderColor: tokens.colors.border.subtle, backgroundColor: tokens.colors.background.glass }}>
            <summary className="p-6 font-medium flex justify-between items-center outline-none">
              <span className="text-lg">Raw Measurements</span>
              <span className="text-sm transition-transform group-open:rotate-180" style={{ color: tokens.colors.text.muted }}>▼</span>
            </summary>
            <div className="p-6 pt-0 grid grid-cols-2 md:grid-cols-4 gap-4 border-t" style={{ borderColor: tokens.colors.border.subtle }}>
              {Object.entries(intelligence.measurements.measurements).map(([key, value]) => (
                <div key={key} className="mt-4">
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: tokens.colors.text.muted }}>{key}</p>
                  <p className="text-2xl font-light">{value} <span className="text-sm" style={{ color: tokens.colors.text.muted }}>cm</span></p>
                </div>
              ))}
            </div>
          </details>
        </FadeIn>

        {/* Recommendations */}
        <SlideUp delay={0.5}>
          <div className="mb-6">
            <h2 className="text-2xl font-light">Recommended Today</h2>
            <p className="text-sm mt-1" style={{ color: tokens.colors.text.secondary }}>Curated based on your Fit DNA and preferred aesthetics.</p>
          </div>
          <StaggerContainer delayChildren={0.6} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {intelligence.recommendations.map(product => (
              <StaggerItem key={product.id}>
                <RecommendationCard product={product} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </SlideUp>

      </div>
    </PageTransition>
  );
}

