"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { graphApi } from '@/lib/graph';
import { authApi } from '@/lib/auth';
import { measurementApi } from '@/lib/measurement';
import { apiClient, ApiError } from '@/lib/client';
import { getToken, logoutAction } from '@/app/actions/auth';
import { AlertCircle, WifiOff, Clock } from 'lucide-react';

import { HeroSection } from '@/components/dashboard/HeroSection';
import { PersonalAssistantCard } from '@/components/dashboard/PersonalAssistantCard';
import { MeasurementCard } from '@/components/dashboard/MeasurementCard';
import { StylistPanel } from '@/components/dashboard/StylistPanel';
import { ProductCard } from '@/components/dashboard/ProductCard';
import { ProfileCompletion } from '@/components/dashboard/ProfileCompletion';
import { KnowledgeGraphCard } from '@/components/dashboard/KnowledgeGraphCard';
import { HistoryTimeline } from '@/components/dashboard/HistoryTimeline';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

import { motion } from 'framer-motion';
import { staggerContainer, fadeInUp, cascadeRight } from '@/lib/motion';

// 'session_expired' isn't a reachable value of this state -- a 401 redirects
// immediately via logoutAction() in the catch block below instead of ever
// rendering a fallback screen, since auto-redirecting straight to login is
// the actual fix (see the catch block's comment). The type only needs the
// reasons that do get rendered.
type DashboardErrorReason = 'rate_limited' | 'network' | 'server';

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [errorReason, setErrorReason] = useState<DashboardErrorReason | null>(null);

  async function loadDashboard() {
    setLoading(true);
    setErrorReason(null);
    try {
        const idToken = await getToken();
        if (!idToken) {
          router.push('/login');
          return;
        }
        setToken(idToken);

        // /product-intelligence/recommendations returns 400 "Missing
        // effective measurements" (not 404) for a brand-new user who hasn't
        // set any measurements yet -- see
        // apps/api/routers/product_intelligence.py. 401 (expired/invalidated
        // token) and 429 (rate limited) are deliberately NOT swallowed here
        // -- they're real, distinct conditions handled in the outer catch
        // below, not "no data yet".
        const [graphRes, recsRes, userRes, historyRes] = await Promise.all([
          graphApi.getMe(idToken).catch((e) => { if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return null; throw e; }),
          apiClient<any>('/product-intelligence/recommendations', {
            headers: {
              Authorization: `Bearer ${idToken}`
            }
          }).catch((e) => { if (e instanceof ApiError && (e.status === 404 || e.status === 400)) return { products: [] }; throw e; }),
          authApi.getMe(idToken).catch((e) => { if (e instanceof ApiError && e.status === 404) return null; throw e; }),
          // Real measurement history (apps/api/routers/measurement.py's
          // /measurement/history) -- the graph response itself was never
          // meant to carry this and never has (see the `measurements`/
          // `hasMeasurements` comment above).
          measurementApi.getHistory(idToken).catch((e) => { if (e instanceof ApiError && e.status === 404) return []; throw e; })
        ]);

        setData({
          graph: graphRes,
          recommendations: recsRes.products || [],
          user: userRes,
          history: historyRes || []
        });

      } catch (err) {
        console.error("Dashboard error:", err);

        // A stale/invalidated JWT (e.g. the dev backend restarted and its
        // signing secret rotated, or a real production token genuinely
        // expired) must never be shown as "servers unavailable" -- there is
        // nothing to retry; the session itself is gone. Clear it and send
        // the user to log in again instead of trapping them on an
        // unrecoverable "Retry Connection" loop.
        if (err instanceof ApiError && err.status === 401) {
          await logoutAction();
          return;
        }

        if (err instanceof ApiError && err.status === 429) {
          setErrorReason('rate_limited');
        } else if (err instanceof ApiError && err.status === undefined) {
          setErrorReason('network');
        } else {
          setErrorReason('server');
        }
      } finally {
        setLoading(false);
      }
    }

  useEffect(() => {
    loadDashboard();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-8">
        <DashboardSkeleton />
      </div>
    );
  }

  if (errorReason) {
    // Honest, differentiated copy per actual cause -- see loadDashboard's
    // catch block. A generic "servers unavailable" message was previously
    // shown for every failure (expired session, rate limiting, a real
    // network outage, or an unexpected server error alike), which was both
    // misleading and, for an expired session specifically, unrecoverable by
    // the "Retry Connection" button it offered (see docs/qa/CURRENT_FULL_SYSTEM_AUDIT.md).
    const copy: Record<DashboardErrorReason, { icon: React.ReactNode; title: string; body: string }> = {
      network: {
        icon: <WifiOff className="w-8 h-8 text-red-500" />,
        title: "Can't reach CartSync",
        body: "We couldn't connect to our servers. Check your internet connection and try again.",
      },
      rate_limited: {
        icon: <Clock className="w-8 h-8 text-accent-amber" />,
        title: "You're going a bit fast",
        body: "You've made a lot of requests in a short time. Wait a minute and try again.",
      },
      server: {
        icon: <AlertCircle className="w-8 h-8 text-red-500" />,
        title: "Something went wrong",
        body: "CartSync ran into an unexpected error loading your dashboard. Please try again.",
      },
    };
    const { icon, title, body } = copy[errorReason];

    return (
      <div className="max-w-7xl mx-auto py-20 px-4 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          {icon}
        </div>
        <h2 className="text-3xl font-bold mb-4 text-text-primary">{title}</h2>
        <p className="text-text-secondary max-w-md mx-auto mb-8">{body}</p>
        <Button variant="primary" size="lg" onClick={loadDashboard}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data?.graph) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-20 max-w-md mx-auto"
      >
        <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-accent">Welcome to CartSync</h2>
        <p className="text-text-secondary mb-8 text-lg">Let's get your profile set up to start receiving personalized recommendations.</p>
        <Button variant="primary" size="lg" onClick={() => router.push('/measurements')}>
          Add Body Measurements
        </Button>
      </motion.div>
    );
  }

  const { graph, recommendations, user, history } = data;
  const user_id = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : (user?.email || "User");
  // BUG this session found and fixed: the backend's /graph/me response has
  // never had a `dimensions` field (see apps/api/schemas/graph.py) -- it's
  // `effective_measurements`. Reading `graph.dimensions` always returned
  // undefined, so the "Current Dimensions" card below silently never
  // rendered for any user, even one with real measurements on file.
  const measurements = graph?.effective_measurements;
  const confidence = measurements?.confidence_score ?? graph?.profile_confidence ?? 0;

  // Calculate dynamic profile completion
  const hasBasicProfile = !!(user?.first_name && user?.email);
  const hasMeasurements = !!measurements;
  const hasStylePreferences = !!graph.preferences && Object.keys(graph.preferences).length > 0;
  const hasBrands = !!graph.brand_affinity && graph.brand_affinity.length > 0;
  const hasRecHistory = !!(history && history.length > 0);
  const hasFeedback = false; // To be integrated with product feedback API
  const hasPhoto = !!user?.avatar;

  let completionPercentage = 0;
  if (hasBasicProfile) completionPercentage += 15;
  if (hasMeasurements) completionPercentage += 30;
  if (hasStylePreferences) completionPercentage += 15;
  if (hasBrands) completionPercentage += 15;
  if (hasRecHistory) completionPercentage += 10;
  if (hasFeedback) completionPercentage += 10;
  if (hasPhoto) completionPercentage += 5;

  return (
    <div className="max-w-7xl mx-auto pb-24">
      <HeroSection 
        user={user}
        email={user_id} 
        confidence={confidence * 100} 
        recommendationsCount={recommendations.length} 
        completionPercentage={completionPercentage} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* Left Column (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Measurement Overview */}
          {measurements && (
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-accent-blue rounded-full" />
                Current Dimensions
              </h2>
              <ErrorBoundary>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {measurements.chest_circumference && <motion.div variants={fadeInUp}><MeasurementCard label="Chest" value={measurements.chest_circumference} confidence={confidence * 100} trend="stable" /></motion.div>}
                  {measurements.waist_circumference && <motion.div variants={fadeInUp}><MeasurementCard label="Waist" value={measurements.waist_circumference} confidence={confidence * 100} trend="down" /></motion.div>}
                  {measurements.hip_circumference && <motion.div variants={fadeInUp}><MeasurementCard label="Hips" value={measurements.hip_circumference} confidence={confidence * 100} /></motion.div>}
                  {measurements.inseam && <motion.div variants={fadeInUp}><MeasurementCard label="Inseam" value={measurements.inseam} confidence={confidence * 100} /></motion.div>}
                </div>
              </ErrorBoundary>
            </motion.div>
          )}

          {/* AI Personal Assistant hub + chat */}
          {token && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="mt-8 space-y-6"
            >
              <ErrorBoundary>
                <PersonalAssistantCard />
              </ErrorBoundary>
              <ErrorBoundary>
                <StylistPanel token={token} />
              </ErrorBoundary>
            </motion.div>
          )}

          {/* Product Recommendations */}
          {recommendations.length > 0 && (
            <motion.div 
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="mt-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="w-1 h-6 bg-accent-purple rounded-full" />
                  Curated For You
                </h2>
              </div>
              <ErrorBoundary>
                <div className="flex overflow-x-auto gap-6 pb-8 pt-2 snap-x px-1 scrollbar-hide">
                  {recommendations.map((rec: any, idx: number) => (
                    <motion.div key={idx} variants={cascadeRight} className="snap-start">
                      <ProductCard product={rec} />
                    </motion.div>
                  ))}
                </div>
              </ErrorBoundary>
            </motion.div>
          )}
        </div>

        {/* Right Column (1/3 width on desktop) */}
        <div className="space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
          >
            <ErrorBoundary>
              <ProfileCompletion 
                percentage={completionPercentage}
                hasBasicProfile={hasBasicProfile}
                hasMeasurements={hasMeasurements}
                hasStylePreferences={hasStylePreferences}
                hasBrands={hasBrands}
                hasRecHistory={hasRecHistory}
                hasFeedback={hasFeedback}
                hasPhoto={hasPhoto}
              />
            </ErrorBoundary>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1 }}
          >
            <ErrorBoundary><KnowledgeGraphCard graph={graph} /></ErrorBoundary>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.2 }}
          >
            <ErrorBoundary><HistoryTimeline history={history || []} /></ErrorBoundary>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.3 }}
          >
            <ErrorBoundary><ActivityFeed history={history || []} /></ErrorBoundary>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
