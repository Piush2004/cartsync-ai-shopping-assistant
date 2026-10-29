"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/app/actions/auth';
import { measurementApi } from '@/lib/measurement';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { GlowCard } from '@/components/ui/GlowCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/motion';
import { Ruler, Save, RefreshCw, Loader2, Camera } from 'lucide-react';
import { graphApi } from '@/lib/graph';
import Link from 'next/link';
import { toast } from 'sonner';

export default function MeasurementsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState('');
  
  const [height, setHeight] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [shoulders, setShoulders] = useState('');
  const [inseam, setInseam] = useState('');

  useEffect(() => {
    async function loadExistingData() {
      try {
        const token = await getToken();
        if (!token) return;
        const graph = await graphApi.getMe(token);
        
        if (graph?.effective_measurements) {
          const m = graph.effective_measurements;
          if (m.chest_circumference) setChest(m.chest_circumference.toString());
          if (m.waist_circumference) setWaist(m.waist_circumference.toString());
          if (m.hip_circumference) setHips(m.hip_circumference.toString());
          if (m.shoulder_width) setShoulders(m.shoulder_width.toString());
          if (m.inseam) setInseam(m.inseam.toString());
        }
        
        // Load raw data for height if it's there (since effective doesn't have height)
        if (graph?.raw_measurements?.height) {
           setHeight(graph.raw_measurements.height.toString());
        }
      } catch (err) {
        console.error("Failed to load existing measurements", err);
      } finally {
        setInitialLoad(false);
      }
    }
    loadExistingData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');

      const data = {
        height: parseFloat(height) || undefined,
        chest: parseFloat(chest) || undefined,
        waist: parseFloat(waist) || undefined,
        hips: parseFloat(hips) || undefined,
        shoulders: parseFloat(shoulders) || undefined,
        inseam: parseFloat(inseam) || undefined,
        source: 'manual_entry'
      };

      await measurementApi.extract(token, { source_type: data.source, raw_data: data });
      toast.success('Your style profile has been refreshed.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
      setError(err.message || 'Failed to upload measurements');
      setLoading(false);
    }
  };

  if (initialLoad) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div 
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="max-w-3xl mx-auto"
      >
        <motion.div variants={fadeInUp} className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-text-primary flex items-center gap-3">
              <Ruler className="w-8 h-8 text-accent-blue" />
              Body Measurements
            </h1>
            <p className="mt-2 text-text-secondary">
              Update your measurements to get more accurate sizing recommendations across all brands.
            </p>
          </div>
          
          <Link href="/measurements/camera">
            <Button variant="outline" className="flex items-center gap-2 border-accent-blue/30 text-accent-blue hover:bg-accent-blue/10">
              <Camera className="w-4 h-4" />
              Use Camera Scanner
            </Button>
          </Link>
        </motion.div>

        {error && (
          <motion.div variants={fadeInUp} className="mb-6 p-4 bg-accent-rose/10 border border-accent-rose/20 rounded-xl text-accent-rose text-sm font-medium">
            {error}
          </motion.div>
        )}

        <GlowCard className="p-8">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <motion.div variants={staggerItem} className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2">Core Dimensions (cm)</h3>
                  <div className="space-y-4">
                    <Input
                      label="Height"
                      type="number"
                      value={height}
                      onChange={e => setHeight(e.target.value)}
                      placeholder="e.g. 175"
                      icon={<span className="text-xs font-bold text-text-muted">HT</span>}
                    />
                    <Input
                      label="Chest"
                      type="number"
                      value={chest}
                      onChange={e => setChest(e.target.value)}
                      placeholder="e.g. 95"
                      icon={<span className="text-xs font-bold text-text-muted">CH</span>}
                    />
                    <Input
                      label="Waist"
                      type="number"
                      value={waist}
                      onChange={e => setWaist(e.target.value)}
                      placeholder="e.g. 80"
                      icon={<span className="text-xs font-bold text-text-muted">WS</span>}
                    />
                  </div>
                </div>
              </motion.div>

              <motion.div variants={staggerItem} className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2">Detailed Proportions (cm)</h3>
                  <div className="space-y-4">
                    <Input
                      label="Hips"
                      type="number"
                      value={hips}
                      onChange={e => setHips(e.target.value)}
                      placeholder="e.g. 100"
                      icon={<span className="text-xs font-bold text-text-muted">HP</span>}
                    />
                    <Input
                      label="Shoulders"
                      type="number"
                      value={shoulders}
                      onChange={e => setShoulders(e.target.value)}
                      placeholder="e.g. 45"
                      icon={<span className="text-xs font-bold text-text-muted">SH</span>}
                    />
                    <Input
                      label="Inseam"
                      type="number"
                      value={inseam}
                      onChange={e => setInseam(e.target.value)}
                      placeholder="e.g. 80"
                      icon={<span className="text-xs font-bold text-text-muted">IN</span>}
                    />
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div variants={fadeInUp} className="mt-10 pt-6 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-text-muted text-sm">
                <RefreshCw className="w-4 h-4" />
                <span>Your style profile will automatically refresh after saving</span>
              </div>
              <Button type="submit" variant="primary" loading={loading} icon={<Save className="w-4 h-4" />}>
                Update Profile
              </Button>
            </motion.div>
          </form>
        </GlowCard>
      </motion.div>
    </DashboardLayout>
  );
}
