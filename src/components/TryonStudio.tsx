'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { predictSize, SizePrediction } from '@/lib/sizingAgent';
import { Product } from './DiscoverySection';
import { functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User as UserIcon, 
  Sparkles, 
  Scale, 
  Ruler, 
  ShieldAlert, 
  ShieldCheck, 
  Loader2, 
  Undo2, 
  RefreshCw,
  Info
} from 'lucide-react';

interface TryonStudioProps {
  selectedProduct: Product | null;
}

interface ModelPreset {
  id: string;
  name: string;
  gender: 'masculine' | 'feminine';
  imageUrl: string;
  height: number;
  weight: number;
  chest: number;
  waist: number;
}

const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'male_1',
    name: 'Alex (Masculine Preset)',
    gender: 'masculine',
    imageUrl: '/images/masculine_model.png',
    height: 180,
    weight: 78,
    chest: 38,
    waist: 32
  },
  {
    id: 'female_1',
    name: 'Sarah (Feminine Preset)',
    gender: 'feminine',
    imageUrl: '/images/feminine_model.png',
    height: 168,
    weight: 56,
    chest: 34,
    waist: 26
  }
];

export default function TryonStudio({ selectedProduct }: TryonStudioProps) {
  const { profile } = useAuth();
  
  // Model & Biometrics State
  const [selectedModel, setSelectedModel] = useState<ModelPreset>(MODEL_PRESETS[0]);
  const [height, setHeight] = useState(MODEL_PRESETS[0].height);
  const [weight, setWeight] = useState(MODEL_PRESETS[0].weight);
  const [chest, setChest] = useState(MODEL_PRESETS[0].chest);
  const [waist, setWaist] = useState(MODEL_PRESETS[0].waist);
  const [declaredGender, setDeclaredGender] = useState<'masculine' | 'feminine'>(MODEL_PRESETS[0].gender);

  // Sizing Agent State
  const [sizePrediction, setSizePrediction] = useState<SizePrediction | null>(null);

  // VTON Pipeline Execution States
  const [status, setStatus] = useState<'idle' | 'guardrail' | 'gpu' | 'success' | 'failed'>('idle');
  const [guardrailLogs, setGuardrailLogs] = useState<string[]>([]);
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  
  // Before/After comparison slider percentage
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  // Sync biometrics when model preset changes
  const selectPresetModel = (model: ModelPreset) => {
    setSelectedModel(model);
    setHeight(model.height);
    setWeight(model.weight);
    setChest(model.chest);
    setWaist(model.waist);
    setDeclaredGender(model.gender);
  };

  // Run Sizing Agent in real-time
  useEffect(() => {
    if (selectedProduct) {
      const pred = predictSize(
        { height, weight, chest, waist, gender: declaredGender },
        selectedProduct.sizeChart
      );
      setSizePrediction(pred);
    } else {
      setSizePrediction(null);
    }
  }, [height, weight, chest, waist, declaredGender, selectedProduct]);

  // Execute Tryon Pipeline
  const handleTryon = async () => {
    if (!selectedProduct) return;
    if (profile && profile.credits < 1) {
      alert("Insufficient credits! Sign in or wait for grant.");
      return;
    }

    setRejectionError(null);
    setResultImage(null);
    setGuardrailLogs([]);
    setStatus('guardrail');

    // Step-by-step UI updates for Guardrail Agent simulation
    const logs = [
      "Initializing tryon payload transaction...",
      "Charging 1 style credit from wallet...",
      "Activating Mistral Visual Policy Guardrail Agent (mistral-small-latest)...",
      "Scanning user visual metadata against product constraints..."
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise(r => setTimeout(r, 800));
      setGuardrailLogs(prev => [...prev, logs[i]]);
    }

    try {
      // Call Cloud Function `createTryonJob`
      const createTryonJobFn = httpsCallable(functions, 'createTryonJob');
      const payload = {
        userImageUrl: selectedModel.imageUrl,
        garmentId: selectedProduct.id,
        userGender: declaredGender
      };

      const response = await createTryonJobFn(payload);
      const data = response.data as any;

      // Guardrail passed! Proceding to VTON Synthesis
      setGuardrailLogs(prev => [...prev, "Guardrail Verification Passed! Code 200.", "Routing to GPU Synthesis node..."]);
      await new Promise(r => setTimeout(r, 1000));
      
      setStatus('gpu');
      await new Promise(r => setTimeout(r, 1500));

      // Determine correct try-on image mapping based on model + garment
      let imageMap = '/images/vton_result_placeholder.jpg';
      if (selectedModel.id === 'male_1') {
        if (selectedProduct.id === 'amazon_prod_1') {
          imageMap = '/images/tryon_masculine_jacket.png';
        } else if (selectedProduct.id === 'amazon_prod_3') {
          imageMap = '/images/tryon_unisex_hoodie_masculine.png';
        }
      } else if (selectedModel.id === 'female_1') {
        if (selectedProduct.id === 'flipkart_prod_2') {
          imageMap = '/images/tryon_feminine_dress.png';
        } else if (selectedProduct.id === 'amazon_prod_3') {
          imageMap = '/images/tryon_unisex_hoodie_feminine.png';
        }
      }

      setResultImage(imageMap);
      setStatus('success');
    } catch (err: any) {
      console.error(err);
      
      // Mismatch/Guardrail block
      const errorMessage = err.message || "Guardrail validation failed.";
      setRejectionError(errorMessage);
      setStatus('failed');
    }
  };

  const handleSliderMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isResizing) return;
    const container = document.getElementById('slider-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 border border-white/5 bg-neutral-900/10 p-6 rounded-3xl shadow-2xl">
      
      {/* Left Column: Biometrics & Size Agent */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Ruler className="h-5 w-5 text-violet-500" />
            Fit Analytics & Model Presets
          </h2>
          <p className="text-xs text-neutral-400">Provide body biometrics to calculate ideal size tag match</p>
        </div>

        {/* Model Presets */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Select Model Preset
          </label>
          <div className="grid grid-cols-2 gap-4">
            {MODEL_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => selectPresetModel(preset)}
                className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${
                  selectedModel.id === preset.id
                    ? 'border-violet-500 bg-violet-950/15 shadow-md shadow-violet-500/10'
                    : 'border-white/5 bg-neutral-900/40 hover:border-white/10'
                }`}
              >
                <div className="h-10 w-10 overflow-hidden rounded-xl bg-neutral-950 border border-white/5">
                  <img src={preset.imageUrl} alt={preset.name} className="h-full w-full object-cover" />
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white truncate max-w-[120px]">{preset.name}</p>
                  <p className="text-[10px] text-neutral-500 capitalize">{preset.gender}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Biometrics Form */}
        <div className="border border-white/5 bg-neutral-950/40 p-5 rounded-2xl space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-white/5">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Scale className="h-4 w-4 text-violet-400" /> Biometrics Input Sheet
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setDeclaredGender('masculine')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${declaredGender === 'masculine' ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
              >
                M
              </button>
              <button 
                onClick={() => setDeclaredGender('feminine')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${declaredGender === 'feminine' ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-400'}`}
              >
                F
              </button>
            </div>
          </div>

          {/* Sliders */}
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>Height</span>
                <span className="font-bold text-white">{height} cm</span>
              </div>
              <input 
                type="range" min="150" max="210" value={height} 
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>Weight</span>
                <span className="font-bold text-white">{weight} kg</span>
              </div>
              <input 
                type="range" min="40" max="120" value={weight} 
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Chest</span>
                  <span className="font-bold text-white">{chest} in</span>
                </div>
                <input 
                  type="range" min="30" max="52" value={chest} 
                  onChange={(e) => setChest(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-neutral-400 mb-1">
                  <span>Waist</span>
                  <span className="font-bold text-white">{waist} in</span>
                </div>
                <input 
                  type="range" min="22" max="48" value={waist} 
                  onChange={(e) => setWaist(Number(e.target.value))}
                  className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sizing Agent Recommendation Display */}
        <AnimatePresence mode="wait">
          {selectedProduct && sizePrediction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="border border-violet-500/10 bg-violet-950/5 p-4 rounded-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">Sizing Agent Recommendation</span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                  sizePrediction.confidence === 'high' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : sizePrediction.confidence === 'medium'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {sizePrediction.confidence} Confidence
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white">{sizePrediction.recommendedSize}</span>
                <span className="text-xs text-neutral-500">Suggested Tag</span>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed bg-black/30 p-2.5 rounded-xl border border-white/5">
                {sizePrediction.explanation}
              </p>

              {/* Sizing charts mapping */}
              <div className="grid grid-cols-2 gap-4 text-[11px] pt-1">
                <div className="flex items-center justify-between border-r border-white/5 pr-4">
                  <span className="text-neutral-500">Chest Fit:</span>
                  <span className="font-bold text-violet-400">{sizePrediction.chestFit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Waist Fit:</span>
                  <span className="font-bold text-violet-400">{sizePrediction.waistFit}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Column: Virtual Try-On Studio (VTON Agent) */}
      <div className="border border-white/5 bg-neutral-900/30 rounded-3xl p-6 flex flex-col justify-between h-full min-h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-500" />
              VTON Try-On Studio
            </h3>
            <p className="text-[10px] text-neutral-400">Mistral Gated Compliance Verification & GPU Synthesis</p>
          </div>
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">Cost: 1 Credit</span>
        </div>

        {/* Display Screens depending on status */}
        <div className="flex-1 my-6 flex flex-col justify-center items-center">
          <AnimatePresence mode="wait">
            
            {/* Idle State / Product Select */}
            {status === 'idle' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4 max-w-sm py-12"
              >
                {!selectedProduct ? (
                  <div className="space-y-2">
                    <div className="h-16 w-16 rounded-2xl bg-neutral-800/80 border border-white/5 flex items-center justify-center text-neutral-500 mx-auto animate-pulse">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <h4 className="text-sm font-bold text-white">Select a Garment First</h4>
                    <p className="text-xs text-neutral-500">Pick a garment from the Federated Discovery catalog on the left to begin virtual fitting.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-6">
                      <div className="relative h-28 w-20 overflow-hidden rounded-xl border border-white/10 bg-neutral-950 shadow-md">
                        <img src={selectedModel.imageUrl} alt="Model" className="h-full w-full object-cover" />
                      </div>
                      <span className="text-neutral-500 font-extrabold text-lg">+</span>
                      <div className="relative h-28 w-20 overflow-hidden rounded-xl border border-white/10 bg-neutral-950 shadow-md">
                        <img src={selectedProduct.imageUrl} alt="Garment" className="h-full w-full object-cover" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Ready for Synthesis</h4>
                      <p className="text-xs text-neutral-500">Run compilation with Sizing mapping & Mistral guardrail validation.</p>
                    </div>
                    <button
                      onClick={handleTryon}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                    >
                      <Sparkles className="h-4 w-4" /> Synthesize Try-On
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Guardrail Agent Validation State */}
            {status === 'guardrail' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-md space-y-4 bg-neutral-950/50 p-5 border border-white/5 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-violet-500 animate-spin" />
                  <div>
                    <h4 className="text-sm font-bold text-white">Policy Guardrail Active</h4>
                    <p className="text-[10px] text-violet-400 animate-pulse">Running: mistral-small-latest (Mistral 3.1)</p>
                  </div>
                </div>
                
                {/* Terminal style logs */}
                <div className="bg-black/80 rounded-xl p-4 font-mono text-[10px] text-neutral-400 space-y-1.5 h-44 overflow-y-auto border border-white/5">
                  {guardrailLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-violet-500 font-semibold">&gt;</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* GPU Synthesis Processing State */}
            {status === 'gpu' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4 py-12"
              >
                <div className="relative h-16 w-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                  <Sparkles className="h-6 w-6 text-violet-400 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">GPU Synthesis Node Engaged</h4>
                  <p className="text-xs text-neutral-500">Synthesizing clothing texture maps onto model proportions...</p>
                </div>
              </motion.div>
            )}

            {/* Guardrail Policy Rejection (403 Mismatch) */}
            {status === 'failed' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-5 max-w-sm py-6 bg-rose-950/10 border border-rose-500/10 p-6 rounded-2xl"
              >
                <div className="h-14 w-14 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/5">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">Visual Policy Guardrail Violation (403)</h4>
                  <p className="text-xs text-rose-400 font-semibold bg-rose-950/20 py-1.5 px-3 rounded-lg border border-rose-500/10 mt-2">
                    {rejectionError}
                  </p>
                </div>
                <div className="p-3 bg-black/40 rounded-xl text-[10px] text-neutral-400 leading-relaxed text-left flex items-start gap-2 border border-white/5">
                  <Info className="h-4 w-4 text-violet-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Rule:</strong> Cross-gender apparel mappings are blocked before reaching GPU compilation. The spent credit was immediately refunded to your account.
                  </span>
                </div>
                <button
                  onClick={() => setStatus('idle')}
                  className="w-full py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-xs font-semibold text-neutral-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
                >
                  <Undo2 className="h-3.5 w-3.5" /> Adjust Configurations
                </button>
              </motion.div>
            )}

            {/* Success VTON Comparison State */}
            {status === 'success' && resultImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="relative w-full max-w-[280px] h-[380px] rounded-2xl overflow-hidden border border-white/10 bg-neutral-950 shadow-2xl select-none"
                id="slider-container"
                onMouseMove={handleSliderMove}
                onTouchMove={handleSliderMove}
                onMouseDown={() => setIsResizing(true)}
                onTouchStart={() => setIsResizing(true)}
                onMouseUp={() => setIsResizing(false)}
                onTouchEnd={() => setIsResizing(false)}
                onMouseLeave={() => setIsResizing(false)}
              >
                {/* After Image (Synthesis Result) */}
                <img 
                  src={resultImage} 
                  alt="VTON Try-on Result" 
                  className="absolute inset-0 w-full h-full object-cover pointer-events-none" 
                />

                {/* Before Image (Original Model Preset) */}
                <div 
                  className="absolute inset-0 overflow-hidden" 
                  style={{ width: `${sliderPosition}%` }}
                >
                  <img 
                    src={selectedModel.imageUrl} 
                    alt="Original Model" 
                    className="absolute inset-0 w-[280px] h-[380px] object-cover max-w-none pointer-events-none" 
                  />
                </div>

                {/* Slider bar */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg flex items-center justify-center"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[10px] font-extrabold shadow-md border border-neutral-300">
                    ↔
                  </div>
                </div>

                {/* Tags */}
                <div className="absolute left-3 bottom-3 rounded-full bg-black/60 border border-white/10 px-2 py-0.5 text-[9px] font-semibold text-neutral-400 pointer-events-none">
                  Original
                </div>
                <div className="absolute right-3 bottom-3 rounded-full bg-violet-600/70 border border-violet-500/20 px-2 py-0.5 text-[9px] font-semibold text-white pointer-events-none">
                  AI Fit
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer actions */}
        {status === 'success' && (
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button
              onClick={() => setStatus('idle')}
              className="flex-1 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Start New Try-On
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
