'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Camera, Check, Ruler, Sun, User, Upload, ArrowRight, ShieldCheck, Shirt } from 'lucide-react';
import Image from 'next/image';

import { FadeUp, FadeIn, TextReveal, HeroReveal, Stagger, StaggerItem, PremiumCard, MotionButton, NumberCounter, GlassSkeleton } from '@/components/motion';
import { Motion, fadeUp, fadeIn, slideRight, scaleIn, blurReveal, staggerContainer, staggerItem, cardPress } from '@/lib/motion';
import Script from 'next/script';

import { useCamera } from '@/lib/camera/useCamera';
import { initPoseDetection, estimatePose } from '@/lib/camera/pose';
import { analyzeFrameQuality, QualityMetrics } from '@/lib/camera/quality';
import { evaluatePoseReadiness, ReadinessState } from '@/lib/camera/readiness';
import { CameraDebugOverlay } from '@/components/scan/CameraDebugOverlay';
import { trackEvent } from '@/lib/analytics';
import { FeedbackPrompt } from '@/components/ui/FeedbackPrompt';
// Pose import removed

const STAGES = [
  'PREVIEW',
  'WELCOME',
  'PREPARATION',
  'ENVIRONMENT',
  'DISTANCE',
  'FRONT_CAPTURE',
  'SIDE_CAPTURE',
  'VERIFICATION',
  'ANALYSIS',
  'COMPLETION'
];

