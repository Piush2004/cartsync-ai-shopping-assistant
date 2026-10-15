'use client';
import { useState, useEffect } from 'react';
import { BarChart3, Activity, Users, Clock, Camera, Target } from 'lucide-react';
import { PremiumCard, FadeUp, Stagger, StaggerItem, NumberCounter } from '@/components/motion';

interface EventLog {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

export default function AnalyticsDashboard() {
  const [events, setEvents] = useState<EventLog[]>([]);
  
  useEffect(() => {
    // In production, this would fetch from an API
    const stored = JSON.parse(localStorage.getItem('cartsync_events') || '[]');
    setEvents(stored.sort((a: any, b: any) => b.timestamp - a.timestamp));
  }, []);

  const totalScans = events.filter(e => e.name === 'scan_completed').length;
  const avgReadyScore = events.filter(e => e.name === 'readiness_score')
                              .reduce((acc, e) => acc + (e.properties?.score || 0), 0) / 
                              (events.filter(e => e.name === 'readiness_score').length || 1);
  const feedbackEvents = events.filter(e => e.name === 'feedback_submitted');

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 pb-32">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        
        <header className="flex justify-between items-end border-b border-white/10 pb-6">
          <div>
            <div className="text-[#00FFCC] font-mono text-xs tracking-widest uppercase mb-2">CartSync AI Admin</div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">Validation & Intelligence</h1>
          </div>
          <div className="text-gray-500 font-mono text-sm">Real-time local tracking</div>
        </header>

        {/* Top KPI row */}
        <Stagger className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Scans', value: totalScans, icon: Camera },
            { label: 'Avg Readiness Score', value: Math.round(avgReadyScore), icon: Target, suffix: '%' },
            { label: 'Feedback Responses', value: feedbackEvents.length, icon: Users },
            { label: 'Total Events', value: events.length, icon: Activity }
          ].map((kpi, i) => (
            <StaggerItem key={i}>
              <PremiumCard className="p-6 bg-[#0a0a0a] rounded-2xl border border-white/5 flex flex-col gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <kpi.icon className="w-5 h-5 text-[#00FFCC]" />
                </div>
                <div>
                  <div className="text-3xl font-light tracking-tighter">
                    <NumberCounter from={0} to={kpi.value || 0} />{kpi.suffix}
                  </div>
                  <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mt-1">{kpi.label}</div>
                </div>
              </PremiumCard>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          
          {/* Left Column - Performance */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
            <h2 className="text-xl font-bold tracking-tight uppercase">Recent Event Stream</h2>
            <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-1 overflow-hidden h-[500px] flex flex-col">
              <div className="overflow-y-auto p-4 flex flex-col gap-2">
                {events.length === 0 ? (
                  <div className="text-center text-gray-500 p-8 font-mono text-sm">No events recorded yet.</div>
                ) : (
                  events.map((e, i) => (
                    <div key={i} className="bg-black/50 border border-white/5 p-4 rounded-xl flex items-center justify-between group hover:border-[#00FFCC]/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-xs font-mono text-gray-500 w-16">{new Date(e.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</div>
                        <div>
                          <div className="font-bold text-sm tracking-wide text-white">{e.name}</div>
                          <div className="text-xs text-gray-400 font-mono mt-1 break-all">
                            {JSON.stringify(e.properties)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Feedback */}
          <div className="flex flex-col gap-6">
            <h2 className="text-xl font-bold tracking-tight uppercase">User Feedback</h2>
            <div className="flex flex-col gap-4">
              {feedbackEvents.length === 0 ? (
                <div className="text-center text-gray-500 p-8 font-mono text-sm border border-dashed border-white/10 rounded-3xl">No feedback received.</div>
              ) : (
                feedbackEvents.map((fb, i) => (
                  <PremiumCard key={i} className="p-5 bg-[#0a0a0a] rounded-2xl border border-white/5">
                    <div className="text-xs font-mono text-[#00FFCC] uppercase mb-2 tracking-widest">{fb.properties?.promptId || 'Feedback'}</div>
                    <div className="font-bold text-lg mb-1">"{fb.properties?.answer}"</div>
                    <div className="text-xs text-gray-500 font-mono">{new Date(fb.timestamp).toLocaleString()}</div>
                  </PremiumCard>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