export default function FitSession() {
  const [stageIndex, setStageIndex] = useState(0);
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [sideImage, setSideImage] = useState<string | null>(null);
  
  // Environment Check states
  const [envScore, setEnvScore] = useState(0); // 0 to 100
  
  // Analysis states
  const [analysisText, setAnalysisText] = useState('Understanding your proportions...');

  const router = useRouter();

  const nextStage = () => setStageIndex(i => Math.min(i + 1, STAGES.length - 1));
  const prevStage = () => setStageIndex(i => Math.max(i - 1, 0));
  
  const currentStage = STAGES[stageIndex];

  // Camera Integration
  const { stream, error, startCamera, stopCamera, videoRef } = useCamera();
  const [isDebug, setIsDebug] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  
  const [pose, setPose] = useState<any>(null);
  const [quality, setQuality] = useState<QualityMetrics | null>(null);
  const [readiness, setReadiness] = useState<ReadinessState | null>(null);
  const [fps, setFps] = useState(0);

  const [frontQualityScore, setFrontQualityScore] = useState(0);
  const [sideQualityScore, setSideQualityScore] = useState(0);

  const isCaptureStage = currentStage === 'FRONT_CAPTURE' || currentStage === 'SIDE_CAPTURE';
  const offscreenCanvasRef = useRef<HTMLCanvasElement>(null);
  const readyStartTime = useRef<number | null>(null);
  const lastFrameTime = useRef<number>(0);
  const videoWidth = videoRef.current?.videoWidth || 480;
  const videoHeight = videoRef.current?.videoHeight || 640;

  // Handle Debug Toggle
  const handleTitleClick = () => {
    setClickCount(prev => {
      if (prev + 1 >= 5) {
        setIsDebug(!isDebug);
        return 0;
      }
      return prev + 1;
    });
  };

  // Edge AI Processing Loop
  useEffect(() => {
    let animationFrameId: number;
    let isActive = true;

    lastFrameTime.current = performance.now();

    const processFrame = async () => {
      if (!isActive || !isCaptureStage || !videoRef.current) return;
      const video = videoRef.current;

      if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
        const now = performance.now();
        setFps(1000 / (now - lastFrameTime.current));
        lastFrameTime.current = now;

        const canvas = offscreenCanvasRef.current;
        let currentQuality: QualityMetrics | null = null;
        
        if (canvas) {
          if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            currentQuality = analyzeFrameQuality(video, canvas, ctx);
            setQuality(currentQuality);
          }
        }

        const currentPose = await estimatePose(video);
        setPose(currentPose);

        const isSideProfile = currentStage === 'SIDE_CAPTURE';
        const currentReadiness = evaluatePoseReadiness(currentPose, video.videoWidth, video.videoHeight, isSideProfile);
        setReadiness(currentReadiness);

        if (currentReadiness.isReady && currentQuality) {
          if (readyStartTime.current === null) {
            readyStartTime.current = now;
          } else if (now - readyStartTime.current > 1000) {
            // Auto-Capture after 1 second of being ready
            if (canvas) {
              const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
              const score = Math.round((currentQuality.lightingScore * 0.5 + currentQuality.blurScore * 0.5) * 100);
              
              if (isSideProfile) {
                setSideImage(dataUrl);
                setSideQualityScore(score);
              } else {
                setFrontImage(dataUrl);
                setFrontQualityScore(score);
              }
              trackEvent('readiness_score', { score, side: isSideProfile });
              readyStartTime.current = null;
              isActive = false;
              nextStage();
              return;
            }
          }
        } else {
          readyStartTime.current = null;
        }
      }

      if (isActive) {
        animationFrameId = requestAnimationFrame(processFrame);
      }
    };

    if (isCaptureStage) {
      readyStartTime.current = null;
      processFrame();
    }

    return () => {
      isActive = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isCaptureStage, currentStage]);

  // Stop camera if leaving page entirely
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Simulated Environment Check
  useEffect(() => {
    if (currentStage === 'ENVIRONMENT') {
      const interval = setInterval(() => {
        setEnvScore(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [currentStage]);

  // Simulated Analysis
  useEffect(() => {
    if (currentStage === 'ANALYSIS') {
      const messages = [
        'Understanding your proportions...',
        'Building your Fit Profile...',
        'Comparing thousands of sizing patterns...',
        'Finding products made for you...'
      ];
      let i = 0;
      const interval = setInterval(() => {
        i++;
        if (i < messages.length) {
          setAnalysisText(messages[i]);
        } else {
          clearInterval(interval);
          setTimeout(() => nextStage(), 1000);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentStage]);

  // Animation Variants
  const slideVariants = {
    enter: { opacity: 0, x: Motion.distance.normal },
    center: { opacity: 1, x: 0, transition: { duration: Motion.duration.normal, ease: Motion.ease.emphasized } },
    exit: { opacity: 0, x: -Motion.distance.normal, transition: { duration: Motion.duration.fast, ease: Motion.ease.accelerate } }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden flex flex-col justify-between">
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs" strategy="lazyOnload" />
      <Script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/pose-detection" strategy="lazyOnload" />
      
      {/* Top Bar - Progress */}
      <header className="p-8 flex justify-center w-full z-50">
        <div className="w-full max-w-md h-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-[#00FFCC]"
            initial={{ width: 0 }}
            animate={{ width: `${((stageIndex + 1) / STAGES.length) * 100}%` }}
            transition={{ ease: Motion.ease.standard, duration: Motion.duration.normal }}
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-4 relative w-full max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* STAGE 0: PREVIEW */}
          {currentStage === 'PREVIEW' && (
            <motion.div 
              key="preview"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              className="flex flex-col items-center text-center max-w-lg w-full"
            >
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-12">WHAT YOU'LL GET</h1>
              <div className="flex flex-col gap-6 w-full text-left bg-[#111] p-8 rounded-3xl border border-white/10">
                <div className="text-sm font-mono tracking-widest text-[#00FFCC] uppercase mb-4">Your Fit Profile Includes</div>
                <Stagger className="flex flex-col gap-6 w-full">
                  {[
                    { icon: Ruler, text: '20+ Body Measurements' },
                    { icon: Shirt, text: 'Brand-specific Size Recommendations' },
                    { icon: ShieldCheck, text: 'AI Fit Report' },
                    { icon: Check, text: 'Curated Product Matches' }
                  ].map((item, i) => (
                    <StaggerItem key={i} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                        <item.icon className="w-4 h-4 text-[#00FFCC]" />
                      </div>
                      <span className="text-lg font-light tracking-wide">{item.text}</span>
                    </StaggerItem>
                  ))}
                </Stagger>
              </div>
              <div className="mt-12 w-full">
                <MotionButton 
                  onClick={nextStage}
                  className="w-full py-5 font-black uppercase tracking-widest rounded-full"
                >
                  Continue
                </MotionButton>
              </div>
            </motion.div>
          )}

          {/* STAGE 1: WELCOME */}
          {currentStage === 'WELCOME' && (
            <motion.div 
              key="welcome"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              className="flex flex-col items-center text-center max-w-lg w-full"
            >
              <HeroReveal className="mb-6">
                <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
                  LET'S BUILD <br/> <span className="text-gray-600">YOUR FIT PROFILE.</span>
                </h1>
              </HeroReveal>
              <TextReveal className="mb-16">
                <p className="text-gray-400 font-light text-lg tracking-wide">
                  This takes less than 30 seconds.
                </p>
              </TextReveal>
              <div className="w-full">
                <MotionButton 
                  onClick={() => { trackEvent('scan_started'); nextStage(); }}
                  className="w-full py-5 font-black uppercase tracking-widest rounded-full"
                >
                  Begin
                </MotionButton>
              </div>
            </motion.div>
          )}

          {/* STAGE 2: PREPARATION */}
          {currentStage === 'PREPARATION' && (
            <motion.div 
              key="prep"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              className="flex flex-col max-w-lg w-full"
            >
              <h2 className="text-3xl font-black tracking-tighter mb-8 uppercase text-center">Preparation</h2>
              <Stagger className="flex flex-col gap-4">
                {[
                  { title: 'Wear fitted clothing', desc: 'Avoid loose or baggy items.' },
                  { title: 'Stand naturally', desc: 'Relax your posture.' },
                  { title: 'Good lighting', desc: 'Avoid backlighting or harsh shadows.' },
                  { title: 'Camera at chest height', desc: 'Keep the phone vertical.' }
                ].map((item, i) => (
                  <StaggerItem key={i}>
                    <PremiumCard className="flex items-center gap-6 p-6 rounded-2xl bg-[#0a0a0a] border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-[#00FFCC] flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-black" />
                      </div>
                      <div>
                        <div className="font-bold tracking-tight">{item.title}</div>
                        <div className="text-sm text-gray-500 font-light">{item.desc}</div>
                      </div>
                    </PremiumCard>
                  </StaggerItem>
                ))}
              </Stagger>
              <div className="mt-12 w-full">
                <MotionButton 
                  onClick={nextStage}
                  className="w-full py-5 font-black uppercase tracking-widest rounded-full"
                >
                  I'm Ready
                </MotionButton>
              </div>
            </motion.div>
          )}

          {/* STAGE 3: ENVIRONMENT CHECK */}
          {currentStage === 'ENVIRONMENT' && (
            <motion.div 
              key="env"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              className="flex flex-col items-center max-w-lg w-full"
            >
              <h2 className="text-3xl font-black tracking-tighter mb-12 uppercase text-center">AI Readiness</h2>
              
              <div className="w-48 h-48 rounded-full border-2 border-white/10 flex items-center justify-center relative mb-12">
                <motion.svg className="absolute inset-0 w-full h-full -rotate-90">
                  <motion.circle 
                    cx="96" cy="96" r="94"
                    fill="none" stroke="#00FFCC" strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 94}
                    strokeDashoffset={2 * Math.PI * 94 * (1 - envScore / 100)}
                    transition={{ duration: Motion.duration.instant }}
                  />
                </motion.svg>
                <div className="text-5xl font-light tracking-tighter">{envScore}<span className="text-2xl text-gray-500">%</span></div>
              </div>

              <Stagger className="grid grid-cols-2 gap-4 w-full">
                {[
                  { label: 'Lighting', ready: envScore > 30 },
                  { label: 'Distance', ready: envScore > 60 },
                  { label: 'Posture', ready: envScore > 80 },
                  { label: 'Camera', ready: envScore > 95 }
                ].map((item, i) => (
                  <StaggerItem key={i}>
                    <div className="flex flex-col items-center p-4 bg-[#111] rounded-2xl border border-white/5">
                      <div className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-2">{item.label}</div>
                      <div className={`font-bold tracking-widest uppercase text-sm ${item.ready ? 'text-[#00FFCC]' : 'text-gray-600'}`}>
                        {item.ready ? 'Ready' : 'Checking'}
                      </div>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>

              <motion.div 
                animate={{ opacity: envScore === 100 ? 1 : 0.5 }}
                className={`mt-12 w-full ${envScore < 100 ? 'pointer-events-none' : ''}`}
              >
                <MotionButton 
                  onClick={async () => {
                    await initPoseDetection();
                    await startCamera();
                    nextStage();
                  }}
                  className="w-full py-5 font-black uppercase tracking-widest rounded-full"
                >
                  Initialize Camera
                </MotionButton>
              </motion.div>
            </motion.div>
          )}

          {/* STAGE 4: DISTANCE GUIDE */}
          {currentStage === 'DISTANCE' && (
            <motion.div 
              key="distance"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              className="flex flex-col items-center text-center max-w-lg w-full"
            >
              <FadeUp className="mb-12 flex flex-col items-center">
                <h2 className="text-3xl font-black tracking-tighter mb-4 uppercase text-center">Distance Guide</h2>
                <p className="text-gray-400 font-light">Position your phone exactly 2 meters (6.5 ft) away.</p>
              </FadeUp>
              
              <div className="relative w-full aspect-square border border-white/10 rounded-3xl bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,204,0.05),transparent_70%)]" />
                <User className="w-32 h-32 text-white/20 absolute left-1/4" strokeWidth={1} />
                <motion.div 
                  className="absolute bottom-1/4 left-1/4 h-[1px] bg-[#00FFCC]/50 border-dashed"
                  initial={{ width: 0 }}
                  animate={{ width: "50%" }}
                  transition={{ duration: Motion.duration.cinematic, repeat: Infinity }}
                />
                <Camera className="w-12 h-12 text-[#00FFCC] absolute right-1/4" strokeWidth={1} />
                <div className="absolute bottom-12 font-mono text-xs tracking-widest text-[#00FFCC] uppercase">2 Meters / 6.5 FT</div>
              </div>

              <div className="mt-12 w-full">
                <MotionButton 
                  onClick={nextStage}
                  className="w-full py-5 font-black uppercase tracking-widest rounded-full"
                >
                  I understand
                </MotionButton>
              </div>
            </motion.div>
          )}

          {/* STAGE 5 & 6: CAPTURE */}
          {(currentStage === 'FRONT_CAPTURE' || currentStage === 'SIDE_CAPTURE') && (
            <motion.div 
              key={currentStage}
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              className="flex flex-col items-center w-full max-w-md relative"
            >
              <h2 
                className="text-4xl font-black tracking-tighter mb-2 uppercase text-center cursor-default"
                onClick={handleTitleClick}
              >
                {currentStage === 'FRONT_CAPTURE' ? 'Face Forward.' : 'Turn Sideways.'}
              </h2>
              <p className="text-gray-400 font-light mb-8 text-center text-lg">
                Relax your arms. We'll take care of the rest.
              </p>

              {/* Camera Frame Viewfinder */}
              <motion.div 
                className="relative w-full aspect-[3/4] rounded-[2rem] border border-white/20 bg-[#111] overflow-hidden"
              >
                {error ? (
                  <div className="absolute inset-0 flex items-center justify-center p-8 text-center text-red-400">
                    {error}
                  </div>
                ) : (
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                )}

                <CameraDebugOverlay
                  pose={pose}
                  quality={quality}
                  readiness={readiness}
                  fps={fps}
                  width={videoWidth}
                  height={videoHeight}
                  enabled={isDebug}
                />
                
                {/* Grid Lines */}
                <div className="absolute inset-x-0 top-1/3 border-t border-white/10" />
                <div className="absolute inset-x-0 bottom-1/3 border-t border-white/10" />
                <div className="absolute inset-y-0 left-1/3 border-l border-white/10" />
                <div className="absolute inset-y-0 right-1/3 border-l border-white/10" />

                {/* Auto-capture indicator */}
                {readiness?.isReady && (
                  <div className="absolute inset-0 border-[6px] border-[#00FFCC] rounded-[2rem] transition-all duration-300 pointer-events-none" />
                )}

                {/* Live feedback pill */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 z-10 flex items-center gap-2 text-xs font-mono tracking-widest text-white whitespace-nowrap shadow-xl">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${readiness?.isReady ? 'bg-[#00FFCC]' : 'bg-orange-500'}`} />
                  {readiness?.feedback || 'Initializing...'}
                </div>
              </motion.div>

              {/* Hidden canvas for processing frames */}
              <canvas ref={offscreenCanvasRef} className="hidden" />
            </motion.div>
          )}

          {/* STAGE 7: VERIFICATION */}
          {currentStage === 'VERIFICATION' && (
            <motion.div 
              key="verification"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              className="flex flex-col items-center w-full max-w-2xl"
            >
              <h2 className="text-4xl font-black tracking-tighter mb-12 uppercase text-center">Looks Good?</h2>
              
              <div className="flex gap-6 w-full justify-center">
                <PremiumCard className="w-1/2 aspect-[3/4] bg-[#111] rounded-3xl border border-white/10 overflow-hidden relative">
                  {frontImage && <Image src={frontImage} alt="Front" fill className="object-cover opacity-80" />}
                  <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs font-mono text-[#00FFCC] tracking-widest backdrop-blur-sm z-10">
                    Quality: {frontQualityScore}%
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-mono text-white uppercase tracking-widest backdrop-blur-sm z-10">Front</div>
                </PremiumCard>
                <PremiumCard className="w-1/2 aspect-[3/4] bg-[#111] rounded-3xl border border-white/10 overflow-hidden relative">
                  {sideImage && <Image src={sideImage} alt="Side" fill className="object-cover opacity-80" />}
                  <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full text-xs font-mono text-[#00FFCC] tracking-widest backdrop-blur-sm z-10">
                    Quality: {sideQualityScore}%
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1 rounded-full text-xs font-mono text-white uppercase tracking-widest backdrop-blur-sm z-10">Side</div>
                </PremiumCard>
              </div>

              <div className="flex gap-4 mt-12 w-full max-w-md">
                <div className="flex-1">
                  <MotionButton 
                    onClick={() => {
                      setFrontImage(null);
                      setSideImage(null);
                      setStageIndex(STAGES.indexOf('FRONT_CAPTURE'));
                    }}
                    variant="ghost"
                    className="w-full py-5 font-black uppercase tracking-widest rounded-full"
                  >
                    Retake
                  </MotionButton>
                </div>
                <div className="flex-1">
                  <MotionButton 
                    onClick={nextStage}
                    className="w-full py-5 font-black uppercase tracking-widest rounded-full"
                  >
                    Confirm
                  </MotionButton>
                </div>
              </div>
            </motion.div>
          )}

          {/* STAGE 8: AI ANALYSIS */}
          {currentStage === 'ANALYSIS' && (
            <motion.div 
              key="analysis"
              variants={slideVariants}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center w-full max-w-md text-center"
            >
              <div className="relative w-64 h-64 mb-16 flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ duration: Motion.duration.cinematic * 3.33, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-dashed border-[#00FFCC]/40"
                />
                <motion.div 
                  animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                  transition={{ duration: Motion.duration.cinematic * 5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border border-[#7000FF]/40"
                />
                <User className="w-24 h-24 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]" strokeWidth={1} />
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={analysisText}
                  variants={blurReveal}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: Motion.duration.normal, ease: Motion.ease.emphasized }}
                  className="text-xl font-light tracking-wide text-gray-300 h-16 flex items-center"
                >
                  {analysisText}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {/* STAGE 9: COMPLETION */}
          {currentStage === 'COMPLETION' && (
            <motion.div 
              key="completion"
              variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              className="flex flex-col items-center justify-center w-full max-w-md text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={Motion.ease.springSnappy}
                className="w-32 h-32 rounded-full bg-[#00FFCC]/20 flex items-center justify-center mb-12 border border-[#00FFCC]"
              >
                <Check className="w-12 h-12 text-[#00FFCC]" strokeWidth={3} />
              </motion.div>
              
              <HeroReveal className="mb-6">
                <h2 className="text-5xl font-black tracking-tighter uppercase text-center leading-none">
                  YOUR FIT PROFILE <br/> <span className="text-[#00FFCC]">IS READY.</span>
                </h2>
              </HeroReveal>

              <div className="mt-12 w-full">
                <MotionButton 
                  onClick={() => {
                    trackEvent('scan_completed');
                    router.push('/discover');
                  }}
                  className="w-full py-5 font-black uppercase tracking-widest rounded-full flex items-center justify-center gap-4 group"
                >
                  Enter CartSync 
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </MotionButton>
              </div>
              {currentStage === 'COMPLETION' && (
                <FeedbackPrompt 
                  id="scan_ease" 
                  question="Did the measurement process feel easy?" 
                  options={['Very easy, effortless', 'Okay, but took some tries', 'Confusing', 'Frustrating']} 
                />
              )}
            </motion.div>
          )}
          
        </AnimatePresence>
      </main>
      
      {/* Footer spacer for balance */}
      <div className="h-24"></div>
    </div>
  );
}
